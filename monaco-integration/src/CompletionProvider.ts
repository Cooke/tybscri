import { languages, Range, Uri } from "monaco-editor";
import * as monaco from "monaco-editor";
import { Node, parseScript, getAllTypeMembers, ObjectMember } from "tybscri";
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
    const currentNode = findNonTokenNode(scriptNode, offset - 2);

    console.log("Position ", offset);
    console.log("Offset ", offset);
    console.log("Completion node ", currentNode?.toString());

    if (currentNode?.valueType) {
      const members = getAllTypeMembers(currentNode.valueType);
      const wordInfo = textModel.getWordUntilPosition(position);
      const wordRange = new Range(
        position.lineNumber,
        wordInfo.startColumn,
        position.lineNumber,
        wordInfo.endColumn
      );

      const suggestions =
        members.map<monaco.languages.CompletionItem>((m: ObjectMember) => ({
          insertText: m.name,
          kind:
            m.type.kind === "Func"
              ? monaco.languages.CompletionItemKind.Method
              : monaco.languages.CompletionItemKind.Field,
          range: wordRange,
          label: m.name,
        })) ?? [];

      return {
        suggestions,
      };
    }
  }
}
