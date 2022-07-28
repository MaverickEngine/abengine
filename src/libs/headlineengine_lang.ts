// Tools to analyse a headline
import {syllable} from "syllable";

class ABEngineLang {
    static formatSentence(sentence: string): string {
        let s = sentence.replace(/[^a-zA-Z0-9]/g, " ").toLowerCase().trim();
        while(s.includes("  ")) {
            s = s.replace("  ", " ");
        }
        return s;
    }

    static wordCount(sentence: string): number {
        return this.formatSentence(sentence).split(" ").length;
    }

    static syllableCount(sentence: string): number {
        return syllable(this.formatSentence(sentence));
    }

    static sentenceCount(sentence: string): number {
        return (sentence.match(/[^!?.;]+/g) || []).length;
    }

    static fleschReadingEaseScore(sentence: string): number {
        var wordCount = this.wordCount(sentence);
        var sentenceCount = this.sentenceCount(sentence);
        var syllableCount = this.syllableCount(sentence);
        return Math.round(206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount));
    }

    static fleschKincaidGradeLevel(sentence: string): number {
        var wordCount = this.wordCount(sentence);
        var sentenceCount = this.sentenceCount(sentence);
        var syllableCount = this.syllableCount(sentence);
        return Math.round(0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59);
    }

    static letterCount(sentence: string, ignoreSpaces: boolean = false): number {
        if (ignoreSpaces) {
            return this.formatSentence(sentence).replace(/ /g, "").length;
        }
        return this.formatSentence(sentence).length;
    }

}

// Tests
function tests() {
    const headlines = [{
        headline: "10 This is a test  -  TITLE",
        formatted: "10 this is a test title",
        letters: 23,
        words: 6,
        sentences: 1,
        syllables: 6,
        fleschReadingEaseScore: 116,
        fleschKincaidGradeLevel: -1,
    },
    {
        headline: "Eight years of whistle-blower trauma; former SARS executive Johann van Loggerenberg",
        formatted: "eight years of whistle blower trauma former sars executive johann van loggerenberg",
        letters: 82,
        words: 12,
        sentences: 2,
        syllables: 23,
        fleschReadingEaseScore: 39,
        fleschKincaidGradeLevel: 9,
    },
    {
        headline: "This is a multi-sentence test. It has two sentences.",
        formatted: "this is a multi sentence test it has two sentences",
        letters: 50,
        words: 10,
        sentences: 2,
        syllables: 14,
        fleschReadingEaseScore: 83,
        fleschKincaidGradeLevel: 3,
    }];
    for (let headline of headlines) {
        console.assert(ABEngineLang.formatSentence(headline.headline) === headline.formatted, `ABEngineLang.formatSentence failed - expected ${headline.formatted}, got ${ABEngineLang.formatSentence(headline.headline)} for "${headline.headline}"`);

        console.assert(ABEngineLang.wordCount(headline.headline) === headline.words, `ABEngineLang.wordCount failed - expected ${headline.words}, got ${ABEngineLang.wordCount(headline.headline)} for "${headline.headline}"`);

        console.assert(ABEngineLang.syllableCount(headline.headline) === headline.syllables, `ABEngineLang.syllableCount failed - expected ${headline.syllables}, got ${ABEngineLang.syllableCount(headline.headline)} for "${headline.headline}"`);

        console.assert(ABEngineLang.sentenceCount(headline.headline) === headline.sentences, `ABEngineLang.sentenceCount failed - expected ${headline.sentences}, got ${ABEngineLang.sentenceCount(headline.headline)} for "${headline.headline}"`);

        console.assert(ABEngineLang.fleschReadingEaseScore(headline.headline) === headline.fleschReadingEaseScore, `ABEngineLang.fleschReadingEaseScore failed - expected ${headline.fleschReadingEaseScore}, got ${ABEngineLang.fleschReadingEaseScore(headline.headline)} for "${headline.headline}"`);

        console.assert(ABEngineLang.fleschKincaidGradeLevel(headline.headline) === headline.fleschKincaidGradeLevel, `ABEngineLang.fleschKincaidGradeLevel failed - expected ${headline.fleschKincaidGradeLevel}, got ${ABEngineLang.fleschKincaidGradeLevel(headline.headline)} for "${headline.headline}"`);

        console.assert(ABEngineLang.letterCount(headline.headline) === headline.letters, `ABEngineLang.letterCount failed - expected ${headline.letters}, got ${ABEngineLang.letterCount(headline.headline)} for "${headline.headline}"`);
    }
}

tests();

export default ABEngineLang;