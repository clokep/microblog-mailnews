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

var EXPORTED_SYMBOLS = ["twitterProtocol"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cr = Components.results;

Components.utils.import("resource://gre/modules/IOUtils.js");
Components.utils.import("resource://twitterbird/database.jsm");
Components.utils.import("resource://oauthorizer/modules/oauthconsumer.js");
Components.utils.import("resource://twitterbird/oauthTwitterHelper.jsm");

const kMaxLoads = 4;

let atoms = {};
let atomService = Cc["@mozilla.org/atom-service;1"]
                    .getService(Ci.nsIAtomService);
function defineAtom(name) {
  atoms.__defineGetter__(name, function () {
      delete atoms[name];
      return atoms[name] = atomService.getAtom(name);
  });
}
defineAtom("FolderLoaded");

function twitterProtocol(server) {
	this.server = server;
}
twitterProtocol.prototype = {
	// Queued messages; first kMaxLoads are the currently running
	_messages: [],
	// The current task
	_task: null,
	// Load the next URL; if all URLs are finished, finish the task
	onMessageLoaded: function (message) {
		if (this._messages.length > kMaxLoads)
			this._messages[kMaxLoads].runUrl();
		this._messages.shift();
		if (this._messages.length == 0)
			this.finishTask();
	},
	/**
	 * Queue the next message to load.
	 * Any extra arguments will be passed to the callback method.
	 * The callback is called with this protocol as the this object.
	 */
	loadMessage: function (message, callback) {
		dump("Queuing message " + message + '\n');
		let closure = this;
		let task = new MessageRunner(message, this);
		let argcalls = [null];
		for (let i = 2; i < arguments.length; i++)
			argcalls.push(arguments[i]);
		task.onMessageLoad = function (dom) {
			argcalls[0] = dom;
			callback.apply(closure, argcalls);
		};
		this._messages.push(task);
		if (this._messages.length <= kMaxLoads)
			task.runMessage();
	},
	// Run the task
	loadTask: function (task) {
		this._task = task;
		this._task.runTask(this);
	},
	// Handle a completed task
	finishTask: function () {
		if (this._task) {
		  dump("Completed task " + this._task.constructor.name + '\n');
		  this._task.onTaskCompleted(this);
		}
		let task = this._server.getNextTask();
		this._task.onTaskCompleted(this);
		if (task)
			this.loadTask(task);
	}

	/**
	 * The current folder we are processing.
	 */
	_folder: null,
	_parseReturn: function (api_return) { // This should receive a Twitter API return
		let threads = document.querySelectorAll("ul.topiclist > li.row > dl");
		let lastSeen = true;
		for (let i = 0; i < threads.length; i++) {
			lastSeen = false;
			let thread = threads[i];
			// So the <dt><a> gives the topic and the title
			let title = thread.firstElementChild.firstElementChild;
			let replies = new Number(thread.firstElementChild
				.nextElementSibling.firstChild.data);
			/* If we've seen fewer replies, load the thread.
			 * Otherwise, since we've loaded the ones before it, stop loading.
			 */
			if (!(title.href in this._auxDB.threads)) {
				this._auxDB.threads[title.href] = {replies: -1};
			} else if (replies <= this._auxDB.threads[title.href].replies) {
				lastSeen = true;
				continue;
			}
			let amount = this._auxDB.threads[title.href].replies;
			let diff = replies - amount;
			this._auxDB.threads[title.href].replies += diff;
			this.loadMessage(title.href, this._loadThread, null, amount + 1, diff);
		}
		let nextpage = document.querySelector("fieldset.display-options > a");
		if (!lastSeen && nextPage) {
			this.loadMessage(nextpage.href, this._loadThreadList, msgwindow);
		}
	},
	_loadThread: function (document, firstMsgId, start, diff) {
		let database = this._folder.getDatabase();
		let posts = document.querySelectorAll("div.post");
		let subject = document.querySelector("h2 > a[href]").textContent;
		let next = document.querySelector("a.right");

		/* Skip checking this page if we need new messages. */
		if (start >= posts.length) {
			if (!firstMsgId) {
				firstMsgId = posts[0].id.substring(1) + "@" + document.documentURI;
			}
			this.loadMessage(next.href, this._loadThread, firstMsgId,
				start - posts.length, diff);
			return;
		}

		let hostname = this._folder.server.hostName;
		let conv = Cc['@mozilla.org/messenger/mimeconverter;1']
								 .getService(Ci.nsIMimeConverter);
		let charset = document.characterSet;
		for (let i = start; i < posts.length && i < diff; i++) {
			let postDiv = posts[i];
			let postID = Number(postDiv.id.substring(1));
			let authorBlock = postDiv.querySelector("p.author");
			let [uri, author, date] = this._parseTitleBlock(authorBlock);

			let msgHdr = database.CreateNewHdr(postID);
			// The | is to prevent accidental message delivery
			msgHdr.author = conv.encodeMimePartIIStr_UTF8(
				author + " <" + author + "@" + hostname + "|>", true, charset, 0, 72);
			msgHdr.subject = conv.encodeMimePartIIStr_UTF8(subject, false, charset,
				0, 72);
			msgHdr.date = date * 1000;
			msgHdr.messageId = postID + "@" + document.documentURI;
			msgHdr.Charset = charset;
			if (firstMsgId) {
				msgHdr.setReferences("<" + firstMsgId + ">");
				msgHdr.OrFlags(Ci.nsMsgMessageFlags.HasRe);
			} else {
				firstMsgId = msgHdr.messageId;
			}
			msgHdr.OrFlags(Ci.nsMsgMessageFlags.New);
			database.AddNewHdrToDB(msgHdr, true);
		}
		if (next && diff > posts.length) {
			this.loadUrl(next.href, this._loadThread, firstMsgId, 0,
				diff - (posts.length - start));
		}
	}
};
twitterProtocol.getNewMessages = function prot_getMessages(folder) {
  folder.server.wrappedJSObject.runTask(new NewMessageTask(folder));
}

let oauthInfo = {
	_provider = 'twitter', // Configurable via pref
	_key = "ogIRQvBCXFYgzqhO33l6Bw", // Mine from Twitter
	_secret = "llzULAvuEVJZg1OC5q2kc55LFoNXphvCqVRTWyWZl28", // Mine from Twitter
	_params = null, // Does this need to be in here? Its returned later
	_completionURI = "http://oauthcallback.local/access.xhtml", // Nice fake URL to keep OAuth happy
	_responseType = 'json', // Everything is based on json, could use something else (and rewrite a lot of code)
};

// An object that represents a message to be run
function MessageRunner(url, protocol) {
	this._url = url;
	this._protocol = protocol;
	this._oatwh = new OAuthTwitterHelper(oauthInfo._provider, oauthInfo._responseType); // Create a new OAuthTwitterHelper
}
MessageRunner.prototype = {
	runMessage: function () {
		let real = this;
		/*asyncLoadDom(this._url, function (dom) {
			real.onUrlLoad(dom);
			real._protocol.onMessageLoaded(real._url);
		});*/
		OAuthConsumer.authorize(oauthInfo.provider, oauthInfo.key, oauthInfo.secret, oauthInfo.completionURI, real._protocol.onOAuth, oauthInfo.params); // Authorize
	},
	onMessageLoad: function (dom) {}
};

let auxDBSchema = {
	_schemaVersion: 1.0,
	threads: {},
};

function NewMessageTask(folder) {
	this._folder = folder;
}
NewMessageTask.prototype = {
	runTask: function (protocol) {
		let folder = this._folder;
		dump("Getting new messages for folder " + folder._inner.prettyName + "\n");
		protocol._folder = folder;
		if (folder._dbNode.url === undefined)
			return;
		try {
			protocol._auxDB = DatabaseUtils.openDatabase(folder._auxDatabasePath);
			if (!("_schemaVersion" in protocol._auxDB))
				protocol._auxDB = auxDBSchema;
		} catch (e) {
			dump(e + '\n');
		}
		protocol.loadMessage(folder._dbNode.url, protocol._parseReturn);
	},
	onTaskCompleted: function (protocol) {
		DatabaseUtils.saveDatabase(protocol._auxDB, this._folder._auxDatabasePath);
		protocol._folder = null;
		protocol._auxDB = null;
		this._folder._inner.NotifyFolderEvent(atoms["FolderLoaded"]);
		let db = this._folder.getDatabase();
		db.Commit(Ci.nsMsgDBCommitType.kLargeCommit);
	}
};

