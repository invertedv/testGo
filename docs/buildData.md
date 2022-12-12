---
layout: default
title: buildData
nav_order: 3
---

## Data Build

[gom entries]({{ {{ site.baseurl }}/gomFile.html#builddata-keys)

goMortgage will build the model/validate/assess ClickHouse table(s).  In the 
[examples]({{ site.baseurl }}/examples.html), these
all reside in the same table but this is not required.

goMortgage is designed to be flexible in building datasets. However, there *is* a structure to the approach.
goMortgage will pull stratified and simple random samples from the source 
loan-level database and join the result to non-loan data.

goMortgage comes set up to work with the [fannie](https://pkg.go.dev/github.com/invertedv/fannie) 
and [freddie](https://pkg.go.dev/github.com/invertedv/freddie) data built by the
apps linked to. These tables have specific characteristics leveraged by goMortgage:

- There is a single table for the data in which each row is a unique loan.  The loan's time series
performance is a nested table.
- The tables include an integer field "bucket",
  which takes on values 0,..,19. It is a hash of
  the loan number. Since it is a hash of the loan number, a given loan will always be assigned to the
  same bucket. The bucket field is used to assign loans to the model/validation/assess datasets.

You can modify goMortgage to work with other data sources,
see [Bring Your Own Data]({{ site.baseurl }}/BYOD.html).

### Terminology
{: .fw-700 }

The terminology used here is:

    as-of date:  The date at which we have actual information and start the forecast from.  
    Fields that are derived from this date start with 'ao'.

    target date. The calendar month at which we're forecasting the mortgage status.
    Fields that are derived from this date start with 'trg'.

The feature set comes from data at the as-of date which is used to forecast the performance
at the target date.  The exception is that one may incorporate features that are 
forward-looking, such as the
value of the property at the target date. During the model build, the actual values 
are used. When a
forecast is created, a scenario for the future values is substituted used. 
One could also nest the model within a simulation for these forward-looking features.

### Sampling the Loan-level Data
{: .fw-700 }

Conceptually, one can imagine the data to be sampled as the set of all pairs of the form

       (as-of date, target date), where target date > as-of date

It is not practical to create this table, so another strategy must be employed. goMortgage 
samples in two stages: 

1. Pass 1: pull a sample of loans that selects the as-of date. This table fixes the as-of date 
but all possible values of target date are available for sampling.  You specify the fields 
on which to stratify.
2. Pass 2: sample the Pass 1 data set to select the target date.  Again, you specify the fields 
on which to stratify.

In either Pass 1 or Pass 2, you may elect to randomly sample rather than stratify.

Note that using this approach, a loan may appear more than once. This avoids length-biased sampling,
however. What is length-biased sampling? If a sample is length biased, loans that have more 
observations are less likely to be in the data at an early age than loans that have few observations.
The effect is that one will underestimate the probability the loan stays on the books because there are
not enough examples of these.

A simple random sample on Pass 1 is likely to produce a data set that is skewed with respect to many
fields. You may wish to specify strata at this stage to correct that. 

Similarly, you may wish to stratify on other fields at the target date. If a discrete target is especially 
sparse in some of its levels, you may stratify on target.  If you do, do **not** stratify on anything else
at Pass 2.  Stratifying on the target will cause the model to be biased. It can be 
de-biased using the [biasCorrect]({{ site.baseurl }}/biasCorrect.html) key.

There is a third stage to the data build. This joins the sampled loans to other (*e.g.* non-loan
table) data.  The tables are joined by geo (e.g. zip3, state, zip) at four time periods:

1. The origination date.
2. The as-of date.
3. The target date.
4. January 2020.

At each of these dates, goMortgage adds calculated fields beyond those in the non-loan table. 
For instance, the property value at each date is calculated.

The utility of the first 3 is self-evident.  Why January 2020? So that we have a baseline to normalize
values so that the model isn't confused by trends in (say) house prices.

In short, this is the goMortgage process:

     Pass 1. Sample the loan-level data along a set of user-specified dimensions to produce a sample stratified
     along your choice of fields.  This dataset consists of loans and as-of dates. A given loan
     may appear at more than one as-of date.

     Pass 2. Sample the table above along a set of user-specified dimensions to determine the target date.
     The universe of available data is
     each loan in the sampled data at any date after the as-of date.

     Pass 3. Join the table in 2 to the non-loan data.

### Examples
{: .fw-700 }

Examples may be found [here]({{ site.baseurl }}/examples.html).
