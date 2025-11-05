import CliOptions from "./CliConfig.js"
import Types from "./Types.js"

import fs from 'fs'
import { logerror, code, logp, logwarn, logem } from "./logging.js"
import ApiManager from "./ServerManager.js"
// import applyServiceClassTemplate from "./applyServiceClassTemplate"

// import {findParentPaths, findChildren} from 'blackbox-services'
// import applyDatabaseTemplate from "./applyDatabaseTemplate"

import indexTemplate from "./templates/indexTemplate.js"
import packageTemplate from "./templates/packageTemplate.js"
import tsconfigTemplate from "./templates/tsconfigTemplate.json" with { type: "json" }
import gitignoreTemplate from "./templates/gitignoreTemplate.js"
import RootControllerTemplate from "./templates/RootControllerTemplate.js"
import OptionsControllerTemplate from "./templates/OptionsControllerTemplate.js"
import blackboxutilsTemplate from "./templates/blackboxutilsTemplate.js"
import serviceTemplate from "./templates/serviceTemplate.js"

import datatypeTemplate from "./templates/datatypeTemplate.js"

import { toCammelCase, jsonTypes, reservedTypes, schemaToClassMap } from "./utils.js"
import ServerManager from "./ServerManager.js"
import { TemplateMap as ServiceTemplateMap } from "./templates/serviceTemplate.js"
import { TemplateMap as DatatypeTemplateMap } from "./templates/datatypeTemplate.js"
import controllerTemplate from "./templates/controllerTemplate.js"
import HttpErrorTemplate from "./templates/HttpErrorTemplate.js"

// const {exec} = require('child_process')
// const {resolve} = require('path')

const SRC_DIR = 'src'
const GENSRC_DIR = 'gensrc'

export default class Generator {
  serviceManager!: ServerManager

  constructor(public options:CliOptions) {}

  async generate(type:Types) {
    this.serviceManager = new ServerManager(this.options)
    
    if(!fs.existsSync(SRC_DIR)) {
      fs.mkdirSync(SRC_DIR)
      logp(`Created ./${SRC_DIR}/`)
    }
    if(!fs.existsSync(GENSRC_DIR+'/controllers')) {
      fs.mkdirSync(GENSRC_DIR+'/controllers', { recursive: true })
      logp(`Created ./${GENSRC_DIR}/controllers/`)
    }

    switch(type) {
      case Types.server:
        await this.generateServer()
        break;
      case Types.datatype:
        await this.generateDatatypes()
        break;
      // case Types.database:
      //   await this.generateDatabase()
      // break;
      case Types.service:
        await this.generateServices()
        break;
      // case Types.privilege:
      //   await this.generatePrivileges()
      //   break;
      default:
        throw new Error(`generate is not applicable to type '${type}'.`)
    }
  }

  // async generatePrivileges() {
  //   try {
  //     if(!this.options.service)
  //       throw new Error('Service not specified: Please specify the service for which privileges should be generated with --service (or -s).')

  //     const enumName = toCammelCase(this.options.service) + 'Privileges'
  //     const path = this.makePath(enumName, '.ts')
  //     const oasDoc = await new ApiManager().loadOpenApiJson();
  //     const paths = findChildren(oasDoc, this.options.service)
  //     paths.push('/'+this.options.service)

  //     const enumString = `enum ${enumName} {\n`+
  //       paths.map(path => {
  //         if(oasDoc.paths[path]) {
  //           return oasDoc.paths[path] // get path values
  //         }
  //         else {
  //           logwarn(`WARNING: Path not found, skipping path '${path}'.`)
  //           return null
  //         }
  //       })
  //       .filter(path => path) // remove missing paths
  //       .reduce( (methods:any[], current:any) => methods.concat((<any>Object).values(current)), [] ) // convert to array of methods
  //       .filter((method:any) => method.operationId) //remove if there's no operationId
  //       .map(method => `  ${method.operationId} = '${method.summary}'`) // enum value
  //       .join(',\n')
  //     +`\n}\n\nexport default ${enumName}`

  //     await fs.promises.writeFile(path, enumString)
  //     logp(`Generated privileges for ${code(this.options.service)}`)
  //   }
  //   catch(err) {
  //     logerror(`Failed to generate privileges: ${err}`, err)
  //   }
  // }

  makePath(name: string, extension: string, src?: string) : string {
    return (src ? src : this.options.dest ? this.options.dest : SRC_DIR) + '/' + name + extension
  }

  // async generateDatabase() {
  //   const className = toCammelCase(this.options.datatype, true)
  //   const type = this.options.datatype

  //   try {
  //     if(this.options.datatype === '')
  //       throw new Error('Datatype not specified: Use -d or --datatype to specify the datatype for which the database should be created.')

  //     const data = applyDatabaseTemplate(className, type)
  //     const path = this.makePath(className+'Database', '.ts')
  //     await fs.promises.writeFile(path, data)

  //     const apiManager = new ApiManager()
  //     const packageJson = await apiManager.loadPackageJson()
  //     if(!packageJson.dependencies) {
  //       packageJson.dependencies = {}
  //     }
  //     if(!packageJson.dependencies['blackbox-database']) {
  //       packageJson.dependencies['blackbox-database'] = 'https://ellipsistechnology@bitbucket.org/ellipsistechnology/blackbox-database.git'
  //       apiManager.writePackageJson(packageJson)
  //     }
  //     logp(`Generated database for ${code(this.options.datatype)}: ${path}`)
  //   }
  //   catch(err) {
  //     logerror(`Failed to generate database: ${err}`, err)
  //   }
  // }

  // TODO: Move most of this into the datatypeTemplate function.
  async generateDatatypes() {
    try {
      const apiManager = new ServerManager(this.options)
      await apiManager.loadOpenApiJson()
      if(!apiManager.openapiDoc.components || !apiManager.openapiDoc.components.schemas)
        throw new Error(`/components/schemas not found in Open API Document`)

      const schemaToClass = schemaToClassMap(apiManager.openapiDoc)
      let datatypesJS:any = {}

      // Generate classes for each schema:
      Object.keys(apiManager.openapiDoc.components.schemas).forEach( (name:string) => {
        const schema = apiManager.openapiDoc.components.schemas[name]
        if(schema.type === 'object') {
          const templateData = {
            name
          } as DatatypeTemplateMap
          
          if(schema.properties) {
            templateData.properties = Object.keys(schema.properties).map((name:string) => ({
              name,
              type: (
                schema.properties[name]['$ref'] ? schemaToClass[schema.properties[name]['$ref']] :
                schema.properties[name].type === 'array' && schema.properties[name].items && schema.properties[name].items['$ref'] ? schemaToClass[schema.properties[name].items['$ref']]+'[]' :
                schema.properties[name].type === 'array' && schema.properties[name].items && (<any>jsonTypes).includes(schema.properties[name].items.type) ? schema.properties[name].items.type+'[]' :
                schema.properties[name].type === 'string' && schema.properties[name].enum ? parseEnumValues(schema.properties[name].enum) :
                (<any>jsonTypes).includes(schema.properties[name].type) ? schema.properties[name].type :
                Array.isArray(schema.properties[name].oneOf) ? (
                  schema.properties[name].oneOf
                  .map((type:any) => (
                    (<any>jsonTypes).includes(type.type) ? type.type :
                    type['$ref']?schemaToClass[type['$ref']]:
                    '')
                  )
                  .filter((type:any) => type)
                  .join('|')
                ) :
                'any'
              )
            }) )
          } else {
            templateData.properties = []
          }

          if(schema.additionalProperties) {
            templateData.additionalProperties = '[key: string]: '+(
              schema.additionalProperties['$ref'] ? schemaToClass[schema.additionalProperties['$ref']] :
              (<any>jsonTypes).includes(schema.additionalProperties.type) ? schema.additionalProperties.type :
              'any'
            )
          }

          templateData.required = Array.isArray(schema.required) ? schema.required : []

// TODO all special cases above need to be below and vise-versa; i.e. extract to methods
          
          datatypesJS[templateData.name] = datatypeTemplate(templateData)
        }
        else if(schema.type === 'string' && (schema.pattern || schema.format)) {
          datatypesJS[name] = datatypeTemplate({
            name: name,
            properties: [],
            parentClasses: ['String'],
            required: Array.isArray(schema.required) ? schema.required : []
          })
        }
        else if(schema.type === 'string' && (Array.isArray(schema.enum))) {
          datatypesJS[name] = datatypeTemplate({
            name: name,
            properties: [],
            values: schema.enum,
            required: Array.isArray(schema.required) ? schema.required : []
          })
        }
        else if(Array.isArray(schema.oneOf)) {
          logwarn(`#/components/schemas/${name}: oneOf is not supported`)
          // datatypesJS[name] = datatypeTemplate({
          //   name: name,
          //   properties: [],
          //   parentClasses: schema.oneOf.map((type:any) => (
          //     type['$ref'] ? schemaToClass[type['$ref']] :
          //     type.type && (<any>jsonTypes).includes(type.type) ? (<string>type.type).charAt(0).toUpperCase()+(<string>type.type).substring(1) :
          //     ''
          //   )).filter((type:any) => type)
          // })
        }
        else if(Array.isArray(schema.allOf)) {
          datatypesJS[name] = datatypeTemplate({
            name: name,
            properties: [],
            parentClasses: schema.allOf.map((type:any) => type['$ref']?schemaToClass[type['$ref']]:'').filter((type:any) => type && !(<any>jsonTypes).includes(type)),
            required: Array.isArray(schema.required) ? schema.required : []
          })
        }
        else if(Array.isArray(schema.anyOf)) {
          logwarn(`#/components/schemas/${name}: anyOf is not supported`)
        } else {
          logwarn(`#/components/schemas/${name}: Schema type '${schema.type}' not supported`)
        }
      })

      // Write files:
      Object.keys(datatypesJS).forEach((name:string) => {
        const className = toCammelCase(name.charAt(0).toUpperCase() + name.substring(1))
        const src = reservedTypes.includes(name) ? GENSRC_DIR : SRC_DIR
        const path = this.makePath(className, '.ts', src)
        const fileExists = fs.existsSync(path)

        // Skip reserved types if they already exist unless --all is specified:
        if(!this.options.all && (<any>reservedTypes).includes(name) && fileExists) {
          return 
        }

        // Don't overwrite files outside of gensrc:
        if(!path.match(`^(\/)?${GENSRC_DIR}`) && fileExists) {
          logwarn(`${path} already exists: Skipping datatype ${code(className)}`)
          return
        }

        // Write the file:
        fs.writeFileSync(path, datatypesJS[name])
        logp(`Generated datatype ${code(className)}`)
      })

      logem(`Datatype generation complete.`)
    }
    catch(err) {
      logerror(`Failed to generate datatypes: ${err}`, err)
    }
  }

  // TODO: Move most of this into the serviceTemplate function.
  async generateServices() {
    try {
      const apiManager = new ServerManager(this.options)
      await apiManager.loadOpenApiJson()
      if(!apiManager.openapiDoc.paths)
        throw new Error(`/path not found in Open API Document`)

      let servicesJS: any = {}

      // Generate classes for each service node:
      Object.keys(apiManager.openapiDoc.paths)
      .filter((path:string) => !/\{[^\}]+\}$/.test(path)) // only keep services
      .filter((path: string) => path !== '/') // ignore root path
      .filter((path: string) => !this.options.path || path === this.options.path) // select the specified path if given
      .forEach((path: string) => {

        // Get service and coresponding object node:
        const paths = Object.keys(apiManager.openapiDoc.paths)
        .filter((subPath: string) => (
          subPath === path || subPath.match(new RegExp('^'+path+'\/\\{[^}]+\\}$'))
        ))

        const templateData = {
          serviceName: path.substring(path.lastIndexOf('/')+1),
          methods: []
        } as ServiceTemplateMap

        // Find all methods for this service:
        paths.forEach((path:string) => {
          Object.keys(apiManager.openapiDoc.paths[path])
          .filter((method:string) => ['get','post','put','delete','patch'].includes(method.toLowerCase()))
          .forEach((method:string) => {
            const operationId = apiManager.openapiDoc.paths[path][method].operationId
            if(operationId) {
              templateData.methods.push({
                operationId: toCammelCase(operationId, false),
                path,
                method
              })
            }
          })
        })
        servicesJS[templateData.serviceName] = serviceTemplate(apiManager.openapiDoc, templateData)
      })

      // Write files:
      Object.keys(servicesJS).forEach((name: string) => {
        const className = toCammelCase(name + 'Service')
        
        const path = this.makePath(className, '.ts')
        if(!path.match(`^(\/)?${GENSRC_DIR}`) && fs.existsSync(path)) {
          logwarn(`${path} already exists: Skipping service ${code(className)}`)
        }
        else {
          fs.writeFileSync(path, servicesJS[name])
          logp(`Generated service class ${code(className)}`)
        }
      })

      logem(`Service generation complete.`)
    }
    catch(err) {
      console.error(err)
    }
  }

  async generateServer() {
    await this.serviceManager.loadOpenApiJson()

    // Create root level files if they don't exist 
    // (index.ts, package.json, tsconfig.json, .gitignore):
    if(!fs.existsSync('index.ts')) {
      fs.writeFileSync('index.ts', indexTemplate())
      logp(`Created index.ts`)
    }
    if(!fs.existsSync('package.json')) {
      fs.writeFileSync('package.json', packageTemplate({ name: this.options.title ? this.options.title : 'blackbox-app' }))
      logp(`Created package.json`)
    }
    if(!fs.existsSync('tsconfig.json')) {
      fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfigTemplate, null, 2))
      logp(`Created tsconfig.json`)
    }
    if(!fs.existsSync('.gitignore')) {
      fs.writeFileSync('.gitignore', gitignoreTemplate())
      logp(`Created .gitignore`)
    }
    if(!fs.existsSync(`${GENSRC_DIR}/HttpError.ts`)) {
      fs.writeFileSync(`./${GENSRC_DIR}/HttpError.ts`, HttpErrorTemplate())
      logp(`Created ./${GENSRC_DIR}/HttpError.ts`)
    }

    // Create default controllers and utils if they don't exist.
    // Note that --all will overwrite these files even if they exist:
    if(this.options.all || !fs.existsSync(GENSRC_DIR+'/controllers/RootController.ts')) {
      fs.writeFileSync(GENSRC_DIR+'/controllers/RootController.ts', RootControllerTemplate())
      logp(`Created ${GENSRC_DIR}/controllers/RootController.ts`)
    }
    if(this.options.all || !fs.existsSync(GENSRC_DIR+'/blackbox-utils.ts')) {
      fs.writeFileSync(GENSRC_DIR+'/blackbox-utils.ts', blackboxutilsTemplate())
      logp(`Created ${GENSRC_DIR}/blackbox-utils.ts`)
    }

    // Create controllers for each service:
    fs.writeFileSync(GENSRC_DIR+'/controllers/OptionsController.ts', OptionsControllerTemplate(this.serviceManager.openapiDoc))
    logp(`Created ${GENSRC_DIR}/controllers/OptionsController.ts`)
    
    const controllers = controllerTemplate(this.serviceManager.openapiDoc)
    Object.keys(controllers).forEach( (name: string) => {
      fs.writeFileSync(GENSRC_DIR+'/controllers/'+name, controllers[name])
      logp(`Created ${GENSRC_DIR}/controllers/${name}`)
    })

    logem(`Server generation complete.`)
    logem(`Run ${code('npm install')} to install dependencies.`)
    logem(`Run ${code('npm run dev')} to start the development server.`)
    logem(`Run ${code('npm run build')} to build for deployment.`)
  }
}

function parseEnumValues(enumArray: string[]): string {
  return enumArray.reduce( (accumulator, currentValue, currentIndex) => {
    return accumulator + (currentIndex > 0 ? ' | ' : '') + `'${currentValue}'`
  }, '')
}

