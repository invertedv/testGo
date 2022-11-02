## Modeling Approach

### Data

The modeling approach uses 3 sets of data:

- The modeling data which is used to estimate the model coefficients.
- The validation data which is used to judge early stopping of the model fit.
- The assessment data which is used to construct the assessments of model quality.

The [fannie]() and [freddie]() packages provide a unique approach to supplying this data.
These tables include an integer field 'bucket', which takes on values 0,..,19. It is a hash of
the loan number. Since it is a hash of the loan number, a given loan will always be assigned to the
same bucket.  Importantly, the hash value is uncorrelated with the other fields in the table.
The bucket field is used to allocate an observation into one of the 3 data sets. 

As noted in the **Data** section, the data is stratified along a number of dimensions so that we have the
broadest possible sample and avoid length-biased sampling. Typically, these are:

- state
- as-of date
- as-of loan age
- as-of delinquency
- forecast month
- target month (the calendar month)

The terminology used here is:

- as-of date.  The date at which we have actual information and start the forecast from.  Fields that are derived
  from this date start with 'ao'.
- forecast month.  The number of months into the future we are forecasting. Fields that refer to this point in
time start with 'trg'.


### Model Conceit

The types of models fit (with the exception of the net proceeds model) are hazard models.  These forecast the
conditional probability that the loan will be in a given state month-by-month into the future. The condition is
that the loan still exists and is eligible to be in one of the states.  

### Model Type

The models fit by goMortgage are deep neural net models.  goMortgage uses the [seafan]() package which is built
upon [gorgonia]().  The models are sequential.  goMortgage supports continuous, one-hot and embedded features.

### Model Specification

The model is specified in the .gom (specs) file.  Below is an example:

    layer1: FC(size:40, activation:relu)
    layer2: FC(size:20, activation:relu)
    layer3: FC(size:10, activation:relu)
    layer4: FC(size:13, activation:softmax)

The model has four layers not counting the input layer.  The input layer is the union of the three types of
input layers (continuous, one-hot and embedded). The size: parameter is the number of output nodes. The output
layer (layer4) reveals that this is a categorical model that has 13 potential states.

### Model Directory

The model directory lies in the user-specified output directory.  There are three files here:

- modelP.nn and modelS.nn specify the models parameters and structure.
- fieldDefs.jsn specifies the input features -- their types, levels, means, variances. These are needed
so that when used on a new dataset that features are normalized/mapped correctly.  The file is in a format
that can be read by the LoadFTypes function of [seafan](). 

There will also be a directory *inputModels*.  If you have used other model outputs as features to this model,
there will be directories under this that specify those models.  Those directories will have the three files above
plus a targets.spec. This file contains the outputs of the models to use.  Each output is on a separate line
and has the form

    {name} : {ints}

where {name} is the name of the feature in this model and {ints} is a comma-separated list of columns to sum
from the model output.  For example:

    d120:4,5,6,7,8,9,10,11,12

would create the feature d120 as the sum of columns 4 through 12 of the model output.

Note that if the input model also takes a model as an input, there will be another inputModels directory.

All the files in the model directory are text files and quite lightweight. 

