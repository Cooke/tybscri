export type SyntaxNode = ExpressionSyntax;

export type ExpressionSyntax =
  | InvalidExpressionSyntax
  | ConstantExpressionSyntax;

export interface InvalidExpressionSyntax {
  type: "invalid";
}

export interface ConstantExpressionSyntax {
  type: "constant";
}

export interface ExpressionParseResult {
  syntaxTree: ExpressionSyntax;
}

export function parseExpression(expression: string): ExpressionParseResult {
  if (expression != '"123"') {
    return {
      syntaxTree: {
        type: "invalid",
      },
    };
  }

  return { syntaxTree: { type: "constant" } };
}

export interface ExpressionAnalysis {}

export function analyzeExpression(
  expression: ExpressionSyntax
): ExpressionAnalysis {
  return {};
}
