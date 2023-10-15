namespace Tybscri;

public enum TokenType
{
    Eof,
    If,
    Identifier,
    Dot,
    NL,
    Semicolon,
    Fun,
    Var,
    Val,
    Assignment,
    Eqeq,
    Lparen,
    Rparen,
    Lcurl,
    Rcurl,
    Comma,
    Colon,
    Int,
    Is,
    True,
    False,
    Return,
    Lbracket,
    Rbracket,
    Else,
    LineString,
}

public class Lexer
{
    private readonly string _input;
    private int _index;
    private int _line = 1;
    private int _column = 1;
    private TokenType _tokenType = TokenType.Eof;
    private int _tokenLength;

    public Lexer(string input)
    {
        _input = input;
    }

    public string Input => _input;

    public int Index => _index;

    public int Line => _line;

    public int Column => _column;

    public TokenType TokenType => _tokenType;

    public int TokenLength => _tokenLength;

    public void Advance()
    {
        _index += _tokenLength;
        _column += _tokenLength;
        if (_tokenType == TokenType.NL) {
            _line++;
            _column = 0;
        }

        while (
            _index < _input.Length &&
            IsWhitespace(_input[_index])
        ) {
            _index++;
            _column++;
        }

        Parse();
    }

    //
    // public Lexer createChildLexer()
    // {
    //     return new Lexer(_input, 
    //     {
    //         index: this._index,
    //         column: this._column,
    //         line: this._line,
    //     });
    // }

    private void Parse()
    {
        var index = _index;
        var input = _input;
        if (index >= input.Length) {
            Update(TokenType.Eof, 0);
            return;
        }

        switch (input[index]) {
            case '.':
                Update(TokenType.Dot, 1);
                return;

            case 'e':
                if (IsWord(input, index, "else")) {
                    Update(TokenType.Else, 4);
                }
                else {
                    ParseIdentifier();
                }
                return;

            case 'f':
                if (IsWord(input, index, "fun")) {
                    Update(TokenType.Fun, 3);
                }
                else if (IsWord(input, index, "false")) {
                    Update(TokenType.False, 5);
                }
                else {
                    ParseIdentifier();
                }
                return;

            case 'i':
                if (IsWord(input, index, "if")) {
                    Update(TokenType.If, 2);
                }
                else if (IsWord(input, index, "is")) {
                    Update(TokenType.Is, 2);
                }
                else {
                    ParseIdentifier();
                }
                return;

            case 'r':
                if (IsWord(input, index, "return")) {
                    Update(TokenType.Return, 6);
                }
                else {
                    ParseIdentifier();
                }
                return;

            case 't':
                if (IsWord(input, index, "true")) {
                    Update(TokenType.True, 4);
                }
                else {
                    ParseIdentifier();
                }
                return;

            case 'v':
                if (IsWord(input, index, "var")) {
                    Update(TokenType.Var, 3);
                }
                else if (IsWord(input, index, "val")) {
                    Update(TokenType.Val, 3);
                }
                else {
                    ParseIdentifier();
                }
                return;

            case '\n':
                Update(TokenType.NL, 1);
                return;

            case '\r':
                if (_input[index + 1] != '\n') {
                    throw new Exception(
                        "Unexpected character sequence: \\r not followed by \\n is currently not allowed"
                    );
                }
                Update(TokenType.NL, 2);
                return;

            case ';':
                Update(TokenType.Semicolon, 1);
                return;

            case ',':
                Update(TokenType.Comma, 1);
                return;

            case ':':
                Update(TokenType.Colon, 1);
                return;

            case '=':
                if (IsWord(input, index, "==")) {
                    Update(TokenType.Eqeq, 2);
                }
                else {
                    Update(TokenType.Assignment, 1);
                }
                return;

            case '(':
                Update(TokenType.Lparen, 1);
                return;

            case ')':
                Update(TokenType.Rparen, 1);
                return;

            case '{':
                Update(TokenType.Lcurl, 1);
                return;

            case '}':
                Update(TokenType.Rcurl, 1);
                return;

            case '[':
                Update(TokenType.Lbracket, 1);
                return;

            case ']':
                Update(TokenType.Rbracket, 1);
                return;

            case '"':
                var end = index;
                do {
                    end++;
                } while (_input[end] != '"' && end < _input.Length);
                Update(TokenType.LineString, end - _index + 1);
                return;
        }

        if (IsLetter(input[index])) {
            ParseIdentifier();
            return;
        }

        if (IsDigit(input[index])) {
            var end = index + 1;
            while (end < input.Length && IsDigit(input[end])) {
                end++;
            }
            Update(TokenType.Int, end - index);
            return;
        }

        throw new Exception(
            $@"Unrecognizable character at ""{_input.Substring(
                _index,
                _index + 10
            )}"" at index ${_index} (${_line}:${_column})"
        );
    }

    private void Update(TokenType tokenType, int length)
    {
        _tokenType = tokenType;
        _tokenLength = length;
    }

    private void ParseIdentifier()
    {
        var end = _index + 1;
        while (
            end < _input.Length &&
            (IsLetter(_input[end]) || IsDigit(_input[end]))
        ) {
            end++;
        }
        var length = end - _index;
        Update(TokenType.Identifier, length);
    }

    private static bool IsWord(string input, int index, string word) =>
        String.Compare(input, index, word, 0, word.Length) == 0 &&
        IsSeparator(input[index + word.Length]);

    private static bool IsSeparator(char? ch) => ch == null || !IsDigit(ch.Value) && !IsLetter(ch.Value);

    private static bool IsDigit(char ch) => ch is >= '0' and <= '9';

    private static bool IsLetter(char ch) => ch >= 65 && ch < 91 || ch >= 97 && ch < 123;

    private static bool IsWhitespace(char ch) => ch is ' ' or '\t';

}