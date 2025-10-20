import {serviceClass, autowired} from 'ellipsis-ioc'
import IotDevice from './IotDevice.js'
import IndexResponse from '../gensrc/IndexResponse.js'

const devices: {
  [locationname: string]: IotDevice[]
} = {
  Office: [
    {
      type: 'TemperatureSensor',
      state: 'active'
    },
    {
      type: 'HumiditySensor',
      state: 'inactive'
    }
  ],
  Warehouse: [
    {
      type: 'lightSensor',
      state: 'on'
    },
    {
      type: 'light',
      state: 'off'
    }
  ],
  'Remote Site': [
    {
      type: 'Camera',
      state: 'recording'
    },
    {
      type: 'DoorLock',
      state: 'locked'
    }
  ]
}

@serviceClass('device')
export class DeviceService {

  @autowired('openapi-doc')
  openapiDoc:any

  constructor() {
  }
  
  getDeviceList({locationname}: {locationname: string}): IotDevice[] {
    if(!devices[locationname]) {
      throw new Error(`Location ${locationname} not found.`)
    }
    return devices[locationname] || []
  }

  createDevice({locationname, data}: {locationname: string, data: IotDevice}): IndexResponse {
    if(!devices[locationname]) {
      throw new Error(`Location ${locationname} not found.`)
    }
    devices[locationname].push(data)
    return {
      index: (devices[locationname]?.length) - 1
    }
  }

  getDevice({locationname, deviceindex}: {locationname: string, deviceindex: number}): IotDevice {
    return devices[locationname]?.[deviceindex]
  }

  replaceDevice({locationname, deviceindex, data}: {locationname: string, deviceindex: number, data: IotDevice}): void {
    if(!devices[locationname]) {
      throw new Error(`Location ${locationname} not found.`)
    }
    devices[locationname][deviceindex] = data
  }

  updateDevice({locationname, deviceindex, data}: {locationname: string, deviceindex: number, data: IotDevice}): void {
    if(!devices[locationname]) {
      throw new Error(`Location ${locationname} not found.`)
    }
    const existingDevice = devices[locationname][deviceindex]
    devices[locationname][deviceindex] = {
      ...existingDevice,
      ...data
    }
  }

  deleteDevice({locationname, deviceindex}: {locationname: string, deviceindex: number}): void {
    if(!devices[locationname]) {
      throw new Error(`Location ${locationname} not found.`)
    }
    devices[locationname].splice(deviceindex, 1)
  }
}
