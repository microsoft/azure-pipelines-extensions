export class Parser {

    public static parse(input: string) {

        var result = [];
        var index = 0;
        var obj = { name: "", value: "" };

        while (index < input.length) {
            var literalData = this.findLiteral(input, index);
            var nextIndex = literalData.currentPosition;
            if(input[index] == " ") {
                index = nextIndex + 1;
                continue;
            }
            var specialCharacterFlag = literalData.specialCharacterFlag
            var literal = input.substr(index, nextIndex - index).trim();
            if (this.isName(literal, specialCharacterFlag)) {
                if (obj.name) {
                    result.push(obj);
                    obj = { name: "", value: "" };
                }

                obj.name = literal.substr(1, literal.length);
            }
            else {
                obj.value = literal;
                result.push(obj);
                obj = { name: "", value: "" };
            }

            index = nextIndex + 1;
        }

        if (obj.name) {
            result.push(obj);
        }
        
        return result;
    }

    private static isName(literal: string, specialCharacterFlag: boolean): boolean {
        return literal[0] === '-' && !specialCharacterFlag;
    }

    private static findLiteral(input, currentPosition) {
        var specialCharacterFlag = false;
        for (; currentPosition < input.length; currentPosition++) {
            if (input[currentPosition] == " " || input[currentPosition] == "\t") {
                for (; currentPosition < input.length; currentPosition++) {
                    if (input[currentPosition + 1] != " " && input[currentPosition + 1] != "\t") {
                        break;
                    }
                }

                break;
            }
            else if (input[currentPosition] == "(") {
                currentPosition = this.findClosingBracketIndex(input, currentPosition + 1, ")");
                specialCharacterFlag = true;
            }
            else if (input[currentPosition] == "[") {
                currentPosition = this.findClosingBracketIndex(input, currentPosition + 1, "]");
                specialCharacterFlag = true;
            }
            else if (input[currentPosition] == "{") {
                currentPosition = this.findClosingBracketIndex(input, currentPosition + 1, "}");
                specialCharacterFlag = true;
            }
            else if (input[currentPosition] == "\"") {
                //keep going till this one closes
                currentPosition = this.findClosingQuoteIndex(input, currentPosition + 1, "\"");
                specialCharacterFlag = true;
            }
            else if (input[currentPosition] == "'") {
                //keep going till this one closes
                currentPosition = this.findClosingQuoteIndex(input, currentPosition + 1, "'");
                specialCharacterFlag = true;
            }
            else if (input[currentPosition] == "`") {
                currentPosition++;
                specialCharacterFlag = true;
                if (currentPosition >= input.length) {
                    break;
                }
            }
        }
        return { currentPosition: currentPosition, specialCharacterFlag: specialCharacterFlag };
    }

    private static findClosingBracketIndex(input, currentPosition, closingBracket): number {
        for (; currentPosition < input.length; currentPosition++) {
            if (input[currentPosition] == closingBracket) {
                break;
            }
            else if (input[currentPosition] == "(") {
                currentPosition = this.findClosingBracketIndex(input, currentPosition + 1, ")");
            }
            else if (input[currentPosition] == "[") {
                currentPosition = this.findClosingBracketIndex(input, currentPosition + 1, "]");
            }
            else if (input[currentPosition] == "{") {
                currentPosition = this.findClosingBracketIndex(input, currentPosition + 1, "}");
            }
            else if (input[currentPosition] == "\"") {
                currentPosition = this.findClosingQuoteIndex(input, currentPosition + 1, "\"");
            }
            else if (input[currentPosition] == "'") {
                currentPosition = this.findClosingQuoteIndex(input, currentPosition + 1, "'");
            }
            else if (input[currentPosition] == "`") {
                currentPosition++;
                if (currentPosition >= input.length) {
                    break;
                }
            }
        }

        return currentPosition;
    }

    private static findClosingQuoteIndex(input, currentPosition, closingQuote) {
        for (; currentPosition < input.length; currentPosition++) {
            if (input[currentPosition] == closingQuote) {
                break;
            }
            else if (input[currentPosition] == "`") {
                currentPosition++;
                if (currentPosition >= input.length) {
                    break;
                }
            }
        }

        return currentPosition;
    }
}
export var p = Parser;
