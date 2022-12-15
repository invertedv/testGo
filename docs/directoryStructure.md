---
layout: default
title: Directory Structure
nav_order: 8
---

## Output Directory Structure

goMortgage creates the non-ClickHouse output of the process 
in the directory specified by the outDir: key.

The structure is:

- outDir
    - model.gom
    - <date>.gom*
    - model.log
    - model**
        - fieldDefs.jsn 
        - modelS.nn
        - modelP.nn
        - inputModels
            - inputModel1
                - fields.jsn
                - modelS.nn
                - modelP.nn
    - graphs***
        - cost
        - strats
        - curves
            - curve 1
            - curve 2
        - marginal
            - 'slicer 1'
                - slice value 1
                - slice value 2
            - 'slicer 2'
        - validation
            - 'slicer 1'
                - slice value 1
                - slice value 2
            - 'slicer 2'
          
<br>
*subsequent assessModel or biasModel runs save the .gom file names according to the run date & time.<br>
**can be renamed using model: key<br>
***can be renamed using graphs: key