/* vim: sw=2 ts=2 sts=2 et filetype=javascript
 * ***** BEGIN LICENSE BLOCK *****
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


var EXPORTED_SYMBOLS = ["DatabaseUtils"];

Components.utils.import("resource://gre/modules/IOUtils.js");

let DatabaseUtils = {
  /**
   * Opens the JSON database.
   *
   * Databases must not use any property begining with "_".
   *
   * @param file  The nsIFile to be opened.
   */
  openDatabase: function db_openDatabase(file) {
    let str = IOUtils.loadFileToString(file);
    let db = {}
    try {
      db = JSON.parse(str);
    } catch (e) {} // Ignore error
    return db;
  }
};
