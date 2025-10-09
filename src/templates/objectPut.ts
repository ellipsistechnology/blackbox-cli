import { makeContentSchema } from "../utils.js"

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
            "content": {
                "application/json": {
                    "schema": makeContentSchema(datatype)
                }
            }
        },
        "responses": {
            "200": {}
        }
    }

    // Add id/index parameter if needed:
    if(pathParams) {
        pathParams.forEach(p => {
            putDefinition.parameters?.push({"$ref": "#/components/parameters/path-"+p})
        })
    }

    return putDefinition
}