import { jsonTypes, makeContentSchema } from '../utils.js'

export default function (
    {operationId, datatype, responseSchema, pathParams} :
    {
        operationId: string,
        datatype: string,
        responseSchema: string,
        pathParams?: string[]
    }
) {
    const postDefinition = {
        "operationId": operationId,
        "summary": "Creates a "+datatype+" object.",
        "requestBody": {
            "required": true,
            "content": {
                "application/json": { "schema": makeContentSchema(datatype)}
            }
        } as any,
        "responses": {
            "200": {
                "description": datatype+" successfully created."
            } as any
        }
    } as any

    // Add id/index parameter if needed:
    if(pathParams) {
        postDefinition.parameters = []
        pathParams.forEach(p => {
            postDefinition.parameters.push({"$ref": "#/components/parameters/path-"+p})
        })
    }

    // Add response schema:
    if(responseSchema) {
        postDefinition.responses['200'].content = {
            "application/json": { "schema": makeContentSchema(responseSchema) }
        }
    }

    return postDefinition
}