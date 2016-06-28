// Define this collection only on the client-side
// as on the server the data isn't coming from Mongo.

Players = new Mongo.Collection('players');
