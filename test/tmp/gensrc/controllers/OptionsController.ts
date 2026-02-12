import { autowired } from "ellipsis-ioc";

class ServiceWrapper {
    @autowired('openapi-doc')
    openapiDoc: any
}

const wrapper = new ServiceWrapper()

export function getOptions(req: any, res: any) {
    // Manually add the CORS headers.
    // Required due to a bug in swagger-tools-oas3:
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Allow, Content-Type, Authorization')
    res.setHeader('Access-Control-Expose-Headers', 'Allow, Content-Type, Authorization')
    
    const opts = Object.keys(wrapper.openapiDoc.paths[req.openapi.openApiRoute])
        .filter(method => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(method.toLowerCase()))
    res.status(200).set("Allow", opts).json({})
}

export function getOptionsForLocationList(req: any, res: any) {
    // Manually add the CORS headers.
    // Required due to a bug in swagger-tools-oas3:
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Allow, Content-Type, Authorization')
    res.setHeader('Access-Control-Expose-Headers', 'Allow, Content-Type, Authorization')
    
    const opts = Object.keys(wrapper.openapiDoc.paths[req.openapi.openApiRoute])
        .filter(method => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(method.toLowerCase()))
    res.status(200).set("Allow", opts).json({})
}

export function getOptionsForLocation(req: any, res: any) {
    // Manually add the CORS headers.
    // Required due to a bug in swagger-tools-oas3:
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Allow, Content-Type, Authorization')
    res.setHeader('Access-Control-Expose-Headers', 'Allow, Content-Type, Authorization')
    
    const opts = Object.keys(wrapper.openapiDoc.paths[req.openapi.openApiRoute])
        .filter(method => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(method.toLowerCase()))
    res.status(200).set("Allow", opts).json({})
}

export function getOptionsForDeviceList(req: any, res: any) {
    // Manually add the CORS headers.
    // Required due to a bug in swagger-tools-oas3:
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Allow, Content-Type, Authorization')
    res.setHeader('Access-Control-Expose-Headers', 'Allow, Content-Type, Authorization')
    
    const opts = Object.keys(wrapper.openapiDoc.paths[req.openapi.openApiRoute])
        .filter(method => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(method.toLowerCase()))
    res.status(200).set("Allow", opts).json({})
}

export function getOptionsForDevice(req: any, res: any) {
    // Manually add the CORS headers.
    // Required due to a bug in swagger-tools-oas3:
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Allow, Content-Type, Authorization')
    res.setHeader('Access-Control-Expose-Headers', 'Allow, Content-Type, Authorization')
    
    const opts = Object.keys(wrapper.openapiDoc.paths[req.openapi.openApiRoute])
        .filter(method => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(method.toLowerCase()))
    res.status(200).set("Allow", opts).json({})
}

export function getOptionsForHello(req: any, res: any) {
    // Manually add the CORS headers.
    // Required due to a bug in swagger-tools-oas3:
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Allow, Content-Type, Authorization')
    res.setHeader('Access-Control-Expose-Headers', 'Allow, Content-Type, Authorization')
    
    const opts = Object.keys(wrapper.openapiDoc.paths[req.openapi.openApiRoute])
        .filter(method => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(method.toLowerCase()))
    res.status(200).set("Allow", opts).json({})
}

export function getOptionsForComm(req: any, res: any) {
    // Manually add the CORS headers.
    // Required due to a bug in swagger-tools-oas3:
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Allow, Content-Type, Authorization')
    res.setHeader('Access-Control-Expose-Headers', 'Allow, Content-Type, Authorization')
    
    const opts = Object.keys(wrapper.openapiDoc.paths[req.openapi.openApiRoute])
        .filter(method => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(method.toLowerCase()))
    res.status(200).set("Allow", opts).json({})
}

export function getOptionsForTabbedServiceList(req: any, res: any) {
    // Manually add the CORS headers.
    // Required due to a bug in swagger-tools-oas3:
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Allow, Content-Type, Authorization')
    res.setHeader('Access-Control-Expose-Headers', 'Allow, Content-Type, Authorization')
    
    const opts = Object.keys(wrapper.openapiDoc.paths[req.openapi.openApiRoute])
        .filter(method => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(method.toLowerCase()))
    res.status(200).set("Allow", opts).json({})
}

export function getOptionsForTabbedService(req: any, res: any) {
    // Manually add the CORS headers.
    // Required due to a bug in swagger-tools-oas3:
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Allow, Content-Type, Authorization')
    res.setHeader('Access-Control-Expose-Headers', 'Allow, Content-Type, Authorization')
    
    const opts = Object.keys(wrapper.openapiDoc.paths[req.openapi.openApiRoute])
        .filter(method => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(method.toLowerCase()))
    res.status(200).set("Allow", opts).json({})
}
