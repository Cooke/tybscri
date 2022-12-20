import { useMemo, useRef, useState } from "react";
import {
  booleanDefinitionType,
  Environment,
  listDefinitionType,
  parseEnvironment,
} from "tybscri";
import { TybscriEditor } from "tybscri-react-editor";
import { TybscriEditorRef } from "tybscri-react-editor/lib/TybscriEditor";
import "./App.css";
import { demoEnvironmentJson } from "./demoEnvironmentJson";

const emptyEnvironment: Environment = {
  symbols: [],
  collectionDefinition: listDefinitionType,
  booleanDefinition: booleanDefinitionType,
};

function App() {
  const editorRef = useRef<TybscriEditorRef>(null);
  const [jsonEnvironment, setJsonEnvironment] = useState(
    () => localStorage.getItem("editor.env") ?? demoEnvironmentJson
  );
  const environment = useMemo(() => {
    try {
      const env = parseEnvironment(jsonEnvironment);
      return env;
    } catch (error) {
      console.warn("Failed to parse environment", error);
      return emptyEnvironment;
    }
  }, [jsonEnvironment]);

  return (
    <div
      className="App"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "stretch",
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        padding: 8,
      }}
    >
      <h1>Tybscri Demo</h1>
      <label>Script</label>
      <TybscriEditor
        height="50vh"
        className="Editor"
        ref={editorRef}
        environment={environment}
        defaultValue={localStorage.getItem("editor.value") ?? ""}
        onChange={(value) => localStorage.setItem("editor.value", value ?? "")}
      />
      <label htmlFor="env" style={{ marginTop: 16 }}>
        Environment schema
      </label>
      <textarea
        id="env"
        style={{ flex: 1 }}
        rows={15}
        defaultValue={jsonEnvironment}
        onChange={(ev) => {
          const json = ev.currentTarget.value;
          localStorage.setItem("editor.env", json);
          setJsonEnvironment(json);
        }}
      ></textarea>
    </div>
  );
}

export default App;
