# pg-live-select-example

This example is based on the example of [numtel/pg-live-select](https://github.com/numtel/pg-live-select).
It is used here to reverse engineer the exact functioning of that module.

## Notes
* pg-live-select returns a field '\_index' in each row. This field isn't documented.
It seems this is the order of the records in the result set.
It's value is not constant for a given record, it will change as records
are altered to reflect the order in the record set.
The '\_index' starts with 1 for the first record.
* The row parameter of the trigger receives the full record of the table, including fields
that are not used in the query.
* When the returned records come from the cache, a \_hash key is added. It is a hash
over the data in the record.

## Setup

The source is currently setup to use the same database of the leaderboard example,
so it's good to have that running in a different shell. If you want to use your
own server, you'll have to modify livequery.js and the commands below.

Run the following commands:

```bash
# Download dependent packages
$ npm install

# Load sample dataset into Postgres
psql --port=5438 postgres < sample-data.sql

# Start sample application
node livequery.js

# Connect to the db and modify something

psql --port=5438 postgres
```

## Reset the database
```bash
psql --port=5438 postgres -c "DROP TABLE assignments, scores, students"
psql --port=5438 postgres < sample-data.sql
```

## Data modifications

```sql

-- UPDATE: Issues a removed and an added event with the same _index
UPDATE scores SET score = score + 1 WHERE score > 70;

-- DELETE: Issues 0 or more 'moved' events, followed by 1 or more 'removed' events
DELETE FROM scores WHERE assignment_id = 2 AND student_id = 2;
DELETE FROM scores WHERE score > 70;

-- INSERT: Issues 0 or more 'moved' events, followed by 'added' events
INSERT INTO scores (assignment_id, student_id, score) VALUES (2, 2, 77);
INSERT INTO scores (assignment_id, student_id, score) VALUES (2, 2, 77), (2, 1, 75);

-- COPY: Use QUERY2. Issues a 'removed' event, and then 'copied'
UPDATE scores SET score = 10 where assignment_id = 2 and student_id = 2;
UPDATE scores SET score = 10 where assignment_id = 2 and student_id = 1;
UPDATE scores SET score = 77 where assignment_id = 2 and student_id = 2;
UPDATE scores SET score = 75 where assignment_id = 2 and student_id = 1;

```
