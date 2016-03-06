'use strict';

const fs = require('fs');

const rawHtml = fs.readFileSync('./snippet.html', 'utf8');

// const htmlparser = require('htmlparser2');
//
// let myDom;
//
// const handler = new htmlparser.DomHandler(function (error, dom) {
//     if (error) {
//       throw error;
//     } else {
//       myDom = dom;
//     }
// });
//
// const parser = new htmlparser.Parser(handler);
// parser.write(rawHtml);
// parser.done();
//
// debugger;
//
// console.log(myDom);

const H = require('./index');

const _dom = H.parse(rawHtml)

console.log(R.toString(_dom));
