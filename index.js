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


//  elementTypes :: [String]
const elementTypes = [
  domelementtype.Script,
  domelementtype.Style,
  domelementtype.Tag,
];

//  ElementType :: Type
const ElementType = $.EnumType(elementTypes);

//  $Node :: Type
const $Node = $.NullaryType(
  'sanctuary-html/Node',
  x => x != null && x['_@@type'] === 'sanctuary-html/Node'
);

//  $Element :: type
const $Element = $.NullaryType(
  'sanctuary-html/Element',
  R.both($Node.test,
         S.compose(ElementType.test, R.path(['value', 'type'])))
);

//  env :: [Type]
const env = $.env.concat([S.EitherType, S.MaybeType, $Element, $Node]);

//  def :: (String, StrMap [Type], [Type], Function) -> Function
const def = $.create(true, env);

//  Node :: HtmlParserNode -> Node
const Node =
def('Node',
    {},
    [$.Any, $Node],
    _node => ({'_@@type': 'sanctuary-html/Node',
               toString: () => 'Node(' + R.toString(_html(_node)) + ')',
               value: _node}));

//# parse :: String -> [Node]
//.
//. TK.
//.
//. ```javascript
//. > 'TK'
//. 'TK'
//. ```
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

//  _html :: HtmlParserNode -> String
const _html = _node => serializer(_node, {});

//# html :: Node -> String
//.
//. TK.
//.
//. ```javascript
//. > 'TK'
//. 'TK'
//. ```
exports.html =
def('html',
    {},
    [$Node, $.String],
    node => _html(node.value));

//  _text :: HtmlParserNode -> String
const _text = function _text(_node) {
  switch (_node.type) {
    case domelementtype.CDATA:      // <![CDATA[ ... ]]>
      return 'TK';
    case domelementtype.Comment:    // <!-- ... -->
      return 'TK';
    case domelementtype.Directive:  // <? ... ?>
      return 'TK';
    case domelementtype.Doctype:
      return 'TK';
    case domelementtype.Script:     // <script></script>
      return 'TK';
    case domelementtype.Style:      // <style></style>
      return 'TK';
    case domelementtype.Tag:
      return R.join('', R.map(_text, _node.children));
    case domelementtype.Text:
      return _node.data;
  }
};

//# text :: Node -> String
//.
//. TK.
//.
//. ```javascript
//. > 'TK'
//. 'TK'
//. ```
exports.text =
def('text',
    {},
    [$Node, $.String],
    node => _text(node.value));

//# find :: String -> Node -> [Node]
//.
//. TK.
//.
//. ```javascript
//. > 'TK'
//. 'TK'
//. ```
exports.find =
def('find',
    {},
    [$.String, $Node, $.Array($Node)],
    (selector, node) => R.map(Node, select(selector, node.value, {})));

//# attr :: String -> Node -> Maybe String
//.
//. TK.
//.
//. ```javascript
//. > 'TK'
//. 'TK'
//. ```
exports.attr =
def('attr',
    {},
    [$.String, $Node, S.MaybeType($.String)],
    (key, node) => S.get(String, key, node.value.attribs));

//  TODO: See if we can do nice selector validation
//# is :: String -> Node -> Boolean
//.
//. TK.
//.
//. ```javascript
//. > 'TK'
//. 'TK'
//. ```
exports.is =
def('is',
    {},
    [$.String, $Node, $.Boolean],
    (selector, node) => select.is(node.value, selector, {}));

//# children :: Element -> [Node]
//.
//. TK.
//.
//. ```javascript
//. > 'TK'
//. 'TK'
//. ```
exports.children =
def('children',
    {},
    [$Element, $.Array($Node)],
    el => R.map(Node, el.value.children));

//# parent :: Node -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > 'TK'
//. 'TK'
//. ```
exports.parent =
def('parent',
    {},
    [$Node, S.MaybeType($Element)],
    S.compose(R.map(Node), S.gets(Object, ['value', 'parent'])));

//  _prev :: HtmlParserNode -> Maybe Element
const _prev =
S.pipe([S.get(Object, 'prev'),
        R.chain(_node => ElementType.test(_node.type) ?
                           S.Just(Node(_node)) :
                           _prev(_node))]);

//# prev :: Element -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > 'TK'
//. 'TK'
//. ```
exports.prev =
def('prev',
    {},
    [$Element, S.MaybeType($Element)],
    S.compose(_prev, R.prop('value')));

//  _next :: HtmlParserNode -> Maybe Element
const _next =
S.pipe([S.get(Object, 'next'),
        R.chain(_node => $.EnumType(elementTypes).test(_node.type) ?
                           S.Just(Node(_node)) :
                           _next(_node))]);

//# next :: Element -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > 'TK'
//. 'TK'
//. ```
exports.next =
def('next',
    {},
    [$Element, S.MaybeType($Element)],
    S.compose(_next, R.prop('value')));
