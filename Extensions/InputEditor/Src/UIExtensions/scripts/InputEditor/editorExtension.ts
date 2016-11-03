/// <reference path="../definitions/knockout.d.ts" />
/// <reference path="../definitions/q.d.ts" />
/// <reference path="../definitions/vss.d.ts" />

import ko = require("knockout");
import * as parser from "./parser"

function isNonEmpty(str) {
    return str != undefined && str != null && str.trim() !="";
}

function request(x, url) {
    return $.ajax({
        type: "GET",
        url: url,
        async: false
    }).responseText;
}

function getParametersFromCSMTemplate(url) {
    if(url && url.trim() != "") {
        var response = request("GET", url);
        var csmFile;
        try {
            csmFile = JSON.parse(response);
        } catch (error) {
            throw new Error("URL doesn't point to a JSON file");
        }
        if (isNonEmpty(csmFile["$schema"]) && isNonEmpty(csmFile["contentVersion"]) && Array.isArray(csmFile["resources"])) {
            if (csmFile["parameters"]) {
                var defaultParams = {};
                for (var param in csmFile["parameters"]) {
                    defaultParams[param] = csmFile["parameters"][param]["defaultValue"];
                }
                return defaultParams;
            }
        } else {
            throw new Error("$schema, contentVersion, resources are required fields in your CSM template file.");
        }
    }
    throw new Error("Template Link field is REQUIRED");
}

function getInputsFromTemplate(initialconfig) {
    if (initialconfig.inputValues["templateLocation"] === "Quick Start Template") {
        var url = "https://raw.githubusercontent.com/Azure/azure-quickstart-templates/"
                    +initialconfig.inputValues["commitID"]
                    +"/"+initialconfig.inputValues["quickStartTemplate"]
                    +"/azuredeploy.json";
        return getParametersFromCSMTemplate(url);
    } else if (initialconfig.inputValues["templateLocation"] === "External URL") {
        return getParametersFromCSMTemplate(initialconfig.inputValues["csmFileLink"]);
    } else {
        return null;
    }
}

class sampleViewModel 
{
    public parameters = ko.observableArray([]);

    public setValueOfParameters(initialconfig) {
        var params = null;
        try {
            params = getInputsFromTemplate(initialconfig);
        } catch (error) {
            $(".edit-parameters-grid").hide();
            $(".grid-container").append("<h3>"+error+"</h3>");
            return;
        }
        if (params != null) {
            var overrideParams = parser.Parser.parse(initialconfig.inputValues[initialconfig.target]);
            for (var i= 0; i < overrideParams.length; i++ ) {
                var param = overrideParams[i];
                params[param["name"]] = param["value"];
            }
            this.parameters = ko.observableArray(Object.keys(params).map(function(key){
                return {"name": key, "value": params[key]}
            }));
            return;
        }

        if(initialconfig.inputValues[initialconfig.target] != undefined) {
            this.parameters = ko.observableArray(parser.Parser.parse(initialconfig.inputValues[initialconfig.target]));
        }
        else {
            $(".edit-parameters-grid").hide();
            $(".grid-container").append("<h3>Target input not found.</h3>");
        }
    }

    public add() {
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
