namespace Tybscri;

internal class ConcreteToken : Token
{
    private readonly LexerToken _token;

    public ConcreteToken(LexerToken token)
    {
        _token = token;
    }

    public override string Text => _token.Text;
    public override int Line => _token.Line;
    public override int Column => _token.Column;
    public override int Index => _token.Index;
}
