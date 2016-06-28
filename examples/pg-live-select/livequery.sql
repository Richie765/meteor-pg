SELECT
  students.name  AS student_name,
  students.id    AS student_id,
  assignments.id AS assignment_id,
  scores.id      AS score_id,
  assignments.name,
  assignments.value,
  scores.score
FROM
  scores
INNER JOIN assignments ON
  (assignments.id = scores.assignment_id)
INNER JOIN students ON
  (students.id = scores.student_id)
WHERE
  assignments.class_id = $1
ORDER BY
  score_id ASC
