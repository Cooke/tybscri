import { CompileContext } from "./common";
import { FunctionNode } from "./nodes/function";
import {
  VariableDeclarationNode,
  VariableKind,
} from "./nodes/variableDeclaration";
import { Type, unknownType } from "./typeSystem";

export abstract class Symbol {
  constructor(public readonly name: string) {}

  public abstract get isConst(): boolean;

  public abstract get valueType(): Type;

  public abstract analyze(context: CompileContext): void;
}

export class NarrowedSymbol extends Symbol {
  public get isConst(): boolean {
    return this.outerSymbol.isConst;
  }

  constructor(
    public readonly outerSymbol: Symbol,
    private readonly narrower: (context: CompileContext) => Type
  ) {
    super(outerSymbol.name);
  }

  public valueType: Type = unknownType;

  public analyze(context: CompileContext): void {
    this.outerSymbol.analyze(context);
    this.valueType = this.narrower(context);
  }
}

export class SourceSymbol extends Symbol {
  public get isConst(): boolean {
    return (
      (this.node instanceof VariableDeclarationNode &&
        this.node.kind === VariableKind.Const) ||
      this.node instanceof FunctionNode
    );
  }

  constructor(
    name: string,
    public readonly node: {
      analyze(context: CompileContext): void;
      valueType: Type;
    }
  ) {
    super(name);
  }

  public get valueType(): Type {
    return this.node.valueType;
  }

  public analyze(context: CompileContext): void {
    this.node.analyze(context);
  }
}

export class ExternalSymbol extends Symbol {
  public get isConst(): boolean {
    // TODO
    return true;
  }

  constructor(name: string, public readonly valueType: Type) {
    super(name);
  }

  public analyze(context: CompileContext): void {}
}
