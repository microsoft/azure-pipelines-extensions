//----------------------------------------------------------
// Copyright (C) Microsoft Corporation. All rights reserved.
//----------------------------------------------------------
///<reference path='../References/VSS-Common.d.ts' />
///<reference path='../References/VSS.SDK.Interfaces.d.ts' />
///<reference path='../References/SDK.Interfaces.d.ts' />
///<reference path='../References/VSS.SDK.Interfaces.d.ts' />
///<reference path='../References/VSS-Common.d.ts' />
/// This file is going to be embedded into the following typescript files in the build time:
///     - VSS/SDK/XDM.ts
///     - VSS/SDK/VSS.SDK.ts
/// This module is unlike other modules which doesn't use AMD loading.
var XDM;
(function (XDM) {
    /**
    * Create a new deferred object
    */
    function createDeferred() {
        return new XdmDeferred();
    }
    XDM.createDeferred = createDeferred;
    var XdmDeferred = (function () {
        function XdmDeferred() {
            var _this = this;
            this._resolveCallbacks = [];
            this._rejectCallbacks = [];
            this._isResolved = false;
            this._isRejected = false;
            this.resolve = function (result) {
                _this._resolve(result);
            };
            this.reject = function (reason) {
                _this._reject(reason);
            };
            this.promise = {};
            this.promise.then = function (onFulfill, onReject) {
                return _this._then(onFulfill, onReject);
            };
        }
        XdmDeferred.prototype._then = function (onFulfill, onReject) {
            var _this = this;
            if ((!onFulfill && !onReject) ||
                (this._isResolved && !onFulfill) ||
                (this._isRejected && !onReject)) {
                return this.promise;
            }
            var newDeferred = new XdmDeferred();
            this._resolveCallbacks.push(function (value) {
                _this._wrapCallback(onFulfill, value, newDeferred, false);
            });
            this._rejectCallbacks.push(function (reason) {
                _this._wrapCallback(onReject, reason, newDeferred, true);
            });
            if (this._isResolved) {
                this._resolve(this._resolvedValue);
            }
            else if (this._isRejected) {
                this._reject(this._rejectValue);
            }
            return newDeferred.promise;
        };
        XdmDeferred.prototype._wrapCallback = function (callback, value, deferred, reject) {
            if (!callback) {
                if (reject) {
                    deferred.reject(value);
                }
                else {
                    deferred.resolve(value);
                }
                return;
            }
            var result;
            try {
                result = callback(value);
            }
            catch (ex) {
                deferred.reject(ex);
                return;
            }
            if (result === undefined) {
                deferred.resolve(value);
            }
            else if (result && typeof result.then === "function") {
                result.then(function (innerResult) {
                    deferred.resolve(innerResult);
                }, function (innerReason) {
                    deferred.reject(innerReason);
                });
            }
            else {
                deferred.resolve(result);
            }
        };
        XdmDeferred.prototype._resolve = function (result) {
            if (!this._isRejected && !this._isResolved) {
                this._isResolved = true;
                this._resolvedValue = result;
            }
            if (this._isResolved && this._resolveCallbacks.length > 0) {
                var resolveCallbacks = this._resolveCallbacks.splice(0);
                // 2.2.4. #onFulfilled or onRejected must not be called until the execution context stack contains only platform code.
                window.setTimeout(function () {
                    for (var i = 0, l = resolveCallbacks.length; i < l; i++) {
                        resolveCallbacks[i](result);
                    }
                });
            }
        };
        XdmDeferred.prototype._reject = function (reason) {
            if (!this._isRejected && !this._isResolved) {
                this._isRejected = true;
                this._rejectValue = reason;
                if (this._rejectCallbacks.length === 0 && window.console && window.console.warn) {
                    console.warn("Rejected XDM promise with no reject callbacks");
                    if (reason) {
                        console.warn(reason);
                    }
                }
            }
            if (this._isRejected && this._rejectCallbacks.length > 0) {
                var rejectCallbacks = this._rejectCallbacks.splice(0);
                // 2.2.4. #onFulfilled or onRejected must not be called until the execution context stack contains only platform code.
                window.setTimeout(function () {
                    for (var i = 0, l = rejectCallbacks.length; i < l; i++) {
                        rejectCallbacks[i](reason);
                    }
                });
            }
        };
        return XdmDeferred;
    })();
    var smallestRandom = parseInt("10000000000", 36);
    var maxSafeInteger = Number.MAX_SAFE_INTEGER || 9007199254740991;
    /**
     * Create a new random 22-character fingerprint.
     * @return string fingerprint
     */
    function newFingerprint() {
        // smallestRandom ensures we will get a 11-character result from the base-36 conversion.
        return Math.floor((Math.random() * (maxSafeInteger - smallestRandom)) + smallestRandom).toString(36) +
            Math.floor((Math.random() * (maxSafeInteger - smallestRandom)) + smallestRandom).toString(36);
    }
    /**
     * Catalog of objects exposed for XDM
     */
    var XDMObjectRegistry = (function () {
        function XDMObjectRegistry() {
            this._registeredObjects = {};
        }
        /**
        * Register an object (instance or factory method) exposed by this frame to callers in a remote frame
        *
        * @param instanceId unique id of the registered object
        * @param instance Either: (1) an object instance, or (2) a function that takes optional context data and returns an object instance.
        */
        XDMObjectRegistry.prototype.register = function (instanceId, instance) {
            this._registeredObjects[instanceId] = instance;
        };
        /**
        * Get an instance of an object registered with the given id
        *
        * @param instanceId unique id of the registered object
        * @param contextData Optional context data to pass to a registered object's factory method
        */
        XDMObjectRegistry.prototype.getInstance = function (instanceId, contextData) {
            var instance = this._registeredObjects[instanceId];
            if (!instance) {
                return null;
            }
            if (typeof instance === "function") {
                return instance(contextData);
            }
            else {
                return instance;
            }
        };
        return XDMObjectRegistry;
    })();
    XDM.XDMObjectRegistry = XDMObjectRegistry;
    ;
    /**
    * The registry of global XDM handlers
    */
    XDM.globalObjectRegistry = new XDMObjectRegistry();
    /**
     * Represents a channel of communication between frames\document
     * Stays "alive" across multiple funtion\method calls
     */
    var XDMChannel = (function () {
        function XDMChannel(postToWindow, targetOrigin) {
            if (targetOrigin === void 0) { targetOrigin = null; }
            this._nextMessageId = 1;
            this._deferreds = {};
            this._nextProxyFunctionId = 1;
            this._proxyFunctions = {};
            this._postToWindow = postToWindow;
            this._targetOrigin = targetOrigin;
            this._channelObjectRegistry = new XDMObjectRegistry();
            this._channelId = XDMChannel._nextChannelId++;
            if (!this._targetOrigin) {
                this._handshakeToken = newFingerprint();
            }
        }
        /**
        * Get the object registry to handle messages from this specific channel.
        * Upon receiving a message, this channel registry will be used first, then
        * the global registry will be used if no handler is found here.
        */
        XDMChannel.prototype.getObjectRegistry = function () {
            return this._channelObjectRegistry;
        };
        /**
        * Invoke a method via RPC. Lookup the registered object on the remote end of the channel and invoke the specified method.
        *
        * @param method Name of the method to invoke
        * @param instanceId unique id of the registered object
        * @param params Arguments to the method to invoke
        * @param instanceContextData Optional context data to pass to a registered object's factory method
        * @param serializationSettings Optional serialization settings
        */
        XDMChannel.prototype.invokeRemoteMethod = function (methodName, instanceId, params, instanceContextData, serializationSettings) {
            var message = {
                id: this._nextMessageId++,
                methodName: methodName,
                instanceId: instanceId,
                instanceContext: instanceContextData,
                params: this._customSerializeObject(params, serializationSettings),
                jsonrpc: "2.0",
                serializationSettings: serializationSettings
            };
            if (!this._targetOrigin) {
                message.handshakeToken = this._handshakeToken;
            }
            var deferred = createDeferred();
            this._deferreds[message.id] = deferred;
            this._sendRpcMessage(message);
            return deferred.promise;
        };
        /**
        * Get a proxied object that represents the object registered with the given instance id on the remote side of this channel.
        *
        * @param instanceId unique id of the registered object
        * @param contextData Optional context data to pass to a registered object's factory method
        */
        XDMChannel.prototype.getRemoteObjectProxy = function (instanceId, contextData) {
            return this.invokeRemoteMethod(null, instanceId, null, contextData);
        };
        XDMChannel.prototype.invokeMethod = function (registeredInstance, rpcMessage) {
            var _this = this;
            if (!rpcMessage.methodName) {
                // Null/empty method name indicates to return the registered object itself.
                this._success(rpcMessage, registeredInstance, rpcMessage.handshakeToken);
                return;
            }
            var method = registeredInstance[rpcMessage.methodName];
            if (typeof method !== "function") {
                this._error(rpcMessage, new Error("RPC method not found: " + rpcMessage.methodName), rpcMessage.handshakeToken);
                return;
            }
            try {
                // Call specified method.  Add nested success and error call backs with closure
                // so we can post back a response as a result or error as appropriate
                var methodArgs = [];
                if (rpcMessage.params) {
                    methodArgs = this._customDeserializeObject(rpcMessage.params);
                }
                var result = method.apply(registeredInstance, methodArgs);
                if (result && result.then && typeof result.then === "function") {
                    result.then(function (asyncResult) {
                        _this._success(rpcMessage, asyncResult, rpcMessage.handshakeToken);
                    }, function (e) {
                        _this._error(rpcMessage, e, rpcMessage.handshakeToken);
                    });
                }
                else {
                    this._success(rpcMessage, result, rpcMessage.handshakeToken);
                }
            }
            catch (exception) {
                // send back as error if an exception is thrown
                this._error(rpcMessage, exception, rpcMessage.handshakeToken);
            }
        };
        XDMChannel.prototype.getRegisteredObject = function (instanceId, instanceContext) {
            if (instanceId === "__proxyFunctions") {
                // Special case for proxied functions of remote instances
                return this._proxyFunctions;
            }
            // Look in the channel registry first
            var registeredObject = this._channelObjectRegistry.getInstance(instanceId, instanceContext);
            if (!registeredObject) {
                // Look in the global registry as a fallback
                registeredObject = XDM.globalObjectRegistry.getInstance(instanceId, instanceContext);
            }
            return registeredObject;
        };
        /**
        * Handle a received message on this channel. Dispatch to the appropriate object found via object registry
        *
        * @param data Message data
        * @param origin Origin of the frame that sent the message
        * @return True if the message was handled by this channel. Otherwise false.
        */
        XDMChannel.prototype.onMessage = function (data, origin) {
            var _this = this;
            var rpcMessage = data;
            if (rpcMessage.instanceId) {
                // Find the object that handles this requestNeed to find implementation
                // Look in the channel registry first
                var registeredObject = this.getRegisteredObject(rpcMessage.instanceId, rpcMessage.instanceContext);
                if (!registeredObject) {
                    // If not found return false to indicate that the message was not handled
                    return false;
                }
                if (typeof registeredObject["then"] === "function") {
                    registeredObject.then(function (resolvedInstance) {
                        _this.invokeMethod(resolvedInstance, rpcMessage);
                    }, function (e) {
                        _this._error(rpcMessage, e, rpcMessage.handshakeToken);
                    });
                }
                else {
                    this.invokeMethod(registeredObject, rpcMessage);
                }
            }
            else {
                // response
                // Responses look like this -
                //  {"jsonrpc": "2.0", "result": ["hello", 5], "id": "9"}
                //  {"jsonrpc": "2.0", "error": {"code": -32601, "message": "Method not found."}, "id": "5"}
                var deferred = this._deferreds[rpcMessage.id];
                if (!deferred) {
                    // Message not handled by this channel.
                    return false;
                }
                if (rpcMessage.error) {
                    deferred.reject(this._customDeserializeObject([rpcMessage.error])[0]);
                }
                else {
                    deferred.resolve(this._customDeserializeObject([rpcMessage.result])[0]);
                }
                delete this._deferreds[rpcMessage.id];
            }
            // Message handled by this channel
            return true;
        };
        XDMChannel.prototype.owns = function (source, origin, data) {
            /// Determines whether the current message belongs to this channel or not
            var rpcMessage = data;
            if (this._postToWindow === source) {
                // For messages coming from sandboxed iframes the origin will be set to the string "null".  This is 
                // how onprem works.  If it is not a sandboxed iFrame we will get the origin as expected.
                if (this._targetOrigin) {
                    if (origin) {
                        return origin.toLowerCase() === "null" || this._targetOrigin.toLowerCase().indexOf(origin.toLowerCase()) === 0;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    if (rpcMessage.handshakeToken && rpcMessage.handshakeToken === this._handshakeToken) {
                        this._targetOrigin = origin;
                        return true;
                    }
                }
            }
            return false;
        };
        XDMChannel.prototype.error = function (data, errorObj) {
            var rpcMessage = data;
            this._error(rpcMessage, errorObj, rpcMessage.handshakeToken);
        };
        XDMChannel.prototype._error = function (messageObj, errorObj, handshakeToken) {
            // Post back a response as an error which look like this -
            //  {"id": "5", "error": {"code": -32601, "message": "Method not found."}, "jsonrpc": "2.0", }
            var message = {
                id: messageObj.id,
                error: this._customSerializeObject([errorObj], messageObj.serializationSettings)[0],
                jsonrpc: "2.0",
                handshakeToken: handshakeToken
            };
            this._sendRpcMessage(message);
        };
        XDMChannel.prototype._success = function (messageObj, result, handshakeToken) {
            // Post back response result which look like this -
            //  {"id": "9", "result": ["hello", 5], "jsonrpc": "2.0"}
            var message = {
                id: messageObj.id,
                result: this._customSerializeObject([result], messageObj.serializationSettings)[0],
                jsonrpc: "2.0",
                handshakeToken: handshakeToken
            };
            this._sendRpcMessage(message);
        };
        XDMChannel.prototype._sendRpcMessage = function (message) {
            var messageString = JSON.stringify(message);
            this._postToWindow.postMessage(messageString, "*");
        };
        XDMChannel.prototype._shouldSkipSerialization = function (obj) {
            for (var i = 0, l = XDMChannel.WINDOW_TYPES_TO_SKIP_SERIALIZATION.length; i < l; i++) {
                var instanceType = XDMChannel.WINDOW_TYPES_TO_SKIP_SERIALIZATION[i];
                if (window[instanceType] && obj instanceof window[instanceType]) {
                    return true;
                }
            }
            if (window.jQuery) {
                for (var i = 0, l = XDMChannel.JQUERY_TYPES_TO_SKIP_SERIALIZATION.length; i < l; i++) {
                    var instanceType = XDMChannel.JQUERY_TYPES_TO_SKIP_SERIALIZATION[i];
                    if (window.jQuery[instanceType] && obj instanceof window.jQuery[instanceType]) {
                        return true;
                    }
                }
            }
            return false;
        };
        XDMChannel.prototype._customSerializeObject = function (obj, settings, parentObjects, nextCircularRefId, depth) {
            var _this = this;
            if (parentObjects === void 0) { parentObjects = null; }
            if (nextCircularRefId === void 0) { nextCircularRefId = 1; }
            if (depth === void 0) { depth = 1; }
            if (!obj || depth > XDMChannel.MAX_XDM_DEPTH) {
                return null;
            }
            if (this._shouldSkipSerialization(obj)) {
                return null;
            }
            var serializeMember = function (parentObject, newObject, key) {
                var item;
                try {
                    item = parentObject[key];
                }
                catch (ex) {
                }
                var itemType = typeof item;
                if (itemType === "undefined") {
                    return;
                }
                // Check for a circular reference by looking at parent objects
                var parentItemIndex = -1;
                if (itemType === "object") {
                    parentItemIndex = parentObjects.originalObjects.indexOf(item);
                }
                if (parentItemIndex >= 0) {
                    // Circular reference found. Add reference to parent
                    var parentItem = parentObjects.newObjects[parentItemIndex];
                    if (!parentItem.__circularReferenceId) {
                        parentItem.__circularReferenceId = nextCircularRefId++;
                    }
                    newObject[key] = {
                        __circularReference: parentItem.__circularReferenceId
                    };
                }
                else {
                    if (itemType === "function") {
                        var proxyFunctionId = _this._nextProxyFunctionId++;
                        newObject[key] = {
                            __proxyFunctionId: _this._registerProxyFunction(item, obj),
                            __channelId: _this._channelId
                        };
                    }
                    else if (itemType === "object") {
                        if (item && item instanceof Date) {
                            newObject[key] = {
                                __proxyDate: item.getTime()
                            };
                        }
                        else {
                            newObject[key] = _this._customSerializeObject(item, settings, parentObjects, nextCircularRefId, depth + 1);
                        }
                    }
                    else if (key !== "__proxyFunctionId") {
                        // Just add non object/function properties as-is. Don't include "__proxyFunctionId" to protect
                        // our proxy methods from being invoked from other messages.
                        newObject[key] = item;
                    }
                }
            };
            var returnValue;
            if (!parentObjects) {
                parentObjects = {
                    newObjects: [],
                    originalObjects: []
                };
            }
            parentObjects.originalObjects.push(obj);
            if (obj instanceof Array) {
                returnValue = [];
                parentObjects.newObjects.push(returnValue);
                for (var i = 0, l = obj.length; i < l; i++) {
                    serializeMember(obj, returnValue, i);
                }
            }
            else {
                returnValue = {};
                parentObjects.newObjects.push(returnValue);
                var keys = {};
                try {
                    // We want to get both enumerable and non-enumerable properties
                    // including inherited enumerable properties. for..in grabs
                    // enumerable properties (including inherited properties) and
                    // getOwnPropertyNames includes non-enumerable properties.
                    // Merge these results together.
                    for (var key in obj) {
                        keys[key] = true;
                    }
                    var ownProperties = Object.getOwnPropertyNames(obj);
                    for (var i = 0, l = ownProperties.length; i < l; i++) {
                        keys[ownProperties[i]] = true;
                    }
                }
                catch (ex) {
                }
                for (var key in keys) {
                    // Don't serialize properties that start with an underscore.
                    if ((key && key[0] !== "_") || (settings && settings.includeUnderscoreProperties)) {
                        serializeMember(obj, returnValue, key);
                    }
                }
            }
            parentObjects.originalObjects.pop();
            parentObjects.newObjects.pop();
            return returnValue;
        };
        XDMChannel.prototype._registerProxyFunction = function (func, context) {
            var proxyFunctionId = this._nextProxyFunctionId++;
            this._proxyFunctions["proxy" + proxyFunctionId] = function () {
                return func.apply(context, Array.prototype.slice.call(arguments, 0));
            };
            return proxyFunctionId;
        };
        XDMChannel.prototype._customDeserializeObject = function (obj, circularRefs) {
            var _this = this;
            var that = this;
            if (!obj) {
                return null;
            }
            if (!circularRefs) {
                circularRefs = {};
            }
            var deserializeMember = function (parentObject, key) {
                var item = parentObject[key];
                var itemType = typeof item;
                if (key === "__circularReferenceId" && itemType === 'number') {
                    circularRefs[item] = parentObject;
                    delete parentObject[key];
                }
                else if (itemType === "object" && item) {
                    if (item.__proxyFunctionId) {
                        parentObject[key] = function () {
                            return that.invokeRemoteMethod("proxy" + item.__proxyFunctionId, "__proxyFunctions", Array.prototype.slice.call(arguments, 0), null, { includeUnderscoreProperties: true });
                        };
                    }
                    else if (item.__proxyDate) {
                        parentObject[key] = new Date(item.__proxyDate);
                    }
                    else if (item.__circularReference) {
                        parentObject[key] = circularRefs[item.__circularReference];
                    }
                    else {
                        _this._customDeserializeObject(item, circularRefs);
                    }
                }
            };
            if (obj instanceof Array) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    deserializeMember(obj, i);
                }
            }
            else if (typeof obj === "object") {
                for (var key in obj) {
                    deserializeMember(obj, key);
                }
            }
            return obj;
        };
        XDMChannel._nextChannelId = 1;
        XDMChannel.MAX_XDM_DEPTH = 100;
        XDMChannel.WINDOW_TYPES_TO_SKIP_SERIALIZATION = [
            "Node",
            "Window",
            "Event"
        ];
        XDMChannel.JQUERY_TYPES_TO_SKIP_SERIALIZATION = [
            "jQuery"
        ];
        return XDMChannel;
    })();
    XDM.XDMChannel = XDMChannel;
    /**
    * Registry of XDM channels kept per target frame/window
    */
    var XDMChannelManager = (function () {
        function XDMChannelManager() {
            this._channels = [];
            this._subscribe(window);
        }
        XDMChannelManager.get = function () {
            if (!this._default) {
                this._default = new XDMChannelManager();
            }
            return this._default;
        };
        /**
        * Add an XDM channel for the given target window/iframe
        *
        * @param window Target iframe window to communicate with
        * @param targetOrigin Url of the target iframe (if known)
        */
        XDMChannelManager.prototype.addChannel = function (window, targetOrigin) {
            var channel = new XDMChannel(window, targetOrigin);
            this._channels.push(channel);
            return channel;
        };
        XDMChannelManager.prototype._handleMessageReceived = function (event) {
            // get channel and dispatch to it
            var i, len, channel;
            var rpcMessage;
            if (typeof event.data === "string") {
                try {
                    rpcMessage = JSON.parse(event.data);
                }
                catch (error) {
                }
            }
            if (rpcMessage) {
                var handled = false;
                var channelOwner;
                for (i = 0, len = this._channels.length; i < len; i++) {
                    channel = this._channels[i];
                    if (channel.owns(event.source, event.origin, rpcMessage)) {
                        // keep a reference to the channel owner found. 
                        channelOwner = channel;
                        handled = channel.onMessage(rpcMessage, event.origin) || handled;
                    }
                }
                if (!!channelOwner && !handled) {
                    if (window.console) {
                        console.error("No handler found on any channel for message: " + JSON.stringify(rpcMessage));
                    }
                    // for instance based proxies, send an error on the channel owning the message to resolve any control creation promises
                    // on the host frame. 
                    if (rpcMessage.instanceId) {
                        channelOwner.error(rpcMessage, "The registered object " + rpcMessage.instanceId + " could not be found.");
                    }
                }
            }
        };
        XDMChannelManager.prototype._subscribe = function (windowObj) {
            var _this = this;
            if (windowObj.addEventListener) {
                windowObj.addEventListener("message", function (event) {
                    _this._handleMessageReceived(event);
                });
            }
            else {
                // IE8
                windowObj.attachEvent("onmessage", function (event) {
                    _this._handleMessageReceived(event);
                });
            }
        };
        return XDMChannelManager;
    })();
    XDM.XDMChannelManager = XDMChannelManager;
})(XDM || (XDM = {}));
var VSS;
(function (VSS) {
    VSS.VssSDKVersion = 0.1;
    VSS.VssSDKRestVersion = "2.2";
    var bodyElement;
    var webContext;
    var hostPageContext;
    var extensionContext;
    var initialConfiguration;
    var initialContribution;
    var initOptions;
    var loaderConfigured = false;
    var usingPlatformScripts;
    var usingPlatformStyles;
    var isReady = false;
    var readyCallbacks;
    var parentChannel = XDM.XDMChannelManager.get().addChannel(window.parent);
    /**
    * Service Ids for core services (to be used in VSS.getService)
    */
    var ServiceIds;
    (function (ServiceIds) {
        /**
        * Service for showing dialogs in the host frame
        * Use: <IHostDialogService>
        */
        ServiceIds.Dialog = "ms.vss-web.dialog-service";
        /**
        * Service for interacting with the host frame's navigation (getting/updating the address/hash, reloading the page, etc.)
        * Use: <IHostNavigationService>
        */
        ServiceIds.Navigation = "ms.vss-web.navigation-service";
        /**
        * Service for interacting with extension data (setting/setting documents and collections)
        * Use: <IExtensionDataService>
        */
        ServiceIds.ExtensionData = "ms.vss-web.data-service";
    })(ServiceIds = VSS.ServiceIds || (VSS.ServiceIds = {}));
    /**
     * Initiates the handshake with the host window.
     *
     * @param options Initialization options for the extension.
     */
    function init(options) {
        initOptions = options || {};
        usingPlatformScripts = initOptions.usePlatformScripts;
        usingPlatformStyles = initOptions.usePlatformStyles;
        // Run this after current execution path is complete - allows objects to get initialized
        window.setTimeout(function () {
            var appHandshakeData = {
                notifyLoadSucceeded: !initOptions.explicitNotifyLoaded,
                extensionReusedCallback: initOptions.extensionReusedCallback
            };
            parentChannel.invokeRemoteMethod("initialHandshake", "VSS.HostControl", [appHandshakeData]).then(function (handshakeData) {
                hostPageContext = handshakeData.pageContext;
                webContext = hostPageContext.webContext;
                initialConfiguration = handshakeData.initialConfig || {};
                initialContribution = handshakeData.contribution;
                extensionContext = handshakeData.extensionContext;
                if (usingPlatformScripts || usingPlatformStyles) {
                    setupAmdLoader();
                }
                else {
                    triggerReady();
                }
            });
        }, 0);
    }
    VSS.init = init;
    /**
     * Ensures that the AMD loader from the host is configured and fetches a script (AMD) module
     * (and its dependencies). If no callback is supplied, this will still perform an asynchronous
     * fetch of the module (unlike AMD require which returns synchronously). This method has no return value.
     *
     * Usage:
     *
     * VSS.require(["VSS/Controls", "VSS/Controls/Grids"], function(Controls, Grids) {
     *    ...
     * });
     *
     * @param modules A single module path (string) or array of paths (string[])
     * @param callback Method called once the modules have been loaded.
     */
    function require(modules, callback) {
        var modulesArray;
        if (typeof modules === "string") {
            modulesArray = [modules];
        }
        else {
            modulesArray = modules;
        }
        if (!callback) {
            // Generate an empty callback for require
            callback = function () { };
        }
        if (loaderConfigured) {
            // Loader already configured, just issue require
            window.require(modulesArray, callback);
        }
        else {
            if (!initOptions) {
                init({ usePlatformScripts: true });
            }
            else if (!usingPlatformScripts) {
                usingPlatformScripts = true;
                if (isReady) {
                    // We are in the ready state, but previously not using the loader, so set it up now
                    // which will re-trigger ready
                    isReady = false;
                    setupAmdLoader();
                }
            }
            ready(function () {
                window.require(modulesArray, callback);
            });
        }
    }
    VSS.require = require;
    /**
    * Register a callback that gets called once the initial setup/handshake has completed.
    * If the initial setup is already completed, the callback is invoked at the end of the current call stack.
    */
    function ready(callback) {
        if (isReady) {
            window.setTimeout(callback, 0);
        }
        else {
            if (!readyCallbacks) {
                readyCallbacks = [];
            }
            readyCallbacks.push(callback);
        }
    }
    VSS.ready = ready;
    /**
    * Notifies the host that the extension successfully loaded (stop showing the loading indicator)
    */
    function notifyLoadSucceeded() {
        parentChannel.invokeRemoteMethod("notifyLoadSucceeded", "VSS.HostControl");
    }
    VSS.notifyLoadSucceeded = notifyLoadSucceeded;
    /**
    * Notifies the host that the extension failed to load
    */
    function notifyLoadFailed(e) {
        parentChannel.invokeRemoteMethod("notifyLoadFailed", "VSS.HostControl", [e]);
    }
    VSS.notifyLoadFailed = notifyLoadFailed;
    /**
    * Get the web context from the parent host
    */
    function getWebContext() {
        return webContext;
    }
    VSS.getWebContext = getWebContext;
    /**
    * Get the configuration data passed in the initial handshake from the parent frame
    */
    function getConfiguration() {
        return initialConfiguration;
    }
    VSS.getConfiguration = getConfiguration;
    /**
    * Get the context about the extension that owns the content that is being hosted
    */
    function getExtensionContext() {
        return extensionContext;
    }
    VSS.getExtensionContext = getExtensionContext;
    /**
    * Gets the information about the contribution that first caused this extension to load.
    */
    function getContribution() {
        return initialContribution;
    }
    VSS.getContribution = getContribution;
    /**
    * Get a contributed service from the parent host.
    *
    * @param contributionId Full Id of the service contribution to get the instance of
    * @param context Optional context information to use when obtaining the service instance
    */
    function getService(contributionId, context) {
        if (!context) {
            context = {};
        }
        if (!context["webContext"]) {
            context["webContext"] = getWebContext();
        }
        if (!context["extensionContext"]) {
            context["extensionContext"] = getExtensionContext();
        }
        return getServiceContribution(contributionId).then(function (serviceContribution) {
            return serviceContribution.getInstance(serviceContribution.id, context);
        });
    }
    VSS.getService = getService;
    /**
    * Get the contribution with the given contribution id. The returned contribution has a method to get a registered object within that contribution.
    *
    * @param contributionId Id of the contribution to get
    */
    function getServiceContribution(contributionId) {
        var deferred = XDM.createDeferred();
        VSS.ready(function () {
            parentChannel.invokeRemoteMethod("getServiceContribution", "vss.hostManagement", [contributionId]).then(function (contribution) {
                var serviceContribution = contribution;
                serviceContribution.getInstance = function (objectId, context) {
                    return getBackgroundContributionInstance(contribution, objectId, context);
                };
                deferred.resolve(serviceContribution);
            }, deferred.reject);
        });
        return deferred.promise;
    }
    VSS.getServiceContribution = getServiceContribution;
    /**
    * Get contributions that target a given contribution id. The returned contributions have a method to get a registered object within that contribution.
    *
    * @param targetContributionId Contributions that target the contribution with this id will be returned
    */
    function getServiceContributions(targetContributionId) {
        var deferred = XDM.createDeferred();
        VSS.ready(function () {
            parentChannel.invokeRemoteMethod("getContributionsForTarget", "vss.hostManagement", [targetContributionId]).then(function (contributions) {
                var serviceContributions = [];
                contributions.forEach(function (contribution) {
                    var serviceContribution = contribution;
                    serviceContribution.getInstance = function (objectId, context) {
                        return getBackgroundContributionInstance(contribution, objectId, context);
                    };
                    serviceContributions.push(serviceContribution);
                });
                deferred.resolve(serviceContributions);
            }, deferred.reject);
        });
        return deferred.promise;
    }
    VSS.getServiceContributions = getServiceContributions;
    /**
    * Create an instance of a registered object within the given contribution in the host's frame
    *
    * @param contribution The contribution to get an object from
    * @param objectId Optional id of the registered object (the contribution's id property is used by default)
    * @param contextData Optional context to use when getting the object.
    */
    function getBackgroundContributionInstance(contribution, objectId, contextData) {
        var deferred = XDM.createDeferred();
        VSS.ready(function () {
            parentChannel.invokeRemoteMethod("getBackgroundContributionInstance", "vss.hostManagement", [contribution, objectId, contextData]).then(deferred.resolve, deferred.reject);
        });
        return deferred.promise;
    }
    /**
    * Register an object (instance or factory method) that this extension exposes to the host frame.
    *
    * @param instanceId unique id of the registered object
    * @param instance Either: (1) an object instance, or (2) a function that takes optional context data and returns an object instance.
    */
    function register(instanceId, instance) {
        parentChannel.getObjectRegistry().register(instanceId, instance);
    }
    VSS.register = register;
    /**
    * Get an instance of an object registered with the given id
    *
    * @param instanceId unique id of the registered object
    * @param contextData Optional context data to pass to the contructor of an object factory method
    */
    function getRegisteredObject(instanceId, contextData) {
        return parentChannel.getObjectRegistry().getInstance(instanceId, contextData);
    }
    VSS.getRegisteredObject = getRegisteredObject;
    /**
    * Fetch an access token which will allow calls to be made to other VSTS services
    */
    function getAccessToken() {
        return parentChannel.invokeRemoteMethod("getAccessToken", "VSS.HostControl");
    }
    VSS.getAccessToken = getAccessToken;
    /**
    * Fetch an token which can be used to identify the current user
    */
    function getAppToken() {
        return parentChannel.invokeRemoteMethod("getAppToken", "VSS.HostControl");
    }
    VSS.getAppToken = getAppToken;
    /**
    * Requests the parent window to resize the container for this extension based on the current extension size.
    */
    function resize() {
        if (!bodyElement) {
            bodyElement = document.getElementsByTagName("body").item(0);
        }
        parentChannel.invokeRemoteMethod("resize", "VSS.HostControl", [bodyElement.scrollWidth, bodyElement.scrollHeight]);
    }
    VSS.resize = resize;
    function setupAmdLoader() {
        var hostRootUri = getRootUri(hostPageContext.webContext);
        // Place context so that VSS scripts pick it up correctly
        window.__vssPageContext = hostPageContext;
        // MS Ajax config needs to exist before loading MS Ajax library
        window.__cultureInfo = hostPageContext.microsoftAjaxConfig.cultureInfo;
        // Append CSS first
        if (usingPlatformStyles !== false) {
            if (hostPageContext.coreReferences.stylesheets) {
                hostPageContext.coreReferences.stylesheets.forEach(function (stylesheet) {
                    if (stylesheet.isCoreStylesheet) {
                        var cssLink = document.createElement("link");
                        cssLink.href = getAbsoluteUrl(stylesheet.url, hostRootUri);
                        cssLink.rel = "stylesheet";
                        safeAppendToDom(cssLink, "head");
                    }
                });
            }
        }
        if (!usingPlatformScripts) {
            // Just wanted to load CSS, no scripts. Can exit here.
            loaderConfigured = true;
            triggerReady();
            return;
        }
        var scripts = [];
        var anyCoreScriptLoaded = false;
        // Add scripts and loader configuration
        if (hostPageContext.coreReferences.scripts) {
            hostPageContext.coreReferences.scripts.forEach(function (script) {
                if (script.isCoreModule) {
                    var alreadyLoaded = false;
                    var global = window;
                    if (script.identifier === "JQuery") {
                        alreadyLoaded = !!global.jQuery;
                    }
                    else if (script.identifier === "JQueryUI") {
                        alreadyLoaded = !!(global.jQuery && global.jQuery.ui && global.jQuery.ui.version);
                    }
                    else if (script.identifier === "AMDLoader") {
                        alreadyLoaded = typeof global.define === "function" && !!global.define.amd;
                    }
                    if (!alreadyLoaded) {
                        scripts.push({ source: getAbsoluteUrl(script.url, hostRootUri) });
                    }
                    else {
                        anyCoreScriptLoaded = true;
                    }
                }
            });
            if (hostPageContext.coreReferences.coreScriptsBundle && !anyCoreScriptLoaded) {
                // If core scripts bundle exists and no core scripts already loaded by extension,
                // we are free to add core bundle. otherwise, load core scripts individually.
                scripts = [{ source: getAbsoluteUrl(hostPageContext.coreReferences.coreScriptsBundle.url, hostRootUri) }];
            }
        }
        // Define a new config for extension loader
        var newConfig = {
            baseUrl: extensionContext.baseUri,
            contributionPaths: null,
            paths: {},
            shim: {}
        };
        // See whether any configuration specified initially. If yes, copy them to new config
        if (initOptions.moduleLoaderConfig) {
            if (initOptions.moduleLoaderConfig.baseUrl) {
                newConfig.baseUrl = initOptions.moduleLoaderConfig.baseUrl;
            }
            // Copy paths
            extendLoaderPaths(initOptions.moduleLoaderConfig, newConfig);
            // Copy shim
            extendLoaderShim(initOptions.moduleLoaderConfig, newConfig);
        }
        // Use some of the host config to support VSSF and TFS platform as well as some 3rd party libraries
        if (hostPageContext.moduleLoaderConfig) {
            // Copy host shim
            extendLoaderShim(hostPageContext.moduleLoaderConfig, newConfig);
            // Add contribution paths to new config
            var contributionPaths = hostPageContext.moduleLoaderConfig.contributionPaths;
            if (contributionPaths) {
                for (var p in contributionPaths) {
                    if (contributionPaths.hasOwnProperty(p) && !newConfig.paths[p]) {
                        // Add the contribution path
                        var contributionPathValue = contributionPaths[p].value;
                        if (!contributionPathValue.match("^https?://")) {
                            newConfig.paths[p] = hostRootUri + contributionPathValue;
                        }
                        else {
                            newConfig.paths[p] = contributionPathValue;
                        }
                        // Look for other path mappings that fall under the contribution path (e.g. "bundles")
                        var configPaths = hostPageContext.moduleLoaderConfig.paths;
                        if (configPaths) {
                            var contributionRoot = p + "/";
                            var rootScriptPath = combinePaths(hostRootUri, hostPageContext.moduleLoaderConfig.baseUrl);
                            for (var pathKey in configPaths) {
                                if (startsWith(pathKey, contributionRoot)) {
                                    var pathValue = configPaths[pathKey];
                                    if (!pathValue.match("^https?://")) {
                                        if (pathValue[0] === "/") {
                                            pathValue = combinePaths(hostRootUri, pathValue);
                                        }
                                        else {
                                            pathValue = combinePaths(rootScriptPath, pathValue);
                                        }
                                    }
                                    newConfig.paths[pathKey] = pathValue;
                                }
                            }
                        }
                    }
                }
            }
        }
        // requireJS public api doesn't support reading the current config, so save it off for use by our internal host control.
        window.__vssModuleLoaderConfig = newConfig;
        scripts.push({ content: "require.config(" + JSON.stringify(newConfig) + ");" });
        addScriptElements(scripts, 0, function () {
            loaderConfigured = true;
            triggerReady();
        });
    }
    function startsWith(rootString, startSubstring) {
        if (rootString && rootString.length >= startSubstring.length) {
            return rootString.substr(0, startSubstring.length).localeCompare(startSubstring) === 0;
        }
        return false;
    }
    function combinePaths(path1, path2) {
        var result = path1 || "";
        if (result[result.length - 1] !== "/") {
            result += "/";
        }
        if (path2) {
            if (path2[0] === "/") {
                result += path2.substr(1);
            }
            else {
                result += path2;
            }
        }
        return result;
    }
    function extendLoaderPaths(source, target, pathTranslator) {
        if (source.paths) {
            if (!target.paths) {
                target.paths = {};
            }
            for (var key in source.paths) {
                if (source.paths.hasOwnProperty(key)) {
                    var value = source.paths[key];
                    if (pathTranslator) {
                        value = pathTranslator(key, source.paths[key]);
                    }
                    if (value) {
                        target.paths[key] = value;
                    }
                }
            }
        }
    }
    function extendLoaderShim(source, target) {
        if (source.shim) {
            if (!target.shim) {
                target.shim = {};
            }
            for (var key in source.shim) {
                if (source.shim.hasOwnProperty(key)) {
                    target.shim[key] = source.shim[key];
                }
            }
        }
    }
    function getRootUri(webContext) {
        var hostContext = (webContext.account || webContext.host);
        var rootUri = hostContext.uri;
        var relativeUri = hostContext.relativeUri;
        if (rootUri && relativeUri) {
            // Ensure both relative and root paths end with a trailing slash before trimming the relative path.
            if (rootUri[rootUri.length - 1] !== "/") {
                rootUri += "/";
            }
            if (relativeUri[relativeUri.length - 1] !== "/") {
                relativeUri += "/";
            }
            rootUri = rootUri.substr(0, rootUri.length - relativeUri.length);
        }
        return rootUri;
    }
    function addScriptElements(scripts, index, callback) {
        var _this = this;
        if (index >= scripts.length) {
            callback.call(this);
            return;
        }
        var scriptTag = document.createElement("script");
        scriptTag.type = "text/javascript";
        if (scripts[index].source) {
            var scriptSource = scripts[index].source;
            scriptTag.src = scriptSource;
            scriptTag.addEventListener("load", function () {
                addScriptElements.call(_this, scripts, index + 1, callback);
            });
            scriptTag.addEventListener("error", function (e) {
                notifyLoadFailed("Failed to load script: " + scriptSource);
            });
            safeAppendToDom(scriptTag, "head");
        }
        else if (scripts[index].content) {
            scriptTag.textContent = scripts[index].content;
            safeAppendToDom(scriptTag, "head");
            addScriptElements.call(this, scripts, index + 1, callback);
        }
    }
    function safeAppendToDom(element, section) {
        var parent = document.getElementsByTagName(section)[0];
        if (!parent) {
            parent = document.createElement(section);
            document.appendChild(parent);
        }
        parent.appendChild(element);
    }
    function getAbsoluteUrl(url, baseUrl) {
        var lcUrl = (url || "").toLowerCase();
        if (lcUrl.substr(0, 2) !== "//" && lcUrl.substr(0, 5) !== "http:" && lcUrl.substr(0, 6) !== "https:") {
            url = baseUrl + (lcUrl[0] === "/" ? "" : "/") + url;
        }
        return url;
    }
    function triggerReady() {
        var _this = this;
        isReady = true;
        if (readyCallbacks) {
            var savedReadyCallbacks = readyCallbacks;
            readyCallbacks = null;
            savedReadyCallbacks.forEach(function (callback) {
                callback.call(_this);
            });
        }
    }
})(VSS || (VSS = {}));
//dependencies=
