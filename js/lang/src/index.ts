import { CharStreams } from "antlr4ts";
import {
  CompileContext,
  DiagnosticMessage,
  DiagnosticSeverity,
  Lexer,
} from "./common";
import { ExpressionNode } from "./nodes/expression";
import { ScriptNode } from "./nodes/script";
import { Parser } from "./parser";
import { Scope } from "./scope";
import { getTypeDisplayName, isTypeAssignableToType, Type } from "./typeSystem";

export { DiagnosticMessage } from "./common";
export * from "./nodes";
export * from "./typeSystem";
export { treeToString as printTree } from "./utils";
export { Parser, Lexer };
export { Scope };

export function createLexer(source: string) {
  return new Lexer(CharStreams.fromString(source));
}

export interface ExpressionParseOptions {
  scope?: Scope;
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
  const context: CompileContext = {
    onDiagnosticMessage: (msg) => messages.push(msg),
  };
  var parser = new Parser(expression, context ?? {});
  const exp = parser.parseExpression();
  exp.setupScopes(options?.scope ?? new Scope(), context);
  const expectedType = options?.expectedType;
  exp.resolveTypes(context, expectedType);

  if (expectedType && !isTypeAssignableToType(exp.valueType, expectedType)) {
    context?.onDiagnosticMessage?.({
      message: `Expression type '${getTypeDisplayName(
        exp.valueType
      )}' is not assignable to expected type ' ${getTypeDisplayName(
        expectedType
      )}'`,
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
  scope?: Scope | null;
}

export interface ScriptParseResult {
  tree: ScriptNode;
  diagnosticMessages: DiagnosticMessage[];
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
  const context: CompileContext = {
    onDiagnosticMessage: (msg) => messages.push(msg),
  };

  time("parse");
  var parser = new Parser(expression, context);
  const exp = parser.parseScript();
  timeEnd("parse");

  time("setup scopes");
  exp.setupScopes(options?.scope ?? new Scope(), context);
  timeEnd("setup scopes");

  time("resolve types");
  exp.resolveTypes(context);
  timeEnd("resolve types");

  return {
    tree: exp,
    diagnosticMessages: messages,
  };
}
