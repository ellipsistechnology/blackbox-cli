import {serviceClass, autowired, named, taggedService, factory} from 'ellipsis-ioc'
import { SerialPort } from 'serialport';

class ComType {
  constructor(
    public name: string,
    public baud: number,
    public methods: {
      init: ComMacro[],
      [method: string]: ComMacro[]
    }
  ) {}

  toString() {
    return `ComType(name='${this.name}', baud=${this.baud})`
    + `[${Object.entries(this.methods).map(([m, macros]) => (
      `\n\t${m}: [${macros.map(cm => cm.toString()).join(', ')}]`
    )).join('')}\n]`
  }
}

class ComMacro {
  constructor(
    public command: string,
    public response: RegExp
  ) {}

  toString() {
    return `ComMacro(command='${this.command}', response=${this.response.toString()})`
  }
}

class ComPort {
  private port: SerialPort | null = null
  private readMatch?: RegExp
  private readComplete = false
  private buffer: string = '' // TODO replace with Buffer

  state: 'busy' | 'closed' | 'background' | 'connecting' = 'closed'
  type: ComType | null = null
  lastError: string | null = null
  timeout: number = 5000 // TODO: Allow setting this at the service level and at the method level.
  lineEnding: string = '\n' // TODO: Allow setting this at the service level and at the method level.

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
      await this.send(type.methods.init)
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
      this.port!.write(command+this.lineEnding, (err) => {
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

  async waitUntilAvailable(): Promise<void> {
    // Already available:
    if(this.state === 'background') {
      return
    }

    // If port is not connected then connect:
    if(this.state === 'closed') {
      await this.connect()
    }

    // If currently connecting, first wait until connected:
    let attempt = 0
    while(this.state === 'connecting' && attempt < 10) {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 100))
      attempt++
    }
    if(this.state === 'connecting') {
      throw new Error(`Timeout while waiting for connection to complete.`)
    }

    // If busy, wait until available:
    attempt = 0
    while(this.state === 'busy' && attempt < 10) {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 500))
      attempt++
    }
  }

  /**
   * Executes the given macros while the responses are matched.
   * After execution the com port's state will be 'background'.
   * @param macros The array of macros to execute.
   * @return An array of the responses from each command.
   */
  async send(macros: string): Promise<string[]>;
  async send(macros: ComMacro[]): Promise<string[]>;
  async send(macros: ComMacro[]|string): Promise<string[]> {
    if(!this.type) {
      throw new Error(`Cannot send to com port ${this.path} without a type.`)
    }
    if(typeof macros === 'string') {
      return this.send(this.type.methods[macros])
    }

    // Ensure correct state:
    if(this.state === 'busy') {
      throw new Error(`Com port ${this.path} is busy.`)
    }
    if(this.state === 'connecting') {
      throw new Error(`Com port not read - please wait for connection to complete before sending.`)
    }
    if(this.state === 'closed') {
      throw new Error(`Com port is closed - please connect before sending.`)
    }

    // Wait for port the become available:
    await this.waitUntilAvailable()

    // Execute each macro in turn:
    const responses = []
    for(let macro of macros) {
      this.state = 'busy'
      await this.write(macro.command)
      responses.push(await this.read(macro.response))
    }

    return responses
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

    // Read until pattern matched:
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
