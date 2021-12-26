import { TybscriLexer } from "./generated/TybscriLexer";
import { AnalyzeContext } from "./nodes/base";
import { ExpressionNode } from "./nodes/expression";
import { Type } from "./types/common";

export { TybscriLexer as Lexer };

export interface SourceLocation {
  index: number;
  line: number;
  column: number;
}

export interface SourceSpan {
  readonly start: SourceLocation;
  readonly stop: SourceLocation;
}

export abstract class Symbol {
  constructor(public readonly name: string) {}

  public abstract get valueType(): Type | null;

  public abstract analyze(context: AnalyzeContext): void;
}

export class SourceSymbol extends Symbol {
  constructor(name: string, public readonly node: ExpressionNode) {
    super(name);
  }

  public get valueType(): Type | null {
    return this.node.valueType;
  }

  public analyze(context: AnalyzeContext): void {
    this.node.analyze(context);
  }
}

export class ExternalSymbol extends Symbol {
  constructor(name: string, public readonly valueType: Type) {
    super(name);
  }

  public analyze(context: AnalyzeContext): void {}
}

export enum DiagnosticSeverity {
  Error = "error",
}

export interface DiagnosticMessage {
  message: string;
  severity: DiagnosticSeverity;
  span: SourceSpan;
}

export class Scope {
  constructor(
    public readonly parent: Scope | null = null,
    private hoistedSymbols: Symbol[] = [],
    private readonly symbols: Symbol[] = []
  ) {}

  addHoistedSymbol(symbol: Symbol) {
    this.hoistedSymbols.push(symbol);
  }

  withSymbol(symbol: Symbol): Scope {
    return new Scope(
      this.parent,
      this.hoistedSymbols,
      this.symbols.concat([symbol])
    );
  }

  resolve(name: string): Symbol[] {
    return [
      ...this.symbols
        .concat(this.hoistedSymbols)
        .filter((x) => x.name === name),
      ...(this.parent?.resolve(name) ?? []),
    ];
  }
}
