import { TybscriLexer } from "./generated/TybscriLexer";
import { AnalyzeContext, Node } from "./nodes/base";
import { ExpressionNode } from "./nodes/expression";
import { FunctionNode } from "./nodes/function";
import {
  VariableDeclarationNode,
  VariableKind,
} from "./nodes/variableDeclaration";
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

  public abstract get isConst(): boolean;

  public abstract get valueType(): Type | null;

  public abstract analyze(context: AnalyzeContext): void;
}

export class NarrowedSymbol extends Symbol {
  public get isConst(): boolean {
    return this.outerSymbol.isConst;
  }

  constructor(
    public readonly outerSymbol: Symbol,
    public readonly narrower: (t: Type) => Type
  ) {
    super(outerSymbol.name);
  }

  public get valueType(): Type | null {
    return this.outerSymbol.valueType
      ? this.narrower(this.outerSymbol.valueType)
      : null;
  }

  public analyze(context: AnalyzeContext): void {
    this.outerSymbol.analyze(context);
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

  constructor(name: string, public readonly node: Node) {
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
    public readonly parent: Scope | null = null,
    public readonly symbols: Symbol[] = []
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
}
