import { dataTypeToMediaTypeMap, kebab2Camel } from "../utils.js"
import { jsonTypes, reservedClasses, schemaToClassMap, toCammelCase } from '../utils.js'

export interface TemplateMap {
  serviceName:string
  methods:{
    operationId:string,
    path: string,
    method: string
  }[]
}

function methodType(oasDoc: any, path: string, method: string, schemaToClass: { [key:string]: string }): string {
  
  // If there is no response content then default to 'void':
  if(!oasDoc.paths[path][method].responses?.['200']?.content) {    
    return 'void'
  }

  // Get the schema for the 200 response:
  const content = oasDoc.paths[path][method].responses['200'].content
  const schema = content['application/json']?.schema || content['text/plain']?.schema || content[Object.keys(content)[0]]?.schema;

  let allOf
  if(Array.isArray(schema.allOf))
    allOf = schema.allOf
  else if(schema.type === 'array' && schema.items && schema.items.allOf)
    allOf = schema.items.allOf

  let type = ''
  if(allOf) {
    type = allOf
      .map((childSchema:any) => schemaToClass[childSchema['$ref']])
      .join('&')
  }
  else if(schema.type === 'array' && schema.items && schema.items['$ref']) {
    type = schemaToClass[schema.items['$ref']]
  }
  else if(schema.type === 'array' && schema.items && typeof ['string', 'number', 'boolean'].includes(schema.items.type)) {
    type = schema.items.type
  }
  else if(schema.type === 'array' && schema.items) {
    if(schema.items.type === 'integer') {
      type = 'number'
    } else {
      type = 'any'
    }
  }
  else if(schema['$ref']) {
    type = schemaToClass[schema['$ref']]
  } else if(typeof schema.type === 'string') {
    type = schema.type
  }

  if(type && schema.type === 'array') {
    return type + '[]'
  } else if(type) {
    return type
  } else {
    return 'void'
  }
}

export default function (openapiDoc: any, {serviceName, methods}:TemplateMap):string {

  const className = toCammelCase(serviceName)
  // const classVarName = toCammelCase(serviceName, false)
  const schemaToClass = schemaToClassMap(openapiDoc)

  let imports = ''
  new Set(methods // use a set to remove duplicates
    .map(method => methodType(openapiDoc, method.path, method.method, schemaToClass)) // extract types from methods
    .filter(type => type && !type.startsWith('{')) // remove empty or ad hoc types
    .map((type:string) => type.endsWith('[]') ? type.substring(0, type.length-2) : type) // remove array brackets for import statements
    .filter(type => !jsonTypes.includes(type)) // remove primitives
    .reduce((classes, type) => classes.concat(type.split('&')), <string[]>[]) // split Type1&Type2
    .reduce((classes, type) => classes.concat(type.split('|')), <string[]>[]) // split Type1|Type2
  ).forEach(type => imports += `import ${type} from '${reservedClasses.includes(type) ? '../gensrc/' : './'}${type}.js'\n`)

  return `import {serviceClass, autowired} from 'ellipsis-ioc'
${imports}

@serviceClass('${serviceName}')
export class ${className}Service {

  @autowired('openapi-doc')
  openapiDoc:any

  constructor() {
  }
  ${methods.map( method => {
    const pathParams = (method.path.match(/{(.*?)}/g) || []).map( (p) => kebab2Camel(p.substring(1, p.length-1), false) )
    if(['post', 'put', 'patch'].includes(method.method)) {
      pathParams.push('data')
    }
    const pathParamsList = pathParams.length > 0 ? '{'+pathParams.join(', ')+'}' : ''
    const serviceType = openapiDoc.paths[method.path][method.method].requestBody?.content?.['application/json']?.schema?.$ref ?
      schemaToClass[openapiDoc.paths[method.path][method.method].requestBody.content['application/json'].schema.$ref] :
      schemaToClass[openapiDoc.paths[method.path][method.method].requestBody?.content?.['application/json']?.schema?.type] ?
      schemaToClass[openapiDoc.paths[method.path][method.method].requestBody.content['application/json'].schema.type] :
      'any'

    const pathParamTypes = pathParams.length > 0 ? '{'+pathParams.map( p => `${p}: ${p === 'data' ? serviceType : p.endsWith('index') ? 'number' : 'string'}`).join(', ')+'}' : ''
    const returnType = methodType(openapiDoc, method.path, method.method, schemaToClass)
    return `
  ${method.operationId}(${pathParamsList}${pathParams.length > 0 ? ': ' : ''}${pathParamTypes}): ${returnType} {
    throw new Error(\`${method.operationId} not yet implemented.\`)
  }`}).join('\n')}
}
`
}
