import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { MarkerSeverity } from "monaco-editor";
import { DiagnosticMessage, parseScript, printTree } from "tybscri";
import {
  TybscriTokensProvider,
  TybscriCompletionItemProvider,
} from "tybscri-monaco-integration";
import "./App.css";

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
  m.languages.registerCompletionItemProvider(
    "tybscri",
    new TybscriCompletionItemProvider()
  );
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
            const output = parseScript(editor.getValue(), {
              reportTimings: true,
            });
            console.log(printTree(output.tree));
            console.log("Diagnostics", output.diagnosticMessages);
            const errors = output.diagnosticMessages.map((msg) => {
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
