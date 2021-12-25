import { TybscriLexer } from "./generated/TybscriLexer";
import { Type } from "./types/common";

export { TybscriLexer as Lexer };

export interface SourceLocation {
  index: number;
  line: number;
  column: number;
}

export interface SourceSpan {
  readonly start: SourceLocation;
  readonly stop: SourceLocation;
}

export interface Symbol {
  readonly valueType: Type;
}

export interface SymbolContext {
  resolve(name: string): Symbol | null;
}

export enum DiagnosticSeverity {
  Error = "error",
}

export interface DiagnosticMessage {
  message: string;
  severity: DiagnosticSeverity;
  span: SourceSpan;
}

export class Scope implements SymbolContext {
  constructor(public readonly symbols: { [key: string]: Symbol }) {}

  resolve(name: string): Symbol | null {
    return this.symbols[name] ?? null;
  }
}
