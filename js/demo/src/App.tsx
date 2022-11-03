import { useRef } from "react";
import { Environment, parseEnvironment } from "tybscri";
import { TybscriEditor } from "tybscri-react-editor";
import { TybscriEditorRef } from "tybscri-react-editor/lib/TybscriEditor";
import "./App.css";

function App() {
  const editorRef = useRef<TybscriEditorRef>(null);

  const initEnvironmentJson = localStorage.getItem("editor.types") ?? "";
  let initEnvironment: Environment = { symbols: [] };
  try {
    initEnvironment = parseEnvironment(initEnvironmentJson);
  } catch (error) {}

  return (
    <div className="App">
      <h1>Tybscri Demo</h1>
      <button onClick={() => editorRef.current?.setValue("")}>Clear</button>
      <TybscriEditor
        height="40vh"
        className="Editor"
        ref={editorRef}
        defaultEnvironment={initEnvironment}
        defaultValue={localStorage.getItem("editor.value") ?? ""}
        onChange={(value) => localStorage.setItem("editor.value", value ?? "")}
      />
      <label>Custom environment (JSON)</label>
      <textarea
        style={{ width: "100%" }}
        rows={15}
        defaultValue={initEnvironmentJson}
        onChange={(ev) => {
          const envJson = ev.currentTarget.value;
          localStorage.setItem("editor.types", envJson);

          try {
            const env = parseEnvironment(envJson);
            editorRef.current?.setEnvironment(env);
          } catch (error) {
            console.warn("Failed to parse environment", error);
          }
        }}
      ></textarea>
    </div>
  );
}

export default App;
