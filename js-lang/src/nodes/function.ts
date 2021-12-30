import { DiagnosticSeverity, Scope, SourceSymbol, Symbol } from "../common";
import { FuncType, Type } from "../types/common";
import { unknownType } from "../types/unknown";
import { AnalyzeContext, Node } from "./base";
import { BlockNode } from "./block";
import { StatementNode } from "./statements";
import { TokenNode } from "./token";

export class FunctionNode extends StatementNode {
  private _analyzeState: "not-analyzed" | "analyzing" | "analyzed" =
    "not-analyzed";

  public symbol: SourceSymbol;

  setupSymbols(scope: Scope, context: AnalyzeContext): Scope {
    this.body.setupSymbols(scope, context);
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
        parameters: [],
      } as FuncType;
    }

    this._analyzeState = "analyzing";
    this.body.analyze(context);

    if (this._analyzeState !== "analyzing") {
      // Analyzed already done in a circular analyze
      return this.valueType;
    }

    this._analyzeState = "analyzed";
    return {
      kind: "Func",
      returnType: this.body.valueType,
      parameters: [],
    } as FuncType;
  }

  public getChildren(): readonly Node[] {
    return [
      this.name,
      // ...this.parameters,
      // ...(this.returnType ? [this.returnType] : []),
      this.body,
    ];
  }

  constructor(
    public readonly name: TokenNode,
    //public readonly parameters: Parameter[],
    // public readonly returnType: TypeSyntax | null,
    public readonly body: BlockNode
  ) {
    super();
    this.symbol = new SourceSymbol(name.text, this);
  }
}

// export class Parameter extends Node {
//   //   public visit<TReturn = undefined, TContext = undefined>(
//   //     visitor: Visitor<TReturn, TContext>,
//   //     context: TContext
//   //   ): TReturn {
//   //     return visitor.visitParameterSyntax(this, context);
//   //   }
//   public getChildren(): readonly Node[] {
//     return [this.name, this.colon, this.type];
//   }

//   constructor(
//     public readonly name: TokenNode,
//     public readonly colon: TokenNode,
//     public readonly type: TypeSyntax
//   ) {
//     super();
//   }
// }
