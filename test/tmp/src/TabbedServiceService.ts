import {serviceClass, autowired} from 'ellipsis-ioc'


@serviceClass('tabbed-service')
export class TabbedServiceService {

  @autowired('openapi-doc')
  openapiDoc:any

  constructor() {
  }
  
  getTabbedServiceList(): string[] {
    throw new Error(`getTabbedServiceList not yet implemented.`)
  }

  createTabbedService({data}: {data: any}): void {
    throw new Error(`createTabbedService not yet implemented.`)
  }

  getTabbedService({tabbedServiceindex}: {tabbedServiceindex: number}): string {
    throw new Error(`getTabbedService not yet implemented.`)
  }

  replaceTabbedService({tabbedServiceindex, data}: {tabbedServiceindex: number, data: any}): void {
    throw new Error(`replaceTabbedService not yet implemented.`)
  }

  updateTabbedService({tabbedServiceindex, data}: {tabbedServiceindex: number, data: any}): void {
    throw new Error(`updateTabbedService not yet implemented.`)
  }

  deleteTabbedService({tabbedServiceindex}: {tabbedServiceindex: number}): void {
    throw new Error(`deleteTabbedService not yet implemented.`)
  }
}
