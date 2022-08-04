<?php
class ABEngineClient {
    public function __construct() {
        wp_enqueue_script( "abengine-client", plugin_dir_url(__FILE__) . "../../dist/abengine-client.js", [], ABENGINE_SCRIPT_VERSION, true );
        wp_localize_script( "abengine-client", "abengine", array(
            "restUrl" => rest_url('/abengine/v1/'),
            "restNonce" => wp_create_nonce('wp_rest'),
        ) );
    }
}