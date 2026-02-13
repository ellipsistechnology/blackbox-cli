import { autowired, autowiredService } from "ellipsis-ioc"
import { makeService, makeServiceList, makeUniqueService } from "../blackbox-utils.js"
import { NotFound, InternalServerError } from '../HttpError.js'

class ServiceWrapper {
    @autowiredService('location')
    service!: any;

    @autowired('openapi-doc')
    openapiDoc: any
}

const wrapper = new ServiceWrapper()

// Get the list of objects for '/location':
export function getLocationList(req: any, res: any, next: any) {
        const meta = req.query.meta
        
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getLocationListMeta === 'function') { 
                Promise.resolve(wrapper.service.getLocationListMeta( {} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                res.status(200).json(makeService(req, wrapper.openapiDoc))
            }
        } else {
            if(typeof wrapper.service.getLocationList !== 'function') {
                console.error("Service function getLocationList not found: "+
                    "Please implement function getLocationList in a service class tagged with the @service('location') decorator."
                )
                next(new NotFound("Service function getLocationList not found."))
                return
            }

            Promise.resolve(wrapper.service.getLocationList({}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Create a new location object:
export function createLocation(req: any, res: any, next: any) {
        if(typeof wrapper.service.createLocation !== 'function') {
            console.error("Service function createLocation not found: "+
                "Please implement function createLocation in a service class tagged with the @service('location') decorator."
            )
            next(new NotFound("Service function createLocation not found."))
            return
        }

        
        Promise.resolve(wrapper.service.createLocation({data: req.body, }))
        .then(data => {
            // Check for id or index in body and return 500 if not present:
            if(data.name === undefined) {
                next(new InternalServerError("Service did not return the name of the created object."))
            } else {
                res.status(200).json(data)
            }
            next()
        })
        .catch(err => next(err))
}

// Get the  object for '/location/{locationname}':
export function getLocation(req: any, res: any, next: any) {
        const meta = req.query.meta
        const locationname = req.openapi.pathParams['locationname']
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getLocationMeta === 'function') { 
                Promise.resolve(wrapper.service.getLocationMeta( {locationname} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                res.status(200).json(makeServiceList(req, wrapper.openapiDoc))
            }
        } else {
            if(typeof wrapper.service.getLocation !== 'function') {
                console.error("Service function getLocation not found: "+
                    "Please implement function getLocation in a service class tagged with the @service('location') decorator."
                )
                next(new NotFound("Service function getLocation not found."))
                return
            }

            Promise.resolve(wrapper.service.getLocation({locationname}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Replace an existing location object:
export function replaceLocation(req: any, res: any, next: any) {
        if(typeof wrapper.service.replaceLocation !== 'function') {
            console.error("Service function replaceLocation not found: "+
                "Please implement function replaceLocation in a service class tagged with the @service('location') decorator."
            )
            next(new NotFound("Service function replaceLocation not found."))
            return
        }

        const locationname = req.openapi.pathParams['locationname']
        Promise.resolve(wrapper.service.replaceLocation({data: req.body, locationname}))
        .then(data => {
            res.status(204).json({}); 
            next()
        })
        .catch(err => next(err))
}

// Update an existing location object:
export function updateLocation(req: any, res: any, next: any) {
        if(typeof wrapper.service.updateLocation !== 'function') {
            console.error("Service function updateLocation not found: "+
                "Please implement function updateLocation in a service class tagged with the @service('location') decorator."
            )
            next(new NotFound("Service function updateLocation not found."))
            return
        }

        const locationname = req.openapi.pathParams['locationname']
        Promise.resolve(wrapper.service.updateLocation({data: req.body, locationname}))
        .then(data => {res.status(204).json({}); next()})
        .catch(err => next(err))
}

// Delete an existing object:
export function deleteLocation(req: any, res: any, next: any) {
        if(typeof wrapper.service.deleteLocation !== 'function') {
            console.error("Service function deleteLocation not found: "+
                "Please implement function deleteLocation in a service class tagged with the @service('location') decorator."
            )
            next(new NotFound("Service function deleteLocation not found."))
            return
        }

        const locationname = req.openapi.pathParams['locationname']
        Promise.resolve(wrapper.service.deleteLocation({locationname}))
        .then(() => {res.status(204).json({}); next()})
        .catch(err => next(err))
}
    
