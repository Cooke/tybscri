import { Lexer, SourceSpan } from "../common";
import { Type } from "../typeSystem/common";
import { Node } from "./base";
import { CompileContext } from "../common";

// TODO: should the tokens be nodes in the tree? Or could they be trivia in the nodes?
export abstract class TokenNode extends Node {
  protected analyzeInternal(context: CompileContext): Type | null {
    return null;
  }

  private _span: SourceSpan;

  public getChildren(): readonly [] {
    return [];
  }

  public get span() {
    return this._span;
  }

  constructor(private readonly tokenType: number, span: SourceSpan) {
    super([]);
    this._span = span;
  }

  public get tokenDisplayName() {
    if (this.tokenType === Lexer.NL) {
      return "Newline";
    }

    return Lexer.literalNames[this.tokenType];
  }

  public abstract get text(): string;
}

export class ActualTokenNode extends TokenNode {
  constructor(
    tokenType: number,
    span: SourceSpan,
    public readonly text: string
  ) {
    super(tokenType, span);
  }

  public toString() {
    return super.toString() + ` = ${this.text}`;
  }
}

export class MissingTokenNode extends TokenNode {
  constructor(
    tokenType: number,
    span: SourceSpan,
    public readonly actualToken: ActualTokenNode
  ) {
    super(tokenType, span);
  }

  public get text() {
    return this.actualToken.text;
  }
}
