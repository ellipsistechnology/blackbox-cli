import CliConfig from './CliConfig.js'
import ApiManager from './ServerManager.js'
import { extractPathParams, jsonTypes } from './utils.js'
import {logerror, logp, code, logem} from './logging.js'
import {printList} from './print-helper.js'
import readlineSync from 'readline-sync'

import { toCammelCase } from './utils.js'
import serviceGet from './templates/serviceGet.js'
import servicePost from './templates/servicePost.js'
import objectGet from './templates/objectGet.js'
import objectPut from './templates/objectPut.js'
import objectPatch from './templates/objectPatch.js'
import objectDelete from './templates/objectDelete.js'

const methodToOperation:{ [key: string]: string } = {
  get: "get",
  post: "create",
  put: "replace",
  patch: "update",
  delete: "delete"
}

export default class ServiceManager {
  apiManager:ApiManager;

  constructor(private config: CliConfig) {
    this.apiManager = new ApiManager(this.config);
  }

  async add() {
    // Validate config parameters:
    if(!this.config.name) {
      logerror("Name not found. Use -n or --name to supply a name for the service you wish to add.")
      return
    }

    if(!this.config.datatype) {
      logerror("Datatype not found. Use -d or --datatype to supply a datatype for the service you wish to add.")
      return
    }

    await this.apiManager.loadOpenApiJson()

    if(!this.apiManager.getSchemas()[this.config.datatype] && !(<any>jsonTypes).includes(this.config.datatype)) {
      logerror(`Datatype ${code(this.config.datatype)} not found in OpenAPI document. Please add the datatype before adding a service that uses it.`)
      return
    }

    // Load and configure OpenAPI JSON:
    try {
      const parentPath = this.apiManager.blackboxToOpenapiPath(this.config.path || '/')
      if(!parentPath) {
        logerror(`Parent path ${parentPath} not found.`)
        return
      }
      
      let path = parentPath.endsWith('/') ? parentPath+this.config.name : parentPath+'/'+this.config.name

      if(this.apiManager.openapiDoc.paths[path]) {
        logerror("A service already exists at path "+path)
        return
      }
      else {
        this.apiManager.openapiDoc.paths[path] = serviceGet({
          operationId: this.makeOperationId('get', this.config.access === 'unique' ? '' : 'List'),
          serviceName: toCammelCase(this.config.name!, true) + (this.config.access === 'unique' ? '' : 'List'),
          datatype: this.config.datatype,
          access: this.config.access,
          identifier: this.config.identifier,
          pathParams: extractPathParams(path)
        })
        logp(`Added path ${code(path)}`)
      }

  		// TODO: Auto load datatypes from a repository if not found locally.

      const methods = this.config.methodsSet()

      // Add post method:
      if(methods.includes('post')) {
        if(!this.addPostMethod(path)) {
          return // error already logged
        }
      }

      // If not unique then extend the path to the object node:
      if(this.config.access !== 'unique') {
        const objectNodePathId = this.config.name + (this.config.access === 'id' ? (this.config.identifier || 'id') : 'index')
        path = path+'/{'+objectNodePathId+'}'

        if(this.apiManager.openapiDoc.paths[path]) {
          logerror("A service already exists at path "+path)
          return
        }

        // Add the object node path parameter:
        this.apiManager.openapiDoc.components.parameters['path-'+objectNodePathId] = {
          in: "path",
          name: objectNodePathId,
          required: true,
          schema: { type: "string" },
          description: `The ${objectNodePathId} of the ${this.config.datatype}.`
        }

        this.apiManager.openapiDoc.paths[path] = objectGet({
          operationId: this.makeOperationId('get'),
          serviceName: toCammelCase(this.config.name!, true),
          datatype: this.config.datatype,
          pathParams: extractPathParams(path)
        })
        logp(`Added path ${code(path)}`)
      }

      // Add put method:
      if(methods.includes('put')) {
        this.apiManager.openapiDoc.paths[path].put = objectPut({
          operationId: this.makeOperationId('put'),
          datatype: this.config.datatype,
          pathParams: extractPathParams(path)
        })
        logp(`Added ${code('put')} to path ${code(path)}`)
      }

      // Add patch method:
      if(methods.includes('patch')) {
        this.apiManager.openapiDoc.paths[path].patch = objectPatch({
          operationId: this.makeOperationId('patch'),
          datatype: this.config.datatype,
          pathParams: extractPathParams(path)
        })
        logp(`Added ${code('patch')} to path ${code(path)}`)
      }

      // Add delete method:
      if(methods.includes('delete')) {
        this.apiManager.openapiDoc.paths[path].delete = objectDelete({
          operationId: this.makeOperationId('delete'),
          datatype: this.config.datatype,
          pathParams: extractPathParams(path)
        })
        logp(`Added ${code('delete')} to path ${code(path)}`)
      }

      // Write changes:
  		this.apiManager.writeApiJson();
      logem(`Successfully added service ${code(this.config.name)}`)
    }
    catch(err) {
      logerror(`Failed to add service: ${err}`, err)
    }
  }

  // TODO: Allow changing of access.
  async update() {
    await this.apiManager.loadOpenApiJson()

    if(!this.config.path) {
      logerror("Path not found. Use -p or --path to supply a path for the service you wish to update.")
      return
    }

    const path = this.apiManager.blackboxToOpenapiPath(this.config.path)
    if(!path) {
      logerror(`Path ${this.config.path} not found.`)
      return
    }

    // Set the name from the path:
    const pathParts = this.config.path.split('/')
    this.config.name = pathParts[pathParts.length-1]

    let apiMethods = Object.values(this.apiManager.openapiDoc.paths[path])
    let apiPaths = [path]

    // If changing all then search sub-paths too:
    if(this.config.all) {
      const subPaths = Object.keys(this.apiManager.openapiDoc.paths).filter( p => p.startsWith(path+'/') )
      subPaths.forEach( sp => {
        apiMethods = apiMethods.concat( Object.values(this.apiManager.openapiDoc.paths[sp]) )
        apiPaths.push(sp)
      })
    // If not changing all and the path is not unique then also check the sub-service path:
    } else if( this.apiManager.openapiDoc.paths[path]['x-bb-service'] && this.apiManager.openapiDoc.paths[path]['x-bb-service'].access !== 'unique' ) {
      const subpath = this.apiManager.blackboxToOpenapiPath(path+'/#')
      if(subpath) {
        apiPaths.push(subpath)
      }
    }

    if(apiMethods.length === 0) {
      logerror(`No service found at path ${code(path)}.`)
      return
    }
      
    // Set service datatype:
    if(this.config.datatype) {
      // Find all methods and change the datatype:
      apiMethods.forEach( (method:any) => {
        // Change request bodies:
        if(method.requestBody && method.requestBody.content && method.requestBody.content['application/json']) {
          if((<any>jsonTypes).includes(this.config.datatype)) {
            method.requestBody.content['application/json'].schema = { type: this.config.datatype }
          }
          else {
            method.requestBody.content['application/json'].schema = { "$ref": "#/components/schemas/"+this.config.datatype }
          }
        }
        // Change response bodies:
        if(method.responses) {
          Object.values(method.responses).forEach( (response:any) => {
            if(response.content && response.content['application/json']) {
              if((<any>jsonTypes).includes(this.config.datatype)) {
                response.content['application/json'].schema = { type: this.config.datatype }
              }
              else {
                response.content['application/json'].schema = { "$ref": "#/components/schemas/"+this.config.datatype }
              }
            }
          })
        }
      })

      logp(`Updated datatype to ${code(this.config.datatype)} for service at path ${code(path)}`)
    }

    // Change methods:
    if(this.config.methods) {

      apiPaths.forEach( p => {

        // Add any new methods
        this.config.methodsSet().forEach(m => {
          if(!(<any>Object.keys(this.apiManager.openapiDoc.paths[p])).includes(m)) {
            switch(m) {
              case 'post':
                if(!this.addPostMethod(p)) {
                  return // error already logged
                }
                break
              case 'put':
                this.apiManager.openapiDoc.paths[p].put = objectPut({
                  operationId: this.makeOperationId('put'),
                  datatype: this.config.datatype!,
                  pathParams: extractPathParams(p)
                })
                break
              case 'patch':
                this.apiManager.openapiDoc.paths[p].patch = objectPatch({
                  operationId: this.makeOperationId('patch'),
                  datatype: this.config.datatype!,
                  pathParams: extractPathParams(p)
                })
                break
              case 'delete':
                this.apiManager.openapiDoc.paths[p].delete = objectDelete({
                  operationId: this.makeOperationId('delete'),
                  datatype: this.config.datatype!,
                  pathParams: extractPathParams(p)
                })
                break
              default:
                logerror(`Unsupported method ${m}.`)
                return
            }
            logp(`Adding method ${code(m)} to service at path ${code(path)}`)
          }
        })

        // Remove any methods not in the list:
        Object.keys(this.apiManager.openapiDoc.paths[p]).forEach(m => {
          if(!this.config.methodsSet().includes(m) && m !== 'options' && m !== 'get' && !m.startsWith('x-')) { // always keep options and get
            logp(`Removing method ${code(m)} from service at path ${code(p)}`)
            delete (<any>this.apiManager.openapiDoc.paths[p])[m]
          }
        })
          
      }) // forEach path
    }

    this.apiManager.writeApiJson()
    logem(`Successfully updated service ${code(path)}.`)
  }

  /**
   * Add a POST method to the given path.
   * Ensure this.config.datatype is valid before calling.
   * @param path Open API path.
   * @returns true if successful, false otherwise.
   */
  private addPostMethod(path: string) {
    // Add ID response datatype if needed:
    if(this.config.access === 'id' && !this.config.identifier) {
      this.config.identifier = 'id' // default to 'id' if not provided
      logp(`No identifier provided. Defaulting to 'id'.`)
    }
    const idResponseSchemaName = this.config.name + '-' + this.config.identifier //this.makeIdResponseSchemaName(path)

    if(this.config.access === 'id') {
      // Check that the schema includes the identifier:
      const dtSchema = this.apiManager.getSchemas()[this.config.datatype!]
      if(!dtSchema || !dtSchema.properties || !dtSchema.properties[this.config.identifier!]) {
        logerror(`Datatype ${code(this.config.datatype)} does not include identifier field ${code(this.config.identifier)}.`)
        return false
      }

      // TODO: Check that this won't overwrite an existing schema:
      this.apiManager.getSchemas()[idResponseSchemaName] = {
        type: "object",
        properties: {
          [this.config.identifier!]: { type: "string" }
        }
      }
    }

    // Add post to the path:
    this.apiManager.openapiDoc.paths[path].post = servicePost({
      operationId: this.makeOperationId('post'),
      datatype: this.config.datatype!,
      responseSchema: 
        this.config.access === 'index'   ? 'index-response' : 
        this.config.access === 'id'      ? idResponseSchemaName :
                            /* 'unique' */ ''
    })
    logp(`Added ${code('post')} to path ${code(path)}`)

    return true // success
  }

  /**
   * Ensure a valid name is given before calling this method.
   * @param method 
   * @param suffix 
   * @returns 
   */
  private makeOperationId(method:string, suffix = ''): string { // e.g. deleteDatatype
    return (
      methodToOperation[method] +
      toCammelCase(this.config.name!) +
      suffix
    )
  }

  async list() {
    try {
      await this.apiManager.loadOpenApiJson()
      printList(Object.keys(this.apiManager.openapiDoc.paths))
    } catch(err) {
      logerror(`Error loading openAPI document`)
    }
  }

  async delete() {
    // Validate parameters:
    if(!this.config.path) {
      logerror("Path not found. Use -p or --path to supply a path for the service you wish to delete.")
      return
    }

    await this.apiManager.loadOpenApiJson()
    
    let servicePath = this.apiManager.blackboxToOpenapiPath(this.config.path)
    if(!servicePath) {
      logerror(`Path ${this.config.path} not found.`)
      return
    }

    // Prompt user for confirmation to delete:
		let message = "Are you sure you want to delete service "+this.config.path+(this.config.all?" and all it's children":"")+"? (y/n): "
		if(readlineSync.question(message) === 'y') {
      // Find the path to delete:
      if(!this.apiManager.openapiDoc.paths[servicePath]) {
        logerror(`Service not found for path ${code(servicePath)}.`)
        return
      }

      // Delete the service and its sub-service if it exists:
      logp("Deleting path "+code(servicePath));
      delete this.apiManager.openapiDoc.paths[servicePath]

      // Delete any child services if -a/--all specified:
      if(this.config.all) {
        Object.keys(this.apiManager.openapiDoc.paths)
          .filter((key) => key.startsWith(servicePath+"/"))
          .forEach((key) => {
            logp("Deleting path "+code(key))
            delete this.apiManager.openapiDoc.paths[key]
          })
      // If not unique then also delete the sub-service path:
      } else {
        let servicePathWithName = this.apiManager.blackboxToOpenapiPath(servicePath+"/#")
        if(servicePathWithName && this.apiManager.openapiDoc.paths[servicePathWithName]) {
          logp("Deleting path "+code(servicePathWithName))
          this.apiManager.openapiDoc.paths[servicePathWithName] = undefined
        }
      }

      // Write changes:
      this.apiManager.writeApiJson()

      logem(`Successfully deleted service ${code(servicePath)}.`)
    }
  }
}
