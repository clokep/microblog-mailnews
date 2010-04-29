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
 * The Original Code is JSExtended.
 *
 * The Initial Developer of the Original Code is
 *   Joshua Cranmer <Pidgeot18@gmail.com>
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
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

/**
 * This file contains helper methods for implementing new account types.
 */

var EXPORTED_SYMBOLS = ["JSExtendedUtils"];

const Ci = Components.interfaces;

let JSExtendedUtils = {
  /**
   * Makes the specified object a subclass of the given C++ class.
   *
   * @param aThis   The this pointer to the class to be made a subclass
   * @param aClass  The name of the class with which to subclass
   */
  makeCPPInherits: function makeCPPInherits(aThis, aClass) {
    const Cc = Components.classes;
    const classes = {
      nsMailboxServer: "@mozilla.org/messenger/jsmailboxserver;1",
      nsMsgIncomingServer: "@mozilla.org/messenger/jsincomingserver;1"
    };
  
    let contract = aClass in classes ? classes[aClass] : aClass;
  
    let inner = Cc[contract].createInstance();
    aThis._inner = inner;
    inner._inner = aThis;
  },

  /**
   * Generates a QueryInterface method, like XPCOMUtils's generateQI
   */
  generateQI: function generateQI(interfaces) {
    return makeQI([Ci[i].name for each (i in interfaces) if (Ci[i])]);
  }
};

function makeQI(interfaceNames) {
  return function JSExtendedUtils_QueryInterface(iid) {
    let dontCheckInner = typeof iid == "string";
    if (dontCheckInner) {
      if (!(iid in Components.interfacesByID))
        return false;
      iid = Components.interfacesByID[iid];
    }
    for each(let interfaceName in interfaceNames) {
      if (Ci[interfaceName].equals(iid))
        return this;
    }
    if (dontCheckInner)
      return false;
    return this._inner.QueryInterface(iid);
  };
}
