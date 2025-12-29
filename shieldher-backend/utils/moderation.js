const Filter = require('bad-words');
const Sentiment = require('sentiment');

const filter = new Filter();
const sentiment = new Sentiment();

const moderateContent = (text) => {
    if (!text) return { isSafe: true, cleanText: '', score: 0 };

    // Check for profanity
    const isProfane = filter.isProfane(text);
    const cleanText = filter.clean(text);

    // Check sentiment
    const result = sentiment.analyze(text);
    const score = result.score;

    // Determine safety
    // Flag if profane or if sentiment is extremely negative (harassment)
    // Threshold for sentiment can be adjusted. -5 is quite negative.
    let isSafe = true;
    let reasons = [];

    if (isProfane) {
        isSafe = false;
        reasons.push('profanity');
    }

    if (score < -5) {
        isSafe = false;
        reasons.push('harassment');
    }

    return {
        isSafe,
        reasons,
        cleanText,
        score
    };
};

module.exports = { moderateContent };
