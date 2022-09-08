using Antlr4.Runtime;

namespace Tybscri.Nodes;

public class MissingToken : Token
{
    public IToken ActualToken { get; }

    public MissingToken(IToken actualToken, int missingToken)
    {
        ActualToken = actualToken;
    }

    public override string Text => ActualToken.Text;
}