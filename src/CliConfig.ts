import {Option, program} from 'commander'
import {defaultFormat, fixWidth, maxLength} from './print-helper.js'
import fs from 'fs'
import { setVerboseLogging } from './logging.js';
import ServerManager from './ServerManager.js';
import pkg from '../package.json' with { type: 'json' }

export default class CliConfig {
  // Common options:
  name?:string
  title?:string
  desc?:string
  datatype?:string
  methods?:string
  all:boolean = false
  summary?:string
  file?:string
  path?:string
  url?:string
  dest?:string
  sourceData:string | undefined
  access?: 'unique' | 'id' | 'index'
  identifier?: string
  metadata?:any

  // Additional options from extensions:
  [opt: string]: any

  constructor(args:string[]) {
    // Specify command line options:
    program
      .description("The Blackbox CLI")
      .version(pkg.version)
      .usage('bb <command> [type] [options]')
    	.option('-n, --name <name>', "The name of the entity being added or modified.")
    	.option('-t, --title <title>', "The title of the API.")
    	.option('--desc <description>', 'The description of the API.')
      .option('-p, --path <path>', "The path to the parent node in the case of sub-services (use # as value placeholders, defaults to the root node). The package name when adding an extension.")
      .option('--access <access>', "The access type for the service. One of 'unique', 'id' or 'index'.")
      .option('-i, --identifier <identifier>', "The identifier field for the service. E.g. 'id' or 'name'. Required if access is 'id' or 'index'.")
      .option('-d, --datatype <datatype>', "The data type of a service.")
    	.option('-m, --methods <methods>', "A comma separated list of HTTP methods to be supported by the service.")
    	.option('-a, --all', "Apply operation to all relevant items. E.g. bb delete service -a -n s1 will remove service s1 and any child services.")
      .option('-f, --file <file>', "A source file to read in data appropriate to the command and type.")
      .option('-u, --url <url>', "A source url to read in data appropriate to the command and type.")
      .option('--dest <dest>', "Destination path for generated files.")
    	.option('--summary <summary>', "Summary for a service.")
      .option('-v, --verbose', "Display verbose output.")
      .option('--meta <metadata>', "Static metadata for a service in JSON format.")
      .option('--framework <framework>', "The target framework for code generation.")
    
    // Add options from extensions:
    const serverManager = new ServerManager(this)
    if(serverManager.isInitialised()) {
      serverManager.loadConfigJsonSync()
      serverManager.bbDoc.extensions?.forEach((ext: any) => {
        if(ext.options) {
          Object.entries(ext.options).forEach(([option, description]) => {
            program.option(option, <string>description)
          })
        }
      })
    }
    
    // Parse the args:
    program.allowExcessArguments(true)
    program.parse(args);

    // Assign the options to the config:
    const opts = program.opts()
    Object.assign(this, opts)

    // Parse the metadata JSON if provided:
    if(this.meta) {
      this.metadata = JSON.parse(this.meta as unknown as string)
    }

    // Setup verbose logging:
    if(opts.verbose) {
      console.log(`Verbose logging enabled`)
    }
    setVerboseLogging(opts.verbose)
	}

  // servicePath():string {
  //   return this.service === '' ? "/"+this.name : "/"+this.service+"/"+this.name
  // }

  serviceTag():string {
    if(this.name) {
      return this.name
    }
    // if(this.service) {
    //   return this.service
    // }
    throw new Error("No name or service provided for service tag.")
  }

  describeOptions(prefix:string, format = defaultFormat):string {
    const colWidth = maxLength( program.options.map((opt:Option) => opt.flags) )

    return program.options.map( (option:Option) => (
      format(prefix, fixWidth(option.flags, colWidth), option.description)
    ) ).reduce((accumulator:string, currentValue:string) => accumulator + currentValue + '\n', '')
  }

  methodsSet():string[] {
		return this.methods ? this.methods.split(",") : ["get","post","put","patch","delete"]
	}

  /**
   * Lazily load the JSON data from file.
   * @returns The parsed JSON data, or undefined if no file was provided.
   */
  getFileData(): any {
    if(!this.file)
      return undefined

    if(!this.sourceData) {
      const strData = fs.readFileSync(this.file)
      this.sourceData = JSON.parse(strData.toString())
    }

    return this.sourceData
  }
}
