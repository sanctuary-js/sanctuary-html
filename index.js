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

//    elementTypes :: [String]
const elementTypes = [
  domelementtype.Script,    //<script> tags
  domelementtype.Style,     //<style> tags
  domelementtype.Tag,       //Any tag
];

//    NodeType :: Type
const NodeType = $.EnumType(R.concat(
  elementTypes,
  [domelementtype.CDATA,     //<![CDATA[ ... ]]>
   domelementtype.Comment,   //<!-- ... -->
   domelementtype.Directive, //<? ... ?>
   domelementtype.Doctype,
   domelementtype.Text,      //Text
  ]));

//    $Node :: Type
const $Node = $.NullaryType(
  'sanctuary-html/Node',
  x => x != null && x['_@@type'] === 'sanctuary-html/Node'
);

//    $Element :: type
const $Element = $.NullaryType(
  'sanctuary-html/Element',
  R.both($Node.test,
         S.compose($.EnumType(elementTypes).test, R.path(['value', 'type'])))
);


const def = $.create(true, $.env.concat([S.EitherType,
                                         S.MaybeType,
                                         $Element,
                                         $Node]));

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

//# parse :: String -> [Node]
exports.parse =
def('parse',
    {},
    [$.String, $.Array($Node)],
    s => {
      let nodes;
      const handler = new htmlparser.DomHandler((err, dom) => {
        if (err != null) {
          throw err;
        }
        nodes = R.map(Node, dom);
      });
      const parser = new htmlparser.Parser(handler);
      parser.write(s);
      parser.done();
      return nodes;
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

//# attr :: String -> Node -> Maybe String
exports.attr =
def('attr',
    {},
    [$.String, $Node, S.MaybeType($.String)],
    (key, node) => S.get(String, key, node.value.attribs));

// TODO: See if we can do nice selector validation
//# is :: String -> Node -> Boolean
exports.is =
def('is',
    {},
    [$.String, $Node, $.Boolean],
    (selector, node) => {
      return select.is(node.value, selector, {});
    });

// children :: Element -> [Node]
exports.children =
def('children',
    {},
    [$Element, $.Array($Node)],
    el => R.map(Node, el.value.children));

// parent :: Node -> Maybe Element
exports.parent =
def('parent',
    {},
    [$Node, S.MaybeType($Element)],
    S.compose(R.map(Node), S.gets(Object, ['value', 'parent'])));

// _prev :: HtmlParserNode -> Maybe Element
const _prev =
S.pipe([S.get(Object, 'prev'),
        R.chain(_node => $.EnumType(elementTypes).test(_node.type) ?
                           S.Just(Node(_node)) :
                           _prev(_node))]);

// prev :: Element -> Maybe Element
exports.prev =
def('prev',
    {},
    [$Element, S.MaybeType($Element)],
    S.compose(_prev, R.prop('value')));

// _next :: HtmlParserNode -> Maybe Element
const _next =
S.pipe([S.get(Object, 'next'),
        R.chain(_node => $.EnumType(elementTypes).test(_node.type) ?
                           S.Just(Node(_node)) :
                           _next(_node))]);

// next :: Element -> Maybe Element
exports.next =
def('next',
    {},
    [$Element, S.MaybeType($Element)],
    S.compose(_next, R.prop('value')));

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
