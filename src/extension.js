const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function getCssWebUri (panel, context, filename) {
	let styles = panel.webview.asWebviewUri(vscode.Uri.file(
		path.join(context.extensionPath, 'src', 'styles', filename)
	)); 

	return styles;
}

function getIconWebUri (panel, context, filename) {
	let icon = panel.webview.asWebviewUri(vscode.Uri.file(
		path.join(context.extensionPath, 'src', 'icons', filename)
	)); 

	return icon;
}

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

		const chatstyles = getCssWebUri(panel, context, 'style-chat.css');
		const colorstyles = getCssWebUri(panel, context, 'style-colors.css');

		const lightmode = getIconWebUri(panel, context, 'light-mode-toggle-icon.png');
		const darkmode = getIconWebUri(panel, context, 'dark-mode-toggle-icon.png');
		const send = getIconWebUri(panel, context, 'send-icon.png');
		const newchat = getIconWebUri(panel, context, 'chat-add-icon.png');
		const bot = getIconWebUri(panel, context, 'bot-icon.png');
		const user = getIconWebUri(panel, context, 'user-icon.png');

        const htmlPath = path.join(context.extensionPath, 'src', 'chatbot.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
		
		htmlContent = htmlContent.replace('{{colorsUri}}', chatstyles.toString());
		htmlContent = htmlContent.replace('{{chatUri}}', colorstyles.toString());
		htmlContent = htmlContent.replace('{{darkmodeimage}}', darkmode.toString());
		htmlContent = htmlContent.replace('{{lightmodeimage}}', lightmode.toString());
		htmlContent = htmlContent.replace('{{sendicon}}', send.toString());
		htmlContent = htmlContent.replace('{{newbutton}}', newchat.toString());
		htmlContent = htmlContent.replace('{{botimage}}', bot.toString());
		htmlContent = htmlContent.replace('{{userimage}}', user.toString());

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
    const config = vscode.workspace.getConfiguration('chatbotExtension');
    const endpoint = config.get('endpoint');
    const apiKey = config.get('API Key');
    const model = config.get('model');
    const temperature = config.get('temperature');
    const enhancedRequest = config.get('enhancedRequest');

    panel.webview.postMessage({ command: 'setConfig', endpoint, apiKey, model, temperature, enhancedRequest});
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
