class StateError extends Error {
    constructor(expectedState, ...params) {
        super(...params)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, StateError)
        }
        this.name = 'StateError'
        this.expectedState = expectedState
        this.date = new Date()
    }
}

class State {

    constructor() {
        this.state = "ROOT"
    }

    // --- CHECKS ---
    _check(expectedState) {
        if (this.state !== expectedState) {
            throw new StateError(expectedState)
        }
    }

    _notExecuted(state, property) {
        if (this.context && this.context.hasOwnProperty(property)) {
            throw new StateError(state)
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

    // --- STATE CHECK ---
    isRoot() {
        return this.state === "ROOT"
    }

    isClass() {
        return this.state === "CLASS"
    }

    isMethods() {
        return this.state === "METHOD"
    }

    isAttrs() {
        return this.state === "ATTR"
    }


}

class Extractor {

    constructor() {
        this.conv = {'-' : 'private', '+': 'public', '#': 'protected'}
        // name and if it is inverted
        this.relations = {"extends": ["generalization", false],
                                      "implements": ["generalizationInterface", false],
                                      "association": ["association", false],
                                      "composes": ["composition", true],
                                      "aggregates": ["aggregation", true]
                            }
    }

    extractRelation(line) {
        let relation = line.split(" ")[0]
        let types = line.substring(relation.length + 1, line.length).split(',').map(x => x.trim())
        return {"relation": this.relations[relation][0], "types": types, "inverse": this.relations[relation][1]}
    }

    extractAttr(line) {
        const split = line.split(" ").map(x => x.trim())
        const visibility = this.conv[split[0]]
        const name = split[1].substring(0, split[1].length - 1)
        const type = split[2]
        return {'name': name, 'type': type, 'visibility': visibility}
    }

    extractParameters(params) {
        let resultParams = []
        for (let param of params.split(',')) {
            param = param.trim()
            let aval = param.split(':').map(x => x.trim())
            let name = aval[0]
            let type = aval[1]
            resultParams.push({'name' : name, 'type': type})
        }
        return resultParams
    }

    extractMethod(line) {
        const visibilityStr = line.split(" ", 1)[0]
        let result = {'visibility': this.conv[visibilityStr.trim()]}

        const sign = line.substring(visibilityStr.length).trim()

        result.name = sign.substring(0, sign.indexOf('('))

        if (sign.indexOf('(') + 1 > sign.indexOf(')')) {
            let paramsStr = sign.substring(sign.indexOf('(') + 1, sign.indexOf(')'))

            result.parameters = this.extractParameters(paramsStr)
        }

        // Not a constructor
        if (sign.substring(0, 1) !== sign.substring(0, 1).toUpperCase()) {
            // has return type
            result.type = sign.substring(sign.indexOf(')')).split(':')[1].trim()
        }

        return result
    }

}

function parse(data) {

    let classes = []

    let arrayOfLines = data.match(/[^\r\n]+/g);
    let i = 0;

    let state = new State()
    const extractor = new Extractor()

    for (let line of arrayOfLines) {
        line = line.trim()
        i++
        if (line.startsWith('#')) {
            continue
        }
        if (!line.trim()) {
            continue
        }
        if (line.startsWith("---")) {
            if (state.isClass()) {
                state.startAttrs()
            } else if (state.isAttrs()) {
                state.stopAttr()
                state.startMethods()
            } else if (state.isMethods()) {
                state.stopMethods()
                classes.push(state.stopClass())
                state = new State()
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
        } else if (state.isAttrs()) {
            state.addAttr(extractor.extractAttr(line))
        } else if (state.isMethods()) {
            state.addMethod(extractor.extractMethod(line))
        }

    }

    return classes
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

export { parse, exampleData }