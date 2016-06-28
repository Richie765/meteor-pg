// Define these collections only on the client-side
// as on the server the data isn't coming from Mongo.

Players = new Mongo.Collection('players');
PlayerScore = new Mongo.Collection('playerScore');
