import {printEnum} from './print-helper.js'

enum Commands {
	init     = "Initialise a Blackbox API project with an OpenAPI document.",
	add      = "Add a new item; must provide a type.",
	update   = "Update an existing item; must provide a type.",
	list     = "Shows a list of items; must provide a type.",
	delete   = "Delete an itesm; must provide a type.",
	generate = "Generate server code from the OpenAPI document."
}

export default Commands;
export const printCommands = printEnum(Commands)
