<?php

require_once("thompson-sampling.php");
require_once("epsilon-greedy.php");

class ABTestAlgorithms {
    public static function get_algorithms() {
        return [
            "epsilon-greedy" => "Epsilon-Greedy",
            "ucb" => "Upper Confidence Bound",
            "thompson-sampling" => "Thompson Sampling",
        ];
    }
}

class ABTestOption {
    private $id;
    private $test_id;
    private $container;
    private $value;
    private $wins;
    private $views;

    public function __construct($id = null, $test_id = null, $container = null, $value = null, $wins = null, $views = null) {
        if ($id != null) {
            $this->id = $id;
        }
        if ($test_id) {
            $this->test_id = $test_id;
        }
        if ($container) {
            $this->container = $container;
        }
        if ($value) {
            $this->value = $value;
        }
        if ($wins) {
            $this->wins = $wins;
        }
        if ($views) {
            $this->views = $views;
        }
    }

    public function get_data() {
        return [
            "id" => intval($this->id),
            "test_id" => intval($this->test_id),
            "container" => $this->container,
            "value" => $this->value,
            "wins" => intval($this->wins),
            "views" => intval($this->views),
        ];
    }

    public function create($test_id, $container, $value, $wins, $views) {
        if (empty($test_id)) {
            throw new Exception("ABTestOption: test_id is empty");
        }
        if (empty($container)) {
            throw new Exception("ABTestOption: container is empty");
        }
        if (empty($value)) {
            throw new Exception("ABTestOption: value is empty");
        }
        $this->test_id = intval($test_id);
        $this->container = (string) $container;
        $this->value = (string) $value;
        if ($wins) {
            $this->wins = intval($wins);
        } else {
            $this->wins = 0;
        }
        if ($views) {
            $this->views = intval($views);
        } else {
            $this->views = 0;
        }
        return $this->save();
    }

    protected function save() {
        global $wpdb;
        $abengine_tests_options_tablename = $wpdb->prefix . "abengine_tests_options";
        if (empty($this->test_id)) {
            throw new Exception("ABTestOption: test_id is empty");
        }
        if (!empty($this->id)) {
            $wpdb->update(
                $abengine_tests_options_tablename,
                [
                    "test_id" => $this->test_id,
                    "container" => $this->container,
                    "value" => $this->value,
                    "wins" => $this->wins,
                    "views" => $this->views,
                ],
                [ "ID" => $this->id ]
            );
        } else {
            $wpdb->insert($abengine_tests_options_tablename, [
                'test_id' => $this->test_id,
                'container' => $this->container,
                'value' => $this->value,
                'wins' => $this->wins,
                'views' => $this->views
            ]);
            $this->id = $wpdb->insert_id;
        }
        return [
            'id' => $this->id,
            'test_id' => $this->test_id,
            'container' => $this->container,
            'value' => $this->value,
            'wins' => $this->wins,
            'views' => $this->views
        ];
    }

    public function record_view() {
        if (empty($this->id)) {
            throw new Exception("ABTestOption: id is empty");
        }
        global $wpdb;
        $abengine_tests_options_tablename = $wpdb->prefix . "abengine_tests_options";
        return $wpdb->query("UPDATE $abengine_tests_options_tablename SET views = views + 1 WHERE ID = " . $this->id);
    }

    public function record_win() {
        if (empty($this->id)) {
            throw new Exception("ABTestOption: id is empty");
        }
        global $wpdb;
        $abengine_tests_options_tablename = $wpdb->prefix . "abengine_tests_options";
        return $wpdb->query("UPDATE $abengine_tests_options_tablename SET wins = wins + 1 WHERE ID = " . $this->id);
    }
}

class ABTest {
    private $id;
    private $name;
    private $user_id;
    private $options = [];
    private $algorithm;
    private $created_at;
    private $updated_at;
    private $algorithms;
    
    public function __construct($id = null) {
        $this->algorithms = ABTestAlgorithms::get_algorithms();
        if ($id) {
            $this->id = $id;
            $this->load($id);
        }
    }

    public function get_data() {
        return [
            "id" => $this->id,
            "name" => $this->name,
            "user_id" => $this->user_id,
            "options" => $this->options,
            "algorithm" => $this->algorithm,
            "created_at" => $this->created_at,
            "updated_at" => $this->updated_at,
        ];
    }

    public function load($id) {
        global $wpdb;
        $abengine_tests_tablename = $wpdb->prefix . "abengine_tests";
        $abengine_tests_options_tablename = $wpdb->prefix . "abengine_tests_options";
        $test = $wpdb->get_row("SELECT * FROM $abengine_tests_tablename WHERE ID = $id");
        if (!$test) {
            throw new Exception("ABTest: test not found");
        }
        $this->id = intval($test->ID);
        $this->name = $test->name;
        $this->user_id = intval($test->user_id);
        $this->algorithm = $test->algorithm;
        $this->created_at = $test->created_at;
        $this->updated_at = $test->updated_at;
        $options = $wpdb->get_results("SELECT * FROM $abengine_tests_options_tablename WHERE test_id = $this->id");
        foreach ($options as $option) {
            $option = new ABTestOption($option->ID, $this->id, $option->container, $option->value, $option->wins, $option->views);
            $this->options[] = $option->get_data();
        }
    }

    public function create($name, $user_id, $options, $algorithm) {
        if (!is_array($options)) {
            throw new Exception("ABTest: options is not an array");
        }
        $this->name = $name ? $name : "";
        $this->user_id = $user_id;
        $this->options = $options;
        $this->algorithm =  $algorithm ? $algorithm : "epsilon-greedy";
        if (!in_array($this->algorithm, array_keys($this->algorithms))) {
            throw new Exception("ABTest: algorithm is invalid, must be one of " . implode(", ", array_keys($this->algorithms)));
        }
        $this->created_at = date('Y-m-d H:i:s');
        $this->updated_at = date('Y-m-d H:i:s');
        $test_id = $this->save();
        return $test_id;
    }

    protected function save() {
        global $wpdb;
        $abengine_tests_tablename = $wpdb->prefix . "abengine_tests";
        $wpdb->insert($abengine_tests_tablename, [
            'name' => $this->name,
            'user_id' => $this->user_id,
            'algorithm' => $this->algorithm,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at
        ]);
        $this->test_id = $wpdb->insert_id;
        $options = [];
        foreach($this->options as $option) {
            $option_obj = (object) $option;
            $ab_test_option = new ABTestOption();
            $options[] = $ab_test_option->create($this->test_id, $option_obj->container, $option_obj->value, $option_obj->wins, $option_obj->views);
        }
        return [
            'test_id' => $this->test_id,
            'name' => $this->name,
            'user_id' => $this->user_id,
            'algorithm' => $this->algorithm,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'options' => $options
        ];
    }

    public function get_winner() {
        if (empty($this->options)) {
            throw new Exception("ABTest: options is empty");
        }
        if (empty($this->algorithm)) {
            throw new Exception("ABTest: algorithm is empty");
        }
        // $algorithm = $this->algorithms[$this->algorithm];
        $arms = [];
        foreach ($this->options as $option) {
            $arms[$option["id"]] = [$option["wins"], $option["views"]];
        }
        $winner = ThompsonSampling::get_winner($arms);
        return array_filter($this->options, function($option) use ($winner) {
            return $option["id"] == $winner;
        });
    }

    public function serve() {
        if (empty($this->options)) {
            throw new Exception("ABTest: options is empty");
        }
        if (empty($this->algorithm)) {
            throw new Exception("ABTest: algorithm is empty");
        }
        $arms = [];
        foreach ($this->options as $option) {
            $arms[$option["id"]] = [$option["wins"], $option["views"]];
        }
        $winner = ThompsonSampling::get_winner($arms);
        $arm = new ABTestOption($winner, $this->id);
        $arm->record_view();
        return array_filter($this->options, function($option) use ($winner) {
            return $option["id"] == $winner;
        });
    }
}