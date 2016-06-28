Template.leaderboard.onCreated(function () {
  this.subscribe('allPlayers');
  this.subscribe('playerScore', 'Maxwell');

  this.autorun(function() {
    let player = PlayerScore.findOne({});
    console.log(player);
  });
});

Template.leaderboard.helpers({
  players: function () {
    return Players.find({}, { sort: { score: -1, name: 1 } });
  },

  selectedName: function () {
    let player = Players.findOne(Session.get("selectedPlayer"));
    return player && player.name;
  }
});

Template.leaderboard.events({
  'click .inc': function () {
    Meteor.call('incScore', Session.get("selectedPlayer"), 5);
  }
});

Template.player.helpers({
  selected: function () {
    return Session.equals("selectedPlayer", this._id) ? "selected" : '';
  }
});

Template.player.events({
  'click': function () {
    Session.set("selectedPlayer", this._id);
  }
});
