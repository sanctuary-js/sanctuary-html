//. # sanctuary-html
//.
//. TK.
//.
//. ## API

'use strict';

const select = require('css-select');
const serializer = require('dom-serializer');
const domelementtype = require('domelementtype');
const htmlparser = require('htmlparser2');
const R = require('ramda');
const S = require('sanctuary');
const $ = require('sanctuary-def');

const _ = R.__;

//    $Node :: Type
const $Node = $.NullaryType(
  'sanctuary-html/Node',
  x => x != null && x['_@@type'] === 'sanctuary-html/Node'
);

//    NodeType :: Type
const NodeType = $.EnumType([
  domelementtype.CDATA,     //<![CDATA[ ... ]]>
  domelementtype.Comment,   //<!-- ... -->
  domelementtype.Directive, //<? ... ?>
  domelementtype.Doctype,
  domelementtype.Script,    //<script> tags
  domelementtype.Style,     //<style> tags
  domelementtype.Tag,       //Any tag
  domelementtype.Text,      //Text
]);

const def = $.create(true, $.env.concat([S.EitherType, $Node]));

//    notImplemented :: -> Error
const notImplemented = () => new Error('Not implemented');

//  Node :: HtmlParserNode -> Node
const Node =
def('Node',
    {},
    [$.Any, $Node],
    _node => ({
      '_@@type': 'sanctuary-html/Node',
      toString: () => 'Node(' + R.toString(_html(_node)) + ')',
      value: _node,
    }));

//# parse :: String -> Either Error [Node]
exports.parse =
def('parse',
    {},
    [$.String, S.EitherType($.Error, $.Array($Node))],
    s => {
      let result;
      const handler = new htmlparser.DomHandler((err, dom) => {
        result = err == null ? S.Right(R.map(Node, dom)) : S.Left(err)
      });
      const parser = new htmlparser.Parser(handler);
      parser.write(s);
      parser.done();
      return result;
    });

//    _html :: HtmlParserNode -> String
const _html = _node => serializer(_node, {});

//# html :: Node -> String
const html = exports.html =
def('html',
    {},
    [$Node, $.String],
    node => _html(node.value));

//    _text :: HtmlParserNode -> String
const _text = function _text(_node) {
  //  TODO: Handle all possible NodeType values.
  switch (_node.type) {
    case 'text':
      return _node.data;
    case 'tag':
      return R.join('', R.map(_text, _node.children));
    default:
      throw new TypeError('Unexpected type ‘' + _node.type + '’');
  }
};

//# text :: Node -> String
const text = exports.text =
def('text',
    {},
    [$Node, $.String],
    node => _text(node.value));

//# find :: String -> Node -> [Node]
exports.find =
def('find',
    {},
    [$.String, $Node, $.Array($Node)],
    (selector, node) => R.map(Node, select(selector, node.value, {})));

// { '_@@type': 'sanctuary-html/Node',
//  toString: [Function],
//  value:
//   { type: 'tag',
//     name: 'html',
//     attribs: {},
//     children: [ [Object], [Object], [Object], [Object], [Object] ],
//     next:
//      { data: '\n',
//        type: 'text',
//        next: null,
//        prev: [Circular],
//        parent: null },
//     prev: null,
//     parent: null } }
// { '_@@type': 'sanctuary-html/Node',
//  toString: [Function],
//  value:
//   { data: '\n',
//     type: 'text',
//     next: null,
//     prev:
//      { type: 'tag',
//        name: 'html',
//        attribs: {},
//        children: [Object],
//        next: [Circular],
//        prev: null,
//        parent: null },
//     parent: null } }
