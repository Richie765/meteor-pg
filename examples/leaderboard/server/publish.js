Meteor.publish('allPlayers', function() {
  var self = this;

  var players = [
    { name: 'Kepler', score: 40 },
    { name: 'Leibniz', score: 50 },
    { name: 'Maxwell', score: 60 },
    { name: 'Planck', score: 70 },
  ];

  _.each(players, function(player) {
    self.added('players', Random.id(), player);
  });

  self.ready();
});
