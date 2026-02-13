import { get } from 'http'
import { dataTypeToMediaTypeMap, makeContentSchema } from '../utils.js'

export default function (
    {operationId, serviceName, datatype, access, identifier, pathParams}: {
        operationId: string,
        serviceName: string,
        datatype: string,
        access?: 'unique' | 'id' | 'index',
        identifier?: string,
        pathParams?: string[]
    }
) {
    const getDefinition = {
      "get": {
        "operationId": operationId,
        "summary": 
          access === 'unique' ? `Retrieve the ${datatype} object.`
            /* id or index */ : `Retrieve a list of ${datatype} objects.`,
        "description": `Retrieve ${access === 'unique' ? 'the' : 'a list of'} ${datatype} object${access === 'unique' ? '' : 's'}.`,
        "parameters": [
          { "$ref": "#/components/parameters/query-meta" }
        ],
        "responses": {
        } as any
      },
      "options": {
        "operationId": "getOptionsFor"+serviceName,
        "responses": {
          "200": {
            "description": "List all available HTTP methods."
          }
        }
      },
      "x-bb-service": { access, identifier},
    }

    // Add id/index parameter if needed:
    if(pathParams) {
        pathParams.forEach(p => {
            getDefinition.get.parameters?.push({"$ref": "#/components/parameters/path-"+p})
        })
    }

    // Add response schema:
    const mediaType = dataTypeToMediaTypeMap[datatype] ? dataTypeToMediaTypeMap[datatype] : 'application/json'
    if(access === 'unique') {
      // Unique service - returns a single object:
      getDefinition.get.responses["200"] = {
        "description": `Successfully retrieved the ${datatype}.`,
        "content": {}
      }
      getDefinition.get.responses["200"].content[mediaType] = { "schema": makeContentSchema(datatype) }
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