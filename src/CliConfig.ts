import {Option, program} from 'commander'
import {defaultFormat, fixWidth, maxLength} from './print-helper.js'
import fs from 'fs'
import { setVerboseLogging } from './logging.js';

export default class CliConfig {
  name?:string
  title?:string
  description?:string
  // service:string = "";
  // datatype:string = "";
  // methods:string = "post,put,patch,delete";
  // all:boolean = false;
  // summary:String = "";
  file?:string
  // url:string = "";
  // dest:string = "";
  // verbose:boolean = false;
  // singular:string = "";
  sourceData:string | undefined

  constructor(args:string[]) {
    program
      .description("The Blackbox CLI")
      .version('0.1.0')
      .usage('bb <command> [type] [options]')
    	.option('-n, --name <name>', "The name of the entity being added or modified.")
    	.option('-t, --title <title>', "The title of the API.")
    	.option('--desc <description>', 'The description of the API.')
      .option('-s, --service <service>', "The parent service in the case of sub-services. Defaults to no parent; i.e. a root level service.")
      .option('--singular <singular>', "The singular form of the service name when using plural service paths. Used for the operationId.")
    	.option('-d, --datatype <datatype>', "The data type of a service.")
    	.option('-m, --methods <methods>', "The HTTP methods to be supported by the service.")
    	.option('-a, --all', "Apply operation to all relevant items. E.g. bb delete service -a -n s1 will remove service s1 and any child services.")
      .option('-f, --file <file>', "A source file to read in data appropriate to the command and type.")
      .option('-u, --url <url>', "A source url to read in data appropriate to the command and type.")
      .option('--dest <dest>', "Destination path for generated files.")
    	.option('--summary <summary>', "Summary for a service.")
      .option('-v, --verbose', "Display verbose output.")
      .allowExcessArguments(true)
      .parse(args);

    const opts = program.opts()
    
    Object.keys(opts).forEach( (opt:string) => {
      switch(opt) {
      case 'name':
        this.name = opts[opt]; break
      case 'title':
        this.title = opts[opt]; break
      case 'desc':
        this.description = opts[opt]; break
      case 'file':
        this.file = opts[opt]; break
      
      }
    })

    if(opts.verbose)
      console.log(`Verbose logging enabled`)
    setVerboseLogging(opts.verbose)
	}

  // servicePath():string {
  //   return this.service === '' ? "/"+this.name : "/"+this.service+"/"+this.name
  // }

  // serviceTag():string {
  //   return this.service === '' ? this.name : this.service
  // }

  describeOptions(prefix:string, format = defaultFormat):string {
    const colWidth = maxLength( program.options.map((opt:Option) => opt.flags) )

    return program.options.map( (option:Option) => (
      format(prefix, fixWidth(option.flags, colWidth), option.description)
    ) ).reduce((accumulator:string, currentValue:string) => accumulator + currentValue + '\n', '')
  }

  // methodsSet():string[] {
	// 	return this.methods.split(",")
	// }

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
