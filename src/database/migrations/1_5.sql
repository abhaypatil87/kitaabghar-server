CREATE TABLE IF NOT EXISTS user_libraries
(
    library_id      SERIAL PRIMARY KEY,
    user_id         int NOT NULL,
    last_modified   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users
);;

ALTER TABLE
  books ADD COLUMN library_id int;;

ALTER TABLE
  books ADD FOREIGN KEY (library_id) REFERENCES user_libraries;;

INSERT INTO database_version(script_name)
VALUES ('1_5.sql');;
