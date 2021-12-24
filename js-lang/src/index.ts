import { SymbolContext } from "./common";
import { ExpressionNode } from "./nodes/expression";
import { Parser } from "./Parser";

export interface ExpressionParseResult {
  tree: ExpressionNode;
}

export function parseExpression(
  expression: string,
  symbols?: SymbolContext
): ExpressionParseResult {
  var parser = new Parser(expression, symbols);
  const exp = parser.primaryExpression();
  return {
    tree: exp,
  };
}
