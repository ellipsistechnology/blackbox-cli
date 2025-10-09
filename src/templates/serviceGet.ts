import { get } from 'http'
import { jsonTypes, makeContentSchema } from '../utils.js'

export default function (
    {operationId, description, datatype, access, identifier}: {
        operationId: string,
        description?: string,
        datatype: string,
        access?: 'unique' | 'id' | 'index',
        identifier?: string
    }
) {
    const getDefinition = {
      "get": {
        "operationId": operationId,
        "summary": 
          access === 'unique' ? `Retrieve the ${datatype} object.`
            /* id or index */ : `Retrieve a list of ${datatype} objects.`,
        "description": description,
        "parameters": [
          { "$ref": "#/components/parameters/query-meta" }
        ],
        "responses": {
        } as any
      },
      "options": {
        "operationId": "getOptions",
        "responses": {
          "200": {
            "description": "List all available HTTP methods."
          }
        }
      },
      "x-bb-service": { access, identifier},
    }

    // Add response schema:
    if(access === 'unique') {
      // Unique service - returns a single object:
      getDefinition.get.responses["200"] = {
        "description": `Successfully retrieved the ${datatype}.`,
        "content": {
          "application/json": { "schema": makeContentSchema(datatype) }
        }
      }
    } else {
      // ID or index service - returns a list of objects:
      getDefinition.get.responses["200"] = {
        "description": `Successfully retrieved the list of ${datatype}.`,
        "content": {
          "application/json": { 
            "schema": {
              type: "array",
              items: makeContentSchema(datatype)
            }
          }
        }
      }
    }

    return getDefinition
}