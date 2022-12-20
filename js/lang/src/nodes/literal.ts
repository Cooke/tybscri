import { CompileContext } from "../common";
import { numberType, stringType, Type } from "../typeSystem";
import { LiteralType } from "../typeSystem/LiteralType";
import { Node } from "./base";
import { ExpressionNode } from "./expression";

export class LiteralNode extends ExpressionNode {
  constructor(public readonly tokens: Node[], public readonly value: any) {
    super(tokens);
  }

  public resolveTypes(
    context: CompileContext,
    expectedType?: Type | null | undefined
  ): void {
    this.valueType = this.calculateType(context);
  }

  private calculateType(context: CompileContext) {
    switch (typeof this.value) {
      case "boolean":
        return new LiteralType(
          this.value,
          context.environment.booleanDefinition.createType([])
        );
      case "string":
        return new LiteralType(this.value, stringType);
      case "number":
        return new LiteralType(this.value, numberType);
      default:
        throw new Error("Unknown literal value");
    }
  }
}
