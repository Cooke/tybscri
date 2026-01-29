namespace Tybscri;

public enum TokenType
{
    Eof,

    // Keywords
    If,
    Else,
    Fun,
    Var,
    Val,
    Return,
    Is,
    For,
    While,
    Break,
    Continue,
    In,
    Null,
    True,
    False,

    // Identifiers and literals
    Identifier,
    Int,
    Float,
    LineString,

    // Symbols
    Dot,
    Comma,
    Colon,
    Semicolon,
    Lparen,
    Rparen,
    Lbracket,
    Rbracket,
    Lcurl,
    Rcurl,

    // Operators
    Assignment,
    Eqeq,
    ExclamEq,
    Lt,
    Gt,
    LtEq,
    GtEq,
    Add,
    Sub,
    Mult,
    Div,
    Mod,
    AndAnd,
    Or,
    OrOr,
    Exclam,
    FatArrow,
    Incr,
    Decr,
    Question,

    // Whitespace
    NL,
}

public class LexerToken
{
    public TokenType Type { get; }
    public string Text { get; }
    public int Index { get; }
    public int Length { get; }
    public int Line { get; }
    public int Column { get; }

    public LexerToken(TokenType type, string text, int index, int length, int line, int column)
    {
        Type = type;
        Text = text;
        Index = index;
        Length = length;
        Line = line;
        Column = column;
    }
}

public class Lexer
{
    private readonly string _input;
    private int _index;
    private int _line = 1;
    private int _column = 1;
    private TokenType _tokenType = TokenType.Eof;
    private int _tokenLength;
    private LexerToken? _token;

    public Lexer(string input)
    {
        _input = input;
        Advance();
    }

    public string Input => _input;
    public int Index => _index;
    public int Line => _line;
    public int Column => _column;
    public TokenType TokenType => _tokenType;
    public int TokenLength => _tokenLength;

    public LexerToken Token
    {
        get
        {
            if (_token != null)
            {
                return _token;
            }

            var text = _tokenLength > 0 ? _input.Substring(_index, _tokenLength) : "";
            _token = new LexerToken(_tokenType, text, _index, _tokenLength, _line, _column);
            return _token;
        }
    }

    public void Advance()
    {
        _index += _tokenLength;
        _column += _tokenLength;
        if (_tokenType == TokenType.NL)
        {
            _line++;
            _column = 1;
        }

        // Skip whitespace (but not newlines)
        while (_index < _input.Length && IsWhitespace(_input[_index]))
        {
            _index++;
            _column++;
        }

        // Skip comments
        while (_index < _input.Length)
        {
            if (_index + 1 < _input.Length && _input[_index] == '/' && _input[_index + 1] == '/')
            {
                // Line comment - skip to end of line
                while (_index < _input.Length && _input[_index] != '\n' && _input[_index] != '\r')
                {
                    _index++;
                    _column++;
                }
            }
            else if (_index + 1 < _input.Length && _input[_index] == '/' && _input[_index + 1] == '*')
            {
                // Section comment - skip to */
                _index += 2;
                _column += 2;
                while (_index + 1 < _input.Length && !(_input[_index] == '*' && _input[_index + 1] == '/'))
                {
                    if (_input[_index] == '\n')
                    {
                        _line++;
                        _column = 1;
                    }
                    else if (_input[_index] != '\r')
                    {
                        _column++;
                    }
                    _index++;
                }
                if (_index + 1 < _input.Length)
                {
                    _index += 2;
                    _column += 2;
                }
            }
            else
            {
                break;
            }

            // Skip whitespace after comment
            while (_index < _input.Length && IsWhitespace(_input[_index]))
            {
                _index++;
                _column++;
            }
        }

        _token = null;
        Parse();
    }

    private void Parse()
    {
        var index = _index;
        var input = _input;
        if (index >= input.Length)
        {
            Update(TokenType.Eof, 0);
            return;
        }

        var ch = input[index];
        switch (ch)
        {
            case '.':
                Update(TokenType.Dot, 1);
                return;

            case ',':
                Update(TokenType.Comma, 1);
                return;

            case ':':
                Update(TokenType.Colon, 1);
                return;

            case ';':
                Update(TokenType.Semicolon, 1);
                return;

            case '(':
                Update(TokenType.Lparen, 1);
                return;

            case ')':
                Update(TokenType.Rparen, 1);
                return;

            case '[':
                Update(TokenType.Lbracket, 1);
                return;

            case ']':
                Update(TokenType.Rbracket, 1);
                return;

            case '{':
                Update(TokenType.Lcurl, 1);
                return;

            case '}':
                Update(TokenType.Rcurl, 1);
                return;

            case '?':
                Update(TokenType.Question, 1);
                return;

            case '!':
                if (index + 1 < input.Length && input[index + 1] == '=')
                {
                    Update(TokenType.ExclamEq, 2);
                }
                else
                {
                    Update(TokenType.Exclam, 1);
                }
                return;

            case '=':
                if (index + 1 < input.Length && input[index + 1] == '=')
                {
                    Update(TokenType.Eqeq, 2);
                }
                else if (index + 1 < input.Length && input[index + 1] == '>')
                {
                    Update(TokenType.FatArrow, 2);
                }
                else
                {
                    Update(TokenType.Assignment, 1);
                }
                return;

            case '<':
                if (index + 1 < input.Length && input[index + 1] == '=')
                {
                    Update(TokenType.LtEq, 2);
                }
                else
                {
                    Update(TokenType.Lt, 1);
                }
                return;

            case '>':
                if (index + 1 < input.Length && input[index + 1] == '=')
                {
                    Update(TokenType.GtEq, 2);
                }
                else
                {
                    Update(TokenType.Gt, 1);
                }
                return;

            case '+':
                if (index + 1 < input.Length && input[index + 1] == '+')
                {
                    Update(TokenType.Incr, 2);
                }
                else
                {
                    Update(TokenType.Add, 1);
                }
                return;

            case '-':
                if (index + 1 < input.Length && input[index + 1] == '-')
                {
                    Update(TokenType.Decr, 2);
                }
                else
                {
                    Update(TokenType.Sub, 1);
                }
                return;

            case '*':
                Update(TokenType.Mult, 1);
                return;

            case '/':
                Update(TokenType.Div, 1);
                return;

            case '%':
                Update(TokenType.Mod, 1);
                return;

            case '&':
                if (index + 1 < input.Length && input[index + 1] == '&')
                {
                    Update(TokenType.AndAnd, 2);
                }
                else
                {
                    throw new Exception($"Unexpected character '&' at index {index} ({_line}:{_column})");
                }
                return;

            case '|':
                if (index + 1 < input.Length && input[index + 1] == '|')
                {
                    Update(TokenType.OrOr, 2);
                }
                else
                {
                    Update(TokenType.Or, 1);
                }
                return;

            case '\n':
                Update(TokenType.NL, 1);
                return;

            case '\r':
                if (index + 1 < input.Length && input[index + 1] == '\n')
                {
                    Update(TokenType.NL, 2);
                }
                else
                {
                    Update(TokenType.NL, 1);
                }
                return;

            case '"':
                ParseString();
                return;

            // Keywords starting with specific letters
            case 'b':
                if (IsWord(input, index, "break"))
                {
                    Update(TokenType.Break, 5);
                }
                else
                {
                    ParseIdentifier();
                }
                return;

            case 'c':
                if (IsWord(input, index, "continue"))
                {
                    Update(TokenType.Continue, 8);
                }
                else
                {
                    ParseIdentifier();
                }
                return;

            case 'e':
                if (IsWord(input, index, "else"))
                {
                    Update(TokenType.Else, 4);
                }
                else
                {
                    ParseIdentifier();
                }
                return;

            case 'f':
                if (IsWord(input, index, "fun"))
                {
                    Update(TokenType.Fun, 3);
                }
                else if (IsWord(input, index, "false"))
                {
                    Update(TokenType.False, 5);
                }
                else if (IsWord(input, index, "for"))
                {
                    Update(TokenType.For, 3);
                }
                else
                {
                    ParseIdentifier();
                }
                return;

            case 'i':
                if (IsWord(input, index, "if"))
                {
                    Update(TokenType.If, 2);
                }
                else if (IsWord(input, index, "is"))
                {
                    Update(TokenType.Is, 2);
                }
                else if (IsWord(input, index, "in"))
                {
                    Update(TokenType.In, 2);
                }
                else
                {
                    ParseIdentifier();
                }
                return;

            case 'n':
                if (IsWord(input, index, "null"))
                {
                    Update(TokenType.Null, 4);
                }
                else
                {
                    ParseIdentifier();
                }
                return;

            case 'r':
                if (IsWord(input, index, "return"))
                {
                    Update(TokenType.Return, 6);
                }
                else
                {
                    ParseIdentifier();
                }
                return;

            case 't':
                if (IsWord(input, index, "true"))
                {
                    Update(TokenType.True, 4);
                }
                else
                {
                    ParseIdentifier();
                }
                return;

            case 'v':
                if (IsWord(input, index, "var"))
                {
                    Update(TokenType.Var, 3);
                }
                else if (IsWord(input, index, "val"))
                {
                    Update(TokenType.Val, 3);
                }
                else
                {
                    ParseIdentifier();
                }
                return;

            case 'w':
                if (IsWord(input, index, "while"))
                {
                    Update(TokenType.While, 5);
                }
                else
                {
                    ParseIdentifier();
                }
                return;
        }

        if (IsLetter(ch) || ch == '_')
        {
            ParseIdentifier();
            return;
        }

        if (IsDigit(ch))
        {
            ParseNumber();
            return;
        }

        throw new Exception(
            $"Unrecognizable character '{ch}' at index {index} ({_line}:{_column})"
        );
    }

    private void ParseString()
    {
        var end = _index + 1;
        while (end < _input.Length && _input[end] != '"')
        {
            // Handle escape sequences
            if (_input[end] == '\\' && end + 1 < _input.Length)
            {
                end += 2;
            }
            else
            {
                end++;
            }
        }

        if (end < _input.Length)
        {
            end++; // Include closing quote
        }

        Update(TokenType.LineString, end - _index);
    }

    private void ParseNumber()
    {
        var end = _index + 1;
        while (end < _input.Length && IsDigit(_input[end]))
        {
            end++;
        }

        // Check for float
        if (end < _input.Length && _input[end] == '.' && end + 1 < _input.Length && IsDigit(_input[end + 1]))
        {
            end++;
            while (end < _input.Length && IsDigit(_input[end]))
            {
                end++;
            }
            Update(TokenType.Float, end - _index);
        }
        else
        {
            Update(TokenType.Int, end - _index);
        }
    }

    private void Update(TokenType tokenType, int length)
    {
        _tokenType = tokenType;
        _tokenLength = length;
    }

    private void ParseIdentifier()
    {
        var end = _index + 1;
        while (end < _input.Length && (IsLetter(_input[end]) || IsDigit(_input[end]) || _input[end] == '_'))
        {
            end++;
        }
        Update(TokenType.Identifier, end - _index);
    }

    private static bool IsWord(string input, int index, string word)
    {
        if (index + word.Length > input.Length)
        {
            return false;
        }

        if (string.Compare(input, index, word, 0, word.Length) != 0)
        {
            return false;
        }

        var nextIndex = index + word.Length;
        if (nextIndex >= input.Length)
        {
            return true;
        }

        return IsSeparator(input[nextIndex]);
    }

    private static bool IsSeparator(char ch) => !IsDigit(ch) && !IsLetter(ch) && ch != '_';

    private static bool IsDigit(char ch) => ch is >= '0' and <= '9';

    private static bool IsLetter(char ch) => (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');

    private static bool IsWhitespace(char ch) => ch is ' ' or '\t' or '\f';

    public LexerState SaveState() => new(_index, _line, _column, _tokenType, _tokenLength);

    public void RestoreState(LexerState state)
    {
        _index = state.Index;
        _line = state.Line;
        _column = state.Column;
        _tokenType = state.TokenType;
        _tokenLength = state.TokenLength;
        _token = null;
    }
}

public readonly struct LexerState
{
    public int Index { get; }
    public int Line { get; }
    public int Column { get; }
    public TokenType TokenType { get; }
    public int TokenLength { get; }

    public LexerState(int index, int line, int column, TokenType tokenType, int tokenLength)
    {
        Index = index;
        Line = line;
        Column = column;
        TokenType = tokenType;
        TokenLength = tokenLength;
    }
}

public class TokenBuffer
{
    private readonly Lexer _lexer;
    private readonly List<LexerToken> _buffer = new();
    private int _position;

    public TokenBuffer(string input)
    {
        _lexer = new Lexer(input);
        // Buffer the first token
        _buffer.Add(_lexer.Token);
    }

    public TokenType Peek(int offset = 0)
    {
        EnsureBuffered(_position + offset);
        return _buffer[_position + offset].Type;
    }

    public LexerToken PeekToken(int offset = 0)
    {
        EnsureBuffered(_position + offset);
        return _buffer[_position + offset];
    }

    public void Advance(int count = 1)
    {
        _position += count;
        EnsureBuffered(_position);
    }

    private void EnsureBuffered(int index)
    {
        while (_buffer.Count <= index)
        {
            _lexer.Advance();
            _buffer.Add(_lexer.Token);
        }
    }
}
