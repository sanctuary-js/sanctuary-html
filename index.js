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

  var H = {};

  var _ = R.__;

  //  Node :: Type
  var Node = $.NullaryType(
    'sanctuary-html/Node',
    R.T  // TODO: Write suitable predicate.
  );

  //  Element :: Type
  var Element = $.NullaryType(
    'sanctuary-html/Element',
    R.T  // TODO: Write suitable predicate.
  );

  var def = $.create(true, $.env.concat([Node, Element]));

  //  notImplemented :: -> Error
  var notImplemented = function() {
    return new Error('Not implemented');
  };

  //# html :: Element -> String
  H.html =
  def('html',
      {},
      [Node, $.String],
      notImplemented);

  //# text :: Element -> String
  H.text =
  def('text',
      {},
      [Node, $.String],
      notImplemented);

  return H;

}));
