import {serviceClass, autowired} from 'ellipsis-ioc'
import { ComManager } from 'ellipsis-com'
import { enableDebug as enableComManagerDebug } from 'ellipsis-com/dist/ComManager.js'
import { enableDebug as enableComPortDebug } from 'ellipsis-com/dist/ComPort.js'

enableComManagerDebug(true)
enableComPortDebug(true)

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
    const port = this.comManager.getComPort('com1', 0)
    const responses = await port.send('getComm')
    return responses[0]
  }

  async createComm({data}: {data: any}): Promise<string> {
    const port = this.comManager.getComPort('com1', 0)
    const responses = await port.send('createComm', {data})
    return responses[0]
  }

  async deleteComm(): Promise<string> {
    const port = this.comManager.getComPort('com1', 0)
    const responses = await port.send('deleteComm')
    return responses[0]
  }
}
