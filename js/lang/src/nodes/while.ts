import { CompileContext, ResolveContext } from "../common";
import { Scope } from "../scope";
import { VoidType } from "../typeSystem";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class WhileNode extends ExpressionNode {
  public setupScopes(scope: Scope, context: CompileContext) {
    this.condition.setupScopes(scope, context);
    this.body.setupScopes(scope, context);
    this.scope = scope;
  }

  public resolve(context: ResolveContext) {
    this.condition.resolve(context.withExpectedType(null));
    this.body.resolve(context.withExpectedType(null));
    this.valueType = VoidType.instance;
  }

  constructor(
    public readonly whileToken: TokenNode,
    public readonly openParen: TokenNode,
    public readonly condition: ExpressionNode,
    public readonly closeParen: TokenNode,
    public readonly body: ExpressionNode
  ) {
    super([whileToken, openParen, condition, closeParen, body]);
  }
}
