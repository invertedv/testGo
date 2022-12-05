### Data Build

goMortgage will build the model/validate/assess ClickHouse table(s).  As set up in the 
[examples]({{ site.baseurl }}/examples.html), these
all reside in the same table but this is not required.

goMortgage is designed to be flexible in building datasets. However, there *is* a structure to the approach.
goMortgage will pull stratified and simple random samples from the source loan-level database.

In its current version, goMortgage is set up to work with the [fannie]() and [freddie]() data built by the
apps linked to. These tables have specific characteristics leveraged by goMortgage:

- There is a single table for the data in which each row is a unique loan.  The loan's time series
performance is a nested table.
- The tables created by these packages include an integer field "bucket",
  which takes on values 0,..,19. It is a hash of
  the loan number. Since it is a hash of the loan number, a given loan will always be assigned to the
  same bucket. The bucket field is used to assign loans to the model/validation/assess datasets.

The goal has been to make it modifiable to other data sources.

#### Terminology

The terminology used here is:

    as-of date:  The date at which we have actual information and start the forecast from.  Fields that are derived
      from this date start with 'ao'.
    target date. The calendar month at the forecast month.

The feature set comes from data at the as-of date which is used to forecast the target, which is at the
target date.  The exception is that one may incorporate features that are forward-looking, such as the
value of the property at the target date. During the model build, the actual values are used. When a
forecast is built, a scenario for the future of house prices is substituted.

#### Sampling the Loan-level Data

Conceptually, one can imagine the data to be sampled as the set of all pairs of the form

       (as-of date, target date), where target date > as-of date

It is not practical to create this table, so another strategy must be employed. goMortgage 
samples in two stages: 

1. Pass 1: pull a sample of loans that selects the as-of date. This table fixes the as-of date 
but all possible values of target date are available for sampling.  You specify the fields you might
wish to stratify on here (including just using a simple random sample).
2. Pass 2: sample the Pass 1 data set to select the target date.  Similarly, you specify the fields to
stratify on.

Note that using this approach, a loan may appear more than once. It avoids length-biased sampling,
however.

A simple random sample on Pass 1 is likely to produce a data set that is skewed with respect to many
of the features. You may wish to specify strata at this stage such as as-of date, state, etc.

Similarly, you may wish to stratify on other fields at the target date. If a discrete target is especially 
sparse in some of its levels, you may stratify on that.  If you do, do not stratify on anything else at
Pass 2.  The model can be de-biased using the biasCorrect key.

There is a third stage to the data build. This joins the sampled loans to other (*e.g.* non-loan) 
data.  The table is joined by geo (e.g. zip3, state, zip) at four time periods:

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

### Examples

Examples may be found [here]({{ site.baseurl }}/examples.html).
