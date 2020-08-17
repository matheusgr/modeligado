export function exampleData() {
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
