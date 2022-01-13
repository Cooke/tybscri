using System.Linq.Expressions;
using System.Runtime.InteropServices.ComTypes;

namespace Tybscri.Nodes;

public class ScriptNode : Node
{
    public ScriptNode(Node[] statements) : base(statements)
    {
    }

    public override BlockExpression ToClrExpression() => Expression.Block(Children.Select(x => x.ToClrExpression()));
}