---
layout: default
title: buildData
nav_order: 3
---

## Data Build
{: .no_toc }

{: .fs-6 .fw-300 }

### Table of Contents
{: .no_toc .text-delta }

1. TOC
{:toc}
---

[gom entries]({{ site.baseurl }}/gomFile.html#builddata-keys)

goMortgage will build the model/validate/assess ClickHouse table(s).  In the 
[examples]({{ site.baseurl }}/examples.html), these
all reside in the same table but this is not required.

goMortgage is designed to be flexible in building datasets. However, there *is* a structure to the approach.
goMortgage will pull stratified and simple random samples from the source 
loan-level database and join the result to non-loan data.

goMortgage comes set up to work with the
<a href="https://pkg.go.dev/github.com/invertedv/fannie" target="_blank" rel="noopener noreferrer" >fannie</a>
and <a href="https://pkg.go.dev/github.com/invertedv/freddie" target="_blank" rel="noopener noreferrer" >freddie</a>
data built by the
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

### Sampling the Loan-level Data: No Window
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

To be clear, the performance metric in this framework is the metric for a single month -- the target date.

### Sampling the Loan-level Data: With Window
{: .fw-700 }

There is a second mode of sampling, with windowing, which differs in the Pass 2 step from no-windowing.
Sampling with window is invoked by including the "window" key in your .gom file.

The "window" key specifies an observation window after the as-of date.  If this key is included,
then the performance for a loan is measured over all the months in the window.  Suppose you are modeling
prepays and you specify

      window: 24

Then the target field, "targetPp" is 1 if the loan prepays during the 24 months after the as-of date.
Also, in this case, goMortgage will not use an as-of date that is within 24 months of the maximum date in the
loan-level table.

The target date is set to the end of the window.


**Window vs. No-Window**

Think about the difference in the datasets built:

1. No Window. The performance data is a date (target date) some number of months after the as-of date. The state of
the loan is measured that the target date.  Of course, to do this, the loan has to exist at the target date.
2. Window. The performance data is measured over a period of months immediately following the as-of date. The performance
of the loan is measured as the event happening any time in the window.  The loan need not exist for the entire
window, though it is important that it could exist during the entirety of the window.

In the No Window scenario, the data is set up to build a conditional softmax model.  Such a model measures the
probability the loan will be in the states of interest month-over-month into the future.
The condition is that it exist at the beginning of the month being forecast (performance is measured at the end
of the month).

In the window scenario, the data is set up to build a softmax score, in the vein of, say, FICO.  The target in
this case is binary with a 1 meaning the event of interest happened somewhere in the window.
The model will be estimating the probability that this event occurs.

### Fields
{: .fw-700 }

The fields available in goMortage include most of the static fields in the loan-level data, select fields
from the non-loan data and calculated fields.  These last two are detailed below.

#### Nominclature
{: .fs-2 .fw-700 }

The following nominclature has been adopted for fields built by goMortgage:

- Time-varying fields at the first-pay date are prefixed by "org"
- Time-varying fields at the as-of date are prefixed by "ao".
- Time-varying fields at the target date are prefixed by "trg".
- Time-varying fields at Jan. 2020 are prefixed by "y20"
- Fields that serve as the target of models are prefixed by "target"

The last is not hard and fast, since goMortage doesn't care but is helpful when looking at fields.

#### Targets
{: .fs-2 .fw-700 }

Targets are those fields designed to be the targets of models. Targets differ for Window and No-Window
sampling:

- Window
    - targetPp.  1 if the loan prepays in the window.
    - targetDefault. 1 if the loan defaults in the window.
    - targetDq120. 1 if the loan hits 4+ months DQ in the window.
    - targetMod. 1 if the loan is modified in the window.

- No-window
    - targetDq. The DQ level (capped at 12 months) at the target date.
    - targetDeath. 1 if the loan defaults or prepays at the target date.
    - targetStatus. At the target month:
        - 14 if the loan defaults
        - 13 if the loan prepays
        - 12 if the loan is 12+ months delinquent
        - DQ if the loan is DQ months delinquent, DQ = 1,..,12
        - 0 if the loan is current
    - targetMod. 1 if the loan is modified at -- or prior to -- the target date.
    - targetNetPro. Net proceeds from sale of the house divided by the value of the home at the target date.

#### Time-varying fields
{: .fs-2 .fw-700 }

These fields are populated for all time periods:
 
- Hpi. FHFA zip 3 house price index. 
- UnempRate. BLS unemployment rate (MSA)
- LbrForce. Labor force size (MSA)
- MortFix30. 30-year fixed rate
- MortFix15. 15-year fixed rate
- Treas10. 10 year treasury.
- Income50. median income estimated from IRS data (zip). Also Income10, Income25, Income75 and Income90.
- PropVal. Estimated updated property value.
 
These are also found at select time periods:
- aoEltv. Estimated LTV at as-of date (based on amorized balance and updated property value)
- trgEltv. Estimated LTV at target date (based on amorized balance and updated property value)
- trgPti50. From IRS data, payment to estimated median income
- trgRefiIncentive. Refi incentive calculated as the annual savings in payments if refi at the prevailing
conforming rate (same term as current loan)
- newPayment. New payment at prevailing conforming rate (same term as current loan) at target date.
- trgDqMax. Potential DQ if no payments were made after the as-of date, capped at 12.
- trgLbrGrowth. Percent change in labor force from first-pay date to target date (annualized)
- trgdHpi. Percent change in HPI between origination date and target date.
- trgFcTime. The ratio of trgDqMax to trgFCDays, capped at 1.5.
- orgSpread. Difference between the note rate and the conforming rate (same term) at the first-pay date.
- trgdHpi. change (as a rate) of HPI from first-pay date to target date.
- trgUpbExp. Expected balance at target date found by amortizing balance at as-of date by fcstMonth months

#### Static fields
{: .fs-2 .fw-700 }

Below are static fields calculated by goMortgage
 
- trgFcType(1). Foreclosure type ("Judicial", "Non-Judicial")
- trgFcDays(1). Fannie Mae guideline for foreclosure, in days.
 
(1) These are prefixed "trg" even though they are static. Potentially trgFCDays could be made to change
over time.

#### Data Types
goMortgage supports the following data types:

- Int32/Int64
- Float32/Float64
- string/FixedString
- Date

