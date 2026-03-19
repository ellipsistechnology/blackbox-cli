import {serviceClass, autowired} from 'ellipsis-ioc'
import IndexResponse from '../gensrc/IndexResponse.js'

export const strings = [
  ["T0"]
]

@serviceClass('tabbed-sub2')
export class TabbedSub2Service {

  @autowired('openapi-doc')
  openapiDoc:any

  constructor() {
  
    
  }
  
  getTabbedSub2List({tabbedServiceindex}: {tabbedServiceindex: number}): string[] {
    return strings[tabbedServiceindex]
  }

  createTabbedSub2({tabbedServiceindex, data}: {tabbedServiceindex: number, data: any}): IndexResponse {
    strings[tabbedServiceindex].push(data)
    return {index: strings[tabbedServiceindex].length-1}
  }

  getTabbedSub2({tabbedServiceindex, tabbedSub2index}: {tabbedServiceindex: number, tabbedSub2index: number}): string {
    return strings[tabbedServiceindex][tabbedSub2index]
  }

  replaceTabbedSub2({tabbedServiceindex, tabbedSub2index, data}: {tabbedServiceindex: number, tabbedSub2index: number, data: any}): void {
    strings[tabbedServiceindex][tabbedSub2index] = data
  }

  updateTabbedSub2({tabbedServiceindex, tabbedSub2index, data}: {tabbedServiceindex: number, tabbedSub2index: number, data: any}): void {
    strings[tabbedServiceindex][tabbedSub2index] = data
  }

  deleteTabbedSub2({tabbedServiceindex, tabbedSub2index}: {tabbedServiceindex: number, tabbedSub2index: number}): void {
    strings[tabbedServiceindex].splice(tabbedSub2index, 1)
  }
}
