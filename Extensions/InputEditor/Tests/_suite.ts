import * as parser from "../Src/UIExtensions/scripts/InputEditor/parser";
declare var require: any
declare var describe: any
declare var beforeEach: any
declare var afterEach: any
declare var it: any 

var assert = require('assert');
var mocha = require('gulp-mocha');

describe("one key value pair", (): void => {
        
        beforeEach((): void => {
        });

        afterEach((): void => {
        });

        it("one key value pair returned", (): void => {
            var keyValueMap = parser.Parser.parse("-key1 value");
            console.log("name:" + keyValueMap[0].name);
            assert.equal(keyValueMap[0].name, "key1");
            assert.equal(keyValueMap[0].value, "value");
            assert.equal(keyValueMap.length, 1);
        });

        it("0 keys only values", (): void => {
            var keyValueMap = parser.Parser.parse("value value1 value2");
            assert.equal(keyValueMap[0].name, "");
            assert.equal(keyValueMap[0].value, "value");
            assert.equal(keyValueMap[1].value, "value1");
            assert.equal(keyValueMap[2].value, "value2");
            assert.equal(keyValueMap.length, 3);
        });

        it("0 values only keys", (): void => {
            var keyValueMap = parser.Parser.parse("-key1 -key2 -key3");
            assert.equal(keyValueMap[0].name, "key1");
            assert.equal(keyValueMap[1].name, "key2");
            assert.equal(keyValueMap[2].name, "key3");
            assert.equal(keyValueMap.length, 3);
        });

        it("key value mixed paris", (): void => {
            var keyValueMap = parser.Parser.parse("-key1 value1 value2 -key3 value3");
            assert.equal(keyValueMap[0].name, "key1");
            assert.equal(keyValueMap[0].value, "value1");
            assert.equal(keyValueMap[1].value, "value2");
            assert.equal(keyValueMap[2].name, "key3");
            assert.equal(keyValueMap[2].value, "value3");
            assert.equal(keyValueMap.length, 3);
        });

        it("values with special symbols (properly formed)", (): void => {
            var keyValueMap = parser.Parser.parse("-key1 (Convert-To SecureString $(\"value1\")) \"value2 with escape charater `\"\"");
            assert.equal(keyValueMap[0].name, "key1");
            assert.equal(keyValueMap[0].value, "(Convert-To SecureString $(\"value1\"))");
            assert.equal(keyValueMap[1].value, "\"value2 with escape charater `\"\"");
            assert.equal(keyValueMap.length, 2);
        });

        it("values with special symbols (unproperly formed)", (): void => {
            var keyValueMap = parser.Parser.parse("-key1 (Convert-To SecureString $(\"value1\")) \"value2 {with}) (escape charater `");
            assert.equal(keyValueMap[0].name, "key1");
            assert.equal(keyValueMap[0].value, "(Convert-To SecureString $(\"value1\"))");
            assert.equal(keyValueMap[1].value, "\"value2 {with}) (escape charater `");
            assert.equal(keyValueMap.length, 2);
        });

        it("values with special symbols (unproperly formed)", (): void => {
            var keyValueMap = parser.Parser.parse("-key1 (Convert-To SecureString $(\"value1\")) \"value2 {with}) (escape charater `");
            assert.equal(keyValueMap[0].name, "key1");
            assert.equal(keyValueMap[0].value, "(Convert-To SecureString $(\"value1\"))");
            assert.equal(keyValueMap[1].value, "\"value2 {with}) (escape charater `");
            assert.equal(keyValueMap.length, 2);
        });

        it("keys with special symbols not returned as keys", (): void => {
            var keyValueMap = parser.Parser.parse("-ke{y}1 (Convert-To SecureString $(\"value1\")) -k\"e`\"y\"2 \"value2 {with}) (escape charater");
            assert.equal(keyValueMap[0].name, "");
            assert.equal(keyValueMap[0].value, "-ke{y}1");
            assert.equal(keyValueMap[1].name, "");
            assert.equal(keyValueMap[1].value, "(Convert-To SecureString $(\"value1\"))");
            assert.equal(keyValueMap[2].name, "");
            assert.equal(keyValueMap[2].value, "-k\"e`\"y\"2");
            assert.equal(keyValueMap[3].name, "");
            assert.equal(keyValueMap[3].value, "\"value2 {with}) (escape charater");
            assert.equal(keyValueMap.length, 4);
        });

        it("values with unclosed brackets and braces", (): void => {
            var keyValueMap = parser.Parser.parse("-key1 (Convert-To SecureString $(\"value1\") \"value2 {with}) (escape charater `\"))");
            assert.equal(keyValueMap[0].name, "key1");
            assert.equal(keyValueMap[0].value, "(Convert-To SecureString $(\"value1\") \"value2 {with}) (escape charater `\"))");
            assert.equal(keyValueMap.length, 1);
        });
    });