import { languages, Range, Uri } from "monaco-editor";
import * as monaco from "monaco-editor";
import {
  Node,
  parseScript,
  getAllTypeMembers,
  MemberNode,
  getTypeDisplayName,
} from "tybscri";
import { findNonTokenNode } from "./utils";

export class TybscriCompletionItemProvider
  implements languages.CompletionItemProvider
{
  triggerCharacters: string[] = ["."];

  async provideCompletionItems(
    textModel: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.CompletionList | undefined> {
    const scriptNode = parseScript(textModel.getValue()).tree;

    const offset = textModel.getOffsetAt(position);

    const currentNode = findNonTokenNode(scriptNode, offset - 1) ?? scriptNode;
    console.log("Completion node:", currentNode?.toString(), currentNode.scope);

    const suggestions = calcSuggestions(currentNode, textModel, position);
    console.log("Suggestions:", suggestions);

    return {
      suggestions,
    };
  }
}

function calcSuggestions(
  currentNode: Node,
  textModel: monaco.editor.ITextModel,
  position: monaco.Position
) {
  if (currentNode instanceof MemberNode) {
    return calcMemberSuggestions(currentNode, textModel, position);
  } else {
    return calcSymbolSuggestions(currentNode, textModel, position);
  }
}

function calcSymbolSuggestions(
  currentNode: Node,
  textModel: monaco.editor.ITextModel,
  position: monaco.Position
) {
  return currentNode.scope
    .getAll()
    .map<monaco.languages.CompletionItem>((sug) => ({
      insertText: sug.name,
      kind:
        sug.valueType.kind === "Func"
          ? monaco.languages.CompletionItemKind.Function
          : monaco.languages.CompletionItemKind.Field,
      range: calcRangeFromCurrentWord(textModel, position),
      label: sug.name,
      detail: getTypeDisplayName(sug.valueType),
    }));
}

function calcMemberSuggestions(
  currentNode: MemberNode,
  textModel: monaco.editor.ITextModel,
  position: monaco.Position
) {
  const members = getAllTypeMembers(currentNode.expression.valueType);
  const wordRange = calcRangeFromCurrentWord(textModel, position);

  const suggestions =
    members.map<monaco.languages.CompletionItem>((m) => ({
      insertText: m.name,
      kind:
        m.type.kind === "Func"
          ? monaco.languages.CompletionItemKind.Method
          : monaco.languages.CompletionItemKind.Field,
      range: wordRange,
      label: m.name,
      detail: getTypeDisplayName(m.type),
    })) ?? [];
  return suggestions;
}

function calcRangeFromCurrentWord(
  textModel: monaco.editor.ITextModel,
  position: monaco.Position
) {
  const wordInfo = textModel.getWordUntilPosition(position);
  return new Range(
    position.lineNumber,
    wordInfo.startColumn,
    position.lineNumber,
    wordInfo.endColumn
  );
}
