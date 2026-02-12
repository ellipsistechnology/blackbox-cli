import {serviceClass, autowired} from 'ellipsis-ioc'
import IotDevice from './IotDevice.js'
import IndexResponse from '../gensrc/IndexResponse.js'
import {locations} from './LocationService.js'

@serviceClass('device')
export class DeviceService {

  @autowired('openapi-doc')
  openapiDoc:any

  constructor() {
  
    
  }
  
  getDeviceList({locationname}: {locationname: string}): IotDevice[] {
    const location = locations.find(loc => loc.name === locationname)
    if(!location) {
      throw new Error(`Location ${locationname} not found.`)
    }
    return location.devices || []
  }

  createDevice({locationname, data}: {locationname: string, data: IotDevice}): IndexResponse {
    const location = locations.find(loc => loc.name === locationname)
    if(!location) {
      throw new Error(`Location ${locationname} not found.`)
    }
    const index = location.devices.push(data)
    return { index }
  }

  getDevice({locationname, deviceindex}: {locationname: string, deviceindex: number}): IotDevice {
    const location = locations.find(loc => loc.name === locationname)
    if(!location) {
      throw new Error(`Location ${locationname} not found.`)
    }
    return location.devices[deviceindex]
  }

  replaceDevice({locationname, deviceindex, data}: {locationname: string, deviceindex: number, data: IotDevice}): void {
    const location = locations.find(loc => loc.name === locationname)
    if(!location) {
      throw new Error(`Location ${locationname} not found.`)
    }
    location.devices[deviceindex] = data
  }

  updateDevice({locationname, deviceindex, data}: {locationname: string, deviceindex: number, data: IotDevice}): void {
    const location = locations.find(loc => loc.name === locationname)
    if(!location) {
      throw new Error(`Location ${locationname} not found.`)
    }
    const existingDevice = location.devices[deviceindex]
    location.devices[deviceindex] = {
      ...existingDevice,
      ...data
    }
  }

  deleteDevice({locationname, deviceindex}: {locationname: string, deviceindex: number}): void {
    const location = locations.find(loc => loc.name === locationname)
    if(!location) {
      throw new Error(`Location ${locationname} not found.`)
    }
    location.devices.splice(deviceindex, 1)
  }
}
