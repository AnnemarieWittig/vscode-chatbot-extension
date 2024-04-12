const JSZip = require('jszip');
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function getCssWebUri (panel, context, filename) {
	let styles = panel.webview.asWebviewUri(vscode.Uri.file(
		path.join(context.extensionPath, 'src', 'styles', filename)
	)); 

	return styles;
}

function getSseWebUri (panel, context, filename) {
	let styles = panel.webview.asWebviewUri(vscode.Uri.file(
		path.join(context.extensionPath, 'src', 'libs', 'sse-wrapper', filename)
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
        const sseuri = getSseWebUri(panel, context, 'sse.js');

		const lightmode = getIconWebUri(panel, context, 'light-mode-toggle-icon.png');
		const darkmode = getIconWebUri(panel, context, 'dark-mode-toggle-icon.png');
		const send = getIconWebUri(panel, context, 'send-icon.png');
		const newchat = getIconWebUri(panel, context, 'chat-add-icon.png');
		const bot = getIconWebUri(panel, context, 'bot-icon.png');
		const user = getIconWebUri(panel, context, 'user-icon.png');
		const warning = getIconWebUri(panel, context, 'warning.png');

        const htmlPath = path.join(context.extensionPath, 'src', 'chatbot.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
		
		htmlContent = htmlContent.replace('{{colorsUri}}', chatstyles.toString());
		htmlContent = htmlContent.replace('{{chatUri}}', colorstyles.toString());
		htmlContent = htmlContent.replace('{{sseUri}}', sseuri.toString());
		htmlContent = htmlContent.replace('{{darkmodeimage}}', darkmode.toString());
		htmlContent = htmlContent.replace('{{lightmodeimage}}', lightmode.toString());
		htmlContent = htmlContent.replace('{{sendicon}}', send.toString());
		htmlContent = htmlContent.replace('{{newbutton}}', newchat.toString());
		htmlContent = htmlContent.replace('{{botimage}}', bot.toString());
		htmlContent = htmlContent.replace('{{userimage}}', user.toString());
		htmlContent = htmlContent.replace('{{warning}}', warning.toString());

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

		// File Upload Logic
        panel.webview.onDidReceiveMessage(
            message => {
                if (message.command === 'zipAndUpload') {
                    zipAndUploadFiles();
                }
            },
            undefined,
            context.subscriptions
        );

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

async function zipAndUploadFiles() {
    const zip = new JSZip();
	console.log(vscode.workspace.workspaceFolders)
    // const folderPath = vscode.workspace.workspaceFolders[0].uri.path ;
	// TODO change to specified folder path?
	const folderPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri : undefined;

    if (!folderPath) {
        console.log("No folder open.");
        return;
    }

    // Start the recursive zipping process
    await addFolderToZip(zip, folderPath, '');

    zip.generateAsync({ type: 'nodebuffer' })
        .then(function(content) {
            // Upload content to server
            uploadToServer(content);
        })
        .catch(err => console.error(err));
}

async function addFolderToZip(zip, folderUri, relativePath) {
    const entries = await vscode.workspace.fs.readDirectory(folderUri);
    for (const [name, type] of entries) {
        const filePath = vscode.Uri.joinPath(folderUri, name);
        if (type === vscode.FileType.File && name.endsWith('.java')) {
            console.log(`Adding file: ${filePath}`);
            const fileContent = await vscode.workspace.fs.readFile(filePath);
            const zipEntryName = createZipEntryName(relativePath, name);
            zip.file(zipEntryName, fileContent);
        } else if (type === vscode.FileType.Directory) {
            await addFolderToZip(zip, filePath, relativePath + name + '/');
        }
    }
}

function createZipEntryName(relativePath, fileName) {
    return relativePath.replace(/\//g, '_') + fileName;
}

async function uploadToServer(content) {
    let apiKey = getConfigValue('API Key');
	console.log(apiKey)
    const serverUrl = getConfigValue('Upload Endpoint'); // 

    // Create a FormData object and append the file
    let formData = new FormData();
    formData.append('file', new Blob([content], {type: 'application/zip'}), 'upload.zip');

    fetch(serverUrl, {
        method: 'POST',
        body: formData, // Use the FormData object as the request body
        headers: {
            // Omit 'Content-Type' header, the browser will set it with the correct boundary.
            'Authorization': `Bearer ${apiKey}`
        }
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error uploading file: ', error));
}


function getConfigValue(key) {
    const config = vscode.workspace.getConfiguration('chatbotExtension');
    const apiKey = config.get(key);
    return apiKey;
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
