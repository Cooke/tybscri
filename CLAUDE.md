# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tybscri is a statically typed embeddable scripting language inspired by Kotlin and TypeScript. It has parallel implementations in JavaScript/TypeScript and .NET with full feature parity between platforms.

## Build Commands

### JavaScript/TypeScript (js/)

```bash
# Install dependencies (from js/)
yarn install

# Build all packages
yarn workspaces foreach run build

# Language package (js/lang/)
npm run build         # Compile TypeScript
npm run dev           # Watch mode

# React Editor (js/react-editor/)
npm run build

# Demo app (js/demo/)
npm run dev           # Dev server at :3000
```

### .NET (dotnet/)

```bash
dotnet build Tybscri.sln
dotnet test Tybscri.Test

# Regenerate ANTLR lexer (Windows)
gen-lexer.bat
```

## Testing

### JavaScript
```bash
cd js/lang
npm run test          # Run all tests
npm run test:watch    # Watch mode
```
Uses Mocha with ts-node. Test files are in `js/lang/tests/*.test.ts`.

### .NET
```bash
cd dotnet
dotnet test
```
Uses XUnit. Test project is `Tybscri.Test/`.

## Architecture

Both implementations follow the same compilation pipeline:

1. **Lexer** - Tokenizes source code into a token stream
2. **Parser** - Builds AST using recursive descent parsing
3. **Type Resolution** - Static type checking with inference and narrowing
4. **Code Generation** - JS produces tree with diagnostics; .NET generates LINQ Expressions for JIT

### Key Directories

- `js/lang/src/` - Core JS language implementation
  - `lexer.ts` - Tokenization
  - `parser.ts` - AST construction
  - `nodes/` - 22 AST node types
  - `typeSystem.ts` - Type checking
  - `defaultEnvironment/` - Built-in types and symbols

- `dotnet/Tybscri/` - Core .NET implementation
  - `Lexer.cs` - Tokenization
  - `TybscriParser.cs` - AST construction
  - `Nodes/` - AST node classes
  - `Types/` - Type system
  - `LinqExpressions/` - LINQ expression generation

- `spec/` - ANTLR grammar files (TybscriLexer.g4, TybscriParser.g4)

### Type System

- Built-in types: Number, String, Boolean, List, Null, Void, Never
- Generic types (List<T>)
- Literal types
- Function types with parameters
- Union type inference
- Type narrowing with `is` guards

### Language Syntax

Kotlin/TypeScript-inspired:
- `var`/`val` for variable declarations
- `fun` for functions
- Type annotations with `:`
- Lambda expressions with `=>`
- String interpolation
- Control flow: `if`/`else`, `for`, `while`

## Entry Points

- JS: `js/lang/src/index.ts` exports `parseExpression()`, `parseScript()`
- .NET: `dotnet/Tybscri/Compiler.cs` is the main API

## Deployment

Demo auto-deploys to GitHub Pages on push to main: https://cooke.github.io/tybscri/
