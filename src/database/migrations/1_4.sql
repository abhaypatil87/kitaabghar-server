CREATE TABLE IF NOT EXISTS externals
(
    external_id     SERIAL PRIMARY KEY,
    external_type   varchar(50) NOT NULL,
    last_modified   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS users
(
    user_id         SERIAL PRIMARY KEY,
    first_name      varchar(50) NOT NULL,
    last_name       varchar(100) NOT NULL,
    email           varchar(200) NOT NULL,
    external_id     int DEFAULT NULL,
    password        varchar(1024),
    image_url       varchar(1024) DEFAULT NULL;
    last_modified   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (external_id) REFERENCES externals
);;

CREATE TABLE IF NOT EXISTS login_history
(
    user_id         INTEGER NOT NULL,
    external_id     INTEGER NOT NULL,
    ip_address      VARCHAR(64) NOT NULL,
    created         TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (external_id) REFERENCES externals(external_id)
);;

INSERT INTO externals(external_type)
values ('GOOGLE');

INSERT INTO database_version(script_name)
values ('1_4.sql');;
