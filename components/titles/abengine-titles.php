<?php

require_once(plugin_dir_path( __FILE__ ) . "api/abengine-titles-api.php");
require_once(plugin_dir_path( __FILE__ ) . "admin/abengine-titles-admin.php");

class ABEngineTitles {
    public function __construct() {
        if (!get_option('abengine_enable_titles', 0)) {
            return;
        }
        new ABEngineTitlesAPI();
        add_action("admin_init", [$this, "admin_init"]);
    }

    public function admin_init() {
        new ABEngineTitlesAdmin();
    }
}