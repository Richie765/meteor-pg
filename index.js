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

  console.log("New Select");

  var mapping = {};

  var query = liveDb.select(query, params, triggers)
    .on('update', function(diff, data) {
      // console.log(diff, data);
      // console.log(diff);

      // Moved
      if(diff.moved) {
        console.log("Pending Moved", diff.moved);
      }

      // Changed
      if(diff.removed && diff.added) {
        diff.added.forEach(function(row, index, object) {
          var _index = row._index;

          // find removed item
          var removedIndex = diff.removed.findIndex(row => row._index === _index);

          if(removedIndex >= 0) {
            // Get the _id
            var _id = mapping[_index];
            if(!_id) throw new Meteor.Error("Cannot update a record we didn't see before");

            // Update publication
            publishThis.changed(collection, _id, row);
            console.log("Changed", collection, _id, row);

            // Remove added
            object.splice(index, 1);

            // Remove removed
            diff.removed.splice(removedIndex, 1);
          }
        });

        // Check if all added is done

        if(diff.added.length === 0) {
          diff.added = null;
        }
        else {
          console.log("Still items left in 'added', this may be completely normal.");
        }

        // Check if all removed` is done

        if(diff.removed.length === 0) {
          diff.removed = null;
        }
        else {
          console.log("Still items left in 'removed', this may be completely normal.");
        }
      }

      // Added
      if(diff.added) {
        diff.added.forEach(function(row) {
          if(mapping[row._index]) throw new Meteor.Error("Cannot overwrite existing mapping");

          var _id = Random.id();
          mapping[row._index] = _id;
          publishThis.added(collection, _id, row);
          console.log("Added", collection, _id, row);
        });

        if(initial) {
          console.log("Issue ready");
          publishThis.ready();
          initial = false;
        }
      }

      // Removed
      if(diff.removed) {
        console.log("Not implemented yet: Pending Removed", diff.removed);
      }

      // Copied
      if(diff.copied) {
        console.log("Not implemented yet: Copied", diff.copied);
      }

      console.log(mapping);

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
