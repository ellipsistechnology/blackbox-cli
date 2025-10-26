import {serviceClass, autowired, named, taggedService, factory} from 'ellipsis-ioc'
import { SerialPort } from 'serialport';

class ComType {
  constructor(
    public name: string,
    public baud: number,
    public initCommand: string,
    public initResponse: RegExp
  ) {}
}

class ComMacro {
  constructor(
    public command: string,
    public response: RegExp
  ) {}
}

class ComPort {
  state: 'busy' | 'closed' | 'background' | 'connecting' = 'closed'
  type: ComType | null = null
  private port: SerialPort | null = null
  lastError: string | null = null
  timeout: number = 5000
  private readMatch?: RegExp
  private readComplete = false
  private buffer: string = '' // TODO replace with Buffer

  // General port info:
  manufacturer?: string
  serialNumber?: string
  pnpId?: string
  locationId?: string
  productId?: string
  vendorId?: string

  constructor(public path: string) {}

  toString() {
    return `ComPort(path=${this.path}, state=${this.state}${this.type?', type=':''}${this.type ? this.type?.name:''}${this.lastError?', lastError=':''}${this.lastError ? this.lastError:''})`
  }

  async setType(type: ComType) {
    try {
      await this.connect(type.baud) // throws an error if connection fails
      await this.write(type.initCommand + '\n')
      await this.read(type.initResponse)
      if(this.readComplete) {
        this.type = type
      }
    } finally {
      await this.close()
    }
  }

  /**
   * Opens the serial port with either the given baud rate or the baud rate
   * set in the ComPort's type. Once successfully open the port will be in 
   * the background state and may be used to write and read.
   * @param baud The Baud rate.
   * @returns A Promise.
   */
  async connect(baud?: number): Promise<void> {
    if(!baud && !this.type) {
      throw new Error('No baud rate set while trying to connect. Either pass the baud rate to the connect function or set a ComType first.')
    }
    if(!baud) {
      baud = this.type!.baud
    }
    this.state = 'connecting'

    this.port = new SerialPort({ 
      path: this.path, 
      baudRate: baud, 
      autoOpen: false 
    })
    
    this.port.on('error', this.receiveError.bind(this))
    this.port.on('data', this.receiveData.bind(this))

    return new Promise<void>((resolve, reject) => {
      this.port!.open((err: Error|null) => {
        if (err) {
          this.state = 'closed'
          this.lastError = err.message
          reject(err)
          return
        }
        // this.resetResponse()
        
        // Successfully opened:
        console.log(`Connected to com port ${this.path}.`)
        
        resolve()
        this.state = 'background'
      })
    })
  }

  /**
   * Read from the serial port until either the given pattern is 
   * matched in the read data or the ComPort's timeout is reached.
   * @param match The RegExp to match against read data.
   * @returns The read data.
   */
  async read(match: RegExp): Promise<string> {
    let time = Date.now()
    this.readMatch = match
    this.buffer = ''
    this.lastError = null
    this.readComplete = false
    return new Promise<string>((resolve, reject) => {
      const checkCompletion = () => {
        if( Date.now() - time > this.timeout) {
          reject(new Error(`Timeout after ${this.timeout}ms`))
          return
        }
        if (this.readComplete) {
          resolve(this.buffer.trim())
        } else if (this.lastError) {
          reject(new Error(this.lastError))
        } else {
          setTimeout(checkCompletion, 100)
        }
      }
      checkCompletion()
    })
  }

  /**
   * Writes the given command string to the serial port.
   * @param command The command to write.
   * @returns A Promise.
   */
  async write(command: string): Promise<void> {
    if(!this.port || !this.port.isOpen) {
      throw new Error('Port not open. Please open the port via the connect function before attempting to write.')
    }

    // Asynchronously write data to the port:
    return new Promise((resolve, reject) => {
      this.port!.write(command, (err) => {
        if (err) {
          this.lastError = err.message
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  /**
   * Closes the port. If successfully closed, the port's state will
   * be closed.
   * @returns A Promise.
   */
  async close() {
    return new Promise<void>((resolve, reject) => {
      this.port?.close((err) => {
        if(!this.port!.isOpen) {
          this.port = null
          this.state = 'closed'
        }
        if(err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  send(macros: ComMacro) {

  }

  receiveError(err: Error) {
    console.error(`Error on port ${this.path}: ${err.message}`)
    this.lastError = err.message

    if(this.port?.isOpen) {
      // If the error did not close the port, then return to background processing:
      this.state = 'background'
    } else {
      // If the error closed the port, then set state to closed
      // and remove the SerialPort if needed:
      this.state = 'closed'
      if(this.port) {
        this.close()
      }
    }
  }

  receiveData(data: Buffer) {
    console.log(`Data received on port ${this.path}: ${data.toString()}`)

    // Log 
    if(this.state === 'background') {
      return // TODO
    }

    // Read until pattern matched or timed out:
    if(this.state === 'busy') {
      if(!this.readMatch) {
        this.lastError = 'State was busy reading data but no read RegExp was found to check for completion.'
        return
      }
      this.buffer += data.toString()
      if(this.readMatch.test(this.buffer)) {
        this.state = 'background'
        this.readComplete = true
      }
    }
  }
}

// class _Initialiser {
//   @autowired('com-manager')
//   comManager!: ComManager

//   @taggedService('init', 'com-manager')
//   init() {
//     this.comManager.loadTypes()
//     .then(() => this.comManager.scanPorts())
//     .catch((err) => console.error("Error initializing ComManager: ", err))
//   }
// }

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
    .then(() => this.scanPorts())
    .catch((err) => console.error("Error initializing ComManager: ", err))
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
              console.log(`Failed to add type to port: ${port.toString()}`);
              
              continue
            }
          }
        })
        console.log(`Found ports: \n\t${this.ports.map(p => p.toString()).join(',\n\t')}`);
    } catch (error: any) {
        console.error(`Error scanning serial ports: ${error.message}`)
    }
  }

  async loadTypes(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        Object.values(this.openapiDoc.paths).forEach( (path:any) => {
          if(path['x-bb-com-type']) {
            let baud = path['x-bb-com-type'].baud
            if(typeof baud === 'string') {
              baud = parseInt(baud)
            }
            const comType = new ComType(
              path['x-bb-com-type'].name,
              baud,
              path['x-bb-com-type'].initCommand,
              new RegExp(path['x-bb-com-type'].initResponse)
            )
            this.types.push(comType)
          }
        })
        resolve()
      } catch(err) {
        reject(err)
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
  
  getComm(): any[] {
    // Get the comm definitions from the OpenAPI doc:
    // return this.openapiDoc.paths
    // .filter((path:any) => path['x-bb-com-service'])
    // .reduce((acc:any[], path:any) => {
    //   acc.push(Object.values(path).)
    //   return acc
    // }, [])
    return []
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
