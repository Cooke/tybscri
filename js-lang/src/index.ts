import { ExpressionNode } from "./nodes/expression";
import { Parser } from "./Parser";

export interface ExpressionParseResult {
  tree: ExpressionNode;
}

export function parseExpression(expression: string): ExpressionParseResult {
  var parser = new Parser(expression);
  const exp = parser.primaryExpression();
  return {
    tree: exp,
  };
}
