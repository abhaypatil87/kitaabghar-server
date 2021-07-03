ALTER TABLE
  books ALTER COLUMN description TYPE varchar(4000);;

INSERT INTO database_version(script_name)
VALUES ('1_2.sql');;
