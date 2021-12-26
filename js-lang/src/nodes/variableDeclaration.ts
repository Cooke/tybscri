import { Type, widenType } from "../types/common";
import { AnalyzeContext } from "./base";
import { ExpressionNode } from "./expression";
import { StatementNode } from "./statements";
import { TokenNode } from "./token";

export enum VariableKind {
  Variable,
  Const,
}

export class VariableDeclarationNode extends StatementNode {
  protected analyzeInternal(context: AnalyzeContext): Type | null {
    this.value.analyze(context);

    if (!this.value.valueType) {
      return null;
    }

    return this.kind === VariableKind.Const
      ? this.value.valueType
      : widenType(this.value.valueType);
  }

  constructor(
    public readonly kind: VariableKind,
    public readonly name: TokenNode,
    public readonly value: ExpressionNode
  ) {
    super();
  }

  public getChildren() {
    return [this.name, this.value];
  }
}
