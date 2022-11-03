import { useRef } from "react";
import { Member, ObjectDefinitionType, Scope, stringType } from "tybscri";
import { TybscriEditor } from "tybscri-react-editor";
import { TybscriEditorRef } from "tybscri-react-editor/lib/TybscriEditor";
import { ExternalSymbol } from "tybscri/lib/symbols";
import "./App.css";

const npcDefinitionType = new ObjectDefinitionType("Npc", null, [], () => [
  new Member(true, "name", stringType),
]);

const environment = new Scope(null, [
  new ExternalSymbol("npc", npcDefinitionType.createType()),
]);

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
