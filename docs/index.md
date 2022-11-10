
<div style="text-align: left;">
  <img src="{{ site.baseurl }}/images/vee1c.png" width="50" height="50" />
</div>

## A Self-Service Program to Build Mortgage Models

goMortgage is an app that is geared to building mortgage forecasting models.  goMortgage can both
build the modeling data set and the model.

What aspects of mortgage performance can be modeled? Really, anything you can think of.  The software
is agnostic about its target.  The example scripts include models to forecast:

- The probability a loan is modified.
- The loan's delinquency status.
- Prepay and default.
- Net recovery on the property at sale.

The models fit in the first 3 cases are hazard models. 

Since it is open source, goMortgage can be modified to suit your needs. 
What follows in this document describes the software as it is.  

As you might imagine, there are many items that must be specified when building a model.  goMortgage
takes a file (.gom) which specifies these.

The topics below provide details on getting up and running.

- Loan-level data
- Building the modeling [data]({{ site.baseurl }}/data.html)
- Building the [modeling]({{ site.baseurl }}/modeling.html)
- The specification [.gom]({{ site.baseurl }}/gomFile.html) file
- Dependencies on other [projects]({{ site.baseurl }}/dependencies.html)
- [Tutorial]({{ site.baseurl }}/tutorial.html)



