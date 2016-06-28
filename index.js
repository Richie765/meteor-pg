var LivePg = require('pg-live-select');
var pgp = require('pg-promise')();

// Update this connection string to match your configuration!
// When using an externally configured PostgreSQL server, the default port
// is 5432.

// TODO Use environment variables and proper defaults

var PG_URL = 'postgres://' + process.env.USER + ':numtel@127.0.0.1:5438/postgres';
var PG_CHANNEL = 'default_channel';

// liveDb connection

var liveDb = new LivePg(PG_URL, PG_CHANNEL);

var closeAndExit = function() {
  // Cleanup removes triggers and functions used to transmit updates
  liveDb.cleanup(process.exit);
};

// Close connections on hot code push
process.on('SIGTERM', closeAndExit);
// Close connections on exit (ctrl + c)
process.on('SIGINT', closeAndExit);

// pg-promise connection

var db = pgp(PG_URL);

// PgSelect function

function PgSelect(publishThis, collection, query, params, triggers) {
  var initial = true;
  var oldIds = [];

  var query = liveDb.select(query, params, triggers)
    .on('update', function(diff, data) {
      console.log('diff', diff);
      console.log('data', data);

      // mapping

      var newIds = data.map(row => row._id);
      // TODO check uniqueness


      // Copied

      if(diff.copied) {
        throw new Meteor.Error("diff.copied should be null as each record must have a unique _id");
      };

      // Add

      if(diff.added !== null) {
        diff.added.forEach(function(added) {
          // Get _id

          var _id = added._id;
          if(!_id) throw new Meteor.Error("Each record must have an _id field");

          // Create copy of the record minus technical fields

          var copy = _.clone(added);
          delete copy._index;
          delete copy._hash;
          delete copy._id;

          // Use 'changed' if it existed before, othewise 'added'

          var index = oldIds.findIndex(newId => newId === _id);

          if(index >= 0) {
            publishThis.changed(collection, _id, copy);
            console.log("Changed", collection, _id, copy);
          }
          else {
            publishThis.added(collection, _id, copy);
            console.log("Added", collection, _id, copy);
          }
        });
      }

      // removed

      if(diff.removed) {
        diff.removed.forEach(function(removed) {
          // Get _id

          var _id = oldIds[removed._index - 1];
          if(!_id) throw new Meteor.Error("Cannot remove a record we didn't see before");

          // Skip if it's still in our dataset

          var index = newIds.findIndex(newId => newId === _id);

          if(index === -1) {
            publishThis.removed(collection, _id);
            console.log("Removed", collection, _id);
          }
        });
      };

      // Store current ids for next time

      oldIds = newIds;

      // Issue ready if needed

      if(initial) {
        publishThis.ready();
        initial = false;
      }
    });

  publishThis.onStop(function() {
    console.log("Subscription was stopped");
    query.stop();
  });
}

// Exports

exports.PgSelect = PgSelect;
exports.db = db;

/*

How to do it

* Keep a hash 'mapping', key is _index, value is _id

event: moved
*

event: removed + added (done)
* Match removed and added
* Get _id from mapping
* Change collection
* Check for anything remaining

event: added (done)
* check for existing mapping
* Get random _id
* mapping{_index} = _id
* call this.added with _id and record

event: removed
*

event: copied



*/
