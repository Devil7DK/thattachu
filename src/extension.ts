import * as vscode from "vscode";
import { transliterateCommand } from "./editor";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "thattachu.transliterate",
    transliterateCommand,
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
