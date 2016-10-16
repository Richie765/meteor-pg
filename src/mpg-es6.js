import pgPromise from 'pg-promise';

import PgTableObserver from 'pg-table-observer';
import PgQueryObserver from 'pg-query-observer';

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
    db = GLOBAL.Promise.await(pgp(connection));
  }
  catch(err) {
    console.error('meteor-pg: failed to connect to', connection);
    throw err;
  }

  // PgQueryObserver

  query_observer = new PgQueryObserver(db, channel);

  table_observer = query_observer.table_observer;

  // Automatic cleanup

  async function cleanupAndExit() {
    await query_observer.cleanup();
    pgp.end();
    process.exit();
  }

  process.on('SIGTERM', cleanupAndExit);
  process.on('SIGINT', cleanupAndExit);
}

init(); // For now just init automatically

// select function

function live_select(sub, collection, query, params, triggers) {
  if(!query_observer) throw new Error('Query observer not initialized yet');

  let handle;

  try {
    handle = GLOBAL.Promise.await(query_observer.notify(query, params, triggers, diff => {
      // console.log(diff);

      if(diff.removed) {
        diff.removed.forEach(_id => {
          sub.removed(collection, _id);
        });
      }

      if(diff.changed) {
        diff.changed.forEach(changed => {
          let { _id } = changed;
          sub.changed(collection, _id, changed);
        });
      }

      if(diff.added) {
        diff.added.forEach(added => {
          let { _id } = added;
          sub.added(collection, _id, added);
        });
      }
    }));

    // Add initial rows

    let rows = handle.getRows();

    rows.forEach(added => {
      let { _id } = added;
      sub.added(collection, _id, added);
    });

    // onStop handler

    sub.onStop(() => {
      // console.log("Stopping", query);
      handle.stop();
    });
  }
  catch(err) {
    // console.error(err);
    sub.error(err);
  }

  return handle;
}

function select(collection, query, params, triggers) {
  // Usage: (inside Publish function)
  //  return mpg.select(collection, query, params, triggers)

  return {
    _publishCursor(sub) {
      this.handle = live_select(sub, collection, query, params, triggers);
    },

    refresh() {
      if(this.handle) {
        this.handle.refresh();
      }
    },

    observeChanges(callbacks) {
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

  connect(...param) { return GLOBAL.Promise.await(db.connect(...param)) },
  query(...param) { return GLOBAL.Promise.await(db.query(...param)) },
  none(...param) { return GLOBAL.Promise.await(db.none(...param)) },
  one(...param) { return GLOBAL.Promise.await(db.one(...param)) },
  many(...param) { return GLOBAL.Promise.await(db.many(...param)) },
  oneOrNone(...param) { return GLOBAL.Promise.await(db.oneOrNone(...param)) },
  manyOrNone(...param) { return GLOBAL.Promise.await(db.manyOrNone(...param)) },
  any(...param) { return GLOBAL.Promise.await(db.any(...param)) },
  result(...param) { return GLOBAL.Promise.await(db.result(...param)) },
  stream(...param) { return GLOBAL.Promise.await(db.stream(...param)) },
  func(...param) { return GLOBAL.Promise.await(db.func(...param)) },
  proc(...param) { return GLOBAL.Promise.await(db.proc(...param)) },
  map(...param) { return GLOBAL.Promise.await(db.map(...param)) },
  each(...param) { return GLOBAL.Promise.await(db.each(...param)) },
  task(...param) { return GLOBAL.Promise.await(db.task(...param)) },
  tx(...param) { return GLOBAL.Promise.await(db.tx(...param)) },
};

// Exports

export { mpg, pgp, db, query_observer, table_observer, select };
export default mpg;
