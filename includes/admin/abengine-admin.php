<?php

class ABEngineAdmin {

    function __construct() {
        add_action('admin_menu', [ $this, 'menu' ]);
        add_action('admin_init', [ $this, 'scripts' ]);
        require_once('abengine-admin-settings.php' );
        new ABEngineAdminSettings();
    }

    function menu() {
        add_menu_page(
            'ABEngine',
			'ABEngine',
			'manage_options',
			'abengine',
			null,
            $this->get_plugin_icon(),
            30
        );
    }

    private function get_plugin_icon() {
		$svg_icon_file = plugin_dir_path( dirname( __FILE__ ) ).'/assets/mavengine-icon-black.svg';
		if (!file_exists($svg_icon_file)) {
			return false;
		}
		return 'data:image/svg+xml;base64,' . base64_encode(file_get_contents($svg_icon_file));
	}

    public function scripts() {
        if (get_option('abengine_developer_mode')) {
            wp_enqueue_script( "abengine-admin-script", plugin_dir_url(__FILE__) . "../../dist/abengine-admin.js", [], HEADLINEENGINE_SCRIPT_VERSION, true );
        } else {
            wp_enqueue_script( "abengine-admin-script", plugin_dir_url(__FILE__) . "../../dist/abengine-admin.js", [], HEADLINEENGINE_SCRIPT_VERSION, true );
        }
        wp_add_inline_script( "abengine-admin-script", "var abengine_powerwords_url = '" . plugin_dir_url( __DIR__ ) . "assets/powerwords.txt';", "before" );
    }
}