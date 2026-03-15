import {serviceClass, autowired} from 'ellipsis-ioc'
import {strings as sub1} from './TabbedSub1Service.js'
import {strings as sub2} from './TabbedSub2Service.js'
import {strings as sub3} from './TabbedSub3Service.js'

const stringList: string[] = [
  'Hello!'
]

@serviceClass('tabbed-service')
export class TabbedServiceService {

  @autowired('openapi-doc')
  openapiDoc:any

  constructor() {}
  
  getTabbedServiceList(): string[] {
    return stringList
  }

  createTabbedService({data}: {data: any}): any {
    stringList.push(data)
    sub1.push([])
    sub2.push([])
    sub3.push([])
    return {index: stringList.length-1}
  }

  getTabbedService({tabbedServiceindex}: {tabbedServiceindex: number}): string {
    return stringList[tabbedServiceindex]
  }

  replaceTabbedService({tabbedServiceindex, data}: {tabbedServiceindex: number, data: any}): void {
    stringList[tabbedServiceindex] = data
  }

  updateTabbedService({tabbedServiceindex, data}: {tabbedServiceindex: number, data: any}): void {
    stringList[tabbedServiceindex] = data
  }

  deleteTabbedService({tabbedServiceindex}: {tabbedServiceindex: number}): void {
    stringList.splice(tabbedServiceindex, 1)
  }
}
