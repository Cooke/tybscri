import { useMemo, useRef, useState } from "react";
import {
  Environment,
  booleanDefinitionType,
  listDefinitionType,
  parseEnvironment,
} from "tybscri";
import { TybscriEditor, TybscriEditorRef } from "tybscri-react-editor";
import "./App.css";
import { demoEnvironmentJson } from "./demoEnvironmentJson";

const emptyEnvironment: Environment = {
  symbols: [],
  collectionDefinition: listDefinitionType,
  booleanDefinition: booleanDefinitionType,
};

const defaultScript = `player.onAttacked {
  it.attacker.say("I'm here to kill you...")
}

npcs.filter { true }
npcs.filter({ true })
`;

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
      <h1 style={{ margin: 0 }}>Tybscri Demo</h1>
      <p>Currently no runtime is included</p>
      <label>Script</label>
      <TybscriEditor
        height="40vh"
        className="Editor"
        ref={editorRef}
        environment={environment}
        defaultValue={localStorage.getItem("editor.value") ?? defaultScript}
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
