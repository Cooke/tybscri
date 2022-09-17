import { loader } from "@monaco-editor/react";
import { TybscriCompletionItemProvider } from "./CompletionProvider";
import { TybscriTokensProvider } from "./TokensProvider";

let initialized = false;

export function init() {
  if (initialized) {
    return;
  }

  initialized = true;

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
}
