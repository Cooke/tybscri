import { CompileContext } from "./common";
import { Type } from "./typeSystem";

export abstract class Symbol {
  constructor(public readonly name: string) {}

  public abstract get isConst(): boolean;

  public abstract get valueType(): Type;

  public abstract resolveTypes(context: CompileContext): void;
}
