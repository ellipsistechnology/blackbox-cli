/**
 * Convert a string to CamelCase.
 * @param name The string to convert.
 * @param startUpper Whether to start with an upper case letter. Default true.
 * @returns The CamelCased string.
 */
export function toCammelCase(name: string, startUpper: boolean = true) {
  if(jsonTypes.includes(name) || name.endsWith('[]') && jsonTypes.includes(name.substring(0, name.length-2))) {
    return name
  } else {
    const cc = name.replace(/([-_][a-z])/ig, ($1) => {
      return $1.toUpperCase()
        .replace('-', '')
        .replace('_', '')
    })
    if(startUpper) {
      return cc.charAt(0).toUpperCase() + cc.substring(1)
    } else {
      return cc
    }
  }
  // name.split('-')
  //   .map((part, i) => i > 0 || startUpper ? part.charAt(0).toUpperCase() + part.substring(1) : part)
  //   .join('')
}

/**
 * Create an OpenAPI content schema for a given datatype using either
 * a native type or a $ref to a specified type.
 * @param datatype 
 * @returns 
 */
export function makeContentSchema(datatype:string) {
  return (<any>jsonTypes).includes(datatype) ?
  { "type": datatype } :
  { "$ref": "#/components/schemas/"+datatype }
}

export const jsonTypes: string[] = [
  "string",
  "integer",
  "number",
  "boolean",
  "array",
  "object"
]

export const httpMethods: string[] = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "patch"
]

export const reservedTypes: string[] = [
  "metadata",
  "index-response",
  "service",
  "service-list",
  "oas3schema"
]
reservedTypes.push(...jsonTypes)

export const pathParamRegex = /\{([^}]+)\}/g

/**
 * Extract the path parameters from a path string.
 * @param path The path string.
 * @returns An array of parameter names.
 */
export function extractPathParams(path: string): string[] {
  const params = []
  const regex = pathParamRegex
  let match
  while ((match = regex.exec(path)) !== null) {
    params.push(`${match[1]}`)
  }
  return params
}
