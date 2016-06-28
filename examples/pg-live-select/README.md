# pg-live-select-example

This example is based on the example of [numtel/pg-live-select](https://github.com/numtel/pg-live-select).
It is useful here to figure out the details of using that module.

## Getting started with the example

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
