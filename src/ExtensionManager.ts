import CliConfig from "./CliConfig.js"
import ServerManager from "./ServerManager.js"
import Types from './Types.js'
import { logem, logerror, logp } from "./logging.js"
import fs from "fs"
import path from "path"
import { defaultFormat, printKeyValuePairs } from "./print-helper.js"

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
        if(!this.config.file) {
            logerror("Please provide a javascript source file with -f or --file.")
            return
        }

        // Get the full path to the file:
        const srcPath = path.resolve(this.config.file)
        if(!fs.existsSync(srcPath)) {
            logerror("File "+srcPath+" not found.")
            return
        }

        // Load the file and create an instance to get the config:
        const extModule = await import("file://"+srcPath)
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

        // Check if the extension has already been added:
        if(!this.serverManager.bbDoc.extensions) this.serverManager.bbDoc.extensions = []
        let destPath = path.resolve(".bb/extensions/"+config.name+'-'+this.config.file.split("/").pop())

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
        fs.mkdirSync(".bb/extensions", { recursive: true })
        fs.copyFileSync(srcPath, destPath)

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
 
        logp(`Found extension ${config.name} `+
            `with type(s) ${Object.keys(config.types).join(', ')}`+
            ` and command(s) ${commands.join(', ')}`+
            (config.options ? ` and option(s) ${Object.keys(config.options).join(', ')}.` : '.')
        )

        // Add extension to the blackbox.json file:
        this.serverManager.bbDoc.extensions.push({
            ...config,
            commands,
            path: destPath
        })
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