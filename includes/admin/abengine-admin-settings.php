<?php
class ABEngineAdminSettings {
    private $options = [
        "abengine_server",
        "abengine_apikey",
        "abengine_api_server",
        "abengine_user_id",
    ];
    
    public function __construct() {
        add_action('admin_menu', [ $this, 'menu' ]);
        add_action('admin_init', [ $this, 'register_settings' ]);
    }

    public function menu() {
        add_submenu_page('options-general.php', 'ABEngine', 'ABEngine', 'manage_categories', "abengine-settings", [$this, "abengine_settings"] );
    }

    public function abengine_settings() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.'));
        }
        if (defined('ABENGINE_APIKEY')) {
            update_option('abengine_apikey', '');
        }
        if (defined('ABENGINE_APIKEY')) {
            $abengine_apikey = ABENGINE_APIKEY;
        } else {
            $abengine_apikey = get_option('abengine_apikey');
        }
        if (defined('ABENGINE_USER_ID')) {
            update_option('abengine_user_id', '');
        }
        if (defined('ABENGINE_USER_ID')) {
            $abengine_user_id = ABENGINE_USER_ID;
        } else {
            $abengine_user_id = get_option('abengine_user_id');
        }
        require_once plugin_dir_path( dirname( __FILE__ ) ).'admin/views/settings.php';
    }

    public function register_settings() {
        foreach($this->options as $option) {
            register_setting( 'abengine-settings-group', $option );
        }
    }
}