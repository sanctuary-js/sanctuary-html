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
    f(require('htmlparser2'), require('ramda'), require('sanctuary'), require('sanctuary-def'));
  } else if (typeof define === 'function' && define.amd != null) {
    define(['htmlparser2', 'ramda', 'sanctuary', 'sanctuary-def'], f);
  }

}(function(htmlparser, R, S, $) {

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

  var def = $.create(true, $.env.concat([S.EitherType, Element, Node]));

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

  //# parse :: String -> Either Error [Node]
  H.parse =
  def('parse',
      {},
      [$.String, S.EitherType($.Error, $.Array(Node))],
      s => {
        let _result;
        parser = new htmlparser(new htmlparser.DomHandler((err, dom) =>
          _result = err == null ? S.Right(dom) : S.Left(err)
        }));
        parser.write(s);
        parser.done();
        return result;
      });

  //# text :: Element -> String
  H.text =
  def('text',
      {},
      [Node, $.String],
      notImplemented);

  return H;

}));
