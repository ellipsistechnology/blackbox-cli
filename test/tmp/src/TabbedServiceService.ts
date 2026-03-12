import {serviceClass, autowired} from 'ellipsis-ioc'

const stringList: string[] = [
  'Hello!'
]

@serviceClass('tabbed-service')
export class TabbedServiceService {

  @autowired('openapi-doc')
  openapiDoc:any

  constructor() {
  
    
  }
  
  getTabbedServiceList(): string[] {
    return stringList
  }

  createTabbedService({data}: {data: any}): void {
    stringList.push(data)
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
