import assert from 'assert';
import fs from 'fs';
import path from 'path';
import url from 'url';

import test from 'oletus';
import sanctuary from 'sanctuary';

import H from '../index.js';


const __dirname = path.dirname (url.fileURLToPath (import.meta.url));

const S = sanctuary.create ({
  checkTypes: true,
  env: sanctuary.env.concat ([H.ElementType, H.NodeType, H.SelectorType]),
});

//    eq :: a -> b -> Undefined !
function eq(actual) {
  assert.strictEqual (arguments.length, eq.length);
  return function eq$1(expected) {
    assert.strictEqual (arguments.length, eq$1.length);
    assert.strictEqual (S.show (actual), S.show (expected));
    assert.strictEqual (S.equals (actual) (expected), true);
  };
}

const GOOD_HTML = fs.readFileSync (path.join (__dirname, 'good.html'), 'utf8');

//    parseOne :: String -> Node !
const parseOne = s => {
  const nodes = H.parse (s);
  assert.strictEqual (
    nodes.length,
    1,
    'parseOne: did not receive exactly one html node'
  );
  return nodes[0];
};

const _node = {
  data: 'foo',
  type: 'text',
  next: null,
  prev: null,
  parent: null,
};
const node = H.Node (_node);

test ('Node returns Node given htmlparser2 _node', () => {
  const node = H.Node (_node);
  eq (node.value) (_node);
  eq (S.type (node))
     ({namespace: S.Just ('sanctuary-html'), name: 'Node', version: 0});
  eq (S.show (node)) ('Node ("foo")');
  eq (S.equals (node) (H.Node (_node))) (true);
});

test ('Node.equals returns true for equivalent nodes', () => {
  eq (S.equals (H.Node ({data: 'foo', type: 'text', next: null, prev: null, parent: null}))
               (H.Node ({data: 'foo', type: 'text', next: null, prev: null, parent: null})))
     (true);
});

test ('Node.equals returns false non-equivalent nodes', () => {
  const nodeOther = H.Node ({
    data: 'bar',
    type: 'text',
    next: null,
    prev: null,
    parent: null,
  });
  eq (S.equals (node) (nodeOther)) (false);
});

test ('parse well formed html', () => {
  // Assert non-circular htmlparser2 object
  const simple = '<html></html>';
  const simpleNodes = H.parse (simple);
  const simpleExpected = {
    attribs: {},
    children: [],
    name: 'html',
    next: null,
    parent: null,
    prev: null,
    type: 'tag',
  };
  eq (simpleNodes) ([H.Node (simpleExpected)]);
  // Assert circular htmlparser2 object after stripping circular values.
  const htmlNodes = S.map (H.html) (H.parse (GOOD_HTML));
  eq (htmlNodes.length) (4);
  eq (S.joinWith ('') (htmlNodes)) (GOOD_HTML);
});

test ('attr returns value of attribute for given node #1', () => {
  const node = parseOne ('<h1 class="bigtitle">My text</h1>');
  eq (H.attr ('class') (node)) (S.Just ('bigtitle'));
});
test ('attr returns value of attribute for given node #2', () => {
  const node = parseOne ('<p id="main-paragraph">What a great webpage!</p>');
  eq (H.attr ('id') (node)) (S.Just ('main-paragraph'));
});
test ('attr returns value of attribute for given node with spaces', () => {
  const node = parseOne ('<h1 class="bigtitle foo">My text</h1>');
  eq (H.attr ('class') (node)) (S.Just ('bigtitle foo'));
});
test ('attr returns value of arbitrary attribute', () => {
  const node = parseOne ('<p myattribute="booyah">What a great webpage!</p>');
  eq (H.attr ('myattribute') (node)) (S.Just ('booyah'));
});
test ('attr returns Nothing if attribute does not exist', () => {
  const node = parseOne ('<p id="main-paragraph">What a great webpage!</p>');
  eq (H.attr ('style') (node)) (S.Nothing);
});
test ('attr returns empty string value for boolean attributes', () => {
  const node = parseOne ('<input type="checkbox" checked>');
  eq (H.attr ('checked') (node)) (S.Just (''));
});

// TK: Good candidate for table and/or property based tests.
test ('html returns HTML of Node #1', () => {
  eq (S.joinWith ('') (S.map (H.html) (H.parse (GOOD_HTML)))) (GOOD_HTML);
});
test ('html returns HTML of Node #2', () => {
  const htmlString = '<p> My goodness! </p>';
  eq (H.html (parseOne (htmlString))) (htmlString);
});

test ('is returns Boolean test of tag name', () => {
  const node = parseOne ('<p> My goodness! </p>');
  eq (H.is ('p') (node)) (true);
  eq (H.is ('a') (node)) (false);
});

test ('find finds unique matching node by id', () => {
  const matches = S.chain (H.find ('#main-paragraph')) (H.parse (GOOD_HTML));
  // Assert html string
  eq (S.map (H.html) (matches))
     (['<p id="main-paragraph">What a wonderful webpage!</p>']);
});
test ('find finds multiple matches by attribute', () => {
  const matches = S.chain (H.find ('[type=checkbox]')) (H.parse (GOOD_HTML));
  // Assert html string
  eq (S.map (H.html) (matches))
     (['<input type="checkbox" value="1" name="myCheckbox" checked>',
       '<input type="checkbox" value="2" name="myCheckbox" checked="checked">',
       '<input type="checkbox" value="3" name="myCheckbox">']);
});

test ('children returns child nodes given parent node', () => {
  const children =
    S.chain (H.children) (S.chain (H.find ('ul')) (H.parse (GOOD_HTML)));
  // Assert html string
  eq (children.length) (7);
  eq (S.joinWith ('') (S.map (H.html) (children)))
     (fs.readFileSync (path.join (__dirname, 'children.html'), 'utf8'));
});
test ('children returns empty array given element with no children', () => {
  eq (H.children (parseOne ('<p></p>'))) ([]);
});

test ('parent returns parent node given child node', () => {
  const parents =
    S.map (H.parent)
          (S.chain (H.children)
                   (S.chain (H.find ('ul'))
                            (H.parse (GOOD_HTML))));
  // Assert parent of each child is expected parent
  parents.forEach (parent => {
    // Assert html string
    eq (S.map (H.html) (parent))
       (S.Just (fs.readFileSync (path.join (__dirname, 'ul_tag.html'),
                                'utf8')));
  });
});
test ('parent returns Nothing given one of top-level nodes', () => {
  eq (S.map (H.parent) (H.parse (GOOD_HTML)))
     ([S.Nothing, S.Nothing, S.Nothing, S.Nothing]);
});
