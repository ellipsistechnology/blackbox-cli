export default function (openapiDoc: any) {
    return`import { autowired } from "ellipsis-ioc";

class ServiceWrapper {
    @autowired('openapi-doc')
    openapiDoc: any
}

const wrapper = new ServiceWrapper()

${Object.keys(openapiDoc.paths).map( (path: string) => {
    const pathItem = openapiDoc.paths[path]
    if(!pathItem.options) {
        throw new Error(`No OPTIONS operation found for path ${path}.`)
    }
    const operationId = pathItem.options.operationId
    return `export function ${operationId}(req: any, res: any) {
    // Manually add the CORS headers.
    // Required due to a bug in swagger-tools-oas3:
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Allow, Content-Type, Authorization')
    res.setHeader('Access-Control-Expose-Headers', 'Allow, Content-Type, Authorization')
    
    const opts = Object.keys(wrapper.openapiDoc.paths[req.openapi.openApiRoute])
        .filter(method => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(method.toLowerCase()))
    res.status(200).set("Allow", opts).json({})
}`
}).join('\n\n')}
`
}