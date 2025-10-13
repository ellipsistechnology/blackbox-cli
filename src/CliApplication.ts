import Commands, {printCommands} from './Commands.js'
import Types, {printTypes} from './Types.js'
import CliConfig from './CliConfig.js'
import Initialiser from './Initialiser.js'
import ServiceManager from './ServiceManager.js'
// import DatatypeManager from './DatatypeManager'
import {logh1, logcode, logp, logerror, code, desc} from './logging.js'
import ServerManager from './ServerManager.js'
import DatatypeManager from './DatatypeManager.js'
// import RepositoryManager from './RepositoryManager';
import Generator from './Generator.js'

const keyValueFormat = (prefix:string, key:string, value:string) => prefix + code(key) + desc(value)

export default class CliApplication {
  args:string[]
  options:CliConfig

  constructor(args:string[]) {
    this.args = args.slice(2)
    this.options = new CliConfig(args.slice(1)) // FIXME: dev only; remove node command; fix for command line execution
  }

  printHelp() {
		logh1("Usage:")
		logcode("\tbb command [type] [options]")

		logh1("\nCommands:")
		logp(printCommands("\t", keyValueFormat))

		logh1("\nTypes:")
		logp(printTypes("\t", keyValueFormat))

		logh1("\nOptions:")
		logp(this.options.describeOptions("\t", keyValueFormat))
	}

  async run() {
    // TODO allow running from any subdirectory.
    // TODO allow plugin commands (store in blackbox.json) - e.g. bb init rules.

    // No args defaults to help:
    if(this.args.length <= 0) {
      this.printHelp();
      return;
    }

    let commandString = this.args[0]
    let command = Commands[commandString as keyof typeof Commands]
    
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

  executeManagerMethod(command:string) {
		if(this.args.length < 2) {
			logerror("Error: Type was not provided for "+command+".");
			this.printHelp();
		}
		else {
      const type = Types[this.args[1] as keyof typeof Types]
      if(!type) {
        logerror("Unknown type "+this.args[1]+".")
      }
      else {
        const manager = this.manager(type)

        if(manager && (<any>manager)[command]) {
          try {
            (<any>manager)[command]() // call the relevant command on the manager
          } catch(err) {
            logerror(`Failed to ${command} ${type}:`, err)
          }
        } else {
          logerror(`Operation ${command} is not applicable to type ${this.args[1]}.`)
        }
      }
		}
	}

  manager(type:Types) {
    
    switch(type) {
      case Types.server:
        return new ServerManager(this.options)
		case Types.service:
			return new ServiceManager(this.options)
		case Types.datatype:
			return new DatatypeManager(this.options)
    // case Types.repository:
    //   return new RepositoryManager(this.options)
		default:
			logerror("Unknown type "+type+".")
      return null
		}
  }
}
