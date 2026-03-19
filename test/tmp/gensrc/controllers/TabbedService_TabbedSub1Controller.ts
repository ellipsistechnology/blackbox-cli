import { autowired, autowiredService } from "ellipsis-ioc"
import { makeService, makeServiceList, makeUniqueService } from "../blackbox-utils.js"
import { NotFound, InternalServerError } from '../HttpError.js'

class ServiceWrapper {
    @autowiredService('tabbed-sub1')
    service!: any;

    @autowired('openapi-doc')
    openapiDoc: any
}

const wrapper = new ServiceWrapper()

// Get the list of objects for '/tabbed-service/{tabbedServiceindex}/tabbed-sub1':
export function getTabbedSub1List(req: any, res: any, next: any) {
        const meta = req.query.meta
        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getTabbedSub1ListMeta === 'function') { 
                Promise.resolve(wrapper.service.getTabbedSub1ListMeta( {tabbedServiceindex} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                res.status(200).json(makeService(req, wrapper.openapiDoc))
            }
        } else {
            if(typeof wrapper.service.getTabbedSub1List !== 'function') {
                console.error("Service function getTabbedSub1List not found: "+
                    "Please implement function getTabbedSub1List in a service class tagged with the @service('tabbed-sub1') decorator."
                )
                next(new NotFound("Service function getTabbedSub1List not found."))
                return
            }

            Promise.resolve(wrapper.service.getTabbedSub1List({tabbedServiceindex}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Create a new string object:
export function createTabbedSub1(req: any, res: any, next: any) {
        if(typeof wrapper.service.createTabbedSub1 !== 'function') {
            console.error("Service function createTabbedSub1 not found: "+
                "Please implement function createTabbedSub1 in a service class tagged with the @service('tabbed-sub1') decorator."
            )
            next(new NotFound("Service function createTabbedSub1 not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
        Promise.resolve(wrapper.service.createTabbedSub1({data: req.body, tabbedServiceindex}))
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

// Get the  object for '/tabbed-service/{tabbedServiceindex}/tabbed-sub1/{tabbedSub1index}':
export function getTabbedSub1(req: any, res: any, next: any) {
        const meta = req.query.meta
        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
    const tabbedSub1index = req.openapi.pathParams['tabbedSub1index']
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getTabbedSub1Meta === 'function') { 
                Promise.resolve(wrapper.service.getTabbedSub1Meta( {tabbedServiceindex, tabbedSub1index} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                next(new NotFound("Metadata is not available for this object."))
            }
        } else {
            if(typeof wrapper.service.getTabbedSub1 !== 'function') {
                console.error("Service function getTabbedSub1 not found: "+
                    "Please implement function getTabbedSub1 in a service class tagged with the @service('tabbed-sub1') decorator."
                )
                next(new NotFound("Service function getTabbedSub1 not found."))
                return
            }

            Promise.resolve(wrapper.service.getTabbedSub1({tabbedServiceindex, tabbedSub1index}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Replace an existing string object:
export function replaceTabbedSub1(req: any, res: any, next: any) {
        if(typeof wrapper.service.replaceTabbedSub1 !== 'function') {
            console.error("Service function replaceTabbedSub1 not found: "+
                "Please implement function replaceTabbedSub1 in a service class tagged with the @service('tabbed-sub1') decorator."
            )
            next(new NotFound("Service function replaceTabbedSub1 not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
    const tabbedSub1index = req.openapi.pathParams['tabbedSub1index']
        Promise.resolve(wrapper.service.replaceTabbedSub1({data: req.body, tabbedServiceindex, tabbedSub1index}))
        .then(data => {res.status(204).json({}); next()})
        .catch(err => next(err))
}

// Update an existing string object:
export function updateTabbedSub1(req: any, res: any, next: any) {
        if(typeof wrapper.service.updateTabbedSub1 !== 'function') {
            console.error("Service function updateTabbedSub1 not found: "+
                "Please implement function updateTabbedSub1 in a service class tagged with the @service('tabbed-sub1') decorator."
            )
            next(new NotFound("Service function updateTabbedSub1 not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
    const tabbedSub1index = req.openapi.pathParams['tabbedSub1index']
        Promise.resolve(wrapper.service.updateTabbedSub1({data: req.body, tabbedServiceindex, tabbedSub1index}))
        .then(data => {res.status(204).json({}); next()})
        .catch(err => next(err))
}

// Delete an existing object:
export function deleteTabbedSub1(req: any, res: any, next: any) {
        if(typeof wrapper.service.deleteTabbedSub1 !== 'function') {
            console.error("Service function deleteTabbedSub1 not found: "+
                "Please implement function deleteTabbedSub1 in a service class tagged with the @service('tabbed-sub1') decorator."
            )
            next(new NotFound("Service function deleteTabbedSub1 not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
    const tabbedSub1index = req.openapi.pathParams['tabbedSub1index']
        Promise.resolve(wrapper.service.deleteTabbedSub1({tabbedServiceindex, tabbedSub1index}))
        .then(() => {res.status(204).json({}); next()})
        .catch(err => next(err))
}
    
