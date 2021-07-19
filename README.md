# Modeligado

Convert text to UML. [Access here](https://matheusgr.github.io/modeligado/edit.html)!

## Example

```
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
```

## Format

There are three parts when modelling a class:

* Class name (and its relationships)
* Attributes
* Methods (including constructors)

Each part is separeted with at least 3 dashes (`---`). There is also 3 dashes at the end of a class.

### Relationships 

There are five types of relationships among classes:

* extends
* implements
* association
* DirectionalAssociation
* composes
* aggregates

### Visibility
There are three types of visibilities that can be used on attributes and methods.

* private ```-```
* public ```+```
* protected ```#```

### Modifier
You can also define class scope attributes and methods by adding a static modifier after visibility:

* static
