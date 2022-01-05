import { CharStreams } from "antlr4ts";
import { DiagnosticSeverity, Lexer } from "./common";
import { ExpressionNode } from "./nodes/expression";
import { ScriptNode } from "./nodes/script";
import { ParseContext, Parser } from "./parser";
import { Scope } from "./scope";
import { getTypeDisplayName, isTypeAssignableToType, Type } from "./typeSystem";

export * from "./typeSystem/core";
export { treeToString as printTree } from "./utils";
export { DiagnosticMessage } from "./common";
export * from "./nodes";

export { Parser, Lexer };

export interface ExpressionParseResult {
  tree: ExpressionNode;
}

export function createLexer(source: string) {
  return new Lexer(CharStreams.fromString(source));
}

export function parseExpression(
  expression: string,
  context?: ParseContext,
  expectedType?: Type
): ExpressionParseResult {
  var parser = new Parser(expression, context ?? {});
  const exp = parser.parseExpression();
  exp.setupScopes(context?.scope ?? new Scope(), {
    onDiagnosticMessage: context?.onDiagnosticMessage,
  });
  exp.analyze(
    {
      onDiagnosticMessage: context?.onDiagnosticMessage,
    },
    expectedType
  );

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
  };
}

export interface ScriptParseResult {
  tree: ScriptNode;
}

export function parseScript(
  expression: string,
  context?: ParseContext
): ScriptParseResult {
  var parser = new Parser(expression, context ?? {});
  const exp = parser.parseScript();
  exp.setupScopes(context?.scope ?? new Scope(), {
    onDiagnosticMessage: context?.onDiagnosticMessage,
  });
  exp.analyze({
    onDiagnosticMessage: context?.onDiagnosticMessage,
  });
  return {
    tree: exp,
  };
}
