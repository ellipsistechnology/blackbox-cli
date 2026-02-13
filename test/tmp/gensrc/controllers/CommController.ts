import { autowired, autowiredService } from "ellipsis-ioc"
import { makeService, makeServiceList, makeUniqueService } from "../blackbox-utils.js"
import { NotFound, InternalServerError } from '../HttpError.js'

class ServiceWrapper {
    @autowiredService('comm')
    service!: any;

    @autowired('openapi-doc')
    openapiDoc: any
}

const wrapper = new ServiceWrapper()

// Get the unique object for '/comm':
export function getComm(req: any, res: any, next: any) {
        const meta = req.query.meta
        
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getCommMeta === 'function') { 
                Promise.resolve(wrapper.service.getCommMeta( {} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                res.status(200).json(makeUniqueService(req, wrapper.openapiDoc))
            }
        } else {
            if(typeof wrapper.service.getComm !== 'function') {
                console.error("Service function getComm not found: "+
                    "Please implement function getComm in a service class tagged with the @service('comm') decorator."
                )
                next(new NotFound("Service function getComm not found."))
                return
            }

            Promise.resolve(wrapper.service.getComm({}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Create a new string object:
export function createComm(req: any, res: any, next: any) {
        if(typeof wrapper.service.createComm !== 'function') {
            console.error("Service function createComm not found: "+
                "Please implement function createComm in a service class tagged with the @service('comm') decorator."
            )
            next(new NotFound("Service function createComm not found."))
            return
        }

        
        Promise.resolve(wrapper.service.createComm({data: req.body, }))
        .then(data => {
            res.status(200).json(data)
            next()
        })
        .catch(err => next(err))
}

// Replace an existing string object:
export function replaceComm(req: any, res: any, next: any) {
        if(typeof wrapper.service.replaceComm !== 'function') {
            console.error("Service function replaceComm not found: "+
                "Please implement function replaceComm in a service class tagged with the @service('comm') decorator."
            )
            next(new NotFound("Service function replaceComm not found."))
            return
        }

        
        Promise.resolve(wrapper.service.replaceComm({data: req.body, }))
        .then(data => {res.status(204).json({}); next()})
        .catch(err => next(err))
}

// Update an existing string object:
export function updateComm(req: any, res: any, next: any) {
        if(typeof wrapper.service.updateComm !== 'function') {
            console.error("Service function updateComm not found: "+
                "Please implement function updateComm in a service class tagged with the @service('comm') decorator."
            )
            next(new NotFound("Service function updateComm not found."))
            return
        }

        
        Promise.resolve(wrapper.service.updateComm({data: req.body, }))
        .then(data => {res.status(204).json({}); next()})
        .catch(err => next(err))
}

// Delete an existing object:
export function deleteComm(req: any, res: any, next: any) {
        if(typeof wrapper.service.deleteComm !== 'function') {
            console.error("Service function deleteComm not found: "+
                "Please implement function deleteComm in a service class tagged with the @service('comm') decorator."
            )
            next(new NotFound("Service function deleteComm not found."))
            return
        }

        
        Promise.resolve(wrapper.service.deleteComm({}))
        .then(() => {res.status(204).json({}); next()})
        .catch(err => next(err))
}
    
