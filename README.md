## goMortgage
[![Go Report Card](https://goreportcard.com/badge/github.com/invertedv/goMortgage)](https://goreportcard.com/report/github.com/invertedv/goMortgage)
[![godoc](https://img.shields.io/badge/go.dev-reference-007d9c?logo=go&logoColor=white)](https://pkg.go.dev/mod/github.com/invertedv/goMortgage?tab=overview)

## A Self-Service Program to Build Mortgage Models

### What is a mortgage model?

A mortgage model is a predictive model that forecasts some aspect of a mortgage's performance.
Common performance metrics are delinquency, default, severity and prepayment.

Such models are built on historical data and may be either at a loan level or pool level.
goMortgage builds loan-level models.

### About goMortgage

goMortgage is an app that builds mortgage forecasting models.

What aspects of mortgage performance can be modeled? Really, anything you can think of.  The software
is agnostic about the model target and features.

goMortgage takes a text file (*.gom) you create to direct all aspects of the modeling process
from building datasets to model assessment.

Since goMortgage is open source, goMortgage can be modified to suit your needs.
Out of the box, it is configured to work with Freddie and Fannie data. There are
instructions to set up your own data sources. 


## Documentation

For more details, see the [docs]({{ site.baseurl }}).
