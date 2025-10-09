import CliConfig from './CliConfig.js'
import ServerManager, {OPENAPI_FILENAME} from './ServerManager.js'
import { jsonTypes } from './utils.js'
import {logerror, logq, q, logcode, logh1, logem, logp, code} from './logging.js'
import readlineSync from 'readline-sync'
import {printList} from './print-helper.js'
// import RepositoryManager, { RepoWrapper } from './RepositoryManager';

// TODO allow add from repository

export default class DatatypeManager {
  apiManager:ServerManager;

  constructor(
    public config: CliConfig
  ) {
    this.apiManager = new ServerManager(config);
  }

  private deepCopy(src:any):any {
    let copy:any
    if(Array.isArray(src)) {
      copy = (<[]>src).map(entry => this.deepCopy(entry))
    }
    else if((<any>jsonTypes).includes(typeof src)) {
      copy = src
    }
    else {
      copy = {}
      Object.keys(src).forEach((key:string) => {
        copy[key] = this.deepCopy(src[key])
      })
    }
    return copy
  }

  private allRefs(src:any[]):any[] {
    return src.filter((entry:any) => entry["$ref"] !== undefined)
  }

  // addDependantDatatypes(openApiJson:any, repoWrapper: RepoWrapper, name:string) {

  //   const add = (name:string) => {
  //     const copy = this.deepCopy(repoWrapper.repo[name])
  //     let toAdd:string[] = []
  //     let refNodes:any[] = []

  //     // Find any $refs in oneOf, anyOf, allOf:
  //     if(Array.isArray(copy.oneOf)) {
  //       refNodes = this.allRefs(<string[]>copy.oneOf)
  //     }
  //     else if(Array.isArray(copy.allOf)) {
  //       refNodes = this.allRefs(<string[]>copy.allOf)
  //     }
  //     else if(Array.isArray(copy.anyOf)) {
  //       refNodes = this.allRefs(<string[]>copy.anyOf)
  //     }
  //     else if(copy.properties) {

  //       // Find children that are also references within the repository:
  //       Object.keys(copy.properties).forEach((key:string) => {

  //         // Property is a $ref:
  //         if(copy.properties[key]["$ref"]) {
  //           refNodes.push(copy.properties[key])
  //         }

  //         // Property is an array with items that are $ref:
  //         else if(copy.properties[key].type
  //           && copy.properties[key].type === "array"
  //           && copy.properties[key].items
  //           && copy.properties[key].items["$ref"]) {
  //             refNodes.push(copy.properties[key].items)
  //         }

  //         // Property includes $refs in oneOf, anyOf, allOf:
  //         else if(Array.isArray(copy.properties[key].oneOf)) {
  //           refNodes = refNodes.concat(this.allRefs(<string[]>copy.properties[key].oneOf))
  //         }
  //         else if(Array.isArray(copy.properties[key].anyOf)) {
  //           refNodes = refNodes.concat(this.allRefs(<string[]>copy.properties[key].anyOf))
  //         }
  //         else if(Array.isArray(copy.properties[key].allOf)) {
  //           refNodes = refNodes.concat(this.allRefs(<string[]>copy.properties[key].allOf))
  //         }

  //       })
  //     }

  //     // Update $ref:

  //     refNodes.forEach((n) => {
  //       const value:string = n["$ref"]
  //       let newRef = /(?<=^#\/)[^\/]+$/.exec(value) // Strip out #/
  //       if(newRef) {
  //         n["$ref"] = `#/components/schemas/${newRef[0]}`
  //         toAdd.push(newRef[0])
  //       }
  //       else {
  //         throw new Error(`Failed to parse path ${value} in repository: Note that all $refs must start with #/ and be relative to the root of the repository.`)
  //       }
  //     })

  //     // Recurse on children:
  //     toAdd.forEach(add)

  //     // Add the datatype to openapi.json:
  //     openApiJson.components.schemas[name] = copy
  //     logp(`Added datatype ${code(name)} to ${code(OPENAPI_FILENAME)} from repository.`)

  //   }
  //   add(name)
  // }

  private mapRefs(datatype: any) {
    if(datatype.properties) {
      Object.values(datatype.properties).forEach((prop: any) => {
        if(typeof prop['$ref'] === 'string') {
          prop['$ref'] = (<string>prop['$ref']).replace('#/', '#/components/schemas/')
        } else if(prop.type === 'array' && prop.items && typeof prop.items['$ref'] === 'string') {
          prop.items['$ref'] = (<string>prop.items['$ref']).replace('#/', '#/components/schemas/')
        }
      })
    }
  }

  private putDatatype(name:string, datatype:any=undefined, allowReplace=false){//}, repoWrapper:RepoWrapper|undefined=undefined) {
    let schemas = this.apiManager.getSchemas();
    if(!allowReplace && schemas[name]) {
      logerror(`Datatype with name ${name} already exists; Datatype not added.`)
      return
    }

    if(!datatype) {
      datatype = {"type": "object", "properties": {}}
  		this.updateByPrompt(schemas, datatype)
    }

    // if(repoWrapper) {
    //   this.addDependantDatatypes(repoWrapper, name)
    // } else {
      this.mapRefs(datatype)
      schemas[name] = datatype
    // }


    this.apiManager.writeApiJson()
    logem(`Successfully ${allowReplace?'updated':'added'} datatype ${name}`)
  }

  async add() {
    try {
      await this.apiManager.loadOpenApiJson()

      // If source file is provided then read from that:
      if(this.config.file) {
        const source = this.config.getFileData()

        // No name means add all:
        if(!this.config.name) {
          Object.keys(source).forEach( name => this.putDatatype(name, source[name]) )

        // Otherwise just add the type with the given name:
        } else {
          this.putDatatype(this.config.name, source[this.config.name])
        }
      }
      // No source file so add interactively or from remote repository:
      else if(this.config.name) {
        // const repoWrapper = await new RepositoryManager(this.config).findRepositoryForDatatype(this.config.name)
        // if(repoWrapper) {
        //   this.putDatatype(this.config.name, repoWrapper.repo[this.config.name], false, repoWrapper)
        //   logp(`Adding datatype ${code(this.config.name)} from repository ${code(repoWrapper.uri)}`)
        // }
        // else {
          this.putDatatype(this.config.name)
        // }
      }
      else {
        logerror("Name not found. Use -n or --name to supply a name for the datatype you wish to add, or use --file to provide a schema source file.")
      }
    }
    catch(err) {
      logerror(`Failed to add datatype: ${err}`, err)
    }
  }

  private updateByPrompt(schemas:any, datatype:any) {
		let fieldName:string, fieldType:string;

		// Get user input for field names and types:
		while(true) {

			// Name:
			fieldName = readlineSync.question(q("Enter a field name (leave empty to finish): "));
			if(fieldName === '')
				break;

			// Type:
      const prompt = () => readlineSync.question(q("Enter a type name (leave blank to retrieve a list of available types): "))
			fieldType = prompt()
			while(fieldType === '') {
				this.printTypes(schemas);
				fieldType = prompt()
			}

			this.addField(datatype, fieldType, fieldName, schemas);
		}
	}

  private addField(datatype: any, fieldType: string, fieldName: string, schemas: any) {

  	// Add field with primitive type:
    if ((<any>jsonTypes).includes(fieldType)) {
      datatype.properties[fieldName] = { "type": fieldType };
    }
    else {
      // Add field with reference type:
      if (schemas[fieldType]) {
        datatype.properties[fieldName] = { '$ref': `#/components/schemas/${fieldType}` };
      }
      else {
        logerror("Type " + fieldType + " not found. Field " + fieldName + " not added.");
      }
    }
  }

  printTypes(schemas:any) {
		logh1("JSON Types:")
    printList(jsonTypes)

		logh1("Schemas:")
    printList(Object.keys(schemas))
	}

  // TODO: Don't allow changing of system types.
  /**
   * Update an existing datatype in openapi.json.
   */
  async update() {
    await this.apiManager.loadOpenApiJson()
    try {
      let schemas = this.apiManager.getSchemas()
  		if(!this.config.name) {
        logerror("Name not found. Use -n or --name to supply a name for the datatype you wish to update.")
        return
      }
      let datatype = schemas[this.config.name]
      if(!datatype) {
        logerror("Datatype "+this.config.name+" not found.")
        return
      }

      if(this.config.file) {
        const source = this.config.getFileData()
        if(!source[this.config.name])
          throw new Error(`Datatype ${this.config.name} not found in file ${this.config.file}.`)
        Object.assign(datatype, source[this.config.name])
      }
      else {
        // const repoWrapper = await new RepositoryManager(this.config).findRepositoryForDatatype(this.config.name)
        // if(repoWrapper) {
        //   this.putDatatype(openApiDoc, this.config.name, repoWrapper.repo[this.config.name], true, repoWrapper)
        //   logp(`Updating datatype ${code(this.config.name)} from repository ${code(repoWrapper.uri)}`)
        // }
        // else {
          this.updateByPrompt(schemas, datatype)
          logem(`Successfully updated datatype ${code(this.config.name)}.`)
        // }
      }

      this.apiManager.writeApiJson();
    }
    catch(err) {
      logerror(`Failed to update datatype: ${err}`, err)
    }
  }

  async list() {
    try {
      await this.apiManager.loadOpenApiJson()
      let schemas = this.apiManager.getSchemas()
      if(schemas)
        printList(Object.keys(schemas))
      else
        logerror('Could not find schemas in openAPI document')
    } catch(err) {
      logerror(`Failed to load openAPI document`)
    }
  }

  datatypeInUse():boolean {
		// \{\s*\"\$ref\"\s*\:\s*\"#\/components\/schemas\/service\"\s*\}
    const pattern = new RegExp("\\{\\s*\\\"\\$ref\\\"\\s*\\:\\s*\\\"#\\/components\\/schemas\\/"+this.config.name+"\\\"\\s*\\}")
    return JSON.stringify(this.apiManager.openapiDoc).match(pattern) !== null
	}

  async delete() {
    // Validate parameters:
    if(!this.config.name) {
      logerror("Name not found. Use -n or --name to supply a name for the datatype you wish to delete.")
      return
    }

    // Prompt and delete:
    try {
      await this.apiManager.loadOpenApiJson()
      let schemas = this.apiManager.getSchemas()
      if(schemas[this.config.name]) {
        const message = this.datatypeInUse() ?
            "Datatype "+this.config.name+" is in use, do you still want to delete it? (y/n): " :
            "Are you sure you want to delete datatype "+this.config.name+"? (y/n): ";
        if(readlineSync.question(message) === 'y') {
          delete schemas[this.config.name]
          this.apiManager.writeApiJson()
          logem(`Datatype ${this.config.name} deleted`)
        }
      }
      else {
        logerror("Datatype "+this.config.name+" not found.");
      }
    } catch(err) {
      logerror(`Failed to delete datatype`, err)
    }
  }
}
