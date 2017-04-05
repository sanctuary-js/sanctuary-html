
     /* ,__,   ,__, /\
    / / |  |   |  | \ \
   / /  |  |   |  |  \ \
  / /   |  '---'  |   \ \
  \ \   |  ,---,  |   / /
   \ \  |  |   |  |  / /  Composable and joyful
    \ \ |__|   |__| / /  HTML document traversal
     \/             */

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
const {create, env}     = require('sanctuary');
const $                 = require('sanctuary-def');


//  H :: Module
const H = module.exports;

//  is :: Type -> a -> Boolean
const is = $.test([]);

//  NodeType :: Type
const NodeType = H.NodeType = $.NullaryType(
  'sanctuary-html/Node',
  'TK',
  x => S.type(x) === 'sanctuary-html/Node'
);

//  ElementType :: Type
const ElementType = H.ElementType = $.NullaryType(
  'sanctuary-html/Element',
  'TK',
  x => is(NodeType, x) && domelementtype.isTag(x.value)
);

//  SelectorType :: Type
const SelectorType = H.SelectorType = $.NullaryType(
  'sanctuary-html/Selector',
  'TK',
  x => is($.String, x) && x !== '' && S.encase(select.compile, x).isJust
);

//  createOpts :: { checkTypes :: Boolean, env :: Array Type }
const createOpts = {
  checkTypes: true,
  env: env.concat([NodeType, ElementType]),
};

//  S :: Module
const S = create(createOpts), {Nothing, Just} = S;

//  def :: (String, StrMap (Array TypeClass), Array Type, Function) -> Function
const def = $.create(createOpts);

//  Node :: HtmlParserNode -> Node
function Node(_node) {
  if (!(this instanceof Node)) return new Node(_node);
  this.value = _node;
}

//  Node :: HtmlParserNode -> Node
H.Node = def('Node', {}, [$.Any, NodeType], Node);

//  Node.@@type :: String
Node['@@type'] = 'sanctuary-html/Node';

//  Node#toString :: Node ~> () -> String
Node.prototype.toString = function() {
  return `Node(${S.toString(_html(this.value))})`;
};

//  Node#fantasy-land/equals :: Node ~> Node -> Boolean
Node.prototype['fantasy-land/equals'] = function(other) {
  return String(this) === String(other);
};

//# parse :: String -> Array Node
//.
//. TK.
//.
//. ```javascript
//. > S.toString(H.parse('<ul><li>one</li><li>two</li></ul>'))
//. '[Node("<ul><li>one</li><li>two</li></ul>")]'
//. ```
H.parse =
def('parse',
    {},
    [$.String, $.Array(NodeType)],
    s => {
      let nodes;
      const handler = new htmlparser.DomHandler((err, dom) => {
        if (err != null) {
          throw err;
        }
        nodes = S.map(Node, dom);
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
//. > S.map(H.html, H.parse('<ul><li>one</li><li>two</li></ul>'))
//. ['<ul><li>one</li><li>two</li></ul>']
//. ```
H.html =
def('html',
    {},
    [NodeType, $.String],
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
      return S.joinWith('', S.map(_text, _node.children));
    case domelementtype.Text:
      return _node.data;
  }
}

//# text :: Node -> String
//.
//. TK.
//.
//. ```javascript
//. > S.map(H.text, H.parse('<ul><li>one</li><li>two</li></ul>'))
//. ['onetwo']
//.
//. > S.map(H.text, S.chain(H.children, H.parse('<ul><li>one</li><li>two</li></ul>')))
//. ['one', 'two']
//. ```
H.text =
def('text',
    {},
    [NodeType, $.String],
    node => _text(node.value));

//# find :: Selector -> Node -> Array Node
//.
//. TK.
//.
//. ```javascript
//. > S.toString(S.chain(H.find('li'), H.parse('<ul><li>one</li><li>two</li></ul>')))
//. '[Node("<li>one</li>"), Node("<li>two</li>")]'
//.
//. > S.toString(S.chain(H.find('dl'), H.parse('<ul><li>one</li><li>two</li></ul>')))
//. '[]'
//. ```
H.find =
def('find',
    {},
    [SelectorType, NodeType, $.Array(NodeType)],
    (selector, node) => S.map(Node, select(selector, node.value, {})));

//# attr :: String -> Node -> Maybe String
//.
//. TK.
//.
//. ```javascript
//. > S.toString(S.map(H.attr('class'), H.parse('<div class="selected"></div><div></div>')))
//. '[Just("selected"), Nothing]'
//. ```
H.attr =
def('attr',
    {},
    [$.String, NodeType, S.MaybeType($.String)],
    (key, node) => S.get(S.is(String), key, node.value.attribs));

//# is :: Selector -> Node -> Boolean
//.
//. TK.
//.
//. ```javascript
//. > S.map(H.is('.selected'), H.parse('<li class="selected">one</li><li>two</li><li>three</li>'))
//. [true, false, false]
//. ```
H.is =
def('is',
    {},
    [SelectorType, NodeType, $.Boolean],
    (selector, node) => select.is(node.value, selector, {}));

//# children :: Element -> Array Node
//.
//. TK.
//.
//. ```javascript
//. > S.toString(S.chain(H.children, H.parse('<ul><li>one</li><li>two</li></ul>')))
//. '[Node("<li>one</li>"), Node("<li>two</li>")]'
//. ```
H.children =
def('children',
    {},
    [ElementType, $.Array(NodeType)],
    el => S.map(Node, el.value.children));

//# parent :: Node -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > S.toString(S.map(H.parent, S.chain(H.children, H.parse('<ul><li>one</li><li>two</li></ul>'))))
//. '[Just(Node("<ul><li>one</li><li>two</li></ul>")), Just(Node("<ul><li>one</li><li>two</li></ul>"))]'
//.
//. > S.map(H.parent, H.parse('<ul></ul>'))
//. [Nothing]
//. ```
H.parent =
def('parent',
    {},
    [NodeType, S.MaybeType(ElementType)],
    S.compose(S.map(Node), S.gets(S.is(Object), ['value', 'parent'])));

//# prev :: Element -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > S.pipe([H.parse, S.chain(H.find('li')), S.last, S.chain(H.prev), S.map(H.text)], '<ul><li>one</li><li>two</li></ul>')
//. Just('one')
//.
//. > S.pipe([H.parse, S.chain(H.find('li')), S.head, S.chain(H.prev), S.map(H.text)], '<ul><li>one</li><li>two</li></ul>')
//. Nothing
//. ```
H.prev =
def('prev',
    {},
    [ElementType, S.MaybeType(ElementType)],
    el => {
      for (let _node = el.value.prev; _node != null; _node = _node.prev) {
        if (domelementtype.isTag(_node.value)) return Just(Node(_node));
      }
      return Nothing;
    });

//# next :: Element -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > S.pipe([H.parse, S.chain(H.find('li')), S.head, S.chain(H.next), S.map(H.text)], '<ul><li>one</li><li>two</li></ul>')
//. Just('two')
//.
//. > S.pipe([H.parse, S.chain(H.find('li')), S.last, S.chain(H.next), S.map(H.text)], '<ul><li>one</li><li>two</li></ul>')
//. Nothing
//. ```
H.next =
def('next',
    {},
    [ElementType, S.MaybeType(ElementType)],
    el => {
      for (let _node = el.value.next; _node != null; _node = _node.next) {
        if (domelementtype.isTag(_node.value)) return Just(Node(_node));
      }
      return Nothing;
    });
