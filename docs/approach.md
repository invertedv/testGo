## Approach


### The App

goMortgage is an app. You create a text file (*.gom) that drives the process.  Want to 
change the model structure? Change the source data? Change the features in the model? Change
the sampling scheme? These are easy changes to your .gom file. There's no new to hack into your
code, hoping that the changes to cause some unintended conquences.

The output of a goMortgage run is placed in a 
directory you specify.  This includes your .gom file, a log file, the cost curves from the
model build, and all graphical assessments of the model. Optionally, an output ClickHouse table of 
features and model outputs may be created.


### Data

goMortgage employs three sets of data.  Ideally they are, but do not have to be, disjoint.
The three sets are:

- model.  The data used to fit the coefficients of the model.
- validation. The data used to determine early stopping during the fit process.
- assess. The data used to build graphical and numeric assessments of the model.

goMortgage will build these tables from two source tables: (1) loan-level data and
(2) economic data.  goMortgage comes configured to work with Fannie and Freddie data but
can be modified for other data sources.  See the [BYOD]({{ site.baseurl }}/BYOD.html
guide for details on how to do this.

The structure of the data determines the type of model that is built.
goMortgage is very flexible in the construction of the data. Hence, many types
of models can be built. 

The[examples]({{ site.baseurl }}/examples.html) page includes examples of several of these.


### Model

goMortgage fits neural net models. These can have any depth. The target field may be
either discrete or continuous.Two types of layers are
supported: fully connected and dropout. Four activation functions are supported: relu,
leaky relu, linear and softmax.  There are additional options, such as L2 regularization
and linearly decreasing learning rates. 

### Assessment

goMortgage produces a variety of assessments, mostly graphical, to provide insight into the model
performance and relationships of inputs to output.

Given the approach of goMortgage to the process, one can do something that's uber cool.  It is
straghtforward to build the model on data up to time *t* and assess it on data after time *t*.
In fact, one can march through time conducting this process to gain real insight into how the model
performs out of sample.


