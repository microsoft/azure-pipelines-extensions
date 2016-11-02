/// <reference path="../definitions/knockout.d.ts" />
/// <reference path="../definitions/q.d.ts" />
/// <reference path="../definitions/vss.d.ts" />

import ko = require("knockout");
import * as parser from "./parser"
class sampleViewModel
{
    public parameters = ko.observableArray([]);

    public setValueOfParameters(initialconfig){
        if(initialconfig.inputValues[initialconfig.target] != undefined) {
            this.parameters = ko.observableArray(parser.Parser.parse(initialconfig.inputValues[initialconfig.target]));
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
