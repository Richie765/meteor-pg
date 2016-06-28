// pg-live-select example
// To use example query from livequery.sql, load sample-data.sql into database
var fs = require('fs');
var path = require('path');
var LivePg = require('../');

// Update this line with your username/password/host/database
var CONN_STR = 'postgres://meteor:meteor@127.0.0.1/meteor';
// Load the SELECT query from an external file
var QUERY = fs.readFileSync(path.join(__dirname, 'livequery.sql')).toString();

// Initialize the live query processor
var liveDb = new LivePg(CONN_STR, 'mytest');

// Create a live select instance
liveDb.select(QUERY, [ 1 ])
  .on('update', function(diff, data) {
    // Handle the changes here...
    console.log(diff, data);
  });

// On Ctrl+C, remove triggers and exit
process.on('SIGINT', function() {
  liveDb.cleanup(process.exit);
});
