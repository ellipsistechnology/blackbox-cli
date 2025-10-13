import CliOptions from "./CliConfig.js"
import Types from "./Types.js"

import fs from 'fs'
import { logerror, code, logp, logwarn } from "./logging.js"
import ApiManager from "./ServerManager.js"
// import applyServiceClassTemplate from "./applyServiceClassTemplate"
// import applyDatatypeClassTemplate from "./applyDatatypeClassTemplate"
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

import { toCammelCase, jsonTypes, reservedTypes } from "./utils.js"
import ServerManager from "./ServerManager.js"

// const {exec} = require('child_process')
// const {resolve} = require('path')

const SRC_DIR = 'src'
const GENSRC_DIR = 'gensrc'

// export const importMap = {
//   Link: 'blackbox-services',
//   Links: 'blackbox-services',
//   NamedReference: 'blackbox-services',
//   VerboseObject: 'blackbox-services',
//   Service: 'blackbox-services',
//   ServiceLinks: 'blackbox-services',
//   ServiceLink: 'blackbox-services',
//   ServiceType: 'blackbox-services',
// }

export default class Generator {
  options: CliOptions
  serviceManager!: ServerManager

  constructor(options:CliOptions) {
    this.options = options
  }

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
      // case Types.datatype:
      //   await this.generateDatatypes()
      //   break;
      // case Types.database:
      //   await this.generateDatabase()
      // break;
      // case Types.service:
      //   await this.generateServices()
      //   break;
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

  makePath(name:string, extension:string) {
    return (this.options.dest ? this.options.dest : SRC_DIR) + '/' + name + extension
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

//   async generateDatatypes() {
//     try {
//       const oasDoc = await new ApiManager().loadOpenApiJson()
//       if(!oasDoc.components || !oasDoc.components.schemas)
//         throw new Error(`/components/schemas not found in Open API Document`)

//       const schemaToClass = this.schemaToClassMap(oasDoc)
//       let datatypesJS:any = {}

//       Object.keys(oasDoc.components.schemas).forEach( (name:string) => {
//         if(!(<any>reservedTypes).includes(name)) {
//           const schema = oasDoc.components.schemas[name]
//           if(schema.type === 'object' && schema.properties) {
//             const templateData = {
//               name:name,
//               properties:Object.keys(schema.properties).map((prop:string) => ({
//                 type:(
//                   schema.properties[prop]['$ref'] ? schemaToClass[schema.properties[prop]['$ref']] :
//                   schema.properties[prop].type === 'array' && schema.properties[prop].items && schema.properties[prop].items['$ref'] ? schemaToClass[schema.properties[prop].items['$ref']]+'[]' :
//                   schema.properties[prop].type === 'array' && schema.properties[prop].items && (<any>jsonTypes).includes(schema.properties[prop].items.type) ? schema.properties[prop].items.type+'[]' :
//                   (<any>jsonTypes).includes(schema.properties[prop].type) ? schema.properties[prop].type :
//                   Array.isArray(schema.properties[prop].oneOf) ? (
//                     schema.properties[prop].oneOf
//                     .map((type:any) => (
//                       (<any>jsonTypes).includes(type.type) ? type.type :
//                       type['$ref']?schemaToClass[type['$ref']]:
//                       '')
//                     )
//                     .filter((type:any) => type)
//                     .join('|')
//                   ) :
//                   'any'
//                 ),
//                 name:prop
//               }) ),
//               required: Array.isArray(schema.required) ? schema.required : []
//             }
// // TODO all special cases above need to be below and vise-versa; i.e. extract to methods
//             datatypesJS[templateData.name] = applyDatatypeClassTemplate(templateData)
//           }
//           else if(schema.type === 'string' && (schema.pattern || schema.format)) {
//             datatypesJS[name] = applyDatatypeClassTemplate({
//               name: name,
//               properties: [],
//               parentClasses: ['String'],
//               required: Array.isArray(schema.required) ? schema.required : []
//             })
//           }
//           else if(schema.type === 'string' && (Array.isArray(schema.enum))) {
//             datatypesJS[name] = applyDatatypeClassTemplate({
//               name: name,
//               properties: [],
//               values: schema.enum,
//               required: Array.isArray(schema.required) ? schema.required : []
//             })
//           }
//           else if(Array.isArray(schema.oneOf)) {
//             logwarn(`#/components/schemas/${name}: oneOf is not supported`)
//             // datatypesJS[name] = applyDatatypeClassTemplate({
//             //   name: name,
//             //   properties: [],
//             //   parentClasses: schema.oneOf.map((type:any) => (
//             //     type['$ref'] ? schemaToClass[type['$ref']] :
//             //     type.type && (<any>jsonTypes).includes(type.type) ? (<string>type.type).charAt(0).toUpperCase()+(<string>type.type).substring(1) :
//             //     ''
//             //   )).filter((type:any) => type)
//             // })
//           }
//           else if(Array.isArray(schema.allOf)) {
//             datatypesJS[name] = applyDatatypeClassTemplate({
//               name: name,
//               properties: [],
//               parentClasses: schema.allOf.map((type:any) => type['$ref']?schemaToClass[type['$ref']]:'').filter((type:any) => type && !(<any>jsonTypes).includes(type)),
//               required: Array.isArray(schema.required) ? schema.required : []
//             })
//           }
//           // else if(Array.isArray(schema.anyOf)) {
//           //
//           // }
//         }
//       })

//       Object.keys(datatypesJS).forEach(async (name:string) => {
//         const className = name.charAt(0).toUpperCase() + name.substring(1);
//         const path = this.makePath(toCammelCase(className), '.ts')
//         if(!path.match(`^(\/)?${GENSRC_DIR}`) && fs.existsSync(path)) {
//           logwarn(`${path} already exists: Skipping datatype ${code(className)}`)
//         }
//         else {
//           await fs.promises.writeFile(path, datatypesJS[name])
//           logp(`Generated datatype ${code(className)}`)
//         }
//       })
//     }
//     catch(err) {
//       logerror(`Failed to generate datatypes: ${err}`, err)
//     }
//   }

  // async generateServices() {
  //   try {
  //     const oasDoc = await new ApiManager().loadOpenApiJson()
  //     if(!oasDoc.paths)
  //       throw new Error(`/path not found in Open API Document`)

  //     let servicesJS: any = {}

  //     const schemaToClass = this.schemaToClassMap(oasDoc)

  //     findParentPaths(oasDoc).forEach((parent: string) => {
  //       if(parent !== '/rulebase') {
  //         const paths = Object.keys(oasDoc.paths).filter((path: string) => path.startsWith(parent))
  //         const templateData = {
  //           name: parent.replace(/\//, ''),
  //           methods: <any[]>[]
  //         }
  //         paths.forEach((path:string) => {
  //           Object.keys(oasDoc.paths[path]).forEach((method:string) => {
  //             const operationId = oasDoc.paths[path][method].operationId
  //             if(operationId) {
  //               templateData.methods.push({
  //                 type: this.methodType(oasDoc, path, method, schemaToClass),
  //                 operationId: toCammelCase(operationId, false)
  //               })
  //             }
  //           })
  //         })
  //         servicesJS[templateData.name] = applyServiceClassTemplate(templateData)
  //       }
  //     })

  //     Object.keys(servicesJS).forEach(async (name: string) => {
  //       const className = toCammelCase(name + 'ServiceImpl')
  //       const path = this.makePath(className, '.ts')
  //       if(!path.match(`^(\/)?${GENSRC_DIR}`) && fs.existsSync(path)) {
  //         logwarn(`${path} already exists: Skipping service ${code(className)}`)
  //       }
  //       else {
  //         await fs.promises.writeFile(path, servicesJS[name])
  //         logp(`Generated service class ${code(className)}`)
  //       }
  //     })
  //   }
  //   catch(err) {
  //     logerror(`Failed to generate services: ${err}`, err)
  //   }
  // }

  // private schemaToClassMap(oasDoc: any):{[key:string]:string} {
  //   return Object.keys(oasDoc.components.schemas).reduce((map: {[key: string]: string}, schemaName: string) => {
  //       // Remove non-words (e.g. hyphens):
  //       const tokens = schemaName.match(/\w+/g);
  //       if (!tokens)
  //           throw new Error(`Invalid schema found '${schemaName}'`);
  //       // Convert to camel-case:
  //       map[`#/components/schemas/${schemaName}`] = tokens.reduce((className: string, t: string) => className + t.charAt(0).toUpperCase() + t.substring(1), '');
  //       return map;
  //   }, {});
  // }

  // private methodType(oasDoc: any, path: string, method: string, schemaToClass:{[key:string]:string}):string {
  //   const schema = oasDoc.paths[path][method].responses['200'].content['application/json'].schema;

  //   let allOf
  //   if(Array.isArray(schema.allOf))
  //     allOf = schema.allOf
  //   else if(schema.type === 'array' && schema.items && schema.items.allOf)
  //     allOf = schema.items.allOf

  //   let type = ''
  //   if(allOf) {
  //     type = allOf
  //       .map((childSchema:any) => schemaToClass[childSchema['$ref']])
  //       .filter((type:string) => type !== 'VerboseObject') // by default this is handled by the service caller; see /gensrc/service
  //       .join('&')
  //   }
  //   else if(schema.type === 'array' && schema.items && schema.items['$ref']) {
  //     type = schemaToClass[schema['$ref']]
  //   }
  //   else if(schema['$ref']) {
  //     type = schemaToClass[schema['$ref']]
  //   }

  //   if(type && schema.type === 'array')
  //     return type + '[]'
  //   else
  //     return type
  // }

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
    
    const controllers = serviceTemplate(this.serviceManager.openapiDoc)
    Object.keys(controllers).forEach( (name: string) => {
      fs.writeFileSync(GENSRC_DIR+'/controllers/'+name, controllers[name])
      logp(`Created ${GENSRC_DIR}/controllers/${name}`)
    })
  }
}
