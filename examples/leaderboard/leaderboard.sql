CREATE TABLE players
(
  id serial NOT NULL,
  name character varying(50),
  score integer NOT NULL,
  CONSTRAINT players_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);

INSERT INTO players (name, score) VALUES
  ('Kepler', 40),('Leibniz',50),('Maxwell',60),('Planck',70);
