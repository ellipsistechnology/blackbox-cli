import { makeContentSchema } from "../utils.js"

export default function (
    { operationId, datatype, pathParams }:
    {
        operationId:string, 
        datatype:string,
        pathParams?: string[]
    }
) {
    const patchDefinition = {
        "operationId": operationId,
        "summary": `Update some properties of a ${datatype}.`,
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
            "200": {
                "description": `${datatype} updated successfully.`,
            }
        }
    }

    // Add id/index parameter if needed:
    if(pathParams) {
        pathParams.forEach(p => {
            patchDefinition.parameters?.push({"$ref": "#/components/parameters/path-"+p})
        })
    }

    return patchDefinition
}