using System.Linq.Expressions;
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
        switch (Peek()) {
            case L.FUN:
                return ParseFunctionDeclaration();
        }

        var exp = ParseExpression();

        if (exp is MissingExpression) {
            return new MissingStatement();
        }

        return exp;
    }

    private Node ParseFunctionDeclaration()
    {
        ParseToken(L.FUN);
        var identifier = ParseToken(L.Identifier);
        AdvanceWhileNL();
        var parameters = ParseFunctionParameters();
        AdvanceWhileNL();

        // let type: TypeSyntax | null = null;
        // if (this.peek() === L.COLON) {
        //   this.advance();
        //   type = this.parseType();
        // }

        AdvanceWhileNL();
        var body = ParseBlock();
        var functionNode = new Function(identifier, parameters, body);
        return functionNode;
    }

    private IReadOnlyCollection<ParameterNode> ParseFunctionParameters()
    {
        ParseToken(L.LPAREN);
        AdvanceWhileNL();

        var valueParams = new List<ParameterNode>();
        while (Peek() != L.RPAREN && Peek() != L.Eof) {
            valueParams.Add(ParseParameter());
            AdvanceWhileNL();
            if (Peek() == L.COMMA) {
                Advance();
                AdvanceWhileNL();
            }
            else {
                break;
            }
        }

        ParseToken(L.RPAREN);

        return valueParams;
    }

    private ParameterNode ParseParameter()
    {
        var ident = ParseToken(L.Identifier);
        AdvanceWhileNL();
        ParseToken(L.COLON);
        AdvanceWhileNL();
        var type = ParseType();
        return new ParameterNode(ident, type);
    }

    private TypeNode ParseType()
    {
        return ParseSimpleType();
    }

    private TypeNode ParseSimpleType()
    {
        switch (Peek()) {
            case L.QUOTE_OPEN:
                var textToken = ParseLineString();
                var type = new StringLiteralType(textToken.Text);
                return new LiteralTypeNode(type);

            case L.INT:
                var token = ParseToken(L.INT);
                var value = double.Parse(token.Text);
                return new LiteralTypeNode(new NumberLiteralType(value));

            case L.Identifier:
                return new IdentifierTypeNode(ParseIdentifier());

            default:
                return new IdentifierTypeNode(new IdentifierNode(new MissingToken(PeekToken(), L.Identifier)));
        }
    }

    public Node ParseExpression()
    {
        return ParsePostfixExpression();
    }

    private Node ParsePostfixExpression()
    {
        var primaryExpression = ParsePrimaryExpression();

        var exp = primaryExpression;
        while (true) {
            if (Peek() == L.LPAREN || Peek() == L.LCURL) {
                exp = ParseCallSuffix(exp);
                continue;
            }

            // Predict memberSuffix
            var i = 1;
            while (Peek(i) == L.NL) {
                i++;
            }

            if (Peek(i) == L.DOT) {
                exp = ParseMemberSuffix(exp);
                continue;
            }

            break;
        }

        return exp;
    }

    private Invocation ParseCallSuffix(Node expression)
    {
        var args = ParseValueArguments();
        return new Invocation(expression, args);
    }

    private Node ParsePrimaryExpression()
    {
        switch (Peek()) {
            case L.IF:
                return ParseIf();
            case L.Boolean:
                return ParseBooleanLiteral();
            case L.Identifier:
                return ParseIdentifier();
            case L.NULL:
                return ParseNull();
            case L.QUOTE_OPEN:
                var textToken = ParseLineString();
                return new ConstExpression(textToken.Text, new StringLiteralType(textToken.Text));
            case L.INT:
                var token = ParseToken(L.INT);
                var value = double.Parse(token.Text);
                return new ConstExpression(value, new NumberLiteralType(value));
            case L.RETURN:
                Advance();
                var expression = (Peek() != L.NL) ? ParseExpression() : null;
                return new ReturnExpression(expression);
            case L.LBRACKET:
                return ParseCollectionLiteral();
            case L.LCURL:
                return ParseLambdaLiteral();
            default:
                return new MissingExpression();
        }
    }

    private Node ParseLambdaLiteral()
    {
        var lcurl = this.ParseToken(L.LCURL);
        this.AdvanceWhileNL();

        var statements =  new List<Node>();
        while (this.Peek() != L.RCURL && this.Peek() != L.Eof) {
            var statement = this.ParseStatement();
            statements.Add(statement);
            if (statement is MissingStatement) {
                this.Advance();
            }

            this.AdvanceWhileNL();
        }

        var rcurl = this.ParseToken(L.RCURL);
        return new LambdaLiteralNode(statements);
    }

    private Node ParseCollectionLiteral()
    {
        var lbracket = ParseToken(L.LBRACKET);
        AdvanceWhileNL();

        List<Node> expressions = new List<Node>();
        var first = true;
        while (Peek() != L.RBRACKET && Peek() != L.Eof) {
            if (!first) {
                var comma = ParseToken(L.COMMA);
                if (comma is MissingToken) {
                    // this.reportDiagnostic({
                    //     message: "Missing commna",
                    //     severity: DiagnosticSeverity.Error,
                    //     span: comma.span,
                    // });
                }
                AdvanceWhileNL();
            }

            first = false;
            var exp = ParseExpression();
            expressions.Add(exp);
            if (exp is MissingExpression) {
                Advance();
            }

            AdvanceWhileNL();
        }

        var rbracket = ParseToken(L.RBRACKET);
        return new CollectionLiteral(expressions);
        // new Invocation(new LiteralTypeNode(StandardTypes.List))
        // return new Invocation( new IdentifierTypeNode(new IdentifierNode("List")))
    }

    private Node ParseMemberSuffix(Node expression)
    {
        AdvanceWhileNL();
        ParseToken(L.DOT);
        AdvanceWhileNL();
        var memberName = ParseToken(L.Identifier);

        if (Peek() == L.LPAREN) {
            var callArgs = ParseValueArguments();
            return new MemberInvocation(expression, memberName, callArgs);
        }

        return new MemberNode(expression, memberName);
    }

    private List<Node> ParseValueArguments()
    {
        // if (Peek() == L.LCURL) {
        //     const lambdaLiteral = this.parseLambdaLiteral();
        //     return [null, [], null, lambdaLiteral];
        // }

        var lparen = ParseToken(L.LPAREN);
        AdvanceWhileNL();

        var args = new List<Node>();

        while (Peek() != L.RPAREN && Peek() != L.Eof) {
            var expression = ParseExpression();
            args.Add(expression);
            if (expression is MissingExpression) {
                Advance();
            }

            AdvanceWhileNL();

            if (Peek() == L.COMMA) {
                Advance();
                AdvanceWhileNL();
            }
        }

        var rparen = ParseToken(L.RPAREN);

        // if (Peek() == L.LCURL) {
        //     var lambdaLiteral = ParseLambdaLiteral();
        //     return [lparen, args, rparen, lambdaLiteral];
        // }

        return args;
    }

    private Token ParseLineString()
    {
        var openQuote = ParseToken(L.QUOTE_OPEN);
        var textToken = ParseToken(L.LineString);
        var closeQuote = ParseToken(L.QUOTE_CLOSE);
        return textToken;
    }

    private Node ParseNull()
    {
        return new ConstExpression(null, StandardTypes.Null);
    }

    private IdentifierNode ParseIdentifier()
    {
        return new IdentifierNode(ParseToken(L.Identifier));
    }

    private Node ParseBooleanLiteral()
    {
        var token = ParseToken(L.Boolean);
        var value = token.Text == "true";
        return new ConstExpression(value, new BooleanLiteralType(value));
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