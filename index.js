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

  //  $Node :: Type
  var $Node = $.NullaryType(
    'sanctuary-html/Node',
    x => S.type(x) === 'sanctuary-html/Node'
    // R.T  // TODO: Write suitable predicate.
  );

  //  $Element :: Type
  var $Element = $.NullaryType(
    'sanctuary-html/Element',
    R.T  // TODO: Write suitable predicate.
  );

  var def = $.create(true, $.env.concat([S.EitherType, $Node]));

  //  notImplemented :: -> Error
  var notImplemented = function() {
    return new Error('Not implemented');
  };

  // Node :: HtmlParserNode -> Node
  const Node =
  def('Node',
      {},
      [$.Any, $Node],
      n => ({
        '@@type': 'sanctuary-html/Node',
        toString: R.always('Node(...)'),
        value: n,
      }));

  //# html :: Element -> String
  H.html =
  def('html',
      {},
      [$Node, $.String],
      notImplemented);

  //# parse :: String -> Either Error [Node]
  H.parse =
  def('parse',
      {},
      [$.String, S.EitherType($.Error, $.Array($Node))],
      s => {
        let _result;
        const handler = new htmlparser.DomHandler((err, dom) => {
          _result = err == null ? S.Right(R.map(Node, dom)) : S.Left(err)
        });
        const parser = new htmlparser.Parser(handler);
        parser.write(s);
        parser.done();
        return _result;
      });

  //# text :: Element -> String
  H.text =
  def('text',
      {},
      [$Node, $.String],
      notImplemented);

  return H;

}));
