'use strict';

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

const select            = require ('css-select');
const serializer        = require ('dom-serializer');
const domelementtype    = require ('domelementtype');
const htmlparser        = require ('htmlparser2');
const {create}          = require ('sanctuary');
const $                 = require ('sanctuary-def');
const type              = require ('sanctuary-type-identifiers');


//  H :: Module
const H = module.exports;

//  NodeType :: Type
const NodeType = H.NodeType = $.NullaryType
  ('Node')
  ('TK')
  ([])
  (x => type (x) === 'sanctuary-html/Node');

//  ElementType :: Type
const ElementType = H.ElementType = $.NullaryType
  ('Element')
  ('TK')
  ([NodeType])
  (x => domelementtype.isTag (x.value));

//  SelectorType :: Type
const SelectorType = H.SelectorType = $.NullaryType
  ('Selector')
  ('TK')
  ([$.String])
  (x => x !== '' && S.isRight (S.encase (select.compile) (x)));

//  createOpts :: { checkTypes :: Boolean, env :: Array Type }
const createOpts = {
  checkTypes: true,
  env: $.env.concat ([NodeType]),
};

//  S :: Module
const S = create (createOpts), {Nothing, Just} = S;

const def = $.create (createOpts);

//  Node :: HtmlParserNode -> Node
function Node(_node) {
  if (!(this instanceof Node)) return new Node (_node);
  this.value = _node;
}

//  Node :: HtmlParserNode -> Node
H.Node = def ('Node') ({}) ([$.Any, NodeType]) (Node);

//  Node#@@type :: String
Node.prototype['@@type'] = 'sanctuary-html/Node';

//  Node#@@show :: Node ~> () -> String
Node.prototype['@@show'] = function() {
  return `Node (${S.show (_html (this.value))})`;
};

//  Node#fantasy-land/equals :: Node ~> Node -> Boolean
Node.prototype['fantasy-land/equals'] = function(other) {
  return S.show (this) === S.show (other);
};

//# parse :: String -> Array Node
//.
//. Parse an HTML string to produce an array of `Node` values. The algorithm is
//. very forgiving so this operation will succeed even when given invalid HTML.
//.
//. ```javascript
//. > S.show (H.parse ('<ul><li>foo</li><li>bar</li></ul>'))
//. '[Node ("<ul><li>foo</li><li>bar</li></ul>")]'
//.
//. > S.show (H.parse ('<li>foo</li><li>bar</li>'))
//. '[Node ("<li>foo</li>"), Node ("<li>bar</li>")]'
//.
//. > S.show (H.parse ('foo <b>bar</b> baz'))
//. '[Node ("foo "), Node ("<b>bar</b>"), Node (" baz")]'
//. ```
H.parse =
def ('parse')
    ({})
    ([$.String, $.Array (NodeType)])
    (s => {
       let nodes;
       const handler = new htmlparser.DomHandler ((err, dom) => {
         if (err != null) {
           throw err;
         }
         nodes = S.map (Node) (dom);
       });
       const parser = new htmlparser.Parser (handler);
       parser.write (s);
       parser.done ();
       return nodes;
     });

//  _html :: HtmlParserNode -> String
const _html = _node => serializer (_node, {});

//# html :: Node -> String
//.
//. Returns the HTML representation of the given `Node` value.
//.
//. ```javascript
//. > S.map (H.html) (H.parse ('<ul><li>foo</li><li>bar</li></ul>'))
//. ['<ul><li>foo</li><li>bar</li></ul>']
//.
//. > S.map (H.html) (H.parse ('<li>foo</li><li>bar</li>'))
//. ['<li>foo</li>', '<li>bar</li>']
//.
//. > S.map (H.html) (H.parse ('foo <b>bar</b> baz'))
//. ['foo ', '<b>bar</b>', ' baz']
//. ```
H.html =
def ('html')
    ({})
    ([NodeType, $.String])
    (node => _html (node.value));

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
      return S.joinWith ('') (S.map (_text) (_node.children));
    case domelementtype.Text:
      return _node.data;
  }
}

//# text :: Node -> String
//.
//. Returns the text content of the given `Node` value.
//.
//. ```javascript
//. > S.map (H.text) (H.parse ('<ul><li>foo</li><li>bar</li></ul>'))
//. ['foobar']
//.
//. > S.map (H.text) (S.chain (H.children) (H.parse ('<ul><li>foo</li><li>bar</li></ul>')))
//. ['foo', 'bar']
//. ```
H.text =
def ('text')
    ({})
    ([NodeType, $.String])
    (node => _text (node.value));

//# find :: Selector -> Node -> Array Node
//.
//. Returns the descendants of the given `Node` value which match the given
//. `Selector` value.
//.
//. ```javascript
//. > S.chain (H.find ('li')) (H.parse ('<ul><li>foo</li><li>bar</li></ul>'))
//. H.parse ('<li>foo</li><li>bar</li>')
//.
//. > S.chain (H.find ('ul')) (H.parse ('<ul><li>foo</li><li>bar</li></ul>'))
//. []
//. ```
H.find =
def ('find')
    ({})
    ([SelectorType, NodeType, $.Array (NodeType)])
    (selector => node => S.map (Node) (select (selector, node.value, {})));

//# attr :: String -> Node -> Maybe String
//.
//. TK.
//.
//. ```javascript
//. > S.show (S.map (H.attr ('class')) (H.parse ('<div class="selected"></div><div></div>')))
//. '[Just ("selected"), Nothing]'
//. ```
H.attr =
def ('attr')
    ({})
    ([$.String, NodeType, $.Maybe ($.String)])
    (key => node => S.get (S.is ($.String)) (key) (node.value.attribs));

//# is :: Selector -> Node -> Boolean
//.
//. TK.
//.
//. ```javascript
//. > S.map (H.is ('.selected')) (H.parse ('<li class="selected">one</li><li>two</li><li>three</li>'))
//. [true, false, false]
//. ```
H.is =
def ('is')
    ({})
    ([SelectorType, NodeType, $.Boolean])
    (selector => node => select.is (node.value, selector, {}));

//# children :: Element -> Array Node
//.
//. TK.
//.
//. ```javascript
//. > S.show (S.chain (H.children) (H.parse ('<ul><li>one</li><li>two</li></ul>')))
//. '[Node ("<li>one</li>"), Node ("<li>two</li>")]'
//. ```
H.children =
def ('children')
    ({})
    ([ElementType, $.Array (NodeType)])
    (el => S.map (Node) (el.value.children));

//# parent :: Node -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > S.show (S.map (H.parent) (S.chain (H.children) (H.parse ('<ul><li>one</li><li>two</li></ul>'))))
//. '[Just (Node ("<ul><li>one</li><li>two</li></ul>")), Just (Node ("<ul><li>one</li><li>two</li></ul>"))]'
//.
//. > S.map (H.parent) (H.parse ('<ul></ul>'))
//. [Nothing]
//. ```
H.parent =
def ('parent')
    ({})
    ([NodeType, $.Maybe (ElementType)])
    (S.compose (S.map (Node))
               (S.gets (S.is ($.Object)) (['value', 'parent'])));

//# prev :: Element -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > S.pipe ([H.parse, S.chain (H.find ('li')), S.last, S.chain (H.prev), S.map (H.text)])
//. .        ('<ul><li>one</li><li>two</li></ul>')
//. Just ('one')
//.
//. > S.pipe ([H.parse, S.chain (H.find ('li')), S.head, S.chain (H.prev), S.map (H.text)])
//. .        ('<ul><li>one</li><li>two</li></ul>')
//. Nothing
//. ```
H.prev =
def ('prev')
    ({})
    ([ElementType, $.Maybe (ElementType)])
    (el => {
       for (let _node = el.value.prev; _node != null; _node = _node.prev) {
         if (domelementtype.isTag (_node)) return Just (Node (_node));
       }
       return Nothing;
     });

//# next :: Element -> Maybe Element
//.
//. TK.
//.
//. ```javascript
//. > S.pipe ([H.parse, S.chain (H.find ('li')), S.head, S.chain (H.next), S.map (H.text)])
//. .        ('<ul><li>one</li><li>two</li></ul>')
//. Just ('two')
//.
//. > S.pipe ([H.parse, S.chain (H.find ('li')), S.last, S.chain (H.next), S.map (H.text)])
//. .        ('<ul><li>one</li><li>two</li></ul>')
//. Nothing
//. ```
H.next =
def ('next')
    ({})
    ([ElementType, $.Maybe (ElementType)])
    (el => {
       for (let _node = el.value.next; _node != null; _node = _node.next) {
         if (domelementtype.isTag (_node)) return Just (Node (_node));
       }
       return Nothing;
     });
