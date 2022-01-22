// using System.Linq.Expressions;
//
// namespace Tybscri.Nodes;
//
// public class MemberNode : Node
// {
//     public Node Expression { get; }
//     
//     public Token MemberName { get; }
//
//     public MemberNode(Node expression, Token memberName) : base(expression)
//     {
//         Expression = expression;
//         MemberName = memberName;
//     }
//
//
//     public void ResolveTypes(CompileContext context)
//     {
//         Expression.ResolveTypes(context);
//
//         if (Expression.ValueType is null) {
//             // An error should be reported elsewhere
//             return;
//         }
//
//         var matchingMembers = Expression.ValueType.FindMembersByName(MemberName.Text);
//         if (matchingMembers.Count == 0) {
//             return;
//         }
//
//         if (matchingMembers.Count > 1) {
//             return;
//         }
//
//         this.ValueType = matchingMembers.First().Type;
//     }
//
//     public override Expression ToClrExpression()
//     {
//         
//     }
// }