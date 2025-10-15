import { deprecate } from 'util'
import {printEnum} from './print-helper.js'

/**
 * @deprecated Use string type instead of enum Types
 */
enum Types {
    service    = "A Blackbox API service.",
    datatype   = "A datatype used by a service.",
    database   = "A database access class for a single datatype.",
    repository = "A datatype repository.",
    server     = "A Blackbox server.",
    privilege  = "User privilege/permission.",
    extension  = "A Blackbox extension."
}

export default Types
export const printTypes = printEnum(Types)
