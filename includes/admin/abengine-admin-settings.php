<?php
class ABEngineAdminSettings {
    private $options = [
        
    ];
    
    public function __construct() {
        add_action('admin_menu', [ $this, 'settings_page' ]);
        add_action('admin_init', [ $this, 'register_settings' ]);
    }

    public function settings_page() {
        add_submenu_page(
            'abengine',
			'ABEngine Settings',
			'Settings',
			'manage_options',
			'abengine',
			[ $this, 'abengine_settings' ]
		);
    }

    public function abengine_settings() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        
        require_once plugin_dir_path( dirname( __FILE__ ) ).'admin/views/settings.php';
    }

    public function register_settings() {
        foreach($this->options as $option) {
            register_setting( 'abengine-settings-group', $option );
        }
    }
}