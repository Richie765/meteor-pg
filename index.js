var LivePg = require('pg-live-select');
var pgp = require('pg-promise')();

// Update this connection string to match your configuration!
// When using an externally configured PostgreSQL server, the default port
// is 5432.

// TODO Use environment variables and proper defaults

var PG_URL = process.env.PG_URL ? process.env.PG_URL : 'postgres://' + process.env.USER + ':numtel@127.0.0.1:5438/postgres';
var PG_CHANNEL = process.env.PG_CHANNEL ? process.env.PG_CHANNEL : 'default_channel';

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

// select function

function live_select(sub, collection, query, params, triggers) {
  var initial = true;
  var oldIds = [];

  var query = liveDb.select(query, params, triggers)
    .on('update', function(diff, data) {
      // console.log('diff', diff);
      // console.log('data', data);

      // Get id's and check uniqueness

      var newIds = data.map(row => row._id);

      var check = {};
      newIds.forEach(id => {
        if(id === null || id === undefined) throw new Meteor.Error("Record without _id");
        if(check[id]) throw new Meteor.Error("Duplicate _id in dataset");

        check[id] = 1;
      });

      // Copied

      if(diff.copied) {
        throw new Meteor.Error("diff.copied should be null as each record must have a unique _id");
      };

      // Add / Change

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
            sub.changed(collection, _id, copy);
            // console.log("Changed", collection, _id, copy);
          }
          else {
            sub.added(collection, _id, copy);
            // console.log("Added", collection, _id, copy);
          }
        });
      }

      // Remove

      if(diff.removed) {
        diff.removed.forEach(function(removed) {
          // Get _id

          var _id = oldIds[removed._index - 1];
          if(!_id) throw new Meteor.Error("Cannot remove a record we didn't see before");

          // Skip if it's still in our dataset

          var index = newIds.findIndex(newId => newId === _id);

          if(index === -1) {
            sub.removed(collection, _id);
            // console.log("Removed", collection, _id);
          }
        });
      };

      // Store current ids for next time

      oldIds = newIds;

      // Issue ready if needed

      if(initial) {
        sub.ready();
        initial = false;
      }
    });

  sub.onStop(function() {
    // console.log("Subscription was stopped");
    query.stop();
  });
}

function select(collection, query, params, triggers) {
  return {
    _publishCursor: function(sub) {
      live_select(sub, collection, query, params, triggers);
    },

    observeChanges: function(callbacks) {
      console.log("Not implemented yet");
      // console.log("observeChanges called");
      // console.log(callbacks);
    },
  };
}

// Exports

module.exports = {
  select: select,
  db: db,
};


/*

There seem to be 2 types of _publishCursor

1.
https://github.com/meteor/meteor/blob/master/packages/mongo/collection.js#L343
Mongo.Collection._publishCursor = function (cursor, sub, collection)

2.
https://github.com/meteor/meteor/blob/master/packages/ddp-server/livedata_server.js#L1068
_publishCursor(subscription);

It seems the second one is what we need


*/

/*
_publishCursor = function (cursor, sub, collection) {
  var observeHandle = cursor.observeChanges({
    added: function (id, fields) {
      sub.added(collection, id, fields);
    },
    changed: function (id, fields) {
      sub.changed(collection, id, fields);
    },
    removed: function (id) {
      sub.removed(collection, id);
    }
  });

  // We don't call sub.ready() here: it gets called in livedata_server, after
  // possibly calling _publishCursor on multiple returned cursors.

  // register stop callback (expects lambda w/ no args).
  sub.onStop(function () {observeHandle.stop();});

  // return the observeHandle in case it needs to be stopped early
  return observeHandle;
};
*/
