import {printEnum} from './print-helper.js'

enum Types {
    service    = "A Blackbox API service.",
    datatype   = "A datatype used by a service.",
    database   = "A database access class for a single datatype.",
    repository = "A datatype repository.",
    server     = "A Blackbox server.",
    privilege  = "User privilege/permission."
}

export default Types
export const printTypes = printEnum(Types)
