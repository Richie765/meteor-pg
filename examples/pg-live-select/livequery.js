#!/usr/bin/env node --use-strict

// pg-live-select example
// To use example query from livequery.sql, load sample-data.sql into database
var fs = require('fs');
var path = require('path');
var LivePg = require('pg-live-select');

// Update this line with your username/password/host/database
// var CONN_STR = 'postgres://meteor:meteor@127.0.0.1/meteor';
var CONN_STR =
  'postgres://' + process.env.USER + ':numtel@127.0.0.1:5438/postgres';

// Load the SELECT query from an external file
var QUERY = fs.readFileSync(path.join(__dirname, 'livequery.sql')).toString();
var QUERY2 = `SELECT score > 70 AS top_score FROM scores`;

// Initialize the live query processor
var liveDb = new LivePg(CONN_STR, 'mytest');

// Create a live select instance
liveDb.select(QUERY, [ 1 ], {
  'scores': function(row) {
    console.log(row);
    return true;
  }
})
// liveDb.select(QUERY2)
  .on('update', function(diff, data) {
    // console.log(diff, data);
    console.log(diff);
  });

// On Ctrl+C, remove triggers and exit
process.on('SIGINT', function() {
  liveDb.cleanup(process.exit);
});
