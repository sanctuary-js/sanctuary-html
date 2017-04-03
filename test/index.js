'use strict';

/* global describe, it */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const R = require('ramda');
const {create, env} = require('sanctuary');

const H = require('..');


const createOpts = {
  checkTypes: true,
  env: env.concat([H.ElementType, H.NodeType, H.SelectorType]),
};

const S = create(createOpts);

const nothing = S.Nothing;
const just = S.Just;

function eq(actual, expected) {
  // eslint-disable-next-line prefer-rest-params
  assert.strictEqual(arguments.length, eq.length);
  assert.strictEqual(R.toString(actual), R.toString(expected));
}

const GOOD_HTML = fs.readFileSync(path.join(__dirname, 'good.html'), 'utf8');

//    parseOne :: String -> Node !
const parseOne = s => {
  const nodes = H.parse(s);
  assert.strictEqual(nodes.length, 1, 'parseOne: did not receive exactly one' +
    ' html node');
  return nodes[0];
};

describe('Node', () => {
  const _node = {
    data: 'foo',
    type: 'text',
    next: null,
    prev: null,
    parent: null,
  };
  const node = H.Node(_node);

  it('returns Node given htmlparser2 _node', () => {
    const node = H.Node(_node);
    eq(node.value, _node);
    eq(S.type(node), 'sanctuary-html/Node');
    eq(R.toString(node), 'Node("foo")');
    eq(R.equals(node, H.Node(_node)), true);
  });

  it('Node.equals returns true for equivalent nodes', () => {
    const nodeOther = H.Node(R.clone(_node));
    eq(S.equals(node, nodeOther), true);
  });

  it('Node.equals returns false non-equivalent nodes', () => {
    const nodeOther = H.Node({
      data: 'bar',
      type: 'text',
      next: null,
      prev: null,
      parent: null,
    });
    eq(S.equals(node, nodeOther), false);
  });
});

describe('parse', () => {
  it('parse well formed html', () => {
    // Assert non-circular htmlparser2 object
    const simple = '<html></html>';
    const simpleNodes = H.parse(simple);
    const simpleExpected = {
      attribs: {},
      children: [],
      name: 'html',
      next: null,
      parent: null,
      prev: null,
      type: 'tag',
    };
    eq(simpleNodes, [H.Node(simpleExpected)]);
    // Assert circular htmlparser2 object after stripping circular values.
    const htmlNodes = S.map(H.html, H.parse(GOOD_HTML));
    eq(htmlNodes.length, 4);
    eq(S.joinWith('', htmlNodes), GOOD_HTML);
  });
});

describe('attr', () => {
  it('returns value of attribute for given node #1', () => {
    const node = parseOne('<h1 class="bigtitle">My text</h1>');
    eq(H.attr('class', node), just('bigtitle'));
  });
  it('returns value of attribute for given node #2', () => {
    const node = parseOne('<p id="main-paragraph">What a great webpage!</p>');
    eq(H.attr('id', node), just('main-paragraph'));
  });
  it('returns value of attribute for given node with spaces', () => {
    const node = parseOne('<h1 class="bigtitle foo">My text</h1>');
    eq(H.attr('class', node), just('bigtitle foo'));
  });
  it('returns value of arbitrary attribute', () => {
    const node = parseOne('<p myattribute="booyah">What a great webpage!</p>');
    eq(H.attr('myattribute', node), just('booyah'));
  });
  it('returns Nothing if attribute does not exist', () => {
    const node = parseOne('<p id="main-paragraph">What a great webpage!</p>');
    eq(H.attr('style', node), nothing);
  });
  it('returns empty string value for boolean attributes', () => {
    const node = parseOne('<input type="checkbox" checked>');
    eq(H.attr('checked', node), just(''));
  });
});

describe('html', () => {
  // TK: Good candidate for table and/or property based tests.
  it('returns HTML of Node #1', () => {
    const html = S.pipe([H.parse,
                         S.map(H.html),
                         R.join('')],
                        GOOD_HTML);
    eq(html, GOOD_HTML);
  });
  it('returns HTML of Node #2', () => {
    const htmlString = '<p> My goodness! </p>';
    const html = H.html(parseOne(htmlString));
    eq(html, htmlString);
  });
});

// TK
describe.skip('text', () => {});

describe('is', () => {
  it('returns Boolean test of tag name', () => {
    const node = parseOne('<p> My goodness! </p>');
    eq(H.is('p', node), true);
    eq(H.is('a', node), false);
  });
});

describe('find', () => {
  it('finds unique matching node by id', () => {
    const matches = S.chain(H.find('#main-paragraph'), H.parse(GOOD_HTML));
    // Assert html string
    eq(S.map(H.html, matches),
       ['<p id="main-paragraph">What a wonderful webpage!</p>']);
  });
  it('finds multiple matches by attribute', () => {
    const matches = S.chain(H.find('[type=checkbox]'), H.parse(GOOD_HTML));
    // Assert html string
    eq(
      S.map(H.html, matches),
      ['<input type="checkbox" value="1" name="myCheckbox" checked>',
       '<input type="checkbox" value="2" name="myCheckbox" checked="checked">',
       '<input type="checkbox" value="3" name="myCheckbox">']
    );
  });
});

describe('children', () => {
  it('returns child nodes given parent node', () => {
    const children = S.pipe([H.parse,
                             S.chain(H.find('ul')),
                             S.chain(H.children)],
                            GOOD_HTML);
    // Assert html string
    eq(children.length, 7);
    eq(S.joinWith('', S.map(H.html, children)),
       fs.readFileSync(path.join(__dirname, 'children.html'), 'utf8'));
  });
  it('returns empty array given element with no children', () => {
    eq(H.children(parseOne('<p></p>')), []);
  });
});

describe('parent', () => {
  it('returns parent node given child node', () => {
    const parents = S.pipe([H.parse,
                            S.chain(H.find('ul')),
                            S.chain(H.children),
                            R.map(H.parent)],
                           GOOD_HTML);
    // Assert parent of each child is expected parent
    parents.forEach(parent => {
      // Assert html string
      eq(S.map(H.html, parent),
         S.Just(fs.readFileSync(path.join(__dirname, 'ul_tag.html'), 'utf8')));
    });
  });
  it('returns Nothing given one of top-level nodes', () => {
    eq(S.map(H.parent, H.parse(GOOD_HTML)),
       [nothing, nothing, nothing, nothing]);
  });
});

// TK
describe.skip('next', () => {});

// TK
describe.skip('prev', () => {});
