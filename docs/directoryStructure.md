
## Output Directory Structure

The non-ClickHouse output of the process is placed under the 'outDir' you specified.  The structure is:

- outDir

    - model.gom
    - model.log
    - model
        - fields.jsn 
        - modelS.nn
        - modelP.nn
        - inputModels
            - inputModel1
                - fields.jsm
                - modelS.nn
                - modelP.nn
    - graphs
        - cost
        - strats
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

