export function exampleData() {
    return `// diagrama de classes de exemplo
// duas barras definem comentários

Main
association UsuarioController
directionalAssociation SistemaController // A ser implementado depois
---
---
---

UsuarioController
composes UsuarioRepository // Outro tipo de associação: Aggregates
---
- usuarioRepository: UsuarioRepository
---
+ UsuarioController()
+ adicionaTrabalhador(nome: str, code: int): void
+ adicionaAssociado(nome: str, code: int, empresa: str): void
+ localizaUsuarios(nome: str): List<String>
+ localizaUsuario(code: int): Usuario
+ adicionaBonus(code: int, bonus: int): void
+ totalizaBonus(code: int): int
---

UsuarioRepository
composes Usuario <Interface>
---
- usuarios: Map<id, Usuario>
---
+ UsuarioRepository()
+ adicionaTrabalhador(nome: str, code: int): void
+ adicionaAssociado(nome: str, code: int, empresa: str): void
+ localizaUsuarios(nome: str): List<String>
+ localizaUsuario(code: int): Usuario
---

Usuario <Interface>
---
---
+ addBonus(bonus: int): void
+ totalizaBonus(): int
---

UsuarioImpl <Abstract>
implements Usuario <Interface>
---
- code: int
---
+ UsuarioImpl(nome: str, code: int)
+ adicionaBonus(code: int, bonus: int): void
+ totalizaBonus(code: int): int
+ hashCode(): int
+ equals(o: Object): boolean
---

Trabalhador
extends UsuarioImpl <Abstract>
---
---
+ toString(): str
---

Associado
extends UsuarioImpl <Abstract>
---
- empresa: str
---
+ Associado(nome: str, code: int, empresa: str)
+ toString(): str
---`
}
