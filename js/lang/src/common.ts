import { TybscriLexer } from "./generated/TybscriLexer";
import { ObjectDefinitionType, Type } from "./typeSystem";

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

export enum DiagnosticSeverity {
  Error = "error",
}

export interface DiagnosticMessage {
  message: string;
  severity: DiagnosticSeverity;
  span: SourceSpan;
}

export interface Environment {
  readonly symbols: EnvironmentSymbol[];
  readonly collectionDefinition: ObjectDefinitionType;
}

export interface EnvironmentSymbol {
  readonly name: string;
  readonly type: Type;
}

export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg);
  }
}

export interface CompileContext {
  onDiagnosticMessage?: (msg: DiagnosticMessage) => void;
  environment: Environment;
}
