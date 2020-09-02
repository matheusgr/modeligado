
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

function processType(t) {
    if (t === "str") {
        return "String"
    }
    return t
}

function process(parseData, package_) {
    let results = {}
    for (let class_ of parseData) {
        let context = class_.context
        let nameArray = context.name.split(" ")
        let fileName = nameArray[0]
        const ident = "   "

        let qualifier = null
        if (nameArray.length > 1) {
            qualifier = nameArray[1]
        }

        let classSign = "public "
        let isInterface = false
        if (qualifier === "<Interface>") {
            classSign += "interface "
            isInterface = true
        } else if (qualifier === "<Abstract>") {
            classSign += "abstract class "
        } else {
            classSign += "class "
        }
        
        classSign += fileName
        
        let props = []
        let methods = []
        let constructors = []
        let implement = []

        for (let prop of context.properties) {
            let propName = prop.name
            let propType = processType(prop.type)
            let propVisibility = prop.visibility
            props.push(propVisibility + " " + propType + " " + propName + ";")
        }
        for (let prop of context.methods) {
            let propName = prop.name
            let propType = processType(prop.type)
            let propVisibility = prop.visibility
            let parameters = prop.parameters
            if (propType) {  // Method
                let methodSign = propVisibility + " " + propType + " " + propName + "(" +  extractParameters(parameters) + ")"
                if (isInterface) {
                    methodSign += ";"
                } else {
                    methodSign += "{\n\n    }\n"
                }
                methods.push(methodSign)
            } else { // Constructor
                constructors.push(propVisibility + " " + propName + "(" +  extractParameters(parameters) + ") {\n\n   }\n")
            }
        }
        for (let prop of class_.relations) {
            let propTo = prop.to.split(" ", 1)
            let propRelationship = prop.relationship
            if (propRelationship === "generalization") {
                classSign += " extends " + propTo
            }
            if (propRelationship === "generalizationInterface") {
                implement.push(propTo)
            }
        }
        if (implement.length > 0) {
            classSign += " implements " + implement.join(", ")
        }
        classSign += " {"
        
        let result = ""
        if (package_) {
            result += "package " + package_ + ";\n\n"
        }
        result += classSign + "\n    " + props.join("\n    ") + "\n    " + constructors.join("\n    ") + "\n    " + methods.join("\n    ") + "\n}"
        results[fileName] = result
    }
    return results
}

export {process}