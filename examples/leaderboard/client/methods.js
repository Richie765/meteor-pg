// Provide a client side stub for latency compensation
Meteor.methods({
  'incScore': function(id, amount){
    var originalIndex;
    players.forEach(function(player, index){
      if(player.id === id){
        originalIndex = index;
        players[index].score += amount;
        players.changed();
      }
    });

    // Reverse changes if needed (due to resorting) on update
    players.addEventListener('update.incScoreStub', function(index, msg){
      if(originalIndex !== index){
        players[originalIndex].score -= amount;
      }
      players.removeEventListener('update.incScoreStub');
    });
  }
});
