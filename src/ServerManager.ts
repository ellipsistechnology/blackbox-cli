import fs from 'fs'
import {code, logem, logerror} from './logging.js'
import CliConfig from './CliConfig.js'
import {CONFIG_FILENAME, OPENAPI_FILENAME, PACKAGE_FILENAME} from './utils.js'

export default class ServerManager {
  openapiDoc: any
  bbDoc: any

	constructor(
    public config: CliConfig
  ) {}

  async update() {
    try {
      // Update the OpenAPI document:
      await this.loadOpenApiJson()
      let changed = false
      if(this.config.title) {
        this.openapiDoc.info.title = this.config.title
        changed = true
      }
      if(this.config.description) {
        this.openapiDoc.info.description = this.config.description
        changed = true
      }
      if(changed) {
        this.writeApiJson()
        logem(`Updated Open API configuration.`)
      }
      
      // Update the Blackbox config:
      await this.loadConfigJson()
      changed = false
      if(this.config.name) {
        this.bbDoc.name = this.config.name
        changed = true
      }
      if(changed) {
        this.writeConfigJson()
        logem(`Updated Blackbox configuration.`)
      }
    } catch(err: any) {
      logerror(err.toString())
    }
  }

  loadConfigJsonSync(): void {
    const data = fs.readFileSync(CONFIG_FILENAME)
    this.bbDoc = JSON.parse(data.toString())
  }

  async loadConfigJson() {
    return new Promise<void>( (resolve, reject) => {
      fs.readFile(CONFIG_FILENAME, (err:any, data:any) => {
        if(err) {
          logerror("Error reading Blackbox config in file "+CONFIG_FILENAME
            +". Have you initialised your Blackbox api: bb init")
          reject(err)
        }
        else {
          this.bbDoc = JSON.parse(data)
          resolve()
        }
      })
    })
  }

	loadOpenApiJson():Promise<void> {
    return new Promise( (resolve, reject) => {
      fs.readFile(OPENAPI_FILENAME, (err:any, data:any) => {
        if(err) {
          logerror("Error reading OpenAPI document in file "+OPENAPI_FILENAME
            +". Have you initialised your Blackbox api: bb init")
          reject(err)
        }
        else {
          this.openapiDoc = JSON.parse(data)
          resolve()
        }
      })
    })
	}

  async loadPackageJson(): Promise<any> {
    return new Promise<any>( (resolve, reject) => {
      fs.readFile(PACKAGE_FILENAME, (err:any, data:any) => {
        if(err) {
          logerror("Error reading "+PACKAGE_FILENAME)
          reject(err)
        }
        else {
          resolve(JSON.parse(data))
        }
      })
    })
  }

	writeApiJson() {
    fs.writeFileSync(OPENAPI_FILENAME, JSON.stringify(this.openapiDoc, null, 2))
	}

  writeConfigJson() {
    fs.writeFileSync(CONFIG_FILENAME, JSON.stringify(this.bbDoc, null, 2))
  }

  writePackageJson(json: any) {
    fs.writeFileSync(PACKAGE_FILENAME, JSON.stringify(json, null, 2))
  }

	getSchemas():any {
		return this.openapiDoc.components.schemas
	}

	getSchemaByPath(path:string):any {
		return this.getSchemaParentByPath(path).schema
	}

  blackboxToOpenapiPath(bbPath: string) {
    for(let p in this.openapiDoc.paths) {
      if(p.replaceAll(/\{[^}]+\}/gm, '#') === bbPath) {
        return p
      }
    }
    return undefined
  }

	getSchemaParentByPath(bbPath:string):any {
    let p = this.blackboxToOpenapiPath(bbPath)
    if(p && this.openapiDoc.paths[p].get?.responses?.['200']?.content?.['application/json']) {
      return this.openapiDoc.paths[p].get.responses['200'].content['application/json']
    }
    throw new Error("No schema found for path "+p)
	}
}
