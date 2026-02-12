import {serviceClass, autowired, named, taggedService, factory} from 'ellipsis-ioc'
import { SerialPort } from 'serialport';
import { ComType } from './ComType.js';
import { ComMacro } from './ComMacro.js';
import { ComPort } from './ComPort.js';

@named('com-manager')
class ComManager {
  ports: ComPort[] = []
  types: ComType[] = []

  @autowired('openapi-doc')
  openapiDoc:any

  constructor() {
    setTimeout(() => {
      this.init()
    }, 1000)
  }

  init() {
    this.loadTypes()
    this.scanPorts()
    .catch((err) => {
      console.error("Error initializing ComManager: ", err)
      setTimeout(() => this.init(), 1000) // retry
    })
  }

  // TODO: Allow access by ID instead of index - devices will need a name for this.
  async getComPort(typeName: string, index: number): Promise<ComPort> {
    const typePorts = this.ports.filter(p => p.type?.name === typeName)

    // Make sure the port exists and has a known type:
    if(index >= typePorts.length) {
      throw new Error(`Port with index ${index} not found. ${typePorts.length} ports found of type ${typeName}.`)
    }

    return typePorts[index]
  }

  async scanPorts(): Promise<void> {
    console.log(`Scanning serial ports...`)
    try {
        const ports = await SerialPort.list()
        ports.forEach(async p => {
          const port = new ComPort(p.path)

          port.path = p.path
          port.manufacturer = p.manufacturer
          port.serialNumber = p.serialNumber
          port.pnpId = p.pnpId
          port.locationId = p.locationId
          port.productId = p.productId
          port.vendorId = p.vendorId

          this.ports.push(port)

          // Check if the port supports one of the known com types:
          for(let type of this.types) {
            try {
              // Try to set the type:
              await port.setType(type)
              
              // If the type was set without error, then the port
              // supports this type:
              console.log(`Com port of type ${type.name} found at path ${port.path}`)
              break
            } catch(err) {
              console.log(`Failed to add type to port: ${port.toString()}`)
              continue
            }
          }
        })
        console.log(`Found ports: \n\t${this.ports.map(p => p.toString()).join(',\n\t')}`);
    } catch (error: any) {
        console.error(`Error scanning serial ports: ${error.message}`)
    }
  }

  loadTypes() {
    Object.keys(this.openapiDoc.paths).forEach( (p:any) => {
      const path = this.openapiDoc.paths[p]
      if(path['x-bb-com-type']) {
        let baud = path['x-bb-com-type'].baud
        if(typeof baud === 'string') {
          baud = parseInt(baud)
        }

        // Methd macros:
        const methods = {} as {[method: string]: any}
        Object.keys(path)
        .filter(m => ['get', 'post', 'put', 'patch', 'delete'].includes(m))
        .filter(m => path[m]['x-bb-com-macro'])
        .forEach(m => {
          if(!path[m]['x-bb-com-macro'].commands ||
            !path[m]['x-bb-com-macro'].responses ||
            path[m]['x-bb-com-macro'].commands.length !== path[m]['x-bb-com-macro'].responses.length) 
          {
            throw new Error(`x-bb-com-macro commands and responses must be arrays of the same length in openapi.json at path ${p}.`)
          }
          methods[m] = (<string[]>path[m]['x-bb-com-macro'].commands).map((c, i) => (
            new ComMacro(c, path[m]['x-bb-com-macro'].responses[i])
          ))
        })

        // Init macro:
        path['x-bb-com-type'].initCommands.forEach((cmd: string, i: number) => {
          if(!methods.init) {
            methods.init = []
          }
          methods.init.push(
            new ComMacro(
              cmd,
              new RegExp(path['x-bb-com-type'].initResponses[i].replace(/^\/|\/$/g, '')) // remove leading and trailing slashes
            )
          )
        })
        if(!methods.init) {
          throw new Error(`Com type at path ${p} is missing init commands.`)
        }

        const comType = new ComType(
          path['x-bb-com-type'].name,
          baud,
          methods as {[method: string]: ComMacro[], init: ComMacro[]}
        )
        console.log(`Loaded type ${comType.toString()}`);
        
        this.types.push(comType)
      }
    })
  }
}

@serviceClass('comm')
export class CommService {

  @autowired('openapi-doc')
  openapiDoc:any

  @autowired('com-manager')
  comManager!: ComManager

  constructor() {
  }
  
  // TODO: This is for a unique service, allow returning a list in template.
  async getComm(): Promise<string> {
    const port = await this.comManager.getComPort('com1', 0)
    const responses = await port.send('get')
    return responses[0]
  }

  createComm({data}: {data: any}): void {
    throw new Error(`createComm not yet implemented.`)
  }

  replaceComm({data}: {data: any}): void {
    throw new Error(`replaceComm not yet implemented.`)
  }

  updateComm({data}: {data: any}): void {
    throw new Error(`updateComm not yet implemented.`)
  }

  deleteComm(): void {
    throw new Error(`deleteComm not yet implemented.`)
  }
}
