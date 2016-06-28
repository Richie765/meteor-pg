// import { PgSelect } from 'meteor-pg-live';
import { PgSelect } from '../imports/pg-live';

Meteor.publish('allPlayers', function() {
  let sql = 'SELECT * FROM players ORDER BY score DESC';
  PgSelect(this, 'players', sql);
});
