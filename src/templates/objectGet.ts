import path from "path"
import { makeContentSchema } from "../utils.js"

export default function(
    {datatype, serviceName, operationId, pathParams}:
    {
        operationId: string,
        serviceName: string,
        datatype: string,
        pathParams?: string[]
    }
) {
  console.log(`creating option with id ${"getOptionsFor"+serviceName}`);
    const getDefinition =  {
      "get": {
        "summary": "Get a " + datatype + " object",
        "operationId": operationId,
        "parameters": [
          {"$ref": "#/components/parameters/query-meta"}
        ],
        "responses": {
          "200": {
            "description": "The requested " + datatype + " object.",
            "content": {
              "application/json": {
                "schema": makeContentSchema(datatype)
              }
            }
          }
        }
      },
      "options": {
        "operationId": "getOptionsFor"+serviceName,
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