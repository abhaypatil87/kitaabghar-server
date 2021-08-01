CREATE TABLE IF NOT EXISTS user_libraries
(
    library_id      SERIAL                   PRIMARY KEY,
    user_id         int                      NOT NULL,
    last_modified   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users
);;

CREATE TABLE IF NOT EXISTS authors
(
    author_id     SERIAL                    PRIMARY KEY,
    first_name     varchar(50)              NOT NULL,
    last_name      varchar(50)              NOT NULL,
    last_modified TIMESTAMP WITH TIME ZONE  DEFAULT CURRENT_TIMESTAMP,
    created       TIMESTAMP WITH TIME ZONE  DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS books
(
    book_id       SERIAL                    PRIMARY KEY,
    title         varchar(150)              NOT NULL,
    subtitle      varchar(150)              DEFAULT NULL,
    description   varchar(4000)             DEFAULT NULL,
    isbn_10       varchar(10)               DEFAULT NULL,
    isbn_13       varchar(13)               DEFAULT NULL,
    page_count    int                       DEFAULT NULL,
    author_id     int                       DEFAULT NULL,
    library_id    int                       NOT NULL,
    thumbnail_url varchar(255)              DEFAULT NULL,
    last_modified TIMESTAMP WITH TIME ZONE  DEFAULT CURRENT_TIMESTAMP,
    created       TIMESTAMP WITH TIME ZONE  DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES authors,
    FOREIGN KEY (library_id) REFERENCES user_libraries
);;

CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS
$$
BEGIN
    NEW.last_modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;;

DROP TRIGGER IF EXISTS authors_last_modified_trig
  ON authors;;
CREATE TRIGGER authors_last_modified_trig
    BEFORE UPDATE
    ON authors
    FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();;


DROP TRIGGER IF EXISTS books_last_modified_trig
  ON books;;
CREATE TRIGGER books_last_modified_trig
    BEFORE UPDATE
    ON books
    FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();;

INSERT INTO database_version(script_name)
VALUES ('1_2.sql');;
