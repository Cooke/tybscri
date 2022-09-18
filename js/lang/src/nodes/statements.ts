import { unknownType, Type } from "../typeSystem";
import { Node } from "./base";
import { ExpressionNode } from "./expression";
import { ActualTokenNode } from "./token";

export abstract class StatementNode extends Node {
  private _valueType: Type = unknownType;

  public get valueType(): Type {
    return this._valueType;
  }

  protected set valueType(val: Type) {
    this._valueType = val;
  }

  public toString(): string {
    return `${super.toString()} (type: ${this.valueType.displayName})`;
  }
}

export class ExpressionStatementNode extends StatementNode {
  public get valueType(): Type {
    return this.expression.valueType;
  }

  constructor(public readonly expression: ExpressionNode) {
    super([expression]);
  }
}

export class MissingStatementNode extends StatementNode {
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
