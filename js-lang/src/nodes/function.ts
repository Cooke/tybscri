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

  public setupSymbols(scope: Scope, context: AnalyzeContext): Scope {
    for (const par of this.parameters) {
      par.setupSymbols(scope, context);
    }

    this.body.setupSymbols(
      new Scope(
        scope,
        this.parameters.map((x) => new SourceSymbol(x.name.text, x))
      ),
      context
    );

    return scope;
  }

  protected analyzeInternal(context: AnalyzeContext): Type | null {
    if (this._analyzeState === "analyzed") {
      return this.valueType;
    }

    if (this._analyzeState === "analyzing") {
      this._analyzeState = "analyzed";

      context.onDiagnosticMessage?.({
        message: "Circular reference in function is currently not allowed",
        severity: DiagnosticSeverity.Error,
        span: this.span,
      });

      return {
        kind: "Func",
        returnType: unknownType,
        parameters: this.parameters.map((x) => ({
          type: x.type.type ?? unknownType,
          name: x.name.text,
        })),
      } as FuncType;
    }

    this._analyzeState = "analyzing";
    for (const par of this.parameters) {
      par.analyze(context);
    }
    this.body.analyze(context);

    if (this._analyzeState !== "analyzing") {
      // Analyzed already done in a circular analyze
      return this.valueType;
    }

    this._analyzeState = "analyzed";
    return {
      kind: "Func",
      returnType: this.body.valueType ?? unknownType,
      parameters: this.parameters.map((x) => ({
        type: x.type.type ?? unknownType,
        name: x.name.text,
      })),
    } as FuncType;
  }

  public getChildren(): readonly Node[] {
    return [
      this.name,
      ...this.parameters,
      // ...(this.returnType ? [this.returnType] : []),
      this.body,
    ];
  }

  constructor(
    public readonly name: TokenNode,
    public readonly parameters: ParameterNode[],
    // public readonly returnType: TypeSyntax | null,
    public readonly body: BlockNode
  ) {
    super();
    this.symbol = new SourceSymbol(name.text, this);
  }
}

export class ParameterNode extends Node {
  protected analyzeInternal(context: AnalyzeContext): Type | null {
    this.type.analyze(context);
    return this.type.type;
  }

  public getChildren(): readonly Node[] {
    return [this.name, this.colon, this.type];
  }

  constructor(
    public readonly name: TokenNode,
    public readonly colon: TokenNode,
    public readonly type: TypeNode
  ) {
    super();
  }
}
