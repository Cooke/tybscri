using System.Linq.Expressions;

namespace Tybscri.Common;

public record GenerateContext(Func<Expression?, Expression> Return, bool Async);