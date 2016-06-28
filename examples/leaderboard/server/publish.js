// import { PgSelect } from 'meteor-pg-live';
import { PgSelect } from '../imports/pg-live';

Meteor.publish('allPlayers', function() {
  let sql = 'SELECT id AS _id, * FROM players ORDER BY score DESC';

  PgSelect(this, 'players', sql);
});

Meteor.publish('playerScore', function(name) {
  // Get the score of a particular player.
  // Use a trigger so only changes to that player are tracked.

  let sql = 'SELECT id as _id, name, score FROM players WHERE name = $1';

  PgSelect(this, 'playerScore', sql, [ name ],
    {
      'players': function(row) {
        return row.name === name;
      }
    }
  );
});
