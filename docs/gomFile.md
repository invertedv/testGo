## The Specifications File (.gom)
The specificaton (.gom) file instructs goMortgage what to do. There are examples in the scripts directory.

The format for entries is:

     <key>:<value>

Comments start with a double forward slash (//).

### Required keys

There are three basic keys that drive the process.  These are:

- outDir: \<path\><br>
Is the full path to the directory to place all the output of the run. If buildData
or buildModel are "yes", this directory is created or emptied.  If not, the directory
must exist and the output of this run is added to the existing directory. 
- modelTable: \<ClickHouse table\><br>Is the table that has the model/validate/assess
data.

There are four keys the set the primary steps conducted.

- buildData: \<yes/no\><br>If yes, build the model/validate/assess ClickHouse table.
  The default value is "no" if the key is omitted.
- buildModel: \<yes/no\><br>If yes, fit the model.
  The default value is "no" if the key is omitted.
- assessModel: \<yes/no\><br>If yes, assess the model fit.
  The default value is "no" if the key is omitted.
- biasCorrect: \<yes/no\><br>If yes, correct the bias in a model that was fit
to data that was stratified on the target field.
  The default value is "no" if the key is omitted.

Within each of these, additional key/vals are required. 

### buildData Keys
Building the data is a three-pass process.  See [Data Build]() for more details. 
The keys below are required for building data.

- strats1: \<field list\><br>
These are the fields to stratify on for the first pass (which selects loans and as-of dates).
- sampleSize1: \<int\><br>
The target sample size for pass 1;
- where1: \<clause\><br>
a "where" clause to restrict the selection.
- pass1Strat: \<table name\><br>
is the name of ClickHouse table to create with the stratification summary.
- pass1Sample: \<table name\><br>
is the name of the ClickHouse table to create with the sampled loans.
<br><br>
- strats2: \<field list\><br>
is a comma-separated list of the fields to stratify on for the second pass (which selects loans and as-of dates).
- sampleSize2: \<int\><br>
is the target sample size for pass 2;
- where2: \<clause\><br>
is a "where" clause to restrict the selection.
- pass2Strat: \<table name\><br>
is the name of ClickHouse table to create with the stratification summary.
- pass2Sample: \<table name\><br>
is the name of the ClickHouse table to create with the sampled loans.
<br><br>
- mtgDb: \<table name\><br>
is the ClickHouse table that has the loan-level detail.
- mtgFields: \<name\><br>
The value here is a keyword.  Currently, valid values are "fannie" and "freddie". These refer to values specified
within goMortgage.  This is how goMortgage knows what fields to expect in the table.
See 'Adding Sources' for details on adding a source.
- econDb:\<table name\><br>
is the ClickHouse table that has the economic data.
- econFields: \<field\><br>
is the geo field that is the join field between the mortgage data and the economic data (*e.g.* zip).
<br><br>
- modelTable: \<ClickHouse table\><br>
is the name of the ClickHouse table to create with the modeling sample.

***Notes***<br>
You can stratify on any field, including the target field. However, not all fields
are available at the first pass -- essentially only fields that are available at
the as-of date. If you stratify on the target field in pass2, you should **not** 
specify any other fields.

Building the data will (re)create the output directory.  A
nything in the directory will be lost.

### buildModel Keys

The following keys control the model build.

- target: \<field name\><br>
is the field that is the target (dependent variable).
- targetType: \<cat\>/\<cts\><br>
is the type of the target feature.
- cat: \<field list\><br>
is a comma-separated list of categorical (one-hot) features.
- cts: \<field list\><br>
is a comma-separated list of continuous features.
- emb: \<field list\><br>
is a comma-separated list of embedding features.  Each entry is also a key/val 
pair of the name of the feature
followed by the embedding dimension (field:dim).

A model need not have all three of cat, cts, and emb, but it must have at least one.

- layer<n> : \<layer specification\><br>
The model layers are numbered starting with 1.  The specification of the layer follows that used by the
[seafan](https://pkg.go.dev/github.com/invertedv/seafan) package.  For instance, if the first layer
after the inputs is a fully connected layer with a RELU activation and 10 outputs is specified by

      layer1: FC(10, activation=relu)
- epochs: \<int\><br>
is the maximum number of epochs to run through.
- batchsize: \<int\><br>
is the batch size for the model build optimizer.
- earlyStopping: \<int\><br>
If the cost function evaluated on the validation data doesn't decline for 'earlyStopping' epochs, the fit is
terminated.
- learningRateStart: \<float\><br>
is the learning rate for epoch 1.
- learningRateStart: \<float\><br>
is the learning rate at \<epochs\>. 

      The learning rate declines linearly from learningRateStart at epoch 1 to learningRateEnd at epoch 'epochs'.
- modelQuery: \<query\><br>
is the query to pull the model-build data from 'modelTable'.
- validateQuery: \<query\><br>
is the query to pull the validation data from 'modelTable'.  The validation data is used only for determining
early stopping.

      The queries have two place holders "%s".  goMortgage replaces the first %s with a list of the needed fields
      and the second with 'modelTable'.
The queries could be the same, but the idea is to pull disjoint sets of data for estimating and evaluating the
model.

Input models are models previously created by goMortgage that are features in the model being built
in the current run. They are specified using this syntax:
- inputModel: \<name\>
- location\<name\>: \<path\><br>Path to the directory containing the model.
- targets\<name\>: \<name1\>{target list 1}; \<name2\>{target list 2}<br>
The format is the same as saveTableTargets.

- startFrom: \<path\><br>
  startFrom points to a directory containing a model with the same structure being fit.  The fit will start
  at the parameter values in the existing file.
<br><br>
Additional keys:
- model: \<subdir\><br>Is the subdirectory name within \<outDir\> to place the fitted model.  The value
defaults to "model" if the key is not specified.

***Notes***<br>
Building the data will (re)create the output directory.  A
nything in the directory will be lost.

### assessModel Keys
#### Assessment by Feature
Softmax outputs are coalesced into binary outputs for assessment.  The user specifies
one or more columns of the output to group into the "1" value.
- assessQuery: \<query\><br>
  is the query to pull the assessment data from 'modelTable'.  The assessment data is used only for post-model-build
  assessment of the model fit.

      The queries have two place holders "%s".  goMortgage replaces the first %s with a list of the needed fields
      and the second with 'modelTable'.
- graphs: \<sub dir\><br>
  Is the optional name of the directory within \<outDir\> to place the graphs,  If you do not specifiy this,
  "graphs" will be used.
- Three keys to specify an assessment are required. Any number of assessments may 
be specified.
    - assessName\<name\>: \<title\><br>Is the title that will appear in graphs.
    - assessTarget\<name\>: \<ints\><br>Is a list of the columns of the model output
  to coalesce into the assessment target.
    - assessSlicer\<name\>: \<field\><br>

If you not wish to segment the analysis on a field, specify the field as "noGroups" in assessTarget.
<br><br> 
- assessAddl: \<field list\><br>
is a comma-separated list of fields.  The assessment is always run on all features in the model. 
The assessment is also run on the fields in this list.

- Saving the assessment data<br>
  You can, optionally, save the data used for the assessment along with model outputs back to ClickHouse.
  There are two keys required to do this.
    - saveTable: \<table name\><br>is the ClickHouse table to save the assess data to.
    - saveTableTargets: \<name1\>{target list 1}; \<name2\>{target list 2}<br>
      The 'name' is the name of the field in the output field.  The target list is a list of comma-separated
      columns of the model output to sum to create the field.  For instances, if the model is a softmax with
      5 output columns, then

          first: 0; last2: 3,4

      will create a field called 'first' in the output table that is the first level of the targe
      and another field called "last2" in the output table that is the sum of the probabilities of the target being
      its last 2 values.  If the target is continuous, then only column 0 is available.

Optional assessment keys:

- addlKeep: \<field list\><br>
  is an optional comma-separated list of additional fields to include in the 'saveTable'.  For instance, loan number.
- addlCats: \<field list\><br>
  is an optional comma-separated list of fields to treat as categorical. 
If you wish to include a field in "addlAssess" as a one-hot feature, include it in
this statement.

#### Assessment by Curve

- curvesName\<name\>: \<title\><br>Title for graphs.
- curvesTarget\<name\>: \<ints\>
- curvesSlicer\<name\>: \<field\>

***Notes***<br>
You can run the assessment standalone on an existing model. When run in this mode,
goMortgage will look into the model to determine the features to use in the assessment.
You could also use this feature to assess the model against a new dataset, perhaps
from a new source. If you wanted the results in its own directory, you need only create
this directory and copy over the "model" subdirectory.

### biasCorrect Keys

If you build a model stratified on the target field, the "bias" term of the output
layer will (ironically) be biased.  goMortgage can de-bias this term.  You must
specify a "modelQuery" that returns data that is **not** stratified on the target
field.  goMortgage will use this data to refit the bias terms of the output layer.

- biasDir: \<sub dir\><br>Is the subdirectory within "outDir" to place the
bias-corrected model.


### Optional
- title: \<title\><br>
  is a title for the run, appearing in graphs, etc.
- show: \<yes\>, \<no\>.<br>
if yes, then all graphs are also sent directly to the browser.
- plotHeight: \<int\><br>
is the plot height, in pixels.
- plotWidth: \<int\><br>
is the plot width, in pixels.

### Examples

See [here]({{ site.baseurl }}/examples.html) for examples.
