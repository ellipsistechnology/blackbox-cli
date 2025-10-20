import {serviceClass, autowired} from 'ellipsis-ioc'

let message = "Hello, World!"

@serviceClass('hello')
export class HelloService {

  @autowired('openapi-doc')
  openapiDoc:any

  constructor() {
  }
  
  getHello(): string {
    return message
  }

  createHello({data}: {data: string}): void {
    message = data
  }
}
