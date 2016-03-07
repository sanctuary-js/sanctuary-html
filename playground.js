'use strict';

const fs = require('fs');

const R = require('ramda');
const S = require('sanctuary');

const H = require('./index');


const _ = R.__;

const input = fs.readFileSync('./snippet.html', 'utf8');

S.pipe([H.parse,                // [Node]
        S.head,                 // Maybe Node
        R.map(H.text),          // Maybe String
        console.log],
       input);

S.pipe([H.parse,
        S.head,
        R.map(H.html),
        console.log],
       input);

S.pipe([H.parse,
        S.head,
        R.map(H.find('.bigtitle')),
        console.log],
       input);

S.pipe([H.parse,
        S.head,
        R.map(H.find('input[type=checkbox]')),
        R.map(R.map(H.attr('checked'))),
        console.log],
       input);

S.pipe([H.parse,
        S.head,
        R.map(H.find('h1')),
        R.map(R.filter(H.is('xxx'))),
        console.log],
       input);

S.pipe([H.parse,
        S.head,
        R.map(H.find('body')),
        R.chain(S.head),
        R.map(H.children),
        R.map(R.filter(H.is('.smalltitle'))),
        console.log],
       input);
