CREATE TABLE IF NOT EXISTS third_party_api_settings
(
    api_id         SERIAL PRIMARY KEY,
    api_name       varchar(50) NOT NULL,
    enabled        BOOLEAN NOT NULL,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);;

INSERT INTO third_party_api_settings(api_name, enabled)
VALUES ('google_books', 'true'),
       ('open_library', 'true');;

INSERT INTO database_version(script_name)
VALUES ('1_3.sql');;
