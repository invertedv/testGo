---
layout: default
title: .gom File
nav_order: 7
---

## The Specifications File (*.gom)
{: .no_toc }

{: .fs-6 .fw-300 }

### Table of Contents
{: .no_toc .text-delta }

1. TOC
{:toc}
---


### Introduction
{: .fw-700 }

The specificaton (*.gom) file instructs goMortgage what to do. 
There are annotated [examples]({{ site.baseurl }}/examples.html) to make the 
descriptions below concrete.

The format for entries is:

     <key>:<value>

Comments start with a double forward slash (//).

### Required key
{: .fw-700 }

There is only one key that is always required:

- outDir: \<path\><br>
the full path to the directory where goMortgage places all the output of the run. 
If buildData
or buildModel are "yes", this directory is created (or emptied).  Otherwise, the directory
must exist and the output of this run is added to the existing directory. 

There are four keys that set the primary steps performed. If one of these keys is
omitted, the value is set to "no". At least one key must be set to "yes".

- buildData: \<yes/no\><br>If yes, goMortgage builds a table from a loan-level
and non-loan data tables. The table produced is intended for use as one or more of the 
model/validate/assess datasets.
- buildModel: \<yes/no\><br>If yes, fit the model.
- assessModel: \<yes/no\><br>If yes, assess the model fit.
- biasCorrect: \<yes/no\><br>If yes, correct the bias in a model against the
data from biasQuery.

Additional keys specify the details of each of these directives.

### buildData Keys
{: .fw-700 }

[Data Build Background]({{ site.baseurl }}/buildData.html)

Building the data is a three-pass process.  


- strats1: \<field list\><br>
the fields in the loan-level data to stratify on for the first pass. If you wish 
to conduct random sampling rather than stratified sampling, specify a single
field: "noGroups".
- sampleSize1: \<int\><br>
the target sample size for pass 1.
- pass1Strat: \<table name\><br>
the name of ClickHouse table to create with the stratification summary.
- pass1Sample: \<table name\><br>
the name of the ClickHouse table to create with the sampled loans.
<br><br>
- strats2: \<field list\><br>
a comma-separated list of the fields to stratify on for the second pass.
  If you wish to conduct random sampling rather than stratified sampling, specify a single
  field: "noGroups".
- sampleSize2: \<int\><br>
the target sample size for pass 2.
- pass2Strat: \<table name\><br>
the name of ClickHouse table to create with the stratification summary.
- pass2Sample: \<table name\><br>
the name of the ClickHouse table to create with the sampled loans.
<br><br>
- mtgDb: \<table name\><br>
the ClickHouse table with the loan-level detail.
- mtgFields: \<name\><br>
The value here is a keyword.  Currently, valid values are "fannie" and "freddie".
This is how goMortgage knows what fields to expect in the table.
See [Bring Your Own Data]({{ site.baseurl }}/BYOD.html) for details on adding a source.
- econDb:\<table name\><br>
the ClickHouse table with the non-loan data.
- econFields: \<field\><br>
the geo field that is the join field between the loan data and the 
non-loan data.  Currently, only "zip3" is supported. The join will use this geo
field and a date field. 
<br><br>
- outputTable: \<ClickHouse table\><br>
the name of the final ClickHouse table.

***Optional***<br>

These keys are optional:
- where1: \<clause\><br>
  a "where" clause to restrict the selection during pass 1.
- where2: \<clause\><br>
  a "where" clause to restrict the selection during pass 2.
- window: \<int\><br>
specifies a window, in months, over which to assess performance from the as-of date.
- tableKey: \<field\><br>
the name of the primary key for the outputTable.

***Notes***<br>
You can stratify on any field, including the target field. However, during pass 1
only as-of date and static fields are available.
If you stratify on the target field in pass 2, you should **not** 
specify any other fields in strat2.

Building the data will (re)create the output directory.  Anything in the directory 
will be lost.

Summary of the strata counts are placed in the "strats" subdirectory in the
ouput directory.

### buildModel Keys
{: .fw-700 }

[Model Build Background]({{ site.baseurl }}/buildModel.html)

***Required***<br>
The following keys are required.

- target: \<field name\><br>
the field that is the target (dependent variable) of the model.
- targetType: \<cat/cts\><br>
the type of the target feature.
- cat: \<field list\><br>
a comma-separated list of categorical (one-hot) features.
- cts: \<field list\><br>
a comma-separated list of continuous features.
- emb: \<embFeature1{dim1}; embFeature2{dim2}; ...\><br>
a semicolon-separated list of embedding features.  The embedding dimension is
enclosed within braces after the field name.  For example, this snippet declares
state and propType to be embedded with dimensions 4 and 2, respectively:

       emb: state{4}; propType{2}

Note: a model need not have all three of cat, cts, and emb, but it must have at least one.

The NN models are sequential.  The input layer is constructed by goMortgage.  The 
*k*th layer has the form:

- layer\<k\> : \<layer specification\><br>
The model layers are numbered starting with 1.  The specification of the layer 
follows that used by the
[seafan](https://pkg.go.dev/github.com/invertedv/seafan) package.  For instance, 
if the first layer
after the inputs is a fully connected layer with a RELU activation and 10 outputs, it 
is specified by

      layer1: FC(10, activation=relu)
- epochs: \<int\><br>
the maximum number of epochs in the fit.
- batchsize: \<int\><br>
the batch size for the model build.
- modelQuery: \<query\><br>
the query to pull the model-build data. This is the data used to fit the
coefficients.

      The query has a place holder "%s" in place of the fields to pull.
      goMortgage constructs the list of fields for you.

Either learningRate or learingRateStart/learningRateEnd must be specified.
- learningRate: \<float\><br>
the learning rate for the model build.
<br>--or--<br>
- learningRateStart: \<float\><br>
the learning rate for epoch 1.
- learningRateEnd: \<float\><br>
the learning rate at \<epochs\>.

With learningRateStart/learningRateEnd, the learning rate declines from learningRateStart at epoch 1 to 
learningRateEnd at epoch "epochs".

***Optional***<br>

- validateQuery: \<query\><br>
the query to pull the validation data.  The validation data is used to determine
early stopping. The validate query has the same format as the model query above.
- earlyStopping: \<int\><br>
If the cost function evaluated on the validation data doesn't decline for "earlyStopping" epochs, 
the fit is terminated.
- l2Reg: \<val\><br>
the L2 regularization parameter value.
- startFrom: \<path\><br>
startFrom points to a directory containing a model with the same structure being fit.  The fit will start
at the parameter values in the existing file.
- model: \<subdir\><br>
the subdirectory name within \<outDir\> to place the fitted model.  The value
defaults to "model".

Input models are models previously created by goMortgage that are features in the 
model being built in the current run. They are specified using this syntax:
- inputModel: \<name\><br>
an arbitrary, case-sensitive name to identify the model.
- location\<name\>: \<path\><br>
the path to the directory containing the model.
- targets\<name\>: \<name1\>{target list 1}; \<name2\>{target list 2}<br>
  the "name" value is the name for the feature.  The target list is
  a list of comma-separated
  columns of the model output to sum to create the field.  For instances, if the model is a softmax with
  5 output columns, then

          first{0}; last2{3,4}

      will create a features called "first" and "last" that are columns 0 and
      3 plus 4, respectively.

***Notes***<br>
Building the model will (re)create the output directory.  Anything in the directory 
will be lost.

### assessModel Keys
{: .fw-700 }

[Assessment Background]({{ site.baseurl }}/assessModel.html)

Softmax outputs are coalesced into a binary output for assessment.  The user specifies
one or more columns of the output to group into the "1" value. 

How do you know which column corresponds to what value of the raw feature? The native values of the
target field are sorted when assigned to its one-hot representation.  For instance, if the
target has values "yes", "no" and "maybe", their columns in the softmax output will be
2, 1 and 0, respectively.

If you have a single-valued continuous target, it is specified as column 0.

There are five sets of assessments plots:

1. marginal
2. decile
3. KS (softmax output only)
4. segment
5. curves

Assessments one through four are specified as a group, termed "assessment by feature";
the fifth is separate process termed "assessment by curve".  At least one of these two sets must
be specified.  Multiple of each may be specified.

The only required key is assessQuery.  
- assessQuery: \<query\><br>
  the query to pull the assessment data.  The assessment data is used only for post-model-build
  assessment of the model fit. The query has the same format as the model and validation queries.

#### Assessment by Feature
{: .fs-2 .fw-700 }

Three keys are required for a single set of assessments by feature. 
Any number of assessments may be specified.
- assessName\<name\>: \<title\><br>the title that will appear in graphs. \<name\> is an arbitrary,
case-sensitive name to identify this assessment.
- assessTarget\<name\>: \<ints\><br>
a list of the columns of the model output to coalesce into the assessment target.
- assessSlicer\<name\>: \<field\><br>
the field on which to slice the assessment.
If you not wish to segment the analysis on a field, specify the value as "noGroups".

#### Assessment by Curve
{: .fs-2 .fw-700 }

- curvesName\<name\>: \<title\><br>
the title for the graphs.  \<name\> is an arbitrary, case-sensitive
  name to identify this assessment.
- curvesTarget\<name\>: \<ints\><br>
  a list of the columns of the model output to coalesce into the assessment target.
- curvesSlicer\<name\>: \<field\><br>
the averages are segmented by the values of this field.

The graph produced is the average model and actual values at each level of the slicer field.

***Optional***<br>

***Saving the assessment data***<br>
Create a ClickHouse table with the data used for the assessment 
along with model outputs. There are two keys required to do this.
- saveTable: \<table name\><br>
the ClickHouse table to save the assess data to.
- saveTableTargets: \<name1\>{target list 1}; \<name2\>{target list 2}<br>
the 'name' value is the name of the fieldds to create in ClickHouse.  The target list is
a list of comma-separated
columns of the model output to sum to create the field.  For instances, if the model is a softmax with
5 output columns, then

          first: 0; last2: 3,4

      will create a field called 'first' in the output table that is the first level of the targe
      and another field called "last2" in the output table that is the sum of the probabilities of the target being
      its last 2 values.  If the target is continuous, then only column 0 is available.

Additional optional assessment keys:

- graphs: \<sub dir\><br>
  the name of the directory within \<outDir\> to place the graphs,  If you do not specifiy this,
  "graphs" will be used.
- addlKeep: \<field list\><br>
  a comma-separated list of additional fields to include in the 'saveTable'.  For instance, loan number.
- addlCats: \<field list\><br>
  a comma-separated list of fields to treat as categorical.
  If you wish to include a field in "addlAssess" as a one-hot feature, include it in
  this statement.
- assessAddl: \<field list\><br>
  a comma-separated list of fields.  The assessment is always run on all features in the model.
  The assessment is also run on the fields in this list.

***Notes***<br>
You can run the assessment standalone on an existing model. When run in this mode,
goMortgage will look into the model to determine the features to use in the assessment.
You could also use this feature to assess the model against a new dataset, perhaps
from a new source. If you wanted the results in its own directory, you need only create
this directory and copy over the "model" subdirectory.

### biasCorrect Keys
{: .fw-700 }

[Bias-Correct Background]({{ site.baseurl }}/biasCorrect.html)

If you build a model stratified on the target field, the "bias" term of the output
layer will (ironically) be biased.  goMortgage can de-bias this term.  You must
specify a "biasQuery" that returns data that is **not** stratified on the target
field.  goMortgage will use this data to refit the bias terms of the output layer.

- biasDir: \<sub dir\><br>
the subdirectory within "outDir" to place the bias-corrected model.
- biasQuery: \<query\><br>
the query to pull the bias-correction query.

### Optional Keys
{: .fw-700 }
- 
- title: \<title\><br>
  a title for the run, appearing in graphs, etc.
- show: \<yes/no\><br>
if yes, then all graphs are also sent directly to the browser.
- plotHeight: \<int\><br>
the plot height, in pixels.  The default is 1200.
- plotWidth: \<int\><br>
the plot width, in pixels. The default is 1600.
