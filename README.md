# Notes

Every query must have a \_id field that must be unique for the resultset.
For simple queries, this can be the PK. For multi-table queries, it can be
the concatenation of multiple PK's. Note, the \_id just has to uniquely
identify the row so you don't always have to include the PK's of all the
tables involved.

# Todo
* Implement fibers in methods
