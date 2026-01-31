import * as monaco from "monaco-editor";
import {
  parseScript,
  Node,
  FunctionNode,
  FunctionParameterNode,
  VariableDeclarationNode,
  TypeNode,
  IdentifierNode,
  IdentifierInvocationNode,
  MemberAccessNode,
  MemberInvocationNode,
  ForNode,
  Environment,
} from "tybscri";

// CSS class names for semantic token types
const CLASS_TYPE = "tybscri-type";
const CLASS_VARIABLE = "tybscri-variable";
const CLASS_VARIABLE_DECL = "tybscri-variable-decl";
const CLASS_FUNCTION = "tybscri-function";
const CLASS_FUNCTION_DECL = "tybscri-function-decl";
const CLASS_PROPERTY = "tybscri-property";
const CLASS_PARAMETER = "tybscri-parameter";

interface SemanticToken {
  line: number;
  startColumn: number;
  endColumn: number;
  className: string;
}

// Inject CSS styles for semantic highlighting
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement("style");
  style.textContent = `
    .${CLASS_TYPE} { color: #267f99 !important; }
    .${CLASS_VARIABLE} { color: #001080 !important; }
    .${CLASS_VARIABLE_DECL} { color: #0070c1 !important; }
    .${CLASS_FUNCTION} { color: #795e26 !important; }
    .${CLASS_FUNCTION_DECL} { color: #795e26 !important; }
    .${CLASS_PROPERTY} { color: #001080 !important; }
    .${CLASS_PARAMETER} { color: #001080 !important; }
  `;
  document.head.appendChild(style);
}

export class SemanticHighlighter {
  private decorationIds: string[] = [];
  private editor: monaco.editor.IStandaloneCodeEditor;

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
    injectStyles();
  }

  public update(environment?: Environment) {
    const model = this.editor.getModel();
    if (!model) return;

    const text = model.getValue();
    const tokens: SemanticToken[] = [];

    try {
      const result = parseScript(text, { environment });
      this.walkNode(result.tree, tokens);
    } catch {
      // If parsing fails, clear decorations
      this.decorationIds = this.editor.deltaDecorations(this.decorationIds, []);
      return;
    }

    // Convert tokens to Monaco decorations
    const decorations: monaco.editor.IModelDeltaDecoration[] = tokens.map((token) => ({
      range: new monaco.Range(token.line, token.startColumn, token.line, token.endColumn),
      options: {
        inlineClassName: token.className,
      },
    }));

    // Apply decorations (this replaces previous decorations)
    this.decorationIds = this.editor.deltaDecorations(this.decorationIds, decorations);
  }

  public dispose() {
    this.decorationIds = this.editor.deltaDecorations(this.decorationIds, []);
  }

  private walkNode(node: Node, tokens: SemanticToken[]): void {
    // Handle specific node types
    if (node instanceof FunctionNode) {
      // Function name is a declaration
      const nameSpan = node.name.span;
      tokens.push({
        line: nameSpan.start.line,
        startColumn: nameSpan.start.column,
        endColumn: nameSpan.stop.column,
        className: CLASS_FUNCTION_DECL,
      });
    } else if (node instanceof FunctionParameterNode) {
      // Parameter name is a declaration
      const nameSpan = node.name.span;
      tokens.push({
        line: nameSpan.start.line,
        startColumn: nameSpan.start.column,
        endColumn: nameSpan.stop.column,
        className: CLASS_PARAMETER,
      });
    } else if (node instanceof VariableDeclarationNode) {
      // Variable name is a declaration
      const nameSpan = node.name.span;
      tokens.push({
        line: nameSpan.start.line,
        startColumn: nameSpan.start.column,
        endColumn: nameSpan.stop.column,
        className: CLASS_VARIABLE_DECL,
      });
    } else if (node instanceof ForNode) {
      // For loop item name is a variable declaration
      const nameSpan = node.itemName.span;
      tokens.push({
        line: nameSpan.start.line,
        startColumn: nameSpan.start.column,
        endColumn: nameSpan.stop.column,
        className: CLASS_VARIABLE_DECL,
      });
    } else if (node instanceof TypeNode) {
      // Type annotation - the inner node contains the type identifier
      if (node.node instanceof IdentifierNode) {
        const tokenSpan = node.node.token.span;
        tokens.push({
          line: tokenSpan.start.line,
          startColumn: tokenSpan.start.column,
          endColumn: tokenSpan.stop.column,
          className: CLASS_TYPE,
        });
        // Don't recurse into TypeNode's children since we handled the identifier
        return;
      }
    } else if (node instanceof IdentifierInvocationNode) {
      // Function call
      const nameSpan = node.name.span;
      tokens.push({
        line: nameSpan.start.line,
        startColumn: nameSpan.start.column,
        endColumn: nameSpan.stop.column,
        className: CLASS_FUNCTION,
      });
    } else if (node instanceof MemberInvocationNode) {
      // Method call (property that's invoked)
      const memberSpan = node.member.span;
      tokens.push({
        line: memberSpan.start.line,
        startColumn: memberSpan.start.column,
        endColumn: memberSpan.stop.column,
        className: CLASS_FUNCTION,
      });
    } else if (node instanceof MemberAccessNode) {
      // Property access
      const memberSpan = node.member.span;
      tokens.push({
        line: memberSpan.start.line,
        startColumn: memberSpan.start.column,
        endColumn: memberSpan.stop.column,
        className: CLASS_PROPERTY,
      });
    } else if (node instanceof IdentifierNode) {
      // Variable reference (not in a type context)
      const tokenSpan = node.token.span;
      tokens.push({
        line: tokenSpan.start.line,
        startColumn: tokenSpan.start.column,
        endColumn: tokenSpan.stop.column,
        className: CLASS_VARIABLE,
      });
    }

    // Recurse into children
    for (const child of node.children) {
      this.walkNode(child, tokens);
    }
  }
}
