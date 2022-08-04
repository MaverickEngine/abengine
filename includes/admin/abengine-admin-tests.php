<?php
class ABEngineAdminTests {
    private $options = [
        
    ];

    public function __construct() {
        add_action('admin_menu', [ $this, 'tests_page' ]);
    }

    public function tests_page() {
        add_submenu_page(
            'abengine',
			'ABEngine Tests',
			'Tests',
			'manage_options',
			'abengine_tests',
			[ $this, 'abengine_tests' ]
		);
    }

    public function abengine_settings() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        
        require_once plugin_dir_path( dirname( __FILE__ ) ).'admin/views/tests.php';
    }
}