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

class StateError extends ParseError {
    constructor(...params) {
        super(...params)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, StateError)
        }
        this.name = 'StateError'
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
            throw new StateError(this.lineNumber, "Expecting internal state '" + expectedState + "'.")
        }
    }

    _notExecuted(state, property) {
        if (this.context && this.context.hasOwnProperty(property)) {
            throw new StateError(this.lineNumber, "State '" + state + "' was already executed.")
        }
    }

    // --- CLASS ---
    startClass(name) {
        this._check("ROOT")
        this._notExecuted("ROOT", "name")
        this.context = { "name": name, "key": name }
        this.relations = []
        this.state = "CLASS"
    }

    addClassRelation(relatedClass, relation, inverse) {
        this._check("CLASS")
        if (inverse) {
            this.relations.push({ to: this.context.name, from: relatedClass, relationship: relation })
        } else {
            this.relations.push({ from: this.context.name, to: relatedClass, relationship: relation })
        }
    }

    stopClass() {
        this._check("CLASS")
        this.state = "ROOT"
        return { "context": this.context, "relations": this.relations }
    }

    // --- ATTR ---
    startAttrs() {
        this._check("CLASS")
        this._notExecuted("CLASS", "properties")
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
        this._notExecuted("CLASS", "methods")
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

class ExtractError extends ParseError {
    constructor(...params) {
        super(...params)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ExtractError)
        }
        this.name = 'ExtractError'
        this.date = new Date()
    }
}


class Extractor {

    constructor() {
        this.lineNumber = 0
        this.conv = {'-' : 'private', '+': 'public', '#': 'protected'}
        // name and if it relation is inversed (from <-> to)
        this.relations = {"extends": ["generalization", false],
                                      "implements": ["generalizationInterface", false],
                                      "association": ["association", false],
                                      "composes": ["composition", true],
                                      "aggregates": ["aggregation", true]
                            }
    }

    setLine(lineNumber) {
        this.lineNumber = lineNumber
    }

    _convertVisibility(vis) {
        if (!this.conv.hasOwnProperty(vis)) {
            throw new ExtractError(this.lineNumber, "Unknow visibility: " + vis)
        }
        return this.conv[vis]
    }

    _prepareRelation(relation, types) {
        if (!this.relations.hasOwnProperty(relation)) {
            throw new ExtractError(this.lineNumber, "Unknow relation: " + relation)
        }
        return {"relation": this.relations[relation][0], "types": types, "inverse": this.relations[relation][1]}        
    }

    extractRelation(line) {
        let relation = line.split(" ")[0].trim()
        let types = line.substring(relation.length + 1, line.length).split(',').map(x => x.trim())
        return this._prepareRelation(relation, types)
    }

    extractAttr(line) {
        const split = line.split(" ").map(x => x.trim())
        if (split.length != 3) {
            throw new ExtractError(this.lineNumber, "Unknow attr format " + line)
        }
        const visibility = this._convertVisibility(split[0])
        const name = split[1].substring(0, split[1].length - 1)
        const type = split[2]
        return {'name': name, 'type': type, 'visibility': visibility}
    }

    extractParameters(params) {
        let resultParams = []
        for (let param of params.split(',').map(x => x.trim())) {
            let aval = param.split(':').map(x => x.trim())
            if (aval.length != 2) {
                throw new ExtractError(this.lineNumber, "Unknow param format " + params)
            }
            let name = aval[0]
            let type = aval[1]
            if (!name || !type) {
                throw new ExtractError(this.lineNumber, "Unknow param format " + params)
            }
            resultParams.push({'name' : name, 'type': type})
        }
        return resultParams
    }

    extractMethod(line) {
        const visibilityStr = line.split(" ", 1)[0]
        let result = {'visibility': this._convertVisibility(visibilityStr.trim())}

        const sign = line.substring(visibilityStr.length).trim()

        result.name = sign.substring(0, sign.indexOf('('))

        if (!result.name) {
            throw new ExtractError(this.lineNumber, "Unknow method signature " + line)
        }

        if (sign.indexOf('(') + 1 < sign.indexOf(')')) {
            let paramsStr = sign.substring(sign.indexOf('(') + 1, sign.indexOf(')'))
            result.parameters = this.extractParameters(paramsStr)
        }

        // Not a constructor
        if (sign.substring(0, 1) !== sign.substring(0, 1).toUpperCase()) {
            // has return type
            let signSplit = sign.substring(sign.indexOf(')')).split(':').map(x => x.trim())
            if (signSplit.length < 2 || !signSplit[1]) {
                throw new ExtractError(this.lineNumber, "Missing or strange return type " + line)
            }
            result.type = signSplit[1].trim()
        } else {
            if (sign.substring(sign.indexOf(')')).indexOf(":") != -1) {
                throw new ExtractError(this.lineNumber, "Constructor should not have return type " + line)
            }
        }

        return result
    }

}

class Parser {

    parse(data) {
        let classes = []

        let arrayOfLines = data.match(/[^\r\n]+/g);
        let i = 0;
    
        let state = new State()
        const extractor = new Extractor()
    
        for (let line of arrayOfLines) {
            line = line.trim()
            i++
            extractor.setLine(i)
            state.setLine(i)
            if (line.startsWith('#')) {
                continue
            }
            if (!line) {
                continue
            }
            if (line.startsWith("---")) {
                if (state.isClass()) {
                    state.startAttrs()
                } else if (state.isAttr()) {
                    state.stopAttr()
                    state.startMethods()
                } else if (state.isMethod()) {
                    state.stopMethods()
                    classes.push(state.stopClass())
                    state = new State()
                } else {
                    throw new ParseError("Line " + i + ": was expecting a class")
                }
                continue
            }
    
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
                state.addMethod(extractor.extractMethod(line))
            }
    
        }
    
        return classes
    }

}

function exampleData() {
    return `# diagrama de classes de exemplo
# linhas com # são ignoradas

Nomeavel <Interface>
---
---
+ getNome(): str
---


Identificavel <Interface>
---
---
+ getId(): int
---

Aluno
extends Pessoa
implements Nomeavel <Interface>, Identificavel <Interface>
---
- turmas: List<Turma>
- nome: str
- nasc: int
---
+ Aluno(nome: str)
+ Aluno(nome: str, nasc: int)
+ setNome(nome: str): void
+ getNome(): str
+ getId(): int
---

Pessoa
---
- cpf: str
---
---

Turma
aggregates Aluno
---
- cod: int
---
---

Universidade
composes Departamento
---
---
---

Departamento
association Turma
---
- cod: int
---
---`
}

export { Parser, exampleData }