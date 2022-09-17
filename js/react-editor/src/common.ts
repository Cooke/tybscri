import { editor } from "monaco-editor";
import { Scope } from "tybscri";

export function setEditorModelEnvironment(
  model: editor.ITextModel | null | undefined,
  environment?: Scope | null
) {
  if (!model) {
    return;
  }

  const anyModel = model as any;
  anyModel.tybscriEnvironment = environment;
}

export function getModelEnvironment(
  model: editor.ITextModel | null,
  environment?: Scope | null
): Scope | null | undefined {
  const anyModel = model as any;
  return anyModel?.tybscriEnvironment;
}
