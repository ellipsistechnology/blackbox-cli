export default function (
    openapiDoc: any
): {[key: string]: string} 
{
    const controllerList:{
        [key: string]: string
    } = {}

    const serviceNames: {[key: string]: string} = {}

    Object.keys(openapiDoc.paths).forEach( (path) => {
        // Skip root path as that is handled by RootController.ts:
        if(path === '/') return

        // Get path params:
        const pathParams = (path.match(/{(.*?)}/g) || []).map( (p) => p.substring(1, p.length-1) )
        const pathParamsDefinitions = pathParams.map(param => `const ${param} = req.openapi.pathParams['${param}']`).join('\n    ')
        const pathParamsList = pathParams.join(', ')
        const fileName = path.split('/').filter(p => p && !p.startsWith('{')).join('_') + 'Controller.ts'
        const pathItem = openapiDoc.paths[path]
        const bbConfig = pathItem['x-bb-service'] as {access?: string, identifier?: string} | undefined
        

        // Create the common controller code for the service:
        if(!controllerList[fileName]) {
            // Get the service name from the end of the path.
            // Note: The first time this is called it will not be for an object node, 
            // so the last node will always be the service name.
            serviceNames[fileName] = path.substring(path.lastIndexOf('/')+1)
            controllerList[fileName] = `import { autowired, autowiredService } from "ellipsis-ioc"
import { makeService, makeServiceList, makeUniqueService } from "../blackbox-utils.js"
import { NotFound } from '../HttpError.js'

class ServiceWrapper {
    @autowiredService('${serviceNames[fileName]}')
    service!: any;

    @autowired('openapi-doc')
    openapiDoc: any
}

const wrapper = new ServiceWrapper()

`
        }

        // For each operation in the path, add a controller function:
        Object.keys(pathItem).forEach( (method) => {
            // Skip options (handled by OptionsController), head and trace (not supported), and non-method nodes:
            if(method === 'options' || method === 'head' || method === 'trace' || method === 'x-bb-service' || method === 'summary' || method === 'description') {
                return
            }

            const operationId = pathItem[method].operationId
            const summary = pathItem[method].summary
            const description = pathItem[method].description

            if(!operationId) {
                throw new Error(`No operationId found for ${method.toUpperCase()} for service ${path}.`)
            }

            const functionCheck = (tab: string = '') => `if(typeof wrapper.service.${operationId} !== 'function') {
        ${tab}    console.error("Service function ${operationId} not found: "+
        ${tab}        "Please implement function ${operationId} in a service class tagged with the @service('${serviceNames[fileName]}') decorator."
        ${tab}    )
        ${tab}    next(new NotFound("Service function ${operationId} not found."))
        ${tab}    return
        ${tab}}
`

            // Get for a service node (unique object or list of objects with identifier/index)
            // or an object node:
            if(method === 'get') {
                const isUnique = bbConfig?.access === 'unique'
                const isObject = path.endsWith('}') || path.endsWith('}/') // ends with a path param
                const hasSubpaths = Object.keys(openapiDoc.paths).some( p => p !== path && p.startsWith(path.endsWith('/') ? path : path + '/') )
                controllerList[fileName] += `// Get the ${isUnique ? 'unique' : !isObject ? 'list of' : ''} object${isUnique || isObject ? '' : 's'} for '${path}':
export function ${operationId}(req: any, res: any, next: any) {
        const meta = req.query.meta
        ${pathParamsDefinitions}
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.${operationId}Meta === 'function') { 
                Promise.resolve(wrapper.service.${operationId}Meta( {${pathParamsList}} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                ${   isUnique ? `res.status(200).json(makeUniqueService(req, wrapper.openapiDoc))` :
                hasSubpaths ? `res.status(200).json(makeService${isObject ? 'List' : ''}(req, wrapper.openapiDoc))` :
                                `next(new NotFound("Metadata is not available for this ${isObject ? 'object' : 'service'}."))`
                }
            }
        } else {
            ${functionCheck('    ')}
            Promise.resolve(wrapper.service.${operationId}({${pathParamsList}}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

`
                return // next method
            }

            // Delete for an object node:
            if(method === 'delete') {
                controllerList[fileName] += `// Delete an existing object:
export function ${operationId}(req: any, res: any, next: any) {
        ${functionCheck('')}
        ${pathParamsDefinitions}
        Promise.resolve(wrapper.service.${operationId}({${pathParamsList}}))
        .then(() => {res.status(200).json({}); next()})
        .catch(err => next(err))
}
    
`
                return // next method
            }

            if(!pathItem[method].requestBody) {
                throw new Error(`No requestBody found for ${method.toUpperCase()} for service ${path}.`)
            }
            
            const schema = pathItem[method].requestBody.content['application/json'].schema
            const datatype = schema['$ref'] ? schema['$ref'].substring(schema['$ref'].lastIndexOf('/')+1)
                                            : schema.type

            // Post for a service node:
            if(method === 'post') {
                if(!bbConfig) {
                    throw new Error(`No x-bb-service configuration found for POST for service ${path}.`)
                }
                controllerList[fileName] += `// Create a new ${datatype} object:
export function ${operationId}(req: any, res: any, next: any) {
        ${functionCheck('')}
        ${pathParamsDefinitions}
        Promise.resolve(wrapper.service.${operationId}({data: req.body, ${pathParamsList}}))
        .then(data => {
            ${bbConfig.access === 'unique' ?
                'res.status(200).json(data)' : 
            `// Check for id or index in body and return 500 if not present:
            if(data.${bbConfig.access === 'id' ? (bbConfig.identifier || 'id') : 'index' } === undefined) {
                next(new InternalServerError("Service did not return the ${bbConfig.access === 'id' ? (bbConfig.identifier || 'id') : 'index' } of the created object."))
            } else {
                res.status(200).json(data)
            }`
            }
            next()
        })
        .catch(err => next(err))
}

`
                return // next method
            }

            // Put for an object node:
            if(method === 'put') {
                controllerList[fileName] += `// Replace an existing ${datatype} object:
export function ${operationId}(req: any, res: any, ext: any) {
        ${functionCheck('')}
        ${pathParamsDefinitions}
        Promise.resolve(wrapper.service.${operationId}({data: req.body, ${pathParamsList}}))
        .then(data => {res.status(200).json({}); next()})
        .catch(err => next(err))
}

`
                return // next method
            }

            // Patch for an object node:
            if(method === 'patch') {
                controllerList[fileName] += `// Update an existing ${datatype} object:
export function ${operationId}(req: any, res: any, next: any) {
        ${functionCheck('')}
        ${pathParamsDefinitions}
        Promise.resolve(wrapper.service.${operationId}({data: req.body, ${pathParamsList}}))
        .then(data => {res.status(200).json({}); next()})
        .catch(err => next(err))
}

`
                return // next method
            }
        })

    })
        
    return controllerList
}