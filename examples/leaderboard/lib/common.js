// Meteor Leaderboard Example with PostgreSQL backend

// Data is read from select statements published by server (further down)
players = new PgSubscription('allPlayers');

// Extra (not used anywhere on the app UI) subscription to display different
//  use case with arguments and manually authored triggers
myScore = new PgSubscription('playerScore', 'Maxwell');

myScore.addEventListener('updated', function(diff, data){
  data.length && console.log(data[0].score);
});
