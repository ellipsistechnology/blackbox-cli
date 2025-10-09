import CliConfig from './CliConfig.js'
import fs from 'fs'
import ServerManager from './ServerManager.js'

import openApiTemplate from './templates/openapi-template.json' with { type: "json" }
import {CONFIG_FILENAME, OPENAPI_FILENAME} from './ServerManager.js'
import {logh1, logcode, logem, logp, logerror, em, p, code, file} from './logging.js'

const VERSION = '0.1.0'

export default class Initialiser {
  options:CliConfig

  constructor(opts:CliConfig) {
    this.options = opts
  }

  init() {
    if(fs.existsSync(CONFIG_FILENAME)) {
      logerror(`${CONFIG_FILENAME} file already exists. Has your project already been initialised?`)
      return
    }
    if(fs.existsSync(OPENAPI_FILENAME)) {
      logerror(`${OPENAPI_FILENAME} file already exists. Has your project already been initialised?`)
      return
    }

    // Setup config files:
    if(this.initBlackbox() && this.initOpenAPI()) {
      logem(`Blackbox project successfully initialised.`)
    }
  }

  initBlackbox():boolean {
    try {
      fs.writeFileSync(
        CONFIG_FILENAME,
`\{
  "name": "${this.options.name}"
\}
`
      )
    }
    catch(err) {
      logerror(`An error occured while writing to ${CONFIG_FILENAME}: ${err}`)
      return false
    }
    logp(`Created ${file(CONFIG_FILENAME)}`)
    return true
	}

  initOpenAPI():boolean {
    this.addInfo(openApiTemplate.info)
    new ServerManager(this.options).writeApiJson() // WARNING: ApiManager must be created here since the blackbox config will not have been created in advance

    logp(`Created ${file(OPENAPI_FILENAME)}`)
    return true
	}

	addInfo(info:any) {
		// info.version = VERSION // TODO allow this to be set by the user
    if(this.options.title && this.options.title !== '') {
		  info.title = this.options.title
    }
		if(this.options.description && this.options.description !== '')
			info.description = this.options.description
	}
}
