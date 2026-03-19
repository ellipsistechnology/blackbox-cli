import { autowired, autowiredService } from "ellipsis-ioc"
import { makeService, makeServiceList, makeUniqueService } from "../blackbox-utils.js"
import { NotFound, InternalServerError } from '../HttpError.js'

class ServiceWrapper {
    @autowiredService('tabbed-sub3')
    service!: any;

    @autowired('openapi-doc')
    openapiDoc: any
}

const wrapper = new ServiceWrapper()

// Get the list of objects for '/tabbed-service/{tabbedServiceindex}/tabbed-sub3':
export function getTabbedSub3List(req: any, res: any, next: any) {
        const meta = req.query.meta
        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getTabbedSub3ListMeta === 'function') { 
                Promise.resolve(wrapper.service.getTabbedSub3ListMeta( {tabbedServiceindex} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                res.status(200).json(makeService(req, wrapper.openapiDoc))
            }
        } else {
            if(typeof wrapper.service.getTabbedSub3List !== 'function') {
                console.error("Service function getTabbedSub3List not found: "+
                    "Please implement function getTabbedSub3List in a service class tagged with the @service('tabbed-sub3') decorator."
                )
                next(new NotFound("Service function getTabbedSub3List not found."))
                return
            }

            Promise.resolve(wrapper.service.getTabbedSub3List({tabbedServiceindex}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Create a new string object:
export function createTabbedSub3(req: any, res: any, next: any) {
        if(typeof wrapper.service.createTabbedSub3 !== 'function') {
            console.error("Service function createTabbedSub3 not found: "+
                "Please implement function createTabbedSub3 in a service class tagged with the @service('tabbed-sub3') decorator."
            )
            next(new NotFound("Service function createTabbedSub3 not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
        Promise.resolve(wrapper.service.createTabbedSub3({data: req.body, tabbedServiceindex}))
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

// Get the  object for '/tabbed-service/{tabbedServiceindex}/tabbed-sub3/{tabbedSub3index}':
export function getTabbedSub3(req: any, res: any, next: any) {
        const meta = req.query.meta
        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
    const tabbedSub3index = req.openapi.pathParams['tabbedSub3index']
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getTabbedSub3Meta === 'function') { 
                Promise.resolve(wrapper.service.getTabbedSub3Meta( {tabbedServiceindex, tabbedSub3index} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                next(new NotFound("Metadata is not available for this object."))
            }
        } else {
            if(typeof wrapper.service.getTabbedSub3 !== 'function') {
                console.error("Service function getTabbedSub3 not found: "+
                    "Please implement function getTabbedSub3 in a service class tagged with the @service('tabbed-sub3') decorator."
                )
                next(new NotFound("Service function getTabbedSub3 not found."))
                return
            }

            Promise.resolve(wrapper.service.getTabbedSub3({tabbedServiceindex, tabbedSub3index}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Replace an existing string object:
export function replaceTabbedSub3(req: any, res: any, next: any) {
        if(typeof wrapper.service.replaceTabbedSub3 !== 'function') {
            console.error("Service function replaceTabbedSub3 not found: "+
                "Please implement function replaceTabbedSub3 in a service class tagged with the @service('tabbed-sub3') decorator."
            )
            next(new NotFound("Service function replaceTabbedSub3 not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
    const tabbedSub3index = req.openapi.pathParams['tabbedSub3index']
        Promise.resolve(wrapper.service.replaceTabbedSub3({data: req.body, tabbedServiceindex, tabbedSub3index}))
        .then(data => {res.status(204).json({}); next()})
        .catch(err => next(err))
}

// Update an existing string object:
export function updateTabbedSub3(req: any, res: any, next: any) {
        if(typeof wrapper.service.updateTabbedSub3 !== 'function') {
            console.error("Service function updateTabbedSub3 not found: "+
                "Please implement function updateTabbedSub3 in a service class tagged with the @service('tabbed-sub3') decorator."
            )
            next(new NotFound("Service function updateTabbedSub3 not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
    const tabbedSub3index = req.openapi.pathParams['tabbedSub3index']
        Promise.resolve(wrapper.service.updateTabbedSub3({data: req.body, tabbedServiceindex, tabbedSub3index}))
        .then(data => {res.status(204).json({}); next()})
        .catch(err => next(err))
}

// Delete an existing object:
export function deleteTabbedSub3(req: any, res: any, next: any) {
        if(typeof wrapper.service.deleteTabbedSub3 !== 'function') {
            console.error("Service function deleteTabbedSub3 not found: "+
                "Please implement function deleteTabbedSub3 in a service class tagged with the @service('tabbed-sub3') decorator."
            )
            next(new NotFound("Service function deleteTabbedSub3 not found."))
            return
        }

        const tabbedServiceindex = req.openapi.pathParams['tabbedServiceindex']
    const tabbedSub3index = req.openapi.pathParams['tabbedSub3index']
        Promise.resolve(wrapper.service.deleteTabbedSub3({tabbedServiceindex, tabbedSub3index}))
        .then(() => {res.status(204).json({}); next()})
        .catch(err => next(err))
}
    
