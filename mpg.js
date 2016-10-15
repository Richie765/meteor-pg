'use strict';
var pgPromise = require('pg-promise');

var PgTableObserver = require('pg-table-observer').default;
var PgQueryObserver = require('pg-query-observer').default;

// Initialization

var pgp;
var db;
var query_observer;
var table_observer;

function init(connection, channel) {
  if(!connection) {
    connection = process.env.PG_URL ? process.env.PG_URL : 'postgres://localhost/postgres';
  }

  if(!channel) {
    channel = process.env.PG_CHANNEL ? process.env.PG_CHANNEL : 'default_channel';
  }

  // pg-promise connection

  pgp = pgPromise({});

  try {
    db = Promise.await(pgp(connection));
  }
  catch(err) {
    console.error('meteor-pg: failed to connect to', connection);
    throw err;
  }

  // PgQueryObserver

  query_observer = new PgQueryObserver(db, channel);

  table_observer = query_observer.table_observer;

  // Automatic cleanup

  function cleanupAndExit() {
    query_observer.cleanup().then(() => {
      pgp.end();
      process.exit();
    })
  }

  process.on('SIGTERM', cleanupAndExit);
  process.on('SIGINT', cleanupAndExit);
}

init(); // For now just init automatically

// select function
function live_select(sub, collection, query, params, triggers) {
  if(!query_observer) throw new Error('Query observer not initialized yet');

  try {
    let handle = Promise.await(query_observer.notify(query, params, triggers, diff => {
      // console.log(diff);

      if(diff.removed) {
        diff.removed.forEach(_id => {
          sub.removed(collection, _id);
        });
      }

      if(diff.changed) {
        diff.changed.forEach(changed => {
          let _id = changed._id;
          sub.changed(collection, _id, changed);
        });
      }

      if(diff.added) {
        diff.added.forEach(added => {
          let _id = added._id;
          sub.added(collection, _id, added);
        });
      }
    }));

    // Add initial rows

    let rows = handle.getRows();

    rows.forEach(added => {
      let _id = added._id;
      sub.added(collection, _id, added);
    });

    // onStop handler

    sub.onStop(() => {
      // console.log("Stopped");
      handle.stop();
    });
  }
  catch(err) {
    // console.error(err);
    sub.error(err);
  }
}

function select(collection, query, params, triggers) {
  // Usage: (inside Publish function)
  //  return mpg.select(collection, query, params, triggers)

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

// mpg object

var mpg = {
  pgp, db, query_observer, table_observer, select,

  // await all query functions

  connect() { return Promise.await(db.connect.apply(db, arguments)) },
  query() { return Promise.await(db.query.apply(db, arguments)) },
  none() { return Promise.await(db.none.apply(db, arguments)) },
  one() { return Promise.await(db.one.apply(db, arguments)) },
  many() { return Promise.await(db.many.apply(db, arguments)) },
  oneOrNone() { return Promise.await(db.oneOrNone.apply(db, arguments)) },
  manyOrNone() { return Promise.await(db.manyOrNone.apply(db, arguments)) },
  any() { return Promise.await(db.any.apply(db, arguments)) },
  result() { return Promise.await(db.result.apply(db, arguments)) },
  stream() { return Promise.await(db.stream.apply(db, arguments)) },
  func() { return Promise.await(db.func.apply(db, arguments)) },
  proc() { return Promise.await(db.proc.apply(db, arguments)) },
  map() { return Promise.await(db.map.apply(db, arguments)) },
  each() { return Promise.await(db.each.apply(db, arguments)) },
  task() { return Promise.await(db.task.apply(db, arguments)) },
  tx() { return Promise.await(db.tx.apply(db, arguments)) },
};

// Export

module.exports = mpg;
