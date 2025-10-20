export default function () {
    return`import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url';

/**
 * Blackbox service definition.
 */
export interface Service {
  name: string,
  description?: string,
  href: string,
  type: { 
    format: 'oas3',
    schema: {href: string} | OpenAPISchema
  },
  access: 'unique' | 'index' | 'id',
  identifier?: string
}

/**
 * Metadata key/value pairs.
 */
export interface Metadata {
  [key: string]: any
}

/**
 * List of services.
 */
export interface ServiceList {
  services: { name: string; href: string} []
}

/**
 * The Open API 3 schema tag in the openapi.json file.
 */
export interface OpenAPISchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'integer'
  properties?: { [key: string]: OpenAPISchema} 
  items?: OpenAPISchema
  required?: string[]
  description?: string // TODO: check if this is actually part of the schema
  enum?: string[] // TODO: check if this is actually part of the schema
  format?: string // TODO: check if this is actually part of the schema
  example?: any // TODO: check if this is actually part of the schema
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Dynamically loads and aggregates all exported functions from files
 * in gensrc/controllers into a single object.
 * * @param dirPath The path to the directory containing the modules.
 * @returns A promise that resolves to an object containing all functions.
 */
export async function getControllers() {
    const combinedExports: any = {};
    const absolutePath = path.join(__dirname, 'controllers');
    
    // 1. Read the list of files in the directory
    const files = fs.readdirSync(absolutePath);

    for (const file of files) {
        // 2. Filter for JS/TS files (you might need to adjust the extension if running compiled JS)
        if (file.endsWith('.ts') || file.endsWith('.js')) {
            const filePath = path.join(absolutePath, file);
            
            // 3. Dynamic Import
            // Note: 'file://' protocol is needed for dynamic imports on Windows and is good practice.
            const modulePath = 'file://'+filePath;
            
            // This loads the module and gets all its exports
            const moduleExports = await import(modulePath);

            // 4. Aggregate Exports
            for (const [name, value] of Object.entries(moduleExports)) {
                // Skip default exports, and ensure the value is a function
                if (name !== 'default' && typeof value === 'function') {
                    // Add the function to the combined object using its name
                    combinedExports[name] = value;
                }
            }
        }
    }

    return combinedExports;
}

/**
 * Get the x-bb-service node from the open API doc.
 * @param req  The client request.
 * @param openapiDoc The open API doc.
 * @returns The x-bb-service node from the open API doc.
 */
export function getNodeService(req: any, openapiDoc: any) {
    return openapiDoc.paths[req.openapi.openApiRoute]['x-bb-service']
}

function pathParamReplace(path: string, pathParams: any): string {
    let href = path
    for(const param in pathParams) {
        href = href.replace(\`{\${param}}\`, pathParams[param])
    }
    return href
}

/**
 * Creates a service object for the 
 * @param req 
 * @param openapiDoc 
 * @returns 
 */
export function makeService(req: any, openapiDoc: any): Service | Metadata {
    const bbService = getNodeService(req, openapiDoc)
    if(!bbService) {
        return {}
    }
    const schema = req.openapi.schema.responses['200'].content['application/json'].schema;
    const serviceNode = openapiDoc.paths[req.openapi.openApiRoute]

    return {
        name: req.openapi.openApiRoute.substring(req.openapi.openApiRoute.lastIndexOf('/')+1).replaceAll('/', ''),
        summary: serviceNode.summary,
        description: serviceNode.description,
        href: pathParamReplace(req.openapi.openApiRoute, req.openapi.pathParams),
        type: {
            format: "oas3",
            schema
        },
        access: bbService.access,
        identifier: bbService.identifier
    };
}

export function makeServiceList(req: any, openapiDoc: any): ServiceList & Metadata {
    const root = req.openapi.openApiRoute
    return {
        services: Object.keys(openapiDoc.paths)
            .filter(path => path.startsWith(root) && !path.slice(root.length+1).includes('/') && path !== root)
            .map(path => pathParamReplace(path, req.openapi.pathParams))
            .map(path => ({
                name: path.slice(path.lastIndexOf('/')).replaceAll('/', ''),
                href: path
            }))
    };
}

export function makeUniqueService(req: any, openapiDoc: any): ServiceList & (Service | Metadata) {
    return {
        ...makeService(req, openapiDoc),
        ...makeServiceList(req, openapiDoc)
    }
}
`
}