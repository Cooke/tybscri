# Tybscri

An statically typed embeddable scripting language with an HTML editor. The language is inspired by Kotlin and TypeScript.

## Demo

The HTML editor can be tested here: https://cooke.github.io/tybscri/

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
