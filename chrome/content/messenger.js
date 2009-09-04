Components.utils.import("resource://twitterbird/maild.js");
Components.utils.import("resource://twitterbird/nntpd.js");
Components.utils.import("resource://twitterbird/head_server_setup.js");

// The basic daemon to use for testing nntpd.js implementations
var daemon = setupNNTPDaemon();

// Define these up here for checking with the transaction
var type = null;
var test = null;

var localserver = setupLocalServer(NNTP_PORT)

var handler = new NNTP_RFC977_handler(daemon);
var server  = new nsMailServer(handler);
server.start(NNTP_PORT);

alert("NNTP_PORT: " + NNTP_PORT);
