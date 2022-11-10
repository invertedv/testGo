### Data

#### Sampling

In sampling data for this kind of model, there are two key points in time.

- The as-of age.  This is the loan age from which we are forecasting.  We know the status of the loan at this point.
- The forecast month.  This is number of months into the future we are forecasting the loan's status.

Conceptually, one can imagine the data to be sampled as the set of all pairs of the form

       (as-of age, forecast month)

It is not practical to create this table, so another strategy must be employed. goMortgage does the selection in two
stages: the first stage builds a sample of loans based on as-of age. This table fixes the as-of age but all possible values
of forecast month are not yet selected. Stage 2 starts with this sample and samples it based on forecast month.

Conceptually, there are at least three ways to choose the as-of age (or forecast month) of a loan.

1. Select at most one as-of age and forecast month for each loan.<br>
The potential advantage here is that a loan will appear with at most once, so we
needn't think about issues of correlation (as if loans weren't cross-correlated!).  However, care must
be taken in the sampling to prevent length-biased sampling as would result if one randomly chose an age from the
loan's history.
2. Create a table that has one row for each loan for each month it is on the books then randomly sample this table. Then
create a second table that has all possible forecast months from the age of each sampled loan and sample this table<br>
This approach avoids length-biased sampling but will result in loans appearing more than once in the data.
3. Stratify the sample based on loan age and then forecast month.  This approach avoids length-biased sampling.  It also
evens out the sample on these dimensions which should provide more stable estimates of the effects.

goMortage uses method 3.

There are other considerations.  Stratifying on as-of age alone will likely lead to a sample that is very unevenly
distributed across the as-of date (the calendar date corresponding to the as-of age).  This is undesirable since
we'd like a good representation across time periods. With goMortgage, it's possible to stratify on *both* fields.

Simiarly, on the second stage sample one can specify both forecast month and 'month' (calendar month corresponding to
the forecast month).

Further, goMortgage can stratify along other dimensions.
For instance, to avoid building a model dominated by loans in California, one can stratify on state.
Or, you could build a California-only model using the WHERE1 key in the specs file.  Stratifying along
loan age and forecast month alone may produce a sample that is concentrated on certain vintages or performance
periods.

goMortgage does this sampling in two stages. The first stage generates a table of loans sampled to the
as-of date.  This table is then sampled to pick target dates.

There is a third stage to the data build. This joins the sampled loans to other (economic) data.  The table
is joined by geo (e.g. zip3, state, zip) at four time periods:

1. The origination date.
2. The as-of date.
3. The target date.
4. January 2020.

The utility of the first 3 is self-evident.  Why January 2020? So that we have a baseline to normalize
values so that the model isn't confused by trends in (say) house prices.

In short, this is the goMortgage process:

     1. Sample the loan-level data along a set of user-specified dimensions to produce a sample stratified
     along your choice of fields.  This dataset consists of loans and as-of dates.

     2. Sample the table above along a set of user-specified dimensions. The universe of available data is
     each loan in the sampled data at any date after the as-of date.

     3. Join the table in 2 to the economic data.


### .gom File Entries

These keys specify the data source and fields to use.

- mtgDb: {ClickHouse table}<br>is the source of the loan-level data. Example:

      mtgDb: mtg.fannie

- mtgFields: {source}<br>Is a key that specifies the source of the data.  goMortgage has built-in an understanding
of two sources - fannie and freddie. The fannie and freddie ClickHouse tables can be built using these
packages: [fannie](https://pkg.go.dev/github.com/invertedv/fannie) and 
[freddie](https://pkg.go.dev/github.com/invertedv/freddie).
Example:

      mtgFields: fannie

- econDb: {ClickHouse table}<br>is the source table for the economic data to be merged in stage 3. The table
needs to have an entry for each month and some geo-level. Example:

      econDb: econGo.final

- econFields: {source}<br>is a key that specifies the geo-based join field.  For Fannie/Freddie data the
most granular resolution is zip3. Example:

      econFields: zip3

These keys control the stage 1 sampling:

- strats1: {field list} <br>This key specifies the fields to stratify on in the first stage. Example:

       strats1: state, aoDt, aoAge

- sampleSize1: {int}<br>Specifies the target size of the sample generated by stage 1. Example:

        sampleSize1: 5000000
 
- where1: {WHERE clause}<br>Restricts the table while creating the sample. Example:

        where1: AND aoAge >= 0 AND aoDq >= 0 AND aoDq <= 24 AND aoUpb > 10000 AND mon.zb='00' AND aoMod='N' AND aoBap in ['N', '7', '9']

- pass1Strat: {ClickHouse table}<br>The pass1Strat key specifies a ClickHouse table to create which summarizes the
stratification process.  The table lists each level of the strats and counts. Example:

        pass1Strat: tmp.strat1Mod
 
- pass1Sample: {ClickHouse table}<br>Specifies a ClickHouse table to create which has the sampled loans. Example:

        pass1Sample: tmp.sample1Mod

The stage two keys are the same:

- strats2: {field list} <br>This key specifies the fields to stratify on in the second stage. Example:

      strats2: fcstMonth, month, aoDqCap6

- sampleSize2: {int}<br>Specifies the target size of the sample generated by stage 2. Example:

      sampleSize2: 2000000

- where2: {WHERE clause}<br>Restricts the table while creating the sample. Example:

      where2:  AND trgZb='00' AND fcstMonth > 0

- pass2Strat: {ClickHouse table}<br>The pass1Strat key specifies a ClickHouse table to create which summarizes the
  stratification process.  The table lists each level of the strats and counts. Example:

        pass2Strat: tmp.strat2Dq

- pass2Sample: {ClickHouse table}<br>Specifies a ClickHouse table to create which has the sampled loans. Example:

        pass2Sample: tmp.sample2Dq

The final table is specified by:

- modelTable: {ClickHouse table}<br>Example

      modelTable: tmp.modelDq

### Sample Files

There are example specs files (.gom) in the scripts directory on GitHub.  The DQ model forecasts delinquency.
Its data is constructed using the values in the examples above.
