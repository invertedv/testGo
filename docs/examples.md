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
[dq](https://github.com/invertedv/goMortgage/blob/master/scripts/dq.gom)
example is used in the Tutorial. 

### All-In Model with Stratified Target
{: .fw-700 }

The [All-in](https://github.com/invertedv/goMortgage/blob/master/scripts/allInEven.gom) model 
is a conditional softmax model. By "all-in", I mean that the target includes all possible states
of the loan. The states at the target date are:

        - 14 if the loan defaults
        - 13 if the loan prepays
        - 12 if the loan is 12+ months delinquent
        - DQ if the loan is DQ months delinquent, DQ = 1,..,12
        - 0 if the loan is current

You'll recognize this as the "targetStatus" field from the 
[buildData](https://invertedv.github.io/testGo/buildData.html#targets) page.

On a monthly basis, some of these states are quite rare -- especially default. In a data set of 
3MM loans, there may be only ~10,000 defaults. goMortage will fit a model, though you may
need to use l2Reg. The example here, though, stratifies on the target at Pass 2. 

If you've worked through the tutorial, you'll notice a strong overlap with the DQ model.
That's a feature of goMortgage - building different models requires only small changes to the .gom file.
Note the line

      graphs: graphsEven

changes the graphs directory from the default "graphs" to "graphsEven". 

To use this model for forecasting, it needs to be de-biased.  This 
[script](https://github.com/invertedv/goMortgage/blob/master/scripts/allInEvenStrat.gom)
will do the job.  It builds a new table that is not stratified on targetStatus and uses that
to re-estimate the bias coefficients of the output layer.
Note that the line

      graphs: graphsStrat

places the output in the "graphsStrat" directory.

### Prepay Score
{: .fw-700 }

The [prepay](https://github.com/invertedv/goMortgage/blob/master/scripts/prepayScore.gom) score
estimates the probability a loan will prepay in the 24 months following the as-of date.
You can see that this is a score build by the line

      window: 24

The data is then structured for a score build, with the approprate 
[targets]((https://invertedv.github.io/testGo/buildData.html#targets)) available.
Apart from this, the .gom file is indistinguishable from that for a conditional softmax.

### Net Proceeds Model
{: .fw-700 }

The prior examples were all softmax outputs. 
The [net proceeds](https://github.com/invertedv/goMortgage/blob/master/scripts/netPro.gom) model
is a regression model. 
The target is "targetNetPro" - the ratio of net proceeds from the sale of the house to the house
value at the target date.  The target date is the date of default.

goMortgage knows this is a regression model by the line

      target: cts


