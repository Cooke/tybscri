import { CharStreams } from "antlr4ts";
import { Lexer } from "./common";
import { ExpressionNode } from "./nodes/expression";
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
  const exp = parser.parsePrimaryExpression();
  return {
    tree: exp,
  };
}
