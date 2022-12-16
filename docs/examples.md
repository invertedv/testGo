---
layout: default
title: Examples
nav_order: 10
---

## Examples
{: .no_toc }

{: .fs-6 .fw-300 }

### Table of Contents
{: .no_toc .text-delta }

1. TOC
{:toc}
---

### DQ Model
{: .fw-700 }

The
<a href="https://github.com/invertedv/goMortgage/blob/master/scripts/dq.gom" target="_blank" rel="noopener noreferrer" >dq</a>
model example is used in the Tutorial. 

### All-In Model with Stratified Target
{: .fw-700 }

The 
<a href="https://github.com/invertedv/goMortgage/blob/master/scripts/allInEven.gom" target="_blank" rel="noopener noreferrer" >all-in</a>
model 
is a conditional softmax model. By "all-in", I mean that the target includes all possible states
of the loan. The states at the target date are:

        - 14 if the loan defaults
        - 13 if the loan prepays
        - 12 if the loan is 12+ months delinquent
        - DQ if the loan is DQ months delinquent, DQ = 1,..,12
        - 0 if the loan is current

You'll recognize this as the "targetStatus" field from the 
[buildData]({{ site.baseurl }}/buildData.html#targets) page.

On a monthly basis, some of these states are quite rare -- especially default. In a data set of 
3MM loans, there may be only ~10,000 defaults. goMortage will fit a model, though you may
need to use l2Reg. The example here, though, stratifies on the target at Pass 2. 

If you've worked through the tutorial, you'll notice a strong overlap with the DQ model.
That's a feature of goMortgage - building different models requires only small changes to the .gom file.
Note the line

      graphs: graphsEven

changes the graphs directory from the default "graphs" to "graphsEven". 

To use this model for forecasting, it needs to be de-biased.  This
<a href="https://github.com/invertedv/goMortgage/blob/master/scripts/allInEvenStrat.gom" target="_blank" rel="noopener noreferrer" >gom file</a>
will do the job.  It builds a new table that is not stratified on targetStatus and uses that
to re-estimate the bias coefficients of the output layer.
Note that the line

      graphs: graphsStrat

places the output in the "graphsStrat" directory.

### Prepay Score
{: .fw-700 }

The
<a href="https://github.com/invertedv/goMortgage/blob/master/scripts/prepayScore.gom" target="_blank" rel="noopener noreferrer" >prepay score</a>
estimates the probability a loan will prepay in the 24 months following the as-of date.
You can see that this is a score build by the line

      window: 24

The data is then structured for a score build, with the approprate 
[targets]({{ site.baseurl }}/buildData.html#targets) available.
Apart from this, the .gom file is indistinguishable from that for a conditional softmax.

### Net Proceeds Model
{: .fw-700 }

The prior examples were all softmax outputs. 
The <a href="https://github.com/invertedv/goMortgage/blob/master/scripts/netPro.gom" target="_blank" rel="noopener noreferrer" >net proceeds</a>
model is a regression model. 
The target is "targetNetPro" - the ratio of net proceeds from the sale of the house to the house
value at the target date.  The target date is the date of default.

goMortgage knows this is a regression model by the line

      target: cts

In this case, we want loans when they default.  This is accomplished by:

       where1: mon.zb IN ('03', '09')
       where2:  fcstMonth=0

The data will consist of loans when they default. It short-circuits the as-of date/target date paradigm.

### Out-of-Time Period Analyses
{: .fw-700 }

It is easy to conduct an out-of-time period analysis.  Suppose you want to assess a model built on data from
before 2007 on data 2007 and after. All you need do is adjust the model/validate/assess queries.  For the DQ
model, these would be:

      modelQuery: SELECT %s FROM tmp.modelDq WHERE bucket < 10 AND year(trgDt) < 2007
      validateQuery: SELECT %s FROM tmp.modelDq WHERE bucket in (10,11,12,13,14) AND year(trgDt) < 2007
      assessQuery: SELECT %s FROM tmp.modelDq WHERE bucket in (15,16,17,18,19) AND year(trgDt) >= 2007


