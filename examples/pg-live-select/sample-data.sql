
CREATE TABLE assignments (
    id integer NOT NULL,
    class_id integer NOT NULL,
    name character varying(50),
    value integer NOT NULL
);

CREATE SEQUENCE assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE assignments_id_seq OWNED BY assignments.id;

CREATE TABLE scores (
    id integer NOT NULL,
    assignment_id integer NOT NULL,
    student_id integer NOT NULL,
    score integer NOT NULL
);

CREATE SEQUENCE scores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE scores_id_seq OWNED BY scores.id;

CREATE TABLE students (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);

CREATE SEQUENCE students_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE students_id_seq OWNED BY students.id;

ALTER TABLE ONLY assignments ALTER COLUMN id SET DEFAULT nextval('assignments_id_seq'::regclass);

ALTER TABLE ONLY scores ALTER COLUMN id SET DEFAULT nextval('scores_id_seq'::regclass);

ALTER TABLE ONLY students ALTER COLUMN id SET DEFAULT nextval('students_id_seq'::regclass);

COPY assignments (id, class_id, name, value) FROM stdin;
1 1 Homework  10
2 1 Test  100
3 2 Art Project 30
4 1 HW 2  10
5 1 HW 3  10
6 1 HW 4  10
\.


SELECT pg_catalog.setval('assignments_id_seq', 6, true);

COPY scores (id, assignment_id, student_id, score) FROM stdin;
1 1 1 9
2 1 2 8
3 2 1 75
4 2 2 77
5 2 3 50
6 3 1 20
10  4 1 7
11  5 1 8
\.

SELECT pg_catalog.setval('scores_id_seq', 11, true);

COPY students (id, name) FROM stdin;
1 John Doe
2 Larry Loe
3 Oklahoma
\.


SELECT pg_catalog.setval('students_id_seq', 2, true);

ALTER TABLE ONLY assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY scores
    ADD CONSTRAINT scores_pkey PRIMARY KEY (id);

ALTER TABLE ONLY students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


