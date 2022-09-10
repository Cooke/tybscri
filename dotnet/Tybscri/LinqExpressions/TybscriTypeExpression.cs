using System.Linq.Expressions;
using System.Reflection;
using System.Reflection.Emit;

namespace Tybscri.LinqExpressions;

public class TybscriTypeExpression : Expression
{
    public TybscriType TybscriType { get; }
    private readonly Lazy<Expression> _reduced;
    

    public TybscriTypeExpression(TybscriType tybscriType)
    {
        TybscriType = tybscriType;
        _reduced = new Lazy<Expression>(CreateReduced);
    }

    public override ExpressionType NodeType => ExpressionType.Extension;

    public override Type Type => _reduced.Value.Type;

    public override Expression Reduce()
    {
        return _reduced.Value;
    }

    public override bool CanReduce => true;

    private Expression CreateReduced()
    {
        throw new NotImplementedException();
    }
}