const vscode = require('vscode');

class Chatbot {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.messages = [];
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (element) {
            return []; // if element is not null, return empty array as it's a leaf node
        } else {
            return this.messages; // if element is null, return root nodes
        }
    }

    sendMessage(message) {
        const treeItem = new vscode.TreeItem(message);
        this.messages.push(treeItem);
        this._onDidChangeTreeData.fire();
    }
}

module.exports = Chatbot;