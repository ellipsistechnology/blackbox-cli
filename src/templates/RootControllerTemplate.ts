export default function () {
    return`import { autowired, autowiredService } from "ellipsis-ioc"
import { ServiceList } from "../blackbox-utils.js";
import { Metadata } from "../blackbox-utils.js";
import { makeServiceList } from "../blackbox-utils.js";

export interface RootService {
    getRootServiceList(): ServiceList & Metadata
}

class RootController {
    @autowiredService('root-service')
    rootService: RootService | undefined;

    @autowired('openapi-doc')
    openapiDoc: any

    getRootService(req: any): ServiceList & Metadata {
        // User the root service if provided:
        if(typeof this.rootService?.getRootServiceList === 'function') {
            return this.rootService.getRootServiceList()
        } else {
            // Get the paths that start at the root but do not have sub-paths
            // and generate services for them:
            return makeServiceList(req, this.openapiDoc)
        }
    }
}

const rootController = new RootController()

export function getRootService(req: any, res: any) {
    res.status(200).json(rootController.getRootService(req))
}`
}