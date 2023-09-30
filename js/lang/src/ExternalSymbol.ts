import { CompileContext } from "./common";
import { Symbol } from "./Symbol";
import { Type } from "./typeSystem";

export class ExternalSymbol extends Symbol {
  public get isConst(): boolean {
    // TODO
    return true;
  }

  constructor(name: string, public readonly valueType: Type) {
    super(name);
  }

  public resolveTypes(context: CompileContext): void {}
}
