CREATE TABLE `authors`
(
    `author_id`     int unsigned                           NOT NULL AUTO_INCREMENT,
    `firstname`     varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
    `lastname`      varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
    `last_modified` timestamp                              NULL     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created`       timestamp                              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`author_id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `books`
(
    `book_id`       int unsigned NOT NULL AUTO_INCREMENT,
    `title`         varchar(150) NOT NULL,
    `subtitle`      varchar(150)          DEFAULT NULL,
    `description`   varchar(2000)         DEFAULT NULL,
    `isbn_10`       varchar(10)           DEFAULT NULL,
    `isbn_13`       varchar(13)           DEFAULT NULL,
    `page_count`    int unsigned          DEFAULT NULL,
    `author_id`     int unsigned          DEFAULT NULL,
    `thumbnail_url` varchar(255)          DEFAULT NULL,
    `created`       timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified` timestamp    NULL     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`book_id`),
    KEY `author_id` (`author_id`),
    CONSTRAINT `books_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `authors` (`author_id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `database_version`
(
    `version_id`  int unsigned NOT NULL AUTO_INCREMENT,
    `script_name` varchar(50)  NOT NULL,
    `created`     timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`version_id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

INSERT INTO database_version(script_name) VALUES ('1_1.sql');
