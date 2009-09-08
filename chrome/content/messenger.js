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

Components.utils.import("resource://twitterbird/twitterHelper.jsm");
var twh = new TwitterHelper("Username",
							"password",
							null,
							"twitter");
var format = "json"; // or xml
							
function cb(aTwitterHelper, aAnswer, aContext) {
	dump(JSON.stringify(aAnswer));
}

twh.statuses.user_timeline(cb,
						   cb,
						   null,
						   format,
						   null);