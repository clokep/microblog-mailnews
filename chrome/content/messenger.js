/* ***** BEGIN LICENSE BLOCK *****
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
 * The Original Code is the fakeserver.
 *
 * The Initial Developer of the Original Code is Twitterbird.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *	 Patrick Cloke
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
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

Components.utils.import("resource://twitterbird/maild.js");
Components.utils.import("resource://twitterbird/nntpd.js");
Components.utils.import("resource://twitterbird/head_server_setup.js");

// The basic daemon to use for nntpd.js implementations
var daemon = setupNNTPDaemon();

// This gets used to CREATE a server, so this needs to be done in a special create account screen
if (false) {
	var localserver = setupLocalServer(NNTP_PORT);
}

// Start up the server for connections
var handler = new NNTP_RFC977_handler(daemon);
var server  = new nsMailServer(handler);
server.start(NNTP_PORT);
//server.setDebugLevel(3); // fsDebugAll

Components.utils.import("resource://twitterbird/twitterHelper.jsm");
Components.utils.import("resource://twitterbird/twitter-glue.js");
Components.utils.import("resource://twitterbird/credientials.js"); // Contains user and pass variables

var twh = new TwitterHelper(user,
							pass,
							null,
							"twitter");
var format = "json"; // or xml
							
function cb(aTwitterHelper, aAnswer, aContext) {
	var i = 1;
	for each(var tweet in aAnswer) {
		var article = new newsArticle2(tweet, "twitter." + user + ".timeline");
		daemon.addArticleToGroup(article, "twitter." + user + ".timeline", i++);
	}
}

twh.statuses.user_timeline(cb,
						   cb,
						   null,
						   format,
						   null);