import {serviceClass, autowired} from 'ellipsis-ioc'
import IndexResponse from '../gensrc/IndexResponse.js'

export const strings = [
  ["T0"]
]

@serviceClass('tabbed-sub3')
export class TabbedSub3Service {

  @autowired('openapi-doc')
  openapiDoc:any

  constructor() {
  
    
  }
  
  getTabbedSub3List({tabbedServiceindex}: {tabbedServiceindex: number}): string[] {
    return strings[tabbedServiceindex]
  }

  createTabbedSub3({tabbedServiceindex, data}: {tabbedServiceindex: number, data: any}): IndexResponse {
    strings[tabbedServiceindex].push(data)
    return {index: strings[tabbedServiceindex].length-1}
  }

  getTabbedSub3({tabbedServiceindex, tabbedSub3index}: {tabbedServiceindex: number, tabbedSub3index: number}): string {
    return strings[tabbedServiceindex][tabbedSub3index]
  }

  replaceTabbedSub3({tabbedServiceindex, tabbedSub3index, data}: {tabbedServiceindex: number, tabbedSub3index: number, data: any}): void {
    strings[tabbedServiceindex][tabbedSub3index] = data
  }

  updateTabbedSub3({tabbedServiceindex, tabbedSub3index, data}: {tabbedServiceindex: number, tabbedSub3index: number, data: any}): void {
    strings[tabbedServiceindex][tabbedSub3index] = data
  }

  deleteTabbedSub3({tabbedServiceindex, tabbedSub3index}: {tabbedServiceindex: number, tabbedSub3index: number}): void {
    strings[tabbedServiceindex].splice(tabbedSub3index, 1)
  }
}
