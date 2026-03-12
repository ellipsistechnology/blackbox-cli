import {serviceClass, autowired} from 'ellipsis-ioc'

const strings = [
  ["T0"]
]

@serviceClass('tabbed-sub1')
export class TabbedSub1Service {

  @autowired('openapi-doc')
  openapiDoc:any

  constructor() {
  }
  
  getTabbedSub1List({tabbedServiceindex}: {tabbedServiceindex: number}): string[] {
    return strings[tabbedServiceindex]
  }

  createTabbedSub1({tabbedServiceindex, data}: {tabbedServiceindex: number, data: any}): any {
    strings[tabbedServiceindex].push(data)
    return {index: strings[tabbedServiceindex].length-1}
  }

  getTabbedSub1({tabbedServiceindex, tabbedSub1index}: {tabbedServiceindex: number, tabbedSub1index: number}): string {
    return strings[tabbedServiceindex][tabbedSub1index]
  }

  replaceTabbedSub1({tabbedServiceindex, tabbedSub1index, data}: {tabbedServiceindex: number, tabbedSub1index: number, data: any}): void {
    strings[tabbedServiceindex][tabbedSub1index] = data
  }

  updateTabbedSub1({tabbedServiceindex, tabbedSub1index, data}: {tabbedServiceindex: number, tabbedSub1index: number, data: any}): void {
    strings[tabbedServiceindex][tabbedSub1index] = data
  }

  deleteTabbedSub1({tabbedServiceindex, tabbedSub1index}: {tabbedServiceindex: number, tabbedSub1index: number}): void {
    strings[tabbedServiceindex].splice(tabbedSub1index, 1)
  }
}
