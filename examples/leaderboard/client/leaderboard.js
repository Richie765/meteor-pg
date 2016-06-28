Template.leaderboard.helpers({
  players: function () {
    return players.reactive();
  },
  
  selectedName: function () {
    players.depend();
    var player = players.filter(function(player){
      return player.id === Session.get("selectedPlayer");
    });
    return player.length && player[0].name;
  }
});

Template.leaderboard.events({
  'click .inc': function () {
    Meteor.call('incScore', Session.get("selectedPlayer"), 5);
  }
});

Template.player.helpers({
  selected: function () {
    return Session.equals("selectedPlayer", this.id) ? "selected" : '';
  }
});

Template.player.events({
  'click': function () {
    Session.set("selectedPlayer", this.id);
  }
});
