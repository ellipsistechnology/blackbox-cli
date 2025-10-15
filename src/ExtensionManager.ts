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
    constructor(private config: CliConfig) {}
    
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

        // Check if the extension has already been added:
        // let bbConfig = JSON.parse(fs.readFileSync("blackbox.json", "utf-8"))
        const serverManager = new ServerManager(this.config)
        await serverManager.loadConfigJson()
        if(!serverManager.bbDoc.extensions) serverManager.bbDoc.extensions = []
        let destPath = path.resolve(".bb/extensions/"+this.config.file.split("/").pop())
        if(Object.values(serverManager.bbDoc.extensions).some((v: any) => v.path === destPath)) {
            if(overwrite) {
                // Delete the file so we can copy the new one:
                fs.unlinkSync(destPath)

                // Remove from blackbox.json so we can re-add it:
                serverManager.bbDoc.extensions = serverManager.bbDoc.extensions.filter((v: any) => v.path !== destPath)
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
        const extModule = await import("file://"+srcPath)
        let config
        if(!extModule.default) {
            logerror("No default export found in extension file.")
            return
        }

        // Create an instance of the class to get its config:
        const extInstance = new extModule.default()
        if(typeof extInstance.getConfig !== 'function') {
            logerror("Extension class does not have a getConfig() method.")
            return
        }
        config = extInstance.getConfig()
        if(!config?.name) {
            logerror("Extension does not provide a name.")
            return
        }
        if(!config?.types) {
            logerror("Extension does not provide any types.")
            return
        }

        // Get all available commands:
        const commands = ['add', 'update', 'delete', 'list', 'generate']
            .filter(m => typeof extModule.default.prototype[m] === 'function')
            
        logp(`Found extension ${config.name} with type(s) ${Object.keys(config.types).join(', ')} and command(s) ${commands.join(', ')}.`)

        // Add extension to the blackbox.json file:
        serverManager.bbDoc.extensions.push({
            path: destPath,
            ...config,
            commands
        })
        serverManager.writeConfigJson()
        // fs.writeFileSync("blackbox.json", JSON.stringify(bbConfig, null, 2))
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
        const serverManager = new ServerManager(this.config)
        await serverManager.loadConfigJson()
        if(!serverManager.bbDoc.extensions || serverManager.bbDoc.extensions.length <= 0) {
            return null
        }
        
        for(const extInfo of serverManager.bbDoc.extensions) {
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
                
                const extInstance = new extModule.default()
                return extInstance
            }
        }
        return null
    }

    async printExtensionTypes(
        indent = "", 
        format = defaultFormat
    ) {
        const serverManager = new ServerManager(this.config)
        await serverManager.loadConfigJson()
        if(!serverManager.bbDoc.extensions || serverManager.bbDoc.extensions.length <= 0) {
            return ""
        }
        
        const pairs = {} as {[key: string]: string}
        serverManager.bbDoc.extensions
            .forEach( (ext: ExtensionConfig) => Object.assign(pairs, ext.types) )
        
        return printKeyValuePairs(pairs)(indent, format)
    }
}