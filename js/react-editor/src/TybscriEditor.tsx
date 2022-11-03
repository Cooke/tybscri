import { forwardRef, Ref, useEffect, useImperativeHandle, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { MarkerSeverity } from "monaco-editor";
import { parseScript, printTree, Scope } from "tybscri";
import { init } from "./init";
import { setEditorModelEnvironment } from "./common";
import { Environment } from "tybscri";

export interface TybscriEditorProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  onChange?: (value: string | null | undefined) => void;
  defaultValue?: string;
  defaultEnvironment?: Environment;
}

export interface TybscriEditorRef {
  getValue(): string;
  setValue(value: string): void;
  setEnvironment(scope: Environment): void;
}

export const TybscriEditor = forwardRef(
  (props: TybscriEditorProps, ref: Ref<TybscriEditorRef>) => {
    useEffect(() => {
      init();
    }, []);

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
    const environmentRef = useRef(props.defaultEnvironment);

    useImperativeHandle(
      ref,
      () => ({
        getValue: () => editorRef.current?.getValue() ?? "",
        setValue: (value) => editorRef.current?.setValue(value),
        setEnvironment: (value) => {
          environmentRef.current = value;
          // Not verified that this works
          editorRef.current?.setValue(editorRef.current?.getValue() ?? "");
          setEditorModelEnvironment(editorRef.current?.getModel(), value);
        },
      }),
      []
    );

    return (
      <Editor
        height={props.height}
        defaultValue={props.defaultValue}
        language="tybscri"
        className={props.className}
        onChange={props.onChange}
        onMount={(editor, monaco) => {
          editorRef.current = editor;

          setEditorModelEnvironment(editor.getModel(), environmentRef.current);
          editor.onDidChangeModel((ev) => {
            setEditorModelEnvironment(
              editor.getModel(),
              environmentRef.current
            );
          });

          editor.onDidChangeModelContent((ev) => {
            const output = parseScript(editor.getValue(), {
              reportTimings: true,
              environment: environmentRef.current,
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
);
