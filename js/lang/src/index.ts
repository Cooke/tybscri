import { CharStreams } from "antlr4ts";
import {
  CompileContext,
  DiagnosticMessage,
  DiagnosticSeverity,
  Environment,
  EnvironmentSymbol,
  Lexer,
} from "./common";
import { defaultEnvironment } from "./defaultEnvironment";
import { ExpressionNode } from "./nodes/expression";
import { ScriptNode } from "./nodes/script";
import { Parser } from "./parser";
import { Scope } from "./scope";
import { ExternalSymbol } from "./symbols";
import { Type } from "./typeSystem";

export { DiagnosticMessage } from "./common";
export * from "./nodes";
export * from "./typeSystem";
export { treeToString as printTree } from "./utils";
export { Parser, Lexer };
export { Scope };
export { Environment, EnvironmentSymbol };
export { defaultEnvironment };

export function createLexer(source: string) {
  return new Lexer(CharStreams.fromString(source));
}

export interface ExpressionParseOptions {
  environment?: Environment;
  expectedType?: Type;
}

export interface ExpressionParseResult {
  tree: ExpressionNode;
  diagnosticMessages: DiagnosticMessage[];
}

export function parseExpression(
  expression: string,
  options?: ExpressionParseOptions
): ExpressionParseResult {
  const messages: DiagnosticMessage[] = [];
  const environment = options?.environment ?? defaultEnvironment;
  const context: CompileContext = {
    onDiagnosticMessage: (msg) => messages.push(msg),
    environment,
  };
  var parser = new Parser(expression, context ?? {});
  const exp = parser.parseExpression();
  const scope = createScopeFromEnvironment(environment);
  exp.setupScopes(scope, context);
  const expectedType = options?.expectedType;
  exp.resolveTypes(context, expectedType);

  if (expectedType && !expectedType.isAssignableFrom(exp.valueType)) {
    context?.onDiagnosticMessage?.({
      message: `Expression type '${exp.valueType.displayName}' is not assignable to expected type ' ${expectedType.displayName}'`,
      severity: DiagnosticSeverity.Error,
      span: exp.span,
    });
  }

  return {
    tree: exp,
    diagnosticMessages: messages,
  };
}

export interface ScriptParseOptions {
  reportTimings?: boolean;
  environment?: Environment | null;
}

export interface ScriptParseResult {
  tree: ScriptNode;
  diagnosticMessages: DiagnosticMessage[];
}

function createScopeFromEnvironment(environment: Environment) {
  return new Scope(
    null,
    environment.symbols.map((s) => new ExternalSymbol(s.name, s.type))
  );
}

export function parseScript(
  expression: string,
  options?: ScriptParseOptions
): ScriptParseResult {
  function time(label: string) {
    if (options?.reportTimings) {
      console.time(label);
    }
  }

  function timeEnd(label: string) {
    if (options?.reportTimings) {
      console.timeEnd(label);
    }
  }

  const messages: DiagnosticMessage[] = [];
  const environment = options?.environment ?? defaultEnvironment;
  const context: CompileContext = {
    onDiagnosticMessage: (msg) => messages.push(msg),
    environment,
  };

  time("parse");
  var parser = new Parser(expression, context);
  const exp = parser.parseScript();
  timeEnd("parse");

  time("setup scopes");
  const scope = createScopeFromEnvironment(environment);
  exp.setupScopes(scope, context);
  timeEnd("setup scopes");

  time("resolve types");
  exp.resolveTypes(context);
  timeEnd("resolve types");

  return {
    tree: exp,
    diagnosticMessages: messages,
  };
}
