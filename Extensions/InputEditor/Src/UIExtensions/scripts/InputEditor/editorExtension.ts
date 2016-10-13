/// <reference path="../definitions/knockout.d.ts" />
/// <reference path="../definitions/q.d.ts" />
/// <reference path="../definitions/vss.d.ts" />

import ko = require("knockout");

class sampleViewModel
{
    public parameters = ko.observableArray([]);

    public setValueOfParameters(initialconfig){
        if(initialconfig.inputValues[initialconfig.target] != undefined) {
            this.parameters = ko.observableArray(parse(initialconfig.inputValues[initialconfig.target]));
        }
        else {
            $(".edit-parameters-grid").hide();
            $(".grid-container").append("<h3 >Target input not found.<h3>");
        }
    }

    public add(){
        this.parameters.push({name:"", value:""});
    }

    public remove(variable , evt) {
        var context = ko.contextFor(evt.target).$parent;
        context.parameters.remove(this);
    }

    public onOkClicked() {
        var result = "";
        
        for(var i = 0; i < this.parameters().length; i++) { 
            if(this.parameters()[i].name) {
                result += "-" + this.parameters()[i].name + " ";
            }
            if(this.parameters()[i].value) {
                result += this.parameters()[i].value + " ";
            }
        }
        return result;
    }
};

function parse(input: string)
{
    var result = [];
    var index = 0;

    var obj = {name:"", value:""};
    while(index < input.length) {
        var literalData = findLiteral(input, index);
        var nextIndex = literalData.currentPosition;
        var specialCharacterFlag = literalData.specialCharacterFlag
        var literal = input.substr(index, nextIndex - index).trim();
        if (isName(literal, specialCharacterFlag)) {
            if (obj.name) {
                result.push(obj);
                obj = {name:"", value:""}; 
            }

            obj.name = literal.substr(1, literal.length);
        }
        else {
            obj.value = literal;
            result.push(obj);
            obj = {name:"", value:""}; 
        }

        index = nextIndex + 1;
    }

    if (obj.name){
        result.push(obj);
    }

    return result;
}

function isName(literal: string, specialCharacterFlag: boolean): boolean {
    return literal[0] === '-' && !specialCharacterFlag;
}

function findLiteral (input, currentPosition) {
    var specialCharacterFlag = false; 
    for(; currentPosition < input.length; currentPosition++)
    {
        if(input[currentPosition] == " " || input[currentPosition] == "\t") {
            for(; currentPosition < input.length; currentPosition++) {
                if(input[currentPosition + 1] != " " || input[currentPosition + 1] != "\t") {
                    break;
                }
            }

            break;
        }
        else if(input[currentPosition] == "(") {
            currentPosition = findClosingBracketIndex(input, currentPosition + 1, ")");
            specialCharacterFlag = true;
        }
        else if(input[currentPosition] == "[") {
            currentPosition = findClosingBracketIndex(input, currentPosition + 1, "]");
            specialCharacterFlag = true;
        }
        else if(input[currentPosition] == "{") {
            currentPosition = findClosingBracketIndex(input, currentPosition + 1, "}");
            specialCharacterFlag = true;
        }
        else if(input[currentPosition] == "\"") {
            //keep going till this one closes
            currentPosition = findClosingQuoteIndex(input, currentPosition + 1, "\"");
            specialCharacterFlag = true;
        }
        else if(input[currentPosition] == "'") {
            //keep going till this one closes
            currentPosition = findClosingQuoteIndex(input, currentPosition + 1, "'");
            specialCharacterFlag = true;
        }
    }
    return {currentPosition: currentPosition, specialCharacterFlag: specialCharacterFlag};
}

function findClosingBracketIndex(input, currentPosition, closingBracket) : number {
    for(; currentPosition < input.length; currentPosition++)
    {
        if(input[currentPosition] == closingBracket) {
            break;
        }
        else if(input[currentPosition] == "(") {
            currentPosition = findClosingBracketIndex(input, currentPosition + 1, ")");
        }
        else if(input[currentPosition] == "[") {
            currentPosition = findClosingBracketIndex(input, currentPosition + 1, "]");
        }
        else if(input[currentPosition] == "{") {
            currentPosition = findClosingBracketIndex(input, currentPosition + 1, "}");
        }
        else if(input[currentPosition] == "\"") {
            currentPosition = findClosingQuoteIndex(input, currentPosition + 1, "\"");
        }
        else if(input[currentPosition] == "'") {
            currentPosition = findClosingQuoteIndex(input, currentPosition + 1, "'");
        }
    }

    return currentPosition;
}

function findClosingQuoteIndex (input, currentPosition, closingQuote) {
    for(; currentPosition < input.length; currentPosition++) {
        if(input[currentPosition] == closingQuote)
        {
            break;
        }
    }

    return currentPosition;
}

var vm = new sampleViewModel();

VSS.ready(function () {
    ko.applyBindings(vm);
    VSS.register("ms.vss-distributed-task-input-editor.parameters-grid", vm);
    VSS.notifyLoadSucceeded();
});

function setInitialValues() {
    var initialconfig = VSS.getConfiguration();
    vm.setValueOfParameters(initialconfig);
}

setInitialValues();