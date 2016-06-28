Template.leaderboard.helpers({
  players: function () {
    return Players.find({}, { sort: { score: -1, name: 1 } });
  },
  selectedName: function () {
    var player = Players.findOne({id: Session.get("selectedPlayer") });
    console.log(player);
    return player && player.name;
  }
});

Template.leaderboard.events({
  'click .inc': function () {
    Meteor.call('incScore', Session.get("selectedPlayer"), 5, (err, result) => {
      console.log("hier");
      if(err) console.log(err);
    });
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
