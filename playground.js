'use strict';

const fs = require('fs');

const R = require('ramda');
const S = require('sanctuary');

const H = require('./index');


const _ = R.__;

const input = fs.readFileSync('./snippet.html', 'utf8');

S.pipe([H.parse,                                            // Either Error [Node]
        R.map(S.head),                                      // Either Error (Maybe Node)
        R.chain(S.maybeToEither(new Error('No elements'))), // Either Error Node
        R.map(H.text),                                      // Either Error String
        console.log],
       input);

S.pipe([H.parse,                                            // Either Error [Node]
        R.map(S.head),                                      // Either Error (Maybe Node)
        R.chain(S.maybeToEither(new Error('No elements'))), // Either Error Node
        R.map(H.html),                                      // Either Error String
        console.log],
       input);

S.pipe([H.parse,                                            // Either Error [Node]
        R.map(S.head),                                      // Either Error (Maybe Node)
        R.chain(S.maybeToEither(new Error('No elements'))), // Either Error Node
        R.map(H.find('.bigtitle')),                         // Either Error [Node]
        console.log],
       input);
