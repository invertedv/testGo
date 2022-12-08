## goMortgage Tutorial

### Preparations

So, you want to build a mortgage model.  Where do you start?  Well, having some loan-level data
is a necessity.  I suggest you start with the 
[Fannie Mae](https://apps.pingone.com/4c2b23f9-52b1-4f8f-aa1f-1d477590770c/signon/?flowId=035b3c0e-38ab-4c4b-a81a-45fbde81ebe9)
data.  It's free and extensive, going back to January 2000.  There are two data sets: their "standard"
fixed-rate loans and a set of exclusions that includes ARMS and loans with non-standard underwriting.

There's an [app](https://pkg.go.dev/github.com/invertedv/fannie) designed to import this into 
ClickHouse **and** goMortgage is already set up to handle the table.

Even if your ultimate goal is to use goMortgage on different data, this is the easiest way to test
drive it.

There is one other table you'll need -- a table of non-loan data.  This table has fields for
house prices, unemployment, income, labor growth rates over time at a zip/zip3 level.
The [assemble]() package will produce the table you need.

### The .gom file

The .gom file controls the data and model building.
The file [dq.gom](https://github.com/invertedv/testGo/blob/master/scripts/dq.gom) builds 
a delinquency model.  This is a hazard model, or perhaps better termed, a conditional softmax
model.  The model estimates the probability the loan is in one of 13 delinquency states each month
of the forecast period. The forecast period is 180 months. The 13 delinquency states are:
current, 1 through 11 months delinquent and 12+ months delinquent. The condition of "conditional softmax"
is that (a) the loan exists at the beginning of the month and (b) it doesn't prepay/default that month.

Let's review the entries.

The lines:

    title: DQ model
    buildData: yes
    buildModel: yes

tell goMortgage to build the modeling dataset and then build the model.

The code below specifies the data build.

    // data settings
    mtgDb: mtg.fannie
    mtgFields: fannie
    strats1: state, aoDt, aoAge
    sampleSize1: 30000000
    strats2: fcstMonth, month, aoDqCap6
    sampleSize2: 3000000
    where1: AND aoAge >= 0 AND aoDq >= 0 AND aoDq <= 24 AND aoUpb > 10000 AND mon.zb='00'
    where2:  AND trgZb='00' AND fcstMonth > 0
    econDb: econGo.final
    econFields: zip3

The first two lines specify the source and type of the loan-level data.  The source is the
ClickHouse table mtg.fannie. goMortgage internally has a set of fields for each source it knows
about. 

The pass 1 sampling is along the fields state, aoDt (as-of date) and aoAge (loan age at as-of date).
goMortgage will do its best to stratify along these fields jointly, targeting an output data set of
30,000,000 rows.  Each row is a loan at a specified (state, aoDt, aoAge). Of course, state is fixed
for a loan and each loan has but one aoAge at a given aoDt. The where1 clause specifies which loans
are considered for the sample. The code essentially restricts the selection to loans that are
active and less than 25 months delinquent.

The pass 1 sample is a compact representation.  What we're sampling in pass 2 is each loan in pass 1
at every possible subsequent month (to determine the target month). The code above directs the pass 2
sample to stratify along fcstMonth, month, aoDqCap6.  aoDqCap6 is the as-of delinquency capped at
6 months (values greater than 6 are set to 6), targeting a sample size of 3,000,000. The where2 clause
restricts the candidate set to dates that are after the as-of date and which are still active.

Note: you can specify the stratification field as 'noGroups' if you want a simple random sample.

Finally, the 'econ' entries specify the ClickHouse table with economic data and the field to join on.
The most granular geo field in the Fannie data is the 3-digit zip.

The section below controls the model build.

    // model settings
    target: targetDq
    targetType: cat
    cat: purpose, propType, occ, amType, standard, nsDoc, nsUw, coBorr, hasSecond, aoPrior30, aoPrior60, aoPrior90p, harp, aoMod, aoBap, channel, covid, fcType, pPen36
    cts: fico, trgAge, term, y20PropVal, units, dti, trgUnempRate, trgEltv, aoMonthsCur, trgPti50, trgRefiIncentive, lbrGrowth, spread, pMod
    emb:  aoDq: 5, state: 4, servMapped: 4, fcstMonth: 2
    layer1: FC(size:40, activation:relu)
    layer2: FC(size:20, activation:relu) 
    layer3: FC(size:10, activation:relu) 
    layer4: FC(size:13, activation:softmax) 
    batchSize: 5000 
    epochs: 2000 
    earlyStopping: 40 
    learningRateStart: .0003 
    learningRateEnd: .0001 
    modelQuery: SELECT %s FROM %s WHERE bucket < 10 
    validateQuery: SELECT %s FROM %s WHERE bucket in (10,11,12,13,14) 
    assessQuery: SELECT %s FROM %s WHERE bucket in (15,16,17,18,19) 
    addlCats: targetAssist, aoMaxDq12, vintage, aoDqCap6, numBorr
    addlKeep: lnId, fcstMonth

The target of the model fit is the field 'targetDq'. This field is not in the fannie table but calculated
from the delinquency field -- capping that field at 12. The target type is 'cat' since we want to
estimate the probability of a loan being at each delinquency level.

The 'cat' entry lists the one-hot features in the model. The 'cts' entry lists the continuous fields.
Note: goMortgage will normalize these.  The 'emb' entry lists the embedded features.  Each feature name
is followed by the embedding dimension.

The 'layer<n>' entries specify the model.  Layer1 has 40 output nodes and relu activation.
Layer4 is the output layer.  Since we're capping delinquency at 12 months, it has 13 nodes and
the softmax activation.

'batchSize' and 'epochs' set what you think they do.  The 'earlyStopping: 40' ends the fit if the
cross entropy calculated on the validation data fails to decline for 40 epochs.
The learning rate entries specify the learning rate at the first and last (2000, in this case) 
epoch.  The learning rate declines linearly.

goMortgage consumes 3 data sets:

- model.  This is the data used to fit the model coefficients.
- validation. This is the data used to determine early stopping.
- assessment. This is the data used to assess the model after it is fit.

The 'modelQuery', 'validateQuery' and 'assessQuery' entries specify the SQL to pull these tables.

A feature of the fannie [app](https://pkg.go.dev/github.com/invertedv/fannie) is that it creates
a field 'bucket' that assigns each loan an integer value 0 through 19. This value is sticky --
a loan will always get the same value. Further, it is uncorrelated with other fields.

Finally, the queries have two placeholder '%s' fields.  goMortgage replaces the first with the fields
needed for the analysis.  The second will be replaced with the table name (output of the data creation).

The last two entries, 'addlCats' and 'addlKeep', keep additional fields that have not yet been specified.
'addlCats' keep fields are internally created as one-hot fields.  This can be necessary if you
want to treat the field as categorical for assessment, or if you have an input model that uses this
field as a one-hot field.  The 'addlKeep' fields are kept as-is.  You may wish to keep fields for
output to the SaveTable.

These statements specify locations:

    // output locations
    outDir: /home/will/goMortgage/dq
    pass1Strat: tmp.stratDq1
    pass1Sample: tmp.sampleDq1
    pass2Strat: tmp.stratDq2
    pass2Sample: tmp.sampleDq2
    modelTable: tmp.modelDq

All the non-ClickHouse output will be sent to '/home/will/goMortgage/dq'.  The pass 1 stratifications
are in the ClickHouse table tmp.stratDq1.  The pass 1 sample is in tmp.sampleDq1.  The final table
is tmp.modelDq.  The model, validate, assess queries pull from this table.

    // save Assess Data + model output
    saveTable: tmp.outDq
    saveTableTargets: d120:4,5,6,7,8,9,10,11,12; d30:1; current:0

You can save the assess data, augmented with the model output, back to ClickHouse.  The 'saveTableTargets'
give the field name followed by the columns of the softmax to sum to create it.  Here, we're saving the
dq 120+ probability as 'd120' and the probability the loan is current as 'current'.

You can use the output of other models as input to this model.  The model below is the probability at
loan will be modified at the target month.  goMortgage will automatically run this model to produce
the values for the 3 data sets. The new field will be called 'pMod' in this model build -- note that
it is listed in the 'cts' entry.  Note, too, that goMortgage actually uses the log odds of this value.

    // existing models that are inputs
    inputModel: Mod
    locationMod: /home/will/goMortgage/mod/
    targetsMod: pMod:1

One wrinkle is that the inputs to this model need to be normalized by the values used when the model was
built, which are likely not the same as the current data.  When goMortgage builds a model, along with the
model specification and coefficients, it saves the normalization values (cts features) and known levels
(cat and emb features). It will use these values when calculating the inputModel values.

    // assessment
    assessAddl: aoIncome50, aoEItb50,  trgPti10, trgPti90, ltv, aoMaxDq12, trgUpbExp, state, aoIncome90, msaLoc, aoPropVal, trgPropVal, vintage

goMortgage will automatically run the assessment on features in the model.  You may wish to run it on
additional fields.  These are supplied in the 'assessAddl' key.

The entries below specify an assessment.  The name is 'D120+'. Note that each entry ends in 'aoDq'.
This value is just a key so these specs get grouped together.  The assessment is conducted on the
sum of the columns 4 through 12 of the softmax output.  The assessment is sliced on the field aoDqCap6.
That is, it will be done separately for each of the aoDqCap6 values (0 through 6).

    assessNameaoDq: D120+
    assessTargetaoDq: 4,5,6,7,8,9,10,11,12
    assessSliceraoDq: aoDqCap6

Here's another entry that slices by the field occ.

    assessNameOcc: D120+
    assessTargetOcc: 4,5,6,7,8,9,10,11,12
    assessSlicerOcc: occ

Note: specify 'noGroups' as the slicer if you don't want to slice by anything.

For a categorical target, goMortgage will produce [KS]() and [Decile]() plots, overall and for each
level of the slicer.  Further, it will produce [Segment]() plots for each feature in the model and
each field specified in 'assessAddl'.  For each feature in the model, goMortgage will also construct
[marginal]() plots.

Another form of assessment are curves. These will plot the model output and actual value averaged
by the given field.  Below, the D120+ values are averaged over the target year/quarter (trgYrQtr
is a field in the table created by goMortgage). 

    // curves
    curvesNameyrQtrD120: Target Quarter, D120+
    curvesTargetyrQtrD120: 4,5,6,7,8,9,10,11,12
    curvesSliceryrQtrD120: trgYrQtr
As before, each key has appended a key 'yrQtrD120' so that goMortgage knows these go together.
Here's another entry:

    curvesNamevintageD120: Vintage, D120+
    curvesTargetvintageD120: 4,5,6,7,8,9,10,11,12
    curvesSlicervintageD120: vintage

Which plots the averages by each origination vintage.

Finally, there are a couple of general settings:

    // general
    show: no
    plotHeight: 1200
    plotWidth: 1600

If 'show' is set to 'yes', then each graph will also be displayed in your browser.  This is usually
a lot of graphs!  'plotHeight' and 'plotWidth' specify the plot dimensions, in pixels. The graphs
are also written to files. The directory structure is [here]({{ site.baseurl }}/directoryStructure.html)

### Output

