import { NodeValueType, TypeNotFound, UnknownType } from "./base";
import { ExpressionNode } from "./expression";
import { ActualTokenNode, TokenNode } from "./token";
import { Symbol } from "../common";

export class IdentifierNode extends ExpressionNode {
  constructor(
    public readonly token: TokenNode,
    public readonly referencedSymbol: Symbol | null
  ) {
    super();
    this.text = token.text;
  }

  public get type(): NodeValueType {
    return this.referencedSymbol?.valueType ?? new UnknownType();
  }
  //   public visit<TReturn, TContext>(
  //     visitor: Visitor<TReturn, TContext>,
  //     context: TContext
  //   ) {
  //     return visitor.visitScopeReference(this, context);
  //   }

  public readonly text: string | null;

  public getChildren(): TokenNode[] {
    return [this.token];
  }
}
