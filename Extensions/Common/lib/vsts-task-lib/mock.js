/// <reference path="../../../../definitions/node.d.ts" />
"use strict";
var answerFile = process.env['MOCK_RESPONSES'];
if (!answerFile) {
    throw new Error('MOCK_RESPONSES envvar not set');
}
var answers = require(answerFile);
if (!answers) {
    throw new Error('Answer file not found: ' + answerFile);
}
function getResponse(cmd, key) {
    if (!answers[cmd]) {
        return null;
    }
    if (!answers[cmd][key] && key && process.env['MOCK_NORMALIZE_SLASHES'] === 'true') {
        // try normalizing the slashes
        var key2 = key.replace(/\\/g, "/");
        if (answers[cmd][key2]) {
            return answers[cmd][key2];
        }
    }
    return answers[cmd][key];
}
exports.getResponse = getResponse;
