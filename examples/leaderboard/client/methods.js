// Provide a client side stub for latency compensation

Meteor.methods({
  'incScore': function(id, amount){
    Players.update(id, { $inc: { score: amount } });    
  }
});
