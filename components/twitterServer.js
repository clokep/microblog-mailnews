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
	}*/
};

function NSGetModule(compMgr, fileSpec) {
	return XPCOMUtils.generateModule([twitterServer]);
}
