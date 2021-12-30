import { DiagnosticSeverity, Scope, SourceSymbol } from "../common";
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

  public setupSymbols(scope: Scope, context: AnalyzeContext): Scope {
    if (scope.resolveLast(this.name.text) != null) {
      context.onDiagnosticMessage?.({
        message: `Cannot redeclare variable '${this.name.text}'`,
        severity: DiagnosticSeverity.Error,
        span: this.span,
      });
    }

    this.value.setupSymbols(scope, context);
    return scope.withSymbols([this.symbol]);
  }

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
    this.symbol = new SourceSymbol(this.name.text, this);
  }

  public getChildren() {
    return [this.name, this.value];
  }
}
