## The Specification File (.gom files)
The specificaton file (.gom) instructs goMortgage what to do.  There are examples in the scripts directory.
Some fields in the specs file are mandatory, others optional.  Note that comments start with a double forward
slash (//)

The format for entries is:

     <key>:<value>

There are two basic keys that drive the process.  These are:

- buildData: {yes}, {no}
- buildModel: {yes}, {no}

### Data Build Keys
Building the data is a three-pass process.  See 'Model Building' for more details. The following keys are required for building data:

- strats1: {field list}<br>
These are the fields to stratify on for the first pass (which selects loans and as-of dates).
- sampleSize1: {int}<br>
The target sample size for pass 1;
- where1: {clause}<br>
a "where" clause to restrict the selection.
- pass1Strat: {table name}<br>
is the name of ClickHouse table to create with the stratification summary.
- pass1Sample: {table name}<br>
is the name of the ClickHouse table to create with the sampled loans.
<br><br>
- strats2: {field list}<br>
is a comma-separated list of the fields to stratify on for the second pass (which selects loans and as-of dates).
- sampleSize2: {int}<br>
is the target sample size for pass 2;
- where2: {clause}<br>
is a "where" clause to restrict the selection.
- pass2Strat: {table name}<br>
is the name of ClickHouse table to create with the stratification summary.
- pass2Sample: {table name}<br>
is the name of the ClickHouse table to create with the sampled loans.
<br><br>
- mtgDb: {table name}<br>
is the ClickHouse table that has the loan-level detail.
- mtgFields: {name}<br>
The value here is a keyword.  Currently, valid values are "fannie" and "freddie". These refer to values specified
within goMortgage.  This is how goMortgage knows what fields to expect in the table.
See 'Adding Sources' for details on adding a source.
- econDb:{table name}<br>
is the ClickHouse table that has the economic data.
- econFields: {field}<br>
is the geo field that is the join field between the mortgage data and the economic data (*e.g.* zip).
<br><br>
- modelTable: {table name}<br>
is the name of the ClickHouse table to create with the model-build sample.

### Model Build Keys

The required keys are:

- target: {field name}<br>
is the field that is the target (dependent variable).
- targetType: {cat}/{cts}<br>
is the type of the target feature.
- cat: {field list}<br>
is a comma-separated list of categorical (one-hot) features.
- cts: {field list}<br>
is a comma-separated list of continuous features.
- emb: {field list}<br>
is a comma-separated list of embedding features.  Each entry is also a key/val pair of the name of the feature
followed by the embedding dimension (field:dim).
- layer<n> : {layer specification}<br>
The model layers are numbered starting with 1.  The specification of the layer follows that used by the
[seafan](https://pkg.go.dev/github.com/invertedv/seafan) package.  For instance, if the first layer
after the inputs is a fully connected layer with a RELU activation and 10 outputs is specified by

      layer1: FC(10, activation=relu)
- epochs: {int}<br>
is the maximum number of epochs to run through.
- batchsize: {int}<br>
is the batch size for the model build optimizer.
- earlyStopping: {int}<br>
If the cost function evaluated on the validation data doesn't decline for 'earlyStopping' epochs, the fit is
terminated.
- learningRateStart: {float}<br>
is the learning rate for epoch 1.
- learningRateStart: {float}<br>
is the learning rate at {epochs}. 

      The learning rate declines linearly from learningRateStart at epoch 1 to learningRateEnd at epoch 'epochs'.
- modelQuery: {query}<br>
is the query to pull the model-build data from 'modelTable'.
- validateQuery: {query}<br>
is the query to pull the validation data from 'modelTable'.  The validation data is used only for determining
early stopping.
- assessQuery: {query}<br>
is the query to pull the assessment data from 'modelTable'.  The assessment data is used only for post-model-build
assessment of the model fit.

      The queries have two place holders "%s".  goMortgage replaces the first %s with a list of the needed fields
      and the second with 'modelTable'.

Optional model-build keys:

- Saving the assessment data<br>
You can, optionally, save the data used for the assessment along with model outputs back to ClickHouse.
There are two keys required to do this.
    - saveTable: {table name}<br>is the ClickHouse table to save the assess data to.
    - saveTableTargets: {name1:target list 1; name2:target list 2}<br>
  The 'name' is the name of the field in the output field.  The target list is a list of comma-separated
  columns of the model output to sum to create the field.  For instances, if the model is a softmax with
  5 output columns, then

          first: 0; last2: 3,4

      will create a field called 'first' in the output table that is the first level of the targe 
      and another field called "last2" in the output table that is the sum of the probabilities of the target being
      its last 2 values.  If the target is continuous, then only column 0 is available.
- addlKeep: {field list}<br>
  is an optional comma-separated list of additional fields to include in the 'saveTable'.  For instance, loan number.
- addlCats: {field list}<br>
is an optional comma-separated list of fields to treat as categorical. This may be needed for other input models
(see below) or because they are used as a slicer for curves. 

### Assessment Keys
- Three keys are required. Any number of assessments may be specified.
    - assessName{name}: {title}
    - assessTarget{name}: {ints}
    - assessSlicer{name}: {field}
- assessAddl: {field list}<br>
is a comma-separated list of fields.  The assessment is always run on all features in the model. 
The assessment is also run on the fields in this list.

### Curves Keys

- curvesName{name}: {title}
- curvesTarget{name}: {ints}
- curvesSlicer{name}: {field}

### General

- show: {yes}, {no}.<br>
if yes, then all graphs are also sent directly to the browser.
- plotHeight: {int}<br>
is the plot height, in pixels.
- plotWidth: {int}<br>
is the plot width, in pixels.

### Optional

- title: {title}<br>
is a title for the run, appearing in graphs, etc.
- input models.<br>
Input models are models previously created by goMortgage that are features in the model being built
in the current run.<br>
    - inputModel: {name}
    - location{name}: {path}<br>Path to the directory containing the model.
    - targets{name}: name1:target list 1; name2:target list 2.<br>
The format is the same as as saveTableTargets. 
- startFrom: {path}<br>
startFrom points to a directory containing a model with the same structure being fit.  The fit will start
at the parameter values in the existing file.