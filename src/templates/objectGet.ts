import path from "path"
import { makeContentSchema } from "../utils.js"

export default function(
    {datatype, operationId, pathParams}:
    {
        operationId: string,
        datatype: string,
        pathParams?: string[]
    }
) {
    const getDefinition =  {
      "get": {
        "summary": "Get a " + datatype + " object",
        "operationId": operationId,
        "parameters": [
          {"$ref": "#/components/parameters/query-meta"}
        ],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": makeContentSchema(datatype)
              }
            }
          }
        }
      },
      "options": {
        "operationId": "getOptions",
        "responses": {
          "200": {
            "description": "List all available HTTP methods."
          }
        }
      }
    }

    // Add id/index parameter if needed:
    if(pathParams) {
        pathParams.forEach(p => {
            getDefinition.get.parameters?.push({"$ref": "#/components/parameters/path-"+p})
        })
    }

    return getDefinition
}