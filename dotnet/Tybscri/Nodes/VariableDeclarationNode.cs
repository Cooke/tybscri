using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Symbols;

namespace Tybscri.Nodes;

public class VariableDeclarationNode : IStatementNode, ISymbolDefinitionNode
{
    private ParameterExpression? _linqExpression;

    public VariableDeclarationNode(Token name, IExpressionNode assignment)
    {
        Name = name;
        Assignment = assignment;
        Children = new[] { assignment };
    }

    public Token Name { get; }

    public IExpressionNode Assignment { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public IReadOnlyCollection<INode> Children { get; }

    public ParameterExpression SymbolLinqExpression => _linqExpression ?? throw new InvalidOperationException();

    public TybscriType SymbolType { get; private set; } = UnknownType.Instance;

    public string SymbolName => Name.Text;

    public void SetupScopes(Scope scope)
    {
        Assignment.SetupScopes(scope);
        Scope = scope.WithSymbol(new SourceSymbol(SymbolName, this));
    }

    public void Resolve(ResolveContext context)
    {
        Assignment.Resolve(new ResolveContext(null));
        SymbolType = Assignment.ValueType;
        _linqExpression = Expression.Variable(SymbolType.ClrType, Name.Text);
    }

    public Expression GenerateLinqExpression(GenerateContext context)
    {
        return Expression.Block(Expression.Assign(SymbolLinqExpression, Assignment.GenerateLinqExpression(context)),
            Expression.Constant(null, typeof(object)));
    }

    public void ResolveSymbolDefinition()
    {
        if (_linqExpression == null) {
            throw new TybscriException($"Variable {SymbolName} can not be used before initialization");
        }
    }
}