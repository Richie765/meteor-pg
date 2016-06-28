Meteor.methods({
  'incScore': function(id, amount){
    // Ensure arguments validate
    check(id, Number);
    check(amount, Number);

    // Obtain a client from the pool
    pg.connect(CONN_STR, function(error, client, done) {
      if(error) throw error;

      // Perform query
      client.query(
        'UPDATE players SET score = score + $1 WHERE id = $2',
        [ amount, id ],
        function(error, result) {
          // Release client back into pool
          done();

          if(error) throw error;
        }
      )
    });
  }
});
