<?php
class EpsilonGreedy {
    public static function recommend($series, $epsilon = 0.25) {
        $k=sizeof($series); // Number of arms
        $n=array_reduce(array_map(function($x) { return sizeof($x); }, $series), function($a, $b) { return $a + $b; }, 0); // Number of plays
        if ($n < $k) { // First round, return next arm in order
            return array_keys($series)[$n];
        }
        $r = mt_rand(0, 1); // Random number
        if ($r < $epsilon) { // Explore
            return array_keys($series)[mt_rand(0, $k-1)];
        } else { // Exploit
            $max = array_keys($series)[0];
            $max_value = $series[$max];
            foreach ($series as $arm => $value) {
                if ($value > $max_value) {
                    $max = $arm;
                    $max_value = $value;
                }
            }
            return $max;
        }
        
    }
}