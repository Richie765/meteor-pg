# meteor-pg
This package allows you to use PostgreSQL reactively with Meteor as seamlessly
as possible.

It provides a method to publish PostgreSQL queries on the server. The query
result will be available reactively on the client in a Minimongo collection.
The collection can be used in the usual way.

Data modifications (UPDATE, INSERT) can only be made from the server side.
There are methods available that you can call from your server-side methods.

It has been used in a small scale production environment quite successfully.

For a full working example take a look at: https://github.com/Richie765/meteor-pg-leaderboard

Requires PostgresSQL version 9.3 or above.

# Installation
```bash
meteor npm install meteor-pg --save
```

# Configuration
There are two environment variables used to configure your database connection.

```bash
export PG_URL=postgres://user:password@host:port/db
export PG_CHANNEL=your_channel
meteor run
```

The channel is used for LISTEN/NOTIFY on the PostgreSQL database and cannot
be used by more than one application on the same database.

# Initialization
On the server side, import the package early on to establish the database connection. Your `/server/main.js` file would be a good place to do this.
```javascript
import 'meteor-pg';
```

# Usage - publication
Only use this for read-only SELECT queries that you want to be reactive. For non-reactive
(SELECT) queries you can use a method.

Within a publish function on the server:
```javascript
return mpg.select(collection, query, params, triggers);
```

Parameter | Description
--------- | -----------
`collection` | The name of the Minimongo collection where the results will be stored on the client-side.
`query` | SELECT query to run and observe. May contain placeholders following `pg-promise`. Each row must contain a unique \_id field as described below.
`params` | The parameters to the query, following `pg-promise`. Single values will be `$1`. Array elements will be `$1`..`$n`. Object properties will be `$*property*` where `**` is one of `()`, `[]`, `{}` or `//`. See `pg-promise` for details.
`triggers` | function(change). The trigger function, see below.


## Unique \_id field

Your query must always return an `_id` field which uniquely identifies
each row returned. This is needed so that the changed rows can be identified.
For simple queries, this could just be an alias to the PK.

For multi-table queries, this could be a combination of different PK's, eg:

```sql
SELECT CONCAT(userid, '-', taskid) AS _id, * FROM user, task;
```

This does not mean you have to include the PK's of all the tables involved.
You just need to uniquely identify each row returned.


## triggers function

This function will be called whenever there is a change to one of the underlying tables of the query.
You should determine if this change requires a rerun of the query. If so, you should return `true`.

One parameter is passed, `change`. It contains the following fields:

Field | Description
-------------- | -----------
`table` | String, name of the table that changed. ***This will always be in lowercase.***
`insert` | For INSERT, `true`
`delete` | For DELETE, `true`
`update` | For UPDATE, an object that contains the old and new values of each changed column. If a column `score` changed from 10 to 20, `change.update.score.from` would be 10 and `change.update.score.to` would be 20.
`row` | The row values, for UPDATE, the NEW row values
`old` | For UPDATE, the OLD row values

ES6 syntax makes it easy to write your trigger function, e.g.:

```javascript
function trigger({ table, row }) {
  if(table === 'user' && row.name === 'name') return true;
  if(table === 'task' && row.status === 'completed') return true;
}
```

## Example - publication
```javascript
// Server side

import mpg from 'meteor-pg';

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

# Usage - methods

The `mpg` object provides the following methods that you can call within your Meteor methods to execute INSERT and UPDATE (and non-reactive SELECT) statements: `query`, `none`, `one`, `many`, `oneOrNone`, `manyOrNone`, `any`, `result`, `stream`, `func`, `proc`, `map`, `each`, `task`, `tx`.

These methods take the same parameters as the methods of [pg-promise](https://github.com/vitaly-t/pg-promise).
The difference is that these are called within a fiber using `Promise.await`, so they wait for the statement to be executed. You can
use the return value directly, it is not a 'promise'.

## Example

```javascript
// Server side

import mpg from 'meteor-pg';

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

# Advanced usage
For running complex queries, involving multiple JOIN's and/or additional processing in JavaScript,
you can use `mpg.table_observer` and `mpg.query_observer` directly. For the documentation see
https://github.com/richie765/pg-table-observer and https://github.com/richie765/pg-query-observer.

If you need direct access to the `pg-promise` object or database handle, they are available as `mpg.pgp` and `mpg.db`.

# To do, known issues
* There is some flicker when using latancy compensation (client-side methods).
* MongoDB is still required for Accounts (pull requests welcome)
