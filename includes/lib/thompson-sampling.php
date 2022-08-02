<?php
require_once(dirname(__DIR__) . '/../vendor/autoload.php');
use gburtini\Distributions\Beta;

class ThompsonSampling {
    /*
     series ([wins, views]):
     [
        ["a" => [3,10]],
        ["b" => [2,4]],
        ["c" => [6,110]]
     ]
     */
    public static function get_winner($series) {
        $n = sizeof($series); // Number of arms
        $max = 0;
        $thetas = [];
        foreach($series as $arm => $values) {
            $successes = $values[0] + 1; // Number of wins
            $views = $values[1] + 1; // Number of views
            $failures = $views - $successes + 1; // Number of failures
            $beta = new Beta($successes, $failures);
            $theta = $beta->rand();
            $thetas[$arm] = $theta;
            if ($theta > $max) {
                $max = $theta;
                $selected_arm = $arm;
            }
        }
        return $selected_arm;
    }
}