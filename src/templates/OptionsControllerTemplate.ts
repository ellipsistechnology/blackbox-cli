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
    const opts = Object.keys(wrapper.openapiDoc.paths[req.openapi.openApiRoute])
        .filter(method => !method.startsWith('x-'))
    res.status(200).set("Allow", opts).json({})
}`
}).join('\n\n')}
`
}