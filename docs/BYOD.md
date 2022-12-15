---
layout: default
title: Bring Your Own Data
nav_order: 12
---

## Bring Your Own Data

Beyond modifying the code to bring your own data, you may wish to alter the calculations for Fannie and Freddie.
For that task, you should focus on the queries listed.

### Loan-level Data
{: .fw-700 }

You can modify goMortgage to use your own data. There are some considerations.
goMortgage is set up to use ClickHouse.The seafan and chutils packages goMortgage imports both only support ClickHouse.
Further, goMortgage expects a single loan-level table that has one row per loan with the loan's performance
being a nested table.  

If you set up your loan-level data, then modifications are relatively straightforward. The portion of the
code that requires modification the buildData functionality.  These go files will need to be modified:

- helpers.go. Declare the queries you create below to the var declaration using //go:embed
- specs.go. This file defines methods for this type:

      type specsMap map[string]string

  which stores the entries of the .gom file. Most of the modification involves adding a new case for the
switch statements which return the correct queries for the data source.

The portions of code that need modification are indicated by the comment "\\BYOD".  There are also queries that must
be created.  Create a new directory for these alongside the "fannie" and "freddie" directories.  Each query resides
in a file.  These are:

- goodLoan.sql. This is a snippet of a WHERE clause that restricts the loan selection to loans with high enough
data quality.
- mtgFieldsStatic.sql. A list of fields to keep which are not in the nested performance table.
- mtgFieldsMonthly.sql. A list of fields to keep from the nested performance table.
- pass1Fields.sql. A list of fields to keep from the pass 1 sampling. Essentially these are fields from the
monthly data which you want to keep at the as-of date.  For instance, the delinquency level at the as-of date.
- pass2Fields.sql. A list of fields to keep from the pass2 sampling. Fields from the pass1Fields you want to keep
must be called out here. The targets are calculated here. For instance, the delinquency level at the target date.
This query is run if the "window" key is not specified in the .gom file.
- pass2FieldsWindow.sql. The same as pass2Fields.sql but is run when the "window" key is specified in the .gom file.
- pass3Fields.sql. Calculations run at pass 3 when the non-loan data is also available.

Note that the pass1Fields.sql file has the line:

      'Overall' AS noGroups,

If you want to be able to be able to randomly sample, as opposed to stratified sampling, you must include this
line.

You can, alternately, prepare your data elsewhere and skip the buildData step. 

### Non-loan Data
{: .fw-700 }

The 
<a href="https://pkg.go.dev/github.com/invertedv/assemble" target="_blank" rel="noopener noreferrer" >assemble</a>
package will assemble a non-loan table.
However, there is no need to use this table. The table must have a structure that is geo and monthly time series.
So, for instance, monthly data by zip code.

The econ directory contains two queries.

- zip3Fields.sql. A list of fields to pull from the table.  The entries have placeholders. For instance, for a 
field called "hpi", the entry is
 
      <corr>hpi AS <pre>hpi

  The reason for the placeholders is that the data is pulled at four time periods: loan first-pay date, as-of date,
target date and Jan 2020. The prefixes applied are org, ao, trg and y20. The correlation is replaced by the four
correlations for the joins. 
- zip3With.sql. Defines a WITH statement to pull the data.  If you look at what's there, you'll see that the
incoming table is at the zip level but we need data at the zip3 level. The WITH statement aggregates up to that
level. The .gom files have the key value of "zip3". 
 
Using a different table at the zip3 level will only require modifying these queries.  If you wish to change the
geo level, then modifications follow the guide to adding a new loan source.



