<?php

require_once(plugin_dir_path( dirname( __FILE__ ) ).'lib/abengine.php');

class ABEngineClient {
    public function __construct() {
        $this->enqueue_scripts();
        add_filter( 'the_title', [$this, "title_hook"] );
    }

    public function enqueue_scripts() {
        wp_enqueue_script( "abengine-client", plugin_dir_url(__FILE__) . "../../dist/abengine-client.js", ['jquery'], ABENGINE_SCRIPT_VERSION, true );
        wp_localize_script( "abengine-client", "abengine", array(
            "restUrl" => rest_url('/abengine/v1/'),
            "restNonce" => wp_create_nonce('wp_rest'),
            "abengine_server" => get_option('abengine_server', ''),
        ) );
        wp_enqueue_style( "abengine-client", plugin_dir_url(__FILE__) . "../../dist/abengine-client.css", [], ABENGINE_SCRIPT_VERSION, "all");
    }

    public function title_hook( $title, $post_id = null ) {
        if (empty($post_id)) {
            $post_id = get_the_ID();
        }
        if (empty($post_id)) {
            return $title;
        }
        $abtest = get_post_meta( $post_id, 'abengine_title_test', true );
        // print_r($abtest);
        if ( empty( $abtest ) ) {
            return $title;
        }
        if ( is_single() ) {
            $title = "Single: <span class='abengine-text abengine-autowin' data-abengineUid='headlineengine-$post_id' data-abengineId='$abtest'>" . $title . "</span>";
        } else {
            $title = "List: <span class='abengine-text abengine-experiment' data-abengineUid='headlineengine-$post_id' data-abengineId='$abtest'>" . $title . "</span>";
        }
        return $title;
    }
}