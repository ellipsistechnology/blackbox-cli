/**
 * Command line too that takes a source file, a destination file, and a method name.
 * The method body is extracted from the source file and replaces the method body in the destination file.
 */

// Import file system module for reading and writing files
import fs from 'fs'
// Import path utilities (currently unused)
import path from 'path'
// Babel parser for parsing JavaScript/TypeScript code into AST
import {parse} from '@babel/parser'
// Babel traverse for walking and manipulating the AST
import traverse from '@babel/traverse'
// Babel generator for converting AST back to code
import generate from '@babel/generator'
// Command line argument parser
import {Command} from 'commander'
// Console logging utility
import { log } from 'console'

console.log('Initializing replaceFunction...')

log('Starting replaceFunction...')

console.log(`A`);

// Create command line interface
console.log('Creating Command...')
const program = new Command()
console.log('Command created successfully')

console.log('B');

// Define required command line options
console.log('Setting options...')
program
    .requiredOption('-s, --source <file>', 'Source file to extract method body from')
    .requiredOption('-d, --destination <file>', 'Destination file to replace method body in')
    .requiredOption('-m, --method <name>', 'Method name to extract and replace')
console.log('Options set successfully')

console.log('C');

// Parse command line arguments
try {
    console.log('Parsing arguments...')
    program.parse(process.argv)
    console.log('Arguments parsed successfully')
} catch (parseError) {
    console.error('Error parsing command line arguments:', parseError)
    process.exit(1)
}

console.log('D');

// Extract parsed options from the program
let options
try {
    console.log('Getting options...')
    options = program.opts()
    console.log('Options retrieved:', options)
} catch (optsError) {
    console.error('Error getting program options:', optsError)
    process.exit(1)
}

console.log('E');

/**
 * Extracts the body of a method from a source file.
 * Searches for class methods, object methods, and function declarations matching the provided method name.
 * @param filePath - Path to the source file
 * @param methodName - Name of the method to extract
 * @returns The extracted method body as a string, or null if not found
 */
function extractMethodBody(filePath: string, methodName: string): string | null {
    // Read the source file as text
    const code = fs.readFileSync(filePath, 'utf-8')
    // Parse the code into an Abstract Syntax Tree (AST) with TypeScript support
    const ast = parse(code, {sourceType: 'module', plugins: ['typescript']})
    // Store the extracted method body
    let methodBody: string | null = null

    // Walk through the AST looking for methods matching the target name
    traverse(ast, {
        // Check for class methods (e.g., methods inside a class)
        ClassMethod(path) {
            if (path.node.key.type === 'Identifier' && path.node.key.name === methodName) {
                // Generate the method body as code and store it
                methodBody = generate(path.node.body).code
                // Stop traversal once found
                path.stop()
            }
        },
        // Check for object methods (e.g., methods in object literals)
        ObjectMethod(path) {
            if (path.node.key.type === 'Identifier' && path.node.key.name === methodName) {
                // Generate the method body as code and store it
                methodBody = generate(path.node.body).code
                // Stop traversal once found
                path.stop()
            }
        },
        // Check for function declarations
        FunctionDeclaration(path) {
            if (path.node.id?.name === methodName) {
                // Generate the function body as code and store it
                methodBody = generate(path.node.body).code
                // Stop traversal once found
                path.stop()
            }
        }
    })

    // Return the extracted method body
    return methodBody
}

/**
 * Replaces the body of a method in a destination file with new code.
 * Searches for class methods, object methods, and function declarations matching the provided method name.
 * @param filePath - Path to the destination file to modify
 * @param methodName - Name of the method to replace
 * @param newBody - The new method body code to insert
 */
function replaceMethodBody(filePath: string, methodName: string, newBody: string): void {
    // Read the destination file as text
    const code = fs.readFileSync(filePath, 'utf-8')
    // Parse the code into an Abstract Syntax Tree (AST) with TypeScript support
    const ast = parse(code, {sourceType: 'module', plugins: ['typescript']})

    // Walk through the AST looking for methods to replace
    traverse(ast, {
        // Replace class methods
        ClassMethod(path) {
            if (path.node.key.type === 'Identifier' && path.node.key.name === methodName) {
                // Parse the new body code as a temporary function to extract its body AST
                const newAst = parse(`function temp() { ${newBody} }`, {sourceType: 'module', plugins: ['typescript']})
                // Extract the body from the temporary function
                const newBodyAst = (newAst.program.body[0] as any).body
                // Replace the method body with the new AST
                path.node.body = newBodyAst
                // Stop traversal once replaced
                path.stop()
            }
        },
        // Replace object methods
        ObjectMethod(path) {
            if (path.node.key.type === 'Identifier' && path.node.key.name === methodName) {
                // Parse the new body code as a temporary function to extract its body AST
                const newAst = parse(`function temp() { ${newBody} }`, {sourceType: 'module', plugins: ['typescript']})
                // Extract the body from the temporary function
                const newBodyAst = (newAst.program.body[0] as any).body
                // Replace the method body with the new AST
                path.node.body = newBodyAst
                // Stop traversal once replaced
                path.stop()
            }
        },
        // Replace function declarations
        FunctionDeclaration(path) {
            if (path.node.id?.name === methodName) {
                // Parse the new body code as a temporary function to extract its body AST
                const newAst = parse(`function temp() { ${newBody} }`, {sourceType: 'module', plugins: ['typescript']})
                // Extract the body from the temporary function
                const newBodyAst = (newAst.program.body[0] as any).body
                // Replace the function body with the new AST
                path.node.body = newBodyAst
                // Stop traversal once replaced
                path.stop()
            }
        }
    })

    // Generate the modified AST back into code
    const output = generate(ast).code
    // Write the modified code back to the destination file
    fs.writeFileSync(filePath, output, 'utf-8')
}

// Main execution: Extract and replace method body
try {
    console.log(`Extracting method body of '${options.method}' from '${options.source}'...`)
    // Extract the method body from the source file
    const methodBody = extractMethodBody(options.source, options.method)

    // If method was found, replace it in the destination file
    if (methodBody) {
        // Replace the method in the destination file with the extracted body
        replaceMethodBody(options.destination, options.method, methodBody)
        console.log(`Method body of '${options.method}' has been replaced in '${options.destination}'`)
    } else {
        // If method not found in source, log error
        console.error(`Method '${options.method}' not found in '${options.source}'`)
    }
} catch (error) {
    console.error('An error occurred:', error)
    process.exit(1)
}