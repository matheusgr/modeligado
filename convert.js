function extractParameters(parameters) {
    if (!parameters) {
        return ""
    }
    let first = true
    let paramResult = ""
    for (let param of parameters) {
        let paramName = param.name
        let paramType = processType(param.type)
        if (!first) {
            paramResult += ', '
        }
        first = false
        paramResult += paramType + " " + paramName
    }
    return paramResult
}

function extractProperty (prop, excludeType = false) {
  return prop.visibility + ' ' +
            (excludeType ? '' : processType(prop.type) + ' ') +
            prop.name
}

<<<<<<< HEAD
function extractMethods (methods, constructors, prop, isInterface) {
  const parameters = prop.parameters
  if (processType(prop.type)) { // Method -- has return
    const methodSign = extractProperty(prop) + '(' + extractParameters(parameters) + ')'
    methods.push(methodSign + (isInterface ? ';\n' : ' {\n\n    }\n'))
  } else { // Constructor
    constructors.push(extractProperty(prop, true) +
                        '(' + extractParameters(parameters) + ')' +
                        ' {\n\n    }\n')
  }
}
=======
function extractProperty(prop, excludeType=false) {
    let propVisibility = prop.visibility + " "
    let propType = "";
    if (!excludeType) {
        propType = processType(prop.type) + " "
    }
    let propName = prop.name
    return (propVisibility + propType + propName)
}

function extractMethods(methods, constructors, prop, isInterface) {
    let parameters = prop.parameters
    if (processType(prop.type)) {  // Method -- has return
        let methodSign = extractProperty(prop) + "(" +  extractParameters(parameters) + ")"
        if (isInterface) {
            methodSign += ";\n"
        } else {
            methodSign += " {\n\n    }\n"
        }
        methods.push(methodSign)
    } else { // Constructor
        constructors.push(extractProperty(prop, true) + "(" +  extractParameters(parameters) + ") {\n\n    }\n")
    }
}

function extractRelation(prop, implement) {
    let extend = ""
    let propTo = prop.to.split(" ", 1)
    let propRelationship = prop.relationship
    if (propRelationship === "generalization") {
        extend += " extends " + propTo
    }
    if (propRelationship === "generalizationInterface") {
        implement.push(propTo)
    }
    return extend
}

function extractClassSignature(qualifier) {
    let classSign = "public "
        if (qualifier === "<Interface>") {
            classSign += "interface "
        } else if (qualifier === "<Abstract>") {
            classSign += "abstract class "
        } else {
            classSign += "class "
        }
    return classSign;
}

function generateSourceFile(package_, classSign, props, constructors, methods) {
    let result = ""
    
    if (package_) {
        result += "package " + package_ + ";\n\n"
    }

    result += classSign + " {\n"
    
    if (props.length > 0) {
        result += "\n    " + props.join("\n    ") + "\n"
    }

    if (constructors.length > 0) {
        result += "\n    " + constructors.join("\n    ")
    }

    if (methods.length > 0) {
        result += "\n    " + methods.join("\n    ")
    }
    
    result += "\n}"

    return result
}

function process(parseData, package_) {
    let results = {}
    for (let class_ of parseData) {
        let context = class_.context
        let nameArray = context.name.split(" ")
        let fileName = nameArray[0]
>>>>>>> Refactor convert to smaller functions.

function extractRelation (prop, implement) {
  let extend = ''
  const propTo = prop.to.split(' ', 1)
  const propRelationship = prop.relationship
  if (propRelationship === 'generalization') {
    extend += ' extends ' + propTo
  }
  if (propRelationship === 'generalizationInterface') {
    implement.push(propTo)
  }
  return extend
}

function extractClassSignature (qualifier) {
  const qualifierMap = { '<Interface>': 'interface ', '<Abstract>': 'abstract class ', '': 'class ' }
  return 'public ' + qualifierMap[qualifier]
}

<<<<<<< HEAD
function generateSourceFile (package_, classSignature, props, constructors, methods) {
  return (package_ ? 'package ' + package_ + ';\n\n' : '') +
                classSignature + ' {\n' +
                [props, constructors, methods]
                  .filter(x => x.length > 0)
                  .map(x => '\n    ' + x.join('\n    '))
                  .join('') +
                '\n}'
}

function process (parseData, package_) {
  const results = {}
  for (const class_ of parseData) {
    const context = class_.context
    const nameArray = context.name.split(' ')
    const fileName = nameArray[0]

    let qualifier = ''
    if (nameArray.length > 1) {
      qualifier = nameArray[1]
    }

    let classSignature = extractClassSignature(qualifier)
    const isInterface = (qualifier === '<Interface>')

    classSignature += fileName

    const props = []
    const methods = []
    const constructors = []
    const implement = []

    context.properties.forEach(prop => props.push(extractProperty(prop) + ';\n'))
    context.methods.forEach(prop => extractMethods(methods, constructors, prop, isInterface))
    classSignature += class_.relations.map(prop => extractRelation(prop, implement)).join('')

    if (implement.length > 0) {
      classSignature += ' implements ' + implement.join(', ')
=======
        let classSign = extractClassSignature(qualifier)
        let isInterface = (qualifier === "<Interface>")
        
        classSign += fileName
        
        let props = []
        let methods = []
        let constructors = []
        let implement = []

        for (let prop of context.properties) {
            props.push(extractProperty(prop) +  ";")
        }

        for (let prop of context.methods) {
            extractMethods(methods, constructors, prop, isInterface)
        }

        for (let prop of class_.relations) {
            classSign += extractRelation(prop, implement)
        }
        
        if (implement.length > 0) {
            classSign += " implements " + implement.join(", ")
        }

        results[fileName] = generateSourceFile(package_, classSign, props, constructors, methods)
>>>>>>> Refactor convert to smaller functions.
    }

    results[fileName] = generateSourceFile(package_, classSignature, props, constructors, methods)
  }
  return results
}

export { process }
