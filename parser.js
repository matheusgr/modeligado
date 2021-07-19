class ParseError extends Error {
    constructor(line, ...params) {
        super(...params)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ParseError)
        }
        this.message = "Line " + line + ": " + this.message
        this.name = 'ParseError'
        this.date = new Date()
    }
}


class State {

    constructor() {
        this.state = "ROOT"
        this.lineNumber = 0
    }

    setLine(lineNumber) {
        this.lineNumber = lineNumber
    }

    // --- CHECKS ---
    _check(expectedState) {
        if (this.state !== expectedState) {
            throw new ParseError(this.lineNumber, "Expecting internal state '" + expectedState + "' it was '" + this.state + "'.")
        }
    }

    _notExecuted(state, property) {
        if (this.context && this.context.hasOwnProperty(property)) {
            throw new ParseError(this.lineNumber, "State was already executed: '" + state + "'.")
        }
    }

    // --- CLASS ---
    startClass(name) {
        this._check("ROOT")
        this._notExecuted("ROOT", "name")
        this.context = { "name": name, "key": name }
        this.relations = []
        this.relates = new Set()
        this.state = "CLASS"
    }

    addClassRelation(relatedClass, relation, inverse) {
        this._check("CLASS")
        this.relates.add(relatedClass)
        if (inverse) {
            this.relations.push({ to: this.context.name, from: relatedClass, relationship: relation })
        } else {
            this.relations.push({ from: this.context.name, to: relatedClass, relationship: relation })
        }
    }

    stopClass() {
        this._check("CLASS")
        this.state = "ROOT"
        return { "context": this.context, "relations": this.relations, "relates": this.relates }
    }

    // --- ATTR ---
    startAttrs() {
        this._check("CLASS")
        this._notExecuted("ATTR", "properties")
        this.state = "ATTR"
        this.context.properties = []
    }

    addAttr(attr) {
        this._check("ATTR")
        this.context.properties.push(attr)
    }

    stopAttr() {
        this._check("ATTR")
        this.state = "CLASS"
    }

    // --- METHODS ---
    startMethods() {
        this._check("CLASS")
        this._notExecuted("METHOD", "methods")
        this.state = "METHOD"
        this.context.methods = []
    }

    addMethod(method) {
        this._check("METHOD")
        this.context.methods.push(method)
    }

    stopMethods() {
        this._check("METHOD")
        this.state = "CLASS"
    }

}

// Check current state on state
['Root', 'Class', 'Method', 'Attr'].forEach((method) => {
    State.prototype["is" + method] = function() {
      return this.state === method.toUpperCase()
    }
})


class Extractor {

    constructor() {
        this.lineNumber = 0
        this.conv = {'-' : 'private', '+': 'public', '#': 'protected'}
        // name and if it relation is inversed (from <-> to)
        this.relations = {"extends": ["generalization", false],
                                      "implements": ["generalizationInterface", false],
                                      "association": ["association", false],
                                      "composes": ["composition", true],
                                      "aggregates": ["aggregation", true],
                                      "directionalAssociation": ["directionalAssociation", false]
                            }
        this.modifier = {"static": "class"}
    }

    setLine(lineNumber) {
        this.lineNumber = lineNumber
    }

    _convertVisibility(vis) {
        if (!this.conv.hasOwnProperty(vis)) {
            throw new ParseError(this.lineNumber, "Unknow visibility: " + vis)
        }
        return this.conv[vis]
    }

    _prepareRelation(relation, types) {
        if (!this.relations.hasOwnProperty(relation)) {
            throw new ParseError(this.lineNumber, "Unknow relation: " + relation)
        }
        return {"relation": this.relations[relation][0], "types": types, "inverse": this.relations[relation][1]}        
    }

    removeComment(line) {
        return line.split("//")[0].trim()
    }

    extractRelation(line) {
        let relation = line.split(" ")[0].trim()
        let types = line.substring(relation.length + 1, line.length).split(',').map(x => x.trim())
        return this._prepareRelation(relation, types)
    }

    _correctModifier(line){
        const base = line.split(":").map(x => x.trim())
        const arr = base[0].split(/\s+/).map(x => x.trim())
        if(arr[2]) {  // has modifier
            if (arr[1] in this.modifier){
                arr[1] = this.modifier[arr[1]]
            } else {
                throw new ParseError(this.lineNumber, "Unknow attr modifier " + line);
            }
        } else {
            arr.splice(1, 0, "")  // no modifier
        }
        return [...arr, base[1]]
    }

    extractAttr(line) {
        if (line.indexOf('(') != -1 || line.indexOf(')') != -1) {
            throw new ParseError(this.lineNumber, "Unknow attr format " + line)
        }
        const split = this._correctModifier(line)

        if (split.length != 4) {
            throw new ParseError(this.lineNumber, "Unknow attr format " + line)
        }
        const visibility = this._convertVisibility(split[0])
        const scope = split[1]
        const name = split[2]
        const type = split[3]
        if (!name || !type) {
            throw new ParseError(this.lineNumber, "Unknow attr format " + line)
        }
        return {'name': name, 'scope': scope, 'type': type, 'visibility': visibility}
    }

    extractParameters(params) {
        let resultParams = []
        for (let param of params.split(',').map(x => x.trim())) {
            let aval = param.split(':').map(x => x.trim())
            if (aval.length != 2) {
                throw new ParseError(this.lineNumber, "Unknow param format " + params)
            }
            let name = aval[0]
            let type = aval[1]
            if (!name || !type) {
                throw new ParseError(this.lineNumber, "Unknow param format " + params)
            }
            resultParams.push({'name' : name, 'type': type})
        }
        return resultParams
    }

    _getReturnType(state, signature, result, line) {
        // Not a constructor
        let methodName = signature.substring(0, signature.indexOf('(')).trim()
        if (!state.context['name'].trim().startsWith(methodName)) {
            // has return type
            let signSplit = signature.substring(signature.indexOf(')')).split(':').map(x => x.trim())
            if (signSplit.length < 2 || !signSplit[1]) {
                throw new ParseError(this.lineNumber, "Missing or strange return type " + line)
            }
            result.type = signSplit[1].trim()
        } else {
            if (signature.substring(signature.indexOf(')')).indexOf(":") != -1) {
                throw new ParseError(this.lineNumber, "Constructor should not have return type " + line)
            }
        }
    }

    extractMethod(state, line) {
        const visibilityStr = line.split(" ", 1)[0]
        let result = {'visibility': this._convertVisibility(visibilityStr.trim())}
        
        const modifier = line.split(" ", 2)[1]
        if(modifier in this.modifier){result.scope = this.modifier[modifier]}

        const signature = line.substring(visibilityStr.length + (!result.scope?0:7)).trim()

        result.name = signature.substring(0, signature.indexOf('('))

        if (!result.name) {
            throw new ParseError(this.lineNumber, "Unknow method signature " + line)
        }

        if (signature.indexOf('(') + 1 < signature.indexOf(')')) {
            let paramsStr = signature.substring(signature.indexOf('(') + 1, signature.indexOf(')'))
            result.parameters = this.extractParameters(paramsStr)
        } else if (signature.indexOf('(') > signature.indexOf(')')) {
            throw new ParseError(this.lineNumber, "Unknow method signature " + line)
        }

        this._getReturnType(state, signature, result, line)

        return result
    }

}

class Parser {

    _changeState(lineNumber, state, classes) {
        if (state.isClass()) {
            state.startAttrs()
        } else if (state.isAttr()) {
            state.stopAttr()
            state.startMethods()
        } else if (state.isMethod()) {
            state.stopMethods()
            classes.push(state.stopClass())
            return new State()
        } else {
            throw new ParseError("Line " + lineNumber + ": was expecting a class")
        }
        return state
    }

    _extractData(state, extractor, line) {
        if (state.isRoot()) {
            state.startClass(line)
        } else if (state.isClass()) {
            let relationships = extractor.extractRelation(line)
            for (let class_ of relationships.types) {
                state.addClassRelation(class_, relationships.relation, relationships.inverse)
            }
        } else if (state.isAttr()) {
            state.addAttr(extractor.extractAttr(line))
        } else if (state.isMethod()) {
            state.addMethod(extractor.extractMethod(state, line))
        }
    }

    parse(data) {

        let lineNumber = 0;
        let state = new State()
        const extractor = new Extractor()

        let classes = []
        let arrayOfLines = data.match(/[^\r\n]+/g);
        if (!arrayOfLines) {
            throw new ParseError(0, "No text found.")
        }
    
        for (let line of arrayOfLines.map(x => x.trim())) {
            extractor.setLine(++lineNumber)
            state.setLine(lineNumber)
            line = extractor.removeComment(line)
            if (line.startsWith('//') || !line) {
                continue
            }
            if (line.startsWith("---")) {
                state = this._changeState(lineNumber, state, classes)
                continue
            }
            this._extractData(state, extractor, line)
        }
        state._check("ROOT")
        return classes
    }

}

export { Parser }