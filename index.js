//. # sanctuary-html
//.
//. TK.
//.
//. ## API

/* global define, self */

;(function(f) {

  'use strict';

  /* istanbul ignore else */
  if (typeof module !== 'undefined') {
    module.exports =
    f(require('ramda'), require('sanctuary'), require('sanctuary-def'));
  } else if (typeof define === 'function' && define.amd != null) {
    define(['ramda', 'sanctuary', 'sanctuary-def'], f);
  } else {
    self.sanctuaryHtml = f(self.R, self.sanctuary, self.sanctuaryDef);
  }

}(function(R, S, $) {

  'use strict';

  var _ = R.__;

  var H = {};

  return H;

}));
