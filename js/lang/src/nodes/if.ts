import { Symbol } from "../Symbol";
import { CompileContext, ResolveContext } from "../common";
import { Scope } from "../scope";
import { nullType, unknownType } from "../typeSystem";
import { UnionType } from "../typeSystem/UnionType";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class IfNode extends ExpressionNode {
  private thenSymbols: Symbol[] = [];

  public setupScopes(scope: Scope, context: CompileContext) {
    this.condition.setupScopes(scope, context);
    this.thenSymbols = this.condition.createTruthNarrowedSymbols();
    this.thenBlock.setupScopes(scope.withSymbols(this.thenSymbols), context);
    this.elseBlock?.setupScopes(scope, context);
    this.scope = scope;
  }

  public resolve(context: ResolveContext) {
    this.condition.resolve(context.withExpectedType(null));
    for (const sym of this.thenSymbols) {
      sym.resolve(context);
    }
    this.thenBlock.resolve(context.withExpectedType(null));
    this.elseBlock?.resolve(context.withExpectedType(null));
    const unionType = UnionType.create(
      this.elseBlock
        ? [
            this.thenBlock.valueType ?? unknownType,
            this.elseBlock.valueType ?? unknownType,
          ]
        : [this.thenBlock.valueType ?? unknownType, nullType]
    );
    this.valueType = unionType;
  }

  constructor(
    public readonly ifToken: TokenNode,
    public readonly openParen: TokenNode,
    public readonly condition: ExpressionNode,
    public readonly closeParen: TokenNode,
    public readonly thenBlock: ExpressionNode,
    public readonly elseBlock: ExpressionNode | null
  ) {
    super([
      ifToken,
      openParen,
      condition,
      closeParen,
      thenBlock,
      ...(elseBlock ? [elseBlock] : []),
    ]);
  }
}
