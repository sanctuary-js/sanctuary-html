//. # sanctuary-html
//.
//. TK.
//.
//. ## API

'use strict';

const select            = require('css-select');
const serializer        = require('dom-serializer');
const domelementtype    = require('domelementtype');
const htmlparser        = require('htmlparser2');
const R                 = require('ramda');
const S                 = require('sanctuary');
const $                 = require('sanctuary-def');

const $Maybe            = S.MaybeType;
const Just              = S.Just;
const Nothing           = S.Nothing;  // eslint-disable-line no-unused-vars


//  H :: Module
const H = module.exports;

//  elementTypes :: Array String
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
  S.compose(R.equals('sanctuary-html/Node'), S.type)
);

//  $Element :: Type
const $Element = $.NullaryType(
  'sanctuary-html/Element',
  R.both($Node.test,
         S.compose(ElementType.test, R.path(['value', 'type'])))
);

//  Direction :: Type
const Direction = $.EnumType(['prev', 'next']);

//  def :: (String, StrMap (Array TypeClass), Array Type, Function) -> Function
const def = $.create(true, $.env);

//  Node :: HtmlParserNode -> Node
const Node =
def('Node',
    {},
    [$.Any, $Node],
    _node => ({
      '@@type': 'sanctuary-html/Node',
      equals: _other => $Node.test(_other) && String(_other) === String(_node),
      toString: () => `Node(${R.toString(_html(_node))})`,
      value: _node,
    }));

//# parse :: String -> Array Node
//.
//. TK.
//.
//. ```javascript
//. > R.toString(H.parse('<ul><li>one</li><li>two</li></ul>'))
//. '[Node("<ul><li>one</li><li>two</li></ul>")]'
//. ```
H.parse =
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
//. > R.map(H.html, H.parse('<ul><li>one</li><li>two</li></ul>'))
//. ['<ul><li>one</li><li>two</li></ul>']
//. ```
H.html =
def('html',
    {},
    [$Node, $.String],
    node => _html(node.value));

//  _text :: HtmlParserNode -> String
function _text(_node) {
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
}

//# text :: Node -> String
//.
//. TK.
//.
//. ```javascript
//. > R.map(H.text, H.parse('<ul><li>one</li><li>two</li></ul>'))
//. ['onetwo']
//.
//. > R.map(H.text, R.chain(H.children, H.parse('<ul><li>one</li><li>two</li></ul>')))
//. ['one', 'two']
//. ```
H.text =
def('text',
    {},
    [$Node, $.String],
    node => _text(node.value));

//# find :: String -> Node -> Array Node
//.
//. TK.
//.
//. ```javascript
//. > R.toString(R.chain(H.find('li'), H.parse('<ul><li>one</li><li>two</li></ul>')))
//. '[Node("<li>one</li>"), Node("<li>two</li>")]'
//.
//. > R.toString(R.chain(H.find('dl'), H.parse('<ul><li>one</li><li>two</li></ul>')))
//. '[]'
//. ```
H.find =
def('find',
    {},
    [$.String, $Node, $.Array($Node)],
    (selector, node) => R.map(Node, select(selector, node.value, {})));

//# attr :: String -> Node -> Maybe String
//.
//. TK.
//.
//. ```javascript
//. > R.toString(R.map(H.attr('class'), H.parse('<div class="selected"></div><div></div>')))
//. '[Just("selected"), Nothing()]'
//. ```
H.attr =
def('attr',
    {},
    [$.String, $Node, $Maybe($.String)],
    (key, node) => S.get(String, key, node.value.attribs));

//  TODO: See if we can do nice selector validation
//# is :: String -> Node -> Boolean
//.
//. TK.
//.
//. ```javascript
//. > R.map(H.is('.selected'), H.parse('<li class="selected">one</li><li>two</li><li>three</li>'))
//. [true, false, false]
//. ```
H.is =
def('is',
    {},
    [$.String, $Node, $.Boolean],
    (selector, node) => select.is(node.value, selector, {}));

//# children :: Element -> Array Node
//.
//. TK.
//.
//. ```javascript
//. > R.toString(R.chain(H.children, H.parse('<ul><li>one</li><li>two</li></ul>')))
//. '[Node("<li>one</li>"), Node("<li>two</li>")]'
//. ```
H.children =
def('children',
    {},
    [$Element, $.Array($Node)],
    el => R.map(Node, el.value.children));

//# parent :: Node -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > R.toString(R.map(H.parent, R.chain(H.children, H.parse('<ul><li>one</li><li>two</li></ul>'))))
//. '[Just(Node("<ul><li>one</li><li>two</li></ul>")), Just(Node("<ul><li>one</li><li>two</li></ul>"))]'
//.
//. > R.map(H.parent, H.parse('<ul></ul>'))
//. [Nothing()]
//. ```
H.parent =
def('parent',
    {},
    [$Node, $Maybe($Element)],
    S.compose(R.map(Node), S.gets(Object, ['value', 'parent'])));

//  adjacent :: Direction -> HtmlParserNode -> Maybe Element
const adjacent =
def('adjacent',
    {},
    [Direction, $.Any, $Maybe($Element)],
    function adjacent(direction, _node) {
      return R.chain(_node => ElementType.test(_node.type) ?
                                Just(Node(_node)) :
                                adjacent(direction, _node),
                     S.get(Object, direction, _node));
    });

//# prev :: Element -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > S.pipe([H.parse, R.chain(H.find('li')), S.last, R.chain(H.prev), R.map(H.text)], '<ul><li>one</li><li>two</li></ul>')
//. Just('one')
//.
//. > S.pipe([H.parse, R.chain(H.find('li')), S.head, R.chain(H.prev), R.map(H.text)], '<ul><li>one</li><li>two</li></ul>')
//. Nothing()
//. ```
H.prev =
def('prev',
    {},
    [$Element, $Maybe($Element)],
    S.compose(adjacent('prev'), R.prop('value')));

//# next :: Element -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > S.pipe([H.parse, R.chain(H.find('li')), S.head, R.chain(H.next), R.map(H.text)], '<ul><li>one</li><li>two</li></ul>')
//. Just('two')
//.
//. > S.pipe([H.parse, R.chain(H.find('li')), S.last, R.chain(H.next), R.map(H.text)], '<ul><li>one</li><li>two</li></ul>')
//. Nothing()
//. ```
H.next =
def('next',
    {},
    [$Element, $Maybe($Element)],
    S.compose(adjacent('next'), R.prop('value')));
