import { TybscriLexer } from "./generated/TybscriLexer";
import { AnalyzeContext, Node } from "./nodes/base";
import { ExpressionNode } from "./nodes/expression";
import { FunctionNode } from "./nodes/function";
import { StatementNode } from "./nodes/statements";
import {
  VariableDeclarationNode,
  VariableKind,
} from "./nodes/variableDeclaration";
import { Type } from "./types/TypescriptTypes";
import { unknownType } from "./types";

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

  public abstract get isConst(): boolean;

  public abstract get valueType(): Type;

  public abstract analyze(context: AnalyzeContext): void;
}

export class NarrowedSymbol extends Symbol {
  public get isConst(): boolean {
    return this.outerSymbol.isConst;
  }

  constructor(
    public readonly outerSymbol: Symbol,
    private readonly narrower: (context: AnalyzeContext) => Type
  ) {
    super(outerSymbol.name);
  }

  public valueType: Type = unknownType;

  public analyze(context: AnalyzeContext): void {
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
      analyze(context: AnalyzeContext): void;
      valueType: Type;
    }
  ) {
    super(name);
  }

  public get valueType(): Type {
    return this.node.valueType;
  }

  public analyze(context: AnalyzeContext): void {
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

const foo: string = "123";

function bar(str: string): string;
function bar(num: number): string;

function bar(val: any) {
  return val.toString();
}

if (foo === "123") {
  foo;
}
