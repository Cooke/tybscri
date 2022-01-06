﻿using Antlr4.Runtime;
using Tybscri.Nodes;

namespace Tybscri;

using L = TybscriLexer;

public class TybscriParser
{
    private readonly CommonTokenStream _tokenStream;

    public TybscriParser(string script)
    {
        _tokenStream = new CommonTokenStream(new TybscriLexer(new AntlrInputStream(script)));
    }

    public ScriptNode ParseScript()
    {
        AdvanceWhileNL();

        var children = new List<StatementNode>();
        while (Peek() != L.Eof) {
            children.Add(ParseStatement());
        }

        return new ScriptNode(children);
    }


    private StatementNode ParseStatement()
    {
        var exp = ParseExpression();

        if (exp is MissingExpression) {
            Advance();
            return new MissingStatement();
        }

        return new ExpressionStatement(exp);
    }

    private ExpressionNode ParseExpression()
    {
        return ParsePostfixUnaryExpression();
    }

    private ExpressionNode ParsePostfixUnaryExpression()
    {
        return Peek() switch
        {
            L.IF => ParseIf(),
            L.Boolean => ParseBooleanLiteral(),
            L.Identifier => ParseIdentifier(),
            _ => new MissingExpression()
        };
    }

    private ExpressionNode ParseIdentifier()
    {
        return new IdentifierNode(PeekToken().Text);
    }

    private ExpressionNode ParseBooleanLiteral()
    {
        var token = PeekToken();


        Advance();
        return new ConstExpression(token.Text == "true");
    }

    private IfNode ParseIf()
    {
        var ifToken = ParseToken(TybscriLexer.IF);
        AdvanceWhileNL();
        var lparen = ParseToken(TybscriLexer.LPAREN);
        AdvanceWhileNL();
        var exp = ParseExpression();
        AdvanceWhileNL();
        var rparen = ParseToken(TybscriLexer.RPAREN);
        AdvanceWhileNL();
        var thenBlock = ParseBlock();

        return new IfNode(ifToken, lparen, exp, rparen, thenBlock);
    }

    private Block ParseBlock()
    {
        var lcurl = ParseToken(TybscriLexer.LCURL);
        AdvanceWhileNL();

        var statements = new List<StatementNode>();
        while (Peek() != TybscriLexer.RCURL && Peek() != TybscriLexer.Eof) {
            statements.Add(ParseStatement());
            AdvanceWhileNL();
        }

        var rcurl = ParseToken(TybscriLexer.RCURL);
        AdvanceWhileNL();

        return new Block(lcurl, statements, rcurl);
    }

    private Token ParseToken(int tokenType)
    {
        if (Peek() != tokenType) {
            return new MissingToken();
        }

        Advance();
        return new ConcreteToken();
    }

    private int Peek(int offset = 1)
    {
        return _tokenStream.LA(offset);
    }

    private IToken PeekToken(int offset = 1)
    {
        return _tokenStream.LT(offset);
    }

    private void Advance(int num = 1)
    {
        for (var i = 0; i < num; i++) {
            _tokenStream.Consume();
        }
    }

    private void AdvanceWhileNL()
    {
        while (Peek() == L.NL) {
            Advance();
        }
    }
}