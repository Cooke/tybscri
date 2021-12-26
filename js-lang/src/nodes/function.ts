import { FuncType, Type } from "../types/common";
import { AnalyzeContext, Node } from "./base";
import { BlockNode } from "./block";
import { StatementNode } from "./statements";
import { TokenNode } from "./token";

export class FunctionNode extends StatementNode {
  protected analyzeInternal(context: AnalyzeContext): Type | null {
    this.body.analyze(context);

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
