import { CompileContext } from "./common";
import { Symbol } from "./Symbol";
import { Type, unknownType } from "./typeSystem";

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

  public resolveTypes(context: CompileContext): void {
    this.outerSymbol.resolveTypes(context);
    this.valueType = this.narrower(context);
  }
}
