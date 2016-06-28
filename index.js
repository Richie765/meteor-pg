var LivePg = require('pg-live-select');

// Database connection

// Update this connection string to match your configuration!
// When using an externally configured PostgreSQL server, the default port
// is 5432.

// TODO Use envoronment variables and proper defaults

var PG_URL = 'postgres://' + process.env.USER + ':numtel@127.0.0.1:5438/postgres';
var PG_CHANNEL = 'default_channel';

var liveDb = new LivePg(PG_URL, PG_CHANNEL);

var closeAndExit = function() {
  // Cleanup removes triggers and functions used to transmit updates
  liveDb.cleanup(process.exit);
};

// Close connections on hot code push
process.on('SIGTERM', closeAndExit);
// Close connections on exit (ctrl + c)
process.on('SIGINT', closeAndExit);

// PgSelect function

function PgSelect(publishThis, clientTable, query, params, triggers) {
  var initial = true;

  liveDb.select(query, params, triggers)
    .on('update', function(diff, data) {
      // console.log(diff, data);
      // console.log(diff);

      // Added
      if(diff.added) {
        diff.added.forEach(function(row) {
          publishThis.added(clientTable, Random.id(), row);
        });

        if(initial) {
          console.log("Issue ready");
          publishThis.ready();
          initial = false;
        }
      }
    });
}

// Exports

module.exports = PgSelect;


/*

How to do it

* Keep a hash 'mapping', key is _index, value is _id

event: moved
*

event: removed + added
*

event: added
* for each record
* mapping{_index} = random _id
* call this.added with id and record

event: removed
event: copied



*/
