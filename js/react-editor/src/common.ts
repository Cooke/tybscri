import { editor } from "monaco-editor";
import { Environment } from "tybscri";

export function setEditorModelEnvironment(
  model: editor.ITextModel | null | undefined,
  environment?: Environment | null
) {
  if (!model) {
    return;
  }

  const anyModel = model as any;
  anyModel.tybscriEnvironment = environment;
}

export function getModelEnvironment(
  model: editor.ITextModel | null,
  environment?: Environment | null
): Environment | null | undefined {
  const anyModel = model as any;
  return anyModel?.tybscriEnvironment;
}
