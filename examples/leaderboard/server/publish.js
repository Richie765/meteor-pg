Meteor.publish('allPlayers', function(){
  // No triggers specified, the package will automatically refresh the
  // query on any change to the dependent tables (just players in this case).
  return liveDb.select('SELECT * FROM players ORDER BY score DESC');
});

Meteor.publish('playerScore', function(name){
  // Parameter array used and a manually specified trigger to only refresh
  // the result set when the row changing on the players table matches the
  // name argument passed to the publish function.
  return liveDb.select(
    'SELECT id, score FROM players WHERE name = $1', [ name ],
    {
      'players': function(row) {
        return row.name === name;
      }
    }
  );
});
