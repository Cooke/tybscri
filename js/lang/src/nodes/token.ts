import { CompileContext, SourceSpan } from "../common";
import { TokenType } from "../lexer";
import { Type } from "../typeSystem/common";
import { Node } from "./base";

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

  constructor(private readonly tokenType: TokenType, span: SourceSpan) {
    super([]);
    this._span = span;
  }

  public get tokenDisplayName() {
    if (this.tokenType === TokenType.NL) {
      return "Newline";
    }

    return this.tokenType;
  }

  public abstract get text(): string;
}

export class ActualTokenNode extends TokenNode {
  constructor(
    tokenType: TokenType,
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
    tokenType: TokenType,
    span: SourceSpan,
    public readonly actualToken: ActualTokenNode
  ) {
    super(tokenType, span);
  }

  public get text() {
    return this.actualToken.text;
  }
}
