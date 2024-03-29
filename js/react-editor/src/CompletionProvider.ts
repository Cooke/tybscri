import * as monaco from "monaco-editor";
import { languages, Range } from "monaco-editor";
import {
  FuncType,
  isDefinitionType,
  MemberNode,
  Node,
  parseScript,
  widenType,
} from "tybscri";
import { getModelEnvironment } from "./common";
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
    var environment = getModelEnvironment(textModel);

    const scriptNode = parseScript(textModel.getValue(), {
      environment,
    }).tree;

    const offset = textModel.getOffsetAt(position);

    const currentNode = findNonTokenNode(scriptNode, offset) ?? scriptNode;
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
        sug.valueType instanceof FuncType
          ? monaco.languages.CompletionItemKind.Function
          : isDefinitionType(sug.valueType)
          ? monaco.languages.CompletionItemKind.Class
          : monaco.languages.CompletionItemKind.Field,
      range: calcRangeFromCurrentWord(textModel, position),
      label: sug.name,
      detail: sug.valueType.displayName,
    }));
}

function calcMemberSuggestions(
  currentNode: MemberNode,
  textModel: monaco.editor.ITextModel,
  position: monaco.Position
) {
  const type = currentNode.expression.valueType;
  const members = type.members;
  const wordRange = calcRangeFromCurrentWord(textModel, position);

  const suggestions =
    members.map<monaco.languages.CompletionItem>((m) => ({
      insertText: m.name,
      kind:
        m.type instanceof FuncType
          ? monaco.languages.CompletionItemKind.Method
          : monaco.languages.CompletionItemKind.Field,
      range: wordRange,
      label: m.name,
      detail:
        widenType(type).displayName + "." + m.name + ": " + m.type.displayName,
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
