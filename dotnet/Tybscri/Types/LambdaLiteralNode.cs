using System.Linq.Expressions;
using Tybscri.Nodes;

namespace Tybscri;

public class LambdaLiteralNode : Node
{
    public IReadOnlyCollection<Node> Statements { get; }
    
    private TybscriType itParameterType = UnknownType.Instance;
    private Symbol itParameterSymbol;

    public LambdaLiteralNode(IReadOnlyCollection<Node> statements) : base(statements)
    {
        Statements = statements;
        itParameterSymbol = new SourceSymbol("it", () => itParameterType);
    }

    public override void SetupScopes(Scope scope)
    {
        var hoistedScopeSymbols = Statements
            .Where(x => x is Function)
            .ToArray();
        var blockScope = new Scope(
                scope,
                hoistedScopeSymbols.Concat([this.itParameterSymbol])
            );

        for (const statement of this.statements) {
            statement.setupScopes(blockScope, context);

            if (statement instanceof VariableDeclarationNode) {
                blockScope = blockScope.withSymbols([statement.symbol]);
            }
        }
        
        Scope = scope;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        throw new NotImplementedException();
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        throw new NotImplementedException();
    }
}