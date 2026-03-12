import { autowired, autowiredService } from "ellipsis-ioc"
import { makeService, makeServiceList, makeUniqueService } from "../blackbox-utils.js"
import { NotFound, InternalServerError } from '../HttpError.js'

class ServiceWrapper {
    @autowiredService('tabbed-sub2')
    service!: any;

    @autowired('openapi-doc')
    openapiDoc: any
}

const wrapper = new ServiceWrapper()

// Get the list of objects for '/tabbed-service/{tabbedServiceindex}/tabbed-sub2':
export function getTabbedSub2List(req: any, res: any, next: any) {
        const meta = req.query.meta
        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getTabbedSub2ListMeta === 'function') { 
                Promise.resolve(wrapper.service.getTabbedSub2ListMeta( {tabbedServiceindex} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                res.status(200).json(makeService(req, wrapper.openapiDoc))
            }
        } else {
            if(typeof wrapper.service.getTabbedSub2List !== 'function') {
                console.error("Service function getTabbedSub2List not found: "+
                    "Please implement function getTabbedSub2List in a service class tagged with the @service('tabbed-sub2') decorator."
                )
                next(new NotFound("Service function getTabbedSub2List not found."))
                return
            }

            Promise.resolve(wrapper.service.getTabbedSub2List({tabbedServiceindex}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Create a new string object:
export function createTabbedSub2(req: any, res: any, next: any) {
        if(typeof wrapper.service.createTabbedSub2 !== 'function') {
            console.error("Service function createTabbedSub2 not found: "+
                "Please implement function createTabbedSub2 in a service class tagged with the @service('tabbed-sub2') decorator."
            )
            next(new NotFound("Service function createTabbedSub2 not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
        Promise.resolve(wrapper.service.createTabbedSub2({data: req.body, tabbedServiceindex}))
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

// Get the  object for '/tabbed-service/{tabbedServiceindex}/tabbed-sub2/{tabbedSub2index}':
export function getTabbedSub2(req: any, res: any, next: any) {
        const meta = req.query.meta
        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
    const tabbedSub2index = req.openapi.pathParams['tabbedSub2index']
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getTabbedSub2Meta === 'function') { 
                Promise.resolve(wrapper.service.getTabbedSub2Meta( {tabbedServiceindex, tabbedSub2index} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                next(new NotFound("Metadata is not available for this object."))
            }
        } else {
            if(typeof wrapper.service.getTabbedSub2 !== 'function') {
                console.error("Service function getTabbedSub2 not found: "+
                    "Please implement function getTabbedSub2 in a service class tagged with the @service('tabbed-sub2') decorator."
                )
                next(new NotFound("Service function getTabbedSub2 not found."))
                return
            }

            Promise.resolve(wrapper.service.getTabbedSub2({tabbedServiceindex, tabbedSub2index}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Replace an existing string object:
export function replaceTabbedSub2(req: any, res: any, next: any) {
        if(typeof wrapper.service.replaceTabbedSub2 !== 'function') {
            console.error("Service function replaceTabbedSub2 not found: "+
                "Please implement function replaceTabbedSub2 in a service class tagged with the @service('tabbed-sub2') decorator."
            )
            next(new NotFound("Service function replaceTabbedSub2 not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
    const tabbedSub2index = req.openapi.pathParams['tabbedSub2index']
        Promise.resolve(wrapper.service.replaceTabbedSub2({data: req.body, tabbedServiceindex, tabbedSub2index}))
        .then(data => {res.status(204).json({}); next()})
        .catch(err => next(err))
}

// Update an existing string object:
export function updateTabbedSub2(req: any, res: any, next: any) {
        if(typeof wrapper.service.updateTabbedSub2 !== 'function') {
            console.error("Service function updateTabbedSub2 not found: "+
                "Please implement function updateTabbedSub2 in a service class tagged with the @service('tabbed-sub2') decorator."
            )
            next(new NotFound("Service function updateTabbedSub2 not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
    const tabbedSub2index = req.openapi.pathParams['tabbedSub2index']
        Promise.resolve(wrapper.service.updateTabbedSub2({data: req.body, tabbedServiceindex, tabbedSub2index}))
        .then(data => {res.status(204).json({}); next()})
        .catch(err => next(err))
}

// Delete an existing object:
export function deleteTabbedSub2(req: any, res: any, next: any) {
        if(typeof wrapper.service.deleteTabbedSub2 !== 'function') {
            console.error("Service function deleteTabbedSub2 not found: "+
                "Please implement function deleteTabbedSub2 in a service class tagged with the @service('tabbed-sub2') decorator."
            )
            next(new NotFound("Service function deleteTabbedSub2 not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
    const tabbedSub2index = req.openapi.pathParams['tabbedSub2index']
        Promise.resolve(wrapper.service.deleteTabbedSub2({tabbedServiceindex, tabbedSub2index}))
        .then(() => {res.status(204).json({}); next()})
        .catch(err => next(err))
}
    
