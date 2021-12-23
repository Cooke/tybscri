import { TybscriLexer } from "./generated/TybscriLexer";

export { TybscriLexer as Lexer };

export interface SourceSpan {
  readonly start: number;
  readonly stop: number;
}
