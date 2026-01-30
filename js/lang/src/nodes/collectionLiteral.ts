import { ResolveContext } from "../common";
import { UnionType } from "../typeSystem";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class CollectionLiteralNode extends ExpressionNode {
  public resolve(context: ResolveContext): void {
    for (const exp of this.expressions) {
      exp.resolve(context.withExpectedType(null));
    }

    const itemType = UnionType.create(this.expressions.map((x) => x.valueType));

    this.valueType = context.compileContext.environment.collectionDefinition.createType([
      itemType,
    ]);
  }

  constructor(
    public readonly lbracket: TokenNode,
    public readonly expressions: ExpressionNode[],
    public readonly rbracket: TokenNode
  ) {
    super([lbracket, ...expressions, rbracket]);
  }
}
