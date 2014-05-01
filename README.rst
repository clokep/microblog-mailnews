MailNews extension for Mozilla Thunderbird or SeaMonkey? to support using microblogging services (Twitter, StatusNet, etc.) as a native account type (i.e. just like using an IMAP or POP account with their own folder hierarchy, etc.).

The goal is a full transition into the Thunderbird UI. NOT trying to fit a microblog into a "mail" account, but providing natural access to the facilities of a microblogging account. This includes timelines, replies, direct messages, user management (via an addressbook extension), etc.

Initial targets are Twitter and StatusNet? (which would include Identi.ca, see here__). Its possible other microblogging services could be added in the future (easily if they have a Twitter-Compatible API). See here__ for some others others__.

__ http://status.net/wiki/ListOfServers
__ http://en.wikipedia.org/wiki/Microblog#See_also
__ http://www.linkbuildr.com/micro-blogging-site-list-by-rank/

Brief history: The idea for this project has been around since I've used Twitter, as a long time Thunderbird use I did not feel the need to have yet another program running just for Twitter when it could fit into the concept of "mail".

This project was initially called "Twitterbird" (started on Sep 4, 2009 here on Google Code), but that can't be registered into the Twitter API since it uses "Twitter" in it. It was decided to rename Twitterbird and take advantage of this and referring to microblogging in general as opposed to Twitter. (Runner up for a name the second time was "microbird", but that might be used somewhere already).

Some similar projects of interest:

* MailNews Exchange Support: Blog <http://mesquilla.com/category/exchange-web-services-ews/>
* Webfora: Blog <http://quetzalcoatal.blogspot.com/search/label/accttype> / Source <http://hg.mozilla.org/users/Pidgeot18_gmail.com/webfora>
* `Buzzbird <http://getbuzzbird.com/>`_: Blog <http://getbuzzbird.com/bb/category/blog> / Source <http://github.com/mdesjardins/buzzbird>
* `TwitFactory <http://www.twitfactory.com/>`_ (Not open source :( )
* `WebMail <http://webmail.mozdev.org/>`_: Source <http://www.mozdev.org/source/browse/webmail/>

API Documentation:

* `Twitter API <http://apiwiki.twitter.com/Twitter-API-Documentation>`_
* `Twitter-compatible StatusNet API <http://status.net/wiki/Twitter-compatible_API>`_
* `OAuth for Open Source Applications discussion <http://groups.google.com/group/twitter-development-talk/browse_thread/thread/c18ade9d86c8b239>`_
* `MailNews Protocols on MDC <https://developer.mozilla.org/en/MailNews_Protocols>`_
* `MailNews fakeserver on MDC <https://developer.mozilla.org/en/MailNews_fakeserver>`_ -- no longer useful, was used initially as part of a compatibility layer between MailNews? POP3 and Twitter
* `Address Book Interfaces on MDC <https://developer.mozilla.org/En/Address_Book_Interfaces>`_
* `Database Views <https://developer.mozilla.org/en/DB_Views_%28message_lists%29>`_ -- could be used to customize the message list views 

Libraries:

* `TwitterHelper JavaScript library <http://sources.disruptive-innovations.com/twitterHelper/tags/latest/TwitterHelper.html>`_
* `OAuthorizer Extension <http://bitbucket.org/mixedpuppy/oauthorizer/overview>`_