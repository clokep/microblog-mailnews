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
const kMaxLoads = 4;

function twitterServer() {
	this.wrappedJSObject = this;
	JSExtendedUtils.makeCPPInherits(this,
									"@mozilla.org/messenger/jsincomingserver;1");
	XPCOMUtils.defineLazyGetter(this, "_db",
		function (server) {
			Cu.import("resource://twitterbird/database.jsm");
			let path = this._inner.localPath;
			path.append("timelines-db.json");
			return DatabaseUtils.openDatabase(path);
		});
}
twitterServer.prototype = {
	classDescription: "Twitterbird incoming server",
	contractID: ["@mozilla.org/messenger/server;1?type=twitter"],
	classID: Components.ID("{F9F56914-4E7C-11DF-BA0C-483CE0D72085}"),
	QueryInterface: JSExtendedUtils.generateQI([]),

	get localStoreType() { return "twitter"; },
	/*get serverURI() {
		return this.localStoreType + ":[" + this.hostName + "]";
	},*/

	/* Queued tasks to run on the next open protocol */
	_queuedTasks: [],
	_protocols: [],
	runTask: function (task) {
		if (this._protocols.length < kMaxProtocols) {
			let protocol = new wfProtocol(this);
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

	// Queued URLs; first kMaxLoads are the currently running
	_urls: [],
	// The current task
	_task: null,
	// Load the next URL; if all URLs are finished, finish the task
	onUrlLoaded: function (url) {
		if (this._urls.length > kMaxLoads)
			this._urls[kMaxLoads].runUrl();
		this._urls.shift();
		if (this._urls.length == 0)
			this.finishTask();
	},
	/**
	 * Queue the next URL to load.
	 * Any extra arguments will be passed to the callback method.
	 * The callback is called with this protocol as the this object.
	 */
	loadUrl: function (url, callback) {
		let closure = this;
		let task = new UrlRunner(url, this);
		let argcalls = [null];
		for (let i = 2; i < arguments.length; i++)
			argcalls.push(arguments[i]);
		task.onUrlLoad = function (dom) {
			argcalls[0] = dom;
			callback.apply(closure, argcalls);
		};
		this._urls.push(task);
		if (this._urls.length <= kMaxLoads)
			task.runUrl();
	},
	/// Run the task
	loadTask: function (task) {
		this._task = task;
		this._task.runTask(this);
	},
	/// Handle a completed task
	finishTask: function () {
		let task = this._server.getNextTask();
		this._task.onTaskCompleted(this);
		if (task)
			this.loadTask(task);
	}
};

// An object that represents a URL to be run
function UrlRunner(url, protocol) {
	this._url = url;
	this._protocol = protocol;
}
UrlRunner.prototype = {
	runUrl: function () {
		let real = this;
		asyncLoadDom(this._url, function (dom) {
			real.onUrlLoad(dom);
			real._protocol.onUrlLoaded(real._url);
		});
	},
	onUrlLoad: function (dom) {}
};

function NSGetModule(compMgr, fileSpec) {
	return XPCOMUtils.generateModule([twitterServer]);
}
