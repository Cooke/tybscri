using Antlr4.Runtime;
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

        var children = new List<Node>();
        while (Peek() != L.Eof) {
            var statement = ParseStatement();
            children.Add(statement);
            var endToken = ParseStatementEnd();

            if (endToken is MissingToken) {
                Advance();
            }
        }

        return new ScriptNode(children.ToArray());
    }

    private Token ParseStatementEnd()
    {
        var token = Peek();
        if (token == L.Eof) {
            return ParseToken(L.Eof);
        }

        var firstIteration = true;
        while (true) {
            switch (token) {
                case L.NL:
                case L.SEMICOLON:
                    Advance();
                    break;

                default:
                    return firstIteration ? new MissingToken(PeekToken(), L.NL) : new ConcreteToken(PeekToken(-1));
            }

            token = Peek();
            firstIteration = false;
        }
    }


    private Node ParseStatement()
    {
        var exp = ParseExpression();

        if (exp is MissingExpression) {
            return new MissingStatement();
        }

        return exp;
    }

    public Node ParseExpression()
    {
        return ParsePostfixUnaryExpression();
    }

    private Node ParsePostfixUnaryExpression()
    {
        return Peek() switch
        {
            L.IF => ParseIf(),
            L.Boolean => ParseBooleanLiteral(),
            L.Identifier => ParseIdentifier(),
            L.NULL => ParseNull(),
            L.QUOTE_OPEN => ParseLineStrText(),
            L.INT => ParseNumber(),
            _ => new MissingExpression()
        };
    }

    private Node ParseNumber()
    {
        var token = ParseToken(L.INT);
        return new ConstExpression(double.Parse(token.Text), new ClrWrapperType(typeof(double)));
    }

    private Node ParseLineStrText()
    {
        var openQuote = ParseToken(L.QUOTE_OPEN);
        var textToken = ParseToken(L.LineStrText);
        var closeQuote = ParseToken(L.QUOTE_CLOSE);

        if (textToken is ConcreteToken concreteToken) {
            return new ConstExpression(concreteToken.Text, new ClrWrapperType(typeof(string)));
        }

        return new ConstExpression(null, UnknownType.Instance);
    }

    private Node ParseNull()
    {
        return new ConstExpression(null, new ClrWrapperType(typeof(object)));
    }

    private Node ParseIdentifier()
    {
        var token = ParseToken(L.Identifier);
        return new IdentifierNode(token);
    }

    private Node ParseBooleanLiteral()
    {
        var token = ParseToken(L.Boolean);
        return new ConstExpression(token.Text == "true", new ClrWrapperType(typeof(bool)));
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
        var thenNode = ParseControlBody();

        // Search for else
        var i = 1;
        while (Peek(i) == L.NL) {
            i++;
        }

        if (Peek(i) == L.ELSE) {
            Advance(i);
            var elseNode = ParseControlBody();
            return new IfNode(ifToken, lparen, exp, rparen, thenNode, elseNode);
        }
        else {
            return new IfNode(ifToken, lparen, exp, rparen, thenNode, null);
        }
    }

    private Node ParseControlBody()
    {
        if (Peek() == L.LCURL) {
            return ParseBlock();
        }

        return ParseExpression();
    }

    private Block ParseBlock()
    {
        var lcurl = ParseToken(TybscriLexer.LCURL);
        AdvanceWhileNL();

        var statements = new List<Node>();
        while (Peek() != TybscriLexer.RCURL && Peek() != TybscriLexer.Eof) {
            var statement = ParseStatement();
            statements.Add(statement);
            if (statement is MissingStatement) {
                Advance();
            }

            AdvanceWhileNL();
        }

        var rcurl = ParseToken(TybscriLexer.RCURL);
        AdvanceWhileNL();

        return new Block(lcurl, statements.ToArray(), rcurl);
    }

    private Token ParseToken(int tokenType)
    {
        if (Peek() != tokenType) {
            return new MissingToken(PeekToken(), tokenType);
        }

        var token = PeekToken();
        Advance();
        return new ConcreteToken(token);
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