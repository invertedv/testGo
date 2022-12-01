## Approach


### The App

goMortgage is an app.  

### Data

goMortgage employs three sets of data.  They may be, but do not have to be, disjoint.
The three sets are:

- model.  The data used to fit the coefficients of the model.
- validation. The data used to determine early stopping during the fit process.
- assess. The data used to build graphical and numeric assessments of the model.

goMortgage will build these tables from two source tables: (1) loan-level data and
(2) economic data.  goMortgage comes configured to work with Fannie and Freddie data but
can be modified for other data sources.  See the [BYOD]({{ site.baseurl }}/BYOD.html
guide for details on how to do this.

The structure of the data determines the type of model that is built.
goMortgage is very flexible in the construction of the data. So many different types
of models can be built. 

The [scripts]() directory includes examples of several of these.


### Model

goMortgage fits neural net models. These can have any depth. Two types of layers are
supported: fully connected and dropout. Four activation functions are supported:
