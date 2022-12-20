# Tybscri

An statically typed embeddable scripting language with an HTML editor.

## Syntax

```kotlin
var creature = Npc()
if (create.level > 5) {
    creature.onAttacked {
        ev =>
        ev.attacker.takeDamage(5)
    }
}

creature.onSummoned {
    ev =>
    ev.newArea.creature.filter { it.isPlayer }.each {
        it.takeDamage(if (random() > 0.5) 100 else 5 )
    }
}
```

## Status

The project is currently in an early state.

```

```
