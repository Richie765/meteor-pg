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

For more details see [the leaderboard example README](https://github.com/Richie765/meteor-pg-live/tree/master/examples/leaderboard).

The example in [examples/pg-live-select](https://github.com/Richie765/meteor-pg-live/tree/master/examples/pg-live-select) is based on the example of [numtel/pg-live-select](https://github.com/numtel/pg-live-select). It is included here to test / reverse engineer its usage.

# Usage Example
## Publish / Subscribe (SELECT queries)
Only use this for read-only SELECT queries that you want to be reactive.

Your PostgreSQL query must always return an \_id field which uniquely identifies
each row returned. For simple queries, this could be just an alias to the PK.

For multi-table queries, this could be a combination of different PK's, eg:

```sql
SELECT CONCAT(userid, '-', taskid) AS \_id, * FROM user, task;
```

This does not mean you have to include the PK's of all the tables involved.
You just need to uniquely identify each row returned.

```javascript
mpg.select(collection, query, [params], [triggers])
```

collection: The name of the collection on the client-side.

query, params, triggers: see [pg-live-select](https://github.com/numtel/pg-live-select#livepgprototypeselectquery-params-triggers).

```javascript
// Server side

import mpg from 'meteor-pg-live';

Meteor.publish('allPlayers', function() {
  let sql = `
    SELECT id AS _id, *
    FROM players
    ORDER BY score DESC
  `;

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
You can use mpg methods: query, many, one, none, any, oneOrNone, manyOrNone in your
Meteor methods for your INSERT and UPDATE statements. These methods take the
same parameters as the methods of [pg-promise](https://github.com/vitaly-t/pg-promise).
The difference is that these are synchronous and don't return a promise.
So you can use the return value-directly.

Use those methods for statements that modify the database, or for select queries
that don't need to be reactive.

If you need access to pg-promise's db object directly, this is available as
'mpg.db'.

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

    mpg.none(sql, [ amount, id ]);
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

# Known issues
Latency compensation works (client side stub methods), but there is some
'flicker'. It seems like, when the table is updated, the changes to the
subscription aren't synced yet to the client. I'm still looking into a
solution for this.

The initial resultset may also give some flicker. The alternative method,
as described above in the Usage Examples, may work better for now.

# Todo
* Read settings from xxx.pg.json file for default PG_URL
* Better default channel name
* Implement observe changes

# Acknowledgements
* Creating this module would not have been possible without Ben Green's
[numtel/pg-live-select](https://github.com/numtel/pg-live-select) module.
Thanks for creating it!
