import * as vscode from "vscode";
import {
  registerAutoTransliteration,
  registerAutoTransliterationStatusBar,
  toggleAutoTransliteration,
  transliterateCommand,
} from "./editor";

export function activate(context: vscode.ExtensionContext) {
  const commandDisposable = vscode.commands.registerCommand(
    "thattachu.transliterate",
    transliterateCommand,
  );
  const toggleDisposable = vscode.commands.registerCommand(
    "thattachu.toggleAutoTransliteration",
    toggleAutoTransliteration,
  );

  context.subscriptions.push(commandDisposable, toggleDisposable);

  registerAutoTransliteration(context);
  registerAutoTransliterationStatusBar(context);
}

export function deactivate() {}
