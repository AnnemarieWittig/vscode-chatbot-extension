const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('chatbotextension.openView', function () {
        const panel = vscode.window.createWebviewPanel(
            'chatbot',
            'Chatbot',
            vscode.ViewColumn.One, // This will open the webview in the side panel
            {
                enableScripts: true, // Enable JavaScript in the webview
                retainContextWhenHidden: true // Attempt to retain state when hidden
            }
        );

		const sseUri = panel.webview.asWebviewUri(vscode.Uri.file(
			path.join(context.extensionPath, 'src', 'libs', 'sse.js')
		));

        const htmlPath = path.join(context.extensionPath, 'src', 'chatbot.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

		htmlContent = htmlContent.replace('{{sseUri}}', sseUri.toString());

        panel.webview.html = htmlContent;

        // Send settings to the webview initially
        sendConfigToWebview(panel);

        // Listen for when the webview becomes visible or changes state
        panel.onDidChangeViewState(e => {
            if (e.webviewPanel.visible) {
                // Re-send settings whenever the webview becomes visible again
                sendConfigToWebview(panel);
            }
        });

        context.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(function (e) {
                if (panel) {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
						const text = editor.document.getText(editor.selection);
						const fullFilePath = editor.document.fileName;
						const startLine = editor.selection.start.line;
						const endLine = editor.selection.end.line;
		
						// Calculate the relative path
						let relativeFilePath = fullFilePath;
						if (vscode.workspace.workspaceFolders) {
							//const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
							relativeFilePath = vscode.workspace.asRelativePath(fullFilePath, false);
						}
		
						panel.webview.postMessage({ 
							command: 'update',
							text: text, 
							filename: relativeFilePath, // Now sending relative path
							startLine: startLine, 
							endLine: endLine 
						});
                    }
                }
            })
        );
    }));
}

function sendConfigToWebview(panel) {
    const config = vscode.workspace.getConfiguration('chatbotextension');
    const endpoint = config.get('endpoint');
    const apiKey = config.get('apiKey');
    const model = config.get('model');
    const temperature = config.get('temperature');

    panel.webview.postMessage({ command: 'setConfig', endpoint, apiKey, model, temperature });
}


// const Chatbot = require('./chatbot');

// function activate(context) {
//     const chatbot = new Chatbot();
//     vscode.window.registerTreeDataProvider('chatbotextension.view', chatbot);

//     let disposable = vscode.commands.registerCommand('chatbotextension.sendMessage', async function () {
//         const message = await vscode.window.showInputBox({ prompt: 'Enter your message:' });
//         if (message) {
//             chatbot.sendMessage(`User: ${message}`);
//             chatbot.sendMessage('Chatbot: This is a default message.');
//         }
//     });

//     context.subscriptions.push(disposable);
// }
// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
