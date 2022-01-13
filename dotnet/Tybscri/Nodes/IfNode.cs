﻿using System.Linq.Expressions;
using Tybscri.Utils;

namespace Tybscri.Nodes;

internal class IfNode : Node
{
    public Node Exp { get; }

    public Node Then { get; }

    public Node? ElseNode { get; }

    public IfNode(Token ifToken, Token lparen, Node exp, Token rparen, Node then, Node? elseNode) : base(exp, then)
    {
        Exp = exp;
        Then = then;
        ElseNode = elseNode;
    }

    public override Expression ToClrExpression()
    {
        var elseExp = ElseNode?.ToClrExpression() ?? Expression.Constant(null, typeof(object));
        var thenExp = Then.ToClrExpression();
        return Expression.Condition(Exp.ToClrExpression(), thenExp, elseExp,
            ClrTypeUtils.FindCommonType(thenExp.Type, elseExp.Type));
    }
}