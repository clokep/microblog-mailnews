EXPORTED_SYMBOLS = ["newsArticle2"];

/*
 * Convert a JSON object from twitterHelper to a newsArticle object
 */
function newsArticle2(jobj, ng) {
	this.headers = {"from": jobj.user.screen_name,
					"date": jobj.created_at,
					"newsgroups": ng,
					"subject": jobj.text,
					"message-id": "<" + jobj.id + ">"
					};
	this.body = jobj.text;
	this.messageID = jobj.id

	var preamble = "";
	for each(var header in this.headers) {
		preamble += header + "\n";
	}

	//this.fulltext = preamble + '\n' + this.body;
	this.fulltext = this.body;
}
 /*
{"in_reply_to_user_id":null,
"in_reply_to_screen_name":null,
"user":{
	"followers_count":47,
	"description":"Engineering, Programming, FOSS, SciFi, video games &amp; TV",
	"statuses_count":997,
	"utc_offset":-18000,
	"profile_sidebar_fill_color":"e0ff92",
	"notifications":null,
	"time_zone":"Eastern Time (US & Canada)",
	"created_at":"Thu Oct 23 01:44:17 +0000 2008",
	"friends_count":60,
	"profile_image_url":"http://a1.twimg.com/profile_images/183244378/twitter_normal.jpg",
	"profile_sidebar_border_color":"87bc44",
	"favourites_count":0,
	"url":null,
	"screen_name":"DarkJedi613",
	"name":"Patrick Cloke",
	"protected":false,
	"profile_text_color":"000000",
	"profile_background_image_url":"http://s.twimg.com/a/1252097501/images/themes/theme1/bg.gif",
	"following":null,
	"profile_link_color":"0000ff",
	"verified":false,
	"profile_background_tile":false,
	"location":"New York",
	"id":16917358,
	"profile_background_color":"9ae4e8"},
"created_at":"Mon Sep 07 15:47:31 +0000 2009",
"truncated":false,
"in_reply_to_status_id":null,
"text":"I had forgotten how terrible it is to do homework.",
"id":3820393567,
"favorited":false,
"source":"web"}
*/