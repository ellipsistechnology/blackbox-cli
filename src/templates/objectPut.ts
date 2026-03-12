import { dataTypeToMediaTypeMap, makeContentSchema } from "../utils.js"

export default function (
    { operationId, datatype, pathParams }:
    {
        operationId:string, 
        datatype:string,
        pathParams?: string[]
    }
) {
    const putDefinition = {
        "operationId": operationId,
        "summary": `Replace a ${datatype}.`,
        "parameters": [] as any[],
        "requestBody": {
            "required": true,
            "content": {}
        },
        "responses": {
            "200": {
                "description": `${datatype} replaced successfully.`,
            }
        }
    };

    // Add request content:
    const mediaType = dataTypeToMediaTypeMap[datatype] || 'application/json';
    (<any>putDefinition.requestBody.content)[mediaType] = { "schema": makeContentSchema(datatype) }

    // Add id/index parameter if needed:
    if(pathParams) {
        pathParams.forEach(p => {
            putDefinition.parameters?.push({"$ref": "#/components/parameters/path-"+p})
        })
    }

    return putDefinition
}