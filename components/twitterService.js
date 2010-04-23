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

function wfService() {
  this.wrappedJSObject = this;
  this._prefs = Cc['@mozilla.org/preferences-service;1']
                  .getService(Ci.nsIPrefService)
                  .getBranch("extensions.twitterbird.");
}
wfService.prototype = {
  classDescription: "Twitterbird service",
  contractID: ["@mozilla.org/messenger/protocol/info;1?type=twitter"],
  classID: Components.ID("{A4793C2C-4E7C-11DF-9266-163CE0D72085}"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIMsgProtocolInfo]),

  // nsIMsgProtocolInfo implementation -- See https://developer.mozilla.org/en/nsIMsgProtocolInfo
  // Used by the account wizard and account manager
  get defaultLocalPath() { // The default path under which all server data for this account type will be stored.
    let pref = this._prefs.getComplexValue("rootDir", Ci.nsIRelativeFilePref); // Preference looks like [ProfD]Twitter
    return pref.file;
  },
  get serverIID() { return Ci.nsIMsgIncomingServer; }, // The IID of the server-specific interface, used during account creation. Read only.
  get requiresUsername() { return true; }, // True if the server requires a username to log on. Read only.
  get defaultDoBiff() { return true; }, // True if the biff should be enabled by default for the account type. Read only.
  getDefaultServerPort: function (secure) { return -1; },
  get canDelete() { return true; }, // True if an account of this type may be deleted. Read only.

  get canLoginAtStartup() { return true; }, // True if the account type can perform biff during startup. Read only.
  get canGetMessages() { return true; }, // True if "Get Messages" UI actions should be enabled for the account type. Read only.
  get canGetIncomingMessages() { return false; }, // True if Junk UI actions should be enabled for the account type. Read only.
  get showComposeMsgLink() { return false; }, // True if Compose UI actions should be enabled for the account type. Read only.
  get specialFoldersDeletionAllowed() { return false; } // True if the user can delete folders like Inbox, Trash, etc. Read only.
};

function NSGetModule(compMgr, fileSpec) {
  return XPCOMUtils.generateModule([wfService]);
}
XPCOMUtils.generateModule = function replaced_GM(componentsArray, postRegister,
                                                 preUnregister) {
  let classes = [];
  for each (let component in componentsArray) {
    classes.push({
      cid:          component.prototype.classID,
      className:    component.prototype.classDescription,
      contractID:   component.prototype.contractID,
      factory:      this._getFactory(component),
      categories:   component.prototype._xpcom_categories
    });
  }

  return { // nsIModule impl.
    getClassObject: function(compMgr, cid, iid) {
      // We only support nsIFactory queries, not nsIClassInfo
      if (!iid.equals(Ci.nsIFactory))
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;

      for each (let classDesc in classes) {
        if (classDesc.cid.equals(cid))
          return classDesc.factory;
      }

      throw Cr.NS_ERROR_FACTORY_NOT_REGISTERED;
    },

    registerSelf: function(compMgr, fileSpec, location, type) {
      var componentCount = 0;
      debug("*** registering " + fileSpec.leafName + ": [ ");
      compMgr.QueryInterface(Ci.nsIComponentRegistrar);

      for each (let classDesc in classes) {
        debug((componentCount++ ? ", " : "") + classDesc.className);
        let contracts = (classDesc.contractID instanceof Array) ?
          classDesc.contractID : [classDesc.contractID];
        for each (let contract in contracts)
          compMgr.registerFactoryLocation(classDesc.cid,
                                          classDesc.className,
                                          contract,
                                          fileSpec,
                                          location,
                                          type);
        let contract = contracts[0];
        if (classDesc.categories) {
          let catMan = XPCOMUtils.categoryManager;
          for each (let cat in classDesc.categories) {
            let defaultValue = (cat.service ? "service," : "") +
                               contract;
            catMan.addCategoryEntry(cat.category,
                                    cat.entry || classDesc.className,
                                    cat.value || defaultValue,
                                    true, true);
          }
        }
      }

      if (postRegister)
        postRegister(compMgr, fileSpec, componentsArray);
      debug(" ]\n");
    },

    unregisterSelf: function(compMgr, fileSpec, location) {
      var componentCount = 0;
      debug("*** unregistering " + fileSpec.leafName + ": [ ");
      compMgr.QueryInterface(Ci.nsIComponentRegistrar);
      if (preUnregister)
        preUnregister(compMgr, fileSpec, componentsArray);

      for each (let classDesc in classes) {
        debug((componentCount++ ? ", " : "") + classDesc.className);
        if (classDesc.categories) {
          let catMan = XPCOMUtils.categoryManager;
          for each (let cat in classDesc.categories) {
            catMan.deleteCategoryEntry(cat.category,
                                       cat.entry || classDesc.className,
                                       true);
          }
        }
        compMgr.unregisterFactoryLocation(classDesc.cid, fileSpec);
      }
      debug(" ]\n");
    },

    canUnload: function(compMgr) {
      return true;
    }
  };
}
