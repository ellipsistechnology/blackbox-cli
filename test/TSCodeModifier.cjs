const { log } = require('console')
const fs = require('fs')

// TODO: Copy class properties in template that aren't in dest.
// TODO: Copy methods in template that aren't in dest.

class TSCodeModifier {
  constructor(template, dest) {
    this.destCode = fs.readFileSync(dest, 'utf-8')
    this.templateCode = fs.readFileSync(template, 'utf-8')
  }

  listImports(code) {
    const importRegex = /import\s+(\{?[\w\s,]+\}?)\s+from\s+['"](.+)['"]/g
    const imports = []
    let match
    while((match = importRegex.exec(code)) !== null) {
      imports.push({name: match[1], path: match[2]})
    }
    return imports
  }

  combineInports() {
    // Add imports from template that aren't in source to the list of imports from source:
    const sourceImports = this.listImports(this.destCode)
    const templateImports = this.listImports(this.templateCode)
    const combinedImports = [...sourceImports]
    templateImports.forEach(templateImport => {
      if(!combinedImports.some(srcImport => srcImport.path === templateImport.path)) {
        combinedImports.push(templateImport)
      }
    })

    // Generate the complete set of import statements:
    return combinedImports.map(imp => `import ${imp.name} from '${imp.path}'`).join('\n')
  }

  /**
   * @returns The code between imports and the class declaration.
   */
  getPrefixCode(source) {
    // Get end of imports:
    const importRegex = /import\s+(\{?[\w\s,]+\}?)\s+from\s+['"](.+)['"]/
    const lastImportIndex = source.split('\n').reduce((lastIndex, line, index) => {
      if(importRegex.test(line)) {
        
        return index
      }
      return lastIndex
    }, -1)

    // Return the code between the end of imports and the start of the class declaration:
    return source.split('\n').slice(lastImportIndex + 1, this.getClassIndex(source)).join('\n')
  }

  getConstructorBody(source) {
    const constructorRegex = /constructor\s*\(([^)]*)\)\s*{/
    const match = constructorRegex.exec(source)
    if(match) {
      const constructorBodyStart = match.index + match[0].length
      let braceCount = 1
      let constructorBodyEnd = constructorBodyStart
      while(braceCount > 0 && constructorBodyEnd < source.length) {
        if(source[constructorBodyEnd] === '{') {
          braceCount++
        } else if(source[constructorBodyEnd] === '}') {
          braceCount--
        }
        constructorBodyEnd++
      }
      return source.slice(constructorBodyStart, constructorBodyEnd-1).trim() // remove the closing brace
    }
    return null
  }

  getClassIndex(source) {
    const classRegex = /(export)*\s*class\s+\w+/
    let classIndex = source.split('\n').findIndex(line => classRegex.test(line))

    // Check for decorators on lines beore the class declaration:
    for (let i = classIndex - 1; i >= 0; i--) {
      if (/^\s*@/.test(source.split('\n')[i])) {
        classIndex = i
      } else {
        break
      }
    }
    return classIndex
  }

  /**
   * @param {*} source code to extract method map from
   * @returns A map of method names to their bodies, extracted from the source code.
   */
  getMethodMap(source) {
    // Regex to find method declaration not including the body (g flag needed for exec loop):
    const methodRegex = /(\w+)\s*\(([^)]*)\)\s*:\s*[\w<>\[\]]+\s*{/g
    const methodMap = {}
    let match
    while((match = methodRegex.exec(source)) !== null) {
      const methodName = match[1]
      const methodBodyStart = match.index + match[0].length
      let braceCount = 1
      let methodBodyEnd = methodBodyStart
      while(braceCount > 0 && methodBodyEnd < source.length) {
        if(source[methodBodyEnd] === '{') {
          braceCount++
        } else if(source[methodBodyEnd] === '}') {
          braceCount--
        }
        methodBodyEnd++
      }
      methodMap[methodName] = {
        body: source.slice(methodBodyStart, methodBodyEnd-1).trim() // remove the closing brace
      }
    }
    return methodMap
  }

  /**
   * Replaces all method bodies in the source code with the corresponding method bodies from the method map. 
   * If a method in the source code doesn't have a corresponding method body in the method map, it is left unchanged.
   * If a method in the method map doesn't have a corresponding method in the source code, it is added.
   * @param {*} source 
   * @param {*} methodMap 
   * @returns 
   */
  replaceMethodBodies(source, methodMap) {
    // Find the first backet of each method and replace the body with the corresponding body from the method map:
    // (\w+)\s*\(([^)]*)\)\s*:\s*[\w<>\[\]\{\}:]+\s*{[\n\r]+
    const methodRegex = /(\w+)\s*\(([^)]*)\)\s*:.+{/g
    let modifiedSource = ''
    let match
    let index = 0
    while((match = methodRegex.exec(source)) !== null) {
      const methodName = match[1]
      const methodBodyStart = match.index + match[0].length
      let braceCount = 1
      let methodBodyEnd = methodBodyStart
      while(braceCount > 0 && methodBodyEnd < source.length) {
        if(source[methodBodyEnd] === '{') {
          braceCount++
        } else if(source[methodBodyEnd] === '}') {
          braceCount--
        }
        methodBodyEnd++
      }
      // Append code up to this point, then append the new method body:
      if(methodMap[methodName]) {
        methodMap[methodName].added = true
        modifiedSource += source.slice(index, methodBodyStart) + '\n    ' + methodMap[methodName].body + '\n  '
        index = methodBodyEnd-1
      }
    }

    // Add the rest of the source code after the last method:
    modifiedSource += source.slice(index)

    return modifiedSource
  }

  mergeConstructors(destSource, templateConstructorBody) {
    const constructorRegex = /constructor\s*\(([^)]*)\)\s*{/
    const match = constructorRegex.exec(destSource)
    if(match) {
      const constructorBodyStart = match.index + match[0].length
      let braceCount = 1
      let constructorBodyEnd = constructorBodyStart
      while(braceCount > 0 && constructorBodyEnd < destSource.length) {
        if(destSource[constructorBodyEnd] === '{') {
          braceCount++
        } else if(destSource[constructorBodyEnd] === '}') {
          braceCount--
        }
        constructorBodyEnd++
      }
      return destSource.slice(0, constructorBodyEnd-1) + '\n    ' + templateConstructorBody + '\n  ' + destSource.slice(constructorBodyEnd-1)
    }
    return destSource
  }

  extractMethodCode(source, methodName) {
    const methodRegex = new RegExp(`${methodName}\\s*\\(([^)]*)\\)\\s*:\\s*[\\w<>\\[\\]]+\\s*{`)
    const match = methodRegex.exec(source)
    if(match) {
      const methodBodyStart = match.index + match[0].length
      let braceCount = 1
      let methodBodyEnd = methodBodyStart
      while(braceCount > 0 && methodBodyEnd < source.length) {
        if(source[methodBodyEnd] === '{') {
          braceCount++
        } else if(source[methodBodyEnd] === '}') {
          braceCount--
        }
        methodBodyEnd++
      }
      return source.slice(match.index, methodBodyEnd).trim()
    }
    return null
  }

  generateCode() {
    // Get the base class code from the destination file:
    let classCode = this.destCode.split('\n').slice(this.getClassIndex(this.destCode)).join('\n')

    // Replace method bodies in the base class code with those from the template:
    const methodMap = this.getMethodMap(this.templateCode)
    classCode = this.replaceMethodBodies(classCode, methodMap)

    // Add any methods from the template that aren't in the base class code:
    // Object.keys(methodMap).forEach(methodName => {
    //   if(!methodMap[methodName].added) {
    //     // Add the method to the end of the class, before the last closing brace:
    //     const lastBraceIndex = classCode.lastIndexOf('}')
    //     classCode = classCode.slice(0, lastBraceIndex) + '\n\n  ' + this.extractMethodCode(template, methodName) + '\n' + classCode.slice(lastBraceIndex)
    //   }
    // })

    // Update the constructor body in the base class code with that from the template:
    classCode = this.mergeConstructors(classCode, this.getConstructorBody(this.templateCode))

    // Combine all parts together:
    return  this.combineInports() + 
            this.getPrefixCode(this.destCode) + 
            this.getPrefixCode(this.templateCode) +
            '\n' +
            classCode
  }
}

const template = process.argv[2]
const dest = process.argv[3]
if(!dest || !template) {
  throw new Error('Please provide template and desination file paths as command line arguments.')
}
if(!fs.existsSync(dest)) {
  throw new Error(`Destination file ${dest} not found.`)
}
if(!fs.existsSync(template)) {
  throw new Error(`Template file ${template} not found.`)
}

const modifier = new TSCodeModifier(template, dest)
fs.writeFileSync(dest, modifier.generateCode(), 'utf-8')
