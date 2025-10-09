import CliConfig from './CliConfig.js'
import ApiManager from './ServerManager.js'
import { extractPathParams, jsonTypes } from './utils.js'
import {logerror, logp, code, logem} from './logging.js'
import {printList} from './print-helper.js'
import readlineSync from 'readline-sync'

// import post_template from './templates/post-template.json'
// import put_template from './templates/put-template.json'
// import patch_template from './templates/patch-template.json'
// import delete_template from './templates/delete-template.json'
// import service_template from './templates/service-template.json' with { type: 'json' }
// import RepositoryManager from './RepositoryManager';

// import DatatypeManager from './DatatypeManager.js';
import { toCammelCase } from './utils.js'
import serviceGet from './templates/serviceGet.js'
import servicePost from './templates/servicePost.js'
// import { access } from 'fs'
import objectGet from './templates/objectGet.js'
import objectPut from './templates/objectPut.js'
import objectPatch from './templates/objectPatch.js'
import objectDelete from './templates/objectDelete.js'

const methodToOperation:{ [key: string]: string } = {
  get: "get",
  post: "create",
  put: "replace",
  patch: "update",
  delete: "delete",
  // options: "getOptionsFor"
}

export default class ServiceManager {
  config:CliConfig;
  apiManager:ApiManager;

  constructor(options:CliConfig) {
    this.config = options
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
      console.log(this.config.path);
      
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
          datatype: this.config.datatype,
          access: this.config.access,
          identifier: this.config.identifier
        })
        logp(`Added path ${code(path)}`)
      }

  		// TODO: Auto load datatypes from a repository if not found locally.

      const methods = this.config.methodsSet()

      // Add post method:
      if(methods.includes('post')) { // FIXME: response type is missing in unique subservice
        if(!this.addPostMethod(path)) {
          return // error already logged
        }
      }

      // If not unique then extend the path to the object node:
      if(this.config.access !== 'unique') {
        const objectNodePathId = this.config.name + (this.config.identifier || 'id')
        path = path+'/{'+objectNodePathId+'}'

        if(this.apiManager.openapiDoc.paths[path]) {
          logerror("A service already exists at path "+path)
          return
        }

        const pathParams = extractPathParams(path)

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
          datatype: this.config.datatype,
          pathParams: pathParams
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

  // private addPathForService() {
	// 	// const path = this.config.servicePath();
  //   const path = this.apiManager.blackboxToOpenapiPath(this.config.path || '/')
	// 	if(path && this.apiManager.openapiDoc.paths[path]) {
	// 		throw new Error("A service already exists at path "+path)
	// 	}
	// 	else {
	// 		// let service = template(
	// 		// 	service_template,
	// 		// 	{
  //     //     summary: this.config.summary || '',
  //     //     tag: this.config.serviceTag(),
  //     //     getOperationId: this.makeOperationId('get', 'Service'),
  //     //     // optionsOperationId: this.makeOperationId('options', 'Service'),
  //     //     parameters: [
  //     //       { "$ref": "#/components/parameters/query-depth" },
  //     //       { "$ref": "#/components/parameters/query-verbose" }
  //     //     ]
  //     //   }
	// 		// );
	// 		this.apiManager.openapiDoc.paths[path] = serviceGet({
  //       operationId: this.makeOperationId('get', 'List'),
  //       summary: this.config.summary || `Retrieve a list of ${this.config.datatype} objects.`,
  //       description: this.config.description || '',
  //       type: this.config.datatype || 'object'
  //     })
  //     logp(`Added path ${code(path)}`)
	// 	}
  //   return true
	// }

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

  // private makeIdResponseSchemaName(bbPath: string):string {
  //   if(!this.config.identifier) {
  //     throw new Error("No identifier provided for ID response schema name.")
  //   }

  //   // Remove leading / and replace path separators with -:
  //   return bbPath.substring(1).replaceAll('/#/', '-').replaceAll('/', '-') + `-${this.config.identifier}`
  // }

  // private addServiceMethod(
  //   servicePath:string,
  //   httpMethod:string,
  //   openApiJson:any,
	// 	methodTemplate:any,
  //   templateMap:any) {

  //   templateMap = Object.assign(
  //     { operationId: this.makeOperationId(httpMethod) },
  //     templateMap
  //   )

  //   let serviceElement = openApiJson.paths[servicePath]
	// 	if(!serviceElement[httpMethod]) {
	// 		let method = template(methodTemplate, templateMap)
	// 		if(method) {
  //       if(method.requestBody)
  //         method.requestBody.content['application/json'].schema = this.schema()
	// 			serviceElement[httpMethod] = method
  //       logp(`Added ${code(httpMethod)} to path ${code(servicePath)}`)
  //     }
  //     else {
  //       logerror(`Error loading template for method ${methodTemplate}`)
  //     }
	// 	}
	// }

  // private schema():any {
	// 	if((<any>jsonTypes).includes(this.config.datatype))
	// 		return { type: this.config.datatype }
  //   else
	// 		return { "$ref": `#/components/schemas/${this.config.datatype}` }
	// }

  // private httpGetResponseSchema():any {
	// 	if(!(<any>jsonTypes).includes(this.config.datatype)) {
	// 		return {
  //       allOf: [
  // 				this.schema(),
  // 				{ "$ref": "#/components/schemas/verbose-object" }
  // 			]
  //     }
	// 	}
	// 	else {
	// 		return this.schema()
	// 	}
	// }

  // private addServiceGet(openApiJson:any) {
  //   const path = this.config.path || '/'
	// 	let getSchemaParent:any = this.apiManager.getSchemaParentByPath(path)
	// 	getSchemaParent.schema = {
	// 	  type: "array",
	// 	  items: this.httpGetResponseSchema()
	// 	}

  //   if(this.config.summary)
  //     openApiJson.paths[path].get.summary = this.config.summary
  //   else if(!openApiJson.paths[path].get.summary)
  //     openApiJson.paths[path].get.summary = `Retrieve a list of ${this.config.datatype} objects.`

  //   openApiJson.paths[path].get.operationId = this.makeOperationId('get', 'List')

  //   logp(`Set get schema for path ${code(path)}`)
	// }

  // private addServiceWithName(openApiJson:any, templateMap:any):any {
  //   const serviceName = this.config.servicePath()+"/{name}"
  //   let service = openApiJson.paths[serviceName]
  //   let getOperationId = this.makeOperationId('get')
  //   let optionsOperationId = this.makeOperationId('options')
  //   if(!service) {
	// 	  service = template(
  //       service_template,
  //       {
  //         summary: "Gets a "+this.config.name+" by name.",
  //         tag: this.config.serviceTag(),
  //         getOperationId,
  //         optionsOperationId
  //       }
  //     )

  //     service.options.parameters = service.get.parameters = [
  //       {
  //         "$ref": "#/components/parameters/path-name"
  //       },
  //       {
  //         "$ref": "#/components/parameters/query-verbose"
  //       },
  //       {
  //         "$ref": "#/components/parameters/query-depth"
  //       }
  //     ]

  //     openApiJson.paths[serviceName] = service
  //     logp(`Addded service to path ${code(serviceName)}`)
	// 	}
  //   else {
  //     service.operationId = getOperationId
  //   }
	// 	return service
	// }

  // private setupServiceWithNameGet(service:any) {
  //   let tags = service.get.tags
  //   if(!tags) {
	//     tags = []
  //     service.get.tags = tags
  //   }
  //   const tag = this.config.service ? this.config.service : this.config.name;
  //   if(!(<any>tags).includes(tag))
	// 	  tags.push(tag)

	// 	service.get.responses[200].content["application/json"].schema = this.httpGetResponseSchema()
	// }

  // private async setServiceDatatype(openApiJson:any) {

    // Check the datatype exists or load it from a repository:
    // await this.addDatatypeToSchema(openApiJson, this.options.datatype)
    // const repo = await new RepositoryManager(this.config).findRepositoryForDatatype(this.config.datatype)
    // if(repo) {
    //   new DatatypeManager(this.config).addDependantDatatypes(openApiJson, repo, this.config.datatype)

    //   // Add to x-blackbox-types array:
    //   const service = openApiJson.paths[this.config.servicePath()]
    //   if(!service)
    //     throw new Error(`Service not found at path ${this.config.servicePath()}`)
    //   if(!service['x-blackbox-types'])
    //     service['x-blackbox-types'] = []
    //   service['x-blackbox-types'].push({
    //     uri: repo.uri,
    //     name: this.config.datatype
    //   })
    // }

    // Add methods from templates:
		// let templateData = {
		// 	datatype: this.config.datatype,
		// 	tag: this.config.serviceTag(),
		// 	service: this.config.name
		// }
		// let methods = this.config.methodsSet()

		// this.addServiceGet(openApiJson) // FIXME: generating incorrect operationId when getting here from add()

		// if((<any>methods).includes("post"))
		// 	this.addServiceMethod(this.config.servicePath(), "post", openApiJson, post_template, templateData)

    // if((<any>methods).includes("put") || (<any>methods).includes("patch") || (<any>methods).includes("delete")) {

    //   let serviceWithName = this.addServiceWithName(openApiJson, templateData)
    //   this.setupServiceWithNameGet(serviceWithName);

  	// 	let serviceWithNamePath = this.config.servicePath()+"/{name}"
  	// 	if((<any>methods).includes("put"))
  	// 		this.addServiceMethod(serviceWithNamePath, "put", openApiJson, put_template, templateData)
  	// 	if((<any>methods).includes("patch"))
  	// 		this.addServiceMethod(serviceWithNamePath, "patch", openApiJson, patch_template, templateData)
  	// 	if((<any>methods).includes("delete"))
  	// 		this.addServiceMethod(serviceWithNamePath, "delete", openApiJson, delete_template, templateData)
    // }
	// }

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
