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

    startClass(name) {
        this._check("ROOT")
        this._notExecuted("ROOT", "name")
        this.context = { "name": name, "key": name }
        this.relations = []
        this.state = "CLASS"
    }

    addClassExtends(extendedClass) {
        this._check("CLASS")
        this.relations.push({ from: this.context.name, to: extendedClass, relationship: "generalization" })
    }

    addClassImplemments(implementedClass) {
        this._check("CLASS")
        this.relations.push({ from: this.context.name, to: implementedClass, relationship: "generalizationInterface" })
    }

    addClassAggregates(aggregatedClass) {
        this._check("CLASS")
        this.relations.push({ from: this.context.name, to: aggregatedClass, relationship: "aggregation" })
    }

    addClassComposes(composedClass) {
        this._check("CLASS")
        this.relations.push({ from: this.context.name, to: composedClass, relationship: "composition" })
    }

    addClassAssociate(associatedClass) {
        this._check("CLASS")
        this.relations.push({ from: this.context.name, to: associatedClass, relationship: "association" })
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
    }
    extractExtends(line) {
        const startPos = "extends ".length
        return line.substring(startPos, line.length).split(',')
    }

    extractImplemments(line) {
        const startPos = "implemments ".length
        return line.substring(startPos, line.length).split(',')
    }

    extractAttr(line) {
        const split = line.split(" ")
        const visibility = this.conv[split[0]]
        const name = split[1]
        const type = split[2]
        return {'name': name, 'type': type, 'visibility': visibility}
    }

    // + Aluno(nome: str, nasc: int)
    // + setNome(nome: str): void
    // { name: "deposit", parameters: [{ name: "amount", type: "Currency" }], visibility: "public" },
    // { name: "getCurrentAge", type: "int", visibility: "public" }

    extractParameters(params) {
        let resultParams = []
        for (let param of params.split(',')) {
            param = param.trim()
            let aval = param.split(':')
            let name = aval[0].trim()
            let type = aval[1].trim()
            resultParams.push({'name' : name, 'type': type})
        }
        return resultParams
    }

    extractMethod(line) {
        const visibilityStr = line.split(" ", 1)[0]
        let result = {'visibility': this.conv[visibilityStr.trim()]}
        const sign = line.substring(visibilityStr.length).trim()

        result.name = sign.substring(0, sign.indexOf('('))

        let paramsStr = sign.substring(sign.indexOf('(') + 1, sign.indexOf(')'))

        result.parameters = this.extractParameters(paramsStr)

        // Method (has return type)
        if (sign.substring(0, 1) !== sign.substring(0, 1).toUpperCase()) {
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
        console.log(i, line, classes)
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
            if (line.startsWith("extends ")) {
                for (let class_ of extractor.extractExtends(line)) {
                    state.addClassExtends(class_)
                }
            }
            if (line.startsWith("implements ")) {
                for (let class_ of extractor.extractImplemments(line)) {
                    state.addClassImplemments(class_)
                }
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
    return `# diagrama

Aluno
extends Pessoa
implements Nomeavel, Identificavel
---
- turmas: List<Turma>
- nome: str
- nasc: int
---
+ Aluno(nome: str)
+ Aluno(nome: str, nasc: int)
+ setNome(nome: str): void
---

Pessoa
---
- cpf: str
---
---

Turma
---
- cod: int
---
---`
}

export { parse, exampleData }