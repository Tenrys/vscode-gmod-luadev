'use strict';

// Imports /////////////////////////////////////////////////////////////////////

import * as path from "path";
import * as net from "net";
import * as vscode from "vscode";

// Functions ///////////////////////////////////////////////////////////////////

function send(realm: string, client?: string): void {

	// Parameter Defaults //

	if (client == null) client = "";

	// Common //

	const config = vscode.workspace.getConfiguration("gmod-luadev")
	const document = vscode.window.activeTextEditor.document;

	// Document Title //

	const document_title =
		config.get("hidescriptname", false)
			? "_"
			: path.basename(document.uri.fsPath);

	// Open Socket //

	const socket = new net.Socket();
	socket.connect(config.get("port", 27099));
	socket.write(
		realm + "\n" +
		document_title + "\n" +
		client + "\n" +
		document.getText()
	);
	socket.on("error", (ex) => {
		if (ex.name == "ECONNREFUSED")
			vscode.window.showErrorMessage(
				"Could not connect to LuaDev!");
		else
			vscode.window.showErrorMessage(ex.message);
	});
	socket.end();

}

function getPlayerList(): void {

	const config = vscode.workspace.getConfiguration("gmod-luadev")

	const socket = new net.Socket();
	socket.connect(config.get("port", 27099));
	socket.write("requestPlayers\n");
	socket.setEncoding("utf8");
	socket.on("data", function(data: string): void {

		const clients = data.split("\n");
		clients.sort();

		vscode.window.showQuickPick(
			clients,
			{
				placeHolder: "Select Client to send to"
			}
		).then(function(client: string): void {
			// Dialogue cancelled
			if (client == null) return;
			// Send to client
			send("client", client);
		});

	});

}

let nextUpdate = 0;
let updateAsap = false;
setInterval(() => {
	if (updateAsap && nextUpdate < Date.now()) {
		sendCodeUpdate();
	}
}, 0)
function sendCodeUpdate(e?) {

	if (!vscode.window.state.focused)
		return;

	const config = vscode.workspace.getConfiguration("gmod-luadev");

	if (nextUpdate > Date.now()) {
		updateAsap = true;
		return;
	}
	updateAsap = false;
	nextUpdate = Date.now() + 300;

	let document = vscode.window.activeTextEditor.document;
	if (e && e.document) {
		document = e.document;
	}
	let text = document.getText();

	if (config.get("chathideother", true)) {
		if (!document.languageId.match("g?lua")) {
			text = "In a " + document.languageId + " file.";
		}
	}

	if (config.get("chatheader", true)) {
		let fileName = document.fileName.replace(/^.*[\\\/]/gi, "")
		/*
		if (fileName.length > 40) {
			fileName = "..." + fileName.substr(-40);
		}
		*/

		let header = "[vscode";
		if (vscode.workspace.name !== undefined) {
			header = header + " (" + vscode.workspace.name + ")";
		}

		header = header + " - ";

		header = header + "file " + "\"" + fileName + "\"";
		header = header + ", ";
		header = header + document.lineCount + " line" + (document.lineCount != 1 ? "s" : "");
		header = header + (document.isDirty ? " (dirty)" : "");

		header = header + "]";

		text = header + "\n\n" + text + "\n\n" + header;
	}

	if (config.get("chattextchanged", false)) {
		const socket = new net.Socket();
		socket.connect(config.get("port", 27099));
		socket.write(
			"chatTextChanged" + "\n" +
			text
		);
		socket.end();
	}

}
function clearCode() {

	const config = vscode.workspace.getConfiguration("gmod-luadev");

	if (config.get("chattextchanged", false)) {
		const socket = new net.Socket();
		socket.connect(config.get("port", 27099));
		socket.write(
			"finishChat" + "\n"
		);
		socket.end();
	}
}

// Exports /////////////////////////////////////////////////////////////////////

export function activate(context: vscode.ExtensionContext): void {

	const command = vscode.commands.registerCommand;

	context.subscriptions.push(
		command("gmod-luadev.server", () => send("sv")),
		command("gmod-luadev.shared", () => send("sh")),
		command("gmod-luadev.clients", () => send("cl")),
		command("gmod-luadev.self", () => send("self")),
		command("gmod-luadev.client", getPlayerList)
	);

	vscode.workspace.onDidChangeTextDocument(sendCodeUpdate);
	vscode.window.onDidChangeActiveTextEditor(sendCodeUpdate);
	vscode.window.onDidChangeWindowState((e) => {
		if (e.focused) {
			sendCodeUpdate(e);
		} else {
			clearCode();
		}
	});

}

export function deactivate() {
	clearCode();
}
