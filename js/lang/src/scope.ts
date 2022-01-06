import { NarrowedSymbol, SourceSymbol, Symbol } from "./symbols";

export class Scope {
  public static empty = new Scope(null, []);

  constructor(
    private readonly parent: Scope | null = null,
    private readonly symbols: Symbol[] = []
  ) {}

  withSymbols(symbols: Symbol[]) {
    return new Scope(this.parent, symbols.concat(this.symbols));
  }

  resolveLast(name: string): Symbol | null {
    return (
      this.symbols.find((x) => x.name === name) ??
      this.parent?.resolveLast(name) ??
      null
    );
  }

  resolveAll(name: string): Symbol[] {
    return this.symbols
      .filter((x) => x.name === name)
      .concat(this.parent?.resolveAll(name) ?? []);
  }

  getAll(filter: "skip-duplicates" = "skip-duplicates"): Symbol[] {
    const allSymbols = this.symbols.concat(this.parent?.getAll() ?? []);

    // Filter out original symbols that has been narrowed
    for (let i = allSymbols.length - 1; i >= 0; i--) {
      const symbol = allSymbols[i];
      for (let j = 0; j < i; j++) {
        const laterSymbol = allSymbols[j];
        if (
          symbol instanceof SourceSymbol &&
          laterSymbol instanceof NarrowedSymbol &&
          symbol === laterSymbol.outerSymbol
        ) {
          allSymbols.splice(i, 1);
          break;
        }
      }
    }

    return allSymbols;
  }
}
