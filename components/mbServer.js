/* ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2010 Joshua Cranmer
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * ***** END LICENSE BLOCK ***** */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cr = Components.results;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/JSExtendedUtils.jsm");

const kMaxProtocols = 2;

function mbServer() {
	this.wrappedJSObject = this;
	JSExtendedUtils.makeCPPInherits(this,
									"@mozilla.org/messenger/jsincomingserver;1");
	XPCOMUtils.defineLazyGetter(this, "_db",
		function (server) {
			Cu.import("resource://microblog-mailnews/database.jsm");
			let path = this._inner.localPath;
			path.append("timelines-db.json");
			return DatabaseUtils.openDatabase(path);
		});
}
mbServer.prototype = {
	classDescription: "microblog-mailnews incoming server",
	contractID: ["@mozilla.org/messenger/server;1?type=microblog"],
	classID: Components.ID("{F9F56914-4E7C-11DF-BA0C-483CE0D72085}"),
	QueryInterface: JSExtendedUtils.generateQI([]),

	/* Queued tasks to run on the next open protocol */
	_queuedTasks: [],
	_protocols: [],
	runTask: function (task) {
		if (this._protocols.length < kMaxProtocols) {
			let protocol = new mbProtocol(this);
			protocol.loadTask(task);
			this._protocols.push(protocol);
			return;
		}
		for (let i = 0; i < this._protocols.length; i++) {
			if (!this._protocols[i].isRunning) {
				this._protocols[i].loadTask(task);
				return;
			}
		}
		this._queuedTasks.push(task);
	},
	getNextTask: function (task) {
		if (this._queuedTasks.length > 0)
			return this._queuedTasks.shift();
		return null;
	},

	get localStoreType() { return "microblog"; },
	/*get serverURI() {
		return this.localStoreType + ":[" + this.hostName + "]";
	}*/
};

function NSGetModule(compMgr, fileSpec) {
	return XPCOMUtils.generateModule([mbServer]);
}
