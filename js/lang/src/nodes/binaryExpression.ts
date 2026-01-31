import { DiagnosticSeverity, ResolveContext } from "../common";
import { numberType, unknownType } from "../typeSystem";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class BinaryExpressionNode extends ExpressionNode {
  constructor(
    public readonly leftExpression: ExpressionNode,
    public readonly operator: TokenNode,
    public readonly rightExpression: ExpressionNode
  ) {
    super([leftExpression, operator, rightExpression]);
  }

  public resolve(context: ResolveContext) {
    this.leftExpression.resolve(context.withExpectedType(null));
    this.rightExpression.resolve(context.withExpectedType(null));

    const booleanType = context.compileContext.environment.booleanDefinition.createType();

    switch (this.operator.text) {
      // Comparison operators → Boolean
      case "<":
      case ">":
      case "<=":
      case ">=":
      case "==":
      case "!=":
        this.valueType = booleanType;
        break;

      // Logical operators → Boolean
      case "&&":
      case "||":
        this.valueType = booleanType;
        break;

      // Arithmetic operators → Number
      case "+":
      case "-":
      case "*":
      case "/":
      case "%":
        this.valueType = numberType;
        break;

      default:
        context.compileContext.onDiagnosticMessage?.({
          message: `Unknown operator '${this.operator.text}'`,
          severity: DiagnosticSeverity.Error,
          span: this.operator.span,
        });
        this.valueType = unknownType;
    }
  }
}
