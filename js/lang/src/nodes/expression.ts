import { Symbol } from "../Symbol";
import { Type, unknownType } from "../typeSystem";
import { Node } from "./base";
import { ActualTokenNode } from "./token";

export abstract class ExpressionNode extends Node {
  private _valueType: Type = unknownType;

  public get valueType(): Type {
    return this._valueType;
  }

  protected set valueType(val: Type) {
    this._valueType = val;
  }

  public createTruthNarrowedSymbols(): Symbol[] {
    return [];
  }

  public toString(): string {
    return `${super.toString()} (type: ${this.valueType.displayName})`;
  }
}

export class MissingExpressionNode extends ExpressionNode {
  public get span() {
    return {
      start: this.actualToken.span.start,
      stop: this.actualToken.span.start,
    };
  }

  constructor(public readonly actualToken: ActualTokenNode) {
    super([]);
  }
}
