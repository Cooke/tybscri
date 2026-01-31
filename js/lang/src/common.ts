import { ObjectDefinitionType, Type } from "./typeSystem";
export { Lexer, TokenType } from "./lexer";

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
  readonly booleanDefinition: ObjectDefinitionType;
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

export interface ResolveContext {
  readonly expectedType: Type | null;
  readonly compileContext: CompileContext;

  withExpectedType(type: Type | null): ResolveContext;
}

export function createResolveContext(
  compileContext: CompileContext,
  expectedType: Type | null = null
): ResolveContext {
  return {
    expectedType,
    compileContext,
    withExpectedType(type: Type | null): ResolveContext {
      return createResolveContext(compileContext, type);
    },
  };
}
