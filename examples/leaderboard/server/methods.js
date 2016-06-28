// import { db } from 'meteor-pg-live';
import { db } from '../imports/pg-live';

Meteor.methods({
  'incScore': function(id, amount){
    // Validate arguments

    check(id, Number);
    check(amount, Number);

    // Perform query

    let sql = `
      UPDATE players
      SET score = score + $1
      WHERE id = $2
    `;

    // NOTE Query is executed asynchroniously. This means:
    // * Thrown errors won't be sent to the client and won't be shown on the server
    //   either.
    // * You can't return a result from pg this way.
    // * Perhaps these limitations can be solved with fibers later on.

    db.none(sql, [ amount, id ])
      .catch(err => {
        console.log(err); // Extra logging otherwise we won't know of any errors
        throw new Meteor.Error(err);
      });
  }
});
