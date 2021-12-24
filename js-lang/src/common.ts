import { TybscriLexer } from "./generated/TybscriLexer";
import { Type } from "./types/common";

export { TybscriLexer as Lexer };

export interface SourceSpan {
  readonly start: number;
  readonly stop: number;
}

export interface Symbol {
  readonly valueType: Type;
}

export interface SymbolContext {
  resolve(name: string): Symbol | null;
}

export class Scope implements SymbolContext {
  constructor(public readonly symbols: { [key: string]: Symbol }) {}

  resolve(name: string): Symbol | null {
    return this.symbols[name] ?? null;
  }
}
