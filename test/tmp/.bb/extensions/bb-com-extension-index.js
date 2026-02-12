import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "node:module";
const __WEBPACK_EXTERNAL_createRequire_require = __WEBPACK_EXTERNAL_createRequire(import.meta.url);
/******/ var __webpack_modules__ = ({

/***/ "./dist/src/ComManagerTemplate.js":
/*!****************************************!*\
  !*** ./dist/src/ComManagerTemplate.js ***!
  \****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
    return `import { SerialPort } from 'serialport'
import {autowired, named} from 'ellipsis-ioc'
import { NotFound, RequestTimeout } from './HttpError.js'

export class ComType {
  constructor(
    public name: string,
    public baud: number,
    public macros: {
      init: ComMacro[],
      [operationId: string]: ComMacro[]
    }
  ) {}

  toString() {
    return \`ComType(name='\${this.name}', baud=\${this.baud})\`
    + \`[\${Object.entries(this.macros).map(([m, macros]) => (
      \`\\n\t\${m}: [\${macros.map(cm => cm.toString()).join(', ')}]\`
    )).join('')}\\n]\`
  }
}

export class ComMacro {
  constructor(
    public command: string,
    public response: RegExp
  ) {}

  toString() {
    return \`ComMacro(command='\${this.command}', response=\${this.response.toString()})\`
  }
}

export class ComPort {
  private port: SerialPort | null = null
  private readMatch?: RegExp
  private readComplete = false
  private buffer: string = '' // TODO replace with Buffer

  state: 'busy' | 'closed' | 'background' | 'connecting' = 'closed'
  type: ComType | null = null
  lastError: string | null = null
  timeout: number = 5000 // TODO: Allow setting this at the service level and at the method level.
  lineEnding: string = '\\n' // TODO: Allow setting this at the service level and at the method level.

  // General port info:
  manufacturer?: string
  serialNumber?: string
  pnpId?: string
  locationId?: string
  productId?: string
  vendorId?: string

  constructor(public path: string) {}

  toString() {
    return \`ComPort(path=\${this.path}, state=\${this.state}\${this.type?', type=':''}\${this.type ? this.type?.name:''}\${this.lastError?', lastError=':''}\${this.lastError ? this.lastError:''})\`
  }

  async setType(type: ComType): Promise<boolean> {
    try {
      await this.connect(type.baud) // throws an error if connection fails
      await this.send(type.macros.init)
      if(this.readComplete) {
        this.type = type
        return true
      } else {
        return false
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
        console.log(\`Connected to com port \${this.path}.\`)
        this.state = 'background'
        resolve()
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
          reject(new RequestTimeout(\`Timeout after \${this.timeout}ms while reading from port \${this.path}.\`))
          return
        }
        if (this.readComplete) {
          resolve(this.buffer.trim())
        } else if (this.lastError) {
          reject(new Error(this.lastError))
        } else {
          setTimeout(() => {
            checkCompletion()
          }, 100)
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
      console.log(\`Port \${this.path} is closed - connecting...\`)
      await this.connect()
    }

    // If currently connecting, first wait until connected:
    let attempt = 0
    while(this.state === 'connecting' && attempt < 10) {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 100))
      attempt++
    }
    if(this.state === 'connecting') {
      throw new RequestTimeout(\`Timeout while waiting for connection to complete.\`)
    }
    console.log(\`Port \${this.path} connected.\`)

    // If busy, wait until available:
    const MAX_ATTEMPTS = 10
    attempt = 0
    while(this.state === 'busy' && attempt < MAX_ATTEMPTS) {
      console.log(\`Port \${this.path} is busy - waiting...\`)
      await new Promise<void>(resolve => setTimeout(() => resolve(), 500))
      attempt++
    }
    if(this.state === 'busy') {
      throw new RequestTimeout(\`Timeout while waiting for port to become available.\`)
    }
    console.log(\`Port \${this.path} is now available.\`)
  }

  /**
   * Executes the macros for the given method while the responses are matched.
   * After execution the com port's state will be 'background'.
   * @param operationId The operationId name to execute.
   * @param params The parameters to replace in the macro commands.
   * @return An array of the responses from each command.
   */
  async send(operationId: string, params?: {[name: string]: any}): Promise<string[]>
  
  /**
   * Executes the given macros while the responses are matched.
   * After execution the com port's state will be 'background'.
   * @param macros The array of macros to execute.
   * @param params The parameters to replace in the macro commands.
   * @return An array of the responses from each command.
   */
  async send(macros: ComMacro[], params?: {[name: string]: any}): Promise<string[]>
  
  async send(macros_operationId: ComMacro[]|string, params?: {[name: string]: any}): Promise<string[]> {
    
    if(typeof macros_operationId === 'string') {
      if(!this.type) {
        throw new Error(\`Cannot send to com port \${this.path} by operationId without a type.\`)
      }
      console.log(\`Sending macros for operationId '\${macros_operationId}' on port \${this.path}.\`)
      return this.send(this.type.macros[macros_operationId], params)
    }

    if(!macros_operationId || macros_operationId.length === 0) {
      throw new Error(\`No macros provided to send to com port \${this.path}.\`)
    }

    let macros = macros_operationId as ComMacro[]

    // Ensure correct state:
    // if(this.state === 'busy') {
    //   throw new Error(\`Com port \${this.path} is busy.\`)
    // }
    // if(this.state === 'connecting') {
    //   throw new Error(\`Com port not read - please wait for connection to complete before sending.\`)
    // }
    // if(this.state === 'closed') {
    //   throw new Error(\`Com port is closed - please connect before sending.\`)
    // }
    
    // Replace parameters in each macro command:
    if(params) {
      macros = macros.map( m => {
        let command = m.command

        // Extract all parameters in the command.
        // These have the form {param}:
        const paramRegex = \/{([^}]+)}\/gm
        let match
        const commandParams: string[] = []
        while ((match = paramRegex.exec(command)) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (match.index === paramRegex.lastIndex) {
            paramRegex.lastIndex++
          }

          // The result can be accessed through the 'match'-variable.
          match.forEach((m, groupIndex) => {
            if (groupIndex === 1) {
              commandParams.push(m)
            }
          })
        }

        // Replace each parameter with its value:
        commandParams.forEach( p => {
          const re = new RegExp(\`{\${p}}\`, 'g')
          let val

          // Resolve nested parameters:
          if(p.includes('.')) {
            val = params[p.substring(0, p.indexOf('.'))] // get top-level value
            const keys = p.split('.')
            for(let key of keys) {
              // Check for the property:
              if(val && val.hasOwnProperty(key)) {
                val = val[key as any]
              } 
              // Check if the property has an array index:
              else if(key.endsWith(']') && key.includes('[') ) {
                const arrKey = key.substring(0, key.indexOf('[')) as any
                const indexStr = key.substring(key.indexOf('[')+1, key.length-1)
                const index = parseInt(indexStr)
                if(val && val.hasOwnProperty(arrKey) && Array.isArray(val[arrKey]) && val[arrKey].length > index) {
                  val = val[arrKey][index]
                }
              } 
              // else not found.
            }
          } else {
            val = params[p]
          }
          
          command = command.replaceAll(re, val)
        })

        return new ComMacro(command, m.response)
      })
    }

    // Wait for port the become available:
    await this.waitUntilAvailable()

    // Execute each macro in turn:
    const responses = []
    for(let macro of macros) {
      this.state = 'busy'
      await this.write(macro.command)
      const response = await this.read(macro.response)
      responses.push(response)
    }

    return responses
  }

  receiveError(err: Error) {
    console.error(\`Error on port \${this.path}: \${err.message}\`)
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

      if(this.readMatch.test(this.buffer.toString().trim())) {
        this.state = 'background'
        this.readComplete = true
      }
    }
    else {
      console.error(\`Port \${this.path} received data in unexpected state '\${this.state}': \${data.toString()}\`);
    }
  }
}
  
@named('com-manager')
export class ComManager {
  ports: ComPort[] = []
  types: ComType[] = []

  @autowired('openapi-doc')
  openapiDoc:any
  
  private refreshInterval: NodeJS.Timeout | null = null

  constructor() {
    setTimeout(() => {
      this.init()
    }, 1000)
  }

  init() {
    this.loadTypes()
    this.scanPorts()
    .then(() => {
      console.log("ComManager initialized.")
      this.scheduleRefresh()
    })
    .catch((err) => {
      console.error("Error initializing ComManager: ", err)
      setTimeout(() => this.init(), 1000) // retry
    })
  }

  private scheduleRefresh() {
    if(this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
    this.refreshInterval = setInterval(() => {
      this.scanPorts()
      .catch((err) => {
        console.error("Error scanning ports: ", err)
      })
    }, 60000) // every 60 seconds
  }

  // TODO: Allow access by ID instead of index - devices will need a name for this.
  async getComPort(typeName: string, index: number): Promise<ComPort> {
    const typePorts = this.ports.filter(p => p.type?.name === typeName)

    // Make sure the port exists and has a known type:
    if(index >= typePorts.length) {
      throw new NotFound(\`Port with index \${index} not found. \${typePorts.length} ports found of type \${typeName}.\`)
    }

    return typePorts[index]
  }

  async scanPorts(): Promise<void> {
    console.log(\`Scanning serial ports...\`)
    try {
        const ports = await SerialPort.list()
        await Promise.all(ports.map(async p => {
          // Send hello message to existing ports:
          const existingPort = this.ports.find(existing => existing.path === p.path)
          if(existingPort && existingPort.type) {
            try {
              console.log(\`Sending hello message to port \${existingPort.path} of type \${existingPort.type?.name}...\`);
              await existingPort.send('init')
              console.log(\`Response received from port \${existingPort.path}.\`);
            } catch(err) {
              console.log(\`Port \${existingPort.path} of type \${existingPort.type?.name} is not responding.\`)
              
              // Close the port if open:
              if(existingPort.state !== 'closed') {
                await existingPort.close()
              }
            }

            return
          }

          // Remove existing ports of unknown type so that we can try again:
          if(existingPort && !existingPort.type) {
            console.log(\`Removing existing port \${existingPort.path} of unknown type for re-detection.\`)
            this.ports = this.ports.filter(p => p.path !== existingPort.path)
          }

          // Add new port:
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
              if(!await port.setType(type)) {
                continue
              }
              
              // If the type was set without error, then the port
              // supports this type:
              console.log(\`Com port of type \${type.name} found at path \${port.path}\`)

              // Open the port for background use:
              await port.connect()

              break
            } catch(err) {
              console.log(\`Failed to add type to port: \${port.toString()}\`)
              console.error(err)
              continue
            }
          }
        }))
        console.log(\`Com ports: \\n\\t\${this.ports.map(p => p.toString()).join(',\\n\\t')}\`);
    } catch (error: any) {
        console.error(\`Error scanning serial ports: \${error.message}\`)
    }
  }

  /**
   * Load the com types from the OpenAPI document.
   * @returns 
   */
  loadTypes() {
    if(!this.openapiDoc['x-bb-com-types']) {
      console.log("No com types found in OpenAPI document.")
      return
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
            throw new Error(\`OperationId missing for method \${method} at path \${path} in openapi.json.\`)
          }
          macros[path[method].operationId] = (path[method]['x-bb-com-macro'].commands as string[]).map((c, i) => (
            new ComMacro(c, new RegExp(path[method]['x-bb-com-macro'].responses[i].replace(/^\\/|\\/$/g, ''), 'gm'))
          ))
        })
      })

      // Init macro:
      if(!comType.initCommands || comType.initCommands.length === 0) {
        throw new Error(\`Com type '\${name}' is missing init commands.\`)
      }
      if(!comType.initResponses || comType.initResponses.length === 0) {
        throw new Error(\`Com type '\${name}' is missing init responses.\`)
      }
      if(comType.initCommands.length !== comType.initResponses.length) {
        throw new Error(\`Com type '\${name}' init commands and responses must be arrays of the same length.\`)
      }
      macros.init = []
      comType.initCommands.forEach((cmd: string, i: number) => {
        macros.init.push(
          new ComMacro(
            cmd,
            new RegExp(comType.initResponses[i].replace(/^\\/|\\/$/g, '')) // remove leading and trailing slashes
          )
        )
      })
      
      // Add the com type:
      this.types.push(new ComType(
        name,
        comType.baud,
        macros as {[method: string]: ComMacro[], init: ComMacro[]}
      ))
      console.log(\`Loaded com type \${comType.toString()}\`);
    })
  }

  async list(type: string, operationId: string, params: {[key: string]: any}): Promise<string[][]> {
    const results: string[][] = []
    const ports = this.ports.filter(p => p.type?.name === type)
    for(let index = 0; index < ports.length; index++) {
        results.push(await this.send(type, index, operationId, params))
    }
    return results
  }

  async send(type: string, index: number, operationId: string, params: {[key: string]: any}): Promise<string[]> {
    const port = await this.getComPort(type, index)
    const responses = await port.send(operationId, params)
    return responses
  }
}
`;
}


/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire_require("fs");

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!***********************!*\
  !*** ./dist/index.js ***!
  \***********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ BBComExtension)
/* harmony export */ });
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fs */ "fs");
/* harmony import */ var _src_ComManagerTemplate_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./src/ComManagerTemplate.js */ "./dist/src/ComManagerTemplate.js");


function logp(message) {
    console.log(message);
}
function logerror(message) {
    console.error(message);
}
class BBComExtension {
    config;
    bbDoc;
    openapiDoc;
    constructor(config, // CliConfig
    bbDoc, openapiDoc) {
        this.config = config;
        this.bbDoc = bbDoc;
        this.openapiDoc = openapiDoc;
    }
    getConfig() {
        return {
            name: "bb-com-extension",
            types: {
                'com-type': 'Type of serial device.',
                'com-macro': 'A macro to send over the serial link.',
                'com-utils': 'Helper utilities for accessing serial communications.'
            },
            options: {
                '--init-commands <string>': 'The serial command to send to initialise the device.',
                '--init-responses <string>': 'The expected response from the device after sending the init command, given as a regular expression.',
                '--commands <string>': 'The sequence of commands to send in the macro, separated by semicolons.',
                '--responses <string>': 'Expected responses for each command given as regular expressions, separated by semicolons.',
                '--baud <string>': 'The baud rate for the serial connection.',
                '--method <string>': 'The HTTP method to use (GET, POST, etc.) for a macro.'
            }
        };
    }
    add(type) {
        if (type === 'com-type') {
            this.addType();
        }
        else if (type === 'com-macro') {
            this.addMacro();
        }
    }
    /**
     * bb add com-type --path /serial --baud 9600 --init "INIT_CMD" --init-response "/OK/"
     */
    addType() {
        if (!this.openapiDoc['x-bb-com-types']) {
            this.openapiDoc['x-bb-com-types'] = {};
        }
        this.openapiDoc['x-bb-com-types'][this.config.name] = {
            baud: this.config.baud,
            initCommands: this.config.initCommands.split(';'),
            initResponses: this.parseResponses(this.config.initResponses)
        };
        logp(`Added com type '${this.config.name}'.`);
    }
    /**
     * bb add com-macro --path init --commands "CMD1;CMD2;CMD3" --responses "/RESP1/;/RESP2/;/RESP3/"
     */
    addMacro() {
        if (!this.config.path) {
            logerror("Please provide a path for the macro using --path.");
            return;
        }
        const openApiPath = this.blackboxToOpenapiPath(this.config.path);
        if (!openApiPath) {
            logerror(`Path ${this.config.path} not found in OpenAPI document.`);
            return;
        }
        const path = this.openapiDoc.paths[openApiPath];
        if (!path) {
            logerror(`Path ${this.config.path} not found in OpenAPI document.`);
            return;
        }
        const method = this.config.method;
        if (!method || !path[method.toLowerCase()]) {
            logerror(`Method '${method}' not found at path ${this.config.path} in OpenAPI document.`);
            return;
        }
        if (path[method.toLowerCase()]['x-bb-com-macro']) {
            logerror(`A com macro already exists at path ${this.config.path} for method ${method}.`);
            return;
        }
        if (!this.config.commands || !this.config.responses) {
            logerror("Please provide both commands and responses for the macro using --commands and --responses.");
            return;
        }
        const macroDef = {
            name: this.config.name,
            commands: this.config.commands.split(';'),
            responses: this.parseResponses(this.config.responses)
        };
        path[method.toLowerCase()]['x-bb-com-macro'] = macroDef;
        logp(`Added com macro at path '${this.config.path}' with ${macroDef.commands.length} command(s).`);
    }
    /**
     * Extract the responses as regular expressions.
     * Responses will be in the form: /response1/;/response2/;/response3/
     * @param responsesStr
     * @returns
     */
    parseResponses(responsesStr) {
        if (!responsesStr.startsWith('/') || !responsesStr.endsWith('/')) {
            logerror("Responses must be provided as regular expressions enclosed in slashes (/).");
            return [];
        }
        return responsesStr.substring(1, responsesStr.length - 1).split('/;/').map((resp) => resp.trim());
    }
    delete(type) {
        console.log(`Deleting com of type '${type} - NOT YET IMPLEMENTED.`);
    }
    blackboxToOpenapiPath(bbPath) {
        for (let p in this.openapiDoc.paths) {
            if (p.replaceAll(/\{[^}]+\}/gm, '#') === bbPath) {
                return p;
            }
        }
        return undefined;
    }
    generate(type) {
        if (type !== 'com-utils') {
            logerror(`Generation for type '${type}' not supported.`);
            return;
        }
        // Create ComPort.ts if it doesn't exist:
        if (!fs__WEBPACK_IMPORTED_MODULE_0__.existsSync('gensrc/ComPort.ts')) {
            fs__WEBPACK_IMPORTED_MODULE_0__.writeFileSync('gensrc/ComManager.ts', (0,_src_ComManagerTemplate_js__WEBPACK_IMPORTED_MODULE_1__["default"])());
            logp("Generated gensrc/ComPort.ts for serial communications.");
        }
        // Add serialport to package.json dependencies if not already present:
        const packageJson = JSON.parse(fs__WEBPACK_IMPORTED_MODULE_0__.readFileSync('package.json', 'utf-8'));
        if (!packageJson.dependencies) {
            packageJson.dependencies = {};
        }
        if (!packageJson.dependencies['serialport']) {
            packageJson.dependencies['serialport'] = '^13.0.0';
            fs__WEBPACK_IMPORTED_MODULE_0__.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
            logp("Added 'serialport' to package.json dependencies.\nPlease run 'npm install' to install the new dependency.");
        }
        /*
                // Generate services for each path with a com-type:
                Object.keys(this.openapiDoc.paths).forEach( path => {
        
                    // Skip if the service file already exists:
                    const serviceName = path.substring(path.lastIndexOf('/')+1)
                    const serviceFileName = `src/${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service.ts`
                    if(fs.existsSync(serviceFileName)) {
                        logp(`Service file ${serviceFileName} already exists - skipping generation.`)
                        return
                    }
        
                    const parentPathObj = this.openapiDoc.paths[path]
                    const comType = parentPathObj['x-bb-com-type']
                    if(!comType) {
                        return
                    }
        
                    // Extract methods for the parent service node:
                    const methods = Object.keys(parentPathObj)
                        .filter((method: string) => ['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase()))
                        .reduce((methods: any[], method) => {
                            if (parentPathObj[method]['x-bb-com-macro']) {
                                const operationId = parentPathObj[method].operationId
                                methods.push({
                                    path,
                                    method,
                                    operationId
                                })
                            }
                            return methods
                        }, [])
        
                    // Extract methods for the child object nodes:
                    if(parentPathObj['x-bb-service']?.access !== 'unique') {
                        Object.keys(this.openapiDoc.paths)
                            .filter( p => p.startsWith(path+'/') ) // child nodes
                            .forEach( p => {
                                const pathObj = this.openapiDoc.paths[p]
                                Object.keys(pathObj)
                                .filter((method: string) => ['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase()))
                                .filter( method => !pathObj[method]['x-bb-com-macro']?.name || pathObj[method]['x-bb-com-macro'].name === comType.name) // Either the name is not specific (default to parent) or it matches the com-type name of the parent.
                                .forEach( method => {
                                    if (pathObj[method]['x-bb-com-macro']) {
                                        const operationId = pathObj[method].operationId
                                        methods.push({
                                            path: p,
                                            method,
                                            operationId
                                        })
                                    }
                                })
                            })
                    }
        
                    // Generate service code:
                    const serviceCode = serviceTemplate(this.openapiDoc, {
                        serviceName,
                        bbName: comType.name,
                        methods: methods
                    })
        
                    // Write service file:
                    fs.writeFileSync(serviceFileName, serviceCode)
                    logp(`Generated com service class ${serviceFileName}.`)
                })*/
    }
}

})();

const __webpack_exports__default = __webpack_exports__["default"];
export { __webpack_exports__default as default };
