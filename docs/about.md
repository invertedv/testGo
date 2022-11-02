## goMortgage

goMortgage is an app that is geared to building mortgage forecasting models.  As noted, goMortgage can both 
build the modeling data set and the model. 



Since it is open source, it can be modified to suit your needs. What follows in this document describes the
software as it is.  goMortgage is
1. the ClickHouse database.  
2. Loan-level tables structured as those created by these projects: [fannie](), [freddie]().  These projects create
a single table which has one loan per row.  The monthly data for each loan is a stored in this table as
nested arrays.


