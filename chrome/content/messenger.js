Components.utils.import("resource://twitterbird/maild.js");
Components.utils.import("resource://twitterbird/nntpd.js");
Components.utils.import("resource://twitterbird/head_server_setup.js");

// The basic daemon to use for testing nntpd.js implementations
var daemon = setupNNTPDaemon();

// This gets used to CREATE a server, so this needs to be done in a special create account screen
//var localserver = setupLocalServer(NNTP_PORT)

// Start up the server for connections
var handler = new NNTP_RFC977_handler(daemon);
var server  = new nsMailServer(handler);
server.start(NNTP_PORT);
