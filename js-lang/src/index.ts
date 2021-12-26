import { CharStreams } from "antlr4ts";
import { Lexer, Scope } from "./common";
import { ExpressionNode } from "./nodes/expression";
import { ScriptNode } from "./nodes/script";
import { ParseContext, Parser } from "./Parser";
export { DiagnosticMessage } from "./common";

export { Parser, Lexer };

export interface ExpressionParseResult {
  tree: ExpressionNode;
}

export function createLexer(source: string) {
  return new Lexer(CharStreams.fromString(source));
}

export function parseExpression(
  expression: string,
  context?: ParseContext
): ExpressionParseResult {
  var parser = new Parser(expression, context ?? {});
  const exp = parser.parseExpression();
  exp.analyze({
    onDiagnosticMessage: context?.onDiagnosticMessage,
    scope: context?.scope ?? new Scope(),
  });
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
  exp.analyze({
    onDiagnosticMessage: context?.onDiagnosticMessage,
    scope: context?.scope ?? new Scope(),
  });
  return {
    tree: exp,
  };
}
