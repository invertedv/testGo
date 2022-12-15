---
layout: default
title: assessModel
nav_order: 5
---

## Assessment
{: .no_toc }

{: .fs-6 .fw-300 }

### Table of Contents
{: .no_toc .text-delta }

1. TOC
{:toc}
---

[gom entries]({{ site.baseurl }}/gomFile.html#assessmodel-keys)

For models whose target is categorical, the assessment is based on a binary outcome.  If the
output has more than 2 outcomes, you specify which set of outcomes to coalesce into "1" with
the remainder becoming "0".  The assessments take a "slicer", which generates a
separate analysis for each level of the slicer. If you do not wish to slice the
assessment, specify "noGroups" as the slicer.  The slicer field must be a categorical field, but does not
have to be a feature in the model.

Any number of assessments may be performed varying either the slicer and/or the outcomes
coalesced into "1".

The goMortgage plots are rendered as html using Plotly. These are "live" plots in the sense that
Plotly displays information under the cursor, they can be zoomed and saved as png's.

If you run the assessModel step separate from the model build,
goMortgage saves the .gom file named as \<time stamp\>.gom.

There two assessment types: assessment by feature and assessment by curve.

### Assessment by Feature
{: .fw-700 }

Assessment by Feature focuses, generally, on the behavior of the model with respect to existing
and potential model features.  The assessment can also be sliced by any field available in the
data pipeline.


The assessments performed are:

1. [Decile]({{ site.baseurl }}/plots.html#decile-plots) plots.<br> The decile plot isn't by feature but is by slice. 
2. [KS]({{ site.baseurl }}/plots.html#ks-plots) plots.<br> The KS plot is only performed if the target is categorical. The KS plot isn't by
   feature but is by slice.
3. [Segment]({{ site.baseurl }}/plots.html#segment-plots) plots. <br> Segment plots are by feature.
4. [Marginal]({{ site.baseurl }}/plots.html#marginal-plots) plots. <br> Marginal plots are by feature.

### Assessment by Curve
{: .fw-700 }

An "assessment by curve" plots the average model output and average actual.  
The averages are calculated over the values of a slicing field.  

Note that if the slicing field is continuous, then it is reduced to 5 groups based on its quantiles:
<0.1; 0.1-0.25; 0.25-0.5; 0.5-0.75; 0.75-0.9; and >0.9.




