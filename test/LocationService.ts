import {serviceClass, autowired} from 'ellipsis-ioc'
import Location from './Location.js'
import LocationName from './LocationName.js'

const locations: Location[] = [
  {name: 'Office', address: '123 Main St'},
  {name: 'Warehouse', address: '456 Warehouse Rd'},
  {name: 'Remote Site', address: '789 Remote Ave'}
]

@serviceClass('location')
export class LocationService {

  @autowired('openapi-doc')
  openapiDoc:any

  constructor() {
  }
  
  getLocationList(): Location[] {
    return locations
  }

  createLocation({data}: {data: Location}): LocationName {
    locations.push(data)
    return {name: data.name}
  }

  getLocation({locationname}: {locationname: string}): Location {
    return locations.find(loc => loc.name === locationname)!
  }

  replaceLocation({locationname, data}: {locationname: string, data: Location}): void {
    locations.splice(locations.findIndex(loc => loc.name === locationname), 1, data)
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
