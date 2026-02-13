import { autowired, autowiredService } from "ellipsis-ioc"
import { makeService, makeServiceList, makeUniqueService } from "../blackbox-utils.js"
import { NotFound, InternalServerError } from '../HttpError.js'

class ServiceWrapper {
    @autowiredService('tabbed-service')
    service!: any;

    @autowired('openapi-doc')
    openapiDoc: any
}

const wrapper = new ServiceWrapper()

// Get the list of objects for '/tabbed-service':
export function getTabbedServiceList(req: any, res: any, next: any) {
        const meta = req.query.meta
        
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getTabbedServiceListMeta === 'function') { 
                Promise.resolve(wrapper.service.getTabbedServiceListMeta( {} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                res.status(200).json(makeService(req, wrapper.openapiDoc))
            }
        } else {
            if(typeof wrapper.service.getTabbedServiceList !== 'function') {
                console.error("Service function getTabbedServiceList not found: "+
                    "Please implement function getTabbedServiceList in a service class tagged with the @service('tabbed-service') decorator."
                )
                next(new NotFound("Service function getTabbedServiceList not found."))
                return
            }

            Promise.resolve(wrapper.service.getTabbedServiceList({}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Create a new string object:
export function createTabbedService(req: any, res: any, next: any) {
        if(typeof wrapper.service.createTabbedService !== 'function') {
            console.error("Service function createTabbedService not found: "+
                "Please implement function createTabbedService in a service class tagged with the @service('tabbed-service') decorator."
            )
            next(new NotFound("Service function createTabbedService not found."))
            return
        }

        
        Promise.resolve(wrapper.service.createTabbedService({data: req.body, }))
        .then(data => {
            // Check for id or index in body and return 500 if not present:
            if(data.index === undefined) {
                next(new InternalServerError("Service did not return the index of the created object."))
            } else {
                res.status(201).json(data)
            }
            next()
        })
        .catch(err => next(err))
}

// Get the  object for '/tabbed-service/{tabbed-serviceindex}':
export function getTabbedService(req: any, res: any, next: any) {
        const meta = req.query.meta
        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getTabbedServiceMeta === 'function') { 
                Promise.resolve(wrapper.service.getTabbedServiceMeta( {tabbedServiceindex} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                next(new NotFound("Metadata is not available for this object."))
            }
        } else {
            if(typeof wrapper.service.getTabbedService !== 'function') {
                console.error("Service function getTabbedService not found: "+
                    "Please implement function getTabbedService in a service class tagged with the @service('tabbed-service') decorator."
                )
                next(new NotFound("Service function getTabbedService not found."))
                return
            }

            Promise.resolve(wrapper.service.getTabbedService({tabbedServiceindex}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Replace an existing string object:
export function replaceTabbedService(req: any, res: any, next: any) {
        if(typeof wrapper.service.replaceTabbedService !== 'function') {
            console.error("Service function replaceTabbedService not found: "+
                "Please implement function replaceTabbedService in a service class tagged with the @service('tabbed-service') decorator."
            )
            next(new NotFound("Service function replaceTabbedService not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
        Promise.resolve(wrapper.service.replaceTabbedService({data: req.body, tabbedServiceindex}))
        .then(data => {res.status(204).json({}); next()})
        .catch(err => next(err))
}

// Update an existing string object:
export function updateTabbedService(req: any, res: any, next: any) {
        if(typeof wrapper.service.updateTabbedService !== 'function') {
            console.error("Service function updateTabbedService not found: "+
                "Please implement function updateTabbedService in a service class tagged with the @service('tabbed-service') decorator."
            )
            next(new NotFound("Service function updateTabbedService not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
        Promise.resolve(wrapper.service.updateTabbedService({data: req.body, tabbedServiceindex}))
        .then(data => {res.status(204).json({}); next()})
        .catch(err => next(err))
}

// Delete an existing object:
export function deleteTabbedService(req: any, res: any, next: any) {
        if(typeof wrapper.service.deleteTabbedService !== 'function') {
            console.error("Service function deleteTabbedService not found: "+
                "Please implement function deleteTabbedService in a service class tagged with the @service('tabbed-service') decorator."
            )
            next(new NotFound("Service function deleteTabbedService not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
        Promise.resolve(wrapper.service.deleteTabbedService({tabbedServiceindex}))
        .then(() => {res.status(204).json({}); next()})
        .catch(err => next(err))
}
    
