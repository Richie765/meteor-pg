# Introduction
This module allows you to use PostgreSQL reactively with Meteor as seemless
as possible. It uses [numtel/pg-live-select](https://github.com/numtel/pg-live-select)
behind the scenes to do it's magic.

This module provides a method to publish PostgreSQL queries on the server. The query
result will be available in a Minimongo collection, reactively, on the client-side.
The client side collection is read-only and can you can use 'find' on it as usual.

There are also methods for write statements (UPDATE, INSERT) that you can call from
your server-side methods.

This module is still in development. Generally it should work fine but there
are some issues I'm still working on. The API could change.

# Installation

```bash
# currently meteor-pg-live is available on github only
meteor npm install richie765/meteor-pg-live --save

# In the future this should work as well
# meteor npm install meteor-pg-live --save
```

You'll need Meteor's 'ecmascript' package, so install it if you don't have it yet

```bash
meteor add ecmascript
```

If you want to embed a PostgreSQL server into your application, you can use
[numtel/meteor-pg-server](https://github.com/numtel/meteor-pg-server). To
install:

```bash
meteor add numtel:pg-server
```

# Configuration
pg-live-select will by default attempt to connect to the 'numtel:pg-server'
embedded in your application (see above). If you want to connect to your own
PostgreSQL server, you can set the PG_URL environment variable like this:

```bash
export PG_SQL=postgres://user:password@host:port/db
meteor
```

To set the LivePg channel (see [numtel/pg-live-select](https://github.com/numtel/pg-live-select))
use the PG_CHANNEL environment variable:

```bash
export PG_CHANNEL=your_channel
```

# Running the leaderboard example
The leaderboard example is already configured to use the embedded
PostgreSQL server. You can run it using the following commands:

```bash
git clone https://github.com/richie765/meteor-pg-live
cd meteor-pg-live/examples/leaderboard
meteor npm install
meteor
```

For more details see [the leaderboard example README](https://github.com/richie765/meteor-pg-live/examples/leaderboard/).

The directory [examples/pg-live-select](https://github.com/richie765/meteor-pg-live/examples/pg-live-select) contains the example from [numtel/pg-live-select](https://github.com/numtel/pg-live-select). It is included to test / reverse engineer its usage.

# Usage Example
## Publish / Subscribe (SELECT queries)

```javascript
// Server side

import mpg from 'meteor-pg-live';

Meteor.publish('allPlayers', function() {
  // You must supply an _id which uniquely identifies each row returned
  // If you need to specify multiple id's with joined queries, use concat:
  // SELECT CONCAT(userid, '-', taskid) AS _id FROM user, task;

  let sql = `
    SELECT id AS _id, *
    FROM players
    ORDER BY score DESC
  `;

  // The first parameter is the name of the client-side collection.
  // The remaining parameters are identical to pg-live-select.
  // See: https://github.com/numtel/pg-live-select#livepgprototypeselectquery-params-triggers
  // Only use this for SELECT queries.

  return mpg.select('players', sql);

  // Alternative method, may produce less 'flicker' on the initial resultset
  // mpg.live_select(this, 'players', sql);
});

// Client side

Players = new Mongo.Collection('players');

Template.leaderboard.onCreated(function () {
  this.subscribe('allPlayers');
});

Template.leaderboard.helpers({
  players: function () {
    // Still need to sort client-side since record order is not preserved
    return Players.find({}, { sort: { score: -1, name: 1 } });
  },
});
```

## Methods (INSERT, UPDATE queries)

```javascript
// Server side

import mpg from 'meteor-pg-live';

Meteor.methods({
  'incScore': function(id, amount){
    let sql = `
      UPDATE players
      SET score = score + $1
      WHERE id = $2
    `;


    // You can use mpg methods: query, many, one, none, any, oneOrNone, manyOrNone
    // They take the same parameters as the methods of pg-promise
    // See: https://github.com/vitaly-t/pg-promise
    // The difference is that these are synchronous and don't return a promise.
    // You can use the return value-directly.
    // Use this for queries that modify the database, or select queries that
    // don't need to be reactive.

    mpg.any(sql, [ amount, id ]);

    // mpg.db is a database object of pg-promise
    // You can use this directly if you need to.
  }
});

// Client side

Meteor.methods({
  // Optional stub for latency compensation, see note below

  'incScore': function(id, amount){
    Players.update(id, { $inc: { score: amount } });    
  }
});

Template.leaderboard.events({
  'click .inc': function () {
    Meteor.call('incScore', Session.get("selectedPlayer"), 5);
  }
});
```

# Notes / known issues
NOTE: Every query must have a \_id field that must be unique for the resultset.
For simple queries, this can be the PK. For multi-table queries, it can be
the concatenation of multiple PK's. Note, the \_id just has to uniquely
identify the row so you don't always have to include the PK's of all the
tables involved.

BUG: Latency compensation works (client side stub methods), but there is some
'flicker'. It seems like, when the table is updated, the changes to the
subscription aren't synced yet to the client. I'm still looking into a
solution for this.

# Todo
* Read settings from xxx.pg.json file for default PG_URL
* Better default channel name
* Implement observe changes

# Acknowledgements
* Creating this module would not have been possible without Ben Green's
[numtel/pg-live-select](https://github.com/numtel/pg-live-select) module.
Thanks for creating it!
