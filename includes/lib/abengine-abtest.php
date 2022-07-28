<?php

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
    private $test_id;
    private $container;
    private $value;
    private $wins;
    private $losses;

    public function create($test_id, $container, $value, $wins, $losses) {
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
        if ($losses) {
            $this->losses = intval($losses);
        } else {
            $this->losses = 0;
        }
        $this->save();
    }

    protected function save() {
        global $wpdb;
        $abengine_tests_options_tablename = $wpdb->prefix . "abengine_tests_options";
        $wpdb->insert($abengine_tests_options_tablename, [
            'test_id' => $this->test_id,
            'container' => $this->container,
            'value' => $this->value,
            'wins' => $this->wins,
            'losses' => $this->losses
        ]);
    }
}

class ABTest {
    private $uid;
    private $name;
    private $user_id;
    private $options = [];
    private $algorithm;
    private $created_at;
    private $updated_at;
    private $algorithms;
    
    public function __construct() {
        $this->algorithms = ABTestAlgorithms::get_algorithms();
    }

    public function create($uid, $name, $user_id, $options, $algorithm) {
        if (!is_array($options)) {
            throw new Exception("ABTest: options is not an array");
        }
        if (empty($uid)) {
            throw new Exception("ABTest: uid is empty");
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
        foreach($this->options as $option) {
            $option_obj = (object) $option;
            $ab_test_option = new ABTestOption();
            $ab_test_option->create($this->test_id, $option_obj->container, $option_obj->value, $option_obj->wins, $option_obj->losses);
        }
        return $this->test_id;
    }
}