function extractParameters(parameters) {
    return parameters?.map(param => processType(param.type) + " " + param.name).join(", ") || "";
}

function processType(t) {
    return (t === "str") ? "String" : t
}

function extractProperty(prop, excludeType=false) {
    return prop.visibility + " "
            + (excludeType ? "" : processType(prop.type) + " ")
            + prop.name
}

function extractMethods(methods, constructors, prop, isInterface) {
    let parameters = prop.parameters
    if (processType(prop.type)) {  // Method -- has return
        let methodSign = extractProperty(prop) + "(" +  extractParameters(parameters) + ")"
        methods.push(methodSign + (isInterface ? ";\n" : " {\n\n    }\n"))
    } else { // Constructor
        constructors.push(extractProperty(prop, true)
                            + "(" +  extractParameters(parameters) + ")"
                            + " {\n\n    }\n")
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
    const qualifierMap = {"<Interface>" : "interface ", "<Abstract>": "abstract class ", "": "class "}
    return "public " + qualifierMap[qualifier];
}

function generateSourceFile(package_, classSignature, props, constructors, methods) {
    return (package_ ? "package " + package_ + ";\n\n" : "")
                + classSignature + " {\n"
                + [props, constructors, methods]
                    .filter(x => x.length > 0)
                    .map(x => "\n    " + x.join("\n    "))
                    .join("")
                + "\n}"
}

function process(parseData, package_) {
    let results = {}
    for (let class_ of parseData) {
        let context = class_.context
        let nameArray = context.name.split(" ")
        let fileName = nameArray[0]

        let qualifier = ""
        if (nameArray.length > 1) {
            qualifier = nameArray[1]
        }

        let classSignature = extractClassSignature(qualifier)
        let isInterface = (qualifier === "<Interface>")
        
        classSignature += fileName
        
        let props = []
        let methods = []
        let constructors = []
        let implement = []

        context.properties.forEach(prop => props.push(extractProperty(prop) +  ";\n"));
        context.methods.forEach(prop => extractMethods(methods, constructors, prop, isInterface));
        class_.relations.forEach(prop => classSignature += extractRelation(prop, implement));
        
        if (implement.length > 0) {
            classSignature += " implements " + implement.join(", ")
        }

        results[fileName] = generateSourceFile(package_, classSignature, props, constructors, methods)
    }
    return results
}

export {process}