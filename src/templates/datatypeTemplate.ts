import { toCammelCase, jsonTypes } from "../utils.js"

export interface TemplateMap {
  name:string
  parentClasses?:string[]
  properties:{
    type:string
    name:string
  }[]
  additionalProperties?: string
  values?:string[]
  required:string[]
}

export default function ({name, properties, additionalProperties, parentClasses, values, required}:TemplateMap): string {

  const className = toCammelCase(name)

  let imports = ''
  new Set(properties // use a set to remove duplicates
    .map(property => property.type) // extract types from properties
    .filter(type => !type.startsWith("'")) // remove string literal types including enums
    .map(type => type.endsWith('[]')?type.substring(0, type.length-2):type) // extract type from array
    .reduce((classes, type) => classes.concat(type.split('&')), <string[]>[]) // split Type1&Type2
    .reduce((classes, type) => classes.concat(type.split('|')), <string[]>[]) // split Type1|Type2
    .filter(type => type && type !== 'any' && type !== 'undefined' && !(<any>jsonTypes).includes(type)) // remove empty && json types etc.
    .filter(type => type !== className) // remove self references
    .map(name => toCammelCase(name))
  ).forEach(type => imports += `import ${type} from './${type}.js'\n`)

  const classOrInterfaceOrEnum = values ? 'enum' : 'interface'

  // /${pattern}/.test(this.toString())

  if(parentClasses) {
    parentClasses.filter((className:string) => !(<any>jsonTypes).includes(className.toLowerCase())).forEach((className:string) => imports += `import {${className}} from './${className}'\n`)
  }

  return `${imports?imports+'\n':''}${!values?'export default ':''}${classOrInterfaceOrEnum} ${className}${parentClasses ? ' extends '+parentClasses.join(', '):''} {
  ${properties.map( property => `${toCammelCase(property.name, false)}${required.includes(property.name)?'':'?'}: ${toCammelCase(property.type)}`).join('\n  ')
  }${values?values.join(',\n  '):''}${additionalProperties || ''}
}
${values?`export default ${className}`:''}
`
}
