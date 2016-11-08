# @richie765/meteor-pg
This package allows you to use PostgreSQL reactively with Meteor as seamlessly
as possible.

It provides a method to publish PostgreSQL queries on the server. The query
result will be available in a Minimongo collection, reactively, on the client-side.
The collection can be used in the usual way.

Data modifications (UPDATE, INSERT) can only be made from the server side.
There are methods available that you can call from your server-side methods.

It has been used in a small scale production environment quite successfully.

# Installation
```bash
meteor npm install @richie765/meteor-pg --save

# also needed

npm install babel-runtime --save
```

# Configuration
There are two environment variables used to configure your database connection.

```bash
export PG_SQL=postgres://user:password@host:port/db
export PG_CHANNEL=your_channel
meteor
```

The channel is used for LISTEN/NOTIFY on the PostgreSQL database and cannot
be used by more than one application on the same database.

# Initialization
On the server side, import the package early on to establish the database connection. Your `/server/main.js` file would be a good place to do this.
```javascript
import '@richie765/meteor-pg';
```

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
mpg.select(collection, query, params, triggers);
```

collection: The name of the collection on the client-side.

query, params, triggers: see [richie765/pg-query-observer](https://github.com/richie765/pg-query-observer).

```javascript
// Server side

import mpg from '@richie765/meteor-pg';

Meteor.publish('allPlayers', function() {
  let sql = `
    SELECT id AS _id, *
    FROM players
    ORDER BY score DESC
  `;

  function triggers() {
    // This function is rather important.
    // For now, just trigger any change
    return true;
  }

  return mpg.select('players', sql, undefined, triggers);
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

import mpg from '@richie765/meteor-pg';

Meteor.methods({
  'incScore': function(id, amount){
    let sql = `
      UPDATE players
      SET score = score + $[amount]
      WHERE id = $[id]
    `;

    mpg.none(sql, { id, amount });
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

# To do, known issues
* There is some flicker when using latancy compensation (client-side methods).
* MongoDB is still required for Accounts (pull requests welcome)
