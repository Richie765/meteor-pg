# Notes

Every query must have a \_id field that must be unique for the resultset.
For simple queries, this can be the PK. For multi-table queries, it can be
the concatenation of multiple PK's. Note, the \_id just has to uniquely
identify the row so you don't always have to include the PK's of all the
tables involved.

The order of the records in the collection on the client-side is not the same
order as the query result. Therefor, you'll have to order the results using
the find method on the collection on the client.

# Todo
* Implement fibers in methods
