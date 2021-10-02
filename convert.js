function extractParameters (parameters) {
  return parameters?.map(param => processType(param.type) + ' ' + param.name).join(', ') || ''
}

function processType (t) {
  return (t === 'str') ? 'String' : t
}

function extractProperty (prop, excludeType = false) {
  return prop.visibility + ' ' +
            (excludeType ? '' : processType(prop.type) + ' ') +
            prop.name
}

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
    }

    results[fileName] = generateSourceFile(package_, classSignature, props, constructors, methods)
  }
  return results
}

export { process }
