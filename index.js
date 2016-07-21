import LivePg from 'pg-live-select';
import pgPromise from 'pg-promise';

// Update this connection string to match your configuration!
// When using an externally configured PostgreSQL server, the default port
// is 5432.

// TODO Use environment variables and proper defaults

let PG_URL = process.env.PG_URL ? process.env.PG_URL : 'postgres://' + process.env.USER + ':numtel@127.0.0.1:5438/postgres';
let PG_CHANNEL = process.env.PG_CHANNEL ? process.env.PG_CHANNEL : 'default_channel';

// pg-promise connection

let pgp = pgPromise({});
let db = pgp(PG_URL);

try {
  console.log('meteor-pg: connecting to', PG_URL);
  Promise.await(db.connect());
  console.log('meteor-pg: success');
}
catch(err) {
  console.error("meteor-pg: failed");
  throw err;
}

// liveDb connection

let liveDb = new LivePg(PG_URL, PG_CHANNEL);

let closeAndExit = function() {
  // Cleanup removes triggers and functions used to transmit updates
  liveDb.cleanup(process.exit);
};

// Close connections on hot code push
process.on('SIGTERM', closeAndExit);
// Close connections on exit (ctrl + c)
process.on('SIGINT', closeAndExit);

// select function

function live_select(sub, collection, ...param) {
  let initial = true;
  let oldIds = [];

  let handle = liveDb.select(...param)
    .on('update', function(diff, data) {
      // console.log('diff', diff);
      // console.log('data', data);

      // Leave if nothing changed

      if(!diff) return;

      // Remove

      if(diff.removed) {
        diff.removed.forEach(function(_id) {
          sub.removed(collection, _id);
        });
      };

      // Changed

      if(diff.changed) {
        diff.changed.forEach(function(changed) {
          let _id = changed._id;
          sub.changed(collection, _id, changed);
        });
      }

      // Added

      if(diff.added) {
        diff.added.forEach(function(added) {
          let _id = added._id;
          sub.added(collection, _id, added);
        });
      }

      // Issue ready if needed

      if(initial) {
        sub.ready();
        initial = false;
      }
    })
    .on('error', function(err) {
      // console.log("Error", err);
      sub.error(err);
    });

  sub.onStop(function() {
    // console.log("Stopped");
    handle.stop();
  });
}

function select(...param) {
  return {
    _publishCursor: function(sub) {
      live_select(sub, ...param);
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
  live_select: live_select,

  db: db,

  // await all query functions

  connect(...param) { return Promise.await(db.connect(...param)) },
  query(...param) { return Promise.await(db.query(...param)) },
  none(...param) { return Promise.await(db.none(...param)) },
  one(...param) { return Promise.await(db.one(...param)) },
  many(...param) { return Promise.await(db.many(...param)) },
  oneOrNone(...param) { return Promise.await(db.oneOrNone(...param)) },
  manyOrNone(...param) { return Promise.await(db.manyOrNone(...param)) },
  any(...param) { return Promise.await(db.any(...param)) },
  result(...param) { return Promise.await(db.result(...param)) },
  stream(...param) { return Promise.await(db.stream(...param)) },
  func(...param) { return Promise.await(db.func(...param)) },
  proc(...param) { return Promise.await(db.proc(...param)) },
  map(...param) { return Promise.await(db.map(...param)) },
  each(...param) { return Promise.await(db.each(...param)) },
  task(...param) { return Promise.await(db.task(...param)) },
  tx(...param) { return Promise.await(db.tx(...param)) },
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
