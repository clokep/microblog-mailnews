var EXPORTED_SYMBOLS = ["setupNNTPDaemon", "NNTP_PORT", "setupLocalServer"];

// Import the servers
Components.utils.import("resource://twitterbird/maild.js");
Components.utils.import("resource://twitterbird/nntpd.js");

function dump(aMessage) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
								   .getService(Components.interfaces.nsIConsoleService);
	consoleService.logStringMessage("Twitterbird: " + aMessage);
}

// Generic mailnews resource scripts
//Components.utils.import("resource://test/mailDirService.js");

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cr = Components.results;
var CC = Components.Constructor;

const kSimpleNewsArticle =
	"From: John Doe <john.doe@example.com>\n"+
	"Date: Sat, 24 Mar 1990 10:59:24 -0500\n"+
	"Newsgroups: test.subscribe.simple\n"+
	"Subject: H2G2 -- What does it mean?\n"+
	"Message-ID: <TSS1@nntp.test>\n"+
	"\n"+
	"What does the acronym H2G2 stand for? I've seen it before...\n";

// The groups to set up on the fake server.
// It is an array of tuples, where the first element is the group name and the
// second element is whether or not we should subscribe to it.
var groups = [
	["twitter.DarkJedi613.timeline", true],
	["twitter.DarkJedi613.at", true],
	["twitter.DarkJedi613.direct", true],
	["twitter.DarkJedi613.favorites", true]
];

// Sets up the NNTP daemon object for use in fake server
function setupNNTPDaemon() {
	var daemon = new nntpDaemon();

	groups.forEach(function (element) {
		daemon.addGroup(element[0]);
	});

	var article = new newsArticle(kSimpleNewsArticle);
	daemon.addArticleToGroup(article, "twitter.DarkJedi613.at", 1);

	return daemon;
}

// Enable strict threading
var prefs = Cc["@mozilla.org/preferences-service;1"]
              .getService(Ci.nsIPrefBranch);
prefs.setBoolPref("mail.strict_threading", true);


// Make sure we don't try to use a protected port. I like adding 1024 to the
// default port when doing so...
const NNTP_PORT = 1024+119;

var _server = null;

function subscribeServer(incomingServer) {
	// Subscribe to newsgroups
	incomingServer.QueryInterface(Ci.nsINntpIncomingServer);
	groups.forEach(function (element) {
		if (element[1])
			incomingServer.subscribeToNewsgroup(element[0]);
	});
	// Only allow one connection
	incomingServer.maximumConnectionsNumber = 1;
}

// Sets up the client-side portion of fakeserver
function setupLocalServer(port) {
	if (_server != null)
		return _server;
	var acctmgr = Cc["@mozilla.org/messenger/account-manager;1"]
					.getService(Ci.nsIMsgAccountManager);

	var server = acctmgr.createIncomingServer("DarkJedi613", "localhost", "nntp"); // Username cannot be null
	server.port = port;
	server.valid = false;

	var account = acctmgr.createAccount();
	account.incomingServer = server;
	server.valid = true;

	subscribeServer(server);

	_server = server;

	return server;
}
