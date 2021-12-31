import { DiagnosticSeverity, Scope, SourceSymbol, Symbol } from "../common";
import { FuncType, Type } from "../types/common";
import { unknownType } from "../types/unknown";
import { AnalyzeContext, Node } from "./base";
import { BlockNode } from "./block";
import { StatementNode } from "./statements";
import { TokenNode } from "./token";
import { TypeNode } from "./type";

export class FunctionNode extends StatementNode {
  private _analyzeState: "not-analyzed" | "analyzing" | "analyzed" =
    "not-analyzed";

  public symbol: SourceSymbol;

  public setupScopes(scope: Scope, context: AnalyzeContext) {
    for (const par of this.parameters) {
      par.setupScopes(scope, context);
    }

    this.body.setupScopes(
      new Scope(
        scope,
        this.parameters.map((x) => new SourceSymbol(x.name.text, x))
      ),
      context
    );
  }

  public analyze(context: AnalyzeContext) {
    if (this._analyzeState === "analyzed") {
      return;
    }

    if (this._analyzeState === "analyzing") {
      this._analyzeState = "analyzed";

      context.onDiagnosticMessage?.({
        message: "Circular reference in function is currently not allowed",
        severity: DiagnosticSeverity.Error,
        span: this.span,
      });

      this.valueType = {
        kind: "Func",
        returnType: unknownType,
        parameters: this.parameters.map((x) => ({
          type: x.type.type ?? unknownType,
          name: x.name.text,
        })),
      } as FuncType;
      return;
    }

    this._analyzeState = "analyzing";
    for (const par of this.parameters) {
      par.analyze(context);
    }
    this.body.analyze(context);

    if (this._analyzeState !== "analyzing") {
      // Analyzed already done in a circular analyze
      return;
    }

    this._analyzeState = "analyzed";
    this.valueType = {
      kind: "Func",
      returnType: this.body.valueType ?? unknownType,
      parameters: this.parameters.map((x) => ({
        type: x.type.type ?? unknownType,
        name: x.name.text,
      })),
    } as FuncType;
  }

  constructor(
    public readonly name: TokenNode,
    public readonly parameters: ParameterNode[],
    // public readonly returnType: TypeSyntax | null,
    public readonly body: BlockNode
  ) {
    super([name, ...parameters, body]);
    this.symbol = new SourceSymbol(name.text, this);
  }
}

export class ParameterNode extends Node {
  public get valueType() {
    return this.type.type;
  }

  constructor(
    public readonly name: TokenNode,
    public readonly colon: TokenNode,
    public readonly type: TypeNode
  ) {
    super([name, colon, type]);
  }
}
