/// <reference path="../definitions/knockout.d.ts" />
/// <reference path="../definitions/q.d.ts" />
/// <reference path="../definitions/vss.d.ts" />

import ko = require("knockout");
import parserLib = require("./parser");

var parser = parserLib.Parser;

function isNonEmpty(str) {
    return str != undefined && str != null && str.trim() !="";
}

function request(url) {
    return $.ajax({
        type: "GET",
        url: url,
        async: false
    }).responseText;
}

class parametersGridViewModel {
    public statics = ko.observableArray([]);
    public extras = ko.observableArray([]);

    public getParametersFromCSMTemplate(url) {
        if(url && url.trim() != "") {
            var response = request(url);
            var csmFile;
            try {
                csmFile = JSON.parse(response);
            } catch (error) {
                throw new Error("Template URL doesn't point to a JSON file");
            }
            if (isNonEmpty(csmFile["$schema"]) && isNonEmpty(csmFile["contentVersion"]) && Array.isArray(csmFile["resources"])) {
                if (csmFile["parameters"]) {
                    var defaultParams = {};
                    for (var param in csmFile["parameters"]) {
                        if (csmFile["parameters"][param]["allowedValues"]) {
                            defaultParams[param] =  {"options" : csmFile["parameters"][param]["allowedValues"], "value" : csmFile["parameters"][param]["defaultValue"] }
                        } else {
                            defaultParams[param] = {"options": null, "value" : csmFile["parameters"][param]["defaultValue"]};
                        }
                    }
                    return defaultParams;
                }
            } else {
                throw new Error("$schema, contentVersion, resources are required fields in your CSM template file.");
            }
        }
        throw new Error("Template Link field is REQUIRED");
    }

    public getInputsFromTemplate(initialconfig) {
        if (initialconfig.inputValues["templateLocation"] === "Quick Start Template") {
            var url = "https://raw.githubusercontent.com/Azure/azure-quickstart-templates/"
                        +initialconfig.inputValues["commitID"]
                        +"/"+initialconfig.inputValues["quickStartTemplate"]
                        +"/azuredeploy.json";
            return this.getParametersFromCSMTemplate(url);
        } else if (initialconfig.inputValues["templateLocation"] === "External URL") {
            return this.getParametersFromCSMTemplate(initialconfig.inputValues["csmFileLink"]);
        } else {
            return null;
        }
    }
  public add(){
        this.extras.push({name:"", value:""});
    }

    public updateParametersFromFile(initialconfig, params) {
        var csmParametersFile;
        var response = request(initialconfig.inputValues["csmParametersFileLink"]);
        try {
             csmParametersFile = JSON.parse(response);
        } catch (error) {
            throw new Error("Parameters URL doesn't point to a JSON file");
        }
        for (var i in csmParametersFile.parameters) {
            params[i].value = csmParametersFile.parameters[i].value;
        }
        return params;
    }

    public setValueOfParameters(initialconfig) {
        var params = null;
        try {
            params = this.getInputsFromTemplate(initialconfig);
            if (params != null) {
                if (initialconfig.inputValues["templateLocation"] === "External URL") {
                    if (initialconfig.inputValues["csmParametersFileLink"].trim()!="") {
                        params = this.updateParametersFromFile(initialconfig, params);
                    }
                }
                var overrideParams = parser.parse(initialconfig.inputValues[initialconfig.target]);
                for (var i= 0; i < overrideParams.length; i++ ) {
                    var param = overrideParams[i];
                    try {
                        params[param["name"]]["value"] = param["value"];
                    } catch (error) {
                        
                    }
                }
                this.statics = ko.observableArray(Object.keys(params).map(function(key) {
                    if (params[key].options) {
                        var options = [];
                        for (var i in params[key].options) {
                           options=  options.concat({"option":params[key].options[i], "isSelected": ko.observable(params[key].options[i] === params[key].value)});
                        }
                        var obj =  {"name": key, "value":"", "dropdownOptions": options, "isDropdown": true};
                        return obj;
                    } else {
                        return {"name": key, "value": params[key]["value"],"dropdownOptions":[], "isDropdown": false};
                    }
                    
                }));
                return;
             }
        } catch (error) {
            $(".edit-parameters-grid").hide();
            $(".grid-container").append("<h3>"+error+"</h3>");
            return;
        }
        if(initialconfig.inputValues[initialconfig.target] != undefined) {
            this.statics = ko.observableArray(parserLib.Parser.parse(initialconfig.inputValues[initialconfig.target]));
        }
        else {
            $(".edit-parameters-grid").hide();
            $(".grid-container").append("<h3>Target input not found.</h3>");
        }
    }

    public remove(variable , evt) {
        var context = ko.contextFor(evt.target).$parent;
        context.extras.remove(this);
    }

    public onOkClicked() {
        var result = "";
        for(var i = 0; i < this.statics().length; i++) { 
            if(this.statics()[i].name) {
                result += "-" + this.statics()[i].name + " ";
            }
            if(this.statics()[i].value) {
                result += this.statics()[i].value + " ";
            }
        }
        for(var i = 0; i < this.extras().length; i++) { 
            if(this.extras()[i].name) {
                result += "-" + this.extras()[i].name + " ";
            }
            if(this.extras()[i].value) {
                result += this.extras()[i].value + " ";
            }
        }
        return result;
    }
};

var vm = new parametersGridViewModel();

VSS.ready(function () {
    ko.applyBindings(vm);
    VSS.register("ms.vss-distributed-a-task-input-editor.azurerg-parameters-grid", vm);
    VSS.notifyLoadSucceeded();
});

function setInitialValues() {
    var initialconfig = VSS.getConfiguration();
    vm.setValueOfParameters(initialconfig);
}

setInitialValues();
