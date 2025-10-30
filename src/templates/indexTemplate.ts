export default function () {
    return `
import * as path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import * as oas3Tools from 'swagger-tools-oas3'
import * as http from 'http'
import * as fs from 'fs'
import {getControllers} from './gensrc/blackbox-utils.js'
import {callServices, factory, loadSrcFiles, taggedService} from 'ellipsis-ioc'

// ----------------------------------------------------
// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
// ----------------------------------------------------

const serverPort = 3000;
const searchPaths = [
    path.join(__dirname, 'src/**/*').replaceAll('\\\\', '/'),
    path.join(__dirname, 'gensrc/**/*').replaceAll('\\\\', '/')
]

// Load the openapi doc:
const openapiDocPath = path.join(__dirname, './openapi.json')
const openapiDoc = JSON.parse(fs.readFileSync(openapiDocPath, 'utf8'))

class _InitIoc {
    openapiDoc: any

    @factory('openapi-doc')
    getOasDoc() {
        return openapiDoc
    }

    // Initialize the server and load controllers:
    @taggedService('init', 'server')
    async init() {

        // Load all source files to ensure annotations are read:
        searchPaths.forEach(path => {
            loadSrcFiles(path)
        })

        // Load controllers dynamically:
        const options = {
            routing: { 
                controllers: await getControllers()
            },
            cors: {
                origin: '*',
                methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
                allowedHeaders: 'Allow, Content-Type, Authorization',
                exposedHeaders: 'Allow, Content-Type, Authorization',
                preflightContinue: true
            }
        } as any; 

        // Initialize the Express app:
        const expressAppConfig = oas3Tools.expressAppConfig(openapiDocPath, options);
        const app = expressAppConfig.getApp();

        // Start the HTTP server:
        http.createServer(app).listen(serverPort, () => {
            console.log('Server started at '+new Date().toISOString())
            console.log('Server is listening on port '+serverPort)
            console.log('Swagger UI is available at http://localhost:'+serverPort+'/docs')
        });
    }
}

setTimeout(() => callServices('init'), 500); // Delay to allow all annotations to be processed.
`
}