// Update this connection string to match your configuration!
// When using an externally configured PostgreSQL server, the default port
// is 5432.

CONN_STR =
  'postgres://' + process.env.USER + ':numtel@127.0.0.1:5438/postgres';

liveDb = new LivePg(CONN_STR, 'leaderboard_example');

var closeAndExit = function() {
  // Cleanup removes triggers and functions used to transmit updates
  liveDb.cleanup(process.exit);
};
// Close connections on hot code push
process.on('SIGTERM', closeAndExit);
// Close connections on exit (ctrl + c)
process.on('SIGINT', closeAndExit);
