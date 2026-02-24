import CliConfig from "./CliConfig.js"
import ServerManager from "./ServerManager.js"
import Types from './Types.js'
import { logem, logerror, logp } from "./logging.js"
import fs from "fs"
import path from "path"
import { createRequire } from "module"
import { defaultFormat, printKeyValuePairs } from "./print-helper.js"

const require = createRequire(import.meta.url)

export interface Extension {
    getConfig(): {name: string, types: string[]}
    add?(type: string): Promise<void> | void
    update?(type: string): Promise<void> | void
    delete?(type: string): Promise<void> | void
    list?(type: string): Promise<void> | void
    generate?(type: string): Promise<void> | void
}

export interface ExtensionConfig {
    path: string
    name: string
    types: {[key: string]: string}
    commands: string[]
}

export default class ExtensionManager {
    constructor(
        private config: CliConfig,
        private serverManager: ServerManager
    ) {}
    
    async add(_: string, overwrite = false) {
        if(!this.config.file && !this.config.path) {
            logerror("Please provide a javascript source file with -f or --file, or provide a package with -p.")
            return
        }

        if(this.config.file && this.config.path) {
            logerror("Please provide either a javascript source file with -f or --file, or a package with -p, but not both.")
            return
        }

        const extensionDefinition: any = {}
        let extModule
        if(this.config.path) {
            // Load from module:
            try {
                // Try to resolve the package from project directory:
                const searchPaths = [process.cwd()]
                const resolvedPath = require.resolve(this.config.path, { paths: searchPaths })
                extensionDefinition.path = resolvedPath
                extModule = await import(resolvedPath)
            } catch (e) {
                logerror("Could not resolve package "+this.config.path)
                return
            }
        } else {
            // Load from file:
            const srcPath = path.resolve(this.config.file as string)
            if(!fs.existsSync(srcPath)) {
                logerror("File "+srcPath+" not found.")
                return
            }
            extModule = await import("file://"+srcPath)
        }

        // Load the file and create an instance to get the config:
        const constructorFunc = typeof extModule.default === 'function' ? extModule.default : extModule.default?.default
        if(typeof constructorFunc !== 'function') {
            logerror("No default export found in extension file.")
            return
        }
        const instance = new constructorFunc()
        if(typeof instance.getConfig !== 'function') {
            logerror("Extension class does not have a getConfig() method.")
            return
        }
        const config = instance.getConfig()
        if(!config?.name) {
            logerror("Extension does not provide a name.")
            return
        }
        if(!config?.types) {
            logerror("Extension does not provide any types.")
            return
        }
        Object.assign(extensionDefinition, config)

        // If a file was provided, copy it into the .bb/extensions directory (creating it if it doesn't exist) 
        // Set the path in the config to point to the new location. 
        // If an extension with the same file already exists, either overwrite it (if --overwrite is provided) or return an error.
        if(this.config.file) {
            if(!this.serverManager.bbDoc.extensions) this.serverManager.bbDoc.extensions = []
            let destPath = path.resolve(".bb/extensions/"+config.name+'-'+this.config.file.split("/").pop())
            extensionDefinition.path = destPath

            if(Object.values(this.serverManager.bbDoc.extensions).some((v: any) => v.path === destPath)) {
                if(overwrite) {
                    // Delete the file so we can copy the new one:
                    fs.unlinkSync(destPath)

                    // Remove from blackbox.json so we can re-add it:
                    this.serverManager.bbDoc.extensions = this.serverManager.bbDoc.extensions.filter((v: any) => v.path !== destPath)
                } else {
                    logerror("Extension for file "+this.config.file+" already exists.")
                    return
                }
            } else if(overwrite) {
                logerror("No existing extension for file "+this.config.file+" found to update.")
                return
            }

            // Copy the file into the .bb/extensions directory:
            const srcPath = path.resolve(this.config.file as string)
            fs.mkdirSync(".bb/extensions", { recursive: true })
            fs.copyFileSync(srcPath, destPath)
        }

        // Check that the extension is a valid class:
        // const extModule = await import("file://"+srcPath)
        // let config
        // if(!extModule.default) {
        //     logerror("No default export found in extension file.")
        //     return
        // }

        // Create an instance of the class to get its config:
        // let extInstance
        // try {
        //     extInstance = new extModule.default()
        // } catch (e) {}
        // if(!extInstance) {
        //     try {
        //         extInstance = new extModule.default.default()
        //     } catch (e) {
        //         logerror("Could not create an instance of the extension class.")
        //         return
        //     }
        // }
        
        // if(typeof extInstance.getConfig !== 'function') {
        //     logerror("Extension class does not have a getConfig() method.")
        //     return
        // }
        // config = extInstance.getConfig()
        // if(!config?.name) {
        //     logerror("Extension does not provide a name.")
        //     return
        // }
        // if(!config?.types) {
        //     logerror("Extension does not provide any types.")
        //     return
        // }

        // Get all available commands:
        const commands = ['add', 'update', 'delete', 'list', 'generate']
            .filter(m => typeof constructorFunc.prototype[m] === 'function')
        extensionDefinition.commands = commands
 
        logp(`Found extension ${config.name} `+
            `with type(s) ${Object.keys(config.types).join(', ')}`+
            ` and command(s) ${commands.join(', ')}`+
            (config.options ? ` and option(s) ${Object.keys(config.options).join(', ')}.` : '.')
        )
        
        // Add extension to the blackbox.json file:
        this.serverManager.bbDoc.extensions.push(extensionDefinition)
        this.serverManager.writeConfigJson()
        logem("Extension added from file "+this.config.file)
    }

    update() {
        this.add('extension', true)
    }

    list() {
        if(!fs.existsSync("blackbox.json")) {
            logerror("No blackbox.json file found in the current directory.")
            return
        }
        let bbConfig = JSON.parse(fs.readFileSync("blackbox.json", "utf-8"))
        if(!bbConfig.extensions || bbConfig.extensions.length <= 0) {
            logp("No extensions found in blackbox.json.")
            return
        }
        bbConfig.extensions.forEach((ext: any) => {
            logp(`${ext.name} (${ext.description}):`)
            Object.keys(ext.types).forEach( (type: string) => {
                logp(`    (${ext.commands.join('|')}) ${type} - ${ext.types[type]}`)
            })
        })
    }

    async getManager(type: string): Promise<Extension | null> {
        if(!this.serverManager.bbDoc.extensions || this.serverManager.bbDoc.extensions.length <= 0) {
            return null
        }
        
        for(const extInfo of this.serverManager.bbDoc.extensions) {
            if(Object.keys(extInfo.types).includes(type)) {
                if(!fs.existsSync(extInfo.path)) { 
                    logerror("Extension file "+extInfo.path+" not found.")
                    return null
                }
                const extModule = await import("file://"+extInfo.path)
                if(!extModule.default) {
                    logerror("No default export found in extension file "+extInfo.path)
                    return null
                }
                
                const extInstance = new extModule.default(this.config, this.serverManager.bbDoc, this.serverManager.openapiDoc)
                return extInstance
            }
        }
        return null
    }

    async printExtensionTypes(
        indent = "", 
        format = defaultFormat
    ) {
        if(!this.serverManager.bbDoc.extensions || this.serverManager.bbDoc.extensions.length <= 0) {
            return ""
        }
        
        const pairs = {} as {[key: string]: string}
        this.serverManager.bbDoc.extensions
            .forEach( (ext: ExtensionConfig) => Object.assign(pairs, ext.types) )
        
        return printKeyValuePairs(pairs)(indent, format)
    }
}