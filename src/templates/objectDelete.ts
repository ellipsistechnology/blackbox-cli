export default function (
    { operationId, datatype, pathParams }:
    {
        operationId:string,
        datatype:string,
        pathParams?: string[]
    }
) {
    const deleteDefinition = {
        "operationId": operationId,
        "summary": `Delete a ${datatype}.`,
        "parameters": [] as any[],
        "responses": {
            "200": {}
        }
    }

    // Add id/index parameter if needed:
    if(pathParams) {
        pathParams.forEach(p => {
            deleteDefinition.parameters?.push({"$ref": "#/components/parameters/path-"+p})
        })
    }

    return deleteDefinition
}