
## Output Directory Structure

goMortgage creates the non-ClickHouse output of the process 
in the directory specified by the outDir: key.

The structure is:

- outDir
    - model.gom
    - model.log
    - model (1)
        - fields.jsn 
        - modelS.nn
        - modelP.nn
        - inputModels
            - inputModel1
                - fields.jsn
                - modelS.nn
                - modelP.nn
    - graphs (2)
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

(1) can be renamed using model: key
(2) can be renamed using graphs: key