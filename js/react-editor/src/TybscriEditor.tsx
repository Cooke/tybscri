import { useEffect } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { MarkerSeverity } from "monaco-editor";
import { parseScript, printTree } from "tybscri";
import { init } from "./init";

export function TybscriEditor(props: {
  width?: string | number;
  height?: string | number;
}) {
  useEffect(() => {
    init();
  }, []);

  return (
    <Editor
      height={props.height}
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
  );
}
