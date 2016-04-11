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
const Nothing           = S.Nothing;  // jshint ignore:line


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

//  $Element :: Type
const $Element = $.NullaryType(
  'sanctuary-html/Element',
  R.both($Node.test,
         S.compose(ElementType.test, R.path(['value', 'type'])))
);

//  Direction :: Type
const Direction = $.EnumType(['prev', 'next']);

//  def :: (String, StrMap [Type], [Type], Function) -> Function
const def = $.create(true, $.env);

//  Node :: HtmlParserNode -> Node
const Node =
def('Node',
    {},
    [$.Any, $Node],
    _node => ({
      '_@@type': 'sanctuary-html/Node',
      equals: _other => $Node.test(_other) && String(_other) === String(_node),
      toString: () => 'Node(' + R.toString(_html(_node)) + ')',
      value: _node,
    }));

//# parse :: String -> [Node]
//.
//. TK.
//.
//. ```javascript
//. > R.toString(parse('<ul><li>one</li><li>two</li></ul>'))
//. '[Node("<ul><li>one</li><li>two</li></ul>")]'
//. ```
const parse =
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
//. > R.map(html, parse('<ul><li>one</li><li>two</li></ul>'))
//. ['<ul><li>one</li><li>two</li></ul>']
//. ```
const html =
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
//. > R.map(text, parse('<ul><li>one</li><li>two</li></ul>'))
//. ['onetwo']
//.
//. > R.map(text, R.chain(children, parse('<ul><li>one</li><li>two</li></ul>')))
//. ['one', 'two']
//. ```
const text =
def('text',
    {},
    [$Node, $.String],
    node => _text(node.value));

//# find :: String -> Node -> [Node]
//.
//. TK.
//.
//. ```javascript
//. > R.toString(R.chain(find('li'), parse('<ul><li>one</li><li>two</li></ul>')))
//. '[Node("<li>one</li>"), Node("<li>two</li>")]'
//.
//. > R.toString(R.chain(find('dl'), parse('<ul><li>one</li><li>two</li></ul>')))
//. '[]'
//. ```
const find =
def('find',
    {},
    [$.String, $Node, $.Array($Node)],
    (selector, node) => R.map(Node, select(selector, node.value, {})));

//# attr :: String -> Node -> Maybe String
//.
//. TK.
//.
//. ```javascript
//. > R.toString(R.map(attr('class'), parse('<div class="selected"></div><div></div>')))
//. '[Just("selected"), Nothing()]'
//. ```
const attr =
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
//. > R.map(is('.selected'), parse('<li class="selected">one</li><li>two</li><li>three</li>'))
//. [true, false, false]
//. ```
const is =
def('is',
    {},
    [$.String, $Node, $.Boolean],
    (selector, node) => select.is(node.value, selector, {}));

//# children :: Element -> [Node]
//.
//. TK.
//.
//. ```javascript
//. > R.toString(R.chain(children, parse('<ul><li>one</li><li>two</li></ul>')))
//. '[Node("<li>one</li>"), Node("<li>two</li>")]'
//. ```
const children =
def('children',
    {},
    [$Element, $.Array($Node)],
    el => R.map(Node, el.value.children));

//# parent :: Node -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > R.toString(R.map(parent, R.chain(children, parse('<ul><li>one</li><li>two</li></ul>'))))
//. '[Just(Node("<ul><li>one</li><li>two</li></ul>")), Just(Node("<ul><li>one</li><li>two</li></ul>"))]'
//.
//. > R.map(parent, parse('<ul></ul>'))
//. [Nothing()]
//. ```
const parent =
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
//. > S.pipe([parse, R.chain(find('li')), S.last, R.chain(prev), R.map(text)], '<ul><li>one</li><li>two</li></ul>')
//. Just('one')
//.
//. > S.pipe([parse, R.chain(find('li')), S.head, R.chain(prev), R.map(text)], '<ul><li>one</li><li>two</li></ul>')
//. Nothing()
//. ```
const prev =
def('prev',
    {},
    [$Element, $Maybe($Element)],
    S.compose(adjacent('prev'), R.prop('value')));

//# next :: Element -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > S.pipe([parse, R.chain(find('li')), S.head, R.chain(next), R.map(text)], '<ul><li>one</li><li>two</li></ul>')
//. Just('two')
//.
//. > S.pipe([parse, R.chain(find('li')), S.last, R.chain(next), R.map(text)], '<ul><li>one</li><li>two</li></ul>')
//. Nothing()
//. ```
const next =
def('next',
    {},
    [$Element, $Maybe($Element)],
    S.compose(adjacent('next'), R.prop('value')));


module.exports = {
  attr: attr,
  children: children,
  find: find,
  html: html,
  is: is,
  next: next,
  parent: parent,
  parse: parse,
  prev: prev,
  text: text,
};
