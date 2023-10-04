<?php

class ABEngineTitlesAdmin {
    public function __construct() {
        //#abenginePostTitles
        // Check that we have enabled ABEngine for this post type

        // Insert an empty div with id abenginePostTitles under the title field
        add_action('edit_form_after_title', array($this, 'add_abengine_post_titles_div'), 1);

        // Load our scripts
        add_action('admin_enqueue_scripts', array($this, 'enqueue_scripts'));
    }

    public function add_abengine_post_titles_div() {
        ?>
        <div id="abenginePostTitles"></div>
        <?php
    }

    public function enqueue_scripts() {
        wp_enqueue_script('abengine-titles-admin', plugin_dir_url(__FILE__) . "../../../components/titles/dist/abengine-titles.js", array( 'wp-api' ), ABENGINE_SCRIPT_VERSION, true);
        wp_enqueue_style('abengine-titles-admin', plugin_dir_url(__FILE__) . "../../../components/titles/dist/abengine-titles.css", array(), ABENGINE_SCRIPT_VERSION, 'all');
    }
}