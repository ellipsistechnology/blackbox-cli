import CliConfig from "./CliConfig.js";
import ApiManager from './ServerManager.js'
import { logerror, logp, code, logem, file } from "./logging.js";
import {CONFIG_FILENAME, get} from './utils.js'
import { printList } from "./print-helper.js";
import fs from 'fs'
import { pathToFileURL } from "url";
// import axios from 'axios'
// import filenamifyUrl from 'filenamify-url'
// import fileUrl from 'file-url'


export interface RepoWrapper {
  uri: string
  repo: any
}

export interface Repository {
  name?: string
  file?: string
  url?: string
  data?: any
}

export default class RepositoryManager {
  serverManager: ApiManager;

  constructor(public config: CliConfig){
    this.serverManager = new ApiManager(config);
  }

  private ensureRepositories(bbDoc:any, repo:{file?:string, url?:string}) {
    if(!bbDoc.repositories) {
      bbDoc.repositories = []
    }
    bbDoc.repositories.forEach((rep:any) => {
      if(repo.file && rep.file === repo.file || repo.url && rep.url === repo.url)
        logerror(`Repository ${JSON.stringify(repo)} already exists in ${CONFIG_FILENAME}.`)
      return false
    })
    return true
  }

  async add() {
    if(this.config.file) {
      
      await this.serverManager.loadConfigJson()
      
      const repo = {
        file: this.config.file
      } as Repository
      
      if(!this.ensureRepositories(this.serverManager.bbDoc, repo)) {
        return // error already logged
      }

      if(this.config.name) {
        repo.name = this.config.name
      }

      this.serverManager.bbDoc.repositories.push(repo)
      this.serverManager.writeConfigJson()
      logem(`Successfully added repository ${file(repo.file)}.`)
    }
    else if(this.config.url) {
      await this.serverManager.loadConfigJson()

      const repo = {
        url: this.config.url
      } as Repository
      
      if(!this.ensureRepositories(this.serverManager.bbDoc, repo)) {
        return // error already logged
      }

      if(this.config.name) {
        repo.name = this.config.name
      }

      this.serverManager.bbDoc.repositories.push(repo)
      this.serverManager.writeConfigJson()
      logem(`Successfully added repository ${code(repo.url)}.`)
    }
    else {
      logerror(`Repository must be specified by either a --file or --url option.`)
    }
  }

  async update() {
    if(!this.config.file && !this.config.url) {
      logerror(`File or url must be provided for update.`)
    }

    // Set the repo name if both url and name are provided,
    // and the name is not already set in blackbox.json:
    if(this.config.url && this.config.name) {
      await this.serverManager.loadConfigJson()
      if(this.serverManager.bbDoc.repositories) {
        for(let repo of this.serverManager.bbDoc.repositories) {
          if(repo.url === this.config.url && !repo.name) {
            repo.name = this.config.name
            this.serverManager.writeConfigJson()
            logem(`Successfully set name of repository ${code(repo.url)} to ${code(repo.name)}.`)
            return
          }
        }
        logerror(`No repository with url ${code(this.config.url)} found in ${CONFIG_FILENAME}.`)
        return
      }
      logerror(`No repositories found in ${CONFIG_FILENAME}.`)
      return
    }
  }

  async list() {
    await this.serverManager.loadConfigJson()
    printList(
      this.serverManager.bbDoc.repositories
      .map((repo:any) => (
        repo.name ? repo.name+": " : '') + 
        (repo.file ? "file="+repo.file : "url="+repo.url)
      )
    )
  }

  async delete() {
    if(this.config.file === "" && this.config.url === "") {
      logerror(`File or url must be provided for delete.`)
    }

    await this.serverManager.loadConfigJson()
    let repo
    for(let i in this.serverManager.bbDoc.repositories){
      if(this.serverManager.bbDoc.repositories[i].file === this.config.file || this.serverManager.bbDoc.repositories[i].url === this.config.url) {
        repo = this.serverManager.bbDoc.repositories[i]
        this.serverManager.bbDoc.repositories = this.serverManager.bbDoc.repositories.slice(0, i).concat(this.serverManager.bbDoc.repositories.slice(i+1))
        break;
      }
    }
    this.serverManager.writeConfigJson()
    logem(`Successfully deleted repository ${code(JSON.stringify(repo))}.`)
  }

  /**
   * Loads a repository from the given path.
   */
  async loadRepositoryFromFile(path:string):Promise<any> {
    const data = await fs.promises.readFile(path)
    return JSON.parse(data.toString())
  }

  // TODO allow for authentication
  async loadRepositoryFromUrl(url:string):Promise<any> {
    // Ensure cache dir excists:
    if(!fs.existsSync('./.bb')) {
      await fs.promises.mkdir('./.bb')
    }
    if(!fs.existsSync('./.bb/repositories')) {
      await fs.promises.mkdir('./.bb/repositories')
    }

    // Create name from url:
    let path = './.bb/repositories/' + (this.config.name || url.replace(/[^a-zA-Z0-9_.]/g, '_'))
    if(!path.endsWith('.json')) {
      path += '.json'
    }

    // Load from cache:
    let repo
    if(fs.existsSync(path)) {
      repo = await this.loadRepositoryFromFile(path)
    }

    // If not in cache then load from URL:
    if(!repo) {
      logp(`Downloading repository from ${code(url)}...`)
      const response = await get(url)

      if(response.status !== 200)
        throw new Error(`Download failed: status ${response.status} ${response.statusText}.`)

      if(!response.headers['content-type'].includes('application/json')
          && !response.headers['content-type'].includes('text/plain'))
        throw new Error(`Invalid response content type '${response.headers['content-type']}' received from ${url}.`)

      repo = response.data

      logp(`Download complete.`)
      await fs.promises.writeFile(path, JSON.stringify(repo))
    }

    return repo
  }

  /**
   * Searches repositories for the given datatype.
   * @return A DataTypeWrapper containing the repository's URI and the datatype.
   */
  async findRepositoryForDatatype(datatype: string): Promise<RepoWrapper|undefined> {
    await this.serverManager.loadConfigJson();
    if(!this.serverManager.bbDoc.repositories) {
      return undefined
    }

    for(let repo of this.serverManager.bbDoc.repositories) {
      let data:any

      if(repo.file) {
        data = await this.loadRepositoryFromFile(repo.file)
      }
      else if(repo.url) {
        data = await this.loadRepositoryFromUrl(repo.url)
      }

      if(!data) {
        logerror(`Invalid repository found in ${CONFIG_FILENAME}: ${JSON.stringify(repo)}`)
      }
      else if(data[datatype]) {
        return {
          uri: repo.url ? repo.url : pathToFileURL(repo.file).toString(),
          repo: data
        }
      }
    }
    return undefined
  }
}
