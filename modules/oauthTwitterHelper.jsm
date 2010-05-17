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
 * The Original Code is PlanTwit.
 *
 * The Initial Developer of the Original Code is
 * Pages Jaunes.
 * Portions created by the Initial Developer are Copyright (C) 2008-2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *	 Daniel Glazman <daniel.glazman@disruptive-innovations.com>, Original author
 *	 Patrick Cloke, <DarkJedi613@Gmail.com>, Updated for use with OAuthorizer <http://bitbucket.org/mixedpuppy/oauthorizer>
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

var EXPORTED_SYMBOLS = ["OAuthTwitterHelper"];

if (typeof JSON == "undefined")
	Components.utils.import("resource://gre/modules/JSON.jsm");

/* CONSTRUCTOR */
function OAuthTwitterHelper(aServiceStr, mFormat) {
	this.mServiceName = aServiceStr;
	switch (aServiceStr) {
		case "twitter":
		this.mBaseURL = "http://api.twitter.com/1/";
			break;
		case "identi.ca":
			this.mBaseURL = "http://identi.ca/api/"; 
			break;
		default:
			throw("OAuthTwitterHelper: bad service string");
			break;
	}
	this.mFormat = mFormat;

	this.statuses._self = this;
	this.users._self = this;
	this.direct_messages._self = this;
	this.friendships._self = this;
	this.friends._self = this;
	this.followers._self = this;
	this.account._self = this;
	this.favorites._self = this;
	this.notifications._self = this;
	this.blocks._self = this;
	this.help._self = this;
}

/* PRIVATE */
OAuthTwitterHelper.prototype._localizedError =
function(aServiceName, aStringName) {
	var s = "";
	switch (aStringName) {
		case "resp304": s = "Not Modified: there was no new data to return."; break;
		case "resp400": s = "Bad Request: your request is invalid, did you exceed the rate limit?"; break;
		case "resp401": s = "Not Authorized: either you need to provide authentication credentials, or the credentials provided aren't valid."; break;
		case "resp403": s = "Forbidden: access denied to requested data."; break;
		case "resp404": s = "Not Found: either you're requesting an invalid URI or the resource in question doesn't exist (ex: no such user). "; break;
		case "resp500": s = "Internal Server Error"; break;
		case "resp502": s = "Bad Gateway: returned if the service is down or being upgraded."; break;
		case "resp503": s = "Service Unavailable: the servers are up, but are overloaded with requests.	Try again later."; break;

		case "MissingIdParameter": s = "Missing id parameter"; break;
		case "EmptyStatus":				s = "Cannot update with empty status"; break;
		case "EmptyDMRecipient":	 s = "Empty recipient for Direct Message"; break;
		case "EmptyDMText":				s = "Empty text for Direct Message"; break;
		case "MissingUserForFriendshipTest": s = "Cannot test friendship because one user parameter is missing"; break;
		case "WrongDevice":				s = "Trying to update unknown device"; break;
		case "NothingToUpdateProfileColors": s = "Nothing to update, all colors are empty"; break;
		default: break;
	}

	Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		.getService(Components.interfaces.nsIPromptService)
		.alert(null, aServiceName, s);
}

OAuthTwitterHelper.prototype._addParam =
function(aParams, aParam, aParamName) {
	var params = aParams;
	if (aParam)
		params.push([aParamName, aParam]);
	return params;
}

OAuthTwitterHelper.prototype._createOAuthMessage =
function(aMethod, aURL, aParams) {
	return message = {
		method: aMethod,
		action: aURL,
		parameters: aParams
		};
}

/* MEMBERS */
OAuthTwitterHelper.prototype.statuses			= { };
OAuthTwitterHelper.prototype.users				= { };
OAuthTwitterHelper.prototype.direct_messages	= { };
OAuthTwitterHelper.prototype.friendships		= { };
OAuthTwitterHelper.prototype.friends			= { };
OAuthTwitterHelper.prototype.followers			= { };
OAuthTwitterHelper.prototype.account			= { };
OAuthTwitterHelper.prototype.favorites			= { };
OAuthTwitterHelper.prototype.notifications		= { };
OAuthTwitterHelper.prototype.blocks				= { };
OAuthTwitterHelper.prototype.help				= { };

/* STATUSES REQUESTS */
OAuthTwitterHelper.prototype.statuses.friends_timeline =
function(aSince, aSinceId, aCount, aPage) {
	var feedURL = this._self.mBaseURL + "statuses/friends_timeline." + mFormat;

	var params = this._self._addParam([], aSince, "since");
	params = this._self._addParam(params, aSinceId, "since_id");
	params = this._self._addParam(params, aCount, "count");
	params = this._self._addParam(params, aPage, "page");
	
	return this._self._createOAuthMessage("GET", feedURL, params);
}

OAuthTwitterHelper.prototype.statuses.user_timeline =
function(aUserId, aSince, aSinceId, aCount, aPage) {
	var feedURL;
	if (aUserId)
		feedURL = this._self.mBaseURL + "statuses/user_timeline/" + aUserId + "." + mFormat;
	else
		feedURL = this._self.mBaseURL + "statuses/user_timeline." + mFormat;

	var params = this._self._addParam([], aSince, "since");
	params = this._self._addParam(params, aSinceId, "since_id");
	params = this._self._addParam(params, aCount, "count");
	params = this._self._addParam(params, aPage, "page");
	
	return this._self._createOAuthMessage("GET", feedURL, params);
}

OAuthTwitterHelper.prototype.statuses.friends =
function(aUserId, aPage) {
	var feedURL;
	if (aUserId)
		feedURL = this._self.mBaseURL + "statuses/friends/" + aUserId + "." + mFormat;
	else
		feedURL = this._self.mBaseURL + "statuses/friends." + mFormat;

	var params = this._self._addParam([], aPage, "page");

	return this._self._createOAuthMessage("GET", feedURL, params);
}

OAuthTwitterHelper.prototype.statuses.followers =
function(aUserId, aPage) {
	var feedURL;
	if (aUserId)
		feedURL = this._self.mBaseURL + "statuses/followers/" + aUserId + "." + mFormat;
	else
		feedURL = this._self.mBaseURL + "statuses/followers." + mFormat;

	var params = this._self._addParam([], aPage, "page");

	return this._self._createOAuthMessage("GET", feedURL, params);
}

OAuthTwitterHelper.prototype.statuses.show =
function(aId) {
	if (!aId) {
		this._self._localizedError(this._self.mServiceName, "MissingIdParameter");
		return;
	}

	var feedURL = this._self.mBaseURL + "statuses/show." + mFormat;

	var params = [["id", aId]];

	return this._self._createOAuthMessage("GET", feedURL, params);
}

OAuthTwitterHelper.prototype.statuses.replies =
function(aSince, aSinceId, aPage) {
	var feedURL = this._self.mBaseURL + "statuses/replies." + mFormat;

	var params = this._self._addParam([], aSince, "since");
	params = this._self._addParam(params, aSinceId, "since_id");
	params = this._self._addParam(params, aPage, "page");

	return this._self._createOAuthMessage("GET", feedURL, params);
}

OAuthTwitterHelper.prototype.statuses.destroy =
function(aId) {
	if (!aId) {
		this._self._localizedError(this._self.mServiceName, "MissingIdParameter");
		return;
	}

	var feedURL = this._self.mBaseURL + "statuses/destroy/" + aId + "." + mFormat;

	return this._self._createOAuthMessage("POST", feedURL, []);
}

OAuthTwitterHelper.prototype.statuses.public_timeline =
function() {
	var feedURL = this._self.mBaseURL + "statuses/public_timeline." + mFormat;

	this._self._createOAuthMessage("GET", feedURL, []);
}

OAuthTwitterHelper.prototype.statuses.update =
function(aText, aInReplyToStatusId, aSource) {
	if (!aText) {
		this._self._localizedError(this._self.mServiceName, "EmptyStatus");
		return;
	}

	var feedURL = this._self.mBaseURL + "statuses/update." + mFormat;
	
	var params = [["status", escape(aText)]];
	feedURL = this._self._addParam(params, aInReplyToStatusId, "in_reply_to_status_id");
	feedURL = this._self._addParam(params, aSource, "source");

	return this._self._createOAuthMessage("POST", feedURL, params);
}


/* USERS REQUESTS */
OAuthTwitterHelper.prototype.users.show =
function(aUserId, aEmail) {
	if (!aUserId && !aEmail) {
		this._self._localizedError(this._self.mServiceName, "MissingIdParameter");
		return;
	}

	var feedURL, params;
	if (!aEmail)
		feedURL = this._self.mBaseURL + "users/show/" + aUserId + "." + mFormat;
	else {
		feedURL = this._self.mBaseURL + "users/show." + mFormat;
		params = this._self._addParam([], aEmail, "email");
	}

	return this._self._createOAuthMessage("GET", feedURL, params);
}

/* DIRECT_MESSAGES REQUESTS */
OAuthTwitterHelper.prototype.direct_messages.inbox =
function(aSince, aSinceId, aPage) {
	var feedURL = this._self.mBaseURL + "direct_messages." + mFormat;

	var params = this._self._addParam([], aSince, "since");
	params = this._self._addParam(params, aSinceId, "since_id");
	params = this._self._addParam(params, aPage, "page");

	return this._self._createOAuthMessage("GET", feedURL, params);
}

OAuthTwitterHelper.prototype.direct_messages.sent =
function(aSince, aSinceId, aPage) {
	var feedURL = this._self.mBaseURL + "direct_messages/sent." + mFormat;

	var params = this._self._addParam([], aSince, "since");
	params = this._self._addParam(params, aSinceId, "since_id");
	params = this._self._addParam(params, aPage, "page");

	return this._self._createOAuthMessage("GET", feedURL, params);
}

OAuthTwitterHelper.prototype.direct_messages.new =
function(aUser, aText) {
	if (!aUser) {
		this._self._localizedError(this._self.mServiceName, "EmptyDMRecipient");
		return;
	}
	if (!aText) {
		this._self._localizedError(this._self.mServiceName, "EmptyDMText");
		return;
	}
	var feedURL = this._self.mBaseURL + "direct_messages/new." + mFormat;

	var params = this._self._addParam([], aUser, "user");
	params = this._self._addParam(params, aText, "text");

	return this._self._createOAuthMessage("POST", feedURL, params);
}

OAuthTwitterHelper.prototype.direct_messages.destroy =
function(aId) {
	if (!aId) {
		this._self._localizedError(this._self.mServiceName, "MissingIdParameter");
		return;
	}

	var feedURL = this._self.mBaseURL + "direct_messages/destroy/" + aId + "." + mFormat;

	return this._self._createOAuthMessage("POST", feedURL, []);
}

/* FRIENDSHIPS REQUESTS */
OAuthTwitterHelper.prototype.friendships.create =
function(aId, aFollow) {
	if (!aId) {
		this._self._localizedError(this._self.mServiceName, "MissingIdParameter");
		return;
	}

	var feedURL = this._self.mBaseURL + "friendships/create/" + aId + "." + mFormat;

	var params = this._self._addParam([], aFollow, "follow");

	return this._self._createOAuthMessage("POST", feedURL, params);
}

OAuthTwitterHelper.prototype.friendships.destroy =
function(aId) {
	if (!aId) {
		this._self._localizedError(this._self.mServiceName, "MissingIdParameter");
		return;
	}

	var feedURL = this._self.mBaseURL + "friendships/destroy/" + aId + "." + mFormat;

	return this._self._createOAuthMessage("POST", feedURL, []);
}

OAuthTwitterHelper.prototype.friendships.exists =
function(aUserA, aUserB) {
	if (!aUserA || !aUserB) {
		this._self._localizedError(this._self.mServiceName, "MissingUserForFriendshipTest");
		return;
	}

	var feedURL = this._self.mBaseURL + "friendships/exists." + mFormat;

	var params = this._self._addParam([], aUserA, "user_a");
	params = this._self._addParam(params, aUserB, "user_b");

	return this._self._createOAuthMessage("GET", feedURL, params);
}

/* FRIENDS REQUESTS */
OAuthTwitterHelper.prototype.friends.ids =
function(aId) {
	var feedURL;
	if (aId)
		feedURL = this._self.mBaseURL + "friends/ids/" + aId + "." + mFormat;
	else
		feedURL = this._self.mBaseURL + "friends/ids." + mFormat;

	return this._self._createOAuthMessage("GET", feedURL, []);
}

/* FOLLOWERS REQUESTS */
OAuthTwitterHelper.prototype.followers.ids =
function(aId) {
	var feedURL;
	if (aId)
		feedURL = this._self.mBaseURL + "followers/ids/" + aId + "." + mFormat;
	else
		feedURL = this._self.mBaseURL + "followers/ids." + mFormat;

	return this._self._createOAuthMessage("GET", feedURL, []);
}

/* ACCOUNT REQUESTS */
OAuthTwitterHelper.prototype.account.verify_credentials =
function() {
	var feedURL = this._self.mBaseURL + "account/verify_credentials." + mFormat;

	return this._self._createOAuthMessage("GET", feedURL, []);
}

OAuthTwitterHelper.prototype.account.end_session =
function() {
	var feedURL = this._self.mBaseURL + "account/end_session." + mFormat;

	return this._self._createOAuthMessage("POST", feedURL, []);
}

OAuthTwitterHelper.prototype.account.update_delivery_device =
function(aDevice) {
	if (aDevice != "sms" && aDevice != "im" && aDevice != "none") {
		this._self._localizedError(this._self.mServiceName, "WrongDevice");
		return;
	}
	var feedURL = this._self.mBaseURL + "account/update_delivery_device." + mFormat;

	var params = this._self._addParam([], aDevice, "device");

	return this._self._createOAuthMessage("POST", feedURL, params);
}

OAuthTwitterHelper.prototype.account.update_profile_colors =
function(aBackgroundColor, aTextColor, aLinkColor,
				 aSidebarFillColor, aSidebarBorderColor) {
	if (!aBackgroundColor && !aTextColor && !aLinkColor && !aSidebarFillColor && !aSidebarBorderColor) {
		this._self._localizedError(this._self.mServiceName, "NothingToUpdateProfileColors");
		return;
	}

	var feedURL = this._self.mBaseURL + "account/update_profile_colors." + mFormat;

	var params = this._self._addParam([], aBackgroundColor, "profile_background_color");
	params = this._self._addParam(params, aTextColor, "profile_text_color");
	params = this._self._addParam(params, aLinkColor, "profile_link_color");
	params = this._self._addParam(params, aSidebarFillColor, "profile_sidebar_fill_color");
	params = this._self._addParam(params, aSidebarBorderColor, "profile_sidebar_border_color");

	return this._self._createOAuthMessage("POST", feedURL, params);
}

OAuthTwitterHelper.prototype.account.rate_limit_status =
function() {
	var feedURL = this._self.mBaseURL + "account/rate_limit_status." + mFormat;

	return this._self._createOAuthMessage("GET", feedURL, []);
}

OAuthTwitterHelper.prototype.account.update_profile =
function(aName, aEmail, aUrl, aLocation, aDescription) {
	var feedURL = this._self.mBaseURL + "account/update_profile." + mFormat;

	var params = this._self._addParam([], aName, "name");
	params = this._self._addParam(params, aEmail, "email");
	params = this._self._addParam(params, aUrl, "url");
	params = this._self._addParam(params, aLocation, "location");
	params = this._self._addParam(params, aDescription, "description");

	return this._self._createOAuthMessage("POST", feedURL, params);
}

/* FAVORITES REQUESTS */
OAuthTwitterHelper.prototype.favorites.favorites =
function(aUserId, aPage) {
	var feedURL;
	if (aUserId)
		feedURL = this._self.mBaseURL + "favorites/" + aUserId + "." + mFormat;
	else
		feedURL = this._self.mBaseURL + "favorites." + mFormat;

	var params = this._self._addParam([], aPage, "page");

	return this._self._createOAuthMessage("GET", feedURL, params);
}

OAuthTwitterHelper.prototype.favorites.create =
function(aId) {
	if (!aId) {
		this._self._localizedError(this._self.mServiceName, "MissingIdParameter");
		return;
	}

	var feedURL = this._self.mBaseURL + "favorites/create/" + aId + "." + mFormat;

	return this._self._createOAuthMessage("POST", feedURL, []);
}

OAuthTwitterHelper.prototype.favorites.destroy =
function(aId) {
	if (!aId) {
		this._self._localizedError(this._self.mServiceName, "MissingIdParameter");
		return;
	}

	var feedURL = this._self.mBaseURL + "favorites/destroy/" + aId + "." + mFormat;

	return this._self._createOAuthMessage("POST", feedURL, []);
}

/* NOTIFICATIONS REQUEST */
OAuthTwitterHelper.prototype.notifications.follow =
function(aId) {
	if (!aId) {
		this._self._localizedError(this._self.mServiceName, "MissingIdParameter");
		return;
	}

	var feedURL = this._self.mBaseURL + "notifications/follow/" + aId + "." + mFormat;

	return this._self._createOAuthMessage("POST", feedURL, []);
}

OAuthTwitterHelper.prototype.notifications.leave =
function(aId) {
	if (!aId) {
		this._self._localizedError(this._self.mServiceName, "MissingIdParameter");
		return;
	}

	var feedURL = this._self.mBaseURL + "notifications/leave/" + aId + "." + mFormat;

	return this._self._createOAuthMessage("POST", feedURL, []);
}

/* BLOCKS REQUESTS */
OAuthTwitterHelper.prototype.blocks.create =
function(aId) {
	if (!aId) {
		this._self._localizedError(this._self.mServiceName, "MissingIdParameter");
		return;
	}

	var feedURL = this._self.mBaseURL + "blocks/create/" + aId + "." + mFormat;

	return this._self._createOAuthMessage("POST", feedURL, []);
}

OAuthTwitterHelper.prototype.blocks.destroy =
function(aId) {
	if (!aId) {
		this._self._localizedError(this._self.mServiceName, "MissingIdParameter");
		return;
	}

	var feedURL = this._self.mBaseURL + "blocks/destroy/" + aId + "." + mFormat;

	return this._self._createOAuthMessage("POST", feedURL, []);
}

/* HELP REQUESTS */
OAuthTwitterHelper.prototype.help.test =
function() {
	var feedURL = this._self.mBaseURL + "help/test." + mFormat;

	return this._self._createOAuthMessage("GET", feedURL, []);
}

/* UTILITIES */
OAuthTwitterHelper.prototype.isMention =
function(aText) {
	var matches = aText.match( /(@\w*)/g );

	for (var i = 0; i < matches.length; i++)
		if (matches[i] == "@" + this.mAccount)
			return true;
	return false;		
}
