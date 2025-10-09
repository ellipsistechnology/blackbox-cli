import { jsonTypes, makeContentSchema } from '../utils.js'

export default function (
    {operationId, datatype, responseSchema} :
    {
        operationId: string,
        datatype: string,
        responseSchema: string
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
    }

    if(responseSchema) {
        postDefinition.responses['200'].content = {
            "application/json": { "schema": makeContentSchema(responseSchema) }
        }
    }

    return postDefinition
}