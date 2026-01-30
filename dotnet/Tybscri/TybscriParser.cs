using Tybscri.Common;
using Tybscri.Nodes;

namespace Tybscri;

using L = TokenType;

public class TybscriParser
{
    private readonly TokenBuffer _tokenBuffer;

    public TybscriParser(string script)
    {
        _tokenBuffer = new TokenBuffer(script);
    }

    public bool EndOfScript => Peek() == L.Eof;

    public ScriptNode ParseScript()
    {
        AdvanceWhileNL();

        var children = new List<IStatementNode>();
        while (Peek() != L.Eof)
        {
            var statement = ParseStatement();
            children.Add(statement);
            var endToken = ParseStatementEnd();

            if (endToken is MissingToken)
            {
                Advance();
            }
        }

        return new ScriptNode(children.ToArray());
    }

    private Token? ParseStatementEnd()
    {
        var token = Peek();
        if (token == L.Eof)
        {
            return null;
        }

        var firstIteration = true;
        while (true)
        {
            switch (token)
            {
                case L.NL:
                case L.Semicolon:
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
        switch (Peek())
        {
            case L.Fun:
                return ParseFunctionDeclaration();

            case L.Var:
            case L.Val:
                return ParseVariableDeclaration();

            case L.Return:
                Advance();
                var expression = (Peek() != L.NL) ? ParseExpression() : null;
                return new ReturnNode(expression);
        }

        var exp = ParseExpression();

        if (exp is MissingExpressionNode)
        {
            return new MissingStatementNode();
        }

        return exp;
    }

    private IStatementNode ParseVariableDeclaration()
    {
        var kind = Peek() == L.Val ? VariableKind.Const : VariableKind.Variable;
        Advance(); // Consume var or val
        var name = ParseToken(L.Identifier);
        AdvanceWhileNL();
        ParseToken(L.Assignment);
        AdvanceWhileNL();
        var exp = ParseExpression();
        return new VariableDeclarationNode(kind, name, exp);
    }

    private FunctionNode ParseFunctionDeclaration()
    {
        ParseToken(L.Fun);
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
        ParseToken(L.Lcurl);
        AdvanceWhileNL();
        var statements = ParseStatements();
        ParseToken(L.Rcurl);
        var functionNode = new FunctionNode(identifier, parameters, statements);
        return functionNode;
    }

    private IReadOnlyCollection<FunctionParameterNode> ParseFunctionParameters()
    {
        ParseToken(L.Lparen);
        AdvanceWhileNL();

        var valueParams = new List<FunctionParameterNode>();
        if (Peek() == L.Identifier)
        {
            valueParams.Add(ParseParameter());
            AdvanceWhileNL();
        }

        while (Peek() == L.Comma)
        {
            Advance();
            AdvanceWhileNL();
            valueParams.Add(ParseParameter());
            AdvanceWhileNL();
        }

        ParseToken(L.Rparen);

        return valueParams;
    }

    private FunctionParameterNode ParseParameter()
    {
        var ident = ParseToken(L.Identifier);
        AdvanceWhileNL();
        ParseToken(L.Colon);
        AdvanceWhileNL();
        var type = ParseType();
        return new FunctionParameterNode(ident, type);
    }

    public ITypeNode ParseType()
    {
        var types = new List<ITypeNode> { ParseSimpleType() };
        AdvanceWhileNL();
        while (Peek() == L.Or)
        {
            Advance();
            types.Add(ParseSimpleType());
            AdvanceWhileNL();
        }

        return types.Count == 1 ? types[0] : new UnionTypeNode(types);
    }

    private ITypeNode ParseSimpleType()
    {
        switch (Peek())
        {
            case L.LineString:
            {
                var textToken = ParseLineString();
                var type = new LiteralType(textToken.Text, StandardTypes.String);
                return new LiteralTypeNode(type);
            }

            case L.Int:
            {
                var token = ParseToken(L.Int);
                var value = double.Parse(token.Text);
                return new LiteralTypeNode(new LiteralType(value, StandardTypes.Number));
            }

            case L.True:
            case L.False:
            {
                var token = ParseAnyToken();
                var value = token.Text == "true";
                return new LiteralTypeNode(new LiteralType(value, StandardTypes.Boolean));
            }

            case L.Identifier:
                return new IdentifierTypeNode(ParseToken(L.Identifier));

            case L.Null:
                return new IdentifierTypeNode(ParseToken(L.Null));

            default:
                return new IdentifierTypeNode(new MissingToken(PeekToken(), L.Identifier));
        }
    }

    public IExpressionNode ParseExpression()
    {
        return ParseBinaryExpressionChain(ParseAndExpression, L.OrOr);
    }

    private IExpressionNode ParseAndExpression()
    {
        return ParseBinaryExpressionChain(ParseComparisonExpression, L.AndAnd);
    }

    private IExpressionNode ParseComparisonExpression()
    {
        var left = ParseAdditiveExpression();

        var peek = Peek();
        if (peek == L.Lt || peek == L.Gt)
        {
            var comparisonToken = ParseAnyToken();
            AdvanceWhileNL();

            var right = ParseAdditiveExpression();
            return new BinaryExpressionNode(left, comparisonToken, right);
        }

        return left;
    }

    private IExpressionNode ParseAdditiveExpression()
    {
        return ParseBinaryExpressionChain(ParseMultiplicativeExpression, L.Add, L.Sub);
    }

    private IExpressionNode ParseMultiplicativeExpression()
    {
        return ParseBinaryExpressionChain(ParsePostfixExpression, L.Mult, L.Div, L.Mod);
    }

    private IExpressionNode ParsePostfixExpression()
    {
        var primaryExpression = ParsePrimaryExpression();

        var exp = primaryExpression;
        while (true)
        {
            if (Peek() == L.Lparen || Peek() == L.Lcurl)
            {
                exp = ParseCallSuffix(exp);
                continue;
            }

            // Predict memberSuffix
            if (PeekIgnoreNL() == L.Dot)
            {
                exp = ParseMemberSuffix(exp);
                continue;
            }

            break;
        }

        return exp;
    }

    private TokenType PeekIgnoreNL(int offset = 0)
    {
        var i = offset;
        while (Peek(i) == L.NL)
        {
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
        switch (Peek())
        {
            case L.If:
                return ParseIf();
            case L.For:
                return ParseFor();
            case L.While:
                return ParseWhile();
            case L.Break:
                return ParseBreak();
            case L.Continue:
                return ParseContinue();
            case L.True:
            case L.False:
                return ParseBooleanLiteral();
            case L.Identifier:
                return ParseIdentifier();
            case L.Null:
                return ParseNull();
            case L.LineString:
            {
                var textToken = ParseLineString();
                return new LiteralNode(textToken.Text, new LiteralType(textToken.Text, StandardTypes.String));
            }
            case L.Int:
            {
                var token = ParseToken(L.Int);
                var value = double.Parse(token.Text);
                return new LiteralNode(value, new LiteralType(value, StandardTypes.Number));
            }

            case L.Lbracket:
                return ParseCollectionLiteral();
            case L.Lcurl:
                return ParseLambdaLiteral();
            default:
                return new MissingExpressionNode();
        }
    }

    private IExpressionNode ParseLambdaLiteral()
    {
        var lcurl = ParseToken(L.Lcurl);
        AdvanceWhileNL();

        var parameters = new List<LambdaParameterNode>();
        while (Peek() == L.Identifier && (PeekIgnoreNL(1) == L.Comma || PeekIgnoreNL(1) == L.FatArrow))
        {
            var identifier = ParseIdentifier();
            parameters.Add(new LambdaParameterNode(identifier.Name));
            AdvanceWhileNL();
            Advance();  // Skip the comma or fat arrow
            AdvanceWhileNL();
        }

        var statements = new List<IStatementNode>();
        while (Peek() != L.Rcurl && Peek() != L.Eof)
        {
            var statement = ParseStatement();
            statements.Add(statement);
            if (statement is MissingStatementNode)
            {
                Advance();
            }

            AdvanceWhileNL();
        }

        var rcurl = ParseToken(L.Rcurl);
        return new LambdaLiteralNode(parameters, statements);
    }

    private CollectionLiteralNode ParseCollectionLiteral()
    {
        var lbracket = ParseToken(L.Lbracket);
        AdvanceWhileNL();

        var expressions = new List<IExpressionNode>();
        var first = true;
        while (Peek() != L.Rbracket && Peek() != L.Eof)
        {
            if (!first)
            {
                var comma = ParseToken(L.Comma);
                if (comma is MissingToken)
                {
                    // this.reportDiagnostic({
                    //     message: "Missing comma",
                    //     severity: DiagnosticSeverity.Error,
                    //     span: comma.span,
                    // });
                }

                AdvanceWhileNL();
            }

            first = false;
            var exp = ParseExpression();
            expressions.Add(exp);
            if (exp is MissingExpressionNode)
            {
                Advance();
            }

            AdvanceWhileNL();
        }

        var rbracket = ParseToken(L.Rbracket);
        return new CollectionLiteralNode(expressions);
    }

    private IExpressionNode ParseMemberSuffix(IExpressionNode expression)
    {
        AdvanceWhileNL();
        ParseToken(L.Dot);
        AdvanceWhileNL();
        var memberName = ParseToken(L.Identifier);

        if (Peek() == L.Lparen || Peek() == L.Lcurl)
        {
            var callArgs = ParseValueArguments();
            return new MemberInvocationNode(expression, memberName, callArgs);
        }

        return new MemberAccessNode(expression, memberName);
    }

    private List<IExpressionNode> ParseValueArguments()
    {
        if (Peek() == L.Lcurl)
        {
            return new List<IExpressionNode> { ParseLambdaLiteral() };
        }

        var lparen = ParseToken(L.Lparen);
        AdvanceWhileNL();

        var args = new List<IExpressionNode>();

        while (Peek() != L.Rparen && Peek() != L.Eof)
        {
            var expression = ParseExpression();
            args.Add(expression);
            if (expression is MissingExpressionNode)
            {
                Advance();
            }

            AdvanceWhileNL();

            if (Peek() == L.Comma)
            {
                Advance();
                AdvanceWhileNL();
            }
        }

        var rparen = ParseToken(L.Rparen);

        if (Peek() == L.Lcurl)
        {
            args.Add(ParseLambdaLiteral());
        }

        return args;
    }

    private Token ParseLineString()
    {
        var token = PeekToken();
        if (token.Type != L.LineString)
        {
            return new MissingToken(token, L.LineString);
        }

        Advance();

        // Strip quotes from the string content
        var text = token.Text;
        if (text.StartsWith("\"") && text.EndsWith("\"") && text.Length >= 2)
        {
            text = text.Substring(1, text.Length - 2);
        }

        return new ConcreteToken(new LexerToken(token.Type, text, token.Index, token.Length, token.Line, token.Column));
    }

    private LiteralNode ParseNull()
    {
        ParseToken(L.Null);
        return new LiteralNode(null, StandardTypes.Null);
    }

    private IdentifierNode ParseIdentifier()
    {
        return new IdentifierNode(ParseToken(L.Identifier));
    }

    private LiteralNode ParseBooleanLiteral()
    {
        var token = ParseAnyToken();
        var value = token.Text == "true";
        return new LiteralNode(value, new LiteralType(value, StandardTypes.Boolean));
    }

    private IfNode ParseIf()
    {
        ParseToken(L.If);
        AdvanceWhileNL();
        ParseToken(L.Lparen);
        AdvanceWhileNL();
        var exp = ParseExpression();
        AdvanceWhileNL();
        ParseToken(L.Rparen);
        AdvanceWhileNL();
        var thenNode = ParseControlBody();

        // Search for else (look ahead, skipping newlines)
        var i = 0;
        while (Peek(i) == L.NL)
        {
            i++;
        }

        if (Peek(i) == L.Else)
        {
            Advance(i);  // Advance past the newlines to the else token
            Advance();   // Consume the else token
            AdvanceWhileNL();
            var elseNode = ParseControlBody();
            return new IfNode(exp, thenNode, elseNode);
        }
        else
        {
            return new IfNode(exp, thenNode, null);
        }
    }

    private ForNode ParseFor()
    {
        ParseToken(L.For);
        AdvanceWhileNL();
        ParseToken(L.Lparen);
        AdvanceWhileNL();
        var itemName = ParseToken(L.Identifier);
        AdvanceWhileNL();
        ParseToken(L.In);
        AdvanceWhileNL();
        var collection = ParseExpression();
        AdvanceWhileNL();
        ParseToken(L.Rparen);
        AdvanceWhileNL();
        var body = ParseControlBody();
        return new ForNode(itemName, collection, body);
    }

    private WhileNode ParseWhile()
    {
        ParseToken(L.While);
        AdvanceWhileNL();
        ParseToken(L.Lparen);
        AdvanceWhileNL();
        var condition = ParseExpression();
        AdvanceWhileNL();
        ParseToken(L.Rparen);
        AdvanceWhileNL();
        var body = ParseControlBody();
        return new WhileNode(condition, body);
    }

    private BreakNode ParseBreak()
    {
        ParseToken(L.Break);
        return new BreakNode();
    }

    private ContinueNode ParseContinue()
    {
        ParseToken(L.Continue);
        return new ContinueNode();
    }

    private IExpressionNode ParseControlBody()
    {
        if (Peek() == L.Lcurl)
        {
            return ParseBlock();
        }

        return ParseExpression();
    }

    private BlockNode ParseBlock()
    {
        ParseToken(L.Lcurl);
        AdvanceWhileNL();
        var statements = ParseStatements();
        ParseToken(L.Rcurl);
        return new BlockNode(statements.ToArray());
    }

    private List<IStatementNode> ParseStatements()
    {
        var statements = new List<IStatementNode>();
        while (Peek() != L.Rcurl && Peek() != L.Eof)
        {
            var statement = ParseStatement();
            statements.Add(statement);
            if (statement is MissingStatementNode)
            {
                Advance();
            }

            AdvanceWhileNL();
        }

        return statements;
    }

    private IExpressionNode ParseBinaryExpressionChain(Func<IExpressionNode> parseNext, params TokenType[] tokenTypes)
    {
        var node = parseNext();

        while (tokenTypes.Contains(PeekIgnoreNL()))
        {
            AdvanceWhileNL();
            var token = ParseAnyToken();
            AdvanceWhileNL();
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

    private Token ParseToken(TokenType tokenType)
    {
        if (Peek() != tokenType)
        {
            return new MissingToken(PeekToken(), tokenType);
        }

        var token = PeekToken();
        Advance();
        return new ConcreteToken(token);
    }

    private TokenType Peek(int offset = 0)
    {
        return _tokenBuffer.Peek(offset);
    }

    private LexerToken PeekToken(int offset = 0)
    {
        return _tokenBuffer.PeekToken(offset);
    }

    private void Advance(int num = 1)
    {
        _tokenBuffer.Advance(num);
    }

    private void AdvanceWhileNL()
    {
        while (Peek() == L.NL)
        {
            Advance();
        }
    }
}
