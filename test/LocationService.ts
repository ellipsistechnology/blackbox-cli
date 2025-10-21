import {serviceClass, autowired} from 'ellipsis-ioc'
import Location from './Location.js'
import LocationName from './LocationName.js'
import IotDevice from './IotDevice.js'

export const locations: (Location&{devices:IotDevice[]})[] = [
  {
      name: 'Office', 
      address: '123 Main St', 
      devices: [
      {
        type: 'TemperatureSensor',
        state: 'active'
      },
      {
        type: 'HumiditySensor',
        state: 'inactive'
      }
    ]
  },
  {
    name: 'Warehouse', 
    address: '456 Warehouse Rd',
    devices: [
      {
        type: 'lightSensor',
        state: 'on'
      },
      {
        type: 'light',
        state: 'off'
      }
    ]
  },
  {
    name: 'Remote Site', 
    address: '789 Remote Ave',
    devices: [
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
]

@serviceClass('location')
export class LocationService {

  @autowired('openapi-doc')
  openapiDoc:any

  constructor() {
  }
  
  getLocationList(): Location[] {
    return locations.map(({devices, ...loc}) => loc)
  }

  createLocation({data}: {data: Location}): LocationName {
    locations.push({...data, devices: []})
    return {name: data.name}
  }

  getLocation({locationname}: {locationname: string}): Location {
    const loc = locations.find(loc => loc.name === locationname)!
    return {
      name: loc.name,
      address: loc.address
    }
  }

  replaceLocation({locationname, data}: {locationname: string, data: Location}): void {
    if(!locations.find(loc => loc.name === locationname)?.name) {
      throw new Error(`Location ${locationname} not found.`)
    }
    const index = locations.findIndex(loc => loc.name === locationname)
    locations.splice(index, 1, {...data, devices: locations[index].devices})
  }

  updateLocation({locationname, data}: {locationname: string, data: Location}): void {
    const loc = locations.find(loc => loc.name === locationname)
    if(!loc) {
      throw new Error(`Location ${locationname} not found.`)
    }
    if(data.address) {
      loc.address = data.address
    }
    if(data.name) {
      loc.name = data.name
    }
  }

  deleteLocation({locationname}: {locationname: string}): void {
    locations.splice(locations.findIndex(loc => loc.name === locationname), 1)
  }
}
