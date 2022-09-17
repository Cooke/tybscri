import { useRef } from "react";
import { TybscriEditor } from "tybscri-react-editor";
import { TybscriEditorRef } from "tybscri-react-editor/lib/TybscriEditor";
import "./App.css";
import { Scope, ObjectType, stringType } from "tybscri";
import { ExternalSymbol } from "tybscri/lib/symbols";

const npcType: ObjectType = {
  base: null,
  kind: "Object",
  name: "Npc",
  members: [
    {
      isConst: true,
      name: "name",
      type: stringType,
    },
  ],
};

const environment = new Scope(null, [new ExternalSymbol("npc", npcType)]);

function App() {
  const editorRef = useRef<TybscriEditorRef>(null);

  return (
    <div className="App">
      <h1>Tybscri Demo</h1>
      <button onClick={() => editorRef.current?.setValue("")}>Clear</button>
      <TybscriEditor
        height="30vh"
        className="Editor"
        ref={editorRef}
        defaultEnvironment={environment}
        defaultValue={localStorage.getItem("editor.value") ?? ""}
        onChange={(value) => localStorage.setItem("editor.value", value ?? "")}
      />
    </div>
  );
}

export default App;
