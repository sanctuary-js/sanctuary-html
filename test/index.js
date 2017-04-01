'use strict';

/* global describe, it */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const R = require('ramda');
const S = require('sanctuary');
const $ = require('sanctuary-def');

const H = require('..');

const nothing = S.Nothing;
const just = S.Just;

function eq(...args) {
  assert.strictEqual(args.length, eq.length);
  const [actual, expected] = args;
  assert.strictEqual(R.toString(actual), R.toString(expected));
}

const GOOD_HTML = fs.readFileSync(path.join(__dirname, 'good.html'), 'utf8');
const GOOD_OBJ  = require('./good.json');

const def = $.create(true, $.env);

//    stripCircular :: HtmlParserNode -> HtmlParserNode
const stripCircular = def('stripCircular', {}, [$.Any, $.Any], _node =>
S.pipe([R.omit(['next', 'parent', 'prev']),
        R.ifElse(R.propSatisfies(R.isNil, 'children'),
                 R.identity,
                 R.over(R.lensProp('children'), R.map(stripCircular)))],
       _node));

//    stripNode :: Node -> HtmlParserNode
const stripNode = S.compose(stripCircular, R.prop('value'));

describe('Node', () => {
  it('returns Node given htmlparser2 _node', () => {
    const _node = {
      name: '!doctype',
      data: '!DOCTYPE html',
      type: 'directive',
      next: null,
      prev: null,
      parent: null,
    };
    const node = H.Node(_node);
    eq(node.value, _node);
    eq(node['_@@type'], 'sanctuary-html/Node');
    eq(R.toString(node), 'Node("<!DOCTYPE html>")');
    eq(R.equals(node, H.Node(_node)), true);
  });

  // TODO: Test equals methods
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
    const circularNodes = H.parse(GOOD_HTML);
    eq(R.map(stripNode, circularNodes), GOOD_OBJ);
  });
});

describe('attr', () => {
  it('returns value of attribute for given node #1', () => {
    const node = S.pipe([H.parse,
                         R.nth(0)],
                        '<h1 class="bigtitle">My text</h1>');
    eq(H.attr('class', node), just('bigtitle'));
  });
  it('returns value of attribute for given node #2', () => {
    const node = S.pipe([H.parse,
                         R.nth(0)],
                        '<p id="main-paragraph">What a great webpage!</p>');
    eq(H.attr('id', node), just('main-paragraph'));
  });
  it('returns value of arbitrary attribute', () => {
    const node = S.pipe([H.parse,
                         R.nth(0)],
                        '<p myattribute="booyah">What a great webpage!</p>');
    eq(H.attr('myattribute', node), just('booyah'));
  });
  it('returns Nothing if attribute does not exist', () => {
    const node = S.pipe([H.parse,
                         R.nth(0)],
                        '<p id="main-paragraph">What a great webpage!</p>');
    eq(H.attr('style', node), nothing());
  });
  it('returns empty string value for boolean attributes', () => {
    const node = S.pipe([H.parse,
                         R.nth(0)],
                        '<input type="checkbox" checked>');
    eq(H.attr('checked', node), just(''));
  });
});

describe('html', () => {
  it('returns HTML of Node #1', () => {
    const html = S.pipe([H.parse,
                         R.map(H.html),
                         R.join(''),
                        ],
                        GOOD_HTML);
    eq(html, GOOD_HTML);
  });
  it('returns HTML of Node #2', () => {
    const htmlString = '<p> My goodness! </p>';
    const html = S.pipe([H.parse,
                         R.nth(0),
                         H.html,
                        ],
                        htmlString);
    eq(html, htmlString);
  });
});

// TODO
describe.skip('text', () => {});

describe('is', () => {
  it('returns Boolean test of tag name', () => {
    const node = S.pipe([H.parse, R.nth(0)], '<p> My goodness! </p>');
    eq(H.is('p', node), true);
    eq(H.is('a', node), false);
    eq(H.is('', node), false);
  });
  it('works with R.filter', () => {
    const match = S.pipe([H.parse,
                           R.filter(H.is('html')),
                           R.nth(0),
                          ],
                          GOOD_HTML);
    // Assert stripped HtmlParserNode object
    eq(stripNode(match), require('./html_tag.json'));
    // Assert html string
    eq(H.html(match),
       fs.readFileSync(path.join(__dirname, 'html_tag.html'), 'utf8'));
  });
});

describe('find', () => {
  it('finds unique matching node by id', () => {
    const match = S.pipe([H.parse,
                           R.filter(H.is('html')),
                           R.nth(0),
                           H.find('#main-paragraph'),
                           R.nth(0),
                          ],
                          GOOD_HTML);
    // Assert stripped HtmlParserNode object
    eq(stripNode(match), {
      attribs: {
        id: 'main-paragraph',
      },
      children: [
        {
          data: 'What a wonderful webpage!',
          type: 'text',
        },
      ],
      name: 'p',
      type: 'tag',
    });
    // Assert html string
    eq(H.html(match), '<p id="main-paragraph">What a wonderful webpage!</p>');
  });
  it('finds multiple matches by attribute', () => {
    const matches = S.pipe([H.parse,
                            R.filter(H.is('html')),
                            R.nth(0),
                            H.find('[type=checkbox]'),
                           ],
                           GOOD_HTML);
    // Assert stripped HtmlParserNode object
    eq(R.map(stripNode, matches), require('./matches.json'));
    // Assert html string
    eq(
      S.pipe([R.map(H.html), R.join('')], matches),
      '<input type="checkbox" value="1" name="myCheckbox" checked>' +
      '<input type="checkbox" value="2" name="myCheckbox" checked="checked">' +
      '<input type="checkbox" value="3" name="myCheckbox">'
    );
  });
});

describe('children', () => {
  it('returns child nodes given parent node', () => {
    const children = S.pipe([H.parse,
                             R.filter(H.is('html')),
                             R.nth(0),
                             H.find('ul'),
                             R.nth(0),
                             H.children,
                            ],
                            GOOD_HTML);
    // Assert stripped HtmlParserNode object
    eq(R.map(stripNode, children), require('./children.json'));
    // Assert html string
    eq(S.pipe([R.map(H.html), R.join('')], children),
       fs.readFileSync(path.join(__dirname, 'children.html'), 'utf8'));
  });
  it('returns empty array nodes given element with no children', () => {
    const parent = S.pipe([H.parse,
                           R.nth(0),
                          ],
                          '<p></p>');
    // Assert stripped HtmlParserNode object
    eq(S.pipe([H.children, R.map(stripNode)], parent), []);
    // Assert html string
    eq(S.pipe([H.children, R.map(H.html), R.join('')], parent), '');
  });
});

describe('parent', () => {
  it('returns parent node given child node', () => {
    const children = S.pipe([H.parse,
                             R.filter(H.is('html')),
                             R.nth(0),
                             H.find('ul'),
                             R.nth(0),
                             H.children,
                            ],
                            GOOD_HTML);
    const parents = R.map(H.parent, children);
    // Assert parent of each child is expected parent
    R.map(parent => {
      eq(parent.isJust, true);
      // Assert stripped HtmlParserNode object
      eq(stripNode(parent.value), require('./ul_tag.json'));
      // Assert html string
      eq(H.html(parent.value),
         fs.readFileSync(path.join(__dirname, 'ul_tag.html'), 'utf8'));
    }, parents);
  });
});

// TODO
describe.skip('next', () => {});

// TODO
describe.skip('prev', () => {});
