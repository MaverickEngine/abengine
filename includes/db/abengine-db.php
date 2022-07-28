<?php

class ABEngineDB {
    public function setup() {
        $abengine_db_version = get_option("abengine_db_version", 0 );
        if ((string) $abengine_db_version == (string) ABENGINE_DB_VERSION) {
            return;
        }
        global $wpdb;
        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
        $charset_collate = $wpdb->get_charset_collate();

        $abengine_tests_tablename = $wpdb->prefix . "abengine_tests";
        $abengine_tests_sql = "CREATE TABLE $abengine_tests_tablename (
            ID mediumint(9) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            created_at datetime DEFAULT NOW() NOT NULL,
            updated_at datetime DEFAULT NOW() NOT NULL,
            name varchar(255) NOT NULL,
            user_id mediumint(9) NOT NULL,
            algorithm varchar(255) NOT NULL
        ) $charset_collate;";
        dbDelta( $abengine_tests_sql );

        $abengine_tests_options_tablename = $wpdb->prefix . "abengine_tests_options";
        $abengine_tests_options_sql = "CREATE TABLE $abengine_tests_options_tablename (
            ID mediumint(9) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            test_id mediumint(9) NOT NULL,
            container varchar(255) NOT NULL,
            value varchar(255) NOT NULL,
            wins mediumint(9) NOT NULL,
            losses mediumint(9) NOT NULL,
            UNIQUE KEY test_id (test_id, container, value)
        ) $charset_collate;";
        dbDelta( $abengine_tests_options_sql );
        update_option( "abengine_db_version", ABENGINE_DB_VERSION );
    }
}