import Editor, { loader, useMonaco, Monaco } from "@monaco-editor/react";
import {
  parseExpression,
  TybscriTokensProvider,
} from "tybscri-monaco-integration";
import { DiagnosticMessage } from "tybscri";
import * as monaco from "monaco-editor";
import "./App.css";
import { MarkerSeverity } from "monaco-editor";

loader.init().then((m) => {
  m.languages.register({ id: "tybscri" });
  m.languages.setLanguageConfiguration("tybscri", {
    brackets: [["{", "}"]],
    autoClosingPairs: [
      { open: "{", close: "}", notIn: ['".*"'] },
      { open: "(", close: ")", notIn: ['".*"'] },
      { open: "[", close: "]", notIn: ['".*"'] },
    ],
  });
  m.languages.setTokensProvider("tybscri", new TybscriTokensProvider());
  // const tybscriCompletionProvider = new TybscriCompeletionItemProvider(
  //   scriptProvider
  // );
  // // m.languages.registerHoverProvider("dom", domMonacoLangProvider)
  // m.languages.registerCompletionItemProvider(
  //   "tybscri",
  //   tybscriCompletionProvider
  // );
  // mon = m;
});

function App() {
  return (
    <div className="App">
      <h1>Tybscri Demo</h1>
      <Editor
        height="75vh"
        className="Editor"
        defaultValue=""
        language="tybscri"
        onMount={(editor, monaco) => {
          editor.onDidChangeModelContent((ev) => {
            const messages: DiagnosticMessage[] = [];
            const output = parseExpression(editor.getValue(), {
              onDiagnostic: (msg) => messages.push(msg),
            });
            console.log("Parse output");
            console.log(output.tree.toFullString());
            const errors = messages.map((msg) => {
              const monacoMarker: monaco.editor.IMarkerData = {
                severity: MarkerSeverity.Error,
                message: msg.message,
                startLineNumber: msg.span.start.line,
                startColumn: msg.span.start.column,
                endLineNumber: msg.span.stop.line,
                endColumn: msg.span.stop.column,
              };
              return monacoMarker;
            });
            const textModel = editor.getModel()!;
            monaco.editor.setModelMarkers(textModel, "owner", errors);
          });
        }}
      />
    </div>
  );
}

export default App;
