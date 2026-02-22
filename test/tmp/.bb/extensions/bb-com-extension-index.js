import * as __WEBPACK_EXTERNAL_MODULE_fs__ from "fs";
/******/ var __webpack_modules__ = ({

/***/ "fs"
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
(module) {

module.exports = __WEBPACK_EXTERNAL_MODULE_fs__;

/***/ },

/***/ "./dist/src/ComLoaderTemplate.js"
/*!***************************************!*\
  !*** ./dist/src/ComLoaderTemplate.js ***!
  \***************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
    return `import { ComManager, ComType, ComMacro } from 'ellipsis-com'
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
      debug(\`Loaded com type \${comType.toString()}\`);
    })
    return types
  }
}
`;
}


/***/ }

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
/******/ 	// Check if module exists (development only)
/******/ 	if (__webpack_modules__[moduleId] === undefined) {
/******/ 		var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 		e.code = 'MODULE_NOT_FOUND';
/******/ 		throw e;
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
/* harmony import */ var _src_ComLoaderTemplate_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./src/ComLoaderTemplate.js */ "./dist/src/ComLoaderTemplate.js");


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
                '--method <string>': 'The HTTP method to use (GET, POST, etc.) for a macro.',
                '--startup-delay <number>': 'Optional delay in milliseconds to wait after opening the port before sending the init commands, to allow devices extra time to boot up.'
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
            startupDelay: this.config.startupDelay,
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
        // Create ComManager.ts if it doesn't exist:
        if (!fs__WEBPACK_IMPORTED_MODULE_0__["default"].existsSync('gensrc/ComLoader.ts')) {
            fs__WEBPACK_IMPORTED_MODULE_0__["default"].writeFileSync('gensrc/ComLoader.ts', (0,_src_ComLoaderTemplate_js__WEBPACK_IMPORTED_MODULE_1__["default"])());
            logp("Generated gensrc/ComLoader.ts for serial communications.");
        }
        // Add ellipsis-com to package.json dependencies if not already present:
        const packageJson = JSON.parse(fs__WEBPACK_IMPORTED_MODULE_0__["default"].readFileSync('package.json', 'utf-8'));
        if (!packageJson.dependencies) {
            packageJson.dependencies = {};
        }
        if (!packageJson.dependencies['ellipsis-com']) {
            packageJson.dependencies['ellipsis-com'] = '^0.1.0';
            fs__WEBPACK_IMPORTED_MODULE_0__["default"].writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
            logp("Added 'ellipsis-com' to package.json dependencies.\nPlease run 'npm install' to install the new dependency.");
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
