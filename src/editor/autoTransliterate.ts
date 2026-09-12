import * as vscode from "vscode";
import { transliterate } from "@piraisoodan/tanglish";

const AUTO_TRANSLITERATE_SETTING = "autoTransliterate";
const WORD_BOUNDARY = /[\s.,!?;:()\[\]{}"']/u;
const ROMANIZED_WORD_AT_END = /[A-Za-z]+(?:[-'][A-Za-z]+)*$/u;

export function registerAutoTransliteration(
  context: vscode.ExtensionContext,
): vscode.Disposable {
  const documentsBeingEdited = new Set<string>();

  const listener = vscode.workspace.onDidChangeTextDocument(async (event) => {
    if (!isAutoTransliterationEnabled() || event.contentChanges.length !== 1) {
      return;
    }

    const change = event.contentChanges[0];
    const documentKey = event.document.uri.toString();
    if (
      documentsBeingEdited.has(documentKey) ||
      change.rangeLength !== 0 ||
      !isWordBoundaryInsertion(change.text)
    ) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (editor?.document !== event.document) {
      return;
    }

    const wordRange = getCompletedWordRange(event.document, change.range.start);
    if (!wordRange) {
      return;
    }

    const input = event.document.getText(wordRange);
    const output = transliterate(input);
    if (input === output) {
      return;
    }

    documentsBeingEdited.add(documentKey);

    try {
      await editor.edit((editBuilder) =>
        editBuilder.replace(wordRange, output),
      );
    } finally {
      documentsBeingEdited.delete(documentKey);
    }
  });

  context.subscriptions.push(listener);

  return listener;
}

export async function toggleAutoTransliteration(): Promise<void> {
  const configuration = vscode.workspace.getConfiguration("thattachu");

  const enabled = !isAutoTransliterationEnabled();

  await configuration.update(
    AUTO_TRANSLITERATE_SETTING,
    enabled,
    vscode.ConfigurationTarget.Global,
  );

  void vscode.window.showInformationMessage(
    `Automatic transliteration ${enabled ? "enabled" : "disabled"}.`,
  );
}

export function registerAutoTransliterationStatusBar(
  context: vscode.ExtensionContext,
): vscode.Disposable {
  const statusBarItem = vscode.window.createStatusBarItem(
    "thattachu.autoTransliteration",
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = "thattachu.toggleAutoTransliteration";
  statusBarItem.accessibilityInformation = {
    label: "Thattachu typing mode",
  };

  const updateStatusBar = () => {
    const enabled = isAutoTransliterationEnabled();
    statusBarItem.text = `$(keyboard) ${enabled ? "Tamil" : "English"}`;
    statusBarItem.tooltip = enabled
      ? "Thattachu: Tamil typing is on. Click to switch to English."
      : "Thattachu: English typing is on. Click to switch to Tamil.";
    statusBarItem.accessibilityInformation = {
      label: `Thattachu typing mode: ${enabled ? "Tamil" : "English"}`,
    };
  };

  updateStatusBar();
  statusBarItem.show();

  const configurationListener = vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration("thattachu.autoTransliterate")) {
        updateStatusBar();
      }
    },
  );

  const disposable = vscode.Disposable.from(
    statusBarItem,
    configurationListener,
  );

  context.subscriptions.push(disposable);

  return disposable;
}

function isAutoTransliterationEnabled(): boolean {
  return vscode.workspace
    .getConfiguration("thattachu")
    .get<boolean>(AUTO_TRANSLITERATE_SETTING, false);
}

function isWordBoundaryInsertion(text: string): boolean {
  return text.length === 1 && WORD_BOUNDARY.test(text);
}

function getCompletedWordRange(
  document: vscode.TextDocument,
  end: vscode.Position,
): vscode.Range | undefined {
  const beforeInsertion = document.getText(
    new vscode.Range(new vscode.Position(end.line, 0), end),
  );

  const match = beforeInsertion.match(ROMANIZED_WORD_AT_END);

  if (!match) {
    return undefined;
  }

  return new vscode.Range(
    new vscode.Position(end.line, end.character - match[0].length),
    end,
  );
}
