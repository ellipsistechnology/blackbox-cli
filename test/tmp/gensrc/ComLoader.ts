import { ComManager, ComType, ComMacro } from 'ellipsis-com'
import {autowired, named, factory} from 'ellipsis-ioc'

// TODO: Adopt a propper logging system.
let debug: (...args: any[]) => void
export function enableDebug(enable = true) {
    if (enable) {
        debug = console.log;
    } else {
        debug = () => { };
    }
}
enableDebug(false)

const comManager = new ComManager()

@named('com-loader') // named so that it autocreates an instance
export class ComLoader {

  @autowired('openapi-doc')
  openapiDoc:any
  
  constructor() {
    setTimeout(() => {
      comManager.init(this.loadTypes())
    }, 1000)
  }

  @factory('com-manager') // make the manage available for injection
  getComManager() {
    return comManager
  }

  /**
   * Load the com types from the OpenAPI document.
   * TODO: This method needs to be moved into the bb-com-extension.
   * @returns 
   */
  loadTypes(): ComType[] {
    const types: ComType[] = []

    // Check for com types in the OpenAPI document:
    if(!this.openapiDoc['x-bb-com-types']) {
      debug("No com types found in OpenAPI document.")
      return []
    }

    // Iterate over all com types in the OpenAPI document:
    Object.keys(this.openapiDoc['x-bb-com-types']).forEach( (name: string) => {
      const comType = this.openapiDoc['x-bb-com-types'][name]

      // Ensure the baud rate is a number:
      if(typeof comType.baud === 'string') {
        comType.baud = parseInt(comType.baud)
      }

      // Extract all macros that specify this com type by name:
      const macros = {} as {[method: string]: ComMacro[]}
      Object.values(this.openapiDoc.paths).forEach( (path: any) => {
        Object.keys(path)
        .filter(method => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
        .filter(method => path[method]['x-bb-com-macro'])
        .forEach(method => {
          if(!path[method]['x-bb-com-macro'].commands ||
            !path[method]['x-bb-com-macro'].responses ||
            path[method]['x-bb-com-macro'].commands.length !== path[method]['x-bb-com-macro'].responses.length) 
          {
            throw new Error('x-bb-com-macro commands and responses must be arrays of the same length in openapi.json at path '+path+'/'+method+'.')
          }
          if(!path[method].operationId) {
            throw new Error(`OperationId missing for method ${method} at path ${path} in openapi.json.`)
          }
          macros[path[method].operationId] = (path[method]['x-bb-com-macro'].commands as string[]).map((c, i) => (
            new ComMacro(c, new RegExp(path[method]['x-bb-com-macro'].responses[i].replace(/^\/|\/$/g, ''), 'gm'))
          ))
        })
      })

      // Init macro:
      if(!comType.initCommands || comType.initCommands.length === 0) {
        throw new Error(`Com type '${name}' is missing init commands.`)
      }
      if(!comType.initResponses || comType.initResponses.length === 0) {
        throw new Error(`Com type '${name}' is missing init responses.`)
      }
      if(comType.initCommands.length !== comType.initResponses.length) {
        throw new Error(`Com type '${name}' init commands and responses must be arrays of the same length.`)
      }
      macros.init = []
      comType.initCommands.forEach((cmd: string, i: number) => {
        // Extract flags and strip slashes if present:
        let response = comType.initResponses[i] as string
        let flags = ''
        if(response.startsWith('/')) {
          const lastSlash = response.lastIndexOf('/')
          if(lastSlash < response.length - 1) {
            flags = response.substring(lastSlash + 1)
          }
          response = response.substring(1, lastSlash)
        }

        // Add the macro:
        macros.init.push(
          new ComMacro(
            cmd,
            new RegExp(response, flags)
          )
        )
      })
      
      // Add the com type:
      types.push(new ComType(
        name,
        comType.baud,
        macros as {[method: string]: ComMacro[], init: ComMacro[]},
        comType.startupDelay
      ))
      debug(`Loaded com type ${comType.toString()}`);
    })
    return types
  }
}
