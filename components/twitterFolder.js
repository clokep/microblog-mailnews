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

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cr = Components.results;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/JSExtendedUtils.jsm");

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

function array2enum(arr) {
  return {
    _position: 0,
    _array: arr,
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISimpleEnumerator]),
    hasMoreElements: function () {
      return this._position < this._array.length;
    },
    getNext: function () {
      if (!this.hasMoreElements())
        throw Cr.NS_ERROR_FAILURE;
      return this._array[this._position++];
    }
  };
}

function wfFolder() {
  this.wrappedJSObject = this;
  JSExtendedUtils.makeCPPInherits(this,
    "@mozilla.org/messenger/jsmsgfolder;1");
}
wfFolder.prototype = {
  classDescription: "Web Forums folder",
  contractID: "@mozilla.org/rdf/resource-factory;1?name=webforum",
  classID: Components.ID("{207a7d55-ec83-4181-a8e7-c0b3128db70b}"),
  QueryInterface: JSExtendedUtils.generateQI([]),
  getIncomingServerType: function () {
    return "webforum";
  },
  getDatabase: function () {
    if (this._inner["#mDatabase"])
      return this._inner["#mDatabase"];
    let dbService = Cc["@mozilla.org/msgDatabase/msgDBService;1"]
                      .getService(Ci.nsIMsgDBService);
    let db;
    try {
      db = dbService.openFolderDB(this._inner, false);
    } catch (e) {
      db = dbService.createNewDB(this._inner);
    }
    this._inner["#mDatabase"] = db;
    return db;
  },
  getDBFolderInfoAndDB: function (folderInfo) {
    let db = this.getDatabase();
    folderInfo.value = db.dBFolderInfo;
    return db;
  },
  updateFolder: function (loading) {
    this._inner.NotifyFolderEvent(atoms["FolderLoaded"]);
  },
  get subFolders() {
    if (this._folders)
      return array2enum(this._folders);

    this._inner.QueryInterface(Ci.nsIMsgFolder);
    this._server = this._inner.server;
    this.__defineGetter__("server", function () { return this._server; });
    let serverDB = this._inner.server.wrappedJSObject._db;
    // Uninitialized -> no subfolders
    if (!serverDB.categories)
      return array2enum(this._folders = []);

    // First find our level
    let level;
    if (this._inner.isServer)
      level = serverDB.categories
    else if (this._inner.parent.isServer) {
      for each (let cat in serverDB.categories)
        if (cat.name == this._inner.name)
          level = cat.forums;
    } else {
      return array2enum(this._folders = []);
    }

    let URI = this._inner.URI + '/';
    let folders = [];
    let RDF = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
    let netUtils = Cc["@mozilla.org/network/io-service;1"]
                     .getService(Ci.nsINetUtil);
    for each(let sub in level) {
      if (!sub.subscribed && !sub.forums)
        continue;
      let folder = RDF.GetResource(URI + netUtils.escapeString(sub.name,
        Ci.nsINetUtil.ESCAPE_URL_PATH));
      folder.QueryInterface(Ci.nsIMsgFolder);
      folder.parent = this;
      folders.push(folder);
    }
    this._folders = folders;
    return array2enum(this._folders);
  },

  get noSelect() {
    return !!(this._inner.parent && this._inner.parent.isServer);
  }
};

function wfDatabase() {}
wfDatabase.prototype = {
  classDescription: "Web Forums database",
  contractID: "@mozilla.org/nsMsgDatabase/msgDB-webforum",
  classID: Components.ID("{7519e8a6-f5e4-4b05-8cae-f2f4ad0ebfee}"),
  _xpcom_factory: {
    createInstance: function (outer, iid) {
      if (outer)
        throw Cr.NS_ERROR_NO_AGGREGATION;
      return Cc["@mozilla.org/nsMsgDatabase/msgDB-default"].createInstance(iid);
    }
  }
};

function NSGetModule(compMgr, fileSpec) {
  return XPCOMUtils.generateModule([wfFolder, wfDatabase]);
}