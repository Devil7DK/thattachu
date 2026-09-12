import { TextEditor, window } from "vscode";
import { transliterate } from "@piraisoodan/tanglish";

export async function transliterateCommand(editor: TextEditor) {
  editor = editor ?? window.activeTextEditor;

  if (!editor) {
    window.showErrorMessage("No active editor found for transliteration.");
    return;
  }

  const selection = editor.selection;

  if (!selection.isEmpty) {
    const text = editor.document.getText(selection);

    if (text.trim().length > 0) {
      await editor.edit((editBuilder) => {
        editBuilder.replace(selection, transliterate(text));
      });

      return;
    }
  }

  window.showErrorMessage("No text selected for transliteration.");
}
