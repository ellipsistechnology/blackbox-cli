import Commands, {printCommands} from './Commands.js'
import Types, {printTypes} from './Types.js'
import CliConfig from './CliConfig.js'
import Initialiser from './Initialiser.js'
import ServiceManager from './ServiceManager.js'
import {logh1, logcode, logp, logerror, code, desc} from './logging.js'
import ServerManager from './ServerManager.js'
import DatatypeManager from './DatatypeManager.js'
import RepositoryManager from './RepositoryManager.js';
import Generator from './Generator.js'
import ExtensionManager from './ExtensionManager.js'

const keyValueFormat = (prefix:string, key:string, value:string) => prefix + code(key) + desc(value)

export default class CliApplication {
  args:string[]
  options:CliConfig

  constructor(args:string[]) {
    this.args = args.slice(2)
    this.options = new CliConfig(args.slice(1)) // FIXME: dev only; remove node command; fix for command line execution
  }

  async printHelp() {
		logh1("Usage:")
		logcode("\tbb command [type] [options]")

		logh1("\nCommands:")
		logp(printCommands("\t", keyValueFormat))

		logh1("\nTypes:")
		logp(printTypes("\t", keyValueFormat))
    const extManager = new ExtensionManager(this.options)
    const extensionTypes = await extManager.printExtensionTypes("\t", keyValueFormat)
    if(extensionTypes) {
      logp(extensionTypes)
    }

		logh1("\nOptions:")
		logp(this.options.describeOptions("\t", keyValueFormat))
	}

  async run() {
    // TODO allow running from any subdirectory.
    // TODO allow plugin commands (store in blackbox.json) - e.g. bb init rules; bb add database; bb add authentication

    // No args defaults to help:
    if(this.args.length <= 0) {
      this.printHelp();
      return;
    }

    let commandString = this.args[0]
    let command = Commands[commandString as keyof typeof Commands]

// console.log(`Executing ${commandString} ${this.args[1]}`);
    
    switch(command) {
    case Commands.init:
      new Initialiser(this.options).init()
      break;
    case Commands.generate:
      if(!this.args[1] || this.args[1].startsWith("-")) {
        logerror(`Please provide a type for ${commandString}.`)
        return
      }
      if(!(<any>Object.keys(Types)).includes(this.args[1])) {
        logerror(`Generate is not applicable to type '${this.args[1]}'`)
        return
      }
      const type = Types[this.args[1] as keyof typeof Types]
      await new Generator(this.options).generate(type)
      break;

    case Commands.add:
    case Commands.update:
    case Commands.list:
    case Commands.delete:
      this.executeManagerMethod(commandString)
    break

    // //
    // // case Commands.analyse:

    default:
      logerror(`Unsupported Operation ${commandString}`)
    }
  }

  async executeManagerMethod(command:string) {
		if(this.args.length < 2) {
			logerror("Error: Type was not provided for "+command+".");
			this.printHelp();
		}
		else {
      const type = this.args[1]
      const manager = await this.manager(type)

      if(!manager || typeof (<any>manager)[command] !== 'function') {
        logerror(`Operation ${command} is not applicable to type ${this.args[1]}.`)
      }

      try {
        (<any>manager)[command](type) // call the relevant command on the manager
      } catch(err) {
        logerror(`Failed to ${command} ${type}`)
        console.error(err)
      }
		}
	}

  async manager(type: string) {
    
    switch(type) {
      case 'server':
        return new ServerManager(this.options)
      case 'service':
        return new ServiceManager(this.options)
      case 'datatype':
        return new DatatypeManager(this.options)
      case 'repository':
        return new RepositoryManager(this.options)
      case 'extension':
        return new ExtensionManager(this.options)
      default:
        
        // Check for extensions to handle this type:
        const extension = await new ExtensionManager(this.options).getManager(type)
        if(extension) {
          return extension
        }

        // Unknown type:
        logerror("Unsupported type "+type+".")
        return null
		}
  }
}
