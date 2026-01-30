import { CompileContext, DiagnosticSeverity, ResolveContext } from "../common";
import { FuncType, MemberFlag, Type, unknownType } from "../typeSystem";
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

    const [operatorMemberName, operatorReturnType] =
      this.getOperatorInfo(context.compileContext);
    if (!operatorMemberName) {
      throw new Error("Unknown operator: " + this.operator.text);
    }

    this.valueType = operatorReturnType;

    const members = this.leftExpression.valueType.members;
    const matchingMembers = members.filter(
      (x) =>
        x.flags.includes(MemberFlag.Operator) && x.name === operatorMemberName
    );

    if (matchingMembers.length === 0) {
      context.compileContext.onDiagnosticMessage?.({
        message: `No operator member with name '${operatorMemberName}' exists on type '${this.leftExpression.valueType.displayName}'`,
        severity: DiagnosticSeverity.Error,
        span: this.operator.span,
      });
      return;
    }

    if (matchingMembers.length > 1) {
      context.compileContext.onDiagnosticMessage?.({
        message: `Ambiguous operator member '${operatorMemberName}' are currently not supported`,
        severity: DiagnosticSeverity.Error,
        span: this.operator.span,
      });
      return;
    }

    if (matchingMembers.length === 0) {
      context.compileContext.onDiagnosticMessage?.({
        message: `No operator member with name '${operatorMemberName}'`,
        severity: DiagnosticSeverity.Error,
        span: this.operator.span,
      });
      return;
    }

    const member = matchingMembers[0];
    if (!(member.type instanceof FuncType)) {
      context.compileContext.onDiagnosticMessage?.({
        message: `The member operator cannot be invoked`,
        severity: DiagnosticSeverity.Error,
        span: this.operator.span,
      });
      return;
    }

    if (!operatorReturnType.isAssignableFrom(member.type.returnType)) {
      context.compileContext.onDiagnosticMessage?.({
        message: `The member operator must have return type '${operatorReturnType.displayName}'`,
        severity: DiagnosticSeverity.Error,
        span: this.operator.span,
      });
      return;
    }
  }

  private getOperatorInfo(context: CompileContext): [string | null, Type] {
    switch (this.operator.text) {
      case "==":
        return ["equals", context.environment.booleanDefinition.createType()];

      default:
        context.onDiagnosticMessage?.({
          message: `Unknown operator '${this.operator.text}'`,
          severity: DiagnosticSeverity.Error,
          span: this.operator.span,
        });
        return [null, unknownType];
    }
  }
}
