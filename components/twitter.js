/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1999
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Seth Spitzer <sspitzer@netscape.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

function dump(aMessage) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
									 .getService(Components.interfaces.nsIConsoleService);
	consoleService.logStringMessage("Twitterbird: " + aMessage);
}

// From http://blog.sidstamm.com/2009/08/inheriting-xpcom-across-languages.html
// Given two instances, copy in all properties from "super"
// and create forwarding methods for all functions.
function inheritCurrentInterface(self, super) {
	for(let prop in super) {
		if(typeof self[prop] === 'undefined')
			if(typeof super[prop] === 'function') {
				(function(prop) {
					self[prop] = function() { 
						return super[prop].apply(super,arguments); 
					};
				})(prop);
			}
			else
				self[prop] = super[prop];
	}
}

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

var nsTwitterIncomingServer = {
	// Implement nsIMsgIncomingServer and inherits from mailnews/base/util/nsMsgIncomingServer
	//grab initial methods (nsIMsgIncomingServer)
	inheritCurrentInterface(this, Components.interfaces.nsIMsgIncomingServer);
}
nsTwitterIncomingServer.prototype = {
	name: "twitter",
	chromePackageName: "twitterbird",
	showPanel: function(server) {
		// don't show the panel for news, rss, or local accounts
		return (server.type != "nntp" && server.type != "rss" &&
				server.type != "none");
	},

	QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIMsgAccountManagerExtension]),
	classDescription: "Twitter Incoming Server",
	classID: Components.ID("{0454A9C6-CF19-11DE-907E-FEFD55D89593}"),
	contractID: "@mozilla.org/messenger/server;1?twitter",

	_xpcom_categories: [{category: "",
						 entry: ""}]
};

var nsTwitterFolder = {
	// Implements nsIMsgFolder and inherits from nsMsgDBFolder
}

var nsTwitterService = {
	// Usually have their own interface, but they also implement nsIMsgMessageService
}

var nsITwitterUrl = {
	// Implement nsIMsgMailNewsUrl, inherit from base/util/nsMsgMailNewsUrl, and implement their own protocol-specific interface
	// Possibly unnecessary
}

var nsITwitterProtocol = {
	// Implement nsIMsgProtocol, inherit from nsMsgProtocol, and implement their own protocol-specific interface
	// This would implement a twitter library
}

dump("Here");

function TwitterModule() {
}
TwitterModule.prototype = {
	// Inherit from nsIMsgIncomingServer
	//__proto__: Components.interfaces.nsIMsgIncomingServer.createInstance(Components.interfaces.nsIMsgIncomingServer).prototype,

	name: "twitter",
	chromePackageName: "twitterbird",
	showPanel: function(server) {
		// don't show the panel for news, rss, or local accounts
		return (server.type != "nntp" && server.type != "rss" &&
				server.type != "none");
	},

	QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIMsgAccountManagerExtension]),
	classDescription: "Twitter Account Manager Extension Service",
	classID: Components.ID("{C93E133E-C8DA-11DE-BD47-FED455D89593}"),
	contractID: "@mozilla.org/accountmanager/extension;1?name=twitter",

	_xpcom_categories: [{category: "mailnews-accountmanager-extensions",
						 entry: "twitter account manager extension"}]
};

function NSGetModule(compMgr, fileSpec) {
	return XPCOMUtils.generateModule([TwitterModule]);
}

dump("done");