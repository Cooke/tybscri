import { DiagnosticSeverity, SourceSymbol } from "../common";
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
  private symbol: SourceSymbol;

  public collectSymbols() {
    return [this.symbol];
  }

  protected analyzeInternal(context: AnalyzeContext): Type | null {
    // const thisSymbol = context.scope.resolve(this.name.text);
    // if (
    //   !thisSymbol.every((x) => x instanceof SourceSymbol && x.node === this)
    // ) {
    //   context.onDiagnosticMessage?.({
    //     message: `Cannot redeclare variable '${this.name.text}'`,
    //     severity: DiagnosticSeverity.Error,
    //     span: this.span,
    //   });
    // }

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
    this.symbol = new SourceSymbol(this.name.text, this);
  }

  public getChildren() {
    return [this.name, this.value];
  }
}
