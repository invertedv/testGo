---
layout: default
title: biasCorrect
nav_order: 6
---

## Bias Correcting

[gom entries]({{ site.baseurl }}/gomFile.html#biascorrect-keys)

If you stratify on a categorical target in Pass 2, the results will certainly be off
when applied to unstratified data. goMortgage can adjust the bias term of the output
layer so that, on average, the output matches a reference dataset.

More specifically, the user supplies a table (via the biasQuery: key) to use in the
bias correction.  goMortgage will run the model against this dataset, adjusting the 
bias term of the output layer so that the average probability of each output
level matches the average actual value in the table.

