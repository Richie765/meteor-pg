# PostgreSQL Leaderboard Example

The familiar Meteor Leaderboard example modified to use a PostgreSQL backend, reactively!

This example uses the following new package for PostgreSQL integration:

* [numtel:pg](https://github.com/numtel/meteor-pg)

## Quick start

### Using Embedded PostgreSQL Server

The [`numtel:pg-server` Meteor Package](https://github.com/numtel/meteor-pg-server) can be used to embed a PostgreSQL server into your Meteor application, just as Mongo is embedded by default. At this time there is not yet Windows support but Linux (32 and 64 bit) as well as Mac OSX are supported.

When using `numtel:pg-server`, the configuration settings will be read from `leaderboard.pg.json`.

```bash
$ git clone https://github.com/numtel/meteor-pg-leaderboard.git
$ cd meteor-pg-leaderboard

# Install pg-server package
$ meteor add numtel:pg-server

$ meteor
```

### Using Externally Configured PostgreSQL Server

This example requires a PostgresSQL server of version at least 9.3.

```bash
$ git clone https://github.com/numtel/meteor-pg-leaderboard.git
$ cd meteor-pg-leaderboard

# Import sample tables and data into default database (postgres)
$ psql postgres < leaderboard.sql

# Update database connection settings in your favorite editor (line 75)
$ ed leaderboard.js

$ meteor
```
