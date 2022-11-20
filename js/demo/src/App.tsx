import { useRef, useState } from "react";
import { Environment, listDefinitionType, parseEnvironment } from "tybscri";
import { TybscriEditor } from "tybscri-react-editor";
import { TybscriEditorRef } from "tybscri-react-editor/lib/TybscriEditor";
import "./App.css";

function App() {
  const editorRef = useRef<TybscriEditorRef>(null);
  const [environment, setEnvironment] = useState(() => getInitEnvironment());

  return (
    <div className="App">
      <h1>Tybscri Demo</h1>
      <button onClick={() => editorRef.current?.setValue("")}>Clear</button>
      <TybscriEditor
        height="40vh"
        className="Editor"
        ref={editorRef}
        environment={environment}
        defaultValue={localStorage.getItem("editor.value") ?? ""}
        onChange={(value) => localStorage.setItem("editor.value", value ?? "")}
      />
      <label>Custom environment (JSON)</label>
      <textarea
        style={{ width: "100%" }}
        rows={15}
        defaultValue={localStorage.getItem("editor.types") ?? ""}
        onChange={(ev) => {
          const envJson = ev.currentTarget.value;
          localStorage.setItem("editor.types", envJson);

          try {
            const env = parseEnvironment(envJson);
            setEnvironment(env);
          } catch (error) {
            console.warn("Failed to parse environment", error);
          }
        }}
      ></textarea>
    </div>
  );
}

export default App;
function getInitEnvironment() {
  const initEnvironmentJson = localStorage.getItem("editor.types") ?? "";
  let initEnvironment: Environment = {
    symbols: [],
    collectionDefinition: listDefinitionType,
  };

  try {
    initEnvironment = parseEnvironment(initEnvironmentJson);
  } catch (error) {}

  return initEnvironment;
}
