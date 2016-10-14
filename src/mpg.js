import pgPromise from 'pg-promise';
import PgTableObserver from '../../pg-table-observer/';
import PgQueryObserver from '../../pg-query-observer/';

// Initialization

var pgp;
var db;
var query_observer;

async function init(connection, channel) {
  if(!connection) {
    connection = process.env.PG_URL ? process.env.PG_URL : 'postgres://localhost/postgres';
  }

  if(!channel) {
    let channel = process.env.PG_CHANNEL ? process.env.PG_CHANNEL : 'default_channel';
  }

  // pg-promise connection

  pgp = pgPromise({});

  try {
    db = await pgp(connection);
  }
  catch(err) {
    console.error('meteor-pg: failed to connect to', connection);
    throw err;
  }

  // PgQueryObserver

  query_observer = new PgQueryObserver(db, channel);

  // Automatic cleanup

  async function cleanupAndExit() {
    // NOTE use Promise.await?
    await query_observer.cleanup();
    await pgp.end();
    process.exit();
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
  pgp, db, query_observer, select,

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

// Exports

export { mpg, pgp, db, query_observer, select };
export default mpg;
