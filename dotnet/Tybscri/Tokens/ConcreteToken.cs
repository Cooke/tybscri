using Antlr4.Runtime;

namespace Tybscri;

internal class ConcreteToken : Token
{
    private readonly IToken _token;

    public ConcreteToken(IToken token)
    {
        _token = token;
    }

    public override string Text => _token.Text;
}