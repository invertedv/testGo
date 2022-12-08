---
layout: default
title: buildModel
nav_order: 4
---

## Modeling Approach

### Data Usage

The modeling approach uses 3 sets of data:

- The modeling data which is used to estimate the model coefficients.
- The validation data which is used to judge early stopping of the model fit.
- The assessment data which is used to construct the assessments of model quality.

### Model Conceit

goMortgage will fit a model to whatever data it's given.  In the examples, you'll see these types of
models:

- hazard models. Hazard models forecast the
  conditional probability that the loan will be in a given state month-by-month into the future. The condition is
  that the loan still exists at the beginning of the month being forecast. 
  An example is the [delinquency]() model.
- regression models. A regression model is fit to a single-valued, continuous target. An example is the
[net recovery]() model.
- scoring models. A scoring model is built on a binary target that, within a fixed time window, 
is 1 if an event occurs and 0 if not. The [mortgage prepay score]() model is an example.

### Model Type

The models fit by goMortgage are neural nets.  goMortgage uses the [seafan]() package which is built
upon [gorgonia]().  The models are sequential.  goMortgage supports continuous, one-hot and embedded features.

### Model Specification

The model is specified within the .gom text file you create.  Below is an example model specification:

    layer1: FC(size:40, activation:relu)
    layer2: FC(size:20, activation:relu)
    layer3: FC(size:10, activation:relu)
    layer4: FC(size:13, activation:softmax)

The model has four layers not counting the input layer.  The input layer is the union of the three types of
input features (continuous, one-hot and embedded). The size: parameter is the number of the layer's
output nodes. From the output
layer (layer4) we see that this is a categorical model that has 13 potential states.

### Model Directory

The model directory lies within the user-specified output directory (outDir key).  
There are three files in the directory:

- modelP.nn and modelS.nn specify the model parameters and structure, respectively.
- fieldDefs.jsn specifies the input features -- their types, levels, means, variances. These are needed
  so that when the model is run on a new dataset the features are normalized/mapped correctly.  
  The file is in a format

There will also be a directory *inputModels*.  If you have used other model outputs as features to this model,
there will be directories under this that specify those models.  Those directories will have the three 
files above
plus "targets.spec". This file contains the outputs of the models to use.  
Each output is on a separate line and has the form

    \<name\>  {ints}

where \<name\> is the name of the feature in this model and ints is a comma-separated list of columns to sum
from the model output.  For example:

    d120{4,5,6,7,8,9,10,11,12}

would create the feature d120 as the sum of columns 4 through 12 of the model output.

Note that if an input model also takes a model as an input, there will be another inputModels directory
in the input model's directory.

All the files in the model directory are text files and quite lightweight. 

### Fannie and Freddie Data
goMortgage comes configured to use the Fannie and Freddie data as assembled by these
packages:
[fannie]() and [freddie]().

One feature of the tables created by these packages is an integer field "bucket", 
which takes on values 0,..,19. It is a hash of
the loan number. Since it is a hash of the loan number, a given loan will always be assigned to the
same bucket.  Importantly, the hash value is uncorrelated with the other fields in the table.
The three data sets, model/validate/assess reside in a single table.  The modelQuery, validateQuery
and assessQuery pull disjoint sets of loans based on the loan bucket.

### Feature Processing

All continuous features are normalized by the sample mean and standard deviation.
Discrete features are mapped into [0,1,2,...].  The distinct levels of the feature
are sorted before they are mapped.
The default value is set to the modal value.

These calculations are based on the modeling dataset and are saved in the file fieldDefs.jsn in the 
modeling directory.  Any future data must use these relationships before being applied to the model. 
If a new level of a discrete feature is found, it is mapped to the default value.

