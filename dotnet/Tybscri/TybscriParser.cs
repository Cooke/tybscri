using System.Runtime.CompilerServices;
using Antlr4.Runtime;
using Tybscri.Common;
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

    public bool EndOfScript => Peek() == L.Eof;

    public ScriptNode ParseScript()
    {
        AdvanceWhileNL();

        var children = new List<IStatementNode>();
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

    private Token? ParseStatementEnd()
    {
        var token = Peek();
        if (token == L.Eof) {
            return null;
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


    private IStatementNode ParseStatement()
    {
        switch (Peek()) {
            case L.FUN:
                return ParseFunctionDeclaration();
            
            case L.VAR:
                return ParseVariableDeclaration();

            case L.RETURN:
                Advance();
                var expression = (Peek() != L.NL) ? ParseExpression() : null;
                return new ReturnNode(expression);
        }

        var exp = ParseExpression();

        if (exp is MissingExpressionNode) {
            return new MissingStatementNode();
        }

        return exp;
    }

    private IStatementNode ParseVariableDeclaration()
    {
        ParseToken(L.VAR);
        var name = ParseToken(L.Identifier);
        AdvanceWhileNL();
        ParseToken(L.ASSIGNMENT);
        AdvanceWhileNL();
        var exp = ParseExpression();
        return new VariableDeclarationNode(name, exp);
    }

    private FunctionNode ParseFunctionDeclaration()
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
        ParseToken(TybscriLexer.LCURL);
        AdvanceWhileNL();
        var statements = ParseStatements();
        ParseToken(TybscriLexer.RCURL);
        var functionNode = new FunctionNode(identifier, parameters, statements);
        return functionNode;
    }

    private IReadOnlyCollection<FunctionParameterNode> ParseFunctionParameters()
    {
        ParseToken(L.LPAREN);
        AdvanceWhileNL();

        var valueParams = new List<FunctionParameterNode>();
        if (Peek() == L.Identifier) {
            valueParams.Add(ParseParameter());
            AdvanceWhileNL();
        }

        while (Peek() == L.COMMA) {
            Advance();
            AdvanceWhileNL();
            valueParams.Add(ParseParameter());
            AdvanceWhileNL();
        }

        ParseToken(L.RPAREN);

        return valueParams;
    }

    private FunctionParameterNode ParseParameter()
    {
        var ident = ParseToken(L.Identifier);
        AdvanceWhileNL();
        ParseToken(L.COLON);
        AdvanceWhileNL();
        var type = ParseType();
        return new FunctionParameterNode(ident, type);
    }

    public ITypeNode ParseType()
    {
        var types = new List<ITypeNode> { ParseSimpleType() };
        AdvanceWhileNL();
        while (Peek() == L.OR) {
            Advance();
            types.Add(ParseSimpleType());
            AdvanceWhileNL();
        }
        
        return types.Count == 1 ? types[0] : new UnionTypeNode(types);
    }

    private ITypeNode ParseSimpleType()
    {
        switch (Peek()) {
            case L.QUOTE_OPEN:
                var textToken = ParseLineString();
                var type = new StringLiteralType(textToken.Text);
                return new LiteralTypeNode(type);

            case L.INT:
            {
                var token = ParseToken(L.INT);
                var value = double.Parse(token.Text);
                return new LiteralTypeNode(new NumberLiteralType(value));
            }

            case L.Boolean:
            {
                var token = ParseToken(L.Boolean);
                var value = bool.Parse(token.Text);
                return new LiteralTypeNode(new BooleanLiteralType(value));
            }

            case L.Identifier:
                return new IdentifierTypeNode(ParseToken(L.Identifier));
            
            case L.NULL:
                return new IdentifierTypeNode(ParseToken(L.NULL));

            default:
                return new IdentifierTypeNode(new MissingToken(PeekToken(), L.Identifier));
        }
    }

    public IExpressionNode ParseExpression()
    {
        return ParseBinaryExpressionChain(ParseAndExpression, L.OROR);
    }

    private IExpressionNode ParseAndExpression()
    {
        return ParseBinaryExpressionChain(ParseComparisonExpression, L.ANDAND);
    }

    private IExpressionNode ParseComparisonExpression()
    {
        var left = ParseAdditiveExpression();

        var peek = Peek();
        if (peek == L.LT || peek == L.GT) {
            var comparisonToken = ParseAnyToken();
            AdvanceWhileNL();

            var right = ParseAdditiveExpression();
            return new BinaryExpressionNode(left, comparisonToken, right);
        }

        return left;
    }

    private IExpressionNode ParseAdditiveExpression()
    {
        return ParseBinaryExpressionChain(ParseMultiplicativeExpression, L.ADD, L.SUB);
    }

    private IExpressionNode ParseMultiplicativeExpression()
    {
        return ParseBinaryExpressionChain(ParsePostfixExpression, L.MULT, L.DIV, L.MOD);
    }

    private IExpressionNode ParsePostfixExpression()
    {
        var primaryExpression = ParsePrimaryExpression();

        var exp = primaryExpression;
        while (true) {
            if (Peek() == L.LPAREN || Peek() == L.LCURL) {
                exp = ParseCallSuffix(exp);
                continue;
            }

            // Predict memberSuffix
            if (PeekIgnoreNL() == L.DOT) {
                exp = ParseMemberSuffix(exp);
                continue;
            }

            break;
        }

        return exp;
    }

    private int PeekIgnoreNL(int offset = 1)
    {
        var i = offset;
        while (Peek(i) == L.NL) {
            i++;
        }

        return Peek(i);
    }

    private InvocationNode ParseCallSuffix(IExpressionNode expression)
    {
        var args = ParseValueArguments();
        return new InvocationNode(expression, args);
    }

    private IExpressionNode ParsePrimaryExpression()
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
                return new ConstExpressionNode(textToken.Text, new StringLiteralType(textToken.Text));
            case L.INT:
                var token = ParseToken(L.INT);
                var value = double.Parse(token.Text);
                return new ConstExpressionNode(value, new NumberLiteralType(value));

            case L.LBRACKET:
                return ParseCollectionLiteral();
            case L.LCURL:
                return ParseLambdaLiteral();
            default:
                return new MissingExpressionNode();
        }
    }

    private IExpressionNode ParseLambdaLiteral()
    {
        var lcurl = this.ParseToken(L.LCURL);
        this.AdvanceWhileNL();

        var parameters = new List<LambdaParameterNode>();
        while (this.Peek() == L.Identifier && this.PeekIgnoreNL(2) == L.COMMA || this.PeekIgnoreNL(2) == L.FAT_ARROW) {
            var identifier = this.ParseIdentifier();
            parameters.Add(new LambdaParameterNode(identifier.Name));
            this.AdvanceWhileNL();
            this.Advance();
            this.AdvanceWhileNL();
        }

        var statements = new List<IStatementNode>();
        while (this.Peek() != L.RCURL && this.Peek() != L.Eof) {
            var statement = this.ParseStatement();
            statements.Add(statement);
            if (statement is MissingStatementNode) {
                this.Advance();
            }

            this.AdvanceWhileNL();
        }

        var rcurl = this.ParseToken(L.RCURL);
        return new LambdaLiteralNode(parameters, statements);
    }

    private CollectionLiteralNode ParseCollectionLiteral()
    {
        var lbracket = ParseToken(L.LBRACKET);
        AdvanceWhileNL();

        var expressions = new List<IExpressionNode>();
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
            if (exp is MissingExpressionNode) {
                Advance();
            }

            AdvanceWhileNL();
        }

        var rbracket = ParseToken(L.RBRACKET);
        return new CollectionLiteralNode(expressions);
        // new Invocation(new LiteralTypeNode(StandardTypes.List))
        // return new Invocation( new IdentifierTypeNode(new IdentifierNode("List")))
    }

    private IExpressionNode ParseMemberSuffix(IExpressionNode expression)
    {
        AdvanceWhileNL();
        ParseToken(L.DOT);
        AdvanceWhileNL();
        var memberName = ParseToken(L.Identifier);

        if (Peek() == L.LPAREN) {
            var callArgs = ParseValueArguments();
            return new MemberInvocationNode(expression, memberName, callArgs);
        }

        return new MemberAccessNode(expression, memberName);
    }

    private List<IExpressionNode> ParseValueArguments()
    {
        // if (Peek() == L.LCURL) {
        //     const lambdaLiteral = this.parseLambdaLiteral();
        //     return [null, [], null, lambdaLiteral];
        // }

        var lparen = ParseToken(L.LPAREN);
        AdvanceWhileNL();

        var args = new List<IExpressionNode>();

        while (Peek() != L.RPAREN && Peek() != L.Eof) {
            var expression = ParseExpression();
            args.Add(expression);
            if (expression is MissingExpressionNode) {
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

    private ConstExpressionNode ParseNull()
    {
        ParseToken(L.NULL);
        return new ConstExpressionNode(null, StandardTypes.Null);
    }

    private IdentifierNode ParseIdentifier()
    {
        return new IdentifierNode(ParseToken(L.Identifier));
    }

    private ConstExpressionNode ParseBooleanLiteral()
    {
        var token = ParseToken(L.Boolean);
        var value = token.Text == "true";
        return new ConstExpressionNode(value, new BooleanLiteralType(value));
    }

    private IfNode ParseIf()
    {
        ParseToken(TybscriLexer.IF);
        AdvanceWhileNL();
        ParseToken(TybscriLexer.LPAREN);
        AdvanceWhileNL();
        var exp = ParseExpression();
        AdvanceWhileNL();
        ParseToken(TybscriLexer.RPAREN);
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
            return new IfNode(exp, thenNode, elseNode);
        }
        else {
            return new IfNode(exp, thenNode, null);
        }
    }

    private IExpressionNode ParseControlBody()
    {
        if (Peek() == L.LCURL) {
            return ParseBlock();
        }

        return ParseExpression();
    }

    private BlockNode ParseBlock()
    {
        ParseToken(TybscriLexer.LCURL);
        AdvanceWhileNL();
        var statements = ParseStatements();
        ParseToken(TybscriLexer.RCURL);
        return new BlockNode(statements.ToArray());
    }

    private List<IStatementNode> ParseStatements()
    {
        var statements = new List<IStatementNode>();
        while (Peek() != TybscriLexer.RCURL && Peek() != TybscriLexer.Eof) {
            var statement = ParseStatement();
            statements.Add(statement);
            if (statement is MissingStatementNode) {
                Advance();
            }

            AdvanceWhileNL();
        }

        return statements;
    }

    private IExpressionNode ParseBinaryExpressionChain(Func<IExpressionNode> parseNext, params int[] tokenTypes)
    {
        var node = parseNext();
        
        while (tokenTypes.Contains(PeekIgnoreNL())) {
            AdvanceWhileNL();
            var token = ParseAnyToken();
            this.AdvanceWhileNL();
            var right = parseNext();
            node = new BinaryExpressionNode(node, token, right);
        }

        return node;
    }

    private Token ParseAnyToken()
    {
        var token = PeekToken();
        Advance();
        return new ConcreteToken(token);
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