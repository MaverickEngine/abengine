import { IABEngineScorer } from "./abengine_score_interface";
import calc_total_score from "../libs/calc_total_score";
import ABEngineLang from "../libs/abengine_lang";

declare var abengine_reading_grade_range_min;
declare var abengine_reading_grade_range_max;
declare var abengine_reading_grade_target;
export default class ReadabiltyScorer implements IABEngineScorer {
    reading_grade_range: [number, number];
    reading_grade_target: number;
    reading_grade_range_min: number;
    reading_grade_range_max: number;

    constructor() {
        this.reading_grade_range = [abengine_reading_grade_range_min || 45, abengine_reading_grade_range_max || 90];
        this.reading_grade_target = abengine_reading_grade_target || 55;
    }

    async init() {
        return;
    }

    message(score) {
        if (score < this.reading_grade_range[0]) {
            return `Too simple, use more complex words (Grade ${ score })`;
        } else if (score > this.reading_grade_range[1]) {
            return `Too complex, use less complex words (Grade ${ score })`;
        } else if (score === this.reading_grade_target) {
            return `Perfect (Grade ${ score })`;
        }
        return `Good (Grade ${ score })`;
    }

    score(headline: string) {
        const ease_score = ABEngineLang.fleschKincaidGradeLevel(headline);
        const score = calc_total_score(ease_score, this.reading_grade_target, this.reading_grade_range);
        const message = this.message(ease_score);
        const pass = headline.length >= this.reading_grade_range[0] && headline.length <= this.reading_grade_range[1];
        return { name: "Reading Grade", score, message, pass };
    }
}