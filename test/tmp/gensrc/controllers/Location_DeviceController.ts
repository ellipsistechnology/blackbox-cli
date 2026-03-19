import { autowired, autowiredService } from "ellipsis-ioc"
import { makeService, makeServiceList, makeUniqueService } from "../blackbox-utils.js"
import { NotFound, InternalServerError } from '../HttpError.js'

class ServiceWrapper {
    @autowiredService('device')
    service!: any;

    @autowired('openapi-doc')
    openapiDoc: any
}

const wrapper = new ServiceWrapper()

// Get the list of objects for '/location/{locationname}/device':
export function getDeviceList(req: any, res: any, next: any) {
        const meta = req.query.meta
        const locationname = req.openapi.pathParams['locationname']
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getDeviceListMeta === 'function') { 
                Promise.resolve(wrapper.service.getDeviceListMeta( {locationname} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                res.status(200).json(makeService(req, wrapper.openapiDoc))
            }
        } else {
            if(typeof wrapper.service.getDeviceList !== 'function') {
                console.error("Service function getDeviceList not found: "+
                    "Please implement function getDeviceList in a service class tagged with the @service('device') decorator."
                )
                next(new NotFound("Service function getDeviceList not found."))
                return
            }

            Promise.resolve(wrapper.service.getDeviceList({locationname}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Create a new iot-device object:
export function createDevice(req: any, res: any, next: any) {
        if(typeof wrapper.service.createDevice !== 'function') {
            console.error("Service function createDevice not found: "+
                "Please implement function createDevice in a service class tagged with the @service('device') decorator."
            )
            next(new NotFound("Service function createDevice not found."))
            return
        }

        const locationname = req.openapi.pathParams['locationname']
        Promise.resolve(wrapper.service.createDevice({data: req.body, locationname}))
        .then(data => {
            // Check for id or index in body and return 500 if not present:
            if(!data || data.index === undefined) {
                next(new InternalServerError("Service did not return the index of the created object."))
            } else {
                res.status(201).json(data)
            }
            next()
        })
        .catch(err => next(err))
}

// Get the  object for '/location/{locationname}/device/{deviceindex}':
export function getDevice(req: any, res: any, next: any) {
        const meta = req.query.meta
        const locationname = req.openapi.pathParams['locationname']
    const deviceindex = req.openapi.pathParams['deviceindex']
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getDeviceMeta === 'function') { 
                Promise.resolve(wrapper.service.getDeviceMeta( {locationname, deviceindex} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                next(new NotFound("Metadata is not available for this object."))
            }
        } else {
            if(typeof wrapper.service.getDevice !== 'function') {
                console.error("Service function getDevice not found: "+
                    "Please implement function getDevice in a service class tagged with the @service('device') decorator."
                )
                next(new NotFound("Service function getDevice not found."))
                return
            }

            Promise.resolve(wrapper.service.getDevice({locationname, deviceindex}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Replace an existing iot-device object:
export function replaceDevice(req: any, res: any, next: any) {
        if(typeof wrapper.service.replaceDevice !== 'function') {
            console.error("Service function replaceDevice not found: "+
                "Please implement function replaceDevice in a service class tagged with the @service('device') decorator."
            )
            next(new NotFound("Service function replaceDevice not found."))
            return
        }

        const locationname = req.openapi.pathParams['locationname']
    const deviceindex = req.openapi.pathParams['deviceindex']
        Promise.resolve(wrapper.service.replaceDevice({data: req.body, locationname, deviceindex}))
        .then(data => {res.status(204).json({}); next()})
        .catch(err => next(err))
}

// Update an existing iot-device object:
export function updateDevice(req: any, res: any, next: any) {
        if(typeof wrapper.service.updateDevice !== 'function') {
            console.error("Service function updateDevice not found: "+
                "Please implement function updateDevice in a service class tagged with the @service('device') decorator."
            )
            next(new NotFound("Service function updateDevice not found."))
            return
        }

        const locationname = req.openapi.pathParams['locationname']
    const deviceindex = req.openapi.pathParams['deviceindex']
        Promise.resolve(wrapper.service.updateDevice({data: req.body, locationname, deviceindex}))
        .then(data => {res.status(204).json({}); next()})
        .catch(err => next(err))
}

// Delete an existing object:
export function deleteDevice(req: any, res: any, next: any) {
        if(typeof wrapper.service.deleteDevice !== 'function') {
            console.error("Service function deleteDevice not found: "+
                "Please implement function deleteDevice in a service class tagged with the @service('device') decorator."
            )
            next(new NotFound("Service function deleteDevice not found."))
            return
        }

        const locationname = req.openapi.pathParams['locationname']
    const deviceindex = req.openapi.pathParams['deviceindex']
        Promise.resolve(wrapper.service.deleteDevice({locationname, deviceindex}))
        .then(() => {res.status(204).json({}); next()})
        .catch(err => next(err))
}
    
