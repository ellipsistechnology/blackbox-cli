import { autowired, autowiredService } from "ellipsis-ioc"
import { makeService, makeServiceList, makeUniqueService } from "../blackbox-utils.js"
import { NotFound, InternalServerError } from '../HttpError.js'

class ServiceWrapper {
    @autowiredService('hello')
    service!: any;

    @autowired('openapi-doc')
    openapiDoc: any
}

const wrapper = new ServiceWrapper()

// Get the unique object for '/hello':
export function getHello(req: any, res: any, next: any) {
        const meta = req.query.meta
        
        if(meta !== undefined) {
            // Call the user specified metatdata function if it exists:
            if(typeof wrapper.service.getHelloMeta === 'function') { 
                Promise.resolve(wrapper.service.getHelloMeta( {} ))
                .then(metadata => {res.status(200).json(metadata); next()})
                .catch(err => next(err))
            } else {
                res.status(200).json(makeUniqueService(req, wrapper.openapiDoc))
            }
        } else {
            if(typeof wrapper.service.getHello !== 'function') {
                console.error("Service function getHello not found: "+
                    "Please implement function getHello in a service class tagged with the @service('hello') decorator."
                )
                next(new NotFound("Service function getHello not found."))
                return
            }

            Promise.resolve(wrapper.service.getHello({}))
            .then(list => {res.status(200).json(list); next()})
            .catch(err => next(err))
        }
}

// Create a new string object:
export function createHello(req: any, res: any, next: any) {
        if(typeof wrapper.service.createHello !== 'function') {
            console.error("Service function createHello not found: "+
                "Please implement function createHello in a service class tagged with the @service('hello') decorator."
            )
            next(new NotFound("Service function createHello not found."))
            return
        }

        
        Promise.resolve(wrapper.service.createHello({data: req.body, }))
        .then(data => {
            res.status(200).json(data)
            next()
        })
        .catch(err => next(err))
}

