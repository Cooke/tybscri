namespace Tybscri.Nodes;

public class MissingToken : Token
{
    public LexerToken ActualToken { get; }
    public TokenType ExpectedType { get; }

    public MissingToken(LexerToken actualToken, TokenType expectedType)
    {
        ActualToken = actualToken;
        ExpectedType = expectedType;
    }

    public override string Text => ActualToken.Text;
    public override int Line => ActualToken.Line;
    public override int Column => ActualToken.Column;
    public override int Index => ActualToken.Index;
}
