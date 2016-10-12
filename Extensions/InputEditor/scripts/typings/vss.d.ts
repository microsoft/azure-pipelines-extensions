// Type definitions for Microsoft Visual Studio Services v97.20160425.1023
// Project: http://www.visualstudio.com/integrate/extensions/overview
// Definitions by: Microsoft <vsointegration@microsoft.com>

/// <reference path='knockout.d.ts' />
/// <reference path='jquery.d.ts' />
/// <reference path='q.d.ts' />
/// <reference path='require.d.ts' />
//----------------------------------------------------------
// Common interfaces specific to WebPlatform area
//----------------------------------------------------------

/**
* VSS-specific options for VSS ajax requests
*/
interface IVssAjaxOptions {

    /*
    * Auth token manager that can be used to get and attach auth tokens to requests
    */
    authTokenManager?: IAuthTokenManager<any>;

    /**
     * If true, textStatus and jqXHR are added to the success callback. In this case, spread (instead of then) needs to be used (default false).
     */
    useAjaxResult?: boolean;

    /**
     * If true, the progress indicator will be shown while the request is executing. Defaults to true.
     */
    showProgressIndicator?: boolean;
}

/**
* Event listener for VSS ajax events. Gets notified before and after each request
*/
interface IVssAjaxEventListener {

    /**
    * Method invoked before a request is sent
    *
    * @param requestId A unique id that can be used to track this particular request (id is unique among all clients)
    * @param requestUrl Url of the request that is about to be issued
    * @param ajaxOptions Ajax settings/options for the request
    * @param vssRequestOptions Additional VSS-specific options supplied in the request
    */
    beforeRequest?: (requestId: number, requestUrl: string, ajaxOptions: JQueryAjaxSettings, vssRequestOptions: IVssAjaxOptions) => void;

    /**
    * Method invoked when a response has been received
    *
    * @param requestId A unique id that can be used to track this particular request (id is unique among all clients)
    * @param data The response data
    * @param textStatus A string indicating status of the request
    * @param jqXHR: The jQuery XHR object for the request
    * @param vssRequestOptions Additional VSS-specific options supplied in the request
    */
    responseReceived?: (requestId: number, data: any, textStatus: string, jqXHR: JQueryXHR, vssRequestOptions: IVssAjaxOptions) => void;
    
    /**
    * Method invoked after a response has been received and its callback/promise has been invoked
    *
    * @param requestId A unique id that can be used to track this particular request (id is unique among all clients)
    * @param data The response data
    * @param textStatus A string indicating status of the request
    * @param jqXHR: The jQuery XHR object for the request
    * @param vssRequestOptions Additional VSS-specific options supplied in the request
    */
    postResponseCallback?: (requestId: number, data: any, textStatus: string, jqXHR: JQueryXHR, vssRequestOptions: IVssAjaxOptions) => void;
}

/**
* Interface for a class that can fetch auth tokens to be used in AJAX requests.
*/
interface IAuthTokenManager<TToken> {

    /**
    * Get the auth token to use for this request.
    *
    * @param refresh If true refresh the token (i.e. request a new one - don't use a cached token)
    */
    getAuthToken(refresh?: boolean): IPromise<TToken>;
    
    /**
     * Gets the authorization header to use in a request from the given token
     *
     * @param sessionToken Used for token key.
     * @return the value to use for the Authorization header in a request.
     */
    getAuthorizationHeader(sessionToken: TToken): string;
}

/**
* A promise represents the eventual result of an asynchronous operation. The primary way of interacting with a promise is through its then method,
* which registers callbacks to receive either a promise’s eventual value or the reason why the promise cannot be fulfilled.
*/
interface IPromise<T> {
    /**
     * Then method which accepts a fulfill delegate which returns a promise or nothing and a reject delegate which returns a promise or nothing. Then returns a new promise.
     */
    then<U>(onFulfill: (value: T) => IPromise<U> | void, onReject?: (reason: any) => IPromise<U> | void): IPromise<U>;

    /**
     * Then method which accepts a fulfill delegate which returns a promise or nothing and a reject delegate which returns a reason value or nothing. Then returns a new promise.
     */
    then<U>(onFulfill: (value: T) => IPromise<U> | void, onReject?: (reason: any) => U | void): IPromise<U>;

    /**
     * Then method which accepts a fulfill delegate which returns a value or nothing and a reject delegate which returns a promise or nothing. Then returns a new promise.
     */
    then<U>(onFulfill: (value: T) => U | void, onReject?: (reason: any) => IPromise<U> | void): IPromise<U>;

    /**
     * Then method which accepts a fulfill delegate which returns a value or nothing and a reject delegate which returns a reason value or nothing. Then returns a new promise.
     */
    then<U>(onFulfill: (value: T) => U | void, onReject?: (reason: any) => U | void): IPromise<U>;
}
interface EventTarget {
    checked: boolean;
    nodeType: number;
}

interface Date {
    toGMTString(): string;
}

interface IErrorCallback {
    (error: any): void;
}

interface IResultCallback extends Function {
}

interface IArgsFunctionR<TResult> {
    (...args: any[]): TResult;
}

interface IFunctionPR<TParam, TResult> {
    (param: TParam): TResult;
}

interface IFunctionPPR<TParam1, TParam2, TResult> {
    (param1: TParam1, param2: TParam2): TResult;
}

interface IFunctionPPPR<TParam1, TParam2, TParam3, TResult> {
    (param1: TParam1, param2: TParam2, param3: TParam3): TResult;
}

interface IComparer<T> extends IFunctionPPR<T, T, number> {
}

interface IDictionaryStringTo<T> {
    [key: string]: T;
}

interface IDictionaryNumberTo<T> {
    [key: number]: T;
}

interface IEventHandler extends Function {
}

interface IWebApiArrayResult {
    count: number;
    value: any[];
}

interface Window {
    ActiveXObject: any;
    DOMParser: any;
    XSLTProcessor: any;
    vsSdkOnLoad:() => void;
}

interface ServerError {
    typeKey?: string;
}

interface TfsError extends Error {
    status?: string;
    stack?: string;
    serverError?: ServerError;
}

//These variables defined by server.
declare var exports: any;

declare var _disabledPlugins: string[];

interface IWebAccessPlugin {
    namespace: string;
    loadAfter: string;
}

declare var _plugins: IWebAccessPlugin[];
declare var _builtinPlugins: IWebAccessPlugin[];

interface IWebAccessPluginBase {
    namespace: string;
    base: string;
}

declare var _builtInBases: IWebAccessPluginBase[];
declare var _bases: IWebAccessPluginBase[];

interface IRequire {
    (moduleName: string): any;
    (moduleNames: string[], moduleFunc: Function): any;
    config: (config: any, shouldOverwrite?: boolean) => void;
}

interface IDefine {
    (moduleNames: string[], moduleFunc: Function): any;
    (id: string, moduleNames: string[], moduleFunc: Function): any;
}

interface IDisposable {
    dispose(): void;
}

interface IKeyValuePair<TKey, TValue> {
    key: TKey;
    value: TValue;
}

declare var require: IRequire;
declare var define: IDefine;
//----------------------------------------------------------
// Common interfaces specific to WebPlatform area
//----------------------------------------------------------

/**
* Interface for a single XDM channel
*/
interface IXDMChannel {
    
    /**
    * Invoke a method via RPC. Lookup the registered object on the remote end of the channel and invoke the specified method.
    *
    * @param method Name of the method to invoke
    * @param instanceId unique id of the registered object
    * @param params Arguments to the method to invoke
    * @param instanceContextData Optional context data to pass to a registered object's factory method
    */
    invokeRemoteMethod<T>(methodName: string, instanceId: string, params?: any[], instanceContextData?: Object): IPromise<T>;

    /**
    * Get a proxied object that represents the object registered with the given instance id on the remote side of this channel.
    *
    * @param instanceId unique id of the registered object
    * @param contextData Optional context data to pass to a registered object's factory method
    */
    getRemoteObjectProxy<T>(instanceId: string, contextData?: Object): IPromise<T>;

    /**
    * Get the object registry to handle messages from this specific channel.
    * Upon receiving a message, this channel registry will be used first, then
    * the global registry will be used if no handler is found here.
    */
    getObjectRegistry(): IXDMObjectRegistry;
}

/**
* Registry of XDM channels kept per target frame/window
*/
interface IXDMChannelManager {

    /**
    * Add an XDM channel for the given target window/iframe
    *
    * @param window Target iframe window to communicate with
    * @param targetOrigin Url of the target iframe (if known)
    */
    addChannel(window: Window, targetOrigin?: string): IXDMChannel;
}

/**
* Registry of XDM objects that can be invoked by an XDM channel
*/
interface IXDMObjectRegistry {
    
    /**
    * Register an object (instance or factory method) exposed by this frame to callers in a remote frame
    *
    * @param instanceId unique id of the registered object
    * @param instance Either: (1) an object instance, or (2) a function that takes optional context data and returns an object instance.
    */
    register(instanceId: string, instance: Object | { (contextData?: any): Object; }): void;

    /**
    * Get an instance of an object registered with the given id
    *
    * @param instanceId unique id of the registered object
    * @param contextData Optional context data to pass to the contructor of an object factory method
    */
    getInstance<T>(instanceId: string, contextData?: Object): T;
}

/**
* Options for the extension's initialization method
*/
interface IExtensionInitializationOptions {

    /**
    * Set to true if the extension will explicitly call notifyLoadSucceeded or notifyLoadFailed
    * itself to indicate that the extension is done loading (stops UI loading indicator in the host).
    * If false (the default) the extension is considered ready as soon as init is called.
    */
    explicitNotifyLoaded?: boolean;

    /**
    * Set to true if the extension is going to consume any VSS script libraries.
    * For example, controls, REST clients, services, etc.
    * This pulls in the script loader and configuration data from the host frame so that
    * 'require' statements can be used to load VSTS modules. A call to VSS.require will
    * effectively turn this option on, even if not specified in the VSS.init handshake.
    */
    usePlatformScripts?: boolean;

    /**
    * Set to true if the extension desires to use VSS platform CSS styles. If not explicitly set,
    * the default value is the value of 'usePlatformScripts'.
    */
    usePlatformStyles?: boolean;

    /**
    * Extension-specific AMD module loader configuration. This configuration
    * will be merged with the VSTS-specific configuration.
    */
    moduleLoaderConfig?: ModuleLoaderConfiguration;

    /**
    * Optional callback method that gets invoked when this extension frame is reused by another contribution
    * which shares the same URI of the contribution that originally caused this extension frame to be loaded.
    */
    extensionReusedCallback?: (contribution: Contribution) => void;
}

/**
* Data passed from the host to an extension frame via the initial handshake
*/
interface IHostHandshakeData {

    /**
    * Static context information about the current page
    */
    pageContext: PageContext;

    /**
    * Initial configuration for the extension frame
    */
    initialConfig?: any;

    /**
    * Context information about the extension
    */
    extensionContext: IExtensionContext;

    /**
    * The contribution that caused the extension frame to be loaded.
    */
    contribution: Contribution;
}

/**
* Data passed to the host from an extension frame via the initial handshake
*/
interface IExtensionHandshakeData {

    /**
    * If true, consider the extension loaded upon completion of the initial handshake.
    */
    notifyLoadSucceeded: boolean;

    /**
    * Optional callback method that gets invoked when this extension frame is reused by another contribution
    * which shares the same URI of the contribution that originally caused this extension frame to be loaded.
    */
    extensionReusedCallback?: (contribution: Contribution) => void;
}

/**
* Information about a control interface that is exposed across iframe boundaries
*/
interface IExternalControlInterfaceInfo {
    methodNames: string[];
}

/**
* Context about the app that owns the content that is being hosted
*/
interface IExtensionContext {
    /**
    * Friendly unique id of the publisher
    */
    publisherId: string;

    /**
    * Friendly id of the extension (unique within the publisher)
    */
    extensionId: string;

    /**
    * Version of the extension
    */
    version: string;

    /**
    * The base uri to be used with relative urls in contribution properties
    */
    baseUri: string;
}

/**
* Context passed to GetServiceInstance
*/
interface IDefaultGetServiceContext {

    /**
    * The web context to be used in the get service call
    */
    webContext: WebContext;

    /**
    * The extension context, i.e. publisher id, extension id, etc.
    */
    extensionContext: IExtensionContext;

    /**
    * Options that were passed to the host management service, 
    * contains the registered VSS auth application id
    */
    hostManagementServiceOptions: IHostManagementServiceOptions;
}

/**
* Options passed to the host management service
*/
interface IHostManagementServiceOptions extends IExtensionContext {

    /**
    * The registered VSS auth application id
    */
    registrationId: string;
}

/**
* Session token whose value can be added to the Authorization header in requests to VSTS endpoints
*/
interface ISessionToken {

    /**
    * The registered VSS auth application id
    */
    appId: string;

    /**
    * Name describing the token
    */
    name: string;

    /**
    * Token value
    */
    token: string;
}

/**
* A Contribution with its containing extension
*/
interface IExtensionContribution extends Contribution {

    /**
    * The extension that owns this contribution
    */
    extension: Extension;
}

/**
* Information about an individual contribution that contributes one or more services registered by id.
*/
interface IServiceContribution extends IExtensionContribution {
    
    /**
    * Get the instance of an object registered by this contribution
    *
    * @param objectId Id of the registered object (defaults to the id property of the contribution)
    * @param context Optional context to use when getting the object.
    */
    getInstance<T>(objectId?: string, context?: any): IPromise<T>;
}

interface IHostDialogOptions {

    height?: number;
    width?: number;
    draggable?: boolean;
    resizable?: boolean;
    title?: string;
    modal?: boolean;
    buttons?: IDictionaryStringTo<any>;
    open?: Function;
    close?: Function;
    getDialogResult?: () => any;
    okCallback?: (result: any) => void;
    cancelCallback?: Function;
    okText?: string;
    cancelText?: string;
}

interface IExternalDialog {
    
    /**
    * Gets an object registered in the dialog's contribution control.
    *
    * @param instanceId Id of the instance to get
    * @param contextData Optional data to pass to the extension for it to use when creating the instance
    * @return Promise that is resolved to the instance (a proxy object that talks to the instance)
    */
    getContributionInstance<T>(instanceId: string, contextData?: any): IPromise<T>;

    /**
    * Close the dialog
    */
    close();

    /**
    * Update the title of the dialog
    *
    * @param title New dialog title
    */
    setTitle(title: string);

    /**
    * Update the enablement of the OK button
    */
    updateOkButton(enabled: boolean);
}

/**
 * Represents a button used in IHostDialogService.openMessageDialog().
 */
interface IMessageDialogButton {
    /**
     * Used as HTML id of the button.
     */
    id: string;
    /**
     * Text to display on the button.
     */
    text: string;
    /**
     * When true, the dialog's promise is rejected instead of resolved when this button is clicked.
     */
    reject?: boolean;
    /**
     * Specifies how the button should look. 
     * Possible values: 
     *   (undefined) - Default
     *   "warning" - Red
     */
    style?: string;
}

/**
 * Used by IHostDialogService.openMessageDialog().
 */
interface IOpenMessageDialogOptions {
    /**
     * Array of buttons to show. Default is [Button.Ok, Button.Cancel]
     */
    buttons?: IMessageDialogButton[];
    /**
     * Button to use when the user presses the Esc key. Default is the last button.
     */
    escapeButton?: IMessageDialogButton;
    /**
     * If this is set, the user will be presented with a text box. Non-rejecting buttons will be disabled until the user types in this string.
     */
    requiredTypedConfirmation?: string;
    /**
     * Text for the title bar of the dialog. Default is "Confirm".
     */
    title?: string;
    /**
     * Width of dialog in px.
     */
    width?: number;
    /**
     * Height of dialog in px.
     */
    height?: number;
    /**
     * Use Bowtie styling. Default is true.
     */
    useBowtieStyle?: boolean;
}

/**
 * Result returned when a MessageDialog is closed.
 */
interface IMessageDialogResult {
    /**
     * Button that was clicked to dismiss the dialog.
     */
    button: IMessageDialogButton;
}

/**
* Service which manages showing dialogs in the parent frame
*/
interface IHostDialogService {
    
    /**
    * Open a modal dialog in the host frame which will get its content from a contributed control.
    * 
    * @param contributionId The id of the control contribution to host in the dialog
    * @param dialogOptions options.title - title of dialog
    * @param contributionConfig Initial configuration to pass to the contribution control.
    * @param postContent Optional data to post to the contribution endpoint. If not specified, a GET request will be performed.
    */
    openDialog(contributionId: string, dialogOptions: IHostDialogOptions, contributionConfig?: Object, postContent?: Object): IPromise<IExternalDialog>;

    /**
     * Open a modal dialog in the host frame which will display the supplied message.
     * @param message the message to display in the dialog. 
     * @param methodOptions options affecting the dialog
     * @returns a promise that is resolved when the user accepts the dialog (Ok, Yes, any button with Button.reject===false), or rejected if the user does not (Cancel, No, any button with Button.reject===true).
     */
    openMessageDialog(message: string, options?: IOpenMessageDialogOptions): IPromise<IMessageDialogResult>;

    buttons: {
        /**
         * Localized Ok button.
         */
        ok: IMessageDialogButton;
        /**
         * Localized Cancel button.
         */
        cancel: IMessageDialogButton;
        /**
         * Localized Yes button.
         */
        yes: IMessageDialogButton;
        /**
         * Localized No button.
         */
        no: IMessageDialogButton;
    }
}

/**
* Service which allows interaction with the browser location and navigation of the host frame
*/
interface IHostNavigationService {
    
    /**
     * Reloads the parent frame
     */
    reload();

    /**
    * Add a callback to be invoked each time the hash navigation has changed
    *
    * @param callback Method invoked on each navigation hash change
    */
    onHashChanged(callback: (hash: string) => void);

    /**
    * Gets the current hash.
    *
    * @return Hash part of the host page's url (url following #)
    */
    getHash(): IPromise<string>;

    /**
    * Sets the provided hash from the hosted content.
    *
    * @param hash The new hash string to 
    */
    setHash(hash: string);
}

/**
* Service which allows for getting and setting of extension data
*/
interface IExtensionDataService {

    /**
    * Returns a promise for retrieving a setting at the provided key and scope
    *
    * @param key The key to retrieve a value for
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    getValue<T>(key: string, documentOptions?: IDocumentOptions): IPromise<T>;

    /**
    * Returns a promise for saving a setting at the provided key and scope
    *
    * @param key The key to save a value for
    * @param value The value to save
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    setValue<T>(key: string, value: T, documentOptions?: IDocumentOptions): IPromise<T>;

    /**
    * Returns a promise for getting a document with the provided id in the provided collection
    *
    * @param collectionName The name of the collection where the document lives
    * @param id The id of the document in the collection
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    getDocument(collectionName: string, id: string, documentOptions?: IDocumentOptions): IPromise<any>;

    /**
    * Returns a promise for getting all of the documents in the provided collection
    *
    * @param collectionName The name of the collection where the document lives
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    getDocuments(collectionName: string, documentOptions?: IDocumentOptions): IPromise<any[]>;

    /**
    * Returns a promise for creating a document in the provided collection
    *
    * @param collectionName The name of the collection where the document lives
    * @param doc The document to store
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    createDocument(collectionName: string, doc: any, documentOptions?: IDocumentOptions): IPromise<any>;

    /**
    * Returns a promise for setting a document in the provided collection
    * Creates the document if it does not exist, otherwise updates the existing document with the id provided
    *
    * @param collectionName The name of the collection where the document lives
    * @param doc The document to store
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    setDocument(collectionName: string, doc: any, documentOptions?: IDocumentOptions): IPromise<any>;

    /**
    * Returns a promise for updating a document in the provided collection
    * A document with the id provided must exist
    *
    * @param collectionName The name of the collection where the document lives
    * @param doc The document to store
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    updateDocument(collectionName: string, doc: any, documentOptions?: IDocumentOptions): IPromise<any>;

    /**
    * Returns a promise for deleting the document at the provided scope, collection and id
    *
    * @param collectionName The name of the collection where the document lives
    * @param id The id of the document in the collection
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    deleteDocument(collectionName: string, id: string, documentOptions?: IDocumentOptions): IPromise<void>;
}

/**
* Interface for options that can be supplied with document actions
*/
interface IDocumentOptions {
    /**
    * The scope of where the document is stored. Can be Account or User.
    */
    scopeType: string;

    /**
    * The value of the scope where the document is stored. Can be Current or Me.
    */
    scopeValue?: string;

    /**
    * The default value to return when using getValue(). If the document has no value,
    * this value will be used instead.
    */
    defaultValue?: any;
}

/**
* Interface for a registered object that contributes menu item(s)
*/
interface IContributedMenuSource {

    /**
    * Get an array of menu items for the given context
    *
    * @param context Menu-specific context information
    * @return Array of menu items or a promise for the array
    */
    getMenuItems(context: any): IContributedMenuItem[] | IPromise<IContributedMenuItem[]>;

    /**
    * Handle a menu item from this menu source being clicked. This is only invoked when the
    * contributed menu item does not have an "action" method.
    *
    * @param actionContext Menu-specific context information
    */
    execute(actionContext: any);
}

/**
* An individual contributed menu item
*/
interface IContributedMenuItem {

    /**
    * Menu-item specific identifier
    */
    id?: string;

    /**
    * Text to display in the menu item
    */
    text?: string;

    /**
    * Tooltip to display for the menu item
    */
    title?: string;

    /**
    * Set to true if this menu item is just a separator
    */
    separator?: boolean;

    /**
    * Set to true if this menu item should be disabled
    */
    disabled?: boolean;

    /**
     * If true, the menu item will not be displayed.
     */
    hidden?: boolean;

    /**
    * Url to an icon image or css class for the image cell
    */
    icon?: string;

    /**
    * If true, do not render an icon or space for an icon.
    */
    noIcon?: boolean;

    /**
    * If this menu item has a sub menu, these are the contributed child items
    */
    childItems?: IContributedMenuItem[];

    /**
    * Id of the menu group that this item should be placed in.
    */
    groupId?: string;

    /**
    * Method invoked when the menu item is clicked.
    *
    * @param actionContext Menu-specific context information
    */
    action?: (actionContext: any) => void;
}
interface IContributedTab {
    /**
     * Determines if this tab should be displayed
     * @param context Context information
     * @return boolean Return true not to show this tab.
     */
    isInvisible?: (context?: any) => boolean | IPromise<boolean>;

    /**
     * Page title, which will be displayed above the list of Tabs
     * @param context Context information
     * @return string The unescaped page title
     */
    pageTitle: string | IPromise<string> | ((context?: any) => string | IPromise<string>);

    /**
     * Name of the tab
     * @param context Context information
     * @return string The unescaped text that appears as the name of the tab
     */
    name: string | IPromise<string> | ((context?: any) => string | IPromise<string>);

    /**
     * Title text for the tab, i.e., the tooltip
     * @param context Context information
     * @return string The tooltip text
     */
    title?: string | IPromise<string> | ((context?: any) => string | IPromise<string>);

    /**
     * URI to the page that this tab will display (i.e. in a frame)
     */
    uri: string;

    /**
     * Function that is invoked when there is a new context available for the extension.
     */
    updateContext: (context: any) => void | IPromise<void>;
}
//----------------------------------------------------------
// Copyright (C) Microsoft Corporation. All rights reserved.
//----------------------------------------------------------

//----------------------------------------------------------
// Generated file, DO NOT EDIT.
// To regenerate this file, run "GenerateConstants.cmd" .

// Generated data for the following assemblies:
// Microsoft.TeamFoundation.Server.WebAccess.Platform
// Microsoft.VisualStudio.Services.ExtensionManagement.WebApi
//----------------------------------------------------------


/**
* Model to represent a public access uri
*/
interface AccessPointModel {
    /**
    * Host name and port number of the url
    */
    authority: string;
    /**
    * Url scheme (http, https, ...)
    */
    scheme: string;
    /**
    * Full url
    */
    uri: string;
}

/**
* Model used to configure how TFS reports usage data to Application Insights
*/
interface AppInsightsConfiguration {
    /**
    * If true, automatically call "trackPage" when the page is loaded
    */
    autoTrackPage: boolean;
    /**
    * Optional data used to override the default values sent to trackPage
    */
    customTrackPageData: AppInsightsCustomTrackPageData;
    /**
    * Set to false if app insights reporting is not enabled/configured
    */
    enabled: boolean;
    /**
    * The url from which to retrieve app insights scripts
    */
    insightsScriptUrl: string;
    /**
    * The instrumentation key used to track this deployment's usage
    */
    instrumentationKey: string;
    /**
    * If true, include collection, project, and team info in the track-page urls
    */
    trackProjectInfo: boolean;
}

/**
* Model that can be used to customize the values sent to AppInsights via "trackPage"
*/
interface AppInsightsCustomTrackPageData {
    alias: string;
    metrics: { [key: string]: number; };
    pageName: string;
    properties: { [key: string]: string; };
}

/**
* Web Access configuration data. This information is used to process requests on the server.  This data is also placed in a json island on each page in order for JavaScript to know key configuration data required to things like construct proper urls
*/
interface ConfigurationContext {
    /**
    * MVC api configuration
    */
    api: ConfigurationContextApis;
    /**
    * Optional name of the client (e.g. TEE) hosting the page
    */
    clientHost: string;
    isHosted: boolean;
    /**
    * Current mail settings for TFS
    */
    mailSettings: TfsMailSettings;
    /**
    * Server resource paths
    */
    paths: ConfigurationContextPaths;
}

/**
* MVC api configuration
*/
interface ConfigurationContextApis {
    /**
    * Specifies the path prefix for the area
    */
    areaPrefix: string;
    /**
    * Specifies the path prefix for the controller
    */
    controllerPrefix: string;
    /**
    * Api-version for legacy rpc-style web access api controllers See WebApiVersionClient for the version coming from the client/browser.  The return value is a positive whole number >= 1.
    */
    webApiVersion: string;
}

/**
* Paths to server resources
*/
interface ConfigurationContextPaths {
    /**
    * Relative path to the _content path of the web application
    */
    resourcesPath: string;
    /**
    * Relative path to the root of the web application
    */
    rootPath: string;
    /**
    * Static content version stamp
    */
    staticContentVersion: string;
    /**
    * Relative path to unversioned 3rd party static content
    */
    staticRoot3rdParty: string;
    /**
    * Relative path to versioned static content
    */
    staticRootTfs: string;
}

declare enum ContextHostType {
    Unknown = 0,
    /**
    * The Deployment Host
    */
    Deployment = 1,
    /**
    * The Application Host
    */
    Application = 2,
    /**
    * The Project Collection
    */
    ProjectCollection = 4,
}

interface ContextIdentifier {
    id: string;
    name: string;
}

/**
* Page context configuration that can be contributed by remote services (different VSTS services delivering content to the page)
*/
interface ContributedServiceContext {
    /**
    * Dynamic bundles to include from this service
    */
    bundles: DynamicBundlesCollection;
    /**
    * Specifies the prefixes for CSS modules that should map to the current service. e.g. "VSS/LoaderPlugins/Css!EMS:ExtensionManagement" would map to ExtensionManagement.css under the themed content path of this service if "EMS" is in the CSSModulePrefixes list.
    */
    cssModulePrefixes: string[];
    /**
    * Feature flag states to include by default in page data (avoids AJAX lookup)
    */
    featureAvailability: FeatureAvailabilityContext;
    /**
    * Module loader configuration which may be merged-in with the parent host (if injected into the DOM) Because the config may be merged with the host config, each root area path must be explicitly defined here rather than relying on basePath as a catch-all.
    */
    moduleLoaderConfig: ModuleLoaderConfiguration;
    /**
    * Paths to resources on this service
    */
    paths: ConfigurationContextPaths;
    /**
    * Lookup of urls for different services (at different host levels)
    */
    serviceLocations: ServiceLocations;
    /**
    * The root url of the service that can be used to resolve relative links when this content is hosted in another site.
    */
    serviceRootUrl: string;
    /**
    * Instance id of the service
    */
    serviceTypeId: string;
}

/**
* An individual contribution made by an extension
*/
interface Contribution {
    /**
    * List of constraints (filters) that should be applied to the availability of this contribution
    */
    constraints: ContributionConstraint[];
    description: string;
    id: string;
    /**
    * Properties/attributes of this contribution
    */
    properties: any;
    /**
    * The ids of the contribution(s) that this contribution targets. (parent contributions)
    */
    targets: string[];
    /**
    * Id of the Contribution Type
    */
    type: string;
}

/**
* Base class shared by contributions and contribution types
*/
interface ContributionBase {
    /**
    * Description of the contribution/type
    */
    description: string;
    /**
    * Extension-relative identifier of the contribution/type
    */
    id: string;
}

/**
* Specifies a constraint that can be used to dynamically include/exclude a given contribution
*/
interface ContributionConstraint {
    /**
    * An optional property that can be specified to group constraints together. All constraints within a group are AND'd together (all must be evaluate to True in order for the contribution to be included). Different groups of constraints are OR'd (only one group needs to evaluate to True for the contribution to be included).
    */
    group: number;
    /**
    * If true, negate the result of the filter (include the contribution if the applied filter returns false instead of true)
    */
    inverse: boolean;
    /**
    * Name of the IContributionFilter class
    */
    name: string;
    /**
    * Properties that are fed to the contribution filter class
    */
    properties: any;
}

/**
* Identifier for contributions and contribution types
*/
interface ContributionIdentifier {
    /**
    * The extension id
    */
    extensionId: string;
    /**
    * The full/unique identifier of the contribution/contributionType
    */
    id: string;
    /**
    * The publisher id
    */
    publisherId: string;
    /**
    * The extension-relative contribution id
    */
    relativeId: string;
}

/**
* Item representing a contribution path. Can be of type default, resource or bundle
*/
interface ContributionPath {
    /**
    * Type if this contribution path
    */
    pathType: ContributionPathType;
    /**
    * Replace value for this contribution path
    */
    value: string;
}

/**
* Type of the contribution path
*/
declare enum ContributionPathType {
    Default = 0,
    Resource = 1,
}

/**
* Description about a property of a contribution type
*/
interface ContributionPropertyDescription {
    /**
    * Description of the property
    */
    description: string;
    /**
    * Name of the property
    */
    name: string;
    /**
    * True if this property is required
    */
    required: boolean;
    /**
    * The type of value used for this property
    */
    type: ContributionPropertyType;
}

/**
* The type of value used for a property
*/
declare enum ContributionPropertyType {
    /**
    * Contribution type is unknown (value may be anything)
    */
    Unknown = 0,
    /**
    * Value is a string
    */
    String = 1,
    /**
    * Value is a Uri
    */
    Uri = 2,
    /**
    * Value is a GUID
    */
    Guid = 4,
    /**
    * Value is True or False
    */
    Boolean = 8,
    /**
    * Value is an integer
    */
    Integer = 16,
    /**
    * Value is a double
    */
    Double = 32,
    /**
    * Value is a DateTime object
    */
    DateTime = 64,
    /**
    * Value is a generic Dictionary/JObject/property bag
    */
    Dictionary = 128,
    /**
    * Value is an array
    */
    Array = 256,
    /**
    * Value is an arbitrary/custom object
    */
    Object = 512,
}

/**
* A contribution type, given by a json schema
*/
interface ContributionType {
    description: string;
    id: string;
    /**
    * Controls whether or not contributions of this type have the type indexed for queries. This allows clients to find all extensions that have a contribution of this type.  NOTE: Only TrustedPartners are allowed to specify indexed contribution types.
    */
    indexed: boolean;
    /**
    * Friendly name of the contribution/type
    */
    name: string;
    /**
    * Describes the allowed properties for this contribution type
    */
    properties: { [key: string]: ContributionPropertyDescription; };
}

/**
* Contains lists of script and css references that need to be included on the page in order for the controls used by the page to work.
*/
interface CoreReferencesContext {
    /**
    * Core javascript bundle
    */
    coreScriptsBundle: JavascriptFileReference;
    /**
    * Core javascript files referenced on a page
    */
    scripts: JavascriptFileReference[];
    /**
    * Core CSS files referenced on a page
    */
    stylesheets: StylesheetReference[];
}

/**
* Contextual information that data providers can examine when populating their data
*/
interface DataProviderContext {
    /**
    * Generic property bag that contains context-specific properties that data providers can use when populating their data dictionary
    */
    properties: { [key: string]: number; };
}

/**
* A query that can be issued for data provider data
*/
interface DataProviderQuery {
    /**
    * Contextual information to pass to the data providers
    */
    context: DataProviderContext;
    /**
    * The contribution ids of the data providers to resolve
    */
    contributionIds: string[];
}

/**
* Result structure from calls to GetDataProviderData
*/
interface DataProviderResult {
    /**
    * Property bag of data keyed off of the data provider contribution id
    */
    data: { [key: string]: number; };
    /**
    * List of data providers resolved in the data-provider query
    */
    resolvedProviders: ResolvedDataProvider[];
}

interface DaylightSavingsAdjustmentEntry {
    /**
    * Millisecond adjustment from UTC
    */
    offset: number;
    /**
    * Date that the offset adjustment starts
    */
    start: Date;
}

interface DiagnosticsContext {
    /**
    * Id of the current activity
    */
    activityId: string;
    allowStatsCollection: boolean;
    /**
    * Whether or not to enable static content bundling. This is on in non-debug-mode by default but the value can be overridden with a cookie.
    */
    bundlingEnabled: boolean;
    debugMode: boolean;
    isDevFabric: boolean;
    sessionId: string;
    tracePointCollectionEnabled: boolean;
    tracePointProfileEnd: string;
    tracePointProfileStart: string;
    /**
    * Denotes the version of the web platform consumed by this service. Of the form M###.
    */
    webPlatformVersion: string;
}

interface DynamicBundlesCollection {
    scripts: DynamicScriptBundle[];
    scriptsExcludedByPath: string[];
    styles: DynamicCSSBundle[];
}

interface DynamicCSSBundle {
    contentLength: number;
    cssFiles: string[];
    fallbackThemeUri: string;
    uri: string;
}

interface DynamicScriptBundle {
    contentLength: number;
    uri: string;
}

interface ExtendedHostContext {
    authority: string;
    hostType: ContextHostType;
    id: string;
    isAADAccount: boolean;
    name: string;
    relativeUri: string;
    scheme: string;
    uri: string;
}

/**
* Represents a VSTS "extension" which is a container for contributions and contribution types
*/
interface Extension {
    baseUri: string;
    contributions: Contribution[];
    contributionTypes: ContributionType[];
    eventCallbacks: ExtensionEventCallbackCollection;
    /**
    * The friendly extension id for this extension - unique for a given publisher.
    */
    extensionId: string;
    /**
    * The display name of the extension.
    */
    extensionName: string;
    /**
    * Extension flags relevant to contribution consumers
    */
    flags: ExtensionFlags;
    /**
    * Globally unique id for this extension (the same id is used for all versions of a single extension)
    */
    id: string;
    language: string;
    manifestVersion: any;
    /**
    * Unique id of the publisher of this extension
    */
    publisherId: string;
    /**
    * The display name of the publisher
    */
    publisherName: string;
    /**
    * Unique id for this extension (the same id is used for all versions of a single extension)
    */
    registrationId: string;
    scopes: string[];
    serviceInstanceType: string;
    /**
    * Version of this extension
    */
    version: string;
}

/**
* Audit log for an extension
*/
interface ExtensionAuditLog {
    /**
    * Collection of audit log entries
    */
    entries: ExtensionAuditLogEntry[];
    /**
    * Extension that the change was made for
    */
    extensionName: string;
    /**
    * Publisher that the extension is part of
    */
    publisherName: string;
}

/**
* An audit log entry for an extension
*/
interface ExtensionAuditLogEntry {
    /**
    * Change that was made to extension
    */
    auditAction: string;
    /**
    * Date at which the change was made
    */
    auditDate: Date;
    /**
    * Extra information about the change
    */
    comment: string;
    /**
    * Represents the user who made the change
    */
    updatedBy: any;
}

/**
* Represents a single collection for extension data documents
*/
interface ExtensionDataCollection {
    /**
    * The name of the collection
    */
    collectionName: string;
    /**
    * A list of documents belonging to the collection
    */
    documents: any[];
    /**
    * The type of the collection's scope, such as Default or User
    */
    scopeType: string;
    /**
    * The value of the collection's scope, such as Current or Me
    */
    scopeValue: string;
}

/**
* Represents a query to receive a set of extension data collections
*/
interface ExtensionDataCollectionQuery {
    /**
    * A list of collections to query
    */
    collections: ExtensionDataCollection[];
}

/**
* Base class for an event callback for an extension
*/
interface ExtensionEventCallback {
    /**
    * The uri of the endpoint that is hit when an event occurs
    */
    uri: string;
}

/**
* Collection of event callbacks - endpoints called when particular extension events occur.
*/
interface ExtensionEventCallbackCollection {
    /**
    * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension disable has occurred.
    */
    postDisable: ExtensionEventCallback;
    /**
    * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension enable has occurred.
    */
    postEnable: ExtensionEventCallback;
    /**
    * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension install has completed.
    */
    postInstall: ExtensionEventCallback;
    /**
    * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension uninstall has occurred.
    */
    postUninstall: ExtensionEventCallback;
    /**
    * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension update has occurred.
    */
    postUpdate: ExtensionEventCallback;
    /**
    * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension install is about to occur.  Response indicates whether to proceed or abort.
    */
    preInstall: ExtensionEventCallback;
    /**
    * For multi-version extensions, defines an endpoint that gets called via an OPTIONS request to determine the particular version of the extension to be used
    */
    versionCheck: ExtensionEventCallback;
}

/**
* Set of flags applied to extensions that are relevant to contribution consumers
*/
declare enum ExtensionFlags {
    /**
    * A built-in extension is installed for all VSTS accounts by default
    */
    BuiltIn = 1,
    /**
    * The extension comes from a fully-trusted publisher
    */
    Trusted = 2,
}

/**
* Base class for extension properties which are shared by the extension manifest and the extension model
*/
interface ExtensionManifest {
    /**
    * Uri used as base for other relative uri's defined in extension
    */
    baseUri: string;
    /**
    * List of contributions made by this extension
    */
    contributions: Contribution[];
    /**
    * List of contribution types defined by this extension
    */
    contributionTypes: ContributionType[];
    /**
    * Collection of endpoints that get called when particular extension events occur
    */
    eventCallbacks: ExtensionEventCallbackCollection;
    /**
    * Language Culture Name set by the Gallery
    */
    language: string;
    /**
    * Version of the extension manifest format/content
    */
    manifestVersion: any;
    /**
    * List of all oauth scopes required by this extension
    */
    scopes: string[];
    /**
    * The ServiceInstanceType(Guid) of the VSTS service that must be available to an account in order for the extension to be installed
    */
    serviceInstanceType: string;
}

/**
* A request for an extension (to be installed or have a license assigned)
*/
interface ExtensionRequest {
    /**
    * Required message supplied if the request is rejected
    */
    rejectMessage: string;
    /**
    * Date at which the request was made
    */
    requestDate: Date;
    /**
    * Represents the user who made the request
    */
    requestedBy: any;
    /**
    * Optional message supplied by the requester justifying the request
    */
    requestMessage: string;
    /**
    * Represents the state of the request
    */
    requestState: ExtensionRequestState;
    /**
    * Date at which the request was resolved
    */
    resolveDate: Date;
    /**
    * Represents the user who resolved the request
    */
    resolvedBy: any;
}

/**
* Represents the state of an extension request
*/
declare enum ExtensionRequestState {
    /**
    * The request has been opened, but not yet responded to
    */
    Open = 0,
    /**
    * The request was accepted (extension installed or license assigned)
    */
    Accepted = 1,
    /**
    * The request was rejected (extension not installed or license not assigned)
    */
    Rejected = 2,
}

/**
* The state of an extension
*/
interface ExtensionState {
    extensionId: string;
    extensionName: string;
    flags: ExtensionStateFlags;
    lastUpdated: Date;
    /**
    * The time at which the version was last checked
    */
    lastVersionCheck: Date;
    publisherName: string;
    /**
    * Version of this extension
    */
    version: string;
}

/**
* States of an extension
*/
declare enum ExtensionStateFlags {
    /**
    * No flags set
    */
    None = 0,
    /**
    * Extension is disabled
    */
    Disabled = 1,
    /**
    * Extension is a built in
    */
    BuiltIn = 2,
    /**
    * Extension has multiple versions
    */
    MultiVersion = 4,
    /**
    * Extension is not installed.  This is for builtin extensions only and can not otherwise be set.
    */
    UnInstalled = 8,
    /**
    * Error performing version check
    */
    VersionCheckError = 16,
    /**
    * Trusted extensions are ones that are given special capabilities. These tend to come from Microsoft and can't be published by the general public.  Note: BuiltIn extensions are always trusted.
    */
    Trusted = 32,
    /**
    * Extension is currently in an error state
    */
    Error = 64,
}

interface FeatureAvailabilityContext {
    featureStates: { [key: string]: boolean; };
}

interface GlobalizationContext {
    culture: string;
    theme: string;
    timeZoneId: string;
    timezoneOffset: number;
}

interface HostContext {
    id: string;
    name: string;
    relativeUri: string;
    uri: string;
}

/**
* Model representing a hub in VSTS pages' navigation menu
*/
interface Hub {
    groupId: string;
    id: string;
    isSelected: boolean;
    name: string;
    order: any;
    uri: string;
}

/**
* Model representing a hub group in VSTS pages' navigation menu
*/
interface HubGroup {
    hasHubs: boolean;
    id: string;
    name: string;
    order: any;
    uri: string;
}

/**
* Context information containing the relevant hubs and hub groups for a given context
*/
interface HubsContext {
    hubGroups: HubGroup[];
    hubGroupsCollectionContributionId: string;
    hubs: Hub[];
    selectedHubGroupId: string;
    selectedHubId: string;
}

/**
* Model to represent a TeamFoundationIdentity
*/
interface IdentityModel {
    /**
    * Custom display name
    */
    customDisplayName: string;
    /**
    * Display name
    */
    displayName: string;
    /**
    * Email address
    */
    email: string;
    /**
    * Unique team foundation id
    */
    id: string;
    /**
    * Is the identity active
    */
    isActive: boolean;
    /**
    * Is the identity a group/team
    */
    isContainer: boolean;
    /**
    * The provider's display name for this identity
    */
    providerDisplayName: string;
    /**
    * Unique name for this identity
    */
    uniqueName: string;
}

/**
* Represents a VSTS extension along with its installation state
*/
interface InstalledExtension {
    baseUri: string;
    contributions: Contribution[];
    contributionTypes: ContributionType[];
    eventCallbacks: ExtensionEventCallbackCollection;
    extensionId: string;
    extensionName: string;
    flags: ExtensionFlags;
    id: string;
    /**
    * Information about this particular installation of the extension
    */
    installState: InstalledExtensionState;
    language: string;
    manifestVersion: any;
    publisherId: string;
    publisherName: string;
    registrationId: string;
    scopes: string[];
    serviceInstanceType: string;
    version: string;
}

/**
* The state of an installed extension
*/
interface InstalledExtensionState {
    /**
    * States of an installed extension
    */
    flags: ExtensionStateFlags;
    /**
    * The time at which this installation was last updated
    */
    lastUpdated: Date;
}

/**
* Reference to a javascript file to include on a page
*/
interface JavascriptFileReference {
    /**
    * Condition to check in the case that Url lives on a CDN. The fallback script will be included if this check fails.
    */
    fallbackCondition: string;
    /**
    * Fallback url to use in case Url lives on a CDN
    */
    fallbackUrl: string;
    /**
    * Id of the reference (JQuery, JQueryUI, MicrosoftAjax, etc.)
    */
    identifier: string;
    /**
    * Is this a core javascript file that needs to be included on every page
    */
    isCoreModule: boolean;
    /**
    * Url of the javascript reference
    */
    url: string;
}

/**
* Class used to wrap arrays in an object.
*/
interface JsonArrayWrapper {
    __wrappedArray: string;
}

interface MicrosoftAjaxConfig {
    cultureInfo: any;
}

/**
* AMD javascript module loader configuration
*/
interface ModuleLoaderConfiguration {
    baseUrl: string;
    contributionPaths: { [key: string]: ContributionPath; };
    paths: { [key: string]: string; };
    shim: { [key: string]: ModuleLoaderShimConfiguration; };
    /**
    * The maximum amount of time (in seconds) the AMD loader will wait for scripts to load.
    */
    waitSeconds: number;
}

/**
* AMD javascript module loader shim configuration
*/
interface ModuleLoaderShimConfiguration {
    deps: string[];
    exports: string;
}

/**
* Structure to specify current navigation context of the executing request. The navigation context content's are generally obtained from the request URL. Some context specifiers such as "Account" can be implicit and might come from current IVssServiceHost.
*/
interface NavigationContext {
    /**
    * A token to show which area the request has been targeted to. By default there are two areas "Admin" and "Api". They can be specified in the URL as _admin and _api respectively.
    */
    area: string;
    /**
    * Current action route value
    */
    currentAction: string;
    /**
    * Current controller route value
    */
    currentController: string;
    /**
    * Current parameters route value (the path after the controller and action in the url)
    */
    currentParameters: string;
    /**
    * Flag to show top most navigation context. For example the URL http://server:port/collection/project/_controller/action sets the Project bit while the URL http://server:port/collection/project/_admin/_controller/action sets also sets the area property to Admin.
    */
    topMostLevel: NavigationContextLevels;
}

/**
* Flags to show which tokens of the navigation context are present in the current request URL. The request url's context part are formed like http://server:port[/{collection}[/{project}[/{team}]]][/_admin]/_{controller}/{action} The tokens {collection}, {project} and {team} are navigation level tokens whereas _admin segment is a switch to show admin areas of the site.
*/
declare enum NavigationContextLevels {
    None = 0,
    /**
    * Root level in Azure.
    */
    Deployment = 1,
    /**
    * Root level in on premises. Neither of {collection}, {project} and {team} tokens have information
    */
    Application = 2,
    /**
    * Flag to show {collection} token has information.
    */
    Collection = 4,
    /**
    * Flag to show {project} token has information.
    */
    Project = 8,
    /**
    * Flag to show {team} token has information.
    */
    Team = 16,
    /**
    * Sugar for all application levels.
    */
    ApplicationAll = 30,
    /**
    * Sugar for all levels
    */
    All = 31,
}

/**
* Global context placed on each VSSF web page (through json island data) which gives enough information for core TypeScript modules/controls on the page to operate
*/
interface PageContext {
    /**
    * Configuration for reporting telemetry/usage data to App Insights
    */
    appInsightsConfiguration: AppInsightsConfiguration;
    /**
    * Core javascript and css references
    */
    coreReferences: CoreReferencesContext;
    /**
    * Specifies the prefixes for CSS modules that should map to the current service. e.g. "VSS/LoaderPlugins/Css!EMS:ExtensionManagement" would map to ExtensionManagement.css under the themed content path of this service if "EMS" is in the CSSModulePrefixes list.
    */
    cssModulePrefixes: string[];
    /**
    * Diagnostic related information for the current page
    */
    diagnostics: DiagnosticsContext;
    /**
    * Feature flag states to include by default in page data (avoids AJAX lookup)
    */
    featureAvailability: FeatureAvailabilityContext;
    /**
    * Globalization data for the current page based on the current user's settings
    */
    globalization: GlobalizationContext;
    /**
    * Configuration needed for Microsoft.Ajax library
    */
    microsoftAjaxConfig: MicrosoftAjaxConfig;
    /**
    * The (AMD) module configuration
    */
    moduleLoaderConfig: ModuleLoaderConfiguration;
    /**
    * Current navigation context.
    */
    navigation: NavigationContext;
    /**
    * The service instance type id for the VSTS service serving this page
    */
    serviceInstanceId: string;
    serviceLocations: ServiceLocations;
    /**
    * Contains global time zone configuration information (e.g. which dates DST changes)
    */
    timeZonesConfiguration: TimeZonesConfiguration;
    /**
    * Web Access configuration
    */
    webAccessConfiguration: ConfigurationContext;
    /**
    * The web context information for the given page request
    */
    webContext: WebContext;
}

/**
* A request for an extension (to be installed or have a license assigned)
*/
interface RequestedExtension {
    /**
    * THe unique name of the extensions
    */
    extensionName: string;
    /**
    * A list of each request for the extension
    */
    extensionRequests: ExtensionRequest[];
    /**
    * DisplayName of the publisher that owns the extension being published.
    */
    publisherDisplayName: string;
    /**
    * Represents the Publisher of the requested extension
    */
    publisherName: string;
    /**
    * The total number of requests for an extension
    */
    requestCount: number;
}

/**
* Entry for a specific data provider's resulting data
*/
interface ResolvedDataProvider {
    error: string;
    id: string;
}

interface Scope {
    description: string;
    title: string;
    value: string;
}

/**
* Holds a lookup of urls for different services (at different host levels)
*/
interface ServiceLocations {
    locations: { [key: string]: { [key: number]: string; }; };
}

/**
* Reference to a CSS file to include on a page
*/
interface StylesheetReference {
    /**
    * Url of the high-contrast version of the CSS file
    */
    highContrastUrl: string;
    /**
    * Is this a core stylesheet that needs to be included in child frames
    */
    isCoreStylesheet: boolean;
    /**
    * Url of the CSS file
    */
    url: string;
}

/**
* Information about the extension
*/
interface SupportedExtension {
    /**
    * Unique Identifier for this extension
    */
    extension: string;
    /**
    * Unique Identifier for this publisher
    */
    publisher: string;
    /**
    * Supported version for this extension
    */
    version: string;
}

interface TeamContext {
    id: string;
    name: string;
    userIsAdmin: boolean;
    userIsMember: boolean;
}

/**
* Data contract to represent a given team foundation service host (account, collection, deployment)
*/
interface TeamFoundationServiceHostModel {
    /**
    * Type of host (deployment, account, collection)
    */
    hostType: any;
    /**
    * Unique id of the host (collection id, account id, etc.)
    */
    instanceId: string;
    /**
    * Name of the host (collection name, account name, etc.)
    */
    name: string;
    /**
    * Path of the service host, relative to the root virtual directory (e.g. DefaultCollection)
    */
    relVDir: string;
    /**
    * Path of the service host relative to the web application root (e.g. /tfs/DefaultCollection)
    */
    vDir: string;
}

interface TfsMailSettings {
    enabled: boolean;
    from: string;
}

/**
* Internal structure to describe IVssServiceHost
*/
interface TfsServiceHostDescriptor {
    hostType: any;
    id: string;
    name: string;
    relVdir: string;
    vdir: string;
}

interface TimeZonesConfiguration {
    daylightSavingsAdjustments: DaylightSavingsAdjustmentEntry[];
}

interface UserContext {
    email: string;
    id: string;
    limitedAccess: boolean;
    name: string;
    uniqueName: string;
}

/**
* Context information for all web access requests
*/
interface WebContext {
    account: HostContext;
    /**
    * Information about the Collection used in the current request (may be null)
    */
    collection: HostContext;
    /**
    * Information about the current request context's host
    */
    host: ExtendedHostContext;
    /**
    * Information about the project used in the current request (may be null)
    */
    project: ContextIdentifier;
    /**
    * Information about the team used in the current request (may be null)
    */
    team: TeamContext;
    /**
    * Information about the current user
    */
    user: UserContext;
}

/**
* Contextual data for web-page-related data providers about the originating (host/source) page
*/
interface WebPageDataProviderPageSource {
    /**
    * List of paths contributed by the host which are available to 3rd party extension developers through VSS.SDK
    */
    contributionPaths: string[];
    /**
    * Diagnostics context (debug mode, activity id, etc.) of the source page
    */
    diagnostics: DiagnosticsContext;
    /**
    * The navigation context for the host page that is loading the data provider
    */
    navigation: NavigationContext;
    /**
    * The project context for the host page that is loading the data provider
    */
    project: ContextIdentifier;
    /**
    * Currently selected hubgroup id
    */
    selectedHubGroupId: string;
    /**
    * Currently selected hub id
    */
    selectedHubId: string;
    /**
    * The team context for the host page that is loading the data provider
    */
    team: ContextIdentifier;
    /**
    * The url of the host page that is loading the data provider
    */
    url: string;
}

/**
* A single timing consisting of a duration and start time
*/
interface WebPerformanceTimingEntry {
    /**
    * Length of time in milliseconds
    */
    duration: any;
    /**
    * Offset from Server Request Context start time in milliseconds
    */
    startTime: any;
}

/**
* A set of web performance timings all keyed off of the same string
*/
interface WebPerformanceTimingGroup {
    /**
    * A list of timing entries
    */
    timings: WebPerformanceTimingEntry[];
}

declare module XDM {
    interface IDeferred<T> {
        resolve: (result: T) => void;
        reject: (reason: any) => void;
        promise: IPromise<T>;
    }
    /**
    * Create a new deferred object
    */
    function createDeferred<T>(): IDeferred<T>;
    /**
    * Settings related to the serialization of data across iframe boundaries.
    */
    interface ISerializationSettings {
        /**
        * By default, properties that begin with an underscore are not serialized across
        * the iframe boundary. Set this option to true to serialize such properties.
        */
        includeUnderscoreProperties: boolean;
    }
    /**
     * Catalog of objects exposed for XDM
     */
    class XDMObjectRegistry implements IXDMObjectRegistry {
        private _registeredObjects;
        /**
        * Register an object (instance or factory method) exposed by this frame to callers in a remote frame
        *
        * @param instanceId unique id of the registered object
        * @param instance Either: (1) an object instance, or (2) a function that takes optional context data and returns an object instance.
        */
        register(instanceId: string, instance: Object | {
            (contextData?: any): Object;
        }): void;
        /**
        * Get an instance of an object registered with the given id
        *
        * @param instanceId unique id of the registered object
        * @param contextData Optional context data to pass to a registered object's factory method
        */
        getInstance<T>(instanceId: string, contextData?: Object): T;
    }
    /**
    * The registry of global XDM handlers
    */
    var globalObjectRegistry: XDMObjectRegistry;
    /**
     * Represents a channel of communication between frames\document
     * Stays "alive" across multiple funtion\method calls
     */
    class XDMChannel implements IXDMChannel {
        private static _nextChannelId;
        private static MAX_XDM_DEPTH;
        private static WINDOW_TYPES_TO_SKIP_SERIALIZATION;
        private static JQUERY_TYPES_TO_SKIP_SERIALIZATION;
        private _nextMessageId;
        private _deferreds;
        private _postToWindow;
        private _targetOrigin;
        private _handshakeToken;
        private _channelObjectRegistry;
        private _channelId;
        private _nextProxyFunctionId;
        private _proxyFunctions;
        constructor(postToWindow: Window, targetOrigin?: string);
        /**
        * Get the object registry to handle messages from this specific channel.
        * Upon receiving a message, this channel registry will be used first, then
        * the global registry will be used if no handler is found here.
        */
        getObjectRegistry(): IXDMObjectRegistry;
        /**
        * Invoke a method via RPC. Lookup the registered object on the remote end of the channel and invoke the specified method.
        *
        * @param method Name of the method to invoke
        * @param instanceId unique id of the registered object
        * @param params Arguments to the method to invoke
        * @param instanceContextData Optional context data to pass to a registered object's factory method
        * @param serializationSettings Optional serialization settings
        */
        invokeRemoteMethod<T>(methodName: string, instanceId: string, params?: any[], instanceContextData?: Object, serializationSettings?: ISerializationSettings): IPromise<T>;
        /**
        * Get a proxied object that represents the object registered with the given instance id on the remote side of this channel.
        *
        * @param instanceId unique id of the registered object
        * @param contextData Optional context data to pass to a registered object's factory method
        */
        getRemoteObjectProxy<T>(instanceId: string, contextData?: Object): IPromise<T>;
        private invokeMethod(registeredInstance, rpcMessage);
        private getRegisteredObject(instanceId, instanceContext?);
        /**
        * Handle a received message on this channel. Dispatch to the appropriate object found via object registry
        *
        * @param data Message data
        * @param origin Origin of the frame that sent the message
        * @return True if the message was handled by this channel. Otherwise false.
        */
        onMessage(data: any, origin: string): boolean;
        owns(source: Window, origin: string, data: any): boolean;
        error(data: any, errorObj: any): void;
        private _error(messageObj, errorObj, handshakeToken);
        private _success(messageObj, result, handshakeToken);
        private _sendRpcMessage(message);
        private _shouldSkipSerialization(obj);
        private _customSerializeObject(obj, settings, parentObjects?, nextCircularRefId?, depth?);
        private _registerProxyFunction(func, context);
        private _customDeserializeObject(obj, circularRefs?);
    }
    /**
    * Registry of XDM channels kept per target frame/window
    */
    class XDMChannelManager implements IXDMChannelManager {
        private static _default;
        private _channels;
        constructor();
        static get(): XDMChannelManager;
        /**
        * Add an XDM channel for the given target window/iframe
        *
        * @param window Target iframe window to communicate with
        * @param targetOrigin Url of the target iframe (if known)
        */
        addChannel(window: Window, targetOrigin?: string): IXDMChannel;
        private _handleMessageReceived(event);
        private _subscribe(windowObj);
    }
}
declare module VSS {
    var VssSDKVersion: number;
    var VssSDKRestVersion: string;
    /**
    * Service Ids for core services (to be used in VSS.getService)
    */
    module ServiceIds {
        /**
        * Service for showing dialogs in the host frame
        * Use: <IHostDialogService>
        */
        var Dialog: string;
        /**
        * Service for interacting with the host frame's navigation (getting/updating the address/hash, reloading the page, etc.)
        * Use: <IHostNavigationService>
        */
        var Navigation: string;
        /**
        * Service for interacting with extension data (setting/setting documents and collections)
        * Use: <IExtensionDataService>
        */
        var ExtensionData: string;
    }
    /**
     * Initiates the handshake with the host window.
     *
     * @param options Initialization options for the extension.
     */
    function init(options: IExtensionInitializationOptions): void;
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
    function require(modules: string[] | string, callback?: Function): void;
    /**
    * Register a callback that gets called once the initial setup/handshake has completed.
    * If the initial setup is already completed, the callback is invoked at the end of the current call stack.
    */
    function ready(callback: () => void): void;
    /**
    * Notifies the host that the extension successfully loaded (stop showing the loading indicator)
    */
    function notifyLoadSucceeded(): void;
    /**
    * Notifies the host that the extension failed to load
    */
    function notifyLoadFailed(e: any): void;
    /**
    * Get the web context from the parent host
    */
    function getWebContext(): WebContext;
    /**
    * Get the configuration data passed in the initial handshake from the parent frame
    */
    function getConfiguration(): any;
    /**
    * Get the context about the extension that owns the content that is being hosted
    */
    function getExtensionContext(): IExtensionContext;
    /**
    * Gets the information about the contribution that first caused this extension to load.
    */
    function getContribution(): Contribution;
    /**
    * Get a contributed service from the parent host.
    *
    * @param contributionId Full Id of the service contribution to get the instance of
    * @param context Optional context information to use when obtaining the service instance
    */
    function getService<T>(contributionId: string, context?: Object): IPromise<T>;
    /**
    * Get the contribution with the given contribution id. The returned contribution has a method to get a registered object within that contribution.
    *
    * @param contributionId Id of the contribution to get
    */
    function getServiceContribution(contributionId: string): IPromise<IServiceContribution>;
    /**
    * Get contributions that target a given contribution id. The returned contributions have a method to get a registered object within that contribution.
    *
    * @param targetContributionId Contributions that target the contribution with this id will be returned
    */
    function getServiceContributions(targetContributionId: string): IPromise<IServiceContribution[]>;
    /**
    * Register an object (instance or factory method) that this extension exposes to the host frame.
    *
    * @param instanceId unique id of the registered object
    * @param instance Either: (1) an object instance, or (2) a function that takes optional context data and returns an object instance.
    */
    function register(instanceId: string, instance: Object | {
        (contextData?: any): Object;
    }): void;
    /**
    * Get an instance of an object registered with the given id
    *
    * @param instanceId unique id of the registered object
    * @param contextData Optional context data to pass to the contructor of an object factory method
    */
    function getRegisteredObject(instanceId: string, contextData?: Object): Object;
    /**
    * Fetch an access token which will allow calls to be made to other VSTS services
    */
    function getAccessToken(): IPromise<ISessionToken>;
    /**
    * Fetch an token which can be used to identify the current user
    */
    function getAppToken(): IPromise<ISessionToken>;
    /**
    * Requests the parent window to resize the container for this extension based on the current extension size.
    */
    function resize(): void;
}
declare module "VSS/Accounts/Contracts" {
export interface Account {
    /**
     * Identifier for an Account
     */
    accountId: string;
    /**
     * Name for an account
     */
    accountName: string;
    /**
     * Owner of account
     */
    accountOwner: string;
    /**
     * Current account status
     */
    accountStatus: AccountStatus;
    /**
     * Type of account: Personal, Organization
     */
    accountType: AccountType;
    /**
     * Uri for an account
     */
    accountUri: string;
    /**
     * Who created the account
     */
    createdBy: string;
    /**
     * Date account was created
     */
    createdDate: Date;
    /**
     * Identity of last person to update the account
     */
    lastUpdatedBy: string;
    /**
     * Date account was last updated
     */
    lastUpdatedDate: Date;
    /**
     * Namespace for an account
     */
    namespaceId: string;
    /**
     * Organization that created the account
     */
    organizationName: string;
    /**
     * Extended properties
     */
    properties: any;
    /**
     * Reason for current status
     */
    statusReason: string;
}
export interface AccountCreateInfoInternal {
    accountName: string;
    creator: string;
    organization: string;
    preferences: AccountPreferencesInternal;
    properties: any;
    serviceDefinitions: {
        key: string;
        value: string;
    }[];
}
export interface AccountLicenseInfo {
    consumedCount: number;
    inUseCount: number;
    licenseName: string;
}
export enum AccountLicenseSource {
    /**
     * The following correspond to various license sources
     */
    None = 2,
    VsExpress = 10,
    VsPro = 12,
    VsTestPro = 14,
    VsPremium = 16,
    VsUltimate = 18,
    MSDN = 38,
    MsdnPro = 40,
    MsdnTestPro = 42,
    MsdnPremium = 44,
    MsdnUltimate = 46,
    MsdnPlatforms = 48,
    VSOStandard = 50,
    VSOAdvanced = 52,
    VSOProStandard = 54,
    Win8 = 56,
    Desktop = 58,
    Phone = 60,
    /**
     * Early adopters may get a special license
     */
    VsEarlyAdopter = 70,
}
export interface AccountNameAvailability {
    isValidName: boolean;
    /**
     * Reason for current status
     */
    statusReason: string;
}
export interface AccountPreferencesInternal {
    culture: any;
    language: any;
    timeZone: any;
}
/**
 * Account region metadata
 */
export interface AccountRegion {
    /**
     * Display name of the account region
     */
    displayName: string;
    /**
     * Whether the region is default or not
     */
    isDefault: boolean;
    /**
     * Azure location name
     */
    locationName: string;
}
export enum AccountServiceRights {
    StandardLicense = 0,
    AdvancedLicense = 1,
    ProfessionalLicense = 2,
    None = 3,
}
export enum AccountStatus {
    None = 0,
    /**
     * This hosting account is active and assigned to a customer.
     */
    Enabled = 1,
    /**
     * This hosting account is disabled.
     */
    Disabled = 2,
    /**
     * This account is part of deletion batch and scheduled for deletion.
     */
    Deleted = 3,
}
export enum AccountType {
    Personal = 0,
    Organization = 1,
}
export interface AccountUser {
    /**
     * Identifier for an Account
     */
    accountId: string;
    /**
     * Date account was created
     */
    creationDate: Date;
    /**
     * Date account was last updated
     */
    lastUpdated: Date;
    /**
     * What is the license for this user MSDN, VSPro, etc.
     */
    licenseSource: AccountLicenseSource;
    /**
     * What are the users service rights
     */
    serviceRights: AccountServiceRights;
    /**
     * The user identity to be associated with the account
     */
    userId: string;
    /**
     * Current account status
     */
    userStatus: AccountUserStatus;
}
export enum AccountUserStatus {
    None = 0,
    /**
     * User has signed in at least once to the VSTS account
     */
    Active = 1,
    /**
     * User cannot sign in; primarily used by admin to temporarily remove a user due to absence or license reallocation
     */
    Disabled = 2,
    /**
     * User is removed from the VSTS account by the VSTS account admin
     */
    Deleted = 3,
    /**
     * User is invited to join the VSTS account by the VSTS account admin, but has not signed up/signed in yet
     */
    Pending = 4,
    /**
     * User can sign in; primarily used when license is in expired state and we give a grace period
     */
    Expired = 5,
    /**
     * User is disabled; if reenabled, they will still be in the Pending state
     */
    PendingDisabled = 6,
}
export var TypeInfo: {
    Account: {
        fields: any;
    };
    AccountCreateInfoInternal: {
        fields: any;
    };
    AccountLicenseInfo: {
        fields: any;
    };
    AccountLicenseSource: {
        enumValues: {
            "none": number;
            "vsExpress": number;
            "vsPro": number;
            "vsTestPro": number;
            "vsPremium": number;
            "vsUltimate": number;
            "mSDN": number;
            "msdnPro": number;
            "msdnTestPro": number;
            "msdnPremium": number;
            "msdnUltimate": number;
            "msdnPlatforms": number;
            "vSOStandard": number;
            "vSOAdvanced": number;
            "vSOProStandard": number;
            "win8": number;
            "desktop": number;
            "phone": number;
            "vsEarlyAdopter": number;
        };
    };
    AccountNameAvailability: {
        fields: any;
    };
    AccountPreferencesInternal: {
        fields: any;
    };
    AccountRegion: {
        fields: any;
    };
    AccountServiceRights: {
        enumValues: {
            "standardLicense": number;
            "advancedLicense": number;
            "professionalLicense": number;
            "none": number;
        };
    };
    AccountStatus: {
        enumValues: {
            "none": number;
            "enabled": number;
            "disabled": number;
            "deleted": number;
        };
    };
    AccountType: {
        enumValues: {
            "personal": number;
            "organization": number;
        };
    };
    AccountUser: {
        fields: any;
    };
    AccountUserStatus: {
        enumValues: {
            "none": number;
            "active": number;
            "disabled": number;
            "deleted": number;
            "pending": number;
            "expired": number;
            "pendingDisabled": number;
        };
    };
};
}
declare module "VSS/Accounts/RestClient" {
import Contracts = require("VSS/Accounts/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class AccountsHttpClient3 extends VSS_WebApi.VssHttpClient {
    static serviceInstanceId: string;
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {string} accountId
     * @return IPromise<string>
     */
    deleteAccount(accountId: string): IPromise<string>;
    /**
     * [Preview API]
     *
     * @param {Contracts.AccountCreateInfoInternal} info
     * @param {boolean} usePrecreated
     * @return IPromise<Contracts.Account>
     */
    createAccount(info: Contracts.AccountCreateInfoInternal, usePrecreated?: boolean): IPromise<Contracts.Account>;
    /**
     * [Preview API]
     *
     * @param {string} accountId
     * @param {string} properties
     * @return IPromise<Contracts.Account>
     */
    getAccount(accountId: string, properties?: string): IPromise<Contracts.Account>;
    /**
     * [Preview API]
     *
     * @param {string} creatorId
     * @param {string} ownerId
     * @param {string} memberId
     * @param {boolean} includeOwner
     * @param {string} properties
     * @param {boolean} includeDisabledAccounts
     * @return IPromise<Contracts.Account[]>
     */
    getAccounts(creatorId?: string, ownerId?: string, memberId?: string, includeOwner?: boolean, properties?: string, includeDisabledAccounts?: boolean): IPromise<Contracts.Account[]>;
    /**
     * [Preview API]
     *
     * @param {Contracts.Account} account
     * @param {string} accountId
     * @return IPromise<void>
     */
    updateAccount(account: Contracts.Account, accountId: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} accountName
     * @return IPromise<Contracts.AccountNameAvailability>
     */
    isValidAccountName(accountName: string): IPromise<Contracts.AccountNameAvailability>;
    /**
     * [Preview API]
     *
     * @return IPromise<Contracts.AccountRegion[]>
     */
    getRegions(): IPromise<Contracts.AccountRegion[]>;
    /**
     * [Preview API]
     *
     * @return IPromise<{ [key: string] : string; }>
     */
    getAccountSettings(): IPromise<{
        [key: string]: string;
    }>;
}
export class AccountsHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    static serviceInstanceId: string;
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * @param {string} accountId
     * @return IPromise<string>
     */
    deleteAccount(accountId: string): IPromise<string>;
    /**
     * @param {Contracts.AccountCreateInfoInternal} info
     * @param {boolean} usePrecreated
     * @return IPromise<Contracts.Account>
     */
    createAccount(info: Contracts.AccountCreateInfoInternal, usePrecreated?: boolean): IPromise<Contracts.Account>;
    /**
     * @param {string} accountId
     * @param {string} properties
     * @return IPromise<Contracts.Account>
     */
    getAccount(accountId: string, properties?: string): IPromise<Contracts.Account>;
    /**
     * @param {string} creatorId
     * @param {string} ownerId
     * @param {string} memberId
     * @param {boolean} includeOwner
     * @param {string} properties
     * @param {boolean} includeDisabledAccounts
     * @return IPromise<Contracts.Account[]>
     */
    getAccounts(creatorId?: string, ownerId?: string, memberId?: string, includeOwner?: boolean, properties?: string, includeDisabledAccounts?: boolean): IPromise<Contracts.Account[]>;
    /**
     * @param {Contracts.Account} account
     * @param {string} accountId
     * @return IPromise<void>
     */
    updateAccount(account: Contracts.Account, accountId: string): IPromise<void>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {string} accountName
     * @return IPromise<Contracts.AccountNameAvailability>
     */
    isValidAccountName(accountName: string): IPromise<Contracts.AccountNameAvailability>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @return IPromise<Contracts.AccountRegion[]>
     */
    getRegions(): IPromise<Contracts.AccountRegion[]>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @return IPromise<{ [key: string] : string; }>
     */
    getAccountSettings(): IPromise<{
        [key: string]: string;
    }>;
}
export class AccountsHttpClient extends AccountsHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return AccountsHttpClient2_2
 */
export function getClient(): AccountsHttpClient2_2;
}
declare module "VSS/Adapters/Knockout" {
import Controls = require("VSS/Controls");
export interface ITemplateViewModel extends IDisposable {
    dispose(): void;
}
export class TemplateViewModel implements ITemplateViewModel, Controls.EnhancementOptions {
    /**
     * Manager for disposables.
     */
    private _disposalManager;
    constructor();
    /**
     * Disposes all disposables.
     */
    dispose(): void;
    /**
     * Proxy for a knockout subscription to keep track of it to ensure that when the control is disposed, subscription is also disposed.
     */
    subscribe(subscribable: KnockoutSubscribable<any>, callback: (newValue: any) => void): IDisposable;
    /**
     * Proxy for a knockout computed to keep track of it to ensure that when the control is disposed, computed is also disposed.
     */
    computed(func: () => any): KnockoutComputed<any>;
    /**
     * Adds a disposable object to the list
     */
    _addDisposable(disposable: IDisposable): IDisposable;
}
export interface TemplateControlRegistration {
    /**
     * Type of the control to be registered.
     */
    controlType: any;
    /**
     * Delegate used to generate the view model for the registered control.
     */
    viewModelGenerator: (context?: any) => ITemplateViewModel;
}
export interface TemplateControlOptions {
    /**
     * Html template is going to be set as the html content for the element.
     */
    templateHtml?: string;
    /**
     * If templateId is used there needs to be a script element (with type="text/html")
     * in the DOM with the id equal to templateId.
     * This templateId will be used to get the template from the DOM.
     */
    templateId?: string;
}
export interface ITemplateControl {
    /**
     * Applies the template binding on the specified element.
     *
     * @param element Element owning the template and viewmodel to be bound.
     */
    applyBinding(element: JQuery): void;
    /**
     * Perform verious disposals for the control.
     */
    dispose(): void;
}
export class TemplateControl<TViewModel extends ITemplateViewModel> extends Controls.BaseControl implements ITemplateControl {
    /**
     * Registers a template control to be invoked later.
     *
     * @param templateId Id of the template.
     * @param controlType Type of the registered control.
     * @param viewModelGenerator Delegate to generate the viewmodel.
     */
    static registerBinding(templateId: string, controlType: any, viewModelGenerator: (context?: any) => ITemplateViewModel): void;
    /**
     * Creates a new template control using registered control specified by template id.
     *
     * @param templateId Id of the template.
     * @param element Element owning the template and viewmodel to be bound.
     * @param viewModelContext Context used to generate view model.
     * @return New instance of the control.
     */
    static applyRegisteredBinding<TControl extends ITemplateControl, TViewModel extends ITemplateViewModel>(templateId: string, element: JQuery, viewModelContext: any): TControl;
    /**
     * Creates a new template control using the specified type, element and options.
     *
     * @param controlType Type of the control.
     * @param element Element owning the template and viewmodel to be bound.
     * @param viewModel View model used for binding.
     * @param options Template options like templateHtml and templateId.
     * @return New instance of the control.
     */
    static applyBinding<TControl extends ITemplateControl, TViewModel>(controlType: any, element: JQuery, viewModel: TViewModel, options: TemplateControlOptions): TControl;
    /**
     * View model used for binding.
     */
    private _viewModel;
    /**
     * Manager for disposables.
     */
    private _disposalManager;
    /**
     * Do not use this! Instead, use TemplateControl.applyBinding.
     */
    constructor(viewModel: TViewModel, options?: TemplateControlOptions);
    /**
     * Gets the viewmodel bound to this control.
     */
    getViewModel(): TViewModel;
    /**
     * See interface.
     */
    applyBinding(element: JQuery): void;
    /**
     * Proxy for a knockout subscription to keep track of it to ensure that when the control is disposed, subscription is also disposed.
     */
    subscribe(subscribable: KnockoutSubscribable<any>, callback: (newValue: any) => void): IDisposable;
    /**
     * Proxy for a knockout computed to keep track of it to ensure that when the control is disposed, computed is also disposed.
     */
    computed(func: () => any): KnockoutComputed<any>;
    /**
     * See base.
     */
    _cleanup(): void;
    /**
     * Default template binding which is knockout.
     * By overriding this method, a different binding pattern can be used.
     */
    _performBinding(element: JQuery, options: TemplateControlOptions): void;
}
}
declare module "VSS/Ajax" {
export interface JQueryAjaxResult {
    jqXHR: JQueryXHR;
    textStatus: string;
}
export interface JQueryAjaxSuccessResult extends JQueryAjaxResult {
    data: any;
}
export interface JQueryAjaxErrorResult extends JQueryAjaxResult {
    errorThrown: any;
}
/**
* Custom DataTypes that can be used in addition to jQuery's default text, json, xml, etc. types.
* This module provides custom ajaxTransports for these types
*/
export module CustomTransportDataTypes {
    /**
    * Raw binary data returned as an ArrayBuffer
    */
    var Binary: string;
}
/**
* Issue an AJAX request. This is a wrapper around jquery's ajax method that handles VSS authentication
* and triggers events that can be listened to by other modules.
*
* @param requestUrl Url to send the request to
* @param ajaxOptions jQuery.ajax options
* @param vssRequestOptions VSS specific request options
* @param useAjaxResult If true, textStatus and jqXHR are added to the success callback. In this case, spread (instead of then) needs to be used
*/
export function issueRequest(requestUrl: string, ajaxOptions: JQueryAjaxSettings, vssRequestOptions?: IVssAjaxOptions): IPromise<any>;
/**
* Add a listener that gets notified whenever requests from this client begin/end/etc.
*
* @param listener HttpClient listener to add
*/
export function addGlobalListener(listener: IVssAjaxEventListener): void;
/**
* Remove a listener that gets notified whenever requests from this client begin/end/etc.
*
* @param listener HttpClient listener to remove
*/
export function removeGlobalListener(listener: IVssAjaxEventListener): void;
}
declare module "VSS/Artifacts/Constants" {
export module ArtifactTypeNames {
    var TcmResult: string;
    var TcmResultAttachment: string;
    var Build: string;
    var VersionedItem: string;
    var LatestItemVersion: string;
    var Changeset: string;
    var Shelveset: string;
    var WorkItem: string;
    var Storyboard: string;
    var Commit: string;
    var CodeReviewId: string;
    var CodeReviewSdkId: string;
    var PullRequestId: string;
    var ProjectDownloadProject: string;
    /**
    * A Git Ref
    */
    var Ref: string;
}
export module ToolNames {
    var VersionControl: string;
    var WorkItemTracking: string;
    var TeamBuild: string;
    var TestManagement: string;
    var Requirements: string;
    var Legacy: string;
    var CodeSense: string;
    var Git: string;
    var CodeReview: string;
    var ProjectDownload: string;
}
}
declare module "VSS/Artifacts/Services" {
import Contracts_Platform = require("VSS/Common/Contracts/Platform");
import Service = require("VSS/Service");
export interface IArtifactData {
    uri?: string;
    tool: string;
    type: string;
    id: string;
}
export class Artifact {
    static _execute(artifact: Artifact, webContext: Contracts_Platform.WebContext): void;
    static ACTION_ARTIFACT_EXECUTE: string;
    _data: any;
    _error: any;
    constructor(data: IArtifactData);
    getUri(): string;
    getTool(): string;
    getType(): string;
    getId(): string;
    /**
     * @return
     */
    getTitle(): string;
    setError(error: any): void;
    getError(): any;
    execute(webContext: Contracts_Platform.WebContext): any;
    /**
     * @return
     */
    getUrl(webContext: Contracts_Platform.WebContext): string;
}
export class LinkingUtilities {
    static VSTFS: string;
    static URI_SEPARATOR: string;
    /**
     * Creates an artifact URI using specified artifact.
     *
     * @param artifact Artifact should have the following properties:
     *     - tool: Artifact tool name
     *     - type: Artifact type
     *     - id: Artifact tool specific id
     * @return
     */
    static encodeUri(artifact: any): string;
    /**
     * Decodes the specified artifact URI and creates artifact object which has tool, type and id properties.
     *
     * @param artifactUri URI to decode
     * @return
     */
    static decodeUri(artifactUri: string): IArtifactData;
    /**
     * Decodes a uri component, maintaining backwards compatibility with how URIs were encoded
     * from the rich client and in VS2010 and earlier versions.
     *
     * @param encodedURIComponent URI component to decode
     * @return
     */
    static legacyDecodeURIComponent(encodedURIComponent: string): string;
}
export class ClientLinking extends Service.VssService {
    static MODE_TRANSLATEURL: string;
    static registerArtifactResolver(toolName: string, resolver: any): void;
    static getArtifactResolver(toolName: string): any;
    constructor();
    beginResolveArtifacts(artifactUris: string[], options?: any, callback?: IResultCallback, errorCallback?: IErrorCallback): void;
}
}
declare module "VSS/Authentication/Contracts" {
export interface CustomerIntelligenceEvent {
    area: string;
    feature: string;
    properties: {
        [key: string]: any;
    };
}
export enum DelegatedAppTokenType {
    Session = 0,
    App = 1,
}
export interface WebSessionToken {
    appId: string;
    force: boolean;
    name: string;
    namedTokenId: string;
    token: string;
    tokenType: DelegatedAppTokenType;
    validTo: Date;
}
export var TypeInfo: {
    CustomerIntelligenceEvent: {
        fields: any;
    };
    DelegatedAppTokenType: {
        enumValues: {
            "session": number;
            "app": number;
        };
    };
    WebSessionToken: {
        fields: any;
    };
};
}
declare module "VSS/Authentication/RestClient" {
import Contracts = require("VSS/Authentication/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class AuthenticationHttpClient3 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {Contracts.WebSessionToken} sessionToken
     * @return IPromise<Contracts.WebSessionToken>
     */
    createSessionToken(sessionToken: Contracts.WebSessionToken): IPromise<Contracts.WebSessionToken>;
}
/**
 * @exemptedapi
 */
export class AuthenticationHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {Contracts.WebSessionToken} sessionToken
     * @return IPromise<Contracts.WebSessionToken>
     */
    createSessionToken(sessionToken: Contracts.WebSessionToken): IPromise<Contracts.WebSessionToken>;
}
export class AuthenticationHttpClient extends AuthenticationHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
}
declare module "VSS/Authentication/Services" {
import Authentication_Contracts = require("VSS/Authentication/Contracts");
export module CoreNamedWebSessionTokenIds {
    var Profile: string;
}
/**
* Helper methods for dealing with basic auth
*/
export module BasicAuthHelpers {
    /**
    * Create the Authorization header value given the basic auth credentials
    *
    * @param user The username portion of the credentials
    * @param password The password portion of the credentials
    */
    function getBasicAuthHeader(user: string, password: string): string;
    /**
    * Create base-64 encoded user:password value used for basic auth.
    *
    * @param user The username portion of the credentials
    * @param password The password portion of the credentials
    */
    function getBasicAuthValue(user: string, password: string): string;
}
/**
* Helper methods for dealing with bearer auth
*/
export module BearerAuthHelpers {
    /**
    * Create the Authorization header value given the bearer token
    *
    * @param token bearer token
    */
    function getBearerAuthHeader(token: string): string;
}
/**
* IAuthTokenManager for a named web session token.
*/
export class NamedWebSessionTokenManager implements IAuthTokenManager<Authentication_Contracts.WebSessionToken> {
    private _namedTokenId;
    private _tokenPromise;
    private _tokenExpirationTime;
    private _authClient;
    constructor(namedTokenId: string);
    /**
    * Get the auth token to use for this request.
    */
    getAuthToken(refresh?: boolean): IPromise<Authentication_Contracts.WebSessionToken>;
    /**
     * Gets the authorization header to use in a request from the given token
     *
     * @param sessionToken Used for token key.
     * @return the value to use for the Authorization header in a request.
     */
    getAuthorizationHeader(sessionToken: Authentication_Contracts.WebSessionToken): string;
}
/**
* IAuthTokenManager for an explicit basic auth token.
*/
export class BasicAuthTokenManager implements IAuthTokenManager<string> {
    private _user;
    private _password;
    constructor(user: string, password: string);
    /**
    * Get the auth token to use for this request.
    */
    getAuthToken(refresh?: boolean): IPromise<string>;
    /**
     * Gets the authorization header to use in a request from the given token
     *
     * @param sessionToken Used for token key.
     * @return the value to use for the Authorization header in a request.
     */
    getAuthorizationHeader(sessionToken: string): string;
}
export class BearerAuthTokenManager implements IAuthTokenManager<string> {
    private _token;
    constructor(token: string);
    /**
    * Get the auth token to use for this request.
    */
    getAuthToken(refresh?: boolean): IPromise<string>;
    /**
     * Gets the authorization header to use in a request from the given token
     *
     * @param sessionToken Used for token key.
     * @return the value to use for the Authorization header in a request.
     */
    getAuthorizationHeader(sessionToken: string): string;
    private _getTokenHeader();
}
/**
* Exposes the default auth token manager for account-level tokens
*/
export var authTokenManager: IAuthTokenManager<any>;
/**
* Fetch a session token to use for the current user for the given application (or null/empty for an unscoped token).
*
* @param appId Id of the application.
* @param name Metadata info to identify the token.
* @param force Enables skipping cache and issue a brand new token.
* @return Session token.
*/
export function getToken(appId?: string, name?: string, force?: boolean, scoped?: boolean): IPromise<Authentication_Contracts.WebSessionToken>;
/**
* Fetch an app token to use for the current user for the given application.  This can be used to authenticate
* with an external application.
*
* @param appId Id of the application.
* @param name Metadata info to identify the token.
* @param force Enables skipping cache and issue a brand new token.
* @return Session token.
*/
export function getAppToken(appId: string, name?: string, force?: boolean): IPromise<Authentication_Contracts.WebSessionToken>;
/**
* Get an auth token manager - either the default manager or the manager for a registered/named token
*
* @param namedToken Id Optional value to use when getting a named web session token.
*/
export function getAuthTokenManager(namedTokenId?: string): IAuthTokenManager<any>;
}
declare module "VSS/Bundling" {
/**
 * Gets the content length (in bytes) of all Javascript bundles included on the page
 */
export function getBundledScriptContentSize(): number;
/**
 * Gets the content length (in bytes) of all CSS bundles included on the page
 */
export function getBundledCssContentSize(): number;
/**
 * Get the size (in bytes) of a bundle given its url
 *
 * @param bundleUrl Url of the script or CSS bundle
 */
export function getBundleSize(bundleUrl: string): number;
/**
 * Inject all the CSS and Scripts specified in the bundle collection into the page
 *
 * @param bundles Collection of CSS and script bundles
 * @param rootBundleUrl Optional root url to prefix to all bundle paths.
 */
export function injectBundles(bundles: DynamicBundlesCollection, rootBundleUrl?: string): IPromise<any>;
/**
* Issue a require statement for the specified modules and invoke the given callback method once available.
* This is a wrapper around the requireJS 'require' statement which ensures that the missing modules are
* pulled in via the minimum number of resource requests.
*
* @param moduleNames An array of AMD modules to asynchronously require
* @param callback Method to invoke once the modules have been resolved.
*/
export function requireModules(moduleNames: string[], callback: Function): void;
}
declare module "VSS/Commerce/Contracts" {
export enum AccountProviderNamespace {
    VisualStudioOnline = 0,
    AppInsights = 1,
    Marketplace = 2,
}
/**
 * Represents an azure region, used by ibiza for linking accounts
 */
export interface AzureRegion {
    /**
     * Display Name of the azure region. Ex: North Central US.
     */
    displayName: string;
    /**
     * Unique Identifier
     */
    id: string;
    /**
     * Region code of the azure region. Ex: NCUS.
     */
    regionCode: string;
}
/**
 * Information about a resource associated with a subscription.
 */
export interface IOfferSubscription {
    /**
     * The azure subscription id
     */
    azureSubscriptionId: string;
    /**
     * The azure subscription name
     */
    azureSubscriptionName: string;
    /**
     * The azure subscription state
     */
    azureSubscriptionState: SubscriptionStatus;
    /**
     * Quantity commited by the user, when resources is commitment based.
     */
    committedQuantity: number;
    /**
     * A enumeration value indicating why the resource was disabled.
     */
    disabledReason: ResourceStatusReason;
    /**
     * Uri pointing to user action on a disabled resource. It is based on  value.
     */
    disabledResourceActionLink: string;
    /**
     * Quantity included for free.
     */
    includedQuantity: number;
    /**
     * Returns true if paid billing is enabled on the resource. Returns false for non-azure subscriptions, disabled azure subscriptions or explicitly disabled by user
     */
    isPaidBillingEnabled: boolean;
    /**
     * Returns true if resource is can be used otherwise returns false. can be used to identify why resource is disabled.
     */
    isUseable: boolean;
    /**
     * Returns an integer representing the maximum quantity that can be billed for this resource. Any usage submitted over this number is automatically excluded from being sent to azure.
     */
    maximumQuantity: number;
    /**
     * Gets the name of this resource.
     */
    offerMeter: OfferMeter;
    /**
     * Gets the renewal group.
     */
    renewalGroup: ResourceRenewalGroup;
    /**
     * Returns a Date of UTC kind indicating when the next reset of quantities is going to happen. On this day at UTC 2:00 AM is when the reset will occur.
     */
    resetDate: Date;
}
/**
 * The subscription account. Add Sub Type and Owner email later.
 */
export interface ISubscriptionAccount {
    /**
     * Gets or sets the account identifier. Usually a guid.
     */
    accountId: string;
    /**
     * Gets or sets the name of the account.
     */
    accountName: string;
    /**
     * Gets or sets the account tenantId.
     */
    accountTenantId: string;
    /**
     * get or set purchase Error Reason
     */
    failedPurchaseReason: PurchaseErrorReason;
    /**
     * Gets or sets the geo location.
     */
    geoLocation: string;
    /**
     * Gets or sets a value indicating whether the calling user identity owns the account.
     */
    isAccountOwner: boolean;
    /**
     * Gets or set the flag to enable purchase via subscription.
     */
    isEligibleForPurchase: boolean;
    /**
     * get or set IsPrepaidFundSubscription
     */
    isPrepaidFundSubscription: boolean;
    /**
     * get or set IsPricingPricingAvailable
     */
    isPricingAvailable: boolean;
    /**
     * Gets or sets the resource group.
     */
    resourceGroupName: string;
    /**
     * Gets or sets the azure resource name.
     */
    resourceName: string;
    /**
     * A dictionary of service urls, mapping the service owner to the service owner url
     */
    serviceUrls: {
        [key: string]: string;
    };
    /**
     * Gets or sets the subscription identifier.
     */
    subscriptionId: string;
    /**
     * Gets or sets the azure subscription name
     */
    subscriptionName: string;
    /**
     * get or set object id of subscruption admin
     */
    subscriptionObjectId: string;
    /**
     * get or set subscription offer code
     */
    subscriptionOfferCode: string;
    /**
     * Gets or sets the subscription status.
     */
    subscriptionStatus: SubscriptionStatus;
    /**
     * get or set tenant id of subscription
     */
    subscriptionTenantId: string;
}
/**
 * Information about a resource associated with a subscription.
 */
export interface ISubscriptionResource {
    /**
     * Quantity commited by the user, when resources is commitment based.
     */
    committedQuantity: number;
    /**
     * A enumeration value indicating why the resource was disabled.
     */
    disabledReason: ResourceStatusReason;
    /**
     * Uri pointing to user action on a disabled resource. It is based on  value.
     */
    disabledResourceActionLink: string;
    /**
     * Quantity included for free.
     */
    includedQuantity: number;
    /**
     * Returns true if paid billing is enabled on the resource. Returns false for non-azure subscriptions, disabled azure subscriptions or explicitly disabled by user
     */
    isPaidBillingEnabled: boolean;
    /**
     * Returns true if resource is can be used otherwise returns false. can be used to identify why resource is disabled.
     */
    isUseable: boolean;
    /**
     * Returns an integer representing the maximum quantity that can be billed for this resource. Any usage submitted over this number is automatically excluded from being sent to azure.
     */
    maximumQuantity: number;
    /**
     * Gets the name of this resource.
     */
    name: ResourceName;
    /**
     * Returns a Date of UTC kind indicating when the next reset of quantities is going to happen. On this day at UTC 2:00 AM is when the reset will occur.
     */
    resetDate: Date;
}
/**
 * Represents the aggregated usage of a resource over a time span
 */
export interface IUsageEventAggregate {
    /**
     * Gets or sets end time of the aggregated value, exclusive
     */
    endTime: Date;
    /**
     * Gets or sets resource that the aggregated value represents
     */
    resource: ResourceName;
    /**
     * Gets or sets start time of the aggregated value, inclusive
     */
    startTime: Date;
    /**
     * Gets or sets quantity of the resource used from start time to end time
     */
    value: number;
}
export enum MeterBillingState {
    Free = 0,
    Paid = 1,
    Trial = 2,
    PaidWithTrial = 3,
}
export enum MeterCategory {
    Legacy = 0,
    Bundle = 1,
    Extension = 2,
}
export enum MeterGroupType {
    License = 0,
    Build = 1,
    LoadTest = 2,
}
export enum MeterRenewalFrequecy {
    None = 0,
    Monthly = 1,
    Annually = 2,
}
export enum MeterState {
    Registered = 0,
    Active = 1,
    Retired = 2,
    Deleted = 3,
}
export interface OfferMeter {
    /**
     * Gets or sets the value of absolute maximum quantity for the resource
     */
    absoluteMaximumQuantity: number;
    /**
     * Gets or sets the billing mode of the resource
     */
    billingMode: ResourceBillingMode;
    /**
     * Gets or sets the state of the billing.
     */
    billingState: MeterBillingState;
    /**
     * Category.
     */
    category: MeterCategory;
    /**
     * Quantity commited by the user, when resources is commitment based.
     */
    committedQuantity: number;
    /**
     * Quantity used by the user, when resources is pay as you go or commitment based.
     */
    currentQuantity: number;
    /**
     * Gets or sets Gallery Id.
     */
    galleryId: string;
    /**
     * Quantity included for free.
     */
    includedQuantity: number;
    /**
     * Gets or sets the value of maximum quantity for the resource
     */
    maximumQuantity: number;
    /**
     * Meter Id.
     */
    meterId: number;
    /**
     * Name of the resource
     */
    name: string;
    /**
     * Gets or sets the offer scope.
     */
    offerScope: OfferScope;
    /**
     * Gets or sets the identifier representing this meter in commerce platform
     */
    platformMeterId: string;
    /**
     * Gets or sets the Renewak Frequency.
     */
    renewalFrequency: MeterRenewalFrequecy;
    /**
     * Gets or sets the status.
     */
    status: MeterState;
    /**
     * Gets or sets the trial cycles.
     */
    trialCycles: number;
    /**
     * Measuring unit for this meter.
     */
    unit: string;
}
export enum OfferScope {
    Account = 0,
    User = 1,
    UserAccount = 2,
}
/**
 * Information about a resource associated with a subscription.
 */
export interface OfferSubscription {
    /**
     * The azure subscription id
     */
    azureSubscriptionId: string;
    /**
     * The azure subscription name
     */
    azureSubscriptionName: string;
    /**
     * The azure subscription state
     */
    azureSubscriptionState: SubscriptionStatus;
    /**
     * Quantity commited by the user, when resources is commitment based.
     */
    committedQuantity: number;
    /**
     * A enumeration value indicating why the resource was disabled.
     */
    disabledReason: ResourceStatusReason;
    /**
     * Uri pointing to user action on a disabled resource. It is based on  value.
     */
    disabledResourceActionLink: string;
    /**
     * Quantity included for free.
     */
    includedQuantity: number;
    /**
     * Returns true if paid billing is enabled on the resource. Returns false for non-azure subscriptions, disabled azure subscriptions or explicitly disabled by user
     */
    isPaidBillingEnabled: boolean;
    /**
     * Returns true if resource is can be used otherwise returns false. can be used to identify why resource is disabled.
     */
    isUseable: boolean;
    /**
     * Returns an integer representing the maximum quantity that can be billed for this resource. Any usage submitted over this number is automatically excluded from being sent to azure.
     */
    maximumQuantity: number;
    /**
     * Gets or sets the name of this resource.
     */
    offerMeter: OfferMeter;
    /**
     * The unique identifier of this offer subscription
     */
    offerSubscriptionId: string;
    /**
     * Gets the renewal group.
     */
    renewalGroup: ResourceRenewalGroup;
    /**
     * Returns a Date of UTC kind indicating when the next reset of quantities is going to happen. On this day at UTC 2:00 AM is when the reset will occur.
     */
    resetDate: Date;
}
/**
 * The Purchasable offer meter.
 */
export interface PurchasableOfferMeter {
    /**
     * Currecny code for meter pricing
     */
    currencyCode: string;
    /**
     * Gets or sets the estimated renewal date.
     */
    estimatedRenewalDate: Date;
    /**
     * Locale for azure subscription
     */
    localeCode: string;
    /**
     * Gets or sets the meter pricing (GraduatedPrice)
     */
    meterPricing: {
        key: number;
        value: number;
    }[];
    /**
     * Gets or sets the offer meter definition.
     */
    offerMeterDefinition: OfferMeter;
}
export enum PurchaseErrorReason {
    None = 0,
    MonetaryLimitSet = 1,
    InvalidOfferCode = 2,
    NotAdminOrCoAdmin = 3,
    InvalidRegionPurchase = 4,
}
export enum ResourceBillingMode {
    Committment = 0,
    PayAsYouGo = 1,
}
export enum ResourceName {
    StandardLicense = 0,
    AdvancedLicense = 1,
    ProfessionalLicense = 2,
    Build = 3,
    LoadTest = 4,
    PremiumBuildAgent = 5,
    PrivateOtherBuildAgent = 6,
    PrivateAzureBuildAgent = 7,
}
export enum ResourceRenewalGroup {
    Monthly = 0,
    Jan = 1,
    Feb = 2,
    Mar = 3,
    Apr = 4,
    May = 5,
    Jun = 6,
    Jul = 7,
    Aug = 8,
    Sep = 9,
    Oct = 10,
    Nov = 11,
    Dec = 12,
}
export enum ResourceStatusReason {
    None = 0,
    NoAzureSubscription = 1,
    NoIncludedQuantityLeft = 2,
    SubscriptionDisabled = 4,
    PaidBillingDisabled = 8,
    MaximumQuantityReached = 16,
}
/**
 * Information about a resource associated with a subscription.
 */
export interface SubscriptionResource {
    /**
     * Quantity commited by the user, when resources is commitment based.
     */
    committedQuantity: number;
    /**
     * A enumeration value indicating why the resource was disabled.
     */
    disabledReason: ResourceStatusReason;
    /**
     * Uri pointing to user action on a disabled resource. It is based on  value.
     */
    disabledResourceActionLink: string;
    /**
     * Quantity included for free.
     */
    includedQuantity: number;
    /**
     * Returns true if paid billing is enabled on the resource. Returns false for non-azure subscriptions, disabled azure subscriptions or explicitly disabled by user
     */
    isPaidBillingEnabled: boolean;
    /**
     * Returns true if resource is can be used otherwise returns false. can be used to identify why resource is disabled.
     */
    isUseable: boolean;
    /**
     * Returns an integer representing the maximum quantity that can be billed for this resource. Any usage submitted over this number is automatically excluded from being sent to azure.
     */
    maximumQuantity: number;
    /**
     * Gets or sets the name of this resource.
     */
    name: ResourceName;
    /**
     * Returns a Date of UTC kind indicating when the next reset of quantities is going to happen. On this day at UTC 2:00 AM is when the reset will occur.
     */
    resetDate: Date;
}
export enum SubscriptionSource {
    Normal = 0,
    EnterpriseAgreement = 1,
    Internal = 2,
    Unknown = 3,
    FreeTier = 4,
}
export enum SubscriptionStatus {
    Unknown = 0,
    Active = 1,
    Disabled = 2,
    Deleted = 3,
    Unregistered = 4,
}
/**
 * Class that represents common set of properties for a raw usage event reported by TFS services.
 */
export interface UsageEvent {
    /**
     * Gets or sets account id of the event. Note: This is for backward compat with BI.
     */
    accountId: string;
    /**
     * Account name associated with the usage event
     */
    accountName: string;
    /**
     * User GUID associated with the usage event
     */
    associatedUser: string;
    /**
     * Timestamp when this billing event is billable
     */
    billableDate: Date;
    /**
     * Unique event identifier
     */
    eventId: string;
    /**
     * Recieving Timestamp of the billing event by metering service
     */
    eventTimestamp: Date;
    /**
     * Meter Id.
     */
    meterName: string;
    /**
     * Partition id of the account
     */
    partitionId: number;
    /**
     * Quantity of the usage event
     */
    quantity: number;
    /**
     * Gets or sets the billing mode for the resource involved in the usage
     */
    resourceBillingMode: ResourceBillingMode;
    /**
     * Service context GUID associated with the usage event
     */
    serviceIdentity: string;
    /**
     * Gets or sets subscription anniversary day of the subscription
     */
    subscriptionAnniversaryDay: number;
    /**
     * Gets or sets subscription guid of the associated account of the event
     */
    subscriptionId: string;
}
export var TypeInfo: {
    AccountProviderNamespace: {
        enumValues: {
            "visualStudioOnline": number;
            "appInsights": number;
            "marketplace": number;
        };
    };
    AzureRegion: {
        fields: any;
    };
    IOfferSubscription: {
        fields: any;
    };
    ISubscriptionAccount: {
        fields: any;
    };
    ISubscriptionResource: {
        fields: any;
    };
    IUsageEventAggregate: {
        fields: any;
    };
    MeterBillingState: {
        enumValues: {
            "free": number;
            "paid": number;
            "trial": number;
            "paidWithTrial": number;
        };
    };
    MeterCategory: {
        enumValues: {
            "legacy": number;
            "bundle": number;
            "extension": number;
        };
    };
    MeterGroupType: {
        enumValues: {
            "license": number;
            "build": number;
            "loadTest": number;
        };
    };
    MeterRenewalFrequecy: {
        enumValues: {
            "none": number;
            "monthly": number;
            "annually": number;
        };
    };
    MeterState: {
        enumValues: {
            "registered": number;
            "active": number;
            "retired": number;
            "deleted": number;
        };
    };
    OfferMeter: {
        fields: any;
    };
    OfferScope: {
        enumValues: {
            "account": number;
            "user": number;
            "userAccount": number;
        };
    };
    OfferSubscription: {
        fields: any;
    };
    PurchasableOfferMeter: {
        fields: any;
    };
    PurchaseErrorReason: {
        enumValues: {
            "none": number;
            "monetaryLimitSet": number;
            "invalidOfferCode": number;
            "notAdminOrCoAdmin": number;
            "invalidRegionPurchase": number;
        };
    };
    ResourceBillingMode: {
        enumValues: {
            "committment": number;
            "payAsYouGo": number;
        };
    };
    ResourceName: {
        enumValues: {
            "standardLicense": number;
            "advancedLicense": number;
            "professionalLicense": number;
            "build": number;
            "loadTest": number;
            "premiumBuildAgent": number;
            "privateOtherBuildAgent": number;
            "privateAzureBuildAgent": number;
        };
    };
    ResourceRenewalGroup: {
        enumValues: {
            "monthly": number;
            "jan": number;
            "feb": number;
            "mar": number;
            "apr": number;
            "may": number;
            "jun": number;
            "jul": number;
            "aug": number;
            "sep": number;
            "oct": number;
            "nov": number;
            "dec": number;
        };
    };
    ResourceStatusReason: {
        enumValues: {
            "none": number;
            "noAzureSubscription": number;
            "noIncludedQuantityLeft": number;
            "subscriptionDisabled": number;
            "paidBillingDisabled": number;
            "maximumQuantityReached": number;
        };
    };
    SubscriptionResource: {
        fields: any;
    };
    SubscriptionSource: {
        enumValues: {
            "normal": number;
            "enterpriseAgreement": number;
            "internal": number;
            "unknown": number;
            "freeTier": number;
        };
    };
    SubscriptionStatus: {
        enumValues: {
            "unknown": number;
            "active": number;
            "disabled": number;
            "deleted": number;
            "unregistered": number;
        };
    };
    UsageEvent: {
        fields: any;
    };
};
}
declare module "VSS/Commerce/RestClient" {
import Contracts = require("VSS/Commerce/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class CommerceHttpClient3 extends VSS_WebApi.VssHttpClient {
    static serviceInstanceId: string;
    constructor(rootRequestPath: string);
    /**
     * [Preview API] Returns resource information like status, committed quantity, included quantity, reset date, etc.
     *
     * @param {boolean} nextBillingPeriod - True to return next billing cycle committed quantity
     * @return IPromise<Contracts.ISubscriptionResource[]>
     */
    getResourceStatus(nextBillingPeriod?: boolean): IPromise<Contracts.ISubscriptionResource[]>;
    /**
     * [Preview API] Returns resource information like status, committed quantity, included quantity, reset date, etc.
     *
     * @param {Contracts.ResourceName} resourceName - Name of the resource
     * @param {boolean} nextBillingPeriod - True to return next billing cycle committed quantity
     * @return IPromise<Contracts.ISubscriptionResource>
     */
    getResourceStatusByResourceName(resourceName: Contracts.ResourceName, nextBillingPeriod?: boolean): IPromise<Contracts.ISubscriptionResource>;
    /**
     * [Preview API] Sets the maximum and included quantities for a resource
     *
     * @param {Contracts.SubscriptionResource} meter
     * @return IPromise<void>
     */
    updateMeter(meter: Contracts.SubscriptionResource): IPromise<void>;
    /**
     * [Preview API] Returns resource information like status, committed quantity, included quantity, reset date, etc.
     *
     * @param {string} resourceName
     * @param {string} resourceNameResolveMethod
     * @return IPromise<Contracts.OfferMeter>
     */
    getOfferMeter(resourceName: string, resourceNameResolveMethod: string): IPromise<Contracts.OfferMeter>;
    /**
     * [Preview API] Returns resource information like status, committed quantity, included quantity, reset date, etc.
     *
     * @param {string} resourceName
     * @param {string} resourceNameResolveMethod
     * @param {string} subscriptionId
     * @param {boolean} includeMeterPricing
     * @param {string} offerCode
     * @param {string} tenantId
     * @param {string} objectId
     * @return IPromise<Contracts.PurchasableOfferMeter>
     */
    getPurchasableOfferMeter(resourceName: string, resourceNameResolveMethod: string, subscriptionId: string, includeMeterPricing: boolean, offerCode?: string, tenantId?: string, objectId?: string): IPromise<Contracts.PurchasableOfferMeter>;
    /**
     * [Preview API]
     *
     * @param {Contracts.OfferSubscription} offerSubscription
     * @param {string} offerCode
     * @param {string} tenantId
     * @param {string} objectId
     * @return IPromise<void>
     */
    createOfferSubscription(offerSubscription: Contracts.OfferSubscription, offerCode?: string, tenantId?: string, objectId?: string): IPromise<void>;
    /**
     * [Preview API] Get all offer subscriptions for user for valid azure subscriptions. This may be span across multiple accounts
     *
     * @param {boolean} validateAzuresubscription
     * @param {boolean} nextBillingPeriod - True to return next billing cycle committed quantity
     * @return IPromise<Contracts.IOfferSubscription[]>
     */
    getAllOfferSubscriptionsForUser(validateAzuresubscription: boolean, nextBillingPeriod: boolean): IPromise<Contracts.IOfferSubscription[]>;
    /**
     * [Preview API] Returns resource information like status, committed quantity, included quantity, reset date, etc.
     *
     * @param {string} galleryId - Name of the resource
     * @param {boolean} nextBillingPeriod - True to return next billing cycle committed quantity
     * @return IPromise<Contracts.IOfferSubscription>
     */
    getOfferSubscription(galleryId: string, nextBillingPeriod?: boolean): IPromise<Contracts.IOfferSubscription>;
    /**
     * [Preview API] Returns resource information like status, committed quantity, included quantity, reset date, etc.
     *
     * @param {boolean} nextBillingPeriod - True to return next billing cycle committed quantity
     * @return IPromise<Contracts.IOfferSubscription[]>
     */
    getOfferSubscriptions(nextBillingPeriod?: boolean): IPromise<Contracts.IOfferSubscription[]>;
    /**
     * [Preview API] Get all offer subscriptions for user for valid azure subscriptions. This may be span across multiple accounts
     *
     * @param {string} galleryItemId
     * @param {string} azureSubscriptionId
     * @param {boolean} nextBillingPeriod - True to return next billing cycle committed quantity
     * @return IPromise<Contracts.IOfferSubscription[]>
     */
    getOfferSubscriptionsForGalleryItem(galleryItemId: string, azureSubscriptionId: string, nextBillingPeriod?: boolean): IPromise<Contracts.IOfferSubscription[]>;
    /**
     * [Preview API] Sets the maximum and included quantities for a resource
     *
     * @param {Contracts.OfferSubscription} offerSubscription
     * @return IPromise<void>
     */
    updateOfferSubscription(offerSubscription: Contracts.OfferSubscription): IPromise<void>;
    /**
     * [Preview API]
     *
     * @return IPromise<Contracts.AzureRegion[]>
     */
    getAccountRegions(): IPromise<Contracts.AzureRegion[]>;
    /**
     * [Preview API] Gets the accounts by subscription.
     *
     * @param {string} subscriptionId - The subscription identifier.
     * @param {Contracts.AccountProviderNamespace} providerNamespaceId - The provider namespace identifier.
     * @return IPromise<Contracts.ISubscriptionAccount[]>
     */
    getAccounts(subscriptionId: string, providerNamespaceId: Contracts.AccountProviderNamespace): IPromise<Contracts.ISubscriptionAccount[]>;
    /**
     * [Preview API] Gets the accounts owned by identity.
     *
     * @param {Contracts.AccountProviderNamespace} providerNamespaceId - The provider namespace identifier.
     * @param {string} memberId - The owner identifier.
     * @param {boolean} queryOnlyOwnerAccounts - if set to true [query only owner accounts].
     * @param {boolean} inlcudeDisabledAccounts - if set to true [inlcude disabled accounts].
     * @param {boolean} includeMSAAccounts
     * @param {string[]} serviceOwners
     * @return IPromise<Contracts.ISubscriptionAccount[]>
     */
    getAccountsByIdentity(providerNamespaceId: Contracts.AccountProviderNamespace, memberId: string, queryOnlyOwnerAccounts: boolean, inlcudeDisabledAccounts: boolean, includeMSAAccounts: boolean, serviceOwners: string[]): IPromise<Contracts.ISubscriptionAccount[]>;
    /**
     * [Preview API] Get accounts and associated subscriptions by identity and offer id
     *
     * @param {Contracts.AccountProviderNamespace} providerNamespaceId - account provider namespace id
     * @param {string} memberId - owner identifier
     * @param {boolean} queryOnlyOwnerAccounts - if set to true [query only owner accounts].
     * @param {boolean} inlcudeDisabledAccounts - if set to true [inlcude disabled accounts].
     * @param {boolean} includeMSAAccounts - if set to true [inlcude MSA accounts].
     * @param {string[]} serviceOwners
     * @param {string} galleryId - gallery id of resource
     * @param {boolean} addUnlinkedSubscription - if set to true [inlcude azure subscriptions own by user].
     * @param {boolean} queryAccountsByUpn
     * @return IPromise<Contracts.ISubscriptionAccount[]>
     */
    getAccountsByIdentityForOfferId(providerNamespaceId: Contracts.AccountProviderNamespace, memberId: string, queryOnlyOwnerAccounts: boolean, inlcudeDisabledAccounts: boolean, includeMSAAccounts: boolean, serviceOwners: string[], galleryId: string, addUnlinkedSubscription?: boolean, queryAccountsByUpn?: boolean): IPromise<Contracts.ISubscriptionAccount[]>;
    /**
     * [Preview API] Get list of azure subscription where user is admin- co-admin under tenant or valid azure subscriptions for purchase (passing accountId to get this information for AAD calls)
     *
     * @param {string} subscriptionId
     * @param {string} galleryItemId
     * @param {string} accountId
     * @return IPromise<Contracts.ISubscriptionAccount>
     */
    getAzureSubscriptionForPurchase(subscriptionId: string, galleryItemId: string, accountId?: string): IPromise<Contracts.ISubscriptionAccount>;
    /**
     * [Preview API] Get list of azure subscription where user is admin- co-admin under tenant or valid azure subscriptions for purchase
     *
     * @param {string} subscriptionId
     * @return IPromise<Contracts.ISubscriptionAccount[]>
     */
    getAzureSubscriptionForUser(subscriptionId?: string): IPromise<Contracts.ISubscriptionAccount[]>;
    /**
     * [Preview API] Retrieves the subscription id associated to an account or null if no subscription is associated.
     *
     * @param {Contracts.AccountProviderNamespace} providerNamespaceId
     * @param {string} accountId
     * @return IPromise<Contracts.ISubscriptionAccount>
     */
    getSubscriptionAccount(providerNamespaceId: Contracts.AccountProviderNamespace, accountId: string): IPromise<Contracts.ISubscriptionAccount>;
    /**
     * [Preview API] Links the account to a subscription.
     *
     * @param {string} subscriptionId - The subscription identifier.
     * @param {Contracts.AccountProviderNamespace} providerNamespaceId - The provider namespace identifier.
     * @param {string} accountId - The account identifier.
     * @param {string} ownerId - The account owner identifier.
     * @return IPromise<void>
     */
    linkAccount(subscriptionId: string, providerNamespaceId: Contracts.AccountProviderNamespace, accountId: string, ownerId: string): IPromise<void>;
    /**
     * [Preview API] Unlinks an account from the subsription.
     *
     * @param {string} subscriptionId - The subscription identifier.
     * @param {Contracts.AccountProviderNamespace} providerNamespaceId - The provider namespace identifier.
     * @param {string} accountId - The account identifier.
     * @param {string} ownerId - The account owner identifier.
     * @return IPromise<void>
     */
    unlinkAccount(subscriptionId: string, providerNamespaceId: Contracts.AccountProviderNamespace, accountId: string, ownerId: string): IPromise<void>;
    /**
     * [Preview API] Returns the aggregate resource usage over the specified time range WARNING: The return value of this method is significantly different than the post method on this controller. This is an aggregation of usage events over time rather than individual usage event(s).
     *
     * @param {Date} startTime - Start of the the time range to retrieve, inclusive
     * @param {Date} endTime - End of the time range to retrieve, exclusive
     * @param {any} timeSpan - Interval of the time to retrieve, should be in a multiple of hour or day
     * @return IPromise<Contracts.IUsageEventAggregate[]>
     */
    getUsage(startTime: Date, endTime: Date, timeSpan: any): IPromise<Contracts.IUsageEventAggregate[]>;
    /**
     * [Preview API] Saves usage entry of a resource.
     *
     * @param {Contracts.UsageEvent} usageEvent - Detailed usage event
     * @return IPromise<void>
     */
    reportUsage(usageEvent: Contracts.UsageEvent): IPromise<void>;
}
/**
 * @exemptedapi
 */
export class CommerceHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    static serviceInstanceId: string;
    constructor(rootRequestPath: string);
    /**
     * [Preview API] Returns resource information like status, committed quantity, included quantity, reset date, etc.
     *
     * @param {boolean} nextBillingPeriod - True to return next billing cycle committed quantity
     * @return IPromise<Contracts.ISubscriptionResource[]>
     */
    getResourceStatus(nextBillingPeriod?: boolean): IPromise<Contracts.ISubscriptionResource[]>;
    /**
     * [Preview API] Returns resource information like status, committed quantity, included quantity, reset date, etc.
     *
     * @param {Contracts.ResourceName} resourceName - Name of the resource
     * @param {boolean} nextBillingPeriod - True to return next billing cycle committed quantity
     * @return IPromise<Contracts.ISubscriptionResource>
     */
    getResourceStatusByResourceName(resourceName: Contracts.ResourceName, nextBillingPeriod?: boolean): IPromise<Contracts.ISubscriptionResource>;
    /**
     * [Preview API] Sets the maximum and included quantities for a resource
     *
     * @param {Contracts.SubscriptionResource} meter
     * @return IPromise<void>
     */
    updateMeter(meter: Contracts.SubscriptionResource): IPromise<void>;
    /**
     * [Preview API] Returns resource information like status, committed quantity, included quantity, reset date, etc.
     *
     * @param {string} resourceName
     * @param {string} resourceNameResolveMethod
     * @return IPromise<Contracts.OfferMeter>
     */
    getOfferMeter(resourceName: string, resourceNameResolveMethod: string): IPromise<Contracts.OfferMeter>;
    /**
     * [Preview API] Returns resource information like status, committed quantity, included quantity, reset date, etc.
     *
     * @param {string} resourceName
     * @param {string} resourceNameResolveMethod
     * @param {string} subscriptionId
     * @param {boolean} includeMeterPricing
     * @param {string} offerCode
     * @param {string} tenantId
     * @param {string} objectId
     * @return IPromise<Contracts.PurchasableOfferMeter>
     */
    getPurchasableOfferMeter(resourceName: string, resourceNameResolveMethod: string, subscriptionId: string, includeMeterPricing: boolean, offerCode?: string, tenantId?: string, objectId?: string): IPromise<Contracts.PurchasableOfferMeter>;
    /**
     * [Preview API]
     *
     * @param {Contracts.OfferSubscription} offerSubscription
     * @param {string} offerCode
     * @param {string} tenantId
     * @param {string} objectId
     * @return IPromise<void>
     */
    createOfferSubscription(offerSubscription: Contracts.OfferSubscription, offerCode?: string, tenantId?: string, objectId?: string): IPromise<void>;
    /**
     * [Preview API] Get all offer subscriptions for user for valid azure subscriptions. This may be span across multiple accounts
     *
     * @param {boolean} validateAzuresubscription
     * @param {boolean} nextBillingPeriod - True to return next billing cycle committed quantity
     * @return IPromise<Contracts.IOfferSubscription[]>
     */
    getAllOfferSubscriptionsForUser(validateAzuresubscription: boolean, nextBillingPeriod: boolean): IPromise<Contracts.IOfferSubscription[]>;
    /**
     * [Preview API] Returns resource information like status, committed quantity, included quantity, reset date, etc.
     *
     * @param {string} galleryId - Name of the resource
     * @param {boolean} nextBillingPeriod - True to return next billing cycle committed quantity
     * @return IPromise<Contracts.IOfferSubscription>
     */
    getOfferSubscription(galleryId: string, nextBillingPeriod?: boolean): IPromise<Contracts.IOfferSubscription>;
    /**
     * [Preview API] Returns resource information like status, committed quantity, included quantity, reset date, etc.
     *
     * @param {boolean} nextBillingPeriod - True to return next billing cycle committed quantity
     * @return IPromise<Contracts.IOfferSubscription[]>
     */
    getOfferSubscriptions(nextBillingPeriod?: boolean): IPromise<Contracts.IOfferSubscription[]>;
    /**
     * [Preview API] Get all offer subscriptions for user for valid azure subscriptions. This may be span across multiple accounts
     *
     * @param {string} galleryItemId
     * @param {string} azureSubscriptionId
     * @param {boolean} nextBillingPeriod - True to return next billing cycle committed quantity
     * @return IPromise<Contracts.IOfferSubscription[]>
     */
    getOfferSubscriptionsForGalleryItem(galleryItemId: string, azureSubscriptionId: string, nextBillingPeriod?: boolean): IPromise<Contracts.IOfferSubscription[]>;
    /**
     * [Preview API] Sets the maximum and included quantities for a resource
     *
     * @param {Contracts.OfferSubscription} offerSubscription
     * @return IPromise<void>
     */
    updateOfferSubscription(offerSubscription: Contracts.OfferSubscription): IPromise<void>;
    /**
     * [Preview API]
     *
     * @return IPromise<Contracts.AzureRegion[]>
     */
    getAccountRegions(): IPromise<Contracts.AzureRegion[]>;
    /**
     * [Preview API] Gets the accounts by subscription.
     *
     * @param {string} subscriptionId - The subscription identifier.
     * @param {Contracts.AccountProviderNamespace} providerNamespaceId - The provider namespace identifier.
     * @return IPromise<Contracts.ISubscriptionAccount[]>
     */
    getAccounts(subscriptionId: string, providerNamespaceId: Contracts.AccountProviderNamespace): IPromise<Contracts.ISubscriptionAccount[]>;
    /**
     * [Preview API] Gets the accounts owned by identity.
     *
     * @param {Contracts.AccountProviderNamespace} providerNamespaceId - The provider namespace identifier.
     * @param {string} memberId - The owner identifier.
     * @param {boolean} queryOnlyOwnerAccounts - if set to true [query only owner accounts].
     * @param {boolean} inlcudeDisabledAccounts - if set to true [inlcude disabled accounts].
     * @param {boolean} includeMSAAccounts
     * @param {string[]} serviceOwners
     * @return IPromise<Contracts.ISubscriptionAccount[]>
     */
    getAccountsByIdentity(providerNamespaceId: Contracts.AccountProviderNamespace, memberId: string, queryOnlyOwnerAccounts: boolean, inlcudeDisabledAccounts: boolean, includeMSAAccounts: boolean, serviceOwners: string[]): IPromise<Contracts.ISubscriptionAccount[]>;
    /**
     * [Preview API] Get accounts and associated subscriptions by identity and offer id
     *
     * @param {Contracts.AccountProviderNamespace} providerNamespaceId - account provider namespace id
     * @param {string} memberId - owner identifier
     * @param {boolean} queryOnlyOwnerAccounts - if set to true [query only owner accounts].
     * @param {boolean} inlcudeDisabledAccounts - if set to true [inlcude disabled accounts].
     * @param {boolean} includeMSAAccounts - if set to true [inlcude MSA accounts].
     * @param {string[]} serviceOwners
     * @param {string} galleryId - gallery id of resource
     * @param {boolean} addUnlinkedSubscription - if set to true [inlcude azure subscriptions own by user].
     * @param {boolean} queryAccountsByUpn
     * @return IPromise<Contracts.ISubscriptionAccount[]>
     */
    getAccountsByIdentityForOfferId(providerNamespaceId: Contracts.AccountProviderNamespace, memberId: string, queryOnlyOwnerAccounts: boolean, inlcudeDisabledAccounts: boolean, includeMSAAccounts: boolean, serviceOwners: string[], galleryId: string, addUnlinkedSubscription?: boolean, queryAccountsByUpn?: boolean): IPromise<Contracts.ISubscriptionAccount[]>;
    /**
     * [Preview API] Get list of azure subscription where user is admin- co-admin under tenant or valid azure subscriptions for purchase (passing accountId to get this information for AAD calls)
     *
     * @param {string} subscriptionId
     * @param {string} galleryItemId
     * @param {string} accountId
     * @return IPromise<Contracts.ISubscriptionAccount>
     */
    getAzureSubscriptionForPurchase(subscriptionId: string, galleryItemId: string, accountId: string): IPromise<Contracts.ISubscriptionAccount>;
    /**
     * [Preview API] Get list of azure subscription where user is admin- co-admin under tenant or valid azure subscriptions for purchase
     *
     * @param {string} subscriptionId
     * @return IPromise<Contracts.ISubscriptionAccount[]>
     */
    getAzureSubscriptionForUser(subscriptionId?: string): IPromise<Contracts.ISubscriptionAccount[]>;
    /**
     * [Preview API] Retrieves the subscription id associated to an account or null if no subscription is associated.
     *
     * @param {Contracts.AccountProviderNamespace} providerNamespaceId
     * @param {string} accountId
     * @return IPromise<Contracts.ISubscriptionAccount>
     */
    getSubscriptionAccount(providerNamespaceId: Contracts.AccountProviderNamespace, accountId: string): IPromise<Contracts.ISubscriptionAccount>;
    /**
     * [Preview API] Links the account to a subscription.
     *
     * @param {string} subscriptionId - The subscription identifier.
     * @param {Contracts.AccountProviderNamespace} providerNamespaceId - The provider namespace identifier.
     * @param {string} accountId - The account identifier.
     * @param {string} ownerId - The account owner identifier.
     * @return IPromise<void>
     */
    linkAccount(subscriptionId: string, providerNamespaceId: Contracts.AccountProviderNamespace, accountId: string, ownerId: string): IPromise<void>;
    /**
     * [Preview API] Unlinks an account from the subsription.
     *
     * @param {string} subscriptionId - The subscription identifier.
     * @param {Contracts.AccountProviderNamespace} providerNamespaceId - The provider namespace identifier.
     * @param {string} accountId - The account identifier.
     * @param {string} ownerId - The account owner identifier.
     * @return IPromise<void>
     */
    unlinkAccount(subscriptionId: string, providerNamespaceId: Contracts.AccountProviderNamespace, accountId: string, ownerId: string): IPromise<void>;
    /**
     * [Preview API] Returns the aggregate resource usage over the specified time range WARNING: The return value of this method is significantly different than the post method on this controller. This is an aggregation of usage events over time rather than individual usage event(s).
     *
     * @param {Date} startTime - Start of the the time range to retrieve, inclusive
     * @param {Date} endTime - End of the time range to retrieve, exclusive
     * @param {any} timeSpan - Interval of the time to retrieve, should be in a multiple of hour or day
     * @return IPromise<Contracts.IUsageEventAggregate[]>
     */
    getUsage(startTime: Date, endTime: Date, timeSpan: any): IPromise<Contracts.IUsageEventAggregate[]>;
    /**
     * [Preview API] Saves usage entry of a resource.
     *
     * @param {Contracts.UsageEvent} usageEvent - Detailed usage event
     * @return IPromise<void>
     */
    reportUsage(usageEvent: Contracts.UsageEvent): IPromise<void>;
}
export class CommerceHttpClient extends CommerceHttpClient3 {
    constructor(rootRequestPath: string);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return CommerceHttpClient2_2
 */
export function getClient(): CommerceHttpClient2_2;
}
declare module "VSS/Common/Constants/Platform" {
/**
* Constants related to the ActiveExtensionDataProvider
*/
export module ActiveExtensionDataConstants {
    /**
    * Data provider key for the active extension data provider
    */
    var ActiveExtensionsKey: string;
}
export module ContributedServiceContextData {
    /**
    * The data provider key for contributed service contexts
    */
    var ContributedServiceContextDataKey: string;
}
export module DataProviderConstants {
    /**
    * The full contribution type id for data providers
    */
    var DataProviderContributionTypeId: string;
    /**
    * The contribution property name for the registered name of the data provider
    */
    var ContributionNameProperty: string;
    /**
    * The contribution property name for the service instance type id
    */
    var ContributionInstanceTypeProperty: string;
}
/**
* Constants used to report customer intelligence area data
*/
export module WebAccessCustomerIntelligenceConstants {
    var Area: string;
    var WebSettingsStoreSettingFeature: string;
    var FullScreenModeFeature: string;
    var InvalidLicenseExceptionFeature: string;
}
/**
* Constants used for VSSF\WebPlatform Feature Availability flags Note: This should only be flags consumed in platform-level typescript code or controllers.
*/
export module WebPlatformFeatureFlags {
    var VisualStudioServicesContribution: string;
    var VisualStudioServicesContributionUnSecureBrowsers: string;
    var VisualStudioServicesContributionFramework: string;
    var ClientSideErrorLogging: string;
    var UseCDN: string;
}
}
declare module "VSS/Common/Contracts/FormInput" {
export enum InputDataType {
    /**
     * No data type is specified.
     */
    None = 0,
    /**
     * Represents a textual value.
     */
    String = 10,
    /**
     * Represents a numberic value.
     */
    Number = 20,
    /**
     * Represents a value of true or false.
     */
    Boolean = 30,
    /**
     * Represents a Guid.
     */
    Guid = 40,
    /**
     * Represents a URI.
     */
    Uri = 50,
}
/**
 * Describes an input for subscriptions.
 */
export interface InputDescriptor {
    /**
     * The ids of all inputs that the value of this input is dependent on.
     */
    dependencyInputIds: string[];
    /**
     * Description of what this input is used for
     */
    description: string;
    /**
     * The group localized name to which this input belongs and can be shown as a header for the container that will include all the inputs in the group.
     */
    groupName: string;
    /**
     * If true, the value information for this input is dynamic and should be fetched when the value of dependency inputs change.
     */
    hasDynamicValueInformation: boolean;
    /**
     * Identifier for the subscription input
     */
    id: string;
    /**
     * Mode in which the value of this input should be entered
     */
    inputMode: InputMode;
    /**
     * Gets whether this input is confidential, such as for a password or application key
     */
    isConfidential: boolean;
    /**
     * Localized name which can be shown as a label for the subscription input
     */
    name: string;
    /**
     * Gets whether this input is included in the default generated action description.
     */
    useInDefaultDescription: boolean;
    /**
     * Information to use to validate this input's value
     */
    validation: InputValidation;
    /**
     * A hint for input value. It can be used in the UI as the input placeholder.
     */
    valueHint: string;
    /**
     * Information about possible values for this input
     */
    values: InputValues;
}
/**
 * Defines a filter for subscription inputs. The filter matches a set of inputs if any (one or more) of the groups evaluates to true.
 */
export interface InputFilter {
    /**
     * Groups of input filter expressions. This filter matches a set of inputs if any (one or more) of the groups evaluates to true.
     */
    conditions: InputFilterCondition[];
}
/**
 * An expression which can be applied to filter a list of subscription inputs
 */
export interface InputFilterCondition {
    /**
     * Whether or not to do a case sensitive match
     */
    caseSensitive: boolean;
    /**
     * The Id of the input to filter on
     */
    inputId: string;
    /**
     * The "expected" input value to compare with the actual input value
     */
    inputValue: string;
    /**
     * The operator applied between the expected and actual input value
     */
    operator: InputFilterOperator;
}
export enum InputFilterOperator {
    Equals = 0,
    NotEquals = 1,
}
export enum InputMode {
    /**
     * This input should not be shown in the UI
     */
    None = 0,
    /**
     * An input text box should be shown
     */
    TextBox = 10,
    /**
     * An password input box should be shown
     */
    PasswordBox = 20,
    /**
     * A select/combo control should be shown
     */
    Combo = 30,
    /**
     * Radio buttons should be shown
     */
    RadioButtons = 40,
    /**
     * Checkbox should be shown(for true/false values)
     */
    CheckBox = 50,
    /**
     * A multi-line text area should be shown
     */
    TextArea = 60,
}
/**
 * Describes what values are valid for a subscription input
 */
export interface InputValidation {
    dataType: InputDataType;
    isRequired: boolean;
    maxLength: number;
    maxValue: number;
    minLength: number;
    minValue: number;
    pattern: string;
    patternMismatchErrorMessage: string;
}
/**
 * Information about a single value for an input
 */
export interface InputValue {
    /**
     * Any other data about this input
     */
    data: {
        [key: string]: any;
    };
    /**
     * The text to show for the display of this value
     */
    displayValue: string;
    /**
     * The value to store for this input
     */
    value: string;
}
/**
 * Information about the possible/allowed values for a given subscription input
 */
export interface InputValues {
    /**
     * The default value to use for this input
     */
    defaultValue: string;
    /**
     * Errors encountered while computing dynamic values.
     */
    error: InputValuesError;
    /**
     * The id of the input
     */
    inputId: string;
    /**
     * Should this input be disabled
     */
    isDisabled: boolean;
    /**
     * Should the value be restricted to one of the values in the PossibleValues (True) or are the values in PossibleValues just a suggestion (False)
     */
    isLimitedToPossibleValues: boolean;
    /**
     * Should this input be made read-only
     */
    isReadOnly: boolean;
    /**
     * Possible values that this input can take
     */
    possibleValues: InputValue[];
}
/**
 * Error information related to a subscription input value.
 */
export interface InputValuesError {
    /**
     * The error message.
     */
    message: string;
}
export interface InputValuesQuery {
    currentValues: {
        [key: string]: string;
    };
    /**
     * The input values to return on input, and the result from the consumer on output.
     */
    inputValues: InputValues[];
    /**
     * Subscription containing information about the publisher/consumer and the current input values
     */
    resource: any;
}
export var TypeInfo: {
    InputDataType: {
        enumValues: {
            "none": number;
            "string": number;
            "number": number;
            "boolean": number;
            "guid": number;
            "uri": number;
        };
    };
    InputDescriptor: {
        fields: any;
    };
    InputFilter: {
        fields: any;
    };
    InputFilterCondition: {
        fields: any;
    };
    InputFilterOperator: {
        enumValues: {
            "equals": number;
            "notEquals": number;
        };
    };
    InputMode: {
        enumValues: {
            "none": number;
            "textBox": number;
            "passwordBox": number;
            "combo": number;
            "radioButtons": number;
            "checkBox": number;
            "textArea": number;
        };
    };
    InputValidation: {
        fields: any;
    };
    InputValue: {
        fields: any;
    };
    InputValues: {
        fields: any;
    };
    InputValuesError: {
        fields: any;
    };
    InputValuesQuery: {
        fields: any;
    };
};
}
declare module "VSS/Common/Contracts/Platform" {
/**
* Model to represent a public access uri
*/
export interface AccessPointModel {
    /**
    * Host name and port number of the url
    */
    authority: string;
    /**
    * Url scheme (http, https, ...)
    */
    scheme: string;
    /**
    * Full url
    */
    uri: string;
}
/**
* Data related to Active Extensions
*/
export interface ActiveExtensionsData {
    /**
    * Dictionary mapping extension ids to their active status
    */
    extensions: {
        [key: string]: boolean;
    };
}
/**
* Model used to configure how TFS reports usage data to Application Insights
*/
export interface AppInsightsConfiguration {
    /**
    * If true, automatically call "trackPage" when the page is loaded
    */
    autoTrackPage: boolean;
    /**
    * Optional data used to override the default values sent to trackPage
    */
    customTrackPageData: AppInsightsCustomTrackPageData;
    /**
    * Set to false if app insights reporting is not enabled/configured
    */
    enabled: boolean;
    /**
    * The url from which to retrieve app insights scripts
    */
    insightsScriptUrl: string;
    /**
    * The instrumentation key used to track this deployment's usage
    */
    instrumentationKey: string;
    /**
    * If true, include collection, project, and team info in the track-page urls
    */
    trackProjectInfo: boolean;
}
/**
* Model that can be used to customize the values sent to AppInsights via "trackPage"
*/
export interface AppInsightsCustomTrackPageData {
    alias: string;
    metrics: {
        [key: string]: number;
    };
    pageName: string;
    properties: {
        [key: string]: string;
    };
}
/**
* Web Access configuration data. This information is used to process requests on the server.  This data is also placed in a json island on each page in order for JavaScript to know key configuration data required to things like construct proper urls
*/
export interface ConfigurationContext {
    /**
    * MVC api configuration
    */
    api: ConfigurationContextApis;
    /**
    * Optional name of the client (e.g. TEE) hosting the page
    */
    clientHost: string;
    isHosted: boolean;
    /**
    * Current mail settings for TFS
    */
    mailSettings: TfsMailSettings;
    /**
    * Server resource paths
    */
    paths: ConfigurationContextPaths;
}
/**
* MVC api configuration
*/
export interface ConfigurationContextApis {
    /**
    * Specifies the path prefix for the area
    */
    areaPrefix: string;
    /**
    * Specifies the path prefix for the controller
    */
    controllerPrefix: string;
    /**
    * Api-version for legacy rpc-style web access api controllers See WebApiVersionClient for the version coming from the client/browser.  The return value is a positive whole number >= 1.
    */
    webApiVersion: string;
}
/**
* Paths to server resources
*/
export interface ConfigurationContextPaths {
    /**
    * Relative path to the _content path of the web application
    */
    resourcesPath: string;
    /**
    * Relative path to the root of the web application
    */
    rootPath: string;
    /**
    * Static content version stamp
    */
    staticContentVersion: string;
    /**
    * Relative path to unversioned 3rd party static content
    */
    staticRoot3rdParty: string;
    /**
    * Relative path to versioned static content
    */
    staticRootTfs: string;
}
export enum ContextHostType {
    Unknown = 0,
    /**
    * The Deployment Host
    */
    Deployment = 1,
    /**
    * The Application Host
    */
    Application = 2,
    /**
    * The Project Collection
    */
    ProjectCollection = 4,
}
export interface ContextIdentifier {
    id: string;
    name: string;
}
/**
* Page context configuration that can be contributed by remote services (different VSTS services delivering content to the page)
*/
export interface ContributedServiceContext {
    /**
    * Dynamic bundles to include from this service
    */
    bundles: DynamicBundlesCollection;
    /**
    * Specifies the prefixes for CSS modules that should map to the current service. e.g. "VSS/LoaderPlugins/Css!EMS:ExtensionManagement" would map to ExtensionManagement.css under the themed content path of this service if "EMS" is in the CSSModulePrefixes list.
    */
    cssModulePrefixes: string[];
    /**
    * Feature flag states to include by default in page data (avoids AJAX lookup)
    */
    featureAvailability: FeatureAvailabilityContext;
    /**
    * Module loader configuration which may be merged-in with the parent host (if injected into the DOM) Because the config may be merged with the host config, each root area path must be explicitly defined here rather than relying on basePath as a catch-all.
    */
    moduleLoaderConfig: ModuleLoaderConfiguration;
    /**
    * Paths to resources on this service
    */
    paths: ConfigurationContextPaths;
    /**
    * Lookup of urls for different services (at different host levels)
    */
    serviceLocations: ServiceLocations;
    /**
    * The root url of the service that can be used to resolve relative links when this content is hosted in another site.
    */
    serviceRootUrl: string;
    /**
    * Instance id of the service
    */
    serviceTypeId: string;
}
/**
* Item representing a contribution path. Can be of type default, resource or bundle
*/
export interface ContributionPath {
    /**
    * Type if this contribution path
    */
    pathType: ContributionPathType;
    /**
    * Replace value for this contribution path
    */
    value: string;
}
/**
* Type of the contribution path
*/
export enum ContributionPathType {
    Default = 0,
    Resource = 1,
}
/**
* Contains lists of script and css references that need to be included on the page in order for the controls used by the page to work.
*/
export interface CoreReferencesContext {
    /**
    * Core javascript bundle
    */
    coreScriptsBundle: JavascriptFileReference;
    /**
    * Core javascript files referenced on a page
    */
    scripts: JavascriptFileReference[];
    /**
    * Core CSS files referenced on a page
    */
    stylesheets: StylesheetReference[];
}
export interface DaylightSavingsAdjustmentEntry {
    /**
    * Millisecond adjustment from UTC
    */
    offset: number;
    /**
    * Date that the offset adjustment starts
    */
    start: Date;
}
export interface DiagnosticsContext {
    /**
    * Id of the current activity
    */
    activityId: string;
    allowStatsCollection: boolean;
    /**
    * Whether or not to enable static content bundling. This is on by default but the value can be overridden with a TFS-BUNDLING cookie or registry entry.
    */
    bundlingEnabled: boolean;
    debugMode: boolean;
    isDevFabric: boolean;
    sessionId: string;
    tracePointCollectionEnabled: boolean;
    tracePointProfileEnd: string;
    tracePointProfileStart: string;
    /**
    * Denotes the version of the web platform consumed by this service. Of the form M###.
    */
    webPlatformVersion: string;
}
export interface DynamicBundlesCollection {
    scripts: DynamicScriptBundle[];
    scriptsExcludedByPath: string[];
    styles: DynamicCSSBundle[];
}
export interface DynamicCSSBundle {
    contentLength: number;
    cssFiles: string[];
    fallbackThemeUri: string;
    uri: string;
}
export interface DynamicScriptBundle {
    contentLength: number;
    uri: string;
}
export interface ExtendedHostContext {
    authority: string;
    hostType: ContextHostType;
    id: string;
    isAADAccount: boolean;
    name: string;
    relativeUri: string;
    scheme: string;
    uri: string;
}
export interface FeatureAvailabilityContext {
    featureStates: {
        [key: string]: boolean;
    };
}
export interface GlobalizationContext {
    culture: string;
    theme: string;
    timeZoneId: string;
    timezoneOffset: number;
}
export interface HostContext {
    id: string;
    name: string;
    relativeUri: string;
    uri: string;
}
/**
* Model representing a hub in VSTS pages' navigation menu
*/
export interface Hub {
    groupId: string;
    id: string;
    isSelected: boolean;
    name: string;
    order: any;
    uri: string;
}
/**
* Model representing a hub group in VSTS pages' navigation menu
*/
export interface HubGroup {
    hasHubs: boolean;
    id: string;
    name: string;
    order: any;
    uri: string;
}
/**
* Context information containing the relevant hubs and hub groups for a given context
*/
export interface HubsContext {
    hubGroups: HubGroup[];
    hubGroupsCollectionContributionId: string;
    hubs: Hub[];
    selectedHubGroupId: string;
    selectedHubId: string;
}
/**
* Model to represent a TeamFoundationIdentity
*/
export interface IdentityModel {
    /**
    * Custom display name
    */
    customDisplayName: string;
    /**
    * Display name
    */
    displayName: string;
    /**
    * Email address
    */
    email: string;
    /**
    * Unique team foundation id
    */
    id: string;
    /**
    * Is the identity active
    */
    isActive: boolean;
    /**
    * Is the identity a group/team
    */
    isContainer: boolean;
    /**
    * The provider's display name for this identity
    */
    providerDisplayName: string;
    /**
    * Unique name for this identity
    */
    uniqueName: string;
}
/**
* Reference to a javascript file to include on a page
*/
export interface JavascriptFileReference {
    /**
    * Condition to check in the case that Url lives on a CDN. The fallback script will be included if this check fails.
    */
    fallbackCondition: string;
    /**
    * Fallback url to use in case Url lives on a CDN
    */
    fallbackUrl: string;
    /**
    * Id of the reference (JQuery, JQueryUI, MicrosoftAjax, etc.)
    */
    identifier: string;
    /**
    * Is this a core javascript file that needs to be included on every page
    */
    isCoreModule: boolean;
    /**
    * Url of the javascript reference
    */
    url: string;
}
/**
* Class used to wrap arrays in an object.
*/
export interface JsonArrayWrapper {
    __wrappedArray: string;
}
export interface MicrosoftAjaxConfig {
    cultureInfo: any;
}
/**
* AMD javascript module loader configuration
*/
export interface ModuleLoaderConfiguration {
    baseUrl: string;
    contributionPaths: {
        [key: string]: ContributionPath;
    };
    paths: {
        [key: string]: string;
    };
    shim: {
        [key: string]: ModuleLoaderShimConfiguration;
    };
    /**
    * The maximum amount of time (in seconds) the AMD loader will wait for scripts to load.
    */
    waitSeconds: number;
}
/**
* AMD javascript module loader shim configuration
*/
export interface ModuleLoaderShimConfiguration {
    deps: string[];
    exports: string;
}
/**
* Structure to specify current navigation context of the executing request. The navigation context content's are generally obtained from the request URL. Some context specifiers such as "Account" can be implicit and might come from current IVssServiceHost.
*/
export interface NavigationContext {
    /**
    * A token to show which area the request has been targeted to. By default there are two areas "Admin" and "Api". They can be specified in the URL as _admin and _api respectively.
    */
    area: string;
    /**
    * Current action route value
    */
    currentAction: string;
    /**
    * Current controller route value
    */
    currentController: string;
    /**
    * Current parameters route value (the path after the controller and action in the url)
    */
    currentParameters: string;
    /**
    * Flag to show top most navigation context. For example the URL http://server:port/collection/project/_controller/action sets the Project bit while the URL http://server:port/collection/project/_admin/_controller/action sets also sets the area property to Admin.
    */
    topMostLevel: NavigationContextLevels;
}
/**
* Flags to show which tokens of the navigation context are present in the current request URL. The request url's context part are formed like http://server:port[/{collection}[/{project}[/{team}]]][/_admin]/_{controller}/{action} The tokens {collection}, {project} and {team} are navigation level tokens whereas _admin segment is a switch to show admin areas of the site.
*/
export enum NavigationContextLevels {
    None = 0,
    /**
    * Root level in Azure.
    */
    Deployment = 1,
    /**
    * Root level in on premises. Neither of {collection}, {project} and {team} tokens have information
    */
    Application = 2,
    /**
    * Flag to show {collection} token has information.
    */
    Collection = 4,
    /**
    * Flag to show {project} token has information.
    */
    Project = 8,
    /**
    * Flag to show {team} token has information.
    */
    Team = 16,
    /**
    * Sugar for all application levels.
    */
    ApplicationAll = 30,
    /**
    * Sugar for all levels
    */
    All = 31,
}
/**
* Global context placed on each VSSF web page (through json island data) which gives enough information for core TypeScript modules/controls on the page to operate
*/
export interface PageContext {
    /**
    * Configuration for reporting telemetry/usage data to App Insights
    */
    appInsightsConfiguration: AppInsightsConfiguration;
    /**
    * Core javascript and css references
    */
    coreReferences: CoreReferencesContext;
    /**
    * Specifies the prefixes for CSS modules that should map to the current service. e.g. "VSS/LoaderPlugins/Css!EMS:ExtensionManagement" would map to ExtensionManagement.css under the themed content path of this service if "EMS" is in the CSSModulePrefixes list.
    */
    cssModulePrefixes: string[];
    /**
    * Diagnostic related information for the current page
    */
    diagnostics: DiagnosticsContext;
    /**
    * Feature flag states to include by default in page data (avoids AJAX lookup)
    */
    featureAvailability: FeatureAvailabilityContext;
    /**
    * Globalization data for the current page based on the current user's settings
    */
    globalization: GlobalizationContext;
    /**
    * Configuration needed for Microsoft.Ajax library
    */
    microsoftAjaxConfig: MicrosoftAjaxConfig;
    /**
    * The (AMD) module configuration
    */
    moduleLoaderConfig: ModuleLoaderConfiguration;
    /**
    * Current navigation context.
    */
    navigation: NavigationContext;
    /**
    * The service instance type id for the VSTS service serving this page
    */
    serviceInstanceId: string;
    serviceLocations: ServiceLocations;
    /**
    * Contains global time zone configuration information (e.g. which dates DST changes)
    */
    timeZonesConfiguration: TimeZonesConfiguration;
    /**
    * Web Access configuration
    */
    webAccessConfiguration: ConfigurationContext;
    /**
    * The web context information for the given page request
    */
    webContext: WebContext;
}
/**
* Holds a lookup of urls for different services (at different host levels)
*/
export interface ServiceLocations {
    locations: {
        [key: string]: {
            [key: number]: string;
        };
    };
}
/**
* Reference to a CSS file to include on a page
*/
export interface StylesheetReference {
    /**
    * Url of the high-contrast version of the CSS file
    */
    highContrastUrl: string;
    /**
    * Is this a core stylesheet that needs to be included in child frames
    */
    isCoreStylesheet: boolean;
    /**
    * Url of the CSS file
    */
    url: string;
}
export interface TeamContext {
    id: string;
    name: string;
    userIsAdmin: boolean;
    userIsMember: boolean;
}
/**
* Data contract to represent a given team foundation service host (account, collection, deployment)
*/
export interface TeamFoundationServiceHostModel {
    /**
    * Type of host (deployment, account, collection)
    */
    hostType: any;
    /**
    * Unique id of the host (collection id, account id, etc.)
    */
    instanceId: string;
    /**
    * Name of the host (collection name, account name, etc.)
    */
    name: string;
    /**
    * Path of the service host, relative to the root virtual directory (e.g. DefaultCollection)
    */
    relVDir: string;
    /**
    * Path of the service host relative to the web application root (e.g. /tfs/DefaultCollection)
    */
    vDir: string;
}
export interface TfsMailSettings {
    enabled: boolean;
    from: string;
}
/**
* Internal structure to describe IVssServiceHost
*/
export interface TfsServiceHostDescriptor {
    hostType: any;
    id: string;
    name: string;
    relVdir: string;
    vdir: string;
}
export interface TimeZonesConfiguration {
    daylightSavingsAdjustments: DaylightSavingsAdjustmentEntry[];
}
export interface UserContext {
    email: string;
    id: string;
    limitedAccess: boolean;
    name: string;
    uniqueName: string;
}
/**
* Context information for all web access requests
*/
export interface WebContext {
    account: HostContext;
    /**
    * Information about the Collection used in the current request (may be null)
    */
    collection: HostContext;
    /**
    * Information about the current request context's host
    */
    host: ExtendedHostContext;
    /**
    * Information about the project used in the current request (may be null)
    */
    project: ContextIdentifier;
    /**
    * Information about the team used in the current request (may be null)
    */
    team: TeamContext;
    /**
    * Information about the current user
    */
    user: UserContext;
}
/**
* Contextual data for web-page-related data providers about the originating (host/source) page
*/
export interface WebPageDataProviderPageSource {
    /**
    * List of paths contributed by the host which are available to 3rd party extension developers through VSS.SDK
    */
    contributionPaths: string[];
    /**
    * Diagnostics context (debug mode, activity id, etc.) of the source page
    */
    diagnostics: DiagnosticsContext;
    /**
    * The navigation context for the host page that is loading the data provider
    */
    navigation: NavigationContext;
    /**
    * The project context for the host page that is loading the data provider
    */
    project: ContextIdentifier;
    /**
    * Currently selected hubgroup id
    */
    selectedHubGroupId: string;
    /**
    * Currently selected hub id
    */
    selectedHubId: string;
    /**
    * The team context for the host page that is loading the data provider
    */
    team: ContextIdentifier;
    /**
    * The url of the host page that is loading the data provider
    */
    url: string;
}
/**
* A single timing consisting of a duration and start time
*/
export interface WebPerformanceTimingEntry {
    /**
    * Length of time in milliseconds
    */
    duration: any;
    /**
    * Offset from Server Request Context start time in milliseconds
    */
    startTime: any;
}
/**
* A set of web performance timings all keyed off of the same string
*/
export interface WebPerformanceTimingGroup {
    /**
    * A list of timing entries
    */
    timings: WebPerformanceTimingEntry[];
}
export var TypeInfo: {
    AccessPointModel: {
        fields: any;
    };
    ActiveExtensionsData: {
        fields: any;
    };
    AppInsightsConfiguration: {
        fields: any;
    };
    AppInsightsCustomTrackPageData: {
        fields: any;
    };
    ConfigurationContext: {
        fields: any;
    };
    ConfigurationContextApis: {
        fields: any;
    };
    ConfigurationContextPaths: {
        fields: any;
    };
    ContextHostType: {
        enumValues: {
            "unknown": number;
            "deployment": number;
            "application": number;
            "projectCollection": number;
        };
    };
    ContextIdentifier: {
        fields: any;
    };
    ContributedServiceContext: {
        fields: any;
    };
    ContributionPath: {
        fields: any;
    };
    ContributionPathType: {
        enumValues: {
            "default": number;
            "resource": number;
        };
    };
    CoreReferencesContext: {
        fields: any;
    };
    DaylightSavingsAdjustmentEntry: {
        fields: any;
    };
    DiagnosticsContext: {
        fields: any;
    };
    DynamicBundlesCollection: {
        fields: any;
    };
    DynamicCSSBundle: {
        fields: any;
    };
    DynamicScriptBundle: {
        fields: any;
    };
    ExtendedHostContext: {
        fields: any;
    };
    FeatureAvailabilityContext: {
        fields: any;
    };
    GlobalizationContext: {
        fields: any;
    };
    HostContext: {
        fields: any;
    };
    Hub: {
        fields: any;
    };
    HubGroup: {
        fields: any;
    };
    HubsContext: {
        fields: any;
    };
    IdentityModel: {
        fields: any;
    };
    JavascriptFileReference: {
        fields: any;
    };
    JsonArrayWrapper: {
        fields: any;
    };
    MicrosoftAjaxConfig: {
        fields: any;
    };
    ModuleLoaderConfiguration: {
        fields: any;
    };
    ModuleLoaderShimConfiguration: {
        fields: any;
    };
    NavigationContext: {
        fields: any;
    };
    NavigationContextLevels: {
        enumValues: {
            "none": number;
            "deployment": number;
            "application": number;
            "collection": number;
            "project": number;
            "team": number;
            "applicationAll": number;
            "all": number;
        };
    };
    PageContext: {
        fields: any;
    };
    ServiceLocations: {
        fields: any;
    };
    StylesheetReference: {
        fields: any;
    };
    TeamContext: {
        fields: any;
    };
    TeamFoundationServiceHostModel: {
        fields: any;
    };
    TfsMailSettings: {
        fields: any;
    };
    TfsServiceHostDescriptor: {
        fields: any;
    };
    TimeZonesConfiguration: {
        fields: any;
    };
    UserContext: {
        fields: any;
    };
    WebContext: {
        fields: any;
    };
    WebPageDataProviderPageSource: {
        fields: any;
    };
    WebPerformanceTimingEntry: {
        fields: any;
    };
    WebPerformanceTimingGroup: {
        fields: any;
    };
};
}
declare module "VSS/Common/Contracts/System" {
export enum DayOfWeek {
    /**
     * Indicates Sunday.
     */
    Sunday = 0,
    /**
     * Indicates Monday.
     */
    Monday = 1,
    /**
     * Indicates Tuesday.
     */
    Tuesday = 2,
    /**
     * Indicates Wednesday.
     */
    Wednesday = 3,
    /**
     * Indicates Thursday.
     */
    Thursday = 4,
    /**
     * Indicates Friday.
     */
    Friday = 5,
    /**
     * Indicates Saturday.
     */
    Saturday = 6,
}
export var TypeInfo: {
    DayOfWeek: {
        enumValues: {
            "sunday": number;
            "monday": number;
            "tuesday": number;
            "wednesday": number;
            "thursday": number;
            "friday": number;
            "saturday": number;
        };
    };
};
}
declare module "VSS/Common/Contracts/System.Data" {
/**
 * Specifies SQL Server-specific data type of a field, property, for use in a System.Data.SqlClient.SqlParameter.
 */
export enum SqlDbType {
    /**
     * A 64-bit signed integer.
     */
    BigInt = 0,
    /**
     * Array of type Byte. A fixed-length stream of binary data ranging between 1 and 8,000 bytes.
     */
    Binary = 1,
    /**
     * Boolean. An unsigned numeric value that can be 0, 1, or null.
     */
    Bit = 2,
    /**
     * String. A fixed-length stream of non-Unicode characters ranging between 1 and 8,000 characters.
     */
    Char = 3,
    /**
     * DateTime. Date and time data ranging in value from January 1, 1753 to December 31, 9999 to an accuracy of 3.33 milliseconds.
     */
    DateTime = 4,
    /**
     * Decimal. A fixed precision and scale numeric value between -10 38 -1 and 10 38 -1.
     */
    Decimal = 5,
    /**
     * Double. A floating point number within the range of -1.79E +308 through 1.79E +308.
     */
    Float = 6,
    /**
     * Array of type Byte. A variable-length stream of binary data ranging from 0 to 2 31 -1 (or 2,147,483,647) bytes.
     */
    Image = 7,
    /**
     * Int32. A 32-bit signed integer.
     */
    Int = 8,
    /**
     * Decimal. A currency value ranging from -2 63 (or -9,223,372,036,854,775,808) to 2 63 -1 (or +9,223,372,036,854,775,807) with an accuracy to a ten-thousandth of a currency unit.
     */
    Money = 9,
    /**
     * String. A fixed-length stream of Unicode characters ranging between 1 and 4,000 characters.
     */
    NChar = 10,
    /**
     * String. A variable-length stream of Unicode data with a maximum length of 2 30 - 1 (or 1,073,741,823) characters.
     */
    NText = 11,
    /**
     * String. A variable-length stream of Unicode characters ranging between 1 and 4,000 characters. Implicit conversion fails if the string is greater than 4,000 characters. Explicitly set the object when working with strings longer than 4,000 characters. Use System.Data.SqlDbType.NVarChar when the database column is nvarchar(max).
     */
    NVarChar = 12,
    /**
     * Single. A floating point number within the range of -3.40E +38 through 3.40E +38.
     */
    Real = 13,
    /**
     * Guid. A globally unique identifier (or GUID).
     */
    UniqueIdentifier = 14,
    /**
     * DateTime. Date and time data ranging in value from January 1, 1900 to June 6, 2079 to an accuracy of one minute.
     */
    SmallDateTime = 15,
    /**
     * Int16. A 16-bit signed integer.
     */
    SmallInt = 16,
    /**
     * Decimal. A currency value ranging from -214,748.3648 to +214,748.3647 with an accuracy to a ten-thousandth of a currency unit.
     */
    SmallMoney = 17,
    /**
     * String. A variable-length stream of non-Unicode data with a maximum length of 2 31 -1 (or 2,147,483,647) characters.
     */
    Text = 18,
    /**
     * Array of type System.Byte. Automatically generated binary numbers, which are guaranteed to be unique within a database. timestamp is used typically as a mechanism for version-stamping table rows. The storage size is 8 bytes.
     */
    Timestamp = 19,
    /**
     * Byte. An 8-bit unsigned integer.
     */
    TinyInt = 20,
    /**
     * Array of type Byte. A variable-length stream of binary data ranging between 1 and 8,000 bytes. Implicit conversion fails if the byte array is greater than 8,000 bytes. Explicitly set the object when working with byte arrays larger than 8,000 bytes.
     */
    VarBinary = 21,
    /**
     * String. A variable-length stream of non-Unicode characters ranging between 1 and 8,000 characters. Use System.Data.SqlDbType.VarChar when the database column is varchar(max).
     */
    VarChar = 22,
    /**
     * Object. A special data type that can contain numeric, string, binary, or date data as well as the SQL Server values Empty and Null, which is assumed if no other type is declared.
     */
    Variant = 23,
    /**
     * An XML value. Obtain the XML as a string using the System.Data.SqlClient.SqlDataReader.GetValue(System.Int32) method or System.Data.SqlTypes.SqlXml.Value property, or as an System.Xml.XmlReader by calling the System.Data.SqlTypes.SqlXml.CreateReader method.
     */
    Xml = 25,
    /**
     * A SQL Server user-defined type (UDT).
     */
    Udt = 29,
    /**
     * A special data type for specifying structured data contained in table-valued parameters.
     */
    Structured = 30,
    /**
     * Date data ranging in value from January 1,1 AD through December 31, 9999 AD.
     */
    Date = 31,
    /**
     * Time data based on a 24-hour clock. Time value range is 00:00:00 through 23:59:59.9999999 with an accuracy of 100 nanoseconds. Corresponds to a SQL Server time value.
     */
    Time = 32,
    /**
     * Date and time data. Date value range is from January 1,1 AD through December 31, 9999 AD. Time value range is 00:00:00 through 23:59:59.9999999 with an accuracy of 100 nanoseconds.
     */
    DateTime2 = 33,
    /**
     * Date and time data with time zone awareness. Date value range is from January 1,1 AD through December 31, 9999 AD. Time value range is 00:00:00 through 23:59:59.9999999 with an accuracy of 100 nanoseconds. Time zone value range is -14:00 through +14:00.
     */
    DateTimeOffset = 34,
}
export var TypeInfo: {
    SqlDbType: {
        enumValues: {
            "BigInt": number;
            "Binary": number;
            "Bit": number;
            "Char": number;
            "DateTime": number;
            "Decimal": number;
            "Float": number;
            "Image": number;
            "Int": number;
            "Money": number;
            "NChar": number;
            "NText": number;
            "NVarChar": number;
            "Real": number;
            "UniqueIdentifier": number;
            "SmallDateTime": number;
            "SmallInt": number;
            "SmallMoney": number;
            "Text": number;
            "Timestamp": number;
            "TinyInt": number;
            "VarBinary": number;
            "VarChar": number;
            "Variant": number;
            "Xml": number;
            "Udt": number;
            "Structured": number;
            "Date": number;
            "Time": number;
            "DateTime2": number;
            "DateTimeOffset": number;
        };
    };
};
}
declare module "VSS/Compatibility" {
export function moved(name: string, fromPath: string, toPath: string, description?: any): void;
export function removed(name: string, internalUsage?: boolean): void;
export function deprecated(name: string, version: string): void;
}
declare module "VSS/Context" {
import Contracts_Platform = require("VSS/Common/Contracts/Platform");
/**
 * Parse out the web context information found in JSON island data in the given element.
 */
export function parseWebContext($element: JQuery): Contracts_Platform.WebContext;
/**
 * Get the raw JSON of the global context of the current page.
 */
export function _getDefaultRawPageContext(): Contracts_Platform.PageContext;
/**
 * Get the default web context for the current page.
 */
export function getDefaultWebContext(): Contracts_Platform.WebContext;
/**
 * Get the global page context for the current page.
 */
export function getPageContext(): Contracts_Platform.PageContext;
/**
* Get web access paths for the given service
*
* @param serviceInstanceTypeId The id of the service instance type
*/
export function getPathsForService(serviceInstanceTypeId: string): Contracts_Platform.ConfigurationContextPaths;
/**
* Add CSS module mappings to be used by the CSS loader.
*
* @param modulePrefix CSS module prefix to map
* @param url The base static root url used for CSS files for the service that owns that prefix
*/
export function addCssModulePrefixMapping(modulePrefix: string, url: string): void;
/**
* Get the url for the given CSS module (e.g. VSS/LoaderPlugins/Css!Prefix:ModulePath)
*
* @param modulePrefix CSS module prefix
* @param cssModulePath CSS module name
* @param theme The CSS theme (e.g. Default or HighContrast to use, defaults to the current theme if omitted)
* @returns The url to the themed css file
*/
export function getCssModuleUrl(modulePrefix: string, cssModulePath: string, theme?: string): string;
export function isHighContrastMode(): boolean;
/**
* Process the contributed configuration from a particular service
*
* @param context The contributed service context to evaluate
*/
export function processContributedServiceContext(context: Contracts_Platform.ContributedServiceContext): IPromise<any>;
}
declare module "VSS/Contributions/Contracts" {
import VSS_Common_Contracts = require("VSS/WebApi/Contracts");
/**
 * An individual contribution made by an extension
 */
export interface Contribution extends ContributionBase {
    /**
     * List of constraints (filters) that should be applied to the availability of this contribution
     */
    constraints: ContributionConstraint[];
    /**
     * Properties/attributes of this contribution
     */
    properties: any;
    /**
     * The ids of the contribution(s) that this contribution targets. (parent contributions)
     */
    targets: string[];
    /**
     * Id of the Contribution Type
     */
    type: string;
}
/**
 * Base class shared by contributions and contribution types
 */
export interface ContributionBase {
    /**
     * Description of the contribution/type
     */
    description: string;
    /**
     * Extension-relative identifier of the contribution/type
     */
    id: string;
}
/**
 * Specifies a constraint that can be used to dynamically include/exclude a given contribution
 */
export interface ContributionConstraint {
    /**
     * An optional property that can be specified to group constraints together. All constraints within a group are AND'd together (all must be evaluate to True in order for the contribution to be included). Different groups of constraints are OR'd (only one group needs to evaluate to True for the contribution to be included).
     */
    group: number;
    /**
     * If true, negate the result of the filter (include the contribution if the applied filter returns false instead of true)
     */
    inverse: boolean;
    /**
     * Name of the IContributionFilter class
     */
    name: string;
    /**
     * Properties that are fed to the contribution filter class
     */
    properties: any;
}
/**
 * Identifier for contributions and contribution types
 */
export interface ContributionIdentifier {
    /**
     * The extension id
     */
    extensionId: string;
    /**
     * The full/unique identifier of the contribution/contributionType
     */
    id: string;
    /**
     * The publisher id
     */
    publisherId: string;
    /**
     * The extension-relative contribution id
     */
    relativeId: string;
}
/**
 * Description about a property of a contribution type
 */
export interface ContributionPropertyDescription {
    /**
     * Description of the property
     */
    description: string;
    /**
     * Name of the property
     */
    name: string;
    /**
     * True if this property is required
     */
    required: boolean;
    /**
     * The type of value used for this property
     */
    type: ContributionPropertyType;
}
export enum ContributionPropertyType {
    /**
     * Contribution type is unknown (value may be anything)
     */
    Unknown = 0,
    /**
     * Value is a string
     */
    String = 1,
    /**
     * Value is a Uri
     */
    Uri = 2,
    /**
     * Value is a GUID
     */
    Guid = 4,
    /**
     * Value is True or False
     */
    Boolean = 8,
    /**
     * Value is an integer
     */
    Integer = 16,
    /**
     * Value is a double
     */
    Double = 32,
    /**
     * Value is a DateTime object
     */
    DateTime = 64,
    /**
     * Value is a generic Dictionary/JObject/property bag
     */
    Dictionary = 128,
    /**
     * Value is an array
     */
    Array = 256,
    /**
     * Value is an arbitrary/custom object
     */
    Object = 512,
}
/**
 * A contribution type, given by a json schema
 */
export interface ContributionType extends ContributionBase {
    /**
     * Controls whether or not contributions of this type have the type indexed for queries. This allows clients to find all extensions that have a contribution of this type.  NOTE: Only TrustedPartners are allowed to specify indexed contribution types.
     */
    indexed: boolean;
    /**
     * Friendly name of the contribution/type
     */
    name: string;
    /**
     * Describes the allowed properties for this contribution type
     */
    properties: {
        [key: string]: ContributionPropertyDescription;
    };
}
/**
 * Contextual information that data providers can examine when populating their data
 */
export interface DataProviderContext {
    /**
     * Generic property bag that contains context-specific properties that data providers can use when populating their data dictionary
     */
    properties: {
        [key: string]: any;
    };
}
/**
 * A query that can be issued for data provider data
 */
export interface DataProviderQuery {
    /**
     * Contextual information to pass to the data providers
     */
    context: DataProviderContext;
    /**
     * The contribution ids of the data providers to resolve
     */
    contributionIds: string[];
}
/**
 * Result structure from calls to GetDataProviderData
 */
export interface DataProviderResult {
    /**
     * Property bag of data keyed off of the data provider contribution id
     */
    data: {
        [key: string]: any;
    };
    /**
     * List of data providers resolved in the data-provider query
     */
    resolvedProviders: ResolvedDataProvider[];
}
/**
 * Represents a VSTS "extension" which is a container for contributions and contribution types
 */
export interface Extension extends ExtensionManifest {
    /**
     * The friendly extension id for this extension - unique for a given publisher.
     */
    extensionId: string;
    /**
     * The display name of the extension.
     */
    extensionName: string;
    /**
     * Extension flags relevant to contribution consumers
     */
    flags: ExtensionFlags;
    /**
     * Unique id of the publisher of this extension
     */
    publisherId: string;
    /**
     * The display name of the publisher
     */
    publisherName: string;
    /**
     * Unique id for this extension (the same id is used for all versions of a single extension)
     */
    registrationId: string;
    /**
     * Version of this extension
     */
    version: string;
}
/**
 * Represents the state of an extension request
 */
export interface ExtensionAuditAction {
}
/**
 * Audit log for an extension
 */
export interface ExtensionAuditLog {
    /**
     * Collection of audit log entries
     */
    entries: ExtensionAuditLogEntry[];
    /**
     * Extension that the change was made for
     */
    extensionName: string;
    /**
     * Publisher that the extension is part of
     */
    publisherName: string;
}
/**
 * An audit log entry for an extension
 */
export interface ExtensionAuditLogEntry {
    /**
     * Change that was made to extension
     */
    auditAction: string;
    /**
     * Date at which the change was made
     */
    auditDate: Date;
    /**
     * Extra information about the change
     */
    comment: string;
    /**
     * Represents the user who made the change
     */
    updatedBy: VSS_Common_Contracts.IdentityRef;
}
/**
 * Represents a single collection for extension data documents
 */
export interface ExtensionDataCollection {
    /**
     * The name of the collection
     */
    collectionName: string;
    /**
     * A list of documents belonging to the collection
     */
    documents: any[];
    /**
     * The type of the collection's scope, such as Default or User
     */
    scopeType: string;
    /**
     * The value of the collection's scope, such as Current or Me
     */
    scopeValue: string;
}
/**
 * Represents a query to receive a set of extension data collections
 */
export interface ExtensionDataCollectionQuery {
    /**
     * A list of collections to query
     */
    collections: ExtensionDataCollection[];
}
/**
 * Base class for an event callback for an extension
 */
export interface ExtensionEventCallback {
    /**
     * The uri of the endpoint that is hit when an event occurs
     */
    uri: string;
}
/**
 * Collection of event callbacks - endpoints called when particular extension events occur.
 */
export interface ExtensionEventCallbackCollection {
    /**
     * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension disable has occurred.
     */
    postDisable: ExtensionEventCallback;
    /**
     * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension enable has occurred.
     */
    postEnable: ExtensionEventCallback;
    /**
     * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension install has completed.
     */
    postInstall: ExtensionEventCallback;
    /**
     * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension uninstall has occurred.
     */
    postUninstall: ExtensionEventCallback;
    /**
     * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension update has occurred.
     */
    postUpdate: ExtensionEventCallback;
    /**
     * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension install is about to occur.  Response indicates whether to proceed or abort.
     */
    preInstall: ExtensionEventCallback;
    /**
     * For multi-version extensions, defines an endpoint that gets called via an OPTIONS request to determine the particular version of the extension to be used
     */
    versionCheck: ExtensionEventCallback;
}
export enum ExtensionFlags {
    /**
     * A built-in extension is installed for all VSTS accounts by default
     */
    BuiltIn = 1,
    /**
     * The extension comes from a fully-trusted publisher
     */
    Trusted = 2,
}
/**
 * Base class for extension properties which are shared by the extension manifest and the extension model
 */
export interface ExtensionManifest {
    /**
     * Uri used as base for other relative uri's defined in extension
     */
    baseUri: string;
    /**
     * List of contributions made by this extension
     */
    contributions: Contribution[];
    /**
     * List of contribution types defined by this extension
     */
    contributionTypes: ContributionType[];
    /**
     * Collection of endpoints that get called when particular extension events occur
     */
    eventCallbacks: ExtensionEventCallbackCollection;
    /**
     * Language Culture Name set by the Gallery
     */
    language: string;
    /**
     * Version of the extension manifest format/content
     */
    manifestVersion: number;
    /**
     * List of all oauth scopes required by this extension
     */
    scopes: string[];
    /**
     * The ServiceInstanceType(Guid) of the VSTS service that must be available to an account in order for the extension to be installed
     */
    serviceInstanceType: string;
}
/**
 * A request for an extension (to be installed or have a license assigned)
 */
export interface ExtensionRequest {
    /**
     * Required message supplied if the request is rejected
     */
    rejectMessage: string;
    /**
     * Date at which the request was made
     */
    requestDate: Date;
    /**
     * Represents the user who made the request
     */
    requestedBy: VSS_Common_Contracts.IdentityRef;
    /**
     * Optional message supplied by the requester justifying the request
     */
    requestMessage: string;
    /**
     * Represents the state of the request
     */
    requestState: ExtensionRequestState;
    /**
     * Date at which the request was resolved
     */
    resolveDate: Date;
    /**
     * Represents the user who resolved the request
     */
    resolvedBy: VSS_Common_Contracts.IdentityRef;
}
export enum ExtensionRequestState {
    /**
     * The request has been opened, but not yet responded to
     */
    Open = 0,
    /**
     * The request was accepted (extension installed or license assigned)
     */
    Accepted = 1,
    /**
     * The request was rejected (extension not installed or license not assigned)
     */
    Rejected = 2,
}
/**
 * The state of an extension
 */
export interface ExtensionState extends InstalledExtensionState {
    extensionName: string;
    /**
     * The time at which the version was last checked
     */
    lastVersionCheck: Date;
    publisherName: string;
    version: string;
}
export enum ExtensionStateFlags {
    /**
     * No flags set
     */
    None = 0,
    /**
     * Extension is disabled
     */
    Disabled = 1,
    /**
     * Extension is a built in
     */
    BuiltIn = 2,
    /**
     * Extension has multiple versions
     */
    MultiVersion = 4,
    /**
     * Extension is not installed.  This is for builtin extensions only and can not otherwise be set.
     */
    UnInstalled = 8,
    /**
     * Error performing version check
     */
    VersionCheckError = 16,
    /**
     * Trusted extensions are ones that are given special capabilities. These tend to come from Microsoft and can't be published by the general public.  Note: BuiltIn extensions are always trusted.
     */
    Trusted = 32,
    /**
     * Extension is currently in an error state
     */
    Error = 64,
}
/**
 * Represents a VSTS extension along with its installation state
 */
export interface InstalledExtension extends Extension {
    /**
     * Information about this particular installation of the extension
     */
    installState: InstalledExtensionState;
}
/**
 * The state of an installed extension
 */
export interface InstalledExtensionState {
    /**
     * States of an installed extension
     */
    flags: ExtensionStateFlags;
    /**
     * The time at which this installation was last updated
     */
    lastUpdated: Date;
}
/**
 * A request for an extension (to be installed or have a license assigned)
 */
export interface RequestedExtension {
    /**
     * THe unique name of the extensions
     */
    extensionName: string;
    /**
     * A list of each request for the extension
     */
    extensionRequests: ExtensionRequest[];
    /**
     * DisplayName of the publisher that owns the extension being published.
     */
    publisherDisplayName: string;
    /**
     * Represents the Publisher of the requested extension
     */
    publisherName: string;
    /**
     * The total number of requests for an extension
     */
    requestCount: number;
}
/**
 * Entry for a specific data provider's resulting data
 */
export interface ResolvedDataProvider {
    /**
     * The total time the data provider took to resolve its data (in milliseconds)
     */
    duration: number;
    error: string;
    id: string;
}
export interface Scope {
    description: string;
    title: string;
    value: string;
}
/**
 * Information about the extension
 */
export interface SupportedExtension {
    /**
     * Unique Identifier for this extension
     */
    extension: string;
    /**
     * Unique Identifier for this publisher
     */
    publisher: string;
    /**
     * Supported version for this extension
     */
    version: string;
}
export var TypeInfo: {
    Contribution: {
        fields: any;
    };
    ContributionBase: {
        fields: any;
    };
    ContributionConstraint: {
        fields: any;
    };
    ContributionIdentifier: {
        fields: any;
    };
    ContributionPropertyDescription: {
        fields: any;
    };
    ContributionPropertyType: {
        enumValues: {
            "unknown": number;
            "string": number;
            "uri": number;
            "guid": number;
            "boolean": number;
            "integer": number;
            "double": number;
            "dateTime": number;
            "dictionary": number;
            "array": number;
            "object": number;
        };
    };
    ContributionType: {
        fields: any;
    };
    DataProviderContext: {
        fields: any;
    };
    DataProviderQuery: {
        fields: any;
    };
    DataProviderResult: {
        fields: any;
    };
    Extension: {
        fields: any;
    };
    ExtensionAuditAction: {
        fields: any;
    };
    ExtensionAuditLog: {
        fields: any;
    };
    ExtensionAuditLogEntry: {
        fields: any;
    };
    ExtensionDataCollection: {
        fields: any;
    };
    ExtensionDataCollectionQuery: {
        fields: any;
    };
    ExtensionEventCallback: {
        fields: any;
    };
    ExtensionEventCallbackCollection: {
        fields: any;
    };
    ExtensionFlags: {
        enumValues: {
            "builtIn": number;
            "trusted": number;
        };
    };
    ExtensionManifest: {
        fields: any;
    };
    ExtensionRequest: {
        fields: any;
    };
    ExtensionRequestState: {
        enumValues: {
            "open": number;
            "accepted": number;
            "rejected": number;
        };
    };
    ExtensionState: {
        fields: any;
    };
    ExtensionStateFlags: {
        enumValues: {
            "none": number;
            "disabled": number;
            "builtIn": number;
            "multiVersion": number;
            "unInstalled": number;
            "versionCheckError": number;
            "trusted": number;
            "error": number;
        };
    };
    InstalledExtension: {
        fields: any;
    };
    InstalledExtensionState: {
        fields: any;
    };
    RequestedExtension: {
        fields: any;
    };
    ResolvedDataProvider: {
        fields: any;
    };
    Scope: {
        fields: any;
    };
    SupportedExtension: {
        fields: any;
    };
};
}
declare module "VSS/Contributions/Controls" {
import Contracts_Platform = require("VSS/Common/Contracts/Platform");
/**
* Common interface between internal and external contribution hosts
*/
export interface IExtensionHost {
    /**
    * Get an instance of a registered object in an extension
    *
    * @param instanceId Id of the instance to get
    * @param contextData Optional data to pass to the extension for it to use when creating the instance
    * @return Promise that is resolved to the instance (or a proxy object that talks to the instance in the iframe case)
    */
    getRegisteredInstance<T>(instanceId: string, contextData?: any): IPromise<T>;
    /**
    * Gets the promise that is resolved when the host is loaded, and rejected when the load fails or times out.
    */
    getLoadPromise(): IPromise<any>;
}
/**
* Options for the host control to toggle progress indication or error/warning handling.
*/
export interface IContributionHostBehavior {
    /**
    * Show the loading indicator for the extension. Defaults to true if unspecified.
    */
    showLoadingIndicator?: boolean;
    /**
    * Show the error indicator for the extension. Defaults to true if unspecified.
    */
    showErrorIndicator?: boolean;
    /**
    * Time to wait in milliseconds (ms) before the slow warning indicator for the extension is displayed.
    * If unspecified, The default timeout period is used.
    */
    slowWarningDurationMs?: number;
}
/**
* Instantiate a contributed control through an internal or external contribution host.
*
* @param $container The jQuery element to place the control in
* @param contribution The contribution (or its id) which contains the details of the contributed control
* @param initialConfig Initial configuration/options to pass to the control
* @param webContext The web context to use when fetching contributions and resolving uris
* @param instanceId Id of the registered object in the contribution's host
* @param contributionHostBehavior options for the host control to toggle behavior on progress indication and error/warning handling.
* @return Proxied instance of the control
*/
export function createContributedControl<T>($container: JQuery, contribution: IExtensionContribution | string, initialConfig?: any, webContext?: Contracts_Platform.WebContext, instanceId?: string, contributionHostBehavior?: IContributionHostBehavior): IPromise<T>;
/**
* Instantiate a contributed control through an internal or external contribution host.
*
* @param $container The jQuery element to place the control in
* @param contributionId The contribution (or its id) which contains the details of the contributed control
* @param initialConfig Initial configuration/options to pass to the control
* @param webContext The web context to use when fetching contributions and resolving uris
* @param postContent Optional data to post to the contribution url (if not specified, a GET is performed)
* @param uriReplacementProperties Replacement object to use when resolving the content uri
* @param uriPropertyName Name of the uri property to lookup in the contribution's properties
* @param iframeFirstPartyContent: Set to true if the content should be iframed, even if it is first-party content.
* @param contributionHostBehavior options for the host control to toggle behavior on progress indication and error/warning handling.
* @return IExtensionHost
*/
export function createExtensionHost($container: JQuery, contribution: IExtensionContribution | string, initialConfig?: any, webContext?: Contracts_Platform.WebContext, postContent?: any, uriReplacementProperties?: any, uriPropertyName?: string, iframeFirstPartyContent?: boolean, contributionHostBehavior?: IContributionHostBehavior): IPromise<IExtensionHost>;
/**
* Instantiate a contributed control through an internal or external contribution host.
*
* @param $container The jQuery element to place the control in
* @param uri The uri of the contribution content
* @param contribution The contribution which contains the details of the contributed control
* @param initialConfig Initial configuration/options to pass to the control
* @param postContent: Optional data to post to the contribution url (if not specified, a GET is performed)
* @param iframeFirstPartyContent: Set to true if the content should be iframed, even if it is first-party content.
* @param contributionHostBehavior options for the host control to toggle behavior on progress indication and error/warning handling.
* @return IExtensionHost
*/
export function createExtensionHostForContribution($container: JQuery, uri: string, contribution: IExtensionContribution, initialConfig?: any, postContent?: any, iframeFirstPartyContent?: boolean, contributionHostBehavior?: IContributionHostBehavior): IExtensionHost;
/**
* Instantiate a contributed background host (no UI) through an internal or external contribution host.
*
* @param contribution The contribution (or full id of the contribution) which contains the details of the contributed control
* @param webContext The web context to use when fetching contributions and resolving uris
* @param uriReplacementProperties Replacement object to use when resolving the content uri
* @param uriPropertyName Name of the uri property to lookup in the contribution's properties
* @return IExtensionHost
*/
export function getBackgroundHost(contribution: IExtensionContribution | string, webContext?: Contracts_Platform.WebContext, uriReplacementProperties?: any, uriPropertyName?: string): IPromise<IExtensionHost>;
/**
* Instantiate a registered background/service instance (no UI) through an internal or external contribution host.
*
* @param contribution The contribution (or full id of the contribution) which contains the details of the contributed control
* @param instanceId Id of the registered object in the contribution's host
* @param contextData Context data/options to pass to the registered object factory method
* @param webContext The web context to use when fetching contributions and resolving uris
* @param timeout Timeout in milliseconds for the instance creation
* @param timeoutMessage Message to reject the promise with if the fetch times out
* @param uriReplacementProperties Replacement object to use when resolving the content uri
* @param uriPropertyName Name of the uri property to lookup in the contribution's properties
* @return IExtensionHost
*/
export function getBackgroundInstance<T>(contribution: IExtensionContribution | string, instanceId: string, contextData?: any, webContext?: Contracts_Platform.WebContext, timeout?: number, timeoutMessage?: string, uriReplacementProperties?: any, uriPropertyName?: string): IPromise<T>;
}
declare module "VSS/Contributions/RestClient" {
import Contracts = require("VSS/Contributions/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class ContributionsHttpClient3 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {Contracts.DataProviderQuery} query
     * @return IPromise<Contracts.DataProviderResult>
     */
    queryDataProviders(query: Contracts.DataProviderQuery): IPromise<Contracts.DataProviderResult>;
    /**
     * [Preview API]
     *
     * @param {string[]} contributionIds
     * @param {boolean} includeDisabledApps
     * @return IPromise<Contracts.InstalledExtension[]>
     */
    getInstalledExtensions(contributionIds?: string[], includeDisabledApps?: boolean): IPromise<Contracts.InstalledExtension[]>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @return IPromise<Contracts.InstalledExtension>
     */
    getInstalledExtensionByName(publisherName: string, extensionName: string): IPromise<Contracts.InstalledExtension>;
}
/**
 * @exemptedapi
 */
export class ContributionsHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {Contracts.DataProviderQuery} query
     * @return IPromise<Contracts.DataProviderResult>
     */
    queryDataProviders(query: Contracts.DataProviderQuery): IPromise<Contracts.DataProviderResult>;
    /**
     * [Preview API]
     *
     * @param {string[]} contributionIds
     * @param {boolean} includeDisabledApps
     * @return IPromise<Contracts.InstalledExtension[]>
     */
    getInstalledExtensions(contributionIds?: string[], includeDisabledApps?: boolean): IPromise<Contracts.InstalledExtension[]>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @return IPromise<Contracts.InstalledExtension>
     */
    getInstalledExtensionByName(publisherName: string, extensionName: string): IPromise<Contracts.InstalledExtension>;
}
export class ContributionsHttpClient extends ContributionsHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return ContributionsHttpClient2_2
 */
export function getClient(): ContributionsHttpClient2_2;
}
declare module "VSS/Contributions/Services" {
import Contributions_Contracts = require("VSS/Contributions/Contracts");
import Serialization = require("VSS/Serialization");
import Service = require("VSS/Service");
export module CustomerIntelligenceConstants {
    var CONTRIBUTIONS_AREA: string;
    var CONTRIBUTIONS_USAGE_FEATURE: string;
    var CONTRIBUTIONS_ACTION: string;
    var CONTRIBUTIONS_ACTION_EXECUTE: string;
}
/**
* Optional flags for querying contributions
*/
export enum ContributionQueryOptions {
    IncludeRoot = 1,
    IncludeDirectTargets = 2,
    IncludeRecursiveTargets = 4,
    IncludeAll = 7,
}
/**
* Method used to filter contributions as part of a contribution query call
*/
export interface ContributionQueryCallback {
    (contribution: IExtensionContribution): ContributionQueryCallbackResult;
}
export enum ContributionQueryCallbackResult {
    None = 0,
    Include = 1,
    Recurse = 2,
    IncludeAndRecurse = 3,
}
/**
 * Manages all RegisteredExtension instances and their contributions.
 */
export class ExtensionService extends Service.VssService {
    private static _testExecutionFeatureFlag;
    private _extensions;
    private _contributionsClient;
    private _webPageDataService;
    private _contributionsById;
    private _contributionsByTargetId;
    private _loadedContributionTargets;
    private _contributionQueryPromises;
    /**
     * Private constructor - do not call.
     */
    constructor();
    /**
     * Ensures the page's Json Island has been processed if web context is the default
     * Should be called by the Service factory.
     * @param connection Service.VssConnection
     */
    initializeConnection(connection: Service.VssConnection): void;
    /**
     * Given an extension, creates Contribution objects that can be quickly
     * looked up, and also have a reference back to the extension.
     */
    private _ensureContributionLookups(extension);
    /**
     * Register an extension
     * @param extension Contributions_Contracts.InstalledExtension The extension to register.
     */
    registerExtension(extension: Contributions_Contracts.InstalledExtension): void;
    /**
     * Get the contribution with the given id.
     *
     * @param id Full id of the contribution to fetch
     * @return IPromise<IExtensionContribution>
     */
    getContribution(id: string): IPromise<IExtensionContribution>;
    /**
     * Gets the contributions that target the given contribution ids
     *
     * @param targetIds Ids of the targeted contribution(s)
     * @param contributionType Optional type of contribution to filter by
     * @return IPromise<IExtensionContribution[]> Promise that is resolved when contributions are available.
     */
    getContributionsForTarget(targetId: string, contributionType?: string): IPromise<IExtensionContribution[]>;
    /**
     * Gets the contributions that target the given contribution ids
     *
     * @param targetIds Ids of the targeted contribution(s)
     * @param contributionType Optional type of contribution to filter by
     * @return IPromise<IExtensionContribution[]> Promise that is resolved when contributions are available.
     */
    getContributionsForTargets(targetIds: string[], contributionType?: string): IPromise<IExtensionContribution[]>;
    /**
     * Gets contributions for the given contribution ids.
     *
     * @param ids Ids of the targeted contribution(s)
     * @param includeRootItems True to include the contributions with the specified ids
     * @param includeChildren True to include contributions that target the specified ids
     * @param recursive If true include targeting children recursively
     * @return IPromise<IExtensionContribution[]> Promise that is resolved when contributions are available.
     */
    getContributions(ids: string[], includeRootItems: boolean, includeChildren: boolean, recursive?: boolean): IPromise<IExtensionContribution[]>;
    /**
     * Gets contributions for the given contribution ids.
     *
     * @param ids Ids of the targeted contribution(s)
     * @param queryOptions Contribution query options
     * @param contributionType Optional type of contribution to filter by
     * @param queryCallback Optional method to filter contributions by
     * @return IPromise<IExtensionContribution[]> Promise that is resolved when contributions are available.
     */
    queryContributions(ids: string[], queryOptions: ContributionQueryOptions, contributionType?: string, queryCallback?: ContributionQueryCallback): IPromise<IExtensionContribution[]>;
    /**
    * Determines whether or not the provided extension id is currently active - installed, licensed, and enabled.
    * If the an extension has set up an ActiveExtensionDataProvider to send the extension active state down with the JSON island data,
    * the state is pulled from there. Otherwise, a call is made to the server to get the state. This result is not cached.
    * @param extensionId The extension id (e.g. 'ms.vss-testmanager-web') to check
    */
    isExtensionActive(extensionId: string): IPromise<boolean>;
    private _resolveContributions(deferred, contributions);
    private _getUnqueriedContributions(ids);
    private _getPendingLoadPromises(ids);
    private _getLoadedContributions(ids, queryOptions, contributionType, queryCallback?);
    private _fetchTargetingContributions(contributionId, results, includedContributionIds, queryCallback, contributionType);
    /**
     * Mark the given contribution ids as already queried-for so that additional gets
     * for these contributions don't issue a REST call.
     */
    private _registerLoadedContributionTargets(contributions);
    /**
     * Parse the extensions in the JSON island given by the selector
     * @param selector Selector to match a script tag containing JSON
     */
    private _processJsonIsland();
}
/**
* Delegate for web page data resolution plugins. Allows plugins to be notified when
* web page data with a certain key is received
*/
export interface WebPageDataResolutionPlugin {
    /**
    * @param key The key of the data
    * @param value The new value of the data
    * @param existingValue The existing value for the same entry before any data was received
    * @returns The value to store for this entry. undefined return value indicates to store the new value
    */
    (key: string, newValue: any, existingValue: any): any;
}
/**
* Service for obtaining web page data from contributed data providers
*/
export class WebPageDataService extends Service.VssService {
    private static _resolveDataPlugins;
    private _initializationPromise;
    private _localData;
    private _resolvedProviders;
    private _contributionPromises;
    private _ensureInitialized();
    private _handleDataProviderResult(result);
    private _mergeDataValueResult(key, originalResult, pluginResult, existingValue, allowPromise);
    /**
    * Add a plugin handler that gets called when data with the given key has been sent from the server
    *
    * @param dataKey The data provider key
    * @param handler Function called whenever data with the given key has been provided
    */
    static addResolutionPlugin(dataKey: string, handler: WebPageDataResolutionPlugin): void;
    /**
    * Remove the plugin handler that gets called when data with the given key
    *
    * @param dataKey The data provider key
    */
    static removeResolutionPlugin(dataKey: string): void;
    /**
    * Get web page data that was contributed from the given contribution
    *
    * @param key The data provider key
    * @param contractMetadata Optional contract metadata to use to deserialize the object
    */
    getPageData<T>(key: string, contractMetadata?: Serialization.ContractMetadata): T;
    /**
    * Ensure that all data providers have been resolved for all of the given data-provider contributions
    *
    * @param contributions The data provider contributions to resolve
    */
    ensureDataProvidersResolved(contributions: IExtensionContribution[]): IPromise<any>;
    private fetchPageDataForService(serviceInstanceId, contributionIds);
}
/**
 * Provides helper functions for extensions-related types.
 */
export class ExtensionHelper {
    private static _httpUrlRegex;
    private static _handlebarHelpersRegistered;
    private static _asyncReplacementIndicator;
    private static _asyncReplacementCounter;
    private static _asyncReplacementPromises;
    /**
    * Generate a full contribution id for the given contribution.
    *
    * @param contribution The contribution to get the id of
    */
    static getFullContributionId(contribution: IExtensionContribution): string;
    /**
    * Take a contribution id that may be relative or fully qualified. If fully qualified, just return the
    * id. If relative, form a fully qualified id by prepending the publisher id and extension id.
    *
    * @param id Relative or fully qualified contribution id
    * @param extension The extension to reference if the id is relative
    */
    static ensureFullContributionId(id: string, extension: Extension): string;
    /**
    * Is the contribution of the given contribution type
    *
    * @param contribution The contribution whose type to check
    * @param contributionType The full id of the contribution type to check for
    */
    static isContributionOfType(contribution: IExtensionContribution, contributionType: string): boolean;
    /**
    * Determine whether or not the given contribution is from a trusted extension and has internal content
    *
    * @param contribution The contribution whose properties to check
    */
    static hasInternalContent(contribution: IExtensionContribution): boolean;
    /**
    * Determine whether or not the given contribution provides hostable content
    *
    * @param contribution The contribution whose properties to check
    * @param uriProperty The property name which contains the content uri ("uri" by default)
    */
    static hasContent(contribution: IExtensionContribution, uriProperty?: string): boolean;
    private static _registerHandlebarHelpers(handlebars);
    private static resolveDefaultHostUri(webContext, hostContext);
    private static handleAsyncReplacements(value, asyncIndex, asyncStopIndex, deferred);
    /**
     * Processes a mustache template string with the given replacement object
     * @param string templateString The mustache template string
     * @param any replacementObject
     * @return string The template string with all replacements made
     */
    static resolveTemplateString(templateString: string, replacementObject: any): IPromise<string>;
    /**
     * Processes a URI template string with the given replacement object and base URI
     * @param string templateString The mustache template string
     * @param any replacementObject
     * @param string baseUri
     * @return string The template string with all replacements made
     */
    static resolveUriTemplate(templateString: string, replacementObject: any, baseUri: string): IPromise<string>;
    /**
     * Get an absolute URI for a given property on a contribution and a replacements object
     * @param
     */
    static resolveUriTemplateProperty(contribution: IExtensionContribution, replacementObject: any, propertyName?: string): IPromise<string>;
    /**
     * Given a path and a base URI, construct an absolute URI
     * @param string path
     * @param string baseUri
     * @return string
     */
    private static processUri(path, baseUri);
    /**
     * Publish tracing data for a given contribution
     * @param IExtensionContribution contribution
     * @param any data
     */
    static publishTraceData(contribution: IExtensionContribution, data?: string): void;
}
}
declare module "VSS/Controls" {
export function getId(): number;
export interface EnhancementOptions {
    earlyInitialize?: boolean;
    cssClass?: string;
    coreCssClass?: string;
    tagName?: string;
    width?: number | string;
    height?: number | string;
    title?: string;
    role?: string;
    id?: number | string;
    prepend?: boolean;
    change?: Function;
}
export class Enhancement<TOptions> {
    static ENHANCEMENTS_DATA_KEY: string;
    static ENHANCEMENT_OPTIONS_KEY: string;
    static ENHANCEMENT_OPTIONPREFIX_KEY: string;
    static optionsPrefix: string;
    private static enhancementList;
    private _id;
    private _typeName;
    private _eventNamespace;
    private _trackedElements;
    private _delayedFunctions;
    protected _enhancementOptions: EnhancementOptions;
    _options: TOptions;
    _initialized: boolean;
    _element: JQuery;
    _disposed: boolean;
    /**
     * @param options
     */
    constructor(options?: TOptions, enhancementOptions?: EnhancementOptions);
    /**
     * @param type
     * @return
     */
    static getTypeName(type?: any): string;
    /**
     * @return
     */
    static getOptionPrefix(type: any): string;
    /**
     * @param type
     * @param element
     */
    static getEnhancementOptions(type: any, element: any): any;
    /**
     * @param type
     * @param element
     * @param options
     * @return
     */
    static enhance<TOptions>(type: new (options: TOptions, enhancementOptions: EnhancementOptions) => Enhancement<TOptions>, element: Enhancement<any> | JQuery | Node | string, options?: ((element: JQuery) => TOptions) | TOptions, enhancementOptions?: EnhancementOptions): Enhancement<TOptions>;
    /**
     * @param type
     * @param element
     * @return
     */
    static getInstance(type?: any, element?: any): Enhancement<any>;
    static getInstanceO<TOptions>(type?: any, element?: any): Enhancement<TOptions>;
    /**
     * @param type
     * @param selector
     * @param options
     * @param errorCallback
     */
    static registerEnhancement<TOptions>(type?: {
        new (options: TOptions): Enhancement<TOptions>;
    }, selector?: string, options?: TOptions, errorCallback?: IErrorCallback, enhancementOptions?: EnhancementOptions): void;
    /**
     * @param type
     * @param context
     * @param errorCallback
     * @return
     */
    static ensureEnhancements(type?: any, context?: any, errorCallback?: any): Enhancement<any>[];
    /**
     * @param type
     * @param context
     * @param errorCallback
     * @return
     */
    static ensureEnhancement(type?: any, context?: any, errorCallback?: any): Enhancement<any>;
    /**
     * @param type
     * @param widgetName
     * @param widgetOptions
     */
    static registerJQueryWidget<TOptions>(type?: any, widgetName?: any, widgetOptions?: TOptions, enhancementOptions?: EnhancementOptions): void;
    /**
     * @return
     */
    protected _getUniqueId(): string;
    /**
     * @return
     */
    getId(): string;
    /**
     * @param id
     */
    protected _setId(id: string): void;
    /**
     * Sets options related to the creation of this control or enhancement of an element as this control.
     * Note: Options are merged.
     * @param EnhancementOptions
     */
    setEnhancementOptions(enhancementOptions: EnhancementOptions): void;
    /**
     * @return
     */
    getTypeName(): string;
    /**
     * @return
     */
    protected _getEventNameSpace(): string;
    getType(): Function;
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    initialize(): void;
    /**
     * @return
     */
    _ensureInitialized(): boolean;
    protected _attemptInitialize(): void;
    enhance($element: any): void;
    /**
     * @param element
     */
    protected _enhance(element: JQuery): void;
    /**
     * @param element
     */
    protected _setElement(element: JQuery): void;
    protected _setStyles(): void;
    /**
     * Gets the element associated with this control.
     *
     * @return
     */
    getElement(): JQuery;
    /**
     * @param element
     * @param eventType
     * @param args
     */
    _fire(element?: any, eventType?: any, args?: any): any;
    /**
     * @param element
     * @param eventType
     * @param handler
     * @param track
     */
    _bind(element?: any, eventType?: any, handler?: any, track?: any): Enhancement<TOptions>;
    /**
     * @param element
     * @param eventType
     * @param handler
     * @param track
     */
    _unbind(element?: any, eventType?: any, handler?: any, track?: any): Enhancement<TOptions>;
    /**
     * Executes the provided function after the specified amount of time
     *
     * @param name (Optional) Name for this operation. Allows subsequent calls to cancel this action.
     * @param msDelay Delay in milliseconds to wait before executing the Function
     * @param cancelPendingOps If true, cancel any pending requests with this name. If false, and there are outstanding requests with this name already in progress, then do nothing.
     * @param func Method to execute after the delay
     */
    delayExecute(name?: string, msDelay?: number, cancelPendingOps?: boolean, func?: Function): void;
    /**
     * Cancels any pending delayed functions (delayExecute calls) with the specified name
     *
     * @param name Name (supplied in the delayExecute call) of the operations to cancel
     * @return True if any operation was canceled. False if no operations with the specified name were in progress
     */
    cancelDelayedFunction(name: string): boolean;
    protected _cleanup(): void;
    protected _dispose(): void;
    dispose(): void;
    /**
     * @return
     */
    isDisposed(): boolean;
    protected _getEnhancementOption(key: string): any;
    private _trackElement(domElement);
    private _untrackElement(domElement);
}
/**
 * Creates a the control specified by TControl in the given container.
 * @typeparam TControl extends Control<TOptions> - a reference to the type of control to create. Should be the
 *            same type as the constructor function passed as the first parameter to this function. Note: TypeScript
 *            doesn't support the constraint of a type parameter referencing any other type parameter in the same
 *            list, but callers should ensure that TControl extends Control<TOptions>.
 * @typeparam TOptions - The type that is passed in as the options for this control. The instantiated control must
 *            an options parameter of this type.
 * @param controlType: new (options: TOptions) => TControl - the constructor function (ClassName) of this type.
 * @param container: JQuery - a JQuery element to place the control in.
 * @param controlOptions: TOptions - Options to pass in for this control. See the interface for the options type
 *        for more details.
 * @param enhancementOptions?: EnhancementOptions - Optional options for the control enhancement.
 * @return TControl - returns an instance of the controlType (first parameter), typed as a TControl (first type param).
 */
export function create<TControl extends Control<any>, TOptions>(controlType: new (options: TOptions) => TControl, container: JQuery, controlOptions: TOptions, enhancementOptions?: EnhancementOptions): TControl;
export class Control<TOptions> extends Enhancement<TOptions> {
    /**
     * Creates a the control specified by TControl in the given container.
     * @typeparam TControl extends Control<TOptions> - a reference to the type of control to create. Should be the
     *            same type as the constructor function passed as the first parameter to this function. Note: TypeScript
     *            doesn't support the constraint of a type parameter referencing any other type parameter in the same
     *            list, but callers should ensure that TControl extends Control<TOptions>.
     * @typeparam TOptions - The type that is passed in as the options for this control. The instantiated control must
     *            an options parameter of this type.
     * @param controlType: new (options: TOptions) => TControl - the constructor function (ClassName) of this type.
     * @param container: JQuery - a JQuery element to place the control in.
     * @param controlOptions: TOptions - Options to pass in for this control. See the interface for the options type
     *        for more details.
     * @param enhancementOptions?: EnhancementOptions - Optional options for the control enhancement.
     * @return TControl - returns an instance of the controlType (first parameter), typed as a TControl (first type param).
     */
    static create<TControl extends Control<any>, TOptions>(controlType: new (options: TOptions) => TControl, container: JQuery, controlOptions: TOptions, enhancementOptions?: EnhancementOptions): TControl;
    /**
     * @param type
     * @param container
     * @param options
     * @return
     */
    static createIn<TOptions>(type?: any, container?: any, options?: TOptions, koCompatable?: boolean): Control<any>;
    private _overlay;
    private _elementInDomPromise;
    /**
     * @param options
     */
    constructor(options?: TOptions);
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    /**
     * @return
     */
    _getUniqueId(): string;
    /**
     * @param id
     */
    _setId(id: string): void;
    dispose(): void;
    showElement(): void;
    hideElement(): void;
    enableElement(enabled: any): void;
    showBusyOverlay(): JQuery;
    hideBusyOverlay(): void;
    _createElement(): void;
    _initializeElement(): void;
    _setStyles(): void;
    createIn(container: JQuery): void;
    protected _createIn(container: JQuery): void;
    /**
     * Set Focus to the control
     */
    focus(): void;
    /**
     * Fires the change event for the control immediately
     *
     * @param sender Source element of the event
     */
    protected _fireChange(sender?: any): any;
    /**
    * Get a promise that is resolved once the containing element for this
    * control has been added to the DOM hierarchy.
    */
    protected _getInDomPromise(): IPromise<any>;
    private _waitForElementInDom(deferred);
}
export class BaseControl extends Control<any> {
}
export class BaseDataSource {
    private _source;
    private _items;
    private _allItems;
    _options: any;
    constructor(options?: any);
    setSource(source: any): void;
    getSource(): any;
    /**
     * @param source
     */
    prepareSource(source?: any): void;
    getComparer(): any;
    ensureItems(): void;
    /**
     * @param all
     */
    getItems(all?: any): any;
    /**
     * @param allItems
     */
    setItems(items: any, allItems?: any): void;
    /**
     * @param all
     */
    getCount(all?: any): any;
    /**
     * @param all
     */
    getItem(index: any, all?: any): any;
    /**
     * @param all
     * @param textOnly
     * @return
     */
    getItemText(index: any, all?: any, textOnly?: any): string;
    /**
     * @param startsWith
     * @param all
     */
    getItemIndex(itemText: any, startsWith?: any, all?: any): any;
    nextIndex(selectedIndex: any, delta: any, all: any): number;
}
}
declare module "VSS/Controls/AjaxPanel" {
import Panels = require("VSS/Controls/Panels");
export class AjaxPanel extends Panels.AjaxPanel {
    constructor(options?: any);
}
}
declare module "VSS/Controls/CheckboxList" {
import Controls = require("VSS/Controls");
/**
 * Recommended structure for an item in a CheckboxList control.
 * Not enforced - you may supply raw string items if preferred.
 */
export interface ICheckboxListItem {
    /**
     * The item's identifier or representative value.
     */
    value: any;
    /**
     * The item's display text. Ignored if 'content' is supplied.
     */
    text?: string;
    /**
     * Custom display element to render instead of 'text'.
     */
    content?: JQuery;
    /**
     * The item's tooltip.
     */
    title?: string;
    /**
     * Whether the item is checked.
     */
    checked: boolean;
    /**
     * Css class to be applied to this item.
     */
    cssClass?: string;
}
export interface ICheckboxListOptions extends Controls.EnhancementOptions {
    items?: ICheckboxListItem[];
    /**
     * Css class applied to all items.
     */
    itemCssClass?: string;
}
/**
 * Presents a list view of items, with checkboxes for each item.
 */
export class CheckboxListO<TOptions extends ICheckboxListOptions> extends Controls.Control<TOptions> {
    static enhancementTypeName: string;
    private _items;
    private _checkedItems;
    private _idMap;
    constructor(options?: any);
    /**
     * @param options
     */
    initializeOptions(options?: ICheckboxListOptions): void;
    initialize(): void;
    enableElement(enabled: boolean): void;
    setItems(items: any[]): void;
    getCheckedValues(): any[];
    getCheckedItems(): any[];
    getUncheckedValues(): any[];
    getUncheckedItems(): any[];
    setCheckedValues(values: any[]): void;
    _initializeElement(): void;
    private _checkItemState(item, state);
    private _draw();
    /**
     * @param e
     * @return
     */
    private _onCheckClick(e?);
}
export class CheckboxList extends CheckboxListO<ICheckboxListOptions> {
}
}
declare module "VSS/Controls/Combos" {
import Controls = require("VSS/Controls");
import Validation = require("VSS/Controls/Validation");
import Virtualization = require("VSS/Controls/Virtualization");
export class ListDataSource extends Controls.BaseDataSource {
}
export class BaseComboBehavior {
    combo: Combo;
    protected _options: any;
    protected _dataSource: Controls.BaseDataSource;
    private _onForceHideDropPopupDelegate;
    private _dropPopup;
    constructor(combo: any, options?: any);
    initialize(): void;
    dispose(): void;
    setMode(value: any): void;
    canType(): boolean;
    getValue<TValue>(): TValue;
    getDropPopup<TDropPopup extends BaseComboDropPopup>(): TDropPopup;
    getDataSource<TDataSource extends Controls.BaseDataSource>(): TDataSource;
    /**
     * @return
     */
    getDropOptions(): any;
    getDropWidth(): number;
    showDropPopup(): boolean;
    hideDropPopup(): boolean;
    toggleDropDown(): void;
    isDropVisible(): boolean;
    setSource(source: any): void;
    /**
     * @return
     */
    getSelectedIndex(): number;
    setSelectedIndex(selectedIndex: any, fireEvent: any): void;
    /**
     * @return
     */
    getText(): string;
    /**
     * @param value
     * @param fireEvent
     */
    setText(value: string, fireEvent?: boolean): void;
    /**
     * @param e
     * @return
     */
    upKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    downKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    pageUpKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    pageDownKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    leftKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    rightKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    keyDown(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    keyPress(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    keyUp(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    onForceHideDropPopup(e?: JQueryEventObject): any;
    private _attachGlobalEvents();
    private _detachGlobalEvents();
}
export interface IBaseComboDropPopup {
    getSelectedValue(): string;
    setSelectedValue(value: string): void;
    selectNext(page?: boolean): boolean;
    selectPrev(page?: boolean): boolean;
    dispose(): any;
}
export class BaseComboDropPopup extends Controls.BaseControl implements IBaseComboDropPopup {
    combo: Combo;
    constructor(options?: any);
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    setPosition(): void;
    getSelectedValue(): string;
    setSelectedValue(value: string): void;
    selectNext(page?: boolean): boolean;
    selectPrev(page?: boolean): boolean;
    dispose(): void;
    /**
     * @param e
     * @return
     */
    private _onMouseDown(e);
}
/**
 * @publicapi
 */
export interface IComboOptions {
    /**
     * Id added to the underlying input for accessibility.
     */
    id?: string;
    /**
     * Type of the combo. It can be 'list', 'date-time', 'multi-value', 'tree' or 'treeSearch'.
     * @defaultvalue "list"
     */
    type?: string;
    /**
     * Mode of the combo. It can be 'text' or 'drop'. Used by the combo of 'list' type. Determines whether to show drop icon or not.
     */
    mode?: string;
    /**
     * Sets the initial value for the combo.
     */
    value?: string;
    /**
     * Allows screen readers to read combo value. Should be used along with id.
     */
    label?: string;
    /**
     * Data source of the combo.
     */
    source?: any[];
    /**
     * Determines whether the combo is enabled or not.
     */
    enabled?: boolean;
    /**
     * Obsolete, this is not being used.
     */
    dropWidth?: string | number;
    /**
     * Specifies the max size when auto-expand drop bigger than combo
     */
    maxAutoExpandDropWidth?: number;
    /**
     * Specifies whether the combo can be edited or not. The difference from enabled is items in the dropdown can be selected.
     */
    allowEdit?: boolean;
    noDropButton?: boolean;
    validator?: any;
    /**
     * Extra css class applied to combo.
     */
    cssClass?: string;
    /**
     * Css class for drop icon.
     */
    iconCss?: string;
    /**
     * Css class for the input.
     */
    inputCss?: string;
    /**
     * Css class applied for invalid state.
     */
    invalidCss?: string;
    /**
     * Css class applied for disabled state.
     */
    disabledCss?: string;
    /**
     * Css class applied to drop button when hovered.
     */
    dropButtonHoverCss?: string;
    /**
     * Set to 'true' to disable selecting all text in the combobox when it gets focus from another app
     */
    disableTextSelectOnFocus?: boolean;
    /**
     * Called when the text of the combo changes.
     */
    change?: () => any;
    focus?: (e: JQueryEventObject) => any;
    blur?: (e: JQueryEventObject) => any;
    /**
     * Called when selected item changes. Argument is the index of the selected item.
     */
    indexChanged?: (index: number) => void;
    onKeyDown?: (e: JQueryEventObject) => any;
}
/**
 * @publicapi
 */
export class ComboO<TOptions extends IComboOptions> extends Controls.Control<TOptions> {
    static enhancementTypeName: string;
    static registerBehavior(behaviorMode: any, behaviorType: any): void;
    static attachBehavior(combo: any, options?: any): any;
    protected _input: JQuery;
    protected _currentText: string;
    protected _blockBlur: boolean;
    private _dropPopup;
    private _dropButton;
    private _behavior;
    private _onInputFocusInProgress;
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    _dispose(): void;
    _createIn(container: any): void;
    /**
     * @param element
     */
    _enhance(element: JQuery): void;
    initialize(): void;
    getBehavior<TBehavior extends BaseComboBehavior>(): TBehavior;
    /**
     * Gets the current text value of the combo.
    
     * @returns {string}
     * @publicapi
     */
    getText(): string;
    /**
     * Sets the text of the combo.
     *
     * @param text New value to set.
     * @param fireEvent Determines whether to fire change event or not (default false).
     * @publicapi
     */
    setText(text: string, fireEvent?: boolean): void;
    getDropButton(): JQuery;
    /**
     * Gets the input element of combo
     *
     * @return
     */
    getInput(): JQuery;
    getInputText(): string;
    setInputText(text: string, fireEvent?: boolean): void;
    /**
     * @return
     */
    getSelectedIndex(): number;
    setSelectedIndex(selectedIndex: number, fireEvent?: boolean): void;
    /**
     * Gets the underlying value of the combo. If the type is 'list', value is string. If the type is 'date-time', value is Date. If the type is 'multi-value', value is string[].
     *
     * @returns {<TValue>}
     * @publicapi
     */
    getValue<TValue>(): TValue;
    /**
     * @param newValue
     */
    fireChangeIfNecessary(newValue?: string): any;
    /**
     * Programmatically toggles the dropdown.
     * @publicapi
     */
    toggleDropDown(): void;
    /**
     * @param e
     * @return
     */
    showDropPopup(e?: JQueryEventObject): void;
    hideDropPopup(): any;
    isDropVisible(): boolean;
    isBlockingBlur(): boolean;
    blockBlur(): void;
    cancelBlockBlur(): void;
    /**
     * @param e
     * @return
     */
    _onInputKeyDown(e?: JQueryEventObject): any;
    setTextSelection(selectionStart: number): void;
    /**
     * Sets a new source for the combo.
     *
     * @param source New source for the combo.
     * @publicapi
     */
    setSource(source: any[] | Function): void;
    /**
     * Gets the enabled state of the combo.
     *
     * @returns {boolean}
     * @publicapi
     */
    getEnabled(): boolean;
    /**
     * Sets the enabled state of the combo.
     *
     * @param value True for enabled, false for disabled.
     * @publicapi
     */
    setEnabled(value: boolean): void;
    /**
     * Gets the mode of the combo.
     *
     * @returns {string}
     * @publicapi
     */
    getMode(): string;
    /**
     * Sets the mode of the combo.
     *
     * @param value 'drop' or 'text'.
     * @publicapi
     */
    setMode(value: string): void;
    /**
     * Sets the type of the combo.
     *
     * @param value 'list', 'date-time', 'multi-value', TreeView.ComboTreeBehaviorName or TreeView.SearchComboTreeBehaviorName.
     * @publicapi
     */
    setType(type: string): void;
    /**
     * Gets the type of the combo.
     *
     * @returns {string}
     * @publicapi
     */
    getComboType(): string;
    /**
     * Sets the invalid state of the combo.
     *
     * @param value True for invalid, false for valid.
     * @publicapi
     */
    setInvalid(value: boolean): void;
    private _ensureBehavior();
    private _decorate();
    private _updateStyles();
    /**
     * @param e
     * @return
     */
    private _onDropButtonClick(e?);
    /**
     * @param e
     * @return
     */
    private _onInputClick(e?);
    /**
     * @param e
     * @return
     */
    private _onInputFocus(e?);
    /**
     * @param e
     * @return
     */
    private _onInputBlur(e?);
    /**
     * @param e
     * @return
     */
    private _onMouseDown(e?);
    /**
     * @param e
     * @return
     */
    private _onInputKeyPress(e?);
    /**
     * @param e
     * @return
     */
    private _onInputKeyUp(e?);
}
export class Combo extends ComboO<IComboOptions> {
}
export class ComboListDropPopup extends BaseComboDropPopup {
    virtualizingListView: Virtualization.VirtualizingListView;
    protected _dataSource: Controls.BaseDataSource;
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    /**
     * @param page
     * @return
     */
    selectPrev(page?: boolean): boolean;
    /**
     * @param page
     * @return
     */
    selectNext(page?: boolean): boolean;
    /**
     * @return
     */
    getSelectedIndex(): number;
    getSelectedValue(): string;
    setSelectedValue(value: any): void;
    getDataSource<TDataSource extends Controls.BaseDataSource>(): TDataSource;
}
export class ComboListBehavior extends BaseComboBehavior {
    private _enableAutoFill;
    private _maxItemLength;
    constructor(combo: any, options?: any);
    initialize(): void;
    setSource(source: any): void;
    /**
     * @return
     */
    getDropOptions(): any;
    getValue<TValue>(): TValue;
    /**
     * Finds the max item length inside the data source
     */
    getMaxItemLength(): number;
    /**
     * Gets the drop width of this behavior
     */
    getDropWidth(): number;
    /**
     * @param value
     * @return
     */
    getSelectedIndex(value?: string, all?: any): number;
    setSelectedIndex(selectedIndex: number, fireEvent?: boolean): void;
    /**
     * @param value
     * @param fireEvent
     */
    setText(value: string, fireEvent?: boolean): void;
    /**
     * @param e
     * @return
     */
    upKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    downKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    pageUpKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    pageDownKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    keyDown(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    keyPress(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    keyUp(e?: JQueryEventObject): any;
    /**
     * @param page
     * @return
     */
    selectPrev(page?: boolean): boolean;
    /**
     * @param page
     * @return
     */
    selectNext(page?: boolean): any;
    _createDataSource(): Controls.BaseDataSource;
    _dropSelectionChanged(selectedIndex: any, accept: any): void;
    /**
     * Set selected index
     *
     * @param selectedIndex new selected index
     * @param fireEvent flag to whether to fire index changed
     */
    private _setSelectedIndex(selectedIndex, fireEvent?);
    private _tryAutoFill();
}
export class ComboControlValidator extends Validation.BaseValidator<Validation.BaseValidatorOptions> {
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    /**
     * @return
     */
    isValid(): boolean;
}
export interface IDateTimeComboOptions extends IComboOptions {
    dateTimeFormat?: string;
    defaultTimeOfDay?: number;
}
export class DatePanel extends Controls.BaseControl {
    private _date;
    private _selectedDate;
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    prevMonth(): void;
    nextMonth(): void;
    prevYear(): void;
    nextYear(): void;
    selectDate(date: Date): void;
    setSelectedDate(date: Date): void;
    getSelectedDate(): Date;
    private _draw(date, focusElementClass?);
    private _drawCalendarTable(date);
    /**
     * @param e
     * @return
     */
    private _onKeyDown(e?);
    /**
     * @param e
     * @return
     */
    private _onClick(e?);
}
export class ComboDateDropPopup extends BaseComboDropPopup {
    private _datePanel;
    private _selectedDate;
    initialize(): void;
    getSelectedDate(): Date;
    setSelectedDate(date: Date): void;
    /**
     * @param e
     * @return
     */
    private _onChange(e?);
}
export class ComboDateBehavior extends BaseComboBehavior {
    private _timeValue;
    constructor(combo: any, options?: any);
    initialize(): void;
    canType(): boolean;
    getValue(): Date;
    /**
     * @return
     */
    getDropOptions(): any;
    getDropWidth(): number;
    /**
     * Get's the current value as a date or null if there is no (valid) date.
     *
     * @return
     */
    getSelectedDate(): Date;
    /**
     * Sets a date value on the combo using the behavior's dateTime format
     *
     * @param selectedDate The date value to set
     */
    setSelectedDate(selectedDate: Date, fireChange?: boolean): void;
    /**
     * @param e
     * @return
     */
    upKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    downKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    pageUpKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    pageDownKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    leftKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    rightKey(e?: JQueryEventObject): any;
    private _onChange();
    private _getSelectedDate();
    private _addDays(date, days);
    private _getMonthLength(month, year);
}
export class DatePicker extends Combo {
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
}
export class ComboMultiValueDropPopup extends ComboListDropPopup {
    private _checkStates;
    constructor(options?: any);
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    getCheckedItems(): string[];
    getValue(): string;
    toggleCheckbox(selectedIndex: any): void;
    private _createItem(index);
    private _onItemClick(e?, itemIndex?, $target?, $li?);
}
export class ComboMultiValueBehavior extends ComboListBehavior {
    constructor(combo: any, options?: any);
    canType(): boolean;
    getValue(): string[];
    /**
     * @return
     */
    getDropOptions(): any;
    /**
     * @param e
     * @return
     */
    keyDown(e?: JQueryEventObject): any;
    private _onChange();
}
}
declare module "VSS/Controls/Dialogs" {
import Panels = require("VSS/Controls/Panels");
import Q = require("q");
/**
 * Prevents clicking diabled buttons which happens in Edge.
 * See Bug 380864: Inactive "OK" button is clickable on EDGE
 */
export function preventClickingDisabledButtons(dialogElement: JQuery, buttons: any): void;
/**
 * @publicapi
 */
export interface IDialogOptions extends Panels.IAjaxPanelOptions {
    /**
     * Content of the dialog. It can be either a jQuery selector or a jQuery object.
     */
    content?: string | JQuery;
    /**
     * Text to be displayed in the dialog as the content.
     */
    contentText?: string;
    /**
     * Title of the dialog.
     */
    title?: string;
    /**
     * Specifies where the dialog should be displayed when opened. This option is conveyed to underlying jQuery UI Dialog. See http://api.jqueryui.com/dialog/#option-position for more details.
     */
    position?: string;
    attachResize?: boolean;
    /**
     * Indicates whether the dialog is resizable or not.
     * @defaultvalue true
     */
    resizable?: boolean;
    /**
     * Delegate to be executed when the dialog is opened.
     */
    open?: (eventArgs: any) => any;
    /**
     * Delegate to be executed when the dialog is closed.
     */
    close?: (eventArgs: any) => any;
    defaultButton?: string;
    /**
     * Specifies which buttons should be displayed on the dialog. This option is conveyed to underlying jQuery UI Dialog. See http://api.jqueryui.com/dialog/#option-buttons for more details.
     */
    buttons?: any;
    /**
     * Specifies the jQuery selector for the default element to be focused initially.
     * @defaultvalue "First tabbable element"
     */
    initialFocusSelector?: string;
    /**
     * Indicates whether global progress indicator is enabled for the dialog or not.
     * @defaultvalue true
     */
    hasProgressElement?: boolean;
    /**
     * Specifies whether the dialog should be displayed when closed.
     * @defaultvalue true
     */
    disposeOnClose?: boolean;
    noFocusOnClose?: boolean;
    /**
     * Width of the dialog in px or %.
     * @defaultvalue 500
     */
    width?: number | string;
    /**
     * Height of the dialog in px or %.
     * @defaultvalue "auto"
     */
    height?: number | string;
    /**
     * An optional boolean to specify whether or not to use the Bowtie styling for this Dialog.
     * @privateapi
     */
    useBowtieStyle?: boolean;
    /**
     * An optional variable to specify the version of Bowtie styling for this Dialog.
     * Defaults to 1, but 2 should be used for the updated styling in TFS
     * @privateapi
     */
    bowtieVersion?: number;
    widthPct?: number;
    heightPct?: number;
    /**
     * Hide the X button.
     * @defaultValue "false"
     */
    hideCloseButton?: boolean;
}
/**
 * @publicapi
 */
export class DialogO<TOptions extends IDialogOptions> extends Panels.AjaxPanelO<TOptions> {
    static enhancementTypeName: string;
    static _dialogActionInProgress: boolean;
    /**
     *     This should be used in cases where you don't want the user to execute more than 1 particular action involving a Dialog
     *     in parallel. For example, clicking a link that does some server processing before opening a dialog. On slow connections
     *     the user may be able to click the link several times before the first dialog ever opens.
     *
     * @param actionDelegate
     *     The function to execute which will involve initializing a Dialog. It takes a single optional
     *     paramater which is a cancellation routine. Call this when you encounter a situation (such as an error)
     *     where you wish to cancel the operation and have subsequent dialog actions execute without being blocked.
     *
     */
    static beginExecuteDialogAction(actionDelegate: Function): void;
    static create(dialogType: any, options?: any): Dialog;
    private static _getNextDialogZIndex();
    static show(dialogType: any, options?: any): Dialog;
    private _title;
    private _progressElement;
    private _dialogResult;
    private _resizeDelegate;
    /**
     * Creates a new dialog with the provided options
     */
    constructor(options?: any);
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    onLoadCompleted(content: any): void;
    /**
     * Tries to set the focus using the specified or default selector
     */
    setInitialFocus(): void;
    /**
     * Sets focus on the first enabled input element in the dialog.
     *
     * @param field The field to set focus.
     */
    setFormFocusDelayed($field: any): void;
    /**
     * Sets a new title for the dialog.
     *
     * @param title New title value.
     * @publicapi
     */
    setTitle(title: string): void;
    /**
     * Gets the current title of the dialog.
     *
     * @returns {string}
     * @publicapi
     */
    getTitle(): string;
    /**
     * Gets the current dialog result which will be used when ok button is clicked.
     *
     * @returns {any}
     * @publicapi
     */
    getDialogResult(): any;
    /**
     * Sets the dialog result.
     *
     * @param dialogResult Result object used when ok button is clicked.
     * @publicapi
     */
    setDialogResult(dialogResult: any): void;
    /**
     * Shows the dialog.
     */
    show(): void;
    /**
     * @param e
     * @return
     */
    onOpen(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    onClose(e?: JQueryEventObject): any;
    /**
     * Closes the dialog.
     * @publicapi
     */
    close(): void;
    /**
     * @param e
     * @return
     */
    onDialogResize(e?: JQueryEventObject): any;
    private _updateTitle();
    /**
     * @param e
     * @return
     */
    private _onWindowResize(e?);
    /**
     * @param e
     * @return
     */
    private _onDialogResizing(e?, ui?);
}
export class Dialog extends DialogO<IDialogOptions> {
}
/**
 * @publicapi
 */
export interface IModalDialogOptions extends IDialogOptions {
    /**
     * Display text for ok button.
     * @defaultvalue "ok"
     */
    okText?: string;
    /**
     * Delegate executed when ok button is clicked and a dialog result is available.
     */
    okCallback?: Function;
    /**
     * Display text for cancel button.
     * @defaultvalue "cancel"
     */
    cancelText?: string;
    /**
     * Delegate executed when cancel button is clicked.
     */
    cancelCallback?: Function;
}
/**
 * @publicapi
 */
export class ModalDialogO<TOptions extends IModalDialogOptions> extends DialogO<TOptions> {
    static enhancementTypeName: string;
    static EVENT_BUTTON_STATUS_CHANGE: string;
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    initialize(): void;
    /**
     * Updates the enabled state of the ok button.
     *
     * @param enabled True if enabled, otherwise false.
     * @publicapi
     */
    updateOkButton(enabled: boolean): void;
    processResult(result: any): void;
    /**
     * @param e
     * @return
     */
    onOkClick(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    onResultReady(e?: JQueryEventObject, args?: any): any;
    /**
     * @param e
     * @return
     */
    onCancelClick(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    onButtonStatusChange(e?: JQueryEventObject, args?: any): any;
}
export class ModalDialog extends ModalDialogO<IModalDialogOptions> {
}
export interface IConfirmationDialogOptions extends IModalDialogOptions {
    successCallback: Function;
}
export class ConfirmationDialogO<TOptions extends IConfirmationDialogOptions> extends ModalDialogO<TOptions> {
    $errorContainer: JQuery;
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    _onSuccess(data: any): void;
    _onError(error: any): void;
    /**
     * @param e
     * @return
     */
    onOkClick(e?: JQueryEventObject): any;
}
export class ConfirmationDialog extends ConfirmationDialogO<IConfirmationDialogOptions> {
}
/**
 * Represents a button used in MessageDialog.
 *
 * Mirrored in VSS.SDK.Interfaces.
 */
export interface IMessageDialogButton {
    /**
     * Used as HTML id of the button.
     */
    id: string;
    /**
     * Text to display on the button.
     */
    text: string;
    /**
     * When true, the dialog's promise is rejected instead of resolved when this button is clicked.
     */
    reject?: boolean;
    /**
     * Specifies how the button should look.
     * Possible values:
     *   (undefined) - Default
     *   "warning" - Red
     */
    style?: string;
}
/**
 * Used by MessageDialogO.showDialog().
 *
 * Mirrored in VSS.SDK.Interfaces as IOpenMessageDialogOptions.
 */
export interface IShowMessageDialogOptions {
    /**
     * Array of buttons to show. Default is [Button.Ok, Button.Cancel]
     */
    buttons?: IMessageDialogButton[];
    /**
     * Button to use when the user presses the Esc key. Default is the last button.
     */
    escapeButton?: IMessageDialogButton;
    /**
     * If this is set, the user will be presented with a text box. Non-rejecting buttons will be disabled until the user types in this string.
     */
    requiredTypedConfirmation?: string;
    /**
     * Text for the title bar of the dialog.
     */
    title?: string;
    /**
     * Width of dialog in px.
     */
    width?: number;
    /**
     * Height of dialog in px.
     */
    height?: number;
    /**
     * Use Bowtie styling. Default is true.
     */
    useBowtieStyle?: boolean;
}
/**
 * Result returned when a MessageDialog is closed.
 *
 * Mirrored in VSS.SDK.Interfaces.
 */
export interface IMessageDialogResult {
    /**
     * Button that was clicked to dismiss the dialog.
     */
    button: IMessageDialogButton;
}
/**
 * Used internally by MessageDialogO.
 */
export interface IMessageDialogOptions extends IDialogOptions {
    buttons?: IMessageDialogButton[] | any;
    escapeButton?: IMessageDialogButton;
    requiredTypedConfirmation?: string;
}
/**
 * Class for creating simple dialog boxes. Use MessageDialog.showDialog().
 */
export class MessageDialogO<TOptions extends IMessageDialogOptions> extends DialogO<TOptions> {
    private _deferred;
    private _textbox;
    initializeOptions(options?: TOptions): void;
    initialize(): void;
    private initializeTypedConfirmation();
    /**
     * Returns a promise that is resolved or rejected when the dialog is closed.
     */
    getPromise(): Q.Promise<IMessageDialogResult>;
    /**
     * Show a MessageDialog.
     * @param message the message to display in the dialog. If it's a string, the message is displayed as plain text (no html). For HTML display, pass in a jQuery object.
     * @param methodOptions options affecting the dialog
     * @returns a promise that is resolved when the user accepts the dialog (Ok, Yes, any button with Button.reject===false), or rejected if the user does not (Cancel, No, any button with Button.reject===true).
     */
    static showMessageDialog(message: string | JQuery, methodOptions?: IShowMessageDialogOptions): Q.Promise<IMessageDialogResult>;
    onClose(e?: JQueryEventObject): any;
    /**
     * Returns an object suitable for initializing the given button for our parent Dialog.
     * @param button
     */
    private getButtonOptions(button);
    static buttons: {
        ok: IMessageDialogButton;
        cancel: IMessageDialogButton;
        yes: IMessageDialogButton;
        no: IMessageDialogButton;
    };
}
export class MessageDialog extends MessageDialogO<IMessageDialogOptions> {
}
export interface CopyContentDialogOptions extends IModalDialogOptions {
    dialogLabel?: string;
    dialogLabelExtend?: any;
    excludeTextPanel?: boolean;
    copyAsHtml?: boolean;
    data?: any;
    textAreaCopyClass?: string;
    pageHtml?: string;
}
export class CopyContentDialog extends ModalDialogO<CopyContentDialogOptions> {
    static enhancementTypeName: string;
    private _$textArea;
    constructor(options?: any);
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    /**
     * Initializes the dialog.
     */
    initialize(): void;
    /**
     * Initializes the dialog UI.
     */
    private _decorate();
    private _getDefaultLabelText();
    private _initializeRichEditor($container);
    /**
     * Initializes the text area panel
     *
     * @param $container The text area panel container.
     */
    private _initializeTextPanel($container);
}
/**
 * Shows the specified dialog type using specified options.
 *
 * @param dialogType Type of the dialog to show.
 * @param options Options of the dialog.
 * @returns {Dialog}.
 */
export function show<TDialog extends Dialog>(dialogType: new (options: any) => TDialog, options?: any): TDialog;
/**
 * Show a MessageDialog.
 * @param message the message to display in the dialog. If it's a string, the message is displayed as plain text (no html). For HTML display, pass in a jQuery object.
 * @param methodOptions options affecting the dialog
 * @returns a promise that is resolved when the user accepts the dialog (Ok, Yes, any button with Button.reject===false), or rejected if the user does not (Cancel, No, any button with Button.reject===true).
 */
export function showMessageDialog(message: string | JQuery, options?: IShowMessageDialogOptions): Q.Promise<IMessageDialogResult>;
}
declare module "VSS/Controls/EditableGrid" {
import Combos = require("VSS/Controls/Combos");
import Controls = require("VSS/Controls");
import Grids = require("VSS/Controls/Grids");
export class CellEditor extends Controls.BaseControl {
    constructor(options: any);
    initialize(): void;
    getValue(): string;
    getDisplayValue(): string;
    setValue(value: string, doNotSavePrevious?: boolean): void;
    clearValue(setEmpty?: boolean): void;
    setSize($cellContext: JQuery): void;
    dispose(): void;
    setPosition(top: number, left: number): void;
    getHeight(): number;
    focus(): void;
    fireEndEdit(e?: JQueryEventObject): void;
    beginEdit(initValue: string): void;
    _attachEvents(): void;
    _detachEvents(): void;
    _fireChangedIfNeeded(): void;
    _handleKeydown(e: JQueryEventObject): boolean;
    _insertNewLineAtCursor(): void;
    _setCaretPositionToEnd($element: JQuery): void;
    _decorateElement(): void;
    _resetPosition(): void;
    valueChanged: () => void;
    endEdit: (e?: JQueryEventObject) => void;
    _prevValue: string;
    private _inEditMode;
    private _initValue;
}
export class TextCellEditor extends CellEditor {
    initialize(): void;
    setPosition(top: number, left: number): void;
    getHeight(): number;
    focus(): void;
    _attachEvents(): void;
    _detachEvents(): void;
    _handleKeydown(e: JQueryEventObject): boolean;
    _resetPosition(): void;
    _editableArea: JQuery;
}
export class RichTextCellEditor extends TextCellEditor {
    getValue(): string;
    private _getLastHtmlTag($searchElem?);
    private _hasNonbreakingSpaceAtEnd($element);
    setValue(htmlString: string, doNotSavePrevious?: boolean): void;
    clearValue(setEmpty?: boolean): void;
    setSize($cellContext: JQuery): void;
    _insertNewLineAtCursor(): void;
    _attachEvents(): void;
    _detachEvents(): void;
    _createElement(): void;
    _decorateElement(): void;
    _handleKeydown(e: JQueryEventObject): boolean;
    _setCaretPositionToEnd($element: JQuery): void;
}
export class PlainTextCellEditor extends TextCellEditor {
    constructor(options: any);
    getValue(): string;
    setValue(value: string, doNotSavePrevious?: boolean): void;
    clearValue(setEmpty?: boolean): void;
    setSize($cellContext: JQuery): void;
    _createElement(): void;
    _attachEvents(): void;
    _detachEvents(): void;
    _setCaretPositionToEnd($element: JQuery): void;
}
export class ComboCellEditor extends CellEditor {
    private _comboControl;
    initialize(): void;
    _populateUINodes(node: any, uiNode: any): any;
    _updateEditControl(values: string[], controlType: string): void;
    getComboControl(): Combos.Combo;
    createIn(container: any): void;
    _attachEvents(): void;
    _detachEvents(): void;
    setSize($cellContext: JQuery): void;
    setPosition(top: number, left: number): void;
    getHeight(): number;
    focus(): void;
    _resetPosition(): void;
    getValue(): string;
    setValue(value: string, doNotSavePrevious?: boolean): void;
    clearValue(setEmpty?: boolean): void;
    _createElement(): void;
}
export class CellInfo {
    constructor(rowInfo: any, dataIndex: number, columnInfo: any, columnOrder: number);
    rowInfo: any;
    columnInfo: any;
    dataIndex: number;
    columnOrder: number;
}
export class RowHeightInfo {
    constructor(height: number);
    height: number;
    isInvalid: boolean;
}
export class EditableGrid extends Grids.GridO<any> {
    static Commands: {
        CMD_APPEND: string;
        CMD_CUT: string;
        CMD_COPY: string;
        CMD_PASTE: string;
        CMD_INSERT_ROW: string;
        CMD_DELETE_ROWS: string;
        CMD_CLEAR_ROWS: string;
        CMD_INSERT_COLUMNS: string;
        CMD_DELETE_COLUMNS: string;
        CMD_RENAME_COLUMN: string;
    };
    constructor(options?: any);
    initialize(): void;
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    getPinAndFocusElementForContextMenu(eventArgs: any): {
        pinElement: JQuery;
        focusElement: JQuery;
    };
    _getClickedColumnIndex(e?: JQueryEventObject): number;
    _shouldAttachContextMenuEvents(): boolean;
    onContextMenu(eventArgs: any): any;
    /**
     * gets context menu items list
     *
     * @return new list of context menu items
     */
    _getContextMenuItems(): any;
    _updateContextMenuCommandStates(menu: any): void;
    _onContextMenuItemClick(e?: any): void;
    _onInsertRow(selectedDataIndices: number[], selectedRowIndices: number[]): void;
    _onDeleteRows(selectedDataIndices: number[], selectedRowIndices: number[]): void;
    _onClearRows(selectedDataIndices: number[], selectedRowIndices: number[]): void;
    getSelectedRowIndices(): number[];
    _drawCell(rowInfo: any, dataIndex: number, expandedState: number, level: number, column: any, indentIndex: number, columnOrder: number): any;
    onHyperLinkClick(dataIndex: number, columnIndex: string): void;
    onBeginCellEdit(dataIndex: number, columnIndex: string): void;
    onEndCellEdit(dataIndex: number, columnIndex: string, newValue: string, ignoreValueChange?: boolean): void;
    canEditCell(dataIndex: number, columnIndex: string): boolean;
    onCellChanged(dataIndex: number, columnIndex: string, newValue: string): void;
    _appendRow(): void;
    _applyColumnSizing(columnIndex: number, initialWidth?: number, finish?: boolean): void;
    _invalidateRowHeights(): void;
    ensureRowSelectionWhenLayoutComplete(command: any, indicesToSelect?: number[]): void;
    private _focusGrid();
    whenLayoutComplete(command: any, indicesToSelect?: number[]): void;
    private _setSelection(indicesToSelect);
    private _validateIndicesToSelect(indicesToSelect);
    onLayoutComplete(command: any, indicesToSelect?: number[]): void;
    _getRowHeightInfo(dataIndex: number): RowHeightInfo;
    _setRowHeight(dataIndex: number, height: number): void;
    private _setCellValue($cell, value, isRichText, title?);
    _setColumnInfo(column: any, index: number): void;
    getCellEditorForColumn(index: any): CellEditor;
    getCurrentEditRowIndex(): number;
    layout(): void;
    private _layoutInternal();
    _getSelectedCellInfo(): CellInfo;
    _onContainerMouseDown(e?: any): void;
    private _setCellEditor($currentCell, clearExisting);
    _handleEditorEndEdit(e?: JQueryEventObject, $currentCell?: JQuery): void;
    private _handleEndEdit($currentCell, ignoreValueChange?);
    private _allowCellResize($row);
    private _resizeCellsInRowToHeight($row, dataIndex);
    _onKeyDown(e?: JQueryEventObject): any;
    _createFocusElement(): JQuery;
    private _selectCellForSelectedRowIndex(delayEdit?);
    private _getCellForRow($row, columnIndex);
    _onUpKey(e?: JQueryEventObject, bounds?: any): void;
    _onDownKey(e?: JQueryEventObject, bounds?: any): void;
    _onRightKey(e?: JQueryEventObject): void;
    _onLeftKey(e?: JQueryEventObject): void;
    _selectNextOrPrevCell(next: boolean, doNotGetCellIntoView?: boolean): boolean;
    _getRowsPerPage(e?: JQueryEventObject): number;
    _onPageUpPageDownKey(e?: JQueryEventObject, bounds?: any): void;
    _onHomeKey(e?: JQueryEventObject, bounds?: any): void;
    _onEndKey(e?: JQueryEventObject, bounds?: any): void;
    _handleCellSelectionAfterViewPortUpdate(): void;
    handleHeaderSelectionAfterViewPortUpdate(): void;
    _onEnterKey(e?: JQueryEventObject, bounds?: any): any;
    _isHyperLinkCell(cellInfo: CellInfo): boolean;
    _onBackSpaceKey(e?: JQueryEventObject): void;
    _onDeleteKey(e?: JQueryEventObject): any;
    _onTabKey(e?: JQueryEventObject): void;
    cacheRows(aboveRange: any, visibleRange: any, belowRange: any): void;
    _drawRows(visibleRange: any, includeNonDirtyRows: any): void;
    setHeightForLowerContentSpacer(height: number): void;
    setHeightForUpperContentSpacer(height: number): void;
    _includeNewlyInsertedRowsInViewport(affectedIndices: number[]): void;
    _adjustContentSpacerHeightsPostDelete(): void;
    private _calculateHeightForUpperContentSpacer(firstVisibleIndex, firstVisibleIndexTop);
    private _calculateHeightForLowerContentSpacer(lastVisibleIndex, lastVisibleIndexTop, totalHeight);
    _getOuterRowHeight(index: number): number;
    protected _addSpacingElements(): void;
    getSelectedCellIntoView(): boolean;
    _getVisibleRowIndices(): {
        first: number;
        last: number;
    };
    _getVisibleRowIndicesAndDoCalculations(): {
        first: number;
        last: number;
    };
    _layoutContentSpacer(): void;
    _onCanvasScroll(e?: any): boolean;
    private _onScroll(e?);
    _onLastRowVisible(rowIndex: number): void;
    private _isScrolledIntoView($elem);
    _tryFinishColumnSizing(cancel: any): void;
    _onContainerResize(e?: JQueryEventObject): any;
    _selectRowAndCell($cell: JQuery, doNotGetCellIntoView?: boolean): void;
    getSelectedCell(): JQuery;
    selectSameRowNthCell(n: number, doNotGetCellIntoView?: boolean): boolean;
    _selectNextRowNthCell(n: number, doNotGetCellIntoView?: boolean): boolean;
    _selectPrevRowLastCell(doNotGetCellIntoView?: boolean): boolean;
    _selectNextRowFirstCell(doNotGetCellIntoView?: boolean): boolean;
    private _areEqual($cell1, $cell2);
    _onKeyPress(e?: JQueryEventObject): any;
    private _isChar(e?);
    _onRowDoubleClick(e?: JQueryEventObject): any;
    _cleanUpGrid(): void;
    private _deleteEditors();
    _editCell($cell: JQuery, delayEdit: boolean, clearExisting: boolean, charCode?: number): void;
    private _editCellInternal($cell, cellInfo, clearExisting, charCode?);
    _canEdit(cellInfo: CellInfo): boolean;
    _onRowMouseDown(e?: JQueryEventObject): any;
    _onRowClick(e?: JQueryEventObject): any;
    private _getRowFromCell($cell);
    private _getRowFromEvent(e?, selector?);
    private _areCellInfoEqual(cellInfo1, cellInfo2);
    onCellSelectionChanged($cell?: JQuery, delayEdit?: boolean): void;
    private _selectCell($cell, doNotBringRowToView?, doNotFireEndEdit?, doNotBringCellIntoView?, delayEdit?, preventEdit?);
    private _getCellFromEvent(e?, selector?);
    private _getCellInfoFromEvent(e?, selector?);
    _updateViewport(includeNonDirtyRows?: boolean): void;
    postUpdateViewPort(): void;
    _ensureRowDrawn(dataIndex: any): boolean;
    /**
     * @param rowIndex
     * @param force
     * @return
     */
    _getRowIntoView(rowIndex: number, force?: boolean): boolean;
    private _getRowHeightBetweenRows(startIndex, endIndex);
    private _scrollCanvasUp(startIndex, endIndex);
    private _scrollCanvasDown(startIndex, endIndex);
    updateRows(indices?: number[]): void;
    _updateRow(rowInfo: any, rowIndex: number, dataIndex: number, expandedState: any, level: number, columnsToUpdate?: {
        [id: number]: boolean;
    }, forceUpdateHeight?: boolean): void;
    _updateRowStyle(rowInfo: any): void;
    private _isCellEmpty($cell);
    private _getEmptyRowOuterHeight(dataIndex, $row);
    _updateRowAndCellHeights(dataIndex: number, $row: JQuery, forceUpdate?: boolean): void;
    _clearSelections(): void;
    _fireEndEdit(): void;
    _rowHeightsDifferencePostDelete: number;
    _emptyRowOuterHeight: number;
    _gettingRowIntoView: boolean;
    _inEditMode: boolean;
    _lastVisibleRange: any;
    private _currentCellEditor;
    private _editRowIndex;
    private _heightForUpperContentSpacer;
    private _heightForLowerContentSpacer;
    private _rowMaxHeight;
    private _$selectedCell;
    private _selectedCellInfo;
    private _columnIndexToEditorMap;
    private _columnResizeInProgress;
    private _gridRowHolder;
    private _belowContentSpacer;
    private _isLayoutInProgress;
    private _borderHeight;
    private _selectCellOnLayoutComplete;
}
}
declare module "VSS/Controls/ExternalHub" {
import Controls = require("VSS/Controls");
export class ExternalHub extends Controls.BaseControl {
    private static PROGRESS_LOAD_DELAY;
    initialize(): void;
    private createHost(contribution);
    private beginGetHubContentUri(contribution);
}
}
declare module "VSS/Controls/FileInput" {
import Controls = require("VSS/Controls");
import Utils_File = require("VSS/Utils/File");
/**
* Options for the file input control.
*/
export interface FileInputControlOptions {
    initialFiles?: FileList;
    maximumNumberOfFiles?: number;
    maximumTotalFileSize?: number;
    maximumSingleFileSize?: number;
    detectEncoding?: boolean;
    fileNamesCaseSensitive?: boolean;
    resultContentType?: FileInputControlContentType;
    updateHandler: (updateEvent: FileInputControlUpdateEventData) => void;
}
/**
* File result from files uploaded to the FileInputControl.
*/
export interface FileInputControlResult {
    name: string;
    type: string;
    size: number;
    lastModifiedDate: Date;
    content?: string;
    encoding?: Utils_File.FileEncoding;
}
export enum FileInputControlContentType {
    Base64EncodedText = 0,
    RawText = 1,
}
/**
* Event data passed to FileInputControl update events.
*/
export interface FileInputControlUpdateEventData {
    loading: boolean;
    files: FileInputControlResult[];
}
/**
* Information about a row in the file input control
*/
export interface FileInputControlRow {
    $listElement: JQuery;
    $statusElement: JQuery;
    $fileNameElement: JQuery;
    result: FileInputControlResult;
}
/**
* HTML5 based file input control which accepts one or multiple files with
* browse and drag/drop support. Reads content as a base64 encoded string.
*/
export class FileInputControl extends Controls.Control<FileInputControlOptions> {
    private _$fileInputContainer;
    private _$fileList;
    private _inputOptions;
    private _results;
    private _pendingResults;
    private _rows;
    private _$overallStatusContainer;
    private _$overallStatusText;
    private _$errorMessageContainer;
    static createControl($container: JQuery, options: FileInputControlOptions): FileInputControl;
    /**
    * Is this control supported on the current browser? Requires HTML5 FileReader support which
    * is present on all supported browsers except IE9.
    */
    static isSupported(): boolean;
    initializeOptions(options?: any): void;
    initialize(): void;
    private _triggerUpdateEvent();
    private _updateOverallStatus();
    private _getTotalFilesSize();
    private _addFiles(files);
    private _addFile(file);
    private _getFriendlySizeString(numBytes, decimalPlaces?);
    private _clearError();
    private _displayError(errorText);
    getFiles(): FileInputControlResult[];
    isLoadInProgress(): boolean;
    getRows(): FileInputControlRow[];
    /**
    * Clear all files in the list.
    */
    clear(): void;
}
export interface FileDropTargetOptions {
    filesDroppedCallback: (fileList: FileList) => any;
    dragEnterCallback?: (e: JQueryEventObject) => boolean;
    dragLeaveCallback?: (e: JQueryEventObject) => boolean;
    dragOverCssClass?: string;
}
export class FileDropTarget extends Controls.Enhancement<FileDropTargetOptions> {
    static makeDropTarget($element: JQuery, options: FileDropTargetOptions): FileDropTarget;
    private _dropTargetOptions;
    private _dragEventDelegate;
    private _dragLeaveEventDelegate;
    private _dropEventDelegate;
    private _dragOverClassName;
    _enhance($element: JQuery): void;
    _dispose(): void;
    private _handleDragEvent(e);
    private _handleDragLeaveEvent(e);
    private _handleDropEvent(e);
}
}
declare module "VSS/Controls/Filters" {
import Controls = require("VSS/Controls");
export interface IFilterControlOptions extends Controls.EnhancementOptions {
    enableGrouping?: boolean;
    enableRowAddRemove?: boolean;
    hideLogicalOperator?: boolean;
    hideOperatorHeader?: boolean;
    propogateControlBlur?: boolean;
}
export class FilterControlO<TOptions extends IFilterControlOptions> extends Controls.Control<TOptions> {
    static enhancementTypeName: string;
    private _clauseTable;
    private _groupHeaderCell;
    private _filter;
    constructor(options?: any);
    /**
     * Get the default clause for this filter.
     */
    _getDefaultClause(): void;
    /**
     * Update the and/or dropdown based on the given clause
     *
     * @param andOrControl The control to be updated.
     * @param clause The clause associated with the control.
     */
    _updateAndOrControl(andOrControl: any, clause: any): void;
    /**
     * Update the field dropdown based on the given clause
     *
     * @param fieldControl The control to be updated.
     * @param clause The clause associated with the control.
     */
    _updateFieldControl(fieldControl: any, clause: any): void;
    /**
     * Update the operator dropdown based on the given clause
     *
     * @param operatorControl The control to be updated.
     * @param clause The clause associated with the control.
     * @param updateClause True to update the clause with the new operator/value.
     */
    _updateOperatorControl(operatorControl: any, clause: any, updateClause?: boolean): void;
    /**
     * Update the value dropdown based on the given clause
     *
     * @param valueControl The control to be updated.
     * @param clause The clause associated with the control.
     */
    _updateValueControl(valueControl: any, clause: any): void;
    /**
     * Validate the given clause.
     *
     * @param clauseInfo The clause info.
     */
    _validateClause(clauseInfo: any): void;
    /**
     * Handler called when the field name control's value is changed.
     *
     * @param clauseInfo The clause info.
     * @param oldValue The old field name.
     */
    _handleFieldNameChanged(clauseInfo: any, oldValue: string): void;
    /**
     * Handler called when the operator control's value is changed.
     *
     * @param clauseInfo The clause info.
     * @param oldValue The old operator value.
     */
    _handleOperatorChanged(clauseInfo: any, oldValue: string): void;
    /**
     * Mark this filter as dirty.
     */
    _setDirty(): void;
    /**
     * @param options
     */
    initializeOptions(options?: IFilterControlOptions): void;
    setFilter(filter: any): void;
    private _createClauseTable();
    private _createHeaderRow();
    _getInsertClauseTooltipText(): string;
    _getRemoveClauseTooltipText(): string;
    private _createClauseRow(clause);
    createClauseValueControl(container: JQuery, options?: any): any;
    /**
     * Gets the string to be displayed in place of "add new clause" hyperlink.
     */
    _getAddNewClauseText(): string;
    private _createAddClauseRow();
    private _onClauseChange(change, clauseInfo);
    getClauseValue(valueControl: any, clause: any): string;
    /**
     * @param e
     * @return
     */
    private _addClauseClick(e?, clauseInfo?);
    /**
     * @param e
     * @return
     */
    private _removeClauseClick(e?, clauseInfo?);
    private _updateGroupLink();
    private _groupSelectedClauses();
    /**
     * @param e
     * @return
     */
    private _ungroupClick(e?, clauseInfo?);
    private _handleFilterModified();
    private _onControlBlurred();
}
export class FilterControl extends FilterControlO<IFilterControlOptions> {
}
}
declare module "VSS/Controls/FormInput" {
import Combos = require("VSS/Controls/Combos");
import Controls = require("VSS/Controls");
import FormInput_Contracts = require("VSS/Common/Contracts/FormInput");
/**
* Options for the file input control.
*/
export interface FormInputControlOptions {
    inputsViewModel: InputsViewModel;
    headerLabel: string;
    comboControlMap: {
        [key: string]: Combos.Combo;
    };
}
export interface ExtendedInputDescriptor extends FormInput_Contracts.InputDescriptor {
    /**
     * A list of functions to be called when this input is deleted.
     */
    deleteCallbacks: (() => void)[];
    /**
     * A list of functions, all of which must return true for this input to be considered valid
     */
    dependencies: InputViewModelDelegate<boolean>[];
    /**
     * A list of functions to be called when the state of all dependencies of this input being satisfied changes.
     */
    dependenciesSatisfiedCallbacks: ((satisfied: boolean) => void)[];
    /**
     * Gets whether this input should be invisible until all of its dependencies are satisfied or not.
     */
    hideUntilSatisfied: boolean;
    /**
     * Gets whether this input is deletable.
     */
    isDeletable: boolean;
    /**
     * Gets whether this input should be invalidated when one of its dependency's value changes or not.
     * Odd name is due to the fact that the default should be to invalidate (based on FormInput_Contracts.InputDescriptor).
     */
    noInvalidateOnDependencyChange: boolean;
    /**
     * Gets whether or not to display the valid icon for this input.
     */
    noValidIcon: boolean;
    /**
     * Information to use to validate this input's value
     */
    validation: ExtendedInputValidation;
    /**
     * A list of functions to be called when the value of this input is changed.
     */
    valueChangedCallbacks: InputViewModelDelegate<void>[];
}
export interface ExtendedInputValidation extends FormInput_Contracts.InputValidation {
    /**
     * A function called when checking input validity. Validation.isValid must be true for the input to be considered valid.
     */
    validateFunction: InputViewModelDelegate<Validation>;
}
export interface Validation {
    /**
     * True if input is valid, false otherwise.
     */
    isValid: boolean;
    /**
     * Error message if input is not valid
     */
    error: string;
}
export interface InputGroup {
    $header: JQuery;
    $table: JQuery;
    memberCount: number;
}
export interface InputViewModelDelegate<T> {
    (inputViewModel: InputViewModel): T;
}
export class FormInputControl extends Controls.Control<FormInputControlOptions> {
    private _$inputsContainer;
    private _headerLabel;
    private _comboControlMap;
    private _inputGroups;
    private _$inputIdToElements;
    private _inputsViewModel;
    static createControl($container: JQuery, options: FormInputControlOptions): FormInputControl;
    initializeOptions(options?: any): void;
    initialize(): void;
    deleteControl(): void;
    private _createGroup(headerLabel);
    addInputViewModel(inputViewModel: InputViewModel): void;
    removeInputViewModel(inputViewModel: InputViewModel, removeFromInputsViewModel?: boolean): void;
    showInputViewModel(inputViewModel: InputViewModel): void;
    hideInputViewModel(inputViewModel: InputViewModel): void;
    private _showHideInputViewModel(inputViewModel, show);
    private _createDeleteButton(inputViewModel);
    getGroupHeader(groupName?: string): JQuery;
    getInputFieldById(id: string): JQuery;
    createRowBeforeInput(id: string): JQuery;
    createRowAfterInput(id: string): JQuery;
    private _createInputField(inputViewModel, $parent, comboControlMap);
    private _textInputValueChanged(combo, inputViewModel);
    private _radioInputValueChanged($radio, radioValue, inputViewModel);
    private static _fixLinkTargets(element);
    static getProgressIconForInput(inputId: string): JQuery;
    static getValidationIconForInput(inputId: string): JQuery;
}
export class FormInputViewModel {
    protected _inputsViewModels: {
        [key: string]: InputsViewModel;
    };
    protected _dependentInputsLoadingCallback: any;
    protected _dependentInputsLoadedCallback: any;
    protected _inputValidChangedCallback: any;
    protected _inputValuesChangedCallback: any;
    protected _queryForValuesCallback: any;
    protected _isDirty: boolean;
    mapInputIdToComboControl: {
        [key: string]: Combos.Combo;
    };
    constructor(dependentInputsLoadingCallback: any, dependentInputsLoadedCallback: any, inputValidChangedCallback: any, inputValuesChangedCallback: any, queryForValuesCallback?: any);
    addInputsViewModel(key: string, inputsViewModel: InputsViewModel): void;
    isDirty(): boolean;
    inputsAreValid(inputsKey: string): boolean;
    queryInputValues(inputsViewModel: InputsViewModel, inputsToQuery: InputViewModel[], callback: any, callbackContext: any): void;
    onInputValuesChanged(inputViewModel: InputViewModel): void;
    protected _beginQueryForValues(inputValues: FormInput_Contracts.InputValues[], inputsViewModel: InputsViewModel): IPromise<FormInput_Contracts.InputValue[]>;
    protected _showOrHideProgressIndicator(inputId: string, show: boolean): void;
}
export class InputsViewModel {
    private _inputViewModels;
    private _mapNameToInputViewModel;
    private _mapNameDependencyCount;
    protected _satisfiedDependentInputs: InputViewModel[];
    private _valuesChangedCallback;
    private _formInputViewModel;
    constructor(formInputViewModel: FormInputViewModel, inputDescriptors: FormInput_Contracts.InputDescriptor[], inputValues: {
        [key: string]: any;
    }, inputValidChangedCallback: InputViewModelDelegate<void>, valuesChangedCallback: InputViewModelDelegate<void>);
    addInputViewModel(inputDescriptor: ExtendedInputDescriptor, inputValue?: any, inputValidChangedCallback?: InputViewModelDelegate<void>, valuesChangedCallback?: InputViewModelDelegate<void>): InputViewModel;
    removeInputViewModel(inputViewModel: InputViewModel): void;
    areDirty(): boolean;
    areValid(): boolean;
    getInputViewModels(): InputViewModel[];
    getInputViewModelById(id: string): InputViewModel;
    getInputsAsDictionary(): {
        [inputId: string]: any;
    };
    allDependentsSatisfied(inputViewModel: InputViewModel): boolean;
    private _invalidateDependencies(changedInputViewModel);
    private _updateDependencies(changedInputViewModel);
    protected _querySatisfiedDependentInputValues(): void;
    private _isADependent(inputViewModel);
    private _onValueChanged(inputViewModel);
    private _onBlur(inputViewModel);
}
export class InputViewModel {
    private _inputDescriptor;
    private _validation;
    private _value;
    private _selectedIndex;
    private _isValid;
    private _isDirty;
    private _dependenciesSatisfied;
    private _validationError;
    private _dependencies;
    private _validityDelegate;
    private _validityFollowers;
    private _blurCallback;
    private _inputValidChangedCallback;
    private _valueChangedCallbacks;
    private _valuesChangedCallback;
    private _dependenciesSatisfiedCallbacks;
    private _deleteCallbacks;
    private _suppressValidityChangeNotifications;
    constructor(inputDescriptor: FormInput_Contracts.InputDescriptor, inputValue: any, inputValidChangedCallback: InputViewModelDelegate<void>, blurCallback: InputViewModelDelegate<void>, valueChangedCallbacks: InputViewModelDelegate<void>[], valuesChangedCallback: InputViewModelDelegate<void>, dependencies?: InputViewModelDelegate<boolean>[], dependenciesSatisfiedCallbacks?: ((satisfied: boolean) => void)[], deleteCallbacks?: (() => void)[]);
    private _addFunctions(functions, adder);
    validate(): void;
    isDirty(): boolean;
    isValid(): boolean;
    isRequired(): boolean;
    isEmpty(): boolean;
    isDropList(): boolean;
    getId(): string;
    getValue(): any;
    getValidationMessage(): string;
    getSelectedIndex(): number;
    setSelectedIndex(index: number): void;
    getInputDescriptor(): ExtendedInputDescriptor;
    getPossibleValueAtIndex(index: number): FormInput_Contracts.InputValue;
    setValue(value: any): void;
    refresh(): void;
    dependsOn(inputValueId: string): boolean;
    invalidateValues(): void;
    invalidateOnDependencyChange(): boolean;
    updateValues(values: FormInput_Contracts.InputValues): void;
    onBlur(): void;
    setStateIcon(): void;
    suppressValidityChangeNotifications(suppress: boolean): void;
    addValueChangedCallback(callback: InputViewModelDelegate<void>, addToFront?: boolean): void;
    removeValueChangedCallback(callback: InputViewModelDelegate<void>): boolean;
    setValidityDelegate(validityDelegate: InputViewModel): void;
    addValidityFollower(follower: InputViewModel, addToFront?: boolean): void;
    removeValidityFollower(follower: InputViewModel): void;
    addDependency(dependency: InputViewModelDelegate<boolean>, addToFront?: boolean): void;
    checkDependenciesSatisfied(): boolean;
    getDependenciesSatisfied(): boolean;
    private _dependenciesSatisfiedChange(satisfied);
    inputDependenciesSatisfied(satisfied: boolean): boolean;
    addDependenciesSatisfiedCallback(callback: (satisfied: boolean) => void, addToFront?: boolean): void;
    deleteViewModel(): void;
    addDeleteCallback(callback: () => void, addToFront?: boolean): void;
    private _invalidateValue();
    private _setValue(value, force);
    private _computeSelectedIndex();
    private _setDirty(isDirty);
    private _setValid(isValid, error?);
    private _getDefaultIndex();
    private _getSelectedIndex();
    private _getDefaultValue();
    private _validate();
    private _validateBoolean();
    private _validateGuid();
    private _validateNumber();
    private _validateString();
    private _validateUri();
}
}
declare module "VSS/Controls/Grids" {
import Controls = require("VSS/Controls");
import Menus = require("VSS/Controls/Menus");
import Search = require("VSS/Search");
/**
 * @publicapi
 */
export interface IGridOptions {
    /**
     * Data source of the grid. It can be array of arrays ([[], [], [], ...]),  array of objects ([{}, {}, {}, ...])
     * @defaultvalue "[]"
     */
    source?: any;
    /**
     * Specifies the expand states of each item in the source. If an item has a total of n descendants; -n makes the item collapsed, n makes the item expanded, 0 means no children and descendants.
     */
    expandStates?: number[];
    /**
     * Determines whether the header is displayed or not
     * @defaultvalue true
     */
    header?: boolean;
    /**
     * Height of the grid in px or %
     */
    height?: string;
    /**
     * Width of the grid in px or %
     */
    width?: string;
    /**
     * Determines whether multiple selection is allowed or not
     * @defaultvalue true
     */
    allowMultiSelect?: boolean;
    /**
     * Determines whether moving columns is allowed or not
     * @defaultvalue true
     */
    allowMoveColumns?: boolean;
    /**
     * Determines whether selecting text is allowed or not
     * @defaultvalue false
     */
    allowTextSelection?: boolean;
    /**
     * Determines whether the last cell should fill remaining content (if exists)
     * @defaultvalue false
     */
    lastCellFillsRemainingContent?: boolean;
    /**
     * List of columns to be displayed in the grid
     * @defaultvalue "[]"
     */
    columns?: IGridColumn[];
    /**
     * Options about the gutter. If specified false, gutter will be invisible
     * @defaultvalue false
     */
    gutter?: IGridGutterOptions;
    /**
     * Options about the context menu displayed when gutter clicked
     */
    contextMenu?: IGridContextMenu;
    /**
     * Initial sort info for the grid
     * @defaultvalue "[]"
     */
    sortOrder?: IGridSortOrder[];
    /**
     * Specifies whether grid should be sorted initially using the sortOrder option
     * @defaultvalue true
     */
    autoSort?: boolean;
    asyncInit?: boolean;
    initialSelection?: boolean;
    sharedMeasurements?: boolean;
    payloadSize?: number;
    extendViewportBy?: number;
    coreCssClass?: string;
    draggable?: any;
    droppable?: any;
    sort?: Function;
    enabledEvents?: any;
    openRowDetail?: any;
    suppressRedraw?: boolean;
    keepSelection?: boolean;
    /**
     * Specifies whether to use the modern bowtie styling (bowtie styles are in preview and subject to change).
     * @defaultvalue false
     */
    useBowtieStyle?: boolean;
    /**
     * @privateapi
     * Type of the formatter which is used for retrieving the content from the grid
     * Used in beginTableFormat, called when triggering a copy action
     */
    formatterType?: new (grid: GridO<any>, options?: any) => ITableFormatter;
}
export interface IGridContextMenu {
    /**
     * Menu items to be shown when gutter clicked. Value can be a list of menu items or a function which returns an a list of menu items
     */
    items?: any;
    /**
     * Execute action for the popup menu
     */
    executeAction?: (args: any) => any;
    contributionIds?: string[];
    /**
     * Specifies whether to use the modern bowtie styling (bowtie styles are in preview and subject to change).
     * @defaultvalue false
     */
    useBowtieStyle?: boolean;
    /**
     * Column index for the context menu, if using bowtie styling
     */
    columnIndex?: number | string;
}
export interface IGridGutterOptions {
    /**
     * Determines whether a context menu is show in the gutter or not
     * @defaultValue false
     */
    contextMenu?: boolean;
    checkbox?: boolean;
    icon?: IGridGutterIconOptions;
}
export interface IGridGutterIconOptions {
    /**
     * String or number value to get the icon value from source item corresponding to current row
     */
    index?: any;
    /**
     * String or number value to get the icon tooltip value from source item corresponding to current row
     */
    tooltipIndex?: any;
}
export interface IGridColumn {
    /**
     * Index of the column which can be either number or string. If number specified, each item of the data source is expected to be an array. Then array[index] is displayed in the column. If string specified, each item if the data source is expected to be an object. Then object[index] is displayed in the column.
     * @defaultvalue "index in the columns array"
     */
    index?: any;
    /**
     * Name of the column used for identification purposes
     */
    name?: string;
    /**
     * Determines whether moving this column is enabled or not
     * @defaultvalue true
     */
    canSortBy?: boolean;
    /**
     * Determines whether sorting this column is enabled or not
     * @defaultvalue true
     */
    canMove?: boolean;
    /**
     * Width of the column in pixels
     * @defaultvalue 100
     */
    width?: number;
    /**
     * Css class to be added to the header cell
     */
    headerCss?: string;
    /**
     * Css class to be added to the cells under this column
     */
    rowCss?: string;
    /**
     * Display text of the column
     * @defaultvalue ""
     */
    text?: string;
    /**
     * Tooltip text of the column
     * @defaultvalue ""
     */
    tooltip?: string;
    /**
     * Specifies how ordering should be performed ("asc" or "desc")
     * @defaultvalue "asc"
     */
    order?: string;
    /**
     * Determines whether the column should be hidden or not
     * @defaultvalue false
     */
    hidden?: boolean;
    /**
     * Determines whether column moving effects this column or not
     * @defaultvalue false
     */
    fixed?: boolean;
    /**
     * If the value of cell is Date, format is used (like 'mm/dd/yyyy')
     */
    format?: string;
    hrefIndex?: number;
    indentOffset?: number;
    indent?: boolean;
    maxLength?: number;
    fieldId?: any;
    comparer?: (column: IGridColumn, order: number, rowA: any, rowB: any) => number;
    isSearchable?: boolean;
    getCellContents?: (rowInfo: any, dataIndex: number, expandedState: number, level: number, column: any, indentIndex: number, columnOrder: number) => void;
    getHeaderCellContents?: (IGridColumn) => JQuery;
    getColumnValue?: (dataIndex: number, columnIndex: number | string, columnOrder?: number) => any;
}
export interface IGridSortOrder {
    /**
     * Refers to column index
     */
    index: any;
    /**
     * Determines whether to sort ascending (default) or descending
     * @defaultvalue "asc"
     */
    order?: string;
}
export interface IGridRowInfo {
    dataIndex?: number;
    rowIndex?: number;
    row?: JQuery;
    dirty?: boolean;
    gutterRow?: any;
}
/**
 * Base item for a grid source (represents a row)
 */
export interface IGridSourceItem {
}
/**
 * Contract for the grid source.
 * Implementers should return source and expandStates arrays.
 */
export interface IGridSource {
    /**
     * Grid to update the source
     */
    grid: Grid;
    /**
     * Gets the source which can be consumed by the grid
     */
    getSource(): any[];
    /**
     * Gets the expand states of the source
     */
    getExpandStates(): number[];
    /**
     * Updates the source of the grid
     */
    update(items: IGridSourceItem[]): any;
}
/**
 * Default datasource implementation for the grid. It can be used for a flat list.
 */
export class GridDefaultSource implements IGridSource {
    grid: Grid;
    protected _source: any[];
    constructor(items: IGridSourceItem[]);
    update(items: IGridSourceItem[]): void;
    getSource(): any[];
    getExpandStates(): number[];
    protected _updateSource(items: IGridSourceItem[]): void;
}
/**
 * Item contract for a hierarchical data source.
 * It can either have its own properties to be shown in the grid or values array can be used.
 * If values used, column.index should correspond to the index in the values.
 */
export interface IGridHierarchyItem extends IGridSourceItem {
    /**
     * Values to be used by grid to display grid content. index: number should be used for columns if values are used.
     */
    values?: any[];
    /**
     * Children of this item
     */
    children?: IGridHierarchyItem[];
    /**
     * Determines whether this item should be displayed collapsed or not
     */
    collapsed?: boolean;
}
/**
 * Hierarchical datasource implementation.
 */
export class GridHierarchySource extends GridDefaultSource implements IGridSource {
    private _expandStates;
    constructor(items: IGridHierarchyItem[]);
    getExpandStates(): any[];
    protected _updateSource(items: IGridHierarchyItem[]): void;
    private _prepareItems(items);
}
/**
 * @publicapi
 */
export class GridO<TOptions extends IGridOptions> extends Controls.Control<TOptions> {
    static enhancementTypeName: string;
    static MAX_COPY_SIZE: number;
    static PAYLOAD_SIZE: number;
    static EVENT_ROW_UPDATED: string;
    static EVENT_ROW_TOGGLED: string;
    static EVENT_SELECTED_INDEX_CHANGED: string;
    static DATA_DRAGGING_ROWINFO: string;
    static DATA_DROPPING_ROWINFO: string;
    private _selectionStart;
    private _header;
    private _gutterHeader;
    private _columnSizing;
    private _columnMoving;
    private _columnMovingElement;
    private _columnMovingPinElement;
    private _columnInsert;
    private _unitEx;
    private _sizingElement;
    private _ddRowAcceptStatus;
    private _ddRowOverStatus;
    private _ddDropStarted;
    private _activeAriaId;
    private _copyInProgress;
    private _previousCanvasHeight;
    private _previousCanvasWidth;
    private _$popupMenuPinTarget;
    /**
     *  Offset height, that shifts the row boundaries up and determines whether the pointer is over a particular row or not
     *  e.g. An offset percentage (passed in by the consumer of the grid) of 50 shifts each row boundary up half the row height for the purposes of calculating whether the mouse
     *  pointer is over the current row or not. The net effect of this is, if the pointer is in the top half of the current row/bottom half of the previous row,
     *  then the pointer is assumed to interesect with the current row.
     */
    private _rowOffsetHeight;
    private _isAboveFirstOrBelowLastRow;
    _contentSpacer: any;
    _dataSource: any[];
    _expandStates: any;
    _indentLevels: any;
    _columns: IGridColumn[];
    _sortOrder: any[];
    _visibleRange: any[];
    _count: number;
    _expandedCount: number;
    _selectedIndex: number;
    _indentIndex: number;
    _selectionCount: number;
    _selectedRows: any;
    _rowHeight: number;
    _cellOffset: number;
    _gutterWidth: number;
    _contentSize: any;
    _rows: any;
    _scroller: any;
    _canvasDroppable: any;
    _canvas: any;
    _canvasHeight: number;
    _canvasWidth: number;
    _headerCanvas: any;
    _gutter: any;
    _popupMenu: any;
    _resetScroll: boolean;
    _ignoreScroll: boolean;
    _scrollTop: number;
    _scrollLeft: number;
    _droppable: any;
    _draggable: any;
    _draggingRowInfo: any;
    _cancelable: any;
    _active: boolean;
    _cellMinWidth: number;
    private _draggableOverGrid;
    /**
     * Deprecated.  Please use _canvas instead.
     */
    _focus: JQuery;
    /**
     * Creates new Grid Control
     *
     * @param options The initialization options for the grid which have the following properties
     *
     *    "columns" is a required property containing the array of grid column descriptors that have the following structure:
     *    {
     *        index: The index for the
     *        text:      column header text, string, optional, default: "",
     *        width:     width in pixels of the column, number, optional, default: 100,
     *        canSortBy: true if the grid can be sorted by the column, boolean, optional, default: true
     *        canMove: true if this column can be moved (has effect only if allowMoveColumns is set to true for the grid as well), boolean, optional, default: true
     *        getCellContents: function that returns cell contents, function, optional, default: this._drawCell
     *            The function takes the same parameters as _drawCell and should return a jQuery object
     *            that represents the cell's contents. The first element will be appended to the row.
     *            If the function returns null or undefined nothing will be appended for that cell.
     *        getHeaderCellContents: function that returns column header cell contents, function, optional, default: this._drawHeaderCellValue
     *            The function takes the same parameters as _drawHeaderCellValue and should return a jQuery object
     *            that represents the cell's contents. The first element will be appended to the header cell's contents.
     *            If the function returns null or undefined nothing will be appended for that header cell.
     *        getColumnValue: function that returns the value for a cell contents, function, optional, default: this.getColumnValue;
     *            The return value of the function will be converted to a string an added as the cell contents.
     *    }
     *    "enabledEvents" is an optional property containing an object with properties for each of the enabled events.
     *    {
     *        GridO.EVENT_ROW_UPDATED: true
     *    }
     */
    constructor(options?: TOptions);
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    /**
     * Gets the number of selected items.
     * @returns {number}
     * @publicapi
     */
    getSelectionCount(): number;
    /**
     * @param element
     */
    _enhance(element: JQuery): void;
    initialize(): void;
    /**
     * Gets the row information for the item currently being dragged.
     *
     * @return
     */
    getDraggingRowInfo(): any;
    /**
     * Get the rows that currently have a draggable item "over" them
     */
    _getDragOverRows(): any;
    _getAcceptStatus(dataIndex: number): any;
    /**
     * Clear the cached row acceptance map
     */
    _resetRowAcceptStatus(): void;
    /**
     * See if the row has accepted and activate if it has.
     */
    _rowDropTryActivate(droppingRowInfo: any, e?: any, ui?: any): any;
    _rowIntersect(draggable: any, targetRowInfo: any): any;
    initializeDataSource(suppressRedraw?: boolean): void;
    /**
     * Sets the source of the grid using GridSource object.
     *
     * @param source GridSource object to set the grid source.
     * @publicapi
     */
    setDataSource(source: IGridSource): void;
    /**
     * Sets the data source, expands states, columns and sort order of the grid.
     *
     * @param source New source for the grid (See grid options for details).
     * @param expandStates Expand states for the new source. If source is not in hierarchical structure, specify null (See grid options for details).
     * @param columns New columns for the grid (See grid options for details).
     * @param sortOrder New sort order for the grid (See grid options for details).
     * @param selectedIndex Index of the rows to be selected after new data source is set.
     * @param suppressRedraw If true, grid is not redrawn after data source is set.
     * @publicapi
     */
    setDataSource(source?: any[], expandStates?: any[], columns?: IGridColumn[], sortOrder?: IGridSortOrder[], selectedIndex?: number, suppressRedraw?: boolean): any;
    _setColumnInfo(column: IGridColumn, index: number): void;
    /**
     * Gets the information about a row associated with the given data index.
     *
     * Returns a rowInfo object containing rowIndex, dataIndex and a jQuery wrapper for the actual row.
     *
     * @param dataIndex The data index for the record to retrieve.
     * @returns {IGridRowInfo}
     * @publicapi
     */
    getRowInfo(dataIndex: number): IGridRowInfo;
    /**
     * Gets the data being used to display the row at the provided data index.
     *
     * @param dataIndex The data index for the record to retrieve.
     * @return {any}
     * @publicapi
     */
    getRowData(dataIndex: number): any;
    /**
     * Gets the columns currently being displayed in the grid.
     * @returns {IGridColumn[]}
     * @publicapi
     */
    getColumns(): IGridColumn[];
    /**
     * Gets the current sort order being used in the grid.
     * @returns {IGridSortOrder[]}
     * @publicapi
     */
    getSortOrder(): IGridSortOrder[];
    /**
     * Set new column info for the column associated with the specified column name.
     *
     * @param columnName Name of the column to change the options.
     * @param options New column options.
     * @publicapi
     */
    setColumnOptions(columnName: string, options?: IGridColumn): void;
    _getDataIndex(visibleIndex: any): any;
    _getRowIndex(dataIndex: any): number;
    expandNode(dataIndex: any): void;
    collapseNode(dataIndex: any): void;
    expandAllNodes(): boolean;
    collapseAllNodes(): boolean;
    /**
     * Expands all rows of the grid (if source data is hierarchical).
     * @publicapi
     */
    expandAll(): void;
    /**
     * Collapses all rows of the grid (if source data is hierarchical).
     * @publicapi
     */
    collapseAll(): void;
    /**
     * Expands all rows at or below specified level (if source data is hierarchical).
     *
     * @param level Level to expand.
     * @publicapi
     */
    expandByLevel(level: number): void;
    /**
     * Collapses all rows at or below specified level (if source data is hierarchical).
     *
     * @param level Level to collapse.
     * @publicapi
     */
    collapseByLevel(level: number): void;
    /**
     * Expand or collapse node(s), and set selection focus at a given target index or at the current selected index as default behavior.
     *
     * @param expand If true, expands the node, otherwise collapsed.
     * @param applyToAllRows True to expand or collapse all nodes, false to expand or collapse the node at a given target index, or at the current selected index as default behavior.
     * @param targetIndex The node index to be expanded or collapsed, and get selection focus.
     * @returns {boolean}
     * @publicapi
     */
    tryToggle(expand: boolean, applyToAllRows: boolean, targetIndex?: number): boolean;
    _getVisibleRowIndices(): {
        first: number;
        last: number;
    };
    /**
     * @param rowIndex
     * @param force
     * @return
     */
    _getRowIntoView(rowIndex: number, force?: boolean): boolean;
    /**
     * @param force
     */
    getSelectedRowIntoView(force?: boolean): boolean;
    cacheRows(aboveRange: any, visibleRange: any, belowRange: any): void;
    _drawRowsInternal(visibleRange: any, includeNonDirtyRows: any): {
        rowsFragment: any;
        gutterFragment: any;
    };
    /**
     * Sets up full-row bowtie styling whether hovering over the main row or the row gutter.
     */
    private setupFullRowHover($row);
    _drawRows(visibleRange: any, includeNonDirtyRows: any): void;
    /**
     * Updates the row identified by the given rowIndex.
     *
     * @param rowIndex Index of row to be updated
     * @param dataIndex DataIndex of row to be updated
     * @param columnsToUpdate HashSet of column indices. If given,
     * only columns in this set will be updated.
     */
    updateRow(rowIndex: number, dataIndex?: number, columnsToUpdate?: {
        [id: number]: boolean;
    }): void;
    _updateRow(rowInfo: any, rowIndex: any, dataIndex: any, expandedState: any, level: any, columnsToUpdate?: {
        [id: number]: boolean;
    }): void;
    private _rowHasContextMenu(dataIndex);
    private _addContextMenuContainer($gridCell, itemHasMenu);
    /**
     * Updates the container element for the row identified by rowIndex
     *
     * @param rowIndex Index of row to be updated
     * @param keepContent If set, the content of the container element (i.e.,
     * any column data) will not be removed
     * @return Returns DOM row container element
     */
    _updateRowSize(rowIndex: number, row: any, keepContent?: boolean): any;
    /**
     * Default implementation for creating the contents of a given cell.
     *
     * Custom Drawn Columns:
     * If you want a custom drawn column, then the preferred method is to set a "getCellContents" property
     * on the column to a function that takes the same parameters as this function and returns a jQuery
     * object that represents the contents.
     *
     * @param rowInfo The information about grid row that is being rendered.
     * @param dataIndex The index of the row.
     * @param expandedState Number of children in the tree under this row recursively.
     * @param level The hierarchy level of the row.
     * @param column Information about the column that is being rendered.
     * @param indentIndex Index of the column that is used for the indentation.
     * @param columnOrder The display order of the column.
     * @return Returns jQuery element representing the requested grid cell. The first returned element will be appended
     * to the row (unless the function returns null or undefined).
     */
    _drawCell(rowInfo: any, dataIndex: number, expandedState: number, level: number, column: any, indentIndex: number, columnOrder: number): any;
    /**
     * Default implementation for creating the element that represents content of a header cell.
     *
     * Custom Drawn Column Header:
     * If you want a custom drawn column header, then the preferred method is to set a "getHeaderCellContents" property
     * on the column to a function that takes the same parameters as this function and returns a jQuery
     * object that represents the contents.
     *
     * @param column Information about the header column that is being rendered.
     * @return Returns jQuery element representing the requested header cell contents.
     */
    _drawHeaderCellValue(column: any): JQuery;
    protected _isIndentedHeaderColumn(column: any): boolean;
    _layoutHeader(): void;
    layout(): void;
    redraw(): void;
    /**
     * Gets the value for a column. The default use of the return value is to
     * convert it to a string and set it as the cell's text value.
     *
     * @param dataIndex The index for the row data in the data source
     * @param columnIndex The index of the column's data in the row's data array
     * @param columnOrder The index of the column in the grid's column array. This is the current visible order of the column
     * @return
     */
    getColumnValue(dataIndex: number, columnIndex: number | string, columnOrder?: number): any;
    getColumnText(dataIndex: any, column: any, columnOrder?: any): any;
    _getExpandState(dataIndex: any): number;
    /**
     * @param rowIndex
     * @param dataIndex
     * @param options
     */
    _selectRow(rowIndex: number, dataIndex?: number, options?: any): void;
    /**
     * @return
     */
    getSelectedRowIndex(): number;
    setSelectedRowIndex(selectedRowIndex: any): void;
    /**
     * @return
     */
    getSelectedDataIndex(): number;
    /**
     * @return The last data index of the grid
     */
    getLastRowDataIndex(): number;
    /**
     * @return
     */
    getSelectedDataIndices(): number[];
    /**
     * Ensures that an item (identified by a data index) has an associated row by
     * expanding any enclosing collapsed rows. Returns the rowIndex of the associated row.
     *
     * @param dataIndex The data index of the item to ensure is expanded
     * @return
     */
    ensureDataIndexExpanded(dataIndex: number): number;
    /**
     * Sets the selected item in the grid by the data index.
     * Optionally ensure that the item is not hidden by collapsed rows.
     *
     * @param dataIndex The data index of item to show
     * @param expandNodes If true, all containing collapsed nodes will be expanded
     */
    setSelectedDataIndex(dataIndex: number, expandNodes?: boolean): void;
    selectionChanged(selectedIndex: any, selectedCount: any, selectedRows: any): void;
    selectedIndexChanged(selectedRowIndex: any, selectedDataIndex: any): void;
    _updateRowSelectionStyle(rowInfo: any, selectedRows: any, focusIndex: any): void;
    /**
     * @param timeout
     */
    focus(timeout?: number): void;
    /**
     * Gets info about the row on which context menu is opened.
     *
     * If no context menu is open, returns null.
     *
     * @returns {IGridRowInfo}
     * @publicapi
     */
    getContextMenuRowInfo(): IGridRowInfo;
    /**
     * Creates the context menu options. This function is intended to be overriden by derived objects.
     *
     * @param rowInfo The information about the row with context
     * @param menuOptions The menu information. See _createContextPopupMenuControl
     * @return
     */
    _createContextMenu(rowInfo: any, menuOptions: any): Menus.PopupMenu;
    /**
     *     Creates the PopupMenu control that houses the context menu items for the Grid. Note: this is intentionally
     *     abstracted from _createContextMenu to allow directly calling it from deep derivations and avoiding inheritance
     *     base propagation.
     *
     * @param menuOptions
     *     The menu information:
     *     {
     *         contextInfo: { item, rowInfo}
     *         items: the list of menu items
     *     }
     *
     * @return
     */
    _createContextPopupMenuControl(menuOptions: any): Menus.PopupMenu;
    /**
     * @param e
     * @return
     */
    _onContainerResize(e?: JQueryEventObject): any;
    /**
     * @return
     */
    _onColumnResize(column: any): any;
    /**
     * @return
     */
    _onColumnMove(sourceIndex: any, targetIndex: any): any;
    /**
     * @param column
     * @param add
     */
    _sortBy(column?: any, add?: boolean): void;
    /**
     * @param sortOrder
     * @param sortColumns
     * @return
     */
    onSort(sortOrder: any, sortColumns?: any): any;
    /**
     * @param sortOrder
     * @param sortColumns
     * @return
     */
    _trySorting(sortOrder: any, sortColumns?: any): any;
    /**
     * Finds the closest comparable ancestors of two elements
     * Comparable ancestors are ancestor gridItems which share the same parent gridItem
     * @param zippedArray
     * @param elemA
     * @param elemB
     * @return
     */
    private _getComparableAncestors(zippedArray, elemA, elemB);
    /**
     * @param e
     * @param selector
     */
    _getRowInfoFromEvent(e?: JQueryEventObject, selector?: string): any;
    /**
     * Handles the row mouse down event
     * @param e
     * @return
     */
    _onRowMouseDown(e?: JQueryEventObject): any;
    /**
     * @return
     */
    onRowMouseDown(eventArgs: any): any;
    /**
     * Handles the row mouse up event
     * @param e
     * @return
     */
    _onRowMouseUp(e?: JQueryEventObject): any;
    /**
     * @param eventArgs
     * @return
     */
    onRowMouseUp(eventArgs: JQueryEventObject): any;
    /**
     * @return
     */
    onRowClick(eventArgs: any): any;
    /**
     * @return
     */
    onRowDoubleClick(eventArgs: any): any;
    /**
     * @return
     */
    onGutterClick(eventArgs: any): any;
    /**
     * @return
     */
    onEnterKey(eventArgs: any): any;
    /**
     * @return
     */
    onDeleteKey(eventArgs: any): any;
    _onOpenRowDetail(e?: any, eventArgs?: any): boolean;
    /**
     * @return
     */
    onOpenRowDetail(eventArgs: any): any;
    /**
     * @return
     */
    onContextMenu(eventArgs: any): any;
    /**
     * @param e
     * @return
     */
    _onBlur(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    _onFocus(e?: JQueryEventObject): any;
    _onKeyPress(e?: JQueryKeyEventObject): any;
    /**
     * @param e
     * @return
     */
    _onKeyDown(e?: JQueryKeyEventObject): any;
    _onBackSpaceKey(e?: JQueryKeyEventObject): void;
    _onUpKey(e?: JQueryKeyEventObject, bounds?: any): void;
    _onDownKey(e?: JQueryKeyEventObject, bounds?: any): void;
    _onRightKey(e?: JQueryKeyEventObject): void;
    _onLeftKey(e?: JQueryKeyEventObject): void;
    _onPageUpPageDownKey(e?: JQueryKeyEventObject, bounds?: any): void;
    _getRowsPerPage(e?: BaseJQueryEventObject): number;
    _onHomeKey(e?: JQueryKeyEventObject, bounds?: any): void;
    _onEndKey(e?: JQueryKeyEventObject, bounds?: any): void;
    _onTabKey(e?: JQueryKeyEventObject): void;
    _onEscapeKey(e?: JQueryKeyEventObject): void;
    /**
     * @param e
     * @return
     */
    _onKeyUp(e?: JQueryKeyEventObject): any;
    /**
     * Enables raising the custom event with the provided event name.
     *
     * @param eventName Name of the event to enable.
     */
    enableEvent(eventName: string): void;
    /**
     * Disables raising the custom event with the provided event name.
     *
     * @param eventName Name of the event to disable.
     */
    disableEvent(eventName: string): void;
    /**
     * Gets the collection of expand states for the grid.
     */
    getExpandStates(): any;
    /**
     * Generates a table of the selected items in the grid.
     *
     * @param operationCompleteCallback A callback function invoked when the
     * current selection is available to the client for processing.
     * @param errorCallback
     */
    beginFormatTable(operationCompleteCallback: IResultCallback, errorCallback?: IErrorCallback, formatterType?: new (grid: GridO<TOptions>, options?: any) => ITableFormatter, options?: any): void;
    _createElement(): void;
    protected _addSpacingElements(): void;
    _createFocusElement(): JQuery;
    private _buildDom();
    _shouldAttachContextMenuEvents(): boolean;
    _attachEvents(): void;
    _getDraggedRowsInfo(e?: JQueryEventObject): any;
    private _setupDragDrop();
    /**
     * Setup the provided draggable and droppable options
     */
    setupDragDrop(draggableOptions: any, droppableOptions: any): void;
    disableDragDrop(): void;
    enableDragDrop(): void;
    /**
     * Delegate out to the row accept handlers to determine if the dragging item will be accepted.
     */
    private _droppableAcceptHandler($element, draggingRowInfo);
    private _droppableDropHandler(e, ui);
    /**
     * Called when an item is being dragged that will be accepted by rows in this grid.
     */
    private _droppableActivateHandler(e, ui);
    /**
     * Called when an item stops being dragged that will be accepted by rows in this grid.
     */
    private _droppableDeactivateHandler(e, ui);
    /**
     * Called when a draggable item is over the grid.
     */
    private _droppableOverHandler(e, ui);
    /**
     * Called when a draggable item is no longer over the grid.
     */
    private _droppableOutHandler(e, ui);
    /**
     * Called when the mouse moves while the draggable item is over the grid.
     *
     * @param outOfGrid Indicates if this move event is being triggered as the mouse is leaving the grid.
     */
    private _droppableOverMoveHandler(e, ui);
    /**
     * Gets the draggable instance from the element which is being dragged.
     */
    private _getDraggable($draggedElement);
    /**
     * Clean up all state stored during drag/drop operations.
     */
    private _cleanupDragDropState();
    /**
     * Unregister the mouse move event which is setup during drag/drop operations.
     */
    private _unregisterDragMouseMove();
    /**
     * Clear the record of which rows the draggable objects are "over"
     */
    private _resetRowOverStatus();
    private _rowDropAccept(droppingRowInfo, $element);
    private _rowDropActivate(droppingRowInfo, e?, ui?);
    private _rowDropDeactivate(droppingRowInfo, e?, ui?);
    private _rowDropOver(droppingRowInfo, e?, ui?);
    private _rowDropOut(droppingRowInfo, e?, ui?);
    private _rowDrop(droppingRowInfo, draggingRowInfo, e?, ui?);
    private _rowDragCreateHelper(draggingRowInfo, e?, ui?);
    /**
     * Invokes the provided handler
     */
    private _invokeDragHandler(e, ui, handlerCallback);
    private _takeMeasurements();
    /**
     *     Ensures that the selected index is correctly set. That is, it will be a noop if the index doesnt change
     *     and will handle indexes that are out of bounds.
     *
     * @param index OPTIONAL: The index to select
     */
    private _ensureSelectedIndex(index?);
    _determineIndentIndex(): void;
    private _updateRanges();
    private _updateExpansionStates(expand, level);
    private _updateExpansionStateAndRedraw(expand, level);
    /**
     * @param includeNonDirtyRows
     */
    _updateViewport(includeNonDirtyRows?: boolean): void;
    _cleanUpRows(): void;
    private _getGutterIconClass(rowIndex, dataIndex, expandedState, level);
    private _drawGutterCell(rowInfo, rowIndex, dataIndex, expandedState, level);
    _drawHeader(): void;
    private _fixColumnsWidth(width);
    _layoutContentSpacer(): void;
    _fixScrollPos(): void;
    /**
     * @param includeNonDirtyRows
     */
    _redraw(includeNonDirtyRows?: boolean): void;
    selectAll(): void;
    /**
     * Clear the selected rows & selection count, but maintain the selected index.
     */
    _clearSelection(): void;
    /**
     * Highlights the row at the specified rowIndex
     *
     * @param rowIndex Index of the row in the visible source (taking the expand/collapse states into account)
     * @param dataIndex Index of the row in the overall source
     * @param options Specifies options such as:
     *     - keepSelectionStart: Keepd the rowIndex as the basis for range selection
     *     - doNotFireEvent: Prevents firing events
     *     - toggle: Toggles the row in the selection
     */
    _addSelection(rowIndex: number, dataIndex?: number, options?: any): void;
    /**
     * Highlights the rows beginning from the selection start until the row at the specified rowIndex
     *
     * @param rowIndex Index of the row in the visible source (taking the expand/collapse states into account)
     * @param dataIndex Index of the row in the overall source
     */
    private _addSelectionRange(rowIndex, dataIndex?, options?);
    /**
     * This is especially necessary for screen readers to read each
     * row when the selection changes.
     */
    private _updateAriaAttribute();
    private _updateSelectionStyles();
    private _selectionChanged();
    private _selectedIndexChanged(selectedRowIndex, selectedDataIndex);
    _showContextMenu(eventArgs: any): void;
    getPinAndFocusElementForContextMenu(eventArgs: any): {
        pinElement: JQuery;
        focusElement: JQuery;
    };
    /**
     * @param e
     * @return
     */
    _onContainerMouseDown(e?: JQueryEventObject): any;
    _measureCanvasSize(): void;
    private _setupDragEvents();
    private _clearDragEvents();
    /**
     * @param e
     * @return
     */
    private _onDocumentMouseMove(e?);
    /**
     * @param e
     * @return
     */
    private _onDocumentMouseUp(e?);
    /**
     * @param e
     * @return
     */
    private _onHeaderMouseDown(e?);
    /**
     * @param e
     * @return
     */
    private _onHeaderMouseUp(e?);
    /**
     * @param e
     * @return
     */
    _onHeaderClick(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    _onHeaderDblClick(e?: JQueryEventObject): any;
    private _moveSizingElement(columnIndex);
    /**
     *     Given a column index will provide the visible index of this column. That is, it will take in to consideration any
     *     hidden columns and omit them from the index count.
     *
     * @param columnIndex The 0-based global column index
     * @return The 0-based visible column index
     */
    private _getVisibleColumnIndex(columnIndex);
    /**
     * @param columnIndex
     * @param initialWidth
     * @param finish
     */
    _applyColumnSizing(columnIndex: number, initialWidth?: number, finish?: boolean): void;
    _tryFinishColumnSizing(cancel: any): void;
    /**
     * @param columnIndex
     * @param left
     */
    private _moveColumnMovingElement(columnIndex, left?);
    private _applyColumnMoving(sourceIndex, targetIndex);
    private _tryFinishColumnMoving(cancel);
    _getSortColumns(sortOrder: any): any[];
    /**
     * @param sortOrder
     * @param sortColumns
     * @return
     */
    private _onSort(sortOrder, sortColumns?);
    /**
     * @param e
     * @return
     */
    _onSelectStart(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    _onCanvasScroll(e?: JQueryEventObject): any;
    /**
     * @param e
     * @param handler
     * @param eventName
     * @param args
     */
    private _handleEvent(e?, handler?, eventName?, args?);
    /**
     * @param e
     * @return
     */
    _onRowClick(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    _onRowDoubleClick(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    private _onGutterClick(e?);
    /**
     * @param e
     * @return
     */
    _onEnterKey(e?: JQueryKeyEventObject, bounds?: any): any;
    /**
     * @param e
     * @return
     */
    _onDeleteKey(e?: JQueryKeyEventObject): any;
    /**
     * @param e
     * @return
     */
    private _onContextMenu(e?, args?);
    /**
     * @return
     */
    private _onToggle(rowInfo);
    private _isAncestorFolderToggled(rowInfo);
    ancestorFolderToggled(rowInfo: any): void;
    nonAncestorFolderToggled(rowInfo: any, currSelectedDataIndex: any): void;
    afterOnToggle(rowInfo: any): void;
    private _folderToggled(rowInfo);
    private _raiseToggleEvent(rowInfo, isExpanded);
    copySelectedItems(formatterType?: new (grid: GridO<TOptions>, options?: any) => ITableFormatter, copyAsHtml?: boolean, options?: any): void;
    _ensureRowDrawn(dataIndex: any): boolean;
    /**
     * Ensures that all data objects in the selection have been downloaded and are available to process.
     *
     * @param itemsAvailableCallback
     * @param errorCallback
     */
    _beginEnsureSelectionIsAvailable(itemsAvailableCallback?: IResultCallback, errorCallback?: IErrorCallback): void;
    _dispose(): void;
}
export class Grid extends GridO<IGridOptions> {
}
export class ListView extends Grid {
    static enhancementTypeName: string;
    constructor(options?: any);
}
export class GridSearchAdapter extends Search.SearchAdapter<any> {
    private _grid;
    private _gridData;
    private _results;
    private _searchableColumns;
    constructor();
    /**
     *     Attaches the Grid to the filter provider to allow for retrieval of paged data.
     *     The grid is loaded asynchronously, so can't be attached on page load when initialized.
     *
     * @param grid The grid to get data from
     */
    attachGrid(grid: Grid): void;
    /**
     * Adds additional items to the search strategy
     *
     * @param addItemsCallback The function which adds items to the search strategy.
     * @param searchCallback The function which searches the newly updated strategy.
     */
    addMoreItems(addItemsCallback: Function, searchCallback: () => any): void;
    /**
     * Creates SearchableObjects for all available work items
     *
     * @return An array of SearchableObjects.
     */
    createSearchableObjects(): Search.SearchableObject<any>[];
    /**
     *     Handles the results in the UI by filtering through all available items to the ones
     *     provided in the results array.
     *
     * @param results An array of items
     * @param finished Represents whether or not the search is finished
     */
    handleResults(results: any[], finished: boolean): void;
    /**
     *     Handles an error being thrown in the search process.
     *
     * @param message Specific error message if provided.
     */
    handleError(message: string): void;
    /**
     *     Handles the search results being cleared and the view resetting to normal.
     */
    handleClear(): void;
    /**
     *     Returns whether or not there is more data to be loaded.
     *
     * @return True if no more data needs to be loaded, false otherwise
     */
    isDataSetComplete(): boolean;
    /**
     *     Build the list of searchable columns.
     */
    private getSearchableColumns();
}
export interface ITableFormatter {
    getTableFromSelectedItems(): string;
}
export class TabDelimitedTableFormatter implements ITableFormatter {
    _options: any;
    _grid: Grid;
    constructor(grid: Grid, options?: any);
    /**
     * Iterates through the selected rows and builds a table containing the results.
     *
     * @return A tab-delimited plain-text table containing all rows and all columns in the current selection.
     */
    getTableFromSelectedItems(): string;
    getFormattedColumnValue(column: any, value: string): string;
}
export class HtmlTableFormatter implements ITableFormatter {
    private static HEADER_BACKGROUND_COLOR;
    private static HEADER_COLOR;
    private static FONT_SIZE;
    private static FONT_FAMILY;
    private static BORDER_COLLAPSE;
    private static COLUMN_BORDER;
    private static COLUMN_VERTICAL_ALIGN;
    private static COLUMN_PADDING;
    private static ROW_BACKGROUND_COLOR;
    private static ROW_ALT_BACKGROUND_COLOR;
    _options: any;
    _grid: Grid;
    constructor(grid: Grid, options?: any);
    processColumns(columns: any[]): any[];
    getTableFromSelectedItems(): string;
    getFormattedColumnValue(column: any, value: string): string;
    protected _getSelectedDataIndicesFromGrid(): number[];
    /**
     * Iterates through the selected rows and builds a HTML table containing the results.
     *
     * @return A HTML table containing all rows and all columns in the current selection.
     */
    _getJQTableFromSelectedItems(): JQuery;
}
}
declare module "VSS/Controls/Histogram" {
import Controls = require("VSS/Controls");
export interface HistogramBarData {
    /**
     * Value of the bar.
     */
    value?: number;
    /**
     * Text value displayed when the bar is hovered.
     */
    title?: string;
    /**
     * State of the bar which effects vizualization.
     */
    state?: string;
    /**
     * Specifies whether the bar is selected or not.
     */
    selected?: boolean;
    /**
     * Action of this bar.
     */
    action?: Function;
    /**
     * Action arguments.
     */
    actionArgs?: any;
}
export interface IHistogramOptions extends Controls.EnhancementOptions {
    /**
     * List of bars to display in the histogram.
     */
    bars?: HistogramBarData[];
    /**
     * A generator function to return a list of bars to display in the histogram.
     */
    barGenerator?: () => HistogramBarData[];
    /**
     * Determines whether to render default bars before actual bar data loaded.
     */
    renderDefaultBars?: boolean;
    /**
     * Number of bars to display.
     */
    barCount?: number;
    /**
     * Width of a bar in px.
     */
    barWidth?: number;
    /**
     * Height of a bar in px.
     */
    barHeight?: number;
    /**
     * Space between the bars in px.
     */
    barSpacing?: number;
    /**
     * Hover state.
     */
    hoverState?: string;
    /**
     * Selected state.
     */
    selectedState?: string;
    /**
     * Determines whether the interaction is allowed or not.
     */
    allowInteraction?: boolean;
}
export class HistogramO<TOptions extends IHistogramOptions> extends Controls.Control<TOptions> {
    constructor(options?: any);
    initialize(): void;
    refresh(items: HistogramBarData[]): void;
    _clearBars(): void;
    _getBarCount(): number;
    private _getBarWidth();
    private _getBarSpacing();
    private _getBarMaxHeight();
    private _load(items);
    private _decorate();
    private _renderDefaultBars();
    private _renderBars(items);
    /**
     * @param index
     * @param item
     * @return
     */
    private _createBar(index, item?);
}
export class Histogram extends HistogramO<IHistogramOptions> {
}
}
declare module "VSS/Controls/Hubs" {
import Controls = require("VSS/Controls");
/**
* Info for the hubs and hub groups applicable for a given context
*/
export interface HubsContext {
    HubGroupsCollectionContributionId: string;
    selectedHubGroupId: string;
    hubGroups: HubGroup[];
    hubs: Hub[];
}
/**
* Represents a hub group - the first level of navigation
*/
export interface HubGroup {
    id: string;
    name: string;
    uri: string;
    order: number;
    hasHubs: boolean;
}
/**
* Represents a hub - the second level of navigation
*/
export interface Hub {
    id: string;
    name: string;
    groupId: string;
    uri: string;
    order: number;
    isSelected: boolean;
}
/**
* Class to manage fetching hub context
*/
export module HubsContextManager {
    /**
    * Get the hub context information from the current page
    */
    function getHubsContext(): HubsContext;
    function getDefaultHubNavigationView(): HubNavigationView;
    function addHub(hub: Hub): void;
    function addHubGroup(hubGroup: HubGroup): void;
    function getSelectedHub(): IPromise<Hub>;
}
/**
* Control that renders the hubs/navigation area at the top of a page
*/
export class HubNavigationView extends Controls.BaseControl {
    static MAIN_NAVIGATION_HUB_SELECTOR: string;
    private _$hubgroupSection;
    private _$hubgroupContainer;
    private _$hubContainer;
    private _$hubSection;
    private _hubGroupsInitialized;
    private _hubsInitialized;
    private _selectedHubGroupSet;
    initialize(): void;
    private _setHubGroupUris(hub?);
    private _decorate();
    updateHubGroupLink(groupId: string, newUrl: string, clickHandler?: (eventObject: JQueryEventObject) => any): void;
}
}
declare module "VSS/Controls/KeyboardShortcuts" {
/**
 * Constants for well known shortcut keys.
 *
 * Example combo would be ShortcutKeys.ALT + "+q";
 */
export module ShortcutKeys {
    var ALT: string;
    var CONTROL: string;
    var SHIFT: string;
}
export interface IShortcutGroup {
    /**
     *  The name of the group
     */
    name: string;
    /**
     * The list of shortcuts in the group
     */
    shortcuts: IShortcut[];
}
export interface IShortcut {
    /**
     * Shortcut combinations that map to this action
     */
    combos: string[];
    /**
      * Shortcut combinations to display on the help dialog
      */
    combosToDisplay: string[];
    /**
    * Description of this shortcut
    */
    description: string;
    /**
     * Action to invoke for this shortcut
     */
    action: Function;
}
export interface IShortcutOptions {
    /**
     * Description of the shortcut
     */
    description: string;
    /**
     * Action which gets called when shortcut is pressed
     */
    action: Function;
    /**
     * The Dom Element to bind the shortcut to
     */
    element?: Element;
    /**
     * Defaults to false. Pass in True if you would like the shortcut to be hidden from the help dialog
     */
    hideFromHelpDialog?: boolean;
    /**
     * Defaults to false. Use true in the rare case that you want the last key of the chord to propagate to the focused element
     */
    allowPropagation?: boolean;
}
/**
* ShortcutManager handles registering multiple groups of keyboard shortcuts
*/
export interface IShortcutManager {
    /**
    * Gets the shortcut groups
    */
    getShortcutGroups(): IShortcutGroup[];
    /**
     * Register a shortcut
     * @param group Name of a shortcut group.
     * @param combo Keyboard combination.
     * @param description Description of the shortcut
     * @param action Action which gets called when shortcut is pressed
     * @param allowPropagation Defaults to false. Use true in the rare case that you want the last key of the chord to propagate to the focused element
     *
     * @returns ShortcutManager
     */
    registerShortcut(group: string, combo: string, description: string, action: Function, allowPropagation?: boolean): IShortcutManager;
    /**
     * Register a group of shortcuts
     * @param group Name of a shortcut group.
     * @param combos Keyboard combinations that all map to same action.
     * @param description Description of the shortcut
     * @param action Action which gets called when shortcut is pressed
     * @param allowPropagation Defaults to false. Use true in the rare case that you want the last key of the chord to propagate to the focused element
     *
     * @returns ShortcutManager
     */
    registerShortcuts(group: string, combos: string[], description: string, action: Function, allowPropagation?: boolean): IShortcutManager;
    /**
     * Register a shortcut
     * @param group Name of a shortcut group.
     * @param combo Keyboard combination.
     * @param options The options to configure this shortcut with
     *
     * @returns ShortcutManager
     */
    registerShortcut(group: string, combo: string, options: IShortcutOptions): IShortcutManager;
    /**
     * Register a group of shortcuts
     * @param group Name of a shortcut group.
     * @param combos Keyboard combinations that all map to same action.
     * @param options The options to configure this shortcut with
     *
     * @returns ShortcutManager
     */
    registerShortcuts(group: string, combos: string[], options: IShortcutOptions): IShortcutManager;
    /**
     * Removes a group of shortcuts
     * This is used when a group of shortcuts is no longer applicable and you want to de-register them. For example,
     * if you had a ajax popup that needed its own shortcuts but you want to clear those when it is closed.
     *
     * NOTE: This will remove all shortcuts for a given group regardless of where they were registered from.
     *
     * @param group Name of a shortcut group.
     */
    removeShortcutGroup(group: string): any;
    /**
     * Show the shortcut dialog
     */
    showShortcutDialog(): void;
}
export class ShortcutManager implements IShortcutManager {
    private static AREA;
    private static FEATURE;
    private static _instance;
    static getInstance(): IShortcutManager;
    private _registeredCombos;
    private _shortcutsGroups;
    private _shortcutDialog;
    getShortcutGroups(): IShortcutGroup[];
    registerShortcut(group: string, combo: string, description: string, action: Function, allowPropagation?: boolean): ShortcutManager;
    registerShortcut(group: string, combo: string, options: IShortcutOptions): ShortcutManager;
    registerShortcuts(group: string, combos: string[], description: string, action: Function, allowPropagation?: boolean): ShortcutManager;
    registerShortcuts(group: string, combos: string[], options: IShortcutOptions): ShortcutManager;
    removeShortcutGroup(group: string): void;
    showShortcutDialog(): void;
    private renderDialogContent(shortcutGroups);
    private renderShortcutGroups(shortcutGroups);
    private renderShortcut(shortcut);
    private renderGroup(group);
    private renderHelpLink();
}
}
declare module "VSS/Controls/Menus" {
import Controls = require("VSS/Controls");
export var menuManager: any;
export enum MenuItemState {
    None = 0,
    Disabled = 1,
    Hidden = 2,
    Toggled = 4,
}
export interface IMenuItemSpec extends IContributedMenuItem {
    /**
     * Id of the menu item. Used to distinguish the menu item when action is executed or when changing command state of a menu item
     */
    id?: string;
    contributionId?: string;
    rank?: number;
    /**
     * Display text of the menu item
     */
    text?: string;
    /**
     * Display html of the menu item (mutually exclusive with text)
     */
    html?: string;
    /**
     * Text displayed when mouse is hovered on the menu item
     */
    title?: string;
    /**
     * Icon for the menu item
     */
    icon?: string;
    /**
     * Determines whether the menu item is a separator or not. If specified along with text, menu item acts like a group text
     * @defaultvalue false
     */
    separator?: boolean;
    /**
     * Determines whether the menu item is initially disabled or not
     * @defaultvalue false
     */
    disabled?: boolean;
    /**
     * Children of this menu item
     */
    childItems?: any;
    /**
     * Extra css class name for this menu item
     */
    cssClass?: string;
    groupId?: string;
    /**
     * Determines whether to show text for this item or not.
     * @defaultvalue true
     */
    showText?: boolean;
    /**
     * Determines whether to show html for this item or not.
     * @defaultvalue true
     */
    showHtml?: boolean;
    /**
     * Determines whether to disable icon for this item or not.
     * @defaultvalue false
     */
    noIcon?: boolean;
    arguments?: any;
    action?: (commandArgs: any) => void;
    /**
     * Set to true for menu items that are contributed my an extension.
     */
    isContribution?: boolean;
    /**
     * The id of the extension that contributed the menu item.
     */
    sourceExtensionId?: string;
}
export interface MenuBaseOptions {
    type: string;
    contextInfo: any;
    arguments: any;
    updateCommandStates: Function;
    getCommandState: Function;
    overflow: string;
    align: string;
    useBowtieStyle: boolean;
    cssClass: string;
    cssCoreClass: string;
}
export class MenuBase<TOptions extends MenuBaseOptions> extends Controls.Control<TOptions> {
    _type: any;
    _parent: any;
    _children: any;
    _commandStates: any;
    actionArguments: any;
    /**
     * @param options
     */
    constructor(options?: any);
    getOwner(): any;
    getContextInfo(): any;
    /**
     * @return
     */
    getActionArguments(): any;
    /**
     * Returns the menu type. The values are outlines in the MenuType enumeration
     *
     * @return The menu type value
     */
    getMenuType(): number;
    updateCommandStates(commands: ICommand[]): void;
    isMenuBar(): boolean;
    _fireUpdateCommandStates(context: any): void;
    _clear(): void;
    private _updateCommandStates(commands);
    /**
     * Update contributed menu items that have already been added to the menu.
     * @param items
     */
    protected _updateContributedMenuItems(items: IMenuItemSpec[]): void;
}
export interface MenuItemOptions extends MenuBaseOptions {
    item: any;
    immediateShowHide: boolean;
    clickToggles: boolean;
}
export class MenuItem extends MenuBase<MenuItemOptions> {
    static enhancementTypeName: string;
    static getScopedCommandId(id: any, scope: any): any;
    private _highlightHover;
    private _highlightPressed;
    private _index;
    _item: any;
    _align: any;
    /**
     * @param options
     */
    constructor(options?: MenuItemOptions);
    /**
     * @param options
     */
    initializeOptions(options?: MenuItemOptions): void;
    getCommandId(): any;
    getAction(): any;
    hasAction(): boolean;
    hasSubMenu(): any;
    isDecorated(): boolean;
    isDefault(): boolean;
    isSeparator(): boolean;
    /**
     * Returns if this menu item is a label.  Labels are menu items that aren't actions, like separators, but contain content, such as text.
     *     NOTE: Currently, Labels are implemented using separators.  However, there are plans to revisit this.
     */
    isLabel(): any;
    isSelected(): boolean;
    getCommandState(commandId?: string, context?: any): MenuItemState;
    getIndex(): number;
    setIndex(value: number): void;
    isHidden(): boolean;
    isEnabled(): boolean;
    isToggled(): boolean;
    initialize(): void;
    update(item: any): void;
    updateItems(items: any): void;
    _decorate(): void;
    private _getExternalIcon(url);
    select(): void;
    deselect(): void;
    escaped(): void;
    /**
     * @param options
     */
    execute(options?: any): any;
    executeAction(args?: any): any;
    collapse(options?: any): void;
    setFocus(): void;
    removeFocus(): void;
    /**
     * Called to show the hover highlight the button
     */
    showHoverHighlight(): void;
    /**
     * Called to make the button appear to be 'pressed'
     */
    showPressedHighlight(): void;
    /**
     * Called to make the button appear to be 'pressed'
     */
    removePressedHighlight(): void;
    /**
     * Called to remove all highlighting on the button
     */
    removeHighlight(): void;
    /**
     * Updates the title of a menu item using either the specified text or
     * the function provided in the options
     *
     * @param text New title to be displayed
     */
    updateTitle(text: string): void;
    /**
     * Updates the text of a menu item using either the specified text or
     * the function provided in the options
     *
     * @param text New text to be displayed
     */
    updateText(text: string): void;
    getSubMenu(): any;
    tryShowSubMenu(options?: any): boolean;
    showSubMenu(options?: any): void;
    hideSubMenu(options?: any): void;
    hideSiblings(options?: any): void;
    private _attachMenuEvents();
    private _createIconElement();
    private _createTextElement();
    private _createHtmlElement();
    private _createDropElement();
    private _createSeparatorElement();
    private _updateState();
    /**
     * Update contributed menu items that have already been added to the menu.
     * @param items
     */
    protected _updateContributedMenuItems(updatedItems: IMenuItemSpec[]): void;
    private _onMouseOver(e?);
    private _onMouseOut(e?);
    private _onMouseDown(e?);
    private _onMouseUp(e?);
    private _onClick(e?);
    private _onDropClick(e?);
    private _onKeyDown(e);
}
export interface MenuContributionProviderOptions {
    defaultTextToTitle?: boolean;
}
export interface MenuOptions extends MenuBaseOptions {
    suppressInitContributions: boolean;
    contributionIds: string[];
    /**
     * Items to be displayed in the menu
     */
    items: IMenuItemSpec[];
    /**
     * Action executed when a menu item is clicked
     */
    executeAction: Function;
    getContributionContext: Function;
}
/**
 * @publicapi
 */
export class Menu<TOptions extends MenuOptions> extends MenuBase<TOptions> {
    static enhancementTypeName: string;
    private _items;
    private _itemsSource;
    private _defaultMenuItem;
    private _childrenCreated;
    private _popupElement;
    private _skipUpdateMenuItemStates;
    private _positioningRoutine;
    private _pinElement;
    private _menuContributionProvider;
    protected _contributedItems: IContributedMenuItem[];
    protected _contributionProviderOptions: MenuContributionProviderOptions;
    protected _contributionPromise: IPromise<IContributedMenuItem[]>;
    _menuItems: any;
    _selectedItem: any;
    _visible: boolean;
    _active: boolean;
    _blockBlur: boolean;
    _focusItem: any;
    /**
     * @param options
     */
    constructor(options?: any);
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    private _initializeItemsSource();
    _decorate(): void;
    /**
     * Gets the item which has the specified id.
     *
     * @param id  Id associated with the menu item.
     * @return {MenuItem}
     * @publicapi
     */
    getItem(id: string): MenuItem;
    /**
     * Gets an array of all menu items.
     *
     * @return {MenuItem[]}
     * @publicapi
     */
    getItems(): MenuItem[];
    /**
     * Gets the item which has the specified tag
     *
     * @param tag Associated with the menu item
     * @return
     */
    getItemByTag(tag: string): MenuItem;
    getCommandState(commandId: string, context?: any): MenuItemState;
    /**
     * Updates the command states of the items with the specified ids.
     *
     * @param commands List of commands to update.
     * @publicapi
     */
    updateCommandStates(commands: ICommand[]): void;
    updateItems(items: any): void;
    protected _updateItemsWithContributions(items: any, contributedMenuItems: IContributedMenuItem[]): void;
    protected _updateCombinedSource(items: any): void;
    /**
     * Create a list from itemsSource to reflect the order of items after grouping is done.
     * Groups of items come before all ungrouped items.
     * A separator goes between each group of items.
     * Ungrouped items remain at the end of the menu with their manually-specified separators still in tact.
     * If any groups are defined, separators are guaranteed not to be the first or last item in the menu.
     */
    getGroupedItems(): IMenuItemSpec[];
    appendItems(appendedItems: any): void;
    /**
     * @param element
     */
    _enhance(element: JQuery): void;
    /**
     * @return
     */
    _getMenuItemType(): any;
    /**
     * @param extraOptions
     * @return
     */
    getMenuItemOptions(item: any, extraOptions?: any): any;
    _getFirstMenuItem(): any;
    /**
     * @param item
     * @param ignoreFocus
     */
    _selectItem(item?: any, ignoreFocus?: any): void;
    selectDefaultItem(ignoreFocus?: any): void;
    selectFirstItem(): boolean;
    selectNextItem(): boolean;
    selectPrevItem(): boolean;
    /**
     * @param options
     * @return
     */
    selectDown(options?: any): boolean;
    /**
     * @param options
     * @return
     */
    selectUp(options?: any): boolean;
    /**
     * @param options
     * @return
     */
    selectRight(options?: any): boolean;
    /**
     * @param options
     * @return
     */
    selectLeft(options?: any): boolean;
    show(options?: any): boolean;
    /**
     * @param options
     */
    hide(options?: any): void;
    hideChildren(excludedItem: MenuItem, options?: any): void;
    /**
     * @param options
     * @return
     */
    escape(options?: any): boolean;
    ownFocus(): void;
    attach(parent: any): void;
    /**
     * @return
     */
    getMenuItemAlignment(): string;
    updateMenuItemStates(): void;
    executeAction(eventArgs: any): any;
    /**
     * Scrolls to ensure that the MenuItem is visible
     *
     * @param item MenuItem which is to be shown
     */
    private _ensureVisible(item);
    private _getItems();
    _clear(): void;
    /**
     * @param menuItemElement
     */
    private _createChildMenuItem(item, menuItemElement?);
    private _createSplitDropMenuItem(item, menuItem);
    private _ensureChildren();
    private _enhanceChildren();
    private _getDefaultMenuItem();
    /**
     * @param options
     */
    private _getNextEnabledItem(index, options?);
    /**
     * @param options
     */
    private _getPrevEnabledItem(index, options?);
    private _ensurePopup();
    private _getPopupAlign(align);
    private _showPopup(element, align);
    _hidePopup(): void;
    private _updateMenuItemStates();
    private _startShowTimeout(element, align);
    private _startHideTimeout();
    private _clearTimeouts();
    private _attachAncestorScroll(element);
    private _detachAncestorScroll(element);
    protected _dispose(): void;
    _onParentScroll(e?: any): void;
    private _onMouseDown(e?);
    private _blockBlurUntilTimeout();
    /**
     * Load contributed menu items.
     */
    refreshContributedItems(): void;
    /**
     * Load contributed menu items.
     */
    private _refreshContributedMenuItems();
    /**
     * Update contributed menu items that have already been added to this menu.
     *
     * Menu items must have an id set in order to be updated. Extensions can only update menu items that they contributed.
     *
     * Exposed to extensions as the updateMenuItems() method on the context object passed to getMenuItems().
     * @param contributedMenuItems
     */
    updateContributedMenuItems(contributedMenuItems: IMenuItemSpec[]): void;
    /**
     * Creates context object to be passed to extensions.
     */
    private _getContributionContext();
}
export interface MenuOwnerOptions extends MenuOptions {
    /**
     * Determines whether icons are visible or not
     * @defaultvalue true
     */
    showIcon: boolean;
    markUnselectable: boolean;
    showTimeout: number;
    hideTimeout: number;
    popupAlign: string;
    onActivate: Function;
    onDeactivate: Function;
}
export class MenuOwner<TOptions extends MenuOwnerOptions> extends Menu<TOptions> {
    private _focusElement;
    private _activating;
    private _canBlur;
    private _immediateBlur;
    _subMenuVisible: boolean;
    _align: any;
    /**
     * @param options
     */
    constructor(options?: TOptions);
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    /**
     * Sets showIcon option.
     *
     * @param showIcon New state for the showIcon option.
     */
    setShowIcon(showIcon: boolean): void;
    initialize(): void;
    _decorate(): void;
    /**
     * @return
     */
    getMenuItemAlignment(): string;
    /**
     * @param extraOptions
     */
    getMenuItemOptions(item: any, extraOptions?: any): any;
    /**
     * @param options
     * @return
     */
    escape(options?: any): boolean;
    escaped(options?: any): void;
    isActive(): boolean;
    activate(): void;
    /**
     * This is especially necessary for screen readers to read each
     * row when the selection changes.
     */
    private _updateAriaAttribute(item);
    private _hide();
    private _blur();
    private _updateSubMenuVisibleState();
    private _onKeyDown(e?);
    private _onFocus(e?);
    /**
     * @param e
     * @return
     */
    private _onBlur(e?);
    private _proceedBlur();
    private _startBlurTimeout();
    private _clearBlurTimeout();
    _onParentScroll(e?: any): void;
    private _onResize(e?);
    private _onContextMenu(e?);
    /**
     * Attempt to open the submenu on the focused item
     * @param e
     * @return
     */
    showSubMenuOnFocusedItem(): boolean;
}
/**
 * @publicapi
 */
export interface MenuBarOptions extends MenuOwnerOptions {
    /**
     * Orientation of the menubar (horizontal or vertical)
     * @defaultvalue "horizontal"
     */
    orientation: string;
}
export class MenuBarO<TOptions extends MenuBarOptions> extends MenuOwner<TOptions> {
    static enhancementTypeName: string;
    private _orientation;
    /**
     * @param options
     */
    constructor(options?: TOptions);
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    /**
     * @return
     */
    getMenuItemAlignment(): string;
    /**
     * @param options
     * @return
     */
    selectUp(options?: any): boolean;
    /**
     * @param options
     * @return
     */
    selectDown(options?: any): boolean;
    /**
     * @param options
     * @return
     */
    selectLeft(options?: any): boolean;
    /**
     * @param options
     * @return
     */
    selectRight(options?: any): boolean;
}
export class MenuBar extends MenuBarO<MenuBarOptions> {
    /**
     * Tries to activate the menubar associated with the element matched by the selector.
     * @param selector Selector to match the element.
     * @returns Menu activated or not.
     */
    static tryActivate(selector: string): boolean;
    /**
     * Tries to activate and open the menubar associated with the element matched by the selector.
     * @param selector Selector to match the element.
     * @returns Menu shown or not.
     */
    static tryShowSubMenu(selector: string): boolean;
    /**
     * Sets focus to the control
     */
    focus(): void;
    private static _getMenuBar(selector);
}
export interface PopupMenuOptions extends MenuOwnerOptions {
    hidden: boolean;
    onPopupEscaped: Function;
    onHide: Function;
}
export class PopupMenuO<TOptions extends PopupMenuOptions> extends MenuOwner<TOptions> {
    static enhancementTypeName: string;
    private _floating;
    private _escapeFocusReceiver;
    private _popupPinElement;
    private _onHide;
    _hidden: boolean;
    constructor(options?: TOptions);
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    /**
     * @return
     */
    _getMenuItemType(): any;
    _decorate(): void;
    popup(focusElement: any, pinElement: any): void;
    private _showPopupMenu();
    protected _updateItemsWithContributions(items: any, contributedMenuItems: IContributedMenuItem[]): void;
    protected _updateCombinedSource(items: any): void;
    /**
     * @param options
     * @return
     */
    selectUp(options?: any): boolean;
    /**
     * @param options
     * @return
     */
    selectDown(options?: any): boolean;
    /**
     * @param options
     * @return
     */
    selectLeft(options?: any): boolean;
    /**
     * @param options
     * @return
     */
    selectRight(options?: any): boolean;
    escaped(): void;
    _hidePopup(): void;
}
export class PopupMenu extends PopupMenuO<PopupMenuOptions> {
}
/**
 * The command id.
 */
export interface ICommand {
    /**
     * Optional disabled state.  True makes it visible in the menu but not selectable or clickable.
     */
    id: string;
    /**
     * Optional hidden state.  True hides it from the menu.
     */
    disabled?: boolean;
    /**
     * Optional toggled state.  True shows the item as toggled.
     */
    hidden?: boolean;
    toggled?: boolean;
}
/**
 * Sort the menu items by rank, pushing those without a rank to the bottom of the list.
 */
/**
 * Sort the menu items by rank, pushing those without a rank to the bottom of the list.
 */
export function sortMenuItems(items: any): any;
}
declare module "VSS/Controls/Navigation" {
import Controls = require("VSS/Controls");
import Menus = require("VSS/Controls/Menus");
import Notifications = require("VSS/Controls/Notifications");
/**
 * Creates a high-level view object for a given page which captures page/hash navigations,
 * handles setting page title, etc.
 */
export class NavigationView extends Controls.BaseControl {
    static ACTION_CONTRIBUTION: string;
    private _chromelessMode;
    private _leftPaneVisible;
    private _useHostedTitle;
    /**
     * Creates an instance of the object for the given page
     *
     * @param options
     *     attachNavigate: If true, listen for page/hash navigations
     *
     */
    constructor(options?: any);
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    /**
     * Function invoked when a page/hash navigation has occurred
     *
     * @param state Hash object containing the hash-url parameters
     */
    onNavigate(state: any): void;
    /**
     * Get the element that holds the title
     */
    _getViewTitle(): JQuery;
    /**
     *     Sets the (text) title of the page
     *
     * @param title
     *     Title of the page
     *
     * @param tooltip
     *     Optional tooltip for the page's title element
     *
     */
    setViewTitle(title?: string, tooltip?: string): void;
    /**
     *     Sets the raw-html title element for the page
     *
     * @param title
     *     Text title of the page to be used as the document title
     *
     * @param titleContent
     *     Raw HTML to inject into the title element (will not be escaped)
     *
     */
    setViewTitleContent(title: string, titleContent: string): void;
    /**
     *     Sets the document's title
     *
     * @param title
     *     Title of the page (text)
     *
     */
    setWindowTitle(title: string): void;
    /**
     * Shows or hides the Left (tree) section of the explorer page
     *
     * @param visible If true, show the left side of the explorer page. False to hide it.
     */
    setLeftHubPaneVisibility(visible: boolean): void;
    /**
     *     Set full-screen mode. If true, hide the chrome (hubs, etc.) around the main hub content, hide the splitter, etc.
     *
     * @param fullScreenMode True to enter full screen mode. False to exit full screen mode.
     */
    setFullScreenMode(fullScreenMode: boolean, showLeftPaneInFullScreenMode?: boolean): void;
    /**
     * Set the desired title mode for the current page.
     * Callers must specify directly, as navigation cannot take dependency on TFSOM.
     */
    _setTitleMode(isHosted: boolean): void;
    /**
     * Protected API: returns the desired title format string for use by SetWindowTitle()
     */
    _getPageTitleString(): string;
    private _attachNavigate();
    _onNavigate(state: any): void;
}
/**
 * A high-level singleton wrapper class for a Tri-Split page, providing lightweight
 * functionality such as retrieving the left/right/center hub content, left/right
 * panes, setting the view title, etc.
 *
 * This class is designed to enhance the hub view of a Tri-Split page, and depends
 * on the structure defined in the HubPageExplorerTriSplitPivot.master page.
 */
export class TriSplitNavigationView extends NavigationView {
    private static _instance;
    private _leftPane;
    private _rightPane;
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    /**
     * Retrieve the singleton instance of the class for the current page.
     */
    static getInstance(): TriSplitNavigationView;
    /**
     * Retrieve the left pane element within the current backlog view
     */
    getLeftPane(): JQuery;
    /**
     * Retrieve the right pane element within the current backlog view.
     * NOTE: This retrieves the right pane of the left splitter, which has the center
     * hub content as well as the right hub content (e.g. the product backlog mapping pane).
     */
    getRightPane(): JQuery;
}
export interface IPivotFilterItem {
    id?: string;
    text?: string;
    title?: string;
    selected?: boolean;
    encoded?: boolean;
    value?: any;
}
export interface IPivotFilterOptions extends Controls.EnhancementOptions {
    name?: string;
    text?: string;
    encoded?: boolean;
    behavior?: string;
    items?: IPivotFilterItem[];
    align?: any;
    useBowtieStyle?: any;
}
export class PivotFilter extends Controls.Control<IPivotFilterOptions> {
    static enhancementTypeName: string;
    private static _behaviors;
    /**
     * Registers a filter behavior for the pivot filter
     *
     * @param behaviorType Type of the registered behavior
     */
    static registerBehavior(behaviorType: any): void;
    /**
     * Creates a behavior using the specified names. First found behavior is used
     *
     * @param names Names of the behaviors to probe
     * @param options Options of the behavior
     * @return
     */
    static createBehavior(names: any[], options?: any): any;
    private _behavior;
    constructor(options?: any);
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    /**
     * @param element
     */
    _enhance(element: JQuery): void;
    initialize(): void;
    /**
     * Gets all selected items of the pivot filter
     *
     * @return items
     */
    getSelectedItems(): IPivotFilterItem[];
    /**
     * Gets the currently selected item
     *
     * @return item
     */
    getSelectedItem(): IPivotFilterItem;
    /**
     * Gets the item of the specified value
     *
     * @param value Value of the item (String or Number)
     * @return item
     */
    getItem(value: any): IPivotFilterItem;
    /**
     * Gets all of the items
     * @return the items
     */
    getItems(): IPivotFilterItem[];
    /**
     * Gets the specified item selected
     *
     * @param item Item to select
     * @param fireChange Determines whether the control shoudl fire the change event
     */
    setSelectedItem(item: IPivotFilterItem, fireChange?: boolean): void;
    /**
     * Updates the pivot filter using the specified items
     *
     * @param items New set of items for the pivot filter
     */
    updateItems(items: IPivotFilterItem[], options?: any): void;
    /**
     * Initializes behavior of this pivot filter using specified behavior names
     */
    private _initBehavior(behaviorNames);
    /**
     * This method is called when the control is created in the client using createIn.
     * DOM needs to be built by the control itself
     */
    _createElement(): void;
    private _buildDom();
    private _attachEvents();
    private _onFilterChanged(e?, item?);
}
export interface IPivotViewItem extends IPivotFilterItem {
    link?: string;
    hidden?: boolean;
    disabled?: boolean;
    contributed?: boolean;
}
export interface IPivotViewOptions extends Controls.EnhancementOptions {
    items?: IPivotViewItem[];
    contributionId?: string;
    generateContributionLink?: (contributionId: string) => string;
}
export class PivotView extends Controls.Control<IPivotViewOptions> {
    static enhancementTypeName: string;
    private _extensionContainer;
    private _contributionContext;
    private _itemIdToSelect;
    private _contributionsInitialized;
    constructor(options?: any);
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    /**
     * @param element
     */
    _enhance(element: JQuery): void;
    /**
     * @param selector
     * @return the array of items
     */
    getItems(selector?: any): any[];
    initialize(): void;
    /**
     * Sets the DOM (jQuery) container that tab extensions will be loaded in. Should probably be a div.
     * @param {JQuery} container
     */
    setExtensionContainer(container: JQuery): void;
    showExtensionTab(contributionId: string, configuration?: any): void;
    setContributionContext(context: any): void;
    /**
     * If there is a contribution ID associated with this PivotView, load all the contributed pivot items.
     * use forceRefresh for for refreshing contributions, by default this ensures we get contributions only once
     */
    refreshContributedItems(forceRefresh?: boolean): IPromise<void>;
    updateItems(): void;
    /**
     * Set a particular view's link to a new link.
     *
     * @param id The view whose link needs an update.
     * @param link The new link for the specified view.
     */
    setViewLink(id: string, link: string): void;
    getSelectedView(): any;
    /**
     * Set a particular view to be enabled or disabled.
     */
    setViewEnabled(id: any, isEnabled: any): void;
    getView(id: any, selectedTabId?: any): any;
    setSelectedView(view: any): void;
    onChanged(view: any): void;
    _createElement(): void;
    private _buildDom();
    private _populateItems(ul);
    private _attachEvents();
    private _onClick(e?);
}
export class NavigationViewTab extends Controls.BaseControl {
    /**
     * Creates a control which is used to populate a navigation tab's content section
     */
    constructor(options?: any);
    /**
     * Called whenever navigation occurs with this tab as the selected tab
     *
     * @param rawState The raw/unprocessed hash/url state parameters (string key/value pairs)
     * @param parsedState Resolved state objects parsed by the view
     */
    onNavigate(rawState: any, parsedState: any): void;
    /**
     * Called whenever this tab is active and a navigation occurs that is switching to another tab
     */
    onNavigateAway(): void;
}
export class TabbedNavigationView extends NavigationView {
    private _hubContent;
    private _tabsControl;
    private _tabsMap;
    private _tabOptionsMap;
    private _tabs;
    private _currentTab;
    private _currentTabId;
    private _errorTab;
    private _infoTab;
    private _$infoContent;
    private _currentRawState;
    private _currentParsedState;
    private _currentNavigationContextId;
    private _lastParsedNavigationContextId;
    private _showingError;
    private _showingInfo;
    private _skipTabHideOnAsyncNavigate;
    /**
     * Creates a high-level view object for a given page that has different tabs which are
     * displayed based on the current hash/navigation.
     *
     * @param options
     *     tabs: (Object) Mapping of action id to a NavigationViewTab containing the contents of the tab
     *     hubContentSelector: (String) jQuery selector for the hub content div
     *     pivotTabsSelector: (String) jQuery selector for the hub tabs div
     *     hubSplitterSelector: (String) jQuery selector for the hub splitter control
     *
     */
    constructor(options?: any);
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    getTab(tabId: string): NavigationViewTab;
    showError(error: any): void;
    showErrorContent(title: any, $contentHtml: any, messageType: any, expand: any): void;
    showInformationTab(title: string, description: string): void;
    appendInformationContent(caption: string, collapsed: boolean): Notifications.InformationAreaControl;
    appendSectionTitle(content: string): void;
    appendSectionSummary(content: string): void;
    appendElement(element: JQuery): void;
    /**
     * Refresh the current tab (causes setState to be called on the currently visible tab)
     */
    refreshCurrentTab(): void;
    /**
     * Get the action/tab id for the current state
     *
     * @return Tab id, specified in the _a parameter
     */
    getCurrentAction(): string;
    /**
     * Get the current (parsed) state objects for the current navigation state
     *
     * @return State Object that was parsed by the view
     */
    getState(): any;
    /**
     * Set the current (parsed) state objects for the current navigation state
     */
    setState(parsedState: any): void;
    /**
     * Get a state hash with null entries for each hash key that exists in the current
     * url hash. This state can be extended and passed to VSS.Host.history.addHistoryPoint
     * so that existing hash parameters are NOT included in the new url.
     *
     * @return
     */
    getEmptyState(): any;
    /**
     * Get the raw (unparsed) state objects for the current navigation state (key/value pairs from the hash/url)
     *
     * @return Object with string values from the url hash portion
     */
    getRawState(): any;
    /**
     * Parse the state info and fetch any artificacts necessary to render the tab/view. Invoke the 'callback'
     * method with the new state info object when the state information has been successfully parsed.
     *
     * @param action The action parameter (_a) in the url hash
     * @param rawState The raw state info from the hash url for the new navigation
     * @param callback
     *    Callback that should be called when the state was successfully parsed. The callback takes 2 parameters: the tab id (typically
     *    the action), and the parsed state info object.
     *
     *    callback(tabId, parsedStateInfo);
     *
     *
     */
    parseStateInfo(action: string, rawState: any, callback: IResultCallback): void;
    /**
     * Get the visibility state of the specified tab based on the current tab/navigation state. True to show this tab. False to hide it.
     *
     * @param tabId The Id to get the visiblility state for
     * @param currentTabId Id of the currently selected tab
     * @param rawState The raw/unprocessed hash/url state parameters (string key/value pairs)
     * @param parsedState Resolved state objects parsed by the view
     * @return True to show the tab. False to hide it.
     */
    getTabVisibility(tabId: any, currentTabId: string, rawState: any, parsedState: any): boolean;
    /**
     * Get the updated tab label for the specified tab based on the current tab/navigation state. null/undefined to keep the existing label.
     *
     * @param tabId The Id to get the tab label for
     * @param currentTabId Id of the currently selected tab
     * @param rawState The raw/unprocessed hash/url state parameters (string key/value pairs)
     * @param parsedState Resolved state objects parsed by the view
     */
    getTabLabel(tabId: any, currentTabId: string, rawState: any, parsedState: any): void;
    /**
     * Shows or hides the Hub pivot section (navigation tab strip + filters)
     *
     * @param visible If true, show the hub pivot (tabs/filters). If false, hide them
     */
    setHubPivotVisibility(visible: boolean): void;
    private _getErrorTab();
    private _getInfoTab();
    _onNavigate(state: any): void;
    _redirectNavigation(action: string, state: any, replaceHistory?: boolean): void;
    private _onParseStateInfoSuccess(tabId, rawState, parsedState, navigationContextId);
    private _updateTabsControl(selectedTabId, rawState, parsedState);
    private _showTab(tab);
    private _getTab(tabId);
    private _createTab(tabControlType, tabOptions?);
}
export interface NavigationLinkOptions {
    state?: any;
    getUrl?: (state: any) => string;
    target?: string;
    text?: string;
    title?: string;
    $content: JQuery;
    initialState?: any;
}
export class NavigationLink extends Controls.BaseControl {
    private _navigateHandler;
    private _navigationLinkOptions;
    initializeOptions(options?: any): void;
    constructor(options: NavigationLinkOptions);
    initialize(): void;
    dispose(): void;
    private onNavigate(sender, state);
    private updateLink(state);
    getLocation(state: any): any;
}
export module FullScreenHelper {
    var FULLSCREEN_HASH_PARAMETER: string;
    /**
     * Initialize the full screen helper. Sets up event handlers.
     *
     * @param menuBar A toggle button for full screen mode will be added to the menu bar (if it does not already exist).
     */
    function initialize(menuBar: Menus.MenuBar, options?: any): void;
    /**
     * Gets a value indicating whether full screen mode is active.
     */
    function getFullScreen(): boolean;
    /**
     * Set full screen value. Update full screen view and button.
     * Update url with full screen tag if addHistoryPoint is true.
     *
     * @param value  The full screen value to set to.
     * @param addHistoryPoint  If true, update url with full screen tag.
     */
    function setFullScreen(value: boolean, addHistoryPoint?: boolean, showLeftLane?: boolean): void;
    /**
     * Get state object for the current full screen mode state.
     *
     * @param value Optional value to set for fullscreen mode.
     * If undefined will use current setting.
     */
    function getUrlData(value?: boolean): any;
    /**
     * Gets full screen icon.
     */
    function getFullScreenIcon(): string;
    /**
     * Gets full screen tooltip.
     */
    function getFullScreenTooltip(): string;
    /**
     * Attaches a fullscreen customer intelligence change event handler.
     * This event handler will be triggered for publishing full screen customer intelligence.
     *
     * @param handler Event handler callback.
     */
    function attachFullScreenCI(handler: IEventHandler): void;
    /**
     * Removes fullscreen customer intelligence change handler from the event handler list.
     *
     * @param handler Event handler callback.
     */
    function detachFullScreenCI(handler: IEventHandler): void;
    /**
     * Attaches a fullscreen customer intelligence change event handler.
     * This event handler will be triggered for publishing full screen customer intelligence.
     *
     * @param handler Event handler callback.
     */
    function attachFullScreenUrlUpdateEvent(handler: IEventHandler): void;
    /**
     * Removes fullscreen customer intelligence change handler from the event handler list.
     *
     * @param handler Event handler callback.
     */
    function detachFullScreenUrlUpdateEvent(handler: IEventHandler): void;
}
}
declare module "VSS/Controls/Notifications" {
import Controls = require("VSS/Controls");
export enum MessageAreaType {
    None = 0,
    Info = 1,
    Warning = 2,
    Error = 3,
}
export interface IMessageAreaControlOptions {
    message?: any;
    type?: MessageAreaType;
    closeable?: boolean;
    expanded?: boolean;
    hidden?: boolean;
    showHeader?: boolean;
    showDetailsLink?: boolean;
    showIcon?: boolean;
    noHeaderNoLinkJustIcon?: boolean;
    fillVertical?: boolean;
}
export class MessageAreaControlO<TOptions extends IMessageAreaControlOptions> extends Controls.Control<TOptions> {
    static EVENT_DISPLAY_COMPLETE: string;
    static EVENT_DISPLAY_CLEARED: string;
    static ERROR_DETAILS_TOGGLED: string;
    private _errorHeader;
    private _errorContent;
    private _messageType;
    private _showErrorLink;
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    initialize(): void;
    /**
     * Set the message
     *
     * @param message Message string (plain text), jQuery (html) or
     *     message = {
     *         type: MessageAreaType,
     *         header: String for plain text or jQuery for html,
     *         content: String for plain text or jQuery for html,
     *         click: function
     *     }
     *
     * @param messageType Type of message
     */
    setMessage(message: any, messageType?: MessageAreaType): void;
    /**
     * Set the error message
     *
     * @param message Message string (plain text), jQuery (html) or
     *     message = {
     *         type: MessageAreaType,
     *         header: String for plain text or jQuery for html,
     *         content: String for plain text or jQuery for html,
     *         click: function
     *     }
     *
     * @param clickCallback Click callback function
     */
    setError(message: any, clickCallback?: Function): void;
    /**
     * Gets the current message type.
     */
    getMessageType(): MessageAreaType;
    /**
     * Clear the shown message
     */
    clear(): void;
    /**
     * Set the display message
     *
     * @param message
     *     message = {
     *         type: MessageAreaType,
     *         header: String,
     *         content: html String OR jQuery,
     *         click: function
     *     }
     *
     */
    private _setDisplayMessage(message);
    private _toggle();
    setErrorDetailsVisibility(show: any): void;
    /**
     * Clear the shown message
     *
     * @param raiseDisplayCompleteEvent Indicates if the display complete event should be raised.
     */
    private _clear(raiseDisplayCompleteEvent);
    private _raiseDisplayComplete();
}
export class MessageAreaControl extends MessageAreaControlO<IMessageAreaControlOptions> {
}
export class UnsupportedBrowserMessageControl extends Controls.BaseControl {
    private _messageArea;
    /**
     * A message area control that displays a message to a user until they dismiss it.
     */
    constructor(options?: any);
    /**
     * Initialize the control, creating the message area and binding to the dismiss event
     */
    initialize(): void;
}
export interface IInformationAreaControlOptions {
    caption?: string;
    expandedIconClass?: string;
    collapsedIconClass?: string;
}
export class InformationAreaControlO<TOptions extends IInformationAreaControlOptions> extends Controls.Control<TOptions> {
    private _$collapseIndicator;
    private _$content;
    private _$caption;
    private _collapsed;
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    appendDetailHeaderContent($headerContent: JQuery): void;
    appendDetailContent($detailContent: JQuery): void;
    appendCodeContent($codeContent: JQuery): void;
    appendDetailHeaderHtml(headerHtml: string): void;
    appendDetailHtml(detailHtml: string): void;
    appendCodeHtml(codeHtml: string): void;
    _updateCollapsedState(collapsed: boolean): void;
}
export class InformationAreaControl extends InformationAreaControlO<IInformationAreaControlOptions> {
}
/**
 * This class affords showing a toast-style notification which fades in,
 * appears for a certain amount of time and then fades out.
 */
export class ToastNotification extends Controls.BaseControl {
    private _messageArea;
    private _fadeInTime;
    private _fadeOutTime;
    private _toastTime;
    private _toasting;
    private _delayedFunction;
    constructor(options?: any);
    initialize(): void;
    initializeOptions(options?: any): void;
    private _processOptions();
    private _getOptions();
    private _getDefaultOptions();
    /**
     * Pop up a toast with the supplied message
     *
     * @param message This can be a string or JQuery object
     * @param messageType The type of message area you want displayed. Defaults to Info.
     */
    toast(message: any, messageType?: MessageAreaType): void;
    /**
     * If toasting ensure we cancel all in-progress toasting activities
     */
    private _ensureNoActiveToast();
}
}
declare module "VSS/Controls/Panels" {
import Controls = require("VSS/Controls");
export interface ICollapsiblePanelOptions extends Controls.EnhancementOptions {
    collapsed?: boolean;
    headerText?: string;
    headerContent?: string | JQuery;
    expandCss?: string;
    headerCss?: string;
    contentCss?: string;
    hoverCss?: string;
    iconCss?: string;
    collapseCss?: string;
    iconCollapseCss?: string;
    iconExpandCss?: string;
    onToggleCallback?: Function;
    customToggleIcon?: JQuery;
}
export class CollapsiblePanel extends Controls.Control<ICollapsiblePanelOptions> {
    static EVENT_CONTENT_EXPANDED: string;
    static EVENT_CONTENT_COLLAPSED: string;
    static enhancementTypeName: string;
    private static _defaultToggleIconOverrideClass;
    private _dynamicContents;
    private _header;
    private _content;
    private _$toggleIcon;
    private _isDisabled;
    /**
     * @param options
     */
    initializeOptions(options?: ICollapsiblePanelOptions): void;
    private _swapDefaultToggleIconForCustom($customToggleIcon);
    private _createControl();
    _createIn(container: any): void;
    /**
     * @param element
     */
    _enhance(element: JQuery): void;
    /**
     * Appends the specified plain text to the header section of the CollapsiblePanel
     *
     * @param header Content to append to the header section
     * @return
     */
    replaceHeaderTextIfPresent(headerText: string): JQuery;
    /**
     * Appends the specified plain text to the header section of the CollapsiblePanel
     *
     * @param headerText Content to append to the header section
     * @return
     */
    appendHeaderText(headerText: string): CollapsiblePanel;
    /**
     * Appends the specified HTML, DOM element or jQuery object to the
     * header section of the CollapsiblePanel
     *
     * @param element Content to append to the header section
     * @return
     */
    appendHeader(element: string | JQuery): CollapsiblePanel;
    /**
     * Appends the specified content to the display content of the control
     *
     * @param content This might be a jQuery selector or function.
     * If a function is provided, that function will be executed whenever collapse icon is clicked.
     * The function should return a content
     * @return
     */
    appendContent(element: string | JQuery | Function): CollapsiblePanel;
    isExpanded(): boolean;
    expand(): void;
    collapse(): void;
    toggleExpandedState(): boolean;
    setDisabled(isDisabled: boolean): void;
    isCollapsiblePanelDisabled(): Boolean;
}
/**
 * @publicapi
 */
export interface IAjaxPanelOptions {
    /**
     * Url to load the content from.
     */
    url?: string;
    /**
     * Url request paremeters.
     */
    urlParams?: any;
    /**
     * Callback executed if the load succeeds.
     */
    success?: Function;
    /**
     * Callback executed if the load fails.
     */
    error?: Function;
    /**
     * Determines whether status indicator is displayed or not.
     * @defaultvalue true.
     */
    showStatusIndicator?: boolean;
    cache?: boolean;
    replaceContent?: boolean;
}
/**
 * @publicapi
 */
export class AjaxPanelO<TOptions extends IAjaxPanelOptions> extends Controls.Control<TOptions> {
    static enhancementTypeName: string;
    private _cancelable;
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    _dispose(): void;
    /**
     * Begins loading the content using the specified arguments.
     *
     * @param url Url to load the content from.
     * @param params Url request paremeters.
     * @param callback Callback executed if the load succeeds.
     * @param errorcallback Callback executed if the load fails.
     * @publicapi
     */
    beginLoad(url: string, params?: any, callback?: Function, errorcallback?: Function): void;
    onLoadCompleted(content: any): void;
    onLoadError(error: any, handled: any): void;
    showError(error: any): void;
    private _cancelPendingLoad();
}
export class AjaxPanel extends AjaxPanelO<IAjaxPanelOptions> {
}
}
declare module "VSS/Controls/PopupContent" {
import Controls = require("VSS/Controls");
export class PopupContentControl extends Controls.BaseControl {
    private _$dropElement;
    private _$contentContainer;
    private _contentSet;
    private _documentEventDelegate;
    initialize(): void;
    setContent(content: any): void;
    show(): void;
    hide(): void;
    toggle(): void;
    _enhance($dropElement: any): void;
    private _decorate();
    private _handleDocumentMouseDown(e);
    _setPosition(): void;
    _getDropElement(): JQuery;
    private _onShow();
    private _onHide();
    _dispose(): void;
}
export class RichContentTooltip extends PopupContentControl {
    private _$popupTag;
    initializeOptions(options?: any): void;
    initialize(): void;
    _getPopupTooltipElement(): JQuery;
    _setPosition(): void;
}
}
declare module "VSS/Controls/RichEditor" {
import Controls = require("VSS/Controls");
export interface RichEditorAttachmentRequestData {
    fileName: string;
    binaryData: any;
}
export interface RichEditorAttachmentOperationResult {
    attachments: RichEditorAttachmentResult[];
}
export interface RichEditorAttachmentResult {
    Url: string;
}
export interface RichEditorAttachmentHandler {
    (attachment: RichEditorAttachmentRequestData): JQueryPromise<RichEditorAttachmentOperationResult>;
}
export type IRichEditorCommandHandler = (commandInfo: any, editor: RichEditor) => void;
export interface IRichEditorCommand {
    name: string;
    command: string;
    execute: IRichEditorCommandHandler;
}
export interface IRichEditorCommandGroup {
    groupName: string;
    commands: IRichEditorCommand[];
}
export interface IRichEditorOptions extends Controls.EnhancementOptions {
    id?: string;
    buttonGroups?: string[];
    customCommandGroups?: IRichEditorCommandGroup[];
    change?: Function;
    enabled?: boolean;
    waterMark?: string;
    fireOnEveryChange?: boolean;
    linkClickHandler?: Function;
    noToolbar?: boolean;
    blankPageUrl?: string;
    pageHtml?: string;
    internal: boolean;
}
/**
 * @exemptedapi
 */
export class RichEditor extends Controls.Control<IRichEditorOptions> {
    static enhancementTypeName: string;
    static BOLD_COMMAND: string;
    static ITALIC_COMMAND: string;
    static UNDERLINE_COMMAND: string;
    static INSERT_UNORDERED_LIST_COMMAND: string;
    static INSERT_ORDEREDLIST_COMMAND: string;
    static INDENT_COMMAND: string;
    static OUTDENT_COMMAND: string;
    static CREATE_LINK_COMMAND: string;
    static UNLINK_COMMAND: string;
    static INSERT_IMAGE_COMMAND: string;
    static RESTORE_COMMAND: string;
    static MAXIMIZE_COMMAND: string;
    static IMAGE_AUTOFIT_SCALE_FACTOR: number;
    static WATERMARK_CSS_CLASS: string;
    private _iframe;
    private _window;
    private _textArea;
    private _isReady;
    private _readyList;
    private _editable;
    private _toolbar;
    private _urlToolTip;
    private _hasFocus;
    private _explicitFocus;
    private _keyDownInDocument;
    private _customCommandHandlersMap;
    private _originalValue;
    private _currentValue;
    private _textAreaId;
    private _hasWaterMark;
    private _uploadAttachmentHandler;
    /**
     * Creates a new rich editor with the provided options
     */
    constructor(options: IRichEditorOptions);
    /**
     * @param options
     */
    initializeOptions(options?: IRichEditorOptions): void;
    _createIn(container: any): void;
    /**
     * @param element
     */
    _enhance(element: JQuery): void;
    ready(fn: any): void;
    isReady(): boolean;
    setEnabled(value: any): void;
    getValue(): string;
    isEmpty(value: any): boolean;
    setValue(value: any): void;
    /**
     * Inserts an image tag pointing to the specified url at the current caret position if possible.
     * If the current caret position cannot be determined, the image tag is inserted at the editor root node.
     *
     * @param url The url containing an image in which to link to the document.
     */
    insertImage(url: string): void;
    focus(): void;
    static getOffsetForLastElementSelection(lastElement: Element): number;
    selectText(collapseToEnd?: boolean): void;
    bindOnCopy(handler: any): void;
    getWindow(): Window;
    /**
     * Enables and shows the rich editor toolbar
     */
    enableToolbar(): void;
    /**
     * Disables and hides the rich editor toolbar.
     */
    disableToolbar(): void;
    private _resizeImageOnLoadComplete(url, loadCompleteCallback?);
    setInvalid(isInvalid: boolean): void;
    setUploadAttachmentHandler(handler: RichEditorAttachmentHandler): void;
    getTextAreaId(): any;
    /**
     * Checks whether the value of the control is changed or not and fires the CHANGE event if it has
     */
    checkModified(): void;
    private _pasteImage(url);
    private _getToolbar();
    private _createToolbar();
    /**
     * Creates a toolbar button group.
     *
     * @param customGroup An object representing a toolbar button group.
     */
    private _createToolbarButtonGroup(customGroup);
    private _showPanel(panel, opacity?);
    /**
     * @param opacity
     */
    private _showToolbar(opacity?);
    private _hideToolbar();
    private _getUrlToolTip();
    private _createUrlToolTip();
    private _showUrlToolTip(e?, doShow?);
    private _decorate();
    private _initialize();
    private _cleanUp();
    /**
     * Attaches necessary events to catch the changes if the control is enabled
     */
    private _attachEvents();
    private _detachEvents();
    /**
     * @param e
     * @return
     */
    private _onDblClick(e?);
    private _onDocumentReady();
    private _trySettingWaterMark(val);
    private _clearWaterMark(preventClearingValue?);
    /**
     * @param e
     * @return
     */
    private _onFocusIn(e?);
    /**
     * @param e
     * @return
     */
    private _onFocusOut(e?);
    private _onPaste(e?);
    private _doesStringItemExist(items);
    private _getImageItem(items);
    private _getRandomFileName(fileType?);
    private _onFileReadComplete(e, fileType?);
    private _uploadAttachment(attachment);
    private _onUploadComplete(result);
    private _onUploadError(error);
    /**
     * @param e
     * @return
     */
    private _onClick(e?);
    /**
     * @param e
     * @return
     */
    private _onMouseUp(e?);
    /**
     * @param e
     * @return
     */
    private _onMouseDown(e?);
    private _reTriggerEvent(e?);
    /**
     * @param e
     * @return
     */
    private _onKeyDown(e?);
    /**
     * @param e
     * @return
     */
    private _onKeyPress(e?);
    /**
     * @param e
     * @return
     */
    private _onKeyUp(e?);
    /**
     * @param e
     * @return
     */
    private _onInput(e?);
    /**
     * @param e
     */
    private _onToolbarButtonClick(e?, args?);
    private _getNodeUnderCaret(tagName);
    /**
     * Finds the node in the ancestors with the specified tag name
     */
    private _getNodeAncestor(node, tagName);
    /**
     *  Gets a W3C Range or Microsoft TextRange object depending on the running browser.
     * These object types are completely incompatible, so the caller must branch
     * on platform or simply compare for equality.
     */
    private _getTextRange();
    /**
     * Checks whether clicked element is a link and launches url
     *
     * @param e
     */
    private _checkForCtrlClick(e?);
    private _launchHref(e?);
    /**
     * launch the Url associated with a linkNode
     */
    private _processAndLaunchHref(linkNode, e?);
    private _executeCommand(commandInfo);
    /**
     * Creates a hyperlink in this window and selects the new link.
     *
     * @param args The new link address.
     */
    private _createHyperlink(args);
    private _setEditable(value);
    private _processReadyList();
    private _ensureControlReadiness();
    private _normalizeValue(value);
}
}
declare module "VSS/Controls/Search" {
import Controls = require("VSS/Controls");
import Search = require("VSS/Search");
/**
 * @interface
 * An interface for SearchBoxControl options
 */
export interface ISearchBoxControlOptions {
    /**
    * filterTitle: Optional: Tooltip for the control.
    */
    filterTitle?: string;
    /**
     * activateSearchHandler: Optional: Callback when the control is activated.
     */
    activateSearchHandler?: Function;
    /**
     * deactivateSearchHandler: Optional: Callback when the control is deactivated.
     */
    deactivateSearchHandler?: Function;
    /**
     * inputChangedEventHandler: Optional: When the control input changed.
     */
    inputChangedEventHandler?: Function;
    /**
     * hideWatermark: Optional: Set to true to hide watermark for the control.
     */
    hideWatermark?: boolean;
    /**
     * searchIconTooltip: Optional: Tooltip for the search icon of ToggleSearchBoxControl.
     */
    searchIconTooltip?: string;
}
/**
 * A input box control for search or filter.
 */
export class SearchBoxControl extends Controls.Control<ISearchBoxControlOptions> {
    private static inputChangedEventThrottlingInterval;
    private _$searchInputTextbox;
    private _$searchIcon;
    private _active;
    private _suppressBlur;
    private _activateSearchHandler;
    private _deactivateSearchHandler;
    private _inputChangedEventHandler;
    private _value;
    private _inputChangedEventHandlerReset;
    private _subsequentInputChange;
    constructor(options?: ISearchBoxControlOptions);
    initialize(): void;
    /**
     * Return the triming value of the input box.
     */
    getValue(): string;
    /**
     * Return the value of the input box.
     */
    private _getValue();
    /**
     * Displays the search box and hides the search button.
     */
    activateSearch(): void;
    /**
     * Removes the search box and shows the search button instead.
     */
    deactivateSearch(deactivateSearchHandler?: boolean): void;
    protected _displaySearchInputBox(isVisible: boolean): void;
    private _clearInput();
    private _createSearchInput();
    private _searchIconClickHandler(e?);
    private _bindInputChangedEventHandler();
    private _keyDown(e?);
    private _keyUp(e?);
    private _mouseDown(e?);
    private _mouseUp();
    private _mouseOut();
    /**
     * Handle the blur which deactivates search
     */
    private _handleBlur();
    /**
     * Handle the focus which activates search
     */
    private _handleFocus(e?);
}
export interface IToggleSearchBoxControlOptions extends ISearchBoxControlOptions {
    isDataSetComplete?: Function;
}
/**
 * A search icon control. When click, it expands to input box control for search or filter.
 */
export class ToggleSearchBoxControl extends SearchBoxControl {
    private _$searchIconContainer;
    private _isDataSetComplete;
    constructor(options?: IToggleSearchBoxControlOptions);
    initializeOptions(options?: any): void;
    initialize(): void;
    /**
     * Show the inputbox and hide the search icon.
     */
    activateSearch(): void;
    /**
     * Hide the inputbox and shows the search icon.
     */
    deactivateSearch(): void;
    private _addSearchToggleIcon();
    private _searchIconHoverIn();
    private _searchIconHoverOut();
    private _toggleSearchIcon(isVisible);
    private _searchIconKeyDownHandler(e?);
    private _searchIconkeyUpHandler(e?);
}
export interface ITextFilterControlOptions extends ISearchBoxControlOptions {
    adapter?: Search.SearchAdapter<any>;
    comparer?: IComparer<any>;
    delimiter?: string | RegExp;
}
export class TextFilterControl extends Controls.Control<ITextFilterControlOptions> {
    static tagName: string;
    static coreCssClass: string;
    _textFilterInput: SearchBoxControl;
    _searchCore: Search.SearchCore<any>;
    private _active;
    private _suppressBlur;
    _searchAdapter: Search.SearchAdapter<any>;
    /**
     * Control for backlog search.
     *
     * @param options Options for the control
     */
    constructor(options?: ITextFilterControlOptions);
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    isActive(): boolean;
    /**
     * Initializes the control. Creates the search box and initializes events.
     */
    initialize(): void;
    protected _createSearchStrategy(): Search.SearchStrategy<any>;
    private _createSearchInputBox();
    /**
     * Displays the search box and hides the search button
     */
    activateSearch(): void;
    /**
     * Removes the search bar and shows the search button instead
     *
     * @param suppressClear Suppress the clearing event
     */
    deactivateSearch(suppressClear?: boolean): void;
    /**
     * Creates the index in the searchCore
     */
    createIndex(): void;
    /**
     * Clears the index in the Search Core
     */
    clearIndex(): void;
    /**
     * Clears the store and performs the search if search is active.
     */
    refreshResults(): void;
    /**
     * Handle input changed event.
     */
    attachEventOnKeyUp(e?: JQueryEventObject): void;
    /**
     * Perform the search.
     */
    _performSearch(): void;
}
}
declare module "VSS/Controls/Splitter" {
import Controls = require("VSS/Controls");
/**
 * @publicapi
 */
export interface ISplitterOptions {
    /**
     * Initial size of the grid in px.
     */
    initialSize?: number;
    /**
     * Specifies which side of the splitter is fixed (left or right).
     * @defaultvalue "left"
     */
    fixedSide?: string;
    /**
     * Specifies whether the split should be vertical or not.
     * @defaultvalue true
     */
    vertical?: boolean;
    /**
     * Text displayed on splitter handle when toggle button is enabled and splitter is collapsed.
     */
    collapsedLabel?: string;
    /**
     * Enables the toggle button which displays a button for expand/collapse.
     * @defaultvalue false
     */
    enableToggleButton?: boolean;
    animationSpeed?: number;
    expandState?: string;
    /**
     * Sets the minimum width of the splitter's fixed side.
     */
    minWidth?: number;
    /**
     * Sets the maximum width of the splitter's fixed side.
     */
    maxWidth?: number;
}
/**
 * @publicapi
 */
export class SplitterO<TOptions extends ISplitterOptions> extends Controls.Control<TOptions> {
    static enhancementTypeName: string;
    private static _noSplitCssClass;
    static CORE_CSS_CLASS: string;
    static HORIZONTAL_CLASS: string;
    static VERTICAL_CLASS: string;
    static TOGGLE_BUTTON_LENGTH: number;
    static TOGGLE_BUTTON_MARGIN: number;
    static COLLAPSED_CLASS_NAME: string;
    static TOGGLE_BUTTON_ENABLED_CLASS_NAME: string;
    static TOGGLE_BUTTON_HOTKEY_ENABLED_CLASS_NAME: string;
    static AUTO_COLLAPSE_THRESHOLD: number;
    static DEFAULT_ANIMATION_SPEED: number;
    static HANDLE_BAR_CLONE_SIZE: number;
    private _screenXY;
    private _cssPosProp;
    private _cssSizeProp;
    private _leftFix;
    private _fixedSide;
    private _fillSide;
    private _deltaMultiplier;
    private _dragStart;
    private _fixedSidePixels;
    private _splitterOverlay;
    private _$handleBarClone;
    private _ignoreWindowResize;
    private _$toggleButton;
    private _$toggleButtonIcon;
    private _minWidth;
    private _maxWidth;
    leftPane: JQuery;
    rightPane: JQuery;
    handleBar: JQuery;
    expandState: string;
    constructor(options: TOptions);
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    /**
     * @param element
     */
    _enhance(element: JQuery): void;
    initialize(): void;
    private _setInitialSize();
    /**
     * Sets the minimum width of the splitter's fixed side.
     *
     * @param minWidth minimum number of pixels the fixed side will fill.
     * @publicapi
     */
    setMinWidth(minWidth: number): void;
    /**
     * Sets the maximum width of the splitter's fixed side.
     *
     * @param maxWidth maximum number of pixels the fixed side will fill.
     * @publicapi
     */
    setMaxWidth(maxWidth: number): void;
    /**
     * Resize the fixed side of the splitter to the specified size.
     *
     * @param newSize New fixed side size in px.
     * @param suppressFireResize Determines whether to suppress firing resize event or not.
     * @param useAnimation Determines whether to use animation during resize or not.
     * @publicapi
     */
    resize(newSize: any, suppressFireResize?: boolean, useAnimation?: boolean): void;
    /**
     * Expand or collapse the splitter.
     *
     * @param expanded True to expand the splitter, false to collapse it. If not provided, the expansion state toggles.
     */
    toggleExpanded(expanded?: boolean): void;
    /**
     * Expands the splitter.
     * @publicapi
     */
    expand(): void;
    /**
     * Collapses the splitter.
     * @publicapi
     */
    collapse(): void;
    /**
     * Specifies whether the splitter is expanded or not.
     *
     * @returns {boolean}
     * @publicapi
     */
    isExpanded(): boolean;
    /**
     * @param suppressResize
     */
    removeExpand(suppressResize?: boolean): void;
    /**
     * @param side
     */
    protected _expandInternal(side?: string): void;
    /**
     * Gets the fixed side size in px.
     *
     * @returns {number}
     * @publicapi
     */
    getFixedSidePixels(): number;
    /**
     * @param visible
     */
    toggleSplit(visible?: boolean, animate?: boolean, defaultExpandToPixels?: number): void;
    /**
     * Disables the split.
     * @publicapi
     */
    noSplit(animate?: boolean): void;
    /**
     * Enables the split.
     *
     * @param animate Determines split operation is animated or not (default false).
     * @param defaultExpandToPixels Specified value used for split amount. If not specified default value is used.
     * @publicapi
     */
    split(animate?: boolean, defaultExpandToPixels?: number): void;
    /**
     * @param newSize
     */
    toggleOrientation(vertical: any, newSize?: number): void;
    /**
     * Changes split orientation to vertical.
     * @publicapi
     */
    vertical(): void;
    /**
     * Changes split orientation to horizontal.
     * @publicapi
     */
    horizontal(): void;
    /**
     * Sets the label that is shown when the splitter is collapsed
     *
     * @param labelText Text displayed when the splitter is collapsed (null/empty for none)
     * @publicapi
     */
    setCollapsedLabel(labelText: string): void;
    _createElement(): void;
    private _configureCssProps();
    private _attachEvents();
    /**
     * Gets the collapse/expand toggle button of this splitter control.
     */
    private _ensureToggleButton();
    /**
     * Re-position the toggle button.
     *
     * @param useAnimation true if the layout change is animated; false, otherwise.
     */
    private _layoutToggleButton(useAnimation?);
    /**
     * Set toggle button icon class for rendering
     *
     * @param isExpanded true if to show expanded icon; false, otherwise.
     */
    private _setToggleButtonIconClass(isExpanded);
    /**
     * Sets the tooltip for the toggle button.
     */
    private _setToggleButtonTooltip();
    /**
     * Measures the full size of the fixed side pane.
     */
    private _measureFixedSide();
    private _handleBarMouseDown(e?);
    /**
     * Checks if the toggle button is enabled.
     */
    private _isToggleButtonEnabled();
    /**
     * Checks if the toggle button hotkey is enabled.
     */
    private _isToggleButtonHotkeyEnabled();
    /**
     * Checks if the splitter is marked as collapsed.
     */
    private _isCollapsed();
    /**
     * Handles the keyup event for the document.
     *
     * @param e
     * @return
     */
    private _onDocumentKeyup(e?);
    /**
     * Handles the click event for the toggle button.
     *
     * @param e
     * @return
     */
    private _onToggleButtonClick(e?);
    /**
     * Ensures that a clone of the handlebar is available.
     */
    private _ensureHandleBarClone();
    /**
     * Removes the handlebar clone.
     */
    private _removeHandleBarClone();
    private _setupDragEvents();
    private _ensureOverlay();
    private _removeOverlay();
    private _clearDragEvents();
    /**
     * @param e
     * @return
     */
    private _documentMouseMove(e?);
    /**
     * @param e
     * @return
     */
    private _documentMouseUp(e?);
    private _onWindowResize();
    private _fireWindowResize();
    /**
     * Attaches the splitter to the window resize event, performing a resize immediately if specified
     * by the input parameter. This is primarily useful for attaching to the resize event after the
     * splitter has just been re-attached to the DOM and needs to see if the viewwport size has changed.
     *
     * @param resizeNow Whether or not the splitter should perform resize now.
     */
    attachResize(resizeNow?: boolean): void;
    /**
     * Detaches the splitter from the window resize event (tells it to ignore the event).
     */
    detachResize(): void;
    /**
     * Creates an option object to be used with $.animate().
     *
     * @param cssPropertyName The CSS property for the animation.
     * @param cssPropertyValue The target CSS property value for the animation.
     */
    private _createAnimationOption(cssPropertyName, cssPropertyValue);
    /**
     * @param e
     * @return
     */
    private _handleBarDoubleClick(e?);
    _dispose(): void;
}
export class Splitter extends SplitterO<ISplitterOptions> {
}
}
declare module "VSS/Controls/StatusIndicator" {
import Controls = require("VSS/Controls");
import Utils_Core = require("VSS/Utils/Core");
export interface IStatusIndicatorOptions {
    message?: string;
    eventTarget?: any;
    imageClass?: string;
    center?: boolean;
    throttleMinTime?: number;
    statusStartEvent?: string;
    statusCompleteEvent?: string;
    statusErrorEvent?: string;
}
export class StatusIndicatorO<TOptions extends IStatusIndicatorOptions> extends Controls.Control<TOptions> {
    static enhancementTypeName: string;
    private _statusDiv;
    private _image;
    private _throttleMinTime;
    private _delayStart;
    private _lastError;
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    _dispose(): void;
    /**
     * @param event
     */
    start(options?: IStatusIndicatorOptions): void;
    /**
     * @param delay
     */
    delayStart(delay: number): void;
    complete(): void;
    error(error: Error): void;
    setMessage(message: string): void;
    showElement(): void;
    hideElement(): void;
    private _draw();
    private _start();
    private _onClick();
    private _setImageClass();
    private _bindEvents();
    private _error(e?, xhr?, settings?, exception?);
    private _startHandler(event, options?);
    private _clearTimeout();
}
export class StatusIndicator extends StatusIndicatorO<IStatusIndicatorOptions> {
}
export class LongRunningOperation {
    private _cancelable;
    private _options;
    private _$rootElement;
    private _waitControl;
    private _state;
    private _cancelled;
    /**
     * Creates a new long running operation, showing a blocking indicator in a cancellable means overtop the specified container until the operation has completed.
     *
     * @param container A DOM object that contains the control on the page in which to overlay the progress indicator.
     * @param options A collection of configuration name/value pairs.  The following are supported:
     *     Name                  Type        Value
     *     cancellable           boolean     Boolean value indicating whether the operation may be cancelled while it is running.
     *
     */
    constructor(container: any, options?: any);
    /**
     * Begins the long running operation, invoking the specified operationCallback when necessary.
     *
     * @param operationCallback An operation that may take a long time to complete.
     */
    beginOperation(operationCallback: IResultCallback): void;
    protected createWaitControl(options: IWaitControlOptions): WaitControl;
    protected getCancellableOperation(): Utils_Core.Cancelable;
    getWaitControl(): WaitControl;
    /**
     * Signals the completion of a long running operation.
     */
    endOperation(): void;
    /**
     * Gets a boolean value indicating whether the current operation has a pending cancel request.
     */
    isCancelled(): boolean;
    /**
     * Cancels the current operation.
     */
    cancelOperation(): void;
    /**
     * Initializes the long running operation.
     */
    private _initialize();
}
export enum WaitingState {
    NotStarted = 0,
    Waiting = 1,
    Ending = 2,
    Ended = 3,
    Cancelling = 4,
    Cancelled = 5,
}
/**
 * @publicapi
 */
export interface IWaitControlOptions extends Controls.EnhancementOptions {
    /**
     * Target element in which an overlay and a message box is displayed. If not specified, whole window is used.
     * @defaultvalue window
     */
    target?: JQuery;
    /**
     * Text to be displayed in the message box.
     */
    message?: string;
    /**
     * Message format used if the cancellable is true. Defaut value is {message}({cancelText}).
     */
    messageFormat?: string;
    /**
     * Specifies whether this is control is cancellable or not. If yes, a cancel link is displayed in the message box.
     * @defaultvalue false
     */
    cancellable?: boolean;
    /**
     * Cancel text format used when displaying cancel text.
     * @defaultvalue "Press {0} to cancel"
     */
    cancelTextFormat?: string;
    /**
     * Callback executed when the control is cancelled.
     */
    cancelCallback?: Function;
    /**
     * Sepcifies whether to fade out the message box when the operation is cancelled or ended.
     * @defaultvalue true
     */
    fade?: boolean;
    /**
     * Specifies the amount of delay in milliseconds when the message box is displayed.
     * @defaultvalue 250
     */
    showDelay?: number;
    /**
     * Overlay color.
     */
    backgroundColor?: string;
    /**
     * Progress image to be displayed.
     */
    image?: string;
    messageElement?: JQuery;
    element?: JQuery;
    entireWindow?: boolean;
    cancelLinkId?: string;
    extraStyles?: string;
    minLifetime?: number;
    minLifeSpanBlocking?: boolean;
}
export interface WaitContext {
    instanceId?: string;
    options?: {
        wait: IWaitControlOptions;
    };
    cancellable?: Utils_Core.Cancelable;
    showTimer?: Utils_Core.DelayedFunction;
}
/**
 * @publicapi
 */
export class WaitControlO<TOptions extends IWaitControlOptions> extends Controls.Control<TOptions> {
    private static _instanceIdSeed;
    static DefaultShowDelay: number;
    static MinLifeTime: number;
    private _originalFocusElement;
    private _context;
    private _state;
    private _keyDownEventHandler;
    /**
     * Constructs a WaitControl object.
     *
     * @param options The options to initialize the control. It has the following properties:
     *   {
     *       image: hostConfig.getResourcesFile('big-progress.gif'),   // optional
     *       message: "Please wait...",                                // optional
     *       target: $('.feedbackrequest-form-container')              // optional
     *       cancellable: true                                         // optional
     *       cancelCallback: function() { // do something }            // optional and only effective when cancellable is true
     *   }
     *
     * @return A WaitControl object.
     */
    constructor(options?: TOptions);
    initializeOptions(options: TOptions): void;
    initialize(): void;
    /**
     * Starts waiting by displaying message box and overlay in the target element.
     *
     * @param cancelable A VSS.Core.Cancelable object for additional cancel state signaling.
     * @publicapi
     */
    startWait(cancellable?: Utils_Core.Cancelable): void;
    /**
     * Ends waiting by removing message box and overlay.
     * @publicapi
     */
    endWait(): void;
    /**
     * Cancels waiting by removing message box and overlay.
     * @publicapi
     */
    cancelWait(): void;
    /**
     * Sets a new message for the displayed message box.
     *
     * @param message Message to be displayed.
     * @publicapi
     */
    setMessage(message: string): void;
    /**
     * Indicates whether the operation is cancelled or not.
     *
     * @returns {boolean}
     * @publicapi
     */
    isCancelled(): boolean;
    /**
     * Determines if the current waiting session can be started.
     */
    private _canStartWait();
    /**
     * Determines if the current waiting session can be ended.
     */
    private _canEndWait();
    /**
     * Determines if the current waiting session can be cancelled.
     */
    private _canCancelWait();
    /**
     * Starts the waiting.
     */
    private _startWait();
    /**
     * Ends the waiting.
     */
    private _tryEndWait();
    /**
     * Cancels the waiting.
     */
    private _tryCancelWait();
    /**
     * Resets this wait control.
     */
    private _reset();
    protected updateWaitElements(wait: IWaitControlOptions): void;
    /**
     * Shows the wait control.
     */
    private _showWait();
    protected getWaitingState(): WaitingState;
    protected getWaitingContext(): WaitContext;
    /**
     * Resizes the waiting control.
     */
    private _resizeWait();
    /**
     * Handles the keydown event.
     *
     * @param e
     * @return
     */
    private _onKeyDown(e?);
    /**
     * Handles the events to cancel wait.
     *
     * @param e
     * @return
     */
    private _handleCancelEvent(e?);
    /**
     * Binds the keydown event
     *
     * @param cancelLinkId The id of the cancel hyperlink.
     */
    private _bindKeydownEvent(cancelLinkId);
    /**
     * Unbinds the keydown event
     */
    private _unbindKeydownEvent();
    /**
     * Removes the wait element.
     */
    private _removeWaitElement();
    /**
     * Removes the timers used by this controls.
     */
    private _removeShowTimer();
    /**
     * Gets the unique resize event id for the wait control.
     *
     * @return The resize event id.
     */
    private _getResizeEventId(instanceId);
    /**
     * Gets the text message to show in the wait control.
     *
     * @param wait The wait options.
     */
    private _getWaitMessage(wait);
    getWaitMessageFormatString(): string;
}
export class WaitControl extends WaitControlO<IWaitControlOptions> {
}
}
declare module "VSS/Controls/TabContent" {
import Controls = require("VSS/Controls");
import Dialogs = require("VSS/Controls/Dialogs");
/**
 * The tab groups with tabs for the tab control
 */
export interface ITabGroup {
    /**
     * The registered group id that uniquely identify a group
     */
    id: string;
    /**
     * The group title that displays on the tab collection
     */
    title: string;
    /**
     * The order of the tab group that shows on the tab control
     */
    order: number;
    /**
     * The tabs for the tab group
     */
    tabs: ITab<any>[];
}
/**
 * The tabs in a tab group
 */
export interface ITab<T> {
    /**
     * The registered tab id that uniquely identify a tab
     */
    id: string;
    /**
     * The tab title that displays on the tab control
     */
    title: string;
    /**
     * The order of the tab that shows within the tab group.
     */
    order: number;
    /**
     * Retrieves the ITabContent instance for the content tab
     */
    tabContent: new (options?: T) => ITabContent;
    /**
     * The options object of the tab content.
     */
    tabContentOptions?: T;
}
/**
 * The interface for user to register a tab to a tab control
 */
export interface ITabRegistration<T> {
    /**
     * The registered group id that uniquely identify a group
     */
    groupId: string;
    /**
     * The registered tab id that uniquely identify a tab. When it is not defined, a GUID will be generated to be the id.
     */
    id?: string;
    /**
     * The tab title that displays on the tab control. When it is not defined, it will append to the existing tabs in the tab group.
     */
    title: string;
    /**
     * The order of the tab that shows within the tab group.
     */
    order?: number;
    /**
     * Retrieves the ITabContent instance for the content tab
     */
    tabContent: new (options?: T) => ITabContent;
    /**
     * The option object of the tab content.  When it is not defined, an empty object will be created.
     */
    tabContentOptions?: T;
}
/**
 * The interface for user to register a tab group
 */
export interface ITabGroupRegistration {
    /**
     * The id for the targeted tab control
     */
    tabControlId: string;
    /**
     * The group id that uniquely identify a group
     */
    id: string;
    /**
     * The group title
     */
    title: string;
    /**
     * The order of the tab group that shows on the tab control. When it is not defined, it will append to the existing groups.
     */
    order?: number;
}
/**
 * The tab page content instantiate when a tab is registered to the control.
 */
export interface ITabContent {
    /**
     * This method is called when user clicks on the tab for the first time.
     */
    beginLoad?($container: JQuery): IPromise<any>;
    /**
     * Begin persisting user changes
     * Returns a promise that in turn returns a boolean flag, indicating whether the current save operation requires page refresh or not
     */
    beginSave?(): IPromise<boolean>;
    /**
     * Indicates if the control is dirty
     */
    isDirty(): boolean;
    /**
     * Accepts the event handlers for onDirtyStateChanged and onValidStateChanged events
     */
    registerStateChangedEvents?(eventHandler: Function): void;
    /**
     * Optional method. When navigation mode for tab control is set to "CUSTOMIZED",
     * the method is called to see if user is allowed to leave the tab.
     */
    onTabChanging?(): boolean;
    /**
     * Optional method. When defined, it is called when user clicks back to the tab.
     * This method will NOT be called for the first time user clicks the tab, use beginLoad($container) instead.
     */
    onTabActivated?(initialLoad: boolean): void;
    /**
     * Optional method. Called when the control is getting resized.
     */
    onResize?(): void;
    /**
    * This is the callback after content has been saved.
    */
    applyChanges?: Function;
    /**
     * Optional method. Called when the control is getting disposed.
     */
    dispose?(): void;
}
/**
* The enum for tab control saving result status
*/
export enum TabSavingStatus {
    /**
     * user input in invalid, no server saving is issued.
     */
    INVALID_USER_INPUT = 0,
    /**
     * error in server saving
     */
    SERVER_SAVING_ERROR = 1,
    /**
     * server saving succeeded
     */
    SUCCEEDED = 2,
    /**
     * dirty flag is clean, no server saving is issued.
     */
    NO_CHANGE = 3,
}
/**
* The enum for tab control saving mode
*/
export enum TabControlSavingMode {
    /**
     * Content control is responsible for saving, tab control doesn't provide any saving mechanizm
     */
    NONE = 0,
    /**
     * Saving is on tab level
     */
    APPLY_ON_TAB = 1,
    /**
     * Saving is on control level, user needs to call beginSave method on tabControl
     */
    SAVE_ON_CONTROL = 2,
}
/**
* The enum for tab control navigation mode
*/
export enum TabControlNavigationMode {
    /**
     * Always allow user to navigate away from current tab
     */
    ALWAYS_NAVIGATE = 0,
    /**
     * Call tabContentControl onTabChanging() to determine if user can navigate away from current tab. If onTabChanging()
     * is not defined, allow user to navigate away.
     */
    CUSTOMIZED = 1,
}
/**
* The tab control option
*/
export interface ITabControlOption {
    /**
     * The tab groups and tabs for the control to render tabs.
     * When it is not defined, the control will try to get the tab groups from tab registration.
     */
    groups?: ITabGroup[];
    /**
     * The saving mode for the control.
     */
    savingMode: TabControlSavingMode;
    /**
     * The generic saving error message. Displayed when TabControlSavingMode is set to SAVE_ON_CONTROL.
     */
    errorMessage?: string;
    /**
     * Used to get the tab groups from tab registration.
     * User has to specify either groups or id, when both specified, it will use groups for tab generation.
     */
    id?: string;
    /**
     * Used to set the default tab while initializing the control.
     * If not specified, the default tab would be the first tab in the list.
     */
    defaultTabId?: string;
    /**
     * Hides the tabs titles area if true
     */
    hideTabsPane?: boolean;
}
/**
 * A control for content across multiple tabs.
 */
export class TabControl extends Controls.Control<ITabControlOption> {
    static EVENT_DIRTY_STATE_CHANGED: string;
    static EVENT_VALID_STATE_CHANGED: string;
    static EVENT_SAVING_STATE_CHANGED: string;
    private _activeTab;
    private _groups;
    private _tabPages;
    private _$tabControlOverlay;
    private _statusIndicator;
    private _$settingsMessageArea;
    private _$settingsMessageTextArea;
    private _$contentContainerElement;
    private _navigationMode;
    private _savingMode;
    private _isDirty;
    private _isSaving;
    private _$tabTitles;
    private _$tabTitleContainer;
    private _refreshOnClose;
    private _onSavedCallbackList;
    private _arrowScrollbar;
    /**
     * @param options
     */
    initializeOptions(options?: ITabControlOption): void;
    /**
     * Initialize the control
     */
    initialize(): void;
    private _addScrollSupport($scrollContainer, $scrollContent);
    private _getTabGroup();
    private _createMessageArea($element);
    /**
     * Recalculate the size and update the navigation buttons
     */
    onResize(): void;
    /**
     * Check the dirty states for the all tab pages
     * @return True if any of the tab pages is dirty
     */
    isDirty(): boolean;
    /**
     * Check the saving states for the all tab pages
     * @return True if any of the tab pages is saving
     */
    isSaving(): boolean;
    invokeSaveCallbacks(): void;
    clearOnSavedCallbackList(): void;
    getRefreshOnCloseStatus(): boolean;
    private _createTabControl(groupTitle, tab, titleContainer, contentContainer, savingMode, navigationMode);
    private _onTabChanged(tab);
    private _onTabChanging();
    private _onTabSaved(result);
    private _onSavingStateChanged();
    private _onDirtyStateChanged();
    private _showError(message?);
    private _hideError();
    /**
     * Check if there is an invalid page. Focus on the first invalid page if there is any.
     * Begin to persist user changes by iterate all the tab pages and call the beginSave() for each page if it is dirty and valid
     * @param e The event that trigger the saving
     * @return JQueryPromise for saving content. Fullfilled when all the pages are saved successfully and rejected when any one of them get rejected.
     */
    beginSave(e?: JQueryEventObject): IPromise<TabSavingStatus>;
    private _showOverlay(text, options?);
    private _hideOverlay();
    dispose(): void;
}
/**
 * The tab page option
 */
export interface ITabPageOption {
    /**
     * The tab information associated with tab page
     */
    tab: ITab<any>;
    /**
     * Dom element to host the tab title
     */
    titleContainer: JQuery;
    /**
     * Dom element to host the tab content
     */
    contentContainer: JQuery;
    /**
     * callback function after tab changed
     */
    onTabChanged: Function;
    /**
     * callback function when tab changing
     */
    onTabChanging: Function;
    /**
     * callback function after tab saved
     */
    onTabSaved: Function;
    /**
     * callback function when saving state changes
     */
    onSavingStateChanged: Function;
    /**
     * callback function when dirty state changes
     */
    onDirtyStateChanged: Function;
    /**
     * navigation mode from tab control
     */
    navigationMode: TabControlNavigationMode;
    /**
     * saving mode from tab control
     */
    savingMode: TabControlSavingMode;
    /**
     * If set to true, the control will handle the server errors and the individual tabs should handle only the client-side validation errors
     */
    handleServerError?: boolean;
}
/**
 * A base class for the all the tab content classes that implement the ITabContent.
 * You can start with other class, but make sure you implement ITabContent.
 */
export class TabContentBaseControl extends Controls.BaseControl implements ITabContent {
    private _isDirty;
    private _isValid;
    private _onDirtyStateChanged;
    constructor(options?: any);
    /**
     * Gets the dirty state for the content control
     * @return boolean
     */
    isDirty(): boolean;
    /**
     * Method that lets the container specify the delegates to be called on state change in the tab content
     * @param onDirtyStateChanged The delegate for the dirty state transition
     */
    registerStateChangedEvents(onDirtyStateChanged: Function): void;
    /**
     * Method that renders the actual control
     * @param $container The DOM element, to which the control should be added
     * @return IPromise Resolve if render successfully, reject if failed
     */
    beginLoad($container: JQuery): IPromise<any>;
    /**
     * Set the dirty state for the content control, make sure call this for any dirty state change
     * @param isDirty
     */
    fireDirtyFlagChange(isDirty: boolean): void;
    /**
     * Begin to persist user changes, make sure you overwrite this
     * @return JQueryPromise for saving content.
     */
    beginSave(): IPromise<boolean>;
    dispose(): void;
}
/**
 * Page scoped registration for tab controls, this is the place for tabControl to get tab group when group is not specified in the option.
 */
export class TabControlsRegistration {
    private static _tabControlRegistrations;
    private static _orderGap;
    private static _orderInitValue;
    /**
     * Register a group to a tabControl
     * If the groupId has been registered to the control, it will error out
     * @param groupRegistration The group that needs to be registered
     */
    static registerTabGroup(groupRegistration: ITabGroupRegistration): void;
    /**
     * Get a list of tab groups for a tab control
     * @param tabControlId
     * @return a list of tab groups
     */
    static getRegisteredTabGroups(tagControlId: string): ITabGroup[];
    /**
     * Register a tab for tab group.
     * The groupId is not registered, call registerTabGroup first
     * If id is provided, the tab will be registered with that id. If not, the tab will get a generated Guid as id.
     * If the provided id has been registered for that group, the request will error out.
     * @param registration a tab and group
     * @return id of the tab
     */
    static registerTab<T>(registration: ITabRegistration<T>): string;
    /**
     * Remove a tab by Id for a tab control
     * @param tabControlId for the targeted tab control
     * @param id for tab
     */
    static removeTab(tabControlId: string, id: string): void;
    /**
     * Remove a tab group by group Id for a tab control
     * @param tabControlId for the targeted tab control
     * @param groupId for tab group
     */
    static removeTabGroup(tabControlId: string, groupId: string): void;
    /**
     * Remove tab registrations for a tab control when tabControlId is provided
     * Remove all tab registrations if tabControlId is not present
     * @param tabControlId for the targeted tab control
     */
    static clearRegistrations(tabControlId?: string): void;
    private static _sortTabGroups(groups);
    private static _sortTabs(tabGroup);
    private static _getNextGroupOrder(groups);
    private static _getNextTabOrder(tabgroup);
    private static _createNewTab<T>(tabGroup, tabRegistration);
}
/**
 * The interface for each button on a TabbedDialog
 */
export interface ITabbedDialogButton {
    /**
     * The id for the button, unique within the control
     */
    id: string;
    /**
     * Display text of the button
     */
    text: string;
    /**
     * Handler for click event
     */
    click: () => void;
    /**
     * Indicates the button should be disabled until changes are made in the dialog
     */
    enableOnDirty?: boolean;
    /**
     * Indicates the button is currently disabled
     */
    disabled?: string;
}
/**
 * The TabbedDialog options
 */
export interface TabbedDialogOptions extends Dialogs.IModalDialogOptions {
    /**
     * Id for the TabControl
     */
    tabControlId: string;
    /**
     * Id of the default tab selected when the dialog opens
     */
    defaultTabId?: string;
    /**
     * List of tab groups on the dialog
     */
    groups?: ITabGroup[];
    /**
     * Optional: custom button set to override the default
     */
    customButtons?: ITabbedDialogButton[];
    /**
     * Indicates whether the dialog should prompt the user to save changes before closing
     */
    confirmUnsavedChanges?: boolean;
    /**
     * Indicates whether the dialog should display the tabs on the side. Defaults to false.
     */
    hideTabsPane?: boolean;
}
/**
 * Modal dialog which implements TabContent
 */
export class TabbedDialog extends Dialogs.ModalDialogO<TabbedDialogOptions> {
    private _control;
    private static ON_RESIZE_THROTTLE_TIME;
    private _resizeThrottleDelegate;
    private _groups;
    constructor(options?: any);
    initializeOptions(options?: any): void;
    initialize(): void;
    private _registerTabGroup(group);
    private _registerTab(tab, groupId);
    private _refreshButton();
    private _getButtons(editModeOn);
    private _getDefaultButtons();
    /**
     * Updates button's status
     * @param button The button Id
     * @param enabled True if the button needs to be enabled
     */
    private _updateButton(button, enabled);
    beforeClose(e?: any, ui?: any): boolean;
    private _evaluateOnCloseStrategy();
    onOkClick(e?: JQueryEventObject): void;
    onCancelClick(e?: JQueryEventObject): void;
    dispose(): void;
}
}
declare module "VSS/Controls/TreeView" {
import Combos = require("VSS/Controls/Combos");
import Controls = require("VSS/Controls");
export class TreeDataSource extends Controls.BaseDataSource {
    root: any;
    constructor(options?: any);
    setSource(source: any): void;
    /**
     * @param source
     */
    prepareSource(source?: any): void;
    /**
     * Update the flat content representation from the current tree
     */
    updateItemsFromSource(): void;
    /**
     * @param all
     * @param textOnly
     * @return
     */
    getItemText(index: any, all?: any, textOnly?: any): string;
    /**
     * @param startsWith
     * @param all
     */
    getItemIndex(itemText: any, startsWith?: any, all?: any): any;
    expandNode(node: any): void;
    collapseNode(node: any): void;
    _initRoot(): void;
    private _prepareCurrentItems();
}
/**
 * @publicapi
 */
export interface ITreeOptions {
    /**
     * List of nodes used by TreeView for rendering. TreeView only accepts nodes of concrete type TreeNode. Existing node hierarchy needs to be converted to TreeNode before providing to TreeView, see samples for details.
     */
    nodes?: TreeNode[];
    /**
     * Determines whether icons of the nodes are visible or not.
     * @defaultvalue true
     */
    showIcons?: boolean;
    /**
     * Determines whether clicking a node expands/collapses the node or not (if the node has children).
     * @defaultvalue false
     */
    clickToggles?: boolean;
    /**
     * Determines whether clicking a node selects the node or not.
     * @defaultvalue true
     */
    clickSelects?: boolean;
    contextMenu?: any;
    useEmptyFolderNodes?: boolean;
    defaultEmptyFolderNodeText?: string;
    styleFocusElement?: boolean;
    /**
     * Defines "droppable" options for drag and drop (see jQuery UI droppable options)
     */
    droppable?: any;
    /**
     * Defines "draggable" options for drag and drop (see jQuery UI draggable options)
     */
    draggable?: any;
    /**
     * Specifies whether to use the modern bowtie styling (bowtie styles are in preview and subject to change).
     * @defaultvalue false
     */
    useBowtieStyle?: boolean;
}
/**
 * @publicapi
 */
export class TreeNode {
    /**
     * @param text
     * @param config
     * @param children
     * @return
     */
    static create(text: string, config?: any, children?: TreeNode[]): TreeNode;
    id: any;
    root: boolean;
    text: string;
    parent: TreeNode;
    children: TreeNode[];
    config: any;
    expanded: boolean;
    selected: boolean;
    icon: any;
    tag: any;
    noFocus: boolean;
    noContextMenu: boolean;
    noTreeIcon: boolean;
    folder: any;
    type: any;
    link: string;
    title: string;
    droppable: any;
    iterationPath: string;
    definition: any;
    linkDelegate: any;
    hasExpanded: boolean;
    owner: any;
    application: any;
    emptyFolderNodeText: string;
    isEmptyFolderChildNode: boolean;
    isSearchHit: boolean;
    /**
     * @param text
     * @param config
     * @param children
     * @param id
     */
    constructor(text: string, config?: any, children?: TreeNode[], id?: string);
    hasChildren(): boolean;
    clear(): void;
    remove(): void;
    add(node: TreeNode): void;
    /**
     *  Move this node to reside under the specified new parent.
     *
     * @param newParent The destination to reparent the source under.
     */
    moveTo(newParent: any): void;
    addRange(nodes: any): void;
    /**
     * Finds a node using the given path
     *
     * @param path Path to find
     * @param sepChar Path separator, if not given default will be used
     * @param comparer Comparer used to compare nodes in the path, if not given default will be used
     */
    findNode(path: string, sepChar?: string, comparer?: (a: string, b: string) => number): TreeNode;
    sort(recursive: any, treeNodeComparer: any): void;
    path(includeRoot: any, sepChar: any): any;
    level(noRoot: any): number;
    getContributionContext(): TreeNode;
    private _ensureNodeId();
    private _sort(recursive, treeNodeComparer);
}
/**
 * @publicapi
 */
export class TreeViewO<TOptions extends ITreeOptions> extends Controls.Control<TOptions> {
    static _typeName: string;
    static NODE_DATA_NAME: string;
    static LEVEL_DATA_NAME: string;
    static EXPANDED_CLASS: string;
    static COLLAPSED_CLASS: string;
    private _focusDelegate;
    private _blurDelegate;
    private _dragStartDelegate;
    private _hasFocus;
    private _draggable;
    private _droppable;
    _focusedNode: JQuery;
    private _popupMenu;
    rootNode: TreeNode;
    _selectedNode: TreeNode;
    /**
     * Creates new Grid Control
     */
    constructor(options?: any);
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    _draw(): void;
    /**
     * Gets the DOM element associated with the specified node

     * @param node Node associated with the seeked DOM element
     * @returns {JQuery}
     */
    _getNodeElement(node: TreeNode): JQuery;
    /**
     * Gets the node associated with the element
     *
     * @param $element The jQuery object wrapping the tree node's DOM element
     * @returns {TreeNode}
     */
    _getNode($element: JQuery): TreeNode;
    /**
     * Gets the currently selected node.
     *
     * @returns {TreeNode}
     * @publicapi
     */
    getSelectedNode(): TreeNode;
    /**
     * Sets the specified node as selected.
     
     * @param node Node to be selected.
     * @param suppressChangeEvent If specified true, "selectionChanged" event will not fire.
     * @publicapi
     */
    setSelectedNode(node: TreeNode, suppressChangeEvent?: boolean): void;
    focus(): void;
    _expandNodeParents(node: any, suppressChangeEvent?: boolean): void;
    _updateSelections(): void;
    _updateNode(li: JQuery, node: TreeNode, level: number): any;
    /**
     * @param level
     */
    _drawChildren(node: TreeNode, nodeElement: any, level?: number): void;
    /**
     * @return
     */
    _toggle(node: TreeNode, nodeElement: any, suppressChangeEvent?: boolean): any;
    /**
     * Ensure the tree node's expansion state is set to a particular value
     *
     * @param node The tree node
     * @param nodeElement The element associated with the node
     * @param expand The desired expand state of the node - true = expanded, false = collapsed
     * @return true = the node's expansion state was changed, false otherwise
     */
    _setNodeExpansion(node: TreeNode, nodeElement: JQuery, expand: boolean): boolean;
    /**
     * Removes the specified node from the tree.
     *
     * @param node Node to be removed.
     * @publicapi
     */
    removeNode(node: TreeNode): void;
    /**
     * Update the specified node by refreshing the child nodes if anything is added or removed.
     *
     * @param node Node to be updated.
     * @publicapi
     */
    updateNode(node: TreeNode): void;
    /**
     * @param e
     * @return
     */
    onItemClick(node: TreeNode, nodeElement: any, e?: JQueryEventObject): any;
    onShowPopupMenu(node: TreeNode, options?: any): void;
    /**
     * Indicate whether the element that has focus should be styled differently.
     * The current focus element will be updated to match the new preference
     *
     * @param enabled true, if focus element should be styled.
     */
    enableFocusStyling(enabled: boolean): void;
    _setFocusElement(element: JQuery): void;
    /**
     * Gets the node associated with the provided DOM/JQuery element.
     *
     * @param element Element to get the node for.
     * @return  {TreeNode}
     * @publicapi
     */
    getNodeFromElement(element: any): TreeNode;
    private _drawNode(node, parentElement, level);
    private _drawEmptyFolderNode(parentElement, level, text);
    /**
     * @param e
     * @return
     */
    private _click(e?);
    /**
     * Handle key down events (node selection & expansion)
     *
     * @param e
     * @return
     */
    _onInputKeyDown(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    private _onToggle(e?);
    /**
     * @param e
     * @return
     */
    private _itemClick(e?);
    /**
     * @param e
     * @return
     */
    private _onContextMenu(e?);
    private _showPopupMenu(node);
    /**
     * @param e
     * @return
     */
    private _onFocus(e?);
    /**
     * @param e
     * @return
     */
    _onBlur(e?: JQueryEventObject): any;
    _clearFocusOnElement(): void;
    /**
     * Suppress browser default drag behavior associated with the supplied element to prevent conflicting behavior (text selection/HTML5 default DnD) with JQuery Drag Drop.
     *
     * @param e
     * @return
     */
    private _onDragStart(e?);
    /**
     * Set the droppable
     *
     * @param droppable
     */
    setDroppable(droppable: any): void;
    private _getFirstTabbableChild(nodeElement);
    private _setNodeElementExpandState(nodeElement, expand, hasChildren?);
}
export class TreeView extends TreeViewO<ITreeOptions> {
}
export class ComboTreeDropPopup extends Combos.ComboListDropPopup {
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    expandNode(): boolean;
    collapseNode(): boolean;
    _createItem(index: any): any;
    _onItemClick(e?: any, itemIndex?: any, $target?: any, $li?: any): boolean;
    _getSelectedNode(): any;
}
export class ComboTreeBehavior extends Combos.ComboListBehavior {
    constructor(combo: any, options?: any);
    canType(): boolean;
    /**
     * @param e
     * @return
     */
    leftKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    rightKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    keyUp(e?: JQueryEventObject): any;
    _createDataSource(): Controls.BaseDataSource;
}
export var ComboTreeBehaviorName: string;
export class MultiSelectTreeComboDropPopup extends Combos.ComboListDropPopup {
    /**
     * @param options
     */
    private _checkStates;
    constructor(options?: any);
    initializeOptions(options?: any): void;
    initialize(): void;
    expandNode(): boolean;
    collapseNode(): boolean;
    getCheckedItems(): string[];
    getValue(): string;
    _createItem(itemIndex: any): any;
    _onItemClick(e?: any, itemIndex?: any, $target?: any, $li?: any): boolean;
    private _fireDropPopupChange(dataSource, itemIndex?, $li?);
    _getSelectedNode(): any;
    toggleCheckbox(selectedIndex: any): void;
}
export class MultiSelectTreeComboBehavior extends Combos.ComboListBehavior {
    constructor(combo: any, options?: any);
    canType(): boolean;
    getDropOptions(): any;
    /**
     * @param e
     * @return
     */
    leftKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    rightKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    keyUp(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    keyDown(e?: JQueryEventObject): any;
    _createDataSource(): Controls.BaseDataSource;
    private _onChange();
    setSource(source: any[] | Function): void;
}
export var ComboTreeMultivalueBehaviorName: string;
export class SearchComboTreeBehavior extends Combos.ComboListBehavior {
    private hitText;
    private selectedHitIndex;
    private originalNodes;
    private lastSearchText;
    private searchDebounceTimeout;
    private debounceWaitTime;
    private textHasChanged;
    constructor(combo: any, options?: any);
    initialize(): void;
    canType(): boolean;
    /**
     * @param e
     * @return
     */
    leftKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    rightKey(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    keyDown(e?: JQueryEventObject): any;
    /**
     * @param e
     * @return
     */
    keyUp(e?: JQueryEventObject): any;
    _createDataSource(): Controls.BaseDataSource;
    private mouseUp();
    private clearSearchDebounce();
    private debounceSearch(waitInMilliseconds);
    private isComboTextPath();
    private searchNodes();
    private _ensureOriginalNodesStored();
    private getNodesToSearch(searchText);
    private createCopyOfSubtreeWhichMatchesSearch(searchText, nodesToSearch);
    private stringContains(text, contains);
    private modifyDatasourceAndDropdownWithResults(searchHitsFound);
    private expandAncestors(node);
    private performSearchHitProcessing(alreadyCopiedNodes, node);
    private copyNodeToArray(array, node);
    private copyNodeAndAncestorsToArray(array, node);
    private copyDecendantsToArray(array, node);
    private setHit(index);
    private acceptSelectedIndex();
}
export var SearchComboTreeBehaviorName: string;
export function flatten(node: any, items: any, all: any): void;
}
declare module "VSS/Controls/Validation" {
import Controls = require("VSS/Controls");
export interface BaseValidatorOptions {
    bindtokeystrokes?: boolean;
    invalidCssClass?: string;
    message?: string | (() => string);
    group?: string;
    allowEmptyString?: boolean;
    testEmptyString?: boolean;
}
export class BaseValidator<TOptions extends BaseValidatorOptions> extends Controls.Enhancement<TOptions> {
    static optionsPrefix: string;
    static EVENT_VALIDATE: string;
    static EVENT_VALIDATE_STATUS: string;
    instanceId: any;
    private _onValidationRequiredDelegate;
    /**
     * @param options
     */
    constructor(options?: TOptions);
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    initialize(): void;
    dispose(): void;
    getValue(): any;
    /**
     * @return
     */
    isValid(): boolean;
    getValidationGroup(): string;
    getMessage(): string | (() => string);
    onKeyUp(): void;
    onChanged(): void;
    onValidationRequired(e?: any, group?: any): void;
    validate(): void;
    private _testEmptyString();
}
export class RequiredValidator<TOptions extends BaseValidatorOptions> extends BaseValidator<TOptions> {
    static optionsPrefix: string;
    /**
     * @param options
     */
    constructor(options?: TOptions);
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    /**
     * @return
     */
    isValid(): boolean;
}
export class RangeValidator<TOptions extends BaseValidatorOptions> extends BaseValidator<TOptions> {
    static optionsPrefix: string;
    /**
     * @param options
     */
    constructor(options?: TOptions);
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    /**
     * @return
     */
    isValid(): boolean;
    getMessage(): string;
}
export interface RegexValidatorOptions extends BaseValidatorOptions {
    regex?: string;
}
export class RegexValidator<TOptions extends RegexValidatorOptions> extends BaseValidator<TOptions> {
    static optionsPrefix: string;
    /**
     * @param options
     */
    constructor(options?: TOptions);
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    /**
     * @return
     */
    isValid(): boolean;
    getMessage(): any;
}
export interface CustomValidatorOptions extends BaseValidatorOptions {
    validate?: (val: any) => boolean;
}
export class CustomValidator<TOptions extends CustomValidatorOptions> extends BaseValidator<TOptions> {
    static optionsPrefix: string;
    /**
     *     A validator which checks the text in the input by passing it to a function,
     *     which then returns true if the input is valid, and false if it is invalid.
     *
     * @param options  Options to apply to the validator:
     *     message: A message logged by the validation summary if the input is invalid / string
     *     testEmptyString: A boolean which indicates whether or not to test the empty string / boolean
     *     validate: The function to validate the input against
     *
     */
    constructor(options?: TOptions);
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    /**
     * Tests if the current input satisfies the function
     *
     * @return True if the input does satisfy, false if it does not
     */
    isValid(): boolean;
    /**
     *  Set the function the validator tests
     *
     * @param newFxn  The new function to test against
     */
    setValidate(newValidateFunction: any): void;
    /**
     *  Gets the message that would be logged in the validation summary if the input were to be invalid
     *
     * @return  The message
     */
    getMessage(): string;
}
export interface DateValidatorOptions extends BaseValidatorOptions {
    parseFormat?: string;
}
export class DateValidator<TOptions extends DateValidatorOptions> extends BaseValidator<TOptions> {
    static optionsPrefix: string;
    /**
     * @param options
     */
    constructor(options?: TOptions);
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    /**
     * @return
     */
    isValid(): boolean;
    getMessage(): any;
}
export interface IntegerRangeValidatorOptions extends BaseValidatorOptions {
    minValue?: number;
    maxValue?: number;
}
export class IntegerRangeValidator<TOptions extends IntegerRangeValidatorOptions> extends BaseValidator<TOptions> {
    static optionsPrefix: string;
    /**
     *     A validator that ensures only whole integers between an upper and lower limit are entered.
     *
     * @param options  Options to apply to the validator:
     *     minValue: The minimum value (inclusive)
     *     maxValue: The maximum value (inclusive)
     *
     */
    constructor(options?: TOptions);
    /**
     * OVERRIDE: Determines whether the input control bound to this validator contains valid input
     *
     * @return True if valid, false otherwise
     */
    isValid(): boolean;
    isWithinBounds(value: string, max: number, min: number): boolean;
    /**
     * OVERRIDE: Gets the error message for display purposes
     *
     * @return The error message
     */
    getMessage(): string;
    /**
     * Gets the min and max boundaries of the validator
     *
     * @return {min, max}
     */
    private _getBounds();
}
export interface MaxLengthValidatorOptions extends BaseValidatorOptions {
    maxLength?: number;
}
export class MaxLengthValidator<TOptions extends MaxLengthValidatorOptions> extends BaseValidator<TOptions> {
    static optionsPrefix: string;
    /**
     * @param options
     */
    constructor(options?: TOptions);
    /**
     * @param options
     */
    initializeOptions(options?: TOptions): void;
    /**
     * @return
     */
    isValid(): boolean;
}
export interface ValidationSummaryOptions {
    context: Node;
    group: string;
}
export class ValidationSummary extends Controls.Control<ValidationSummaryOptions> {
    private _messages;
    private _ignoreUIUpdate;
    private _fixedHeight;
    private _singleMessage;
    private _showAsWarning;
    /**
     * @param options
     */
    constructor(options?: any);
    /**
     * @param options
     */
    initializeOptions(options?: ValidationSummaryOptions): void;
    initialize(): void;
    onValidationStatus(e?: any, validator?: any, group?: any, valid?: any): void;
    validate(): void;
    private _updateUI();
}
/**
 * @param validationResult
 * @param context
 * @return
 */
export function validateGroup(group: any, validationResult?: any[], context?: any): boolean;
}
declare module "VSS/Controls/Virtualization" {
import Controls = require("VSS/Controls");
export class VirtualizingListView extends Controls.BaseControl {
    private _itemsContainer;
    private _scrollContainer;
    private _scrollSpacer;
    private _dataSource;
    private _firstVisible;
    private _selectedIndex;
    private _rowHeight;
    private _ignoreScrollEvent;
    private _enableMouseOver;
    private _prevMousePos;
    visibleRowCount: number;
    /**
     * @param options
     */
    initializeOptions(options?: any): void;
    initialize(): void;
    update(): void;
    scrollItemIntoView(index: any): void;
    /**
     * @param page
     * @return
     */
    selectNext(page?: boolean): boolean;
    /**
     * @param page
     * @return
     */
    selectPrev(page?: boolean): boolean;
    getSelectedIndex(): number;
    /**
     * @param noScrollIntoView
     */
    setSelectedIndex(selectedIndex: number, noScrollIntoView?: boolean): void;
    private _setVisibleBounds(visibleItemIndex);
    private _createItem(index);
    private _drawItems();
    private _updateItemStyles();
    private _setupScrollbar(height);
    private _updateScrollbar();
    private _onScroll(e);
    private _onMouseMove(e);
    private _onMouseOver(e);
    private _onMouseWheel(e);
    private _onClick(e);
    /**
     * @param accept
     */
    private _fireSelectionChanged(accept?);
}
}
declare module "VSS/DelegatedAuthorization/Contracts" {
import VSS_Common_Contracts = require("VSS/WebApi/Contracts");
export interface AccessTokenResult {
    accessToken: VSS_Common_Contracts.JsonWebToken;
    accessTokenError: TokenError;
    authorizationId: string;
    hasError: boolean;
    refreshToken: RefreshTokenGrant;
    tokenType: string;
    validTo: Date;
}
export enum AppSessionTokenError {
    None = 0,
    UserIdRequired = 1,
    ClientIdRequired = 2,
    InvalidUserId = 3,
    InvalidUserType = 4,
    AccessDenied = 5,
    FailedToIssueAppSessionToken = 6,
    InvalidClientId = 7,
    AuthorizationIsNotSuccessfull = 8,
}
export interface AuthorizationGrant {
    grantType: GrantType;
}
export enum ClientType {
    Confidential = 0,
    Public = 1,
    MediumTrust = 2,
    HighTrust = 3,
    FullTrust = 4,
}
export enum GrantType {
    None = 0,
    JwtBearer = 1,
    RefreshToken = 2,
    Implicit = 3,
}
export enum HostAuthorizationError {
    None = 0,
    ClientIdRequired = 1,
    AccessDenied = 2,
    FailedToAuthorizeHost = 3,
    ClientIdNotFound = 4,
    InvalidClientId = 5,
}
export interface RefreshTokenGrant extends AuthorizationGrant {
    jwt: VSS_Common_Contracts.JsonWebToken;
}
export interface Registration {
    clientType: ClientType;
    identityId: string;
    isValid: boolean;
    isWellKnown: boolean;
    organizationLocation: string;
    organizationName: string;
    /**
     * Raw cert data string from public key. This will be used for authenticating medium trust clients.
     */
    publicKey: string;
    redirectUris: string[];
    registrationDescription: string;
    registrationId: string;
    registrationLocation: string;
    registrationLogoSecureLocation: string;
    registrationName: string;
    registrationPrivacyStatementLocation: string;
    registrationTermsOfServiceLocation: string;
    responseTypes: string;
    scopes: string;
    secret: string;
    secretVersionId: string;
}
export enum SessionTokenError {
    None = 0,
    DisplayNameRequired = 1,
    InvalidDisplayName = 2,
    InvalidValidTo = 3,
    InvalidScope = 4,
    UserIdRequired = 5,
    InvalidUserId = 6,
    InvalidUserType = 7,
    AccessDenied = 8,
    FailedToIssueAccessToken = 9,
    InvalidClient = 10,
    InvalidClientType = 11,
    InvalidClientId = 12,
    InvalidTargetAccounts = 13,
    HostAuthorizationNotFound = 14,
    AuthorizationNotFound = 15,
    FailedToUpdateAccessToken = 16,
    SourceNotSupported = 17,
    InvalidSourceIP = 18,
    InvalidSource = 19,
    DuplicateHash = 20,
}
export enum SessionTokenType {
    SelfDescribing = 0,
    Compact = 1,
}
export enum TokenError {
    None = 0,
    GrantTypeRequired = 1,
    AuthorizationGrantRequired = 2,
    ClientSecretRequired = 3,
    RedirectUriRequired = 4,
    InvalidAuthorizationGrant = 5,
    InvalidAuthorizationScopes = 6,
    InvalidRefreshToken = 7,
    AuthorizationNotFound = 8,
    AuthorizationGrantExpired = 9,
    AccessAlreadyIssued = 10,
    InvalidRedirectUri = 11,
    AccessTokenNotFound = 12,
    InvalidAccessToken = 13,
    AccessTokenAlreadyRefreshed = 14,
    InvalidClientSecret = 15,
    ClientSecretExpired = 16,
    ServerError = 17,
    AccessDenied = 18,
    AccessTokenKeyRequired = 19,
    InvalidAccessTokenKey = 20,
    FailedToGetAccessToken = 21,
    InvalidClientId = 22,
    InvalidClient = 23,
    InvalidValidTo = 24,
    InvalidUserId = 25,
    FailedToIssueAccessToken = 26,
    AuthorizationGrantScopeMissing = 27,
}
export interface TokenPairResult {
    accessToken: string;
    hasError: boolean;
    refreshToken: string;
    tokenError: TokenError;
}
export var TypeInfo: {
    AccessTokenResult: {
        fields: any;
    };
    AppSessionTokenError: {
        enumValues: {
            "none": number;
            "userIdRequired": number;
            "clientIdRequired": number;
            "invalidUserId": number;
            "invalidUserType": number;
            "accessDenied": number;
            "failedToIssueAppSessionToken": number;
            "invalidClientId": number;
            "authorizationIsNotSuccessfull": number;
        };
    };
    AuthorizationGrant: {
        fields: any;
    };
    ClientType: {
        enumValues: {
            "confidential": number;
            "public": number;
            "mediumTrust": number;
            "highTrust": number;
            "fullTrust": number;
        };
    };
    GrantType: {
        enumValues: {
            "none": number;
            "jwtBearer": number;
            "refreshToken": number;
            "implicit": number;
        };
    };
    HostAuthorizationError: {
        enumValues: {
            "none": number;
            "clientIdRequired": number;
            "accessDenied": number;
            "failedToAuthorizeHost": number;
            "clientIdNotFound": number;
            "invalidClientId": number;
        };
    };
    RefreshTokenGrant: {
        fields: any;
    };
    Registration: {
        fields: any;
    };
    SessionTokenError: {
        enumValues: {
            "none": number;
            "displayNameRequired": number;
            "invalidDisplayName": number;
            "invalidValidTo": number;
            "invalidScope": number;
            "userIdRequired": number;
            "invalidUserId": number;
            "invalidUserType": number;
            "accessDenied": number;
            "failedToIssueAccessToken": number;
            "invalidClient": number;
            "invalidClientType": number;
            "invalidClientId": number;
            "invalidTargetAccounts": number;
            "hostAuthorizationNotFound": number;
            "authorizationNotFound": number;
            "failedToUpdateAccessToken": number;
            "sourceNotSupported": number;
            "invalidSourceIP": number;
            "invalidSource": number;
            "duplicateHash": number;
        };
    };
    SessionTokenType: {
        enumValues: {
            "selfDescribing": number;
            "compact": number;
        };
    };
    TokenError: {
        enumValues: {
            "none": number;
            "grantTypeRequired": number;
            "authorizationGrantRequired": number;
            "clientSecretRequired": number;
            "redirectUriRequired": number;
            "invalidAuthorizationGrant": number;
            "invalidAuthorizationScopes": number;
            "invalidRefreshToken": number;
            "authorizationNotFound": number;
            "authorizationGrantExpired": number;
            "accessAlreadyIssued": number;
            "invalidRedirectUri": number;
            "accessTokenNotFound": number;
            "invalidAccessToken": number;
            "accessTokenAlreadyRefreshed": number;
            "invalidClientSecret": number;
            "clientSecretExpired": number;
            "serverError": number;
            "accessDenied": number;
            "accessTokenKeyRequired": number;
            "invalidAccessTokenKey": number;
            "failedToGetAccessToken": number;
            "invalidClientId": number;
            "invalidClient": number;
            "invalidValidTo": number;
            "invalidUserId": number;
            "failedToIssueAccessToken": number;
            "authorizationGrantScopeMissing": number;
        };
    };
    TokenPairResult: {
        fields: any;
    };
};
}
declare module "VSS/Diag" {
export var perfCollector: PerfTracePointCollector;
export var logLevel: number;
export function getDebugMode(): boolean;
export function setDebugMode(debugModeEnabled: boolean): void;
export enum StampEvent {
    SinglePoint = 0,
    Enter = 1,
    Leave = 2,
}
export function timeStamp(label: string, event: StampEvent): void;
export class Measurement {
    private label;
    /**
     * Begin new measurement
     *
     * @param label Name of the measurement
     * @param callback Callback to end measurement
     */
    static start(label: string, callback: (measurement: Measurement) => void): void;
    constructor(label: string);
    /**
     * Ends this measurement
     */
    finish(): void;
}
export enum LogVerbosity {
    Off = 0,
    Error = 1,
    Warning = 2,
    Info = 3,
    Verbose = 4,
}
/**
 * Log a message to the debug output windows and all other trace listeners
 *
 * @param level A log verbosity value from VSS.Diag.logVerbosity
 * @param message Message to send to all trace listeners
 */
export function log(level: number, message: string): void;
export function logError(message: string): void;
export function logWarning(message: string): void;
export function logInfo(message: string): void;
export function logVerbose(message: string): void;
/**
 * Add a listener to listen for logged messages
 *
 * @param callback A callback method that gets called whenever something is logged
 */
export function listen(callback: IResultCallback): void;
/**
 * Remove a log message listener
 *
 * @param callback Listener to remove
 */
export function unlisten(callback: IResultCallback): void;
/**
 * Updates the start/end trace points used when creating a profile.
 *
 * @param startTracePointName The trace point to begin the profile.
 * @param endTracePointName The trace point that will ned the profile.
 */
export function profile(startTracePointName: string, endTracePointName: string): void;
/**
 * Explicitly end the profile.
 */
export function profileEnd(): void;
/**
 * Logs a trace point which can be consumed by a trace point collector for performance analysis.
 *
 * @param tracePointName Name of the trace point
 * @param data (Optional) Data corresponding to the event that occurred.
 */
export function logTracePoint(tracePointName: string, data?: any): void;
/**
 * Add a collector to handle trace points
 *
 * @param collector Method(tracePointName, data) called when trace points are logged.
 */
export function addTracePointCollector(collector: Function): void;
/**
 * Remove a trace point collector
 *
 * @param collector Collector to remove
 */
export function removeTracePointCollector(collector: Function): void;
/**
 * Sets the minimum level at which logged statements get captured and reported to the browser console.
 *
 * @param level Level which gets logged to the console
 */
export function setLogLevel(level: number): void;
export interface ITracePoint {
    name: string;
    time: number;
    data: any;
}
export class PerfTracePointCollector {
    private _tracePoints;
    private _overallCounts;
    private _activeCounts;
    private _moduleInitTime;
    private _lastResetTime;
    private _lastResetIndex;
    constructor();
    register(): void;
    getOverallCount(tracePointName: string): number;
    getActiveCount(tracePointName: string): number;
    getLastTracePoint(tracePointName: string): ITracePoint;
    getLastTracePointTime(tracePointName: string): number;
    resetActiveCount(tracePointName: string): void;
    resetActiveCounts(): void;
    getModuleInitTime(): number;
    getTracePoints(activeOnly: boolean): ITracePoint[];
    getTracePointCountData(tracePointNames: string[]): string;
    dumpTracePoints(activeOnly: boolean): string;
    private _updateCount(dictionary, eventName);
    private _handleTracePoint(tracePointName, tracePointData);
}
export function measurePerformance(action: Function, message: string, logLevel?: LogVerbosity): void;
/**
* Any function calls to any members of this class will be stripped out in minified version, see WebPlatform.targets file AjaxMin task call with -debug switch.
* NOTE: You must use Diag or VSS_Diag as alias for the import statment for it to work.
* e.g. import Diag = require("VSS/Diag")
* This will be useful as follows
* 1) We will not have overhead of extra function calls in release version specially in the functions that are called many-many times (e.g. event handlers/processors)
* 2) The size of minified version will not be bloated with the size of message strings and function names
* 3) While debugging will still have flexibility to see the logs depending on the Log level
*/
export class Debug {
    private static _noDebugPrompts;
    /**
     * Sets whether or not to display callers in the stack on assert failures.
     *
     * @param showCallers If true, display callers in the stack of assert failures.
     */
    static setDisplayCallers(showCallers: boolean): void;
    /**
     * Displays a message in the debugger's output window and breaks into the debugger
     *
     * @param message Message to display in the debugger's output window
     */
    static fail(message: string): void;
    /**
     * Checks for a condition, and if the condition is false, displays a message and prompts the user to break into the debuggeription
     *
     * @param condition true to continue to execute code; false to display message and break into the debugger
     * @param message (Optional) The message to display. The default is an empty string
     */
    static assert(condition: boolean, message?: string): void;
    /**
     * Assert that the value is an object and not null.
     *
     * @param value Value to ensure is an object.
     * @param message (Optional) The message to display. The default is an empty string
     */
    static assertIsObject(value: any, message?: string): void;
    /**
     * Assert that the value is an object and not null.
     *
     * @param value Value to ensure is an object.
     * @param paramName Name of the parameter that this value is associated with.
     * @param optional If true then the assert will accept falsy values
     */
    static assertParamIsObject(value: any, paramName: string, optional?: boolean): void;
    /**
     * Assert that the value is an array.
     *
     * @param value Value to ensure is an array.
     * @param message (Optional) The message to display. The default is an empty string
     * @param requireNotEmpty (Optional) If true the array will be checked to ensure it is not empty.
     */
    static assertIsArray(value: any, message?: string, requireNotEmpty?: boolean): void;
    /**
     * Assert that the value is an array.
     *
     * @param value Value to ensure is an array.
     * @param paramName (Optional) Name of the parameter that this value is associated with.
     * @param requireNotEmpty (Optional) If true the array will be checked to ensure it is not empty.
     */
    static assertParamIsArray(value: any, paramName?: string, requireNotEmpty?: boolean): void;
    /**
     * Assert that the value is a boolean.
     *
     * @param value Value to ensure is a boolean.
     * @param message (Optional) The message to display. The default is an empty string
     */
    static assertIsBool(value: boolean, message?: string): void;
    /**
     * Assert that the value is a boolean.
     *
     * @param value Value to ensure is a boolean.
     * @param paramName Name of the parameter that this value is associated with.
     */
    static assertParamIsBool(value: boolean, paramName: string): void;
    /**
     * Assert that the value is a number.
     *
     * @param value Value to ensure is a number.
     * @param message (Optional) The message to display. The default is an empty string
     */
    static assertIsNumber(value: number, message?: string): void;
    /**
     * Assert that the value is a number.
     *
     * @param value Value to ensure is a number.
     * @param paramName Name of the parameter that this value is associated with.
     */
    static assertParamIsNumber(value: number, paramName: string): void;
    /**
     * Assert that the value is an integer.
     *
     * @param value Value to ensure is an integer.
     * @param message (Optional) The message to display. The default is an empty string
     */
    static assertIsInteger(value: number, message?: string): void;
    /**
     * Assert that the value is an integer.
     *
     * @param value Value to ensure is an integer.
     * @param paramName Name of the parameter that this value is associated with.
     */
    static assertParamIsInteger(value: number, paramName: string): void;
    /**
     * Assert that the value is a string.
     *
     * @param value Value to ensure is a string.
     * @param message (Optional) The message to display. The default is an empty string
     */
    static assertIsString(value: string, message?: string): void;
    /**
     * Assert that the value is a string.
     *
     * @param value Value to ensure is a string.
     * @param paramName Name of the parameter that this value is associated with.
     */
    static assertParamIsString(value: string, paramName: string): void;
    /**
     * Assert that the value is a string and not empty.
     *
     * @param value Value to ensure is a string and not empty.
     * @param message (Optional) The message to display. The default is an empty string
     */
    static assertIsStringNotEmpty(value: string, message?: string): void;
    /**
     * Assert that the value is a string and not empty.
     *
     * @param value Value to ensure is a string and not empty.
     * @param paramName Name of the parameter that this value is associated with.
     */
    static assertParamIsStringNotEmpty(value: string, paramName: string): void;
    /**
     * Assert that the value is a function.
     *
     * @param value Value to ensure is a function.
     * @param message (Optional) The message to display. The default is an empty string
     */
    static assertIsFunction(value: any, message?: string): void;
    /**
     * Assert that the value is a function.
     *
     * @param value Value to ensure is a function.
     * @param paramName Name of the parameter that this value is associated with.
     */
    static assertParamIsFunction(value: any, paramName: string): void;
    /**
     * Assert that the value is a date.
     *
     * @param value Value to ensure is a date.
     * @param message (Optional) The message to display. The default is an empty string
     */
    static assertIsDate(value: any, message?: string): void;
    /**
     * Assert that the value is a date.
     *
     * @param value Value to ensure is a date.
     * @param paramName Name of the parameter that this value is associated with.
     */
    static assertParamIsDate(value: any, paramName: string): void;
    /**
     * Assert that the value is not null or undefined.
     *
     * @param value Value to ensure is not null or undefined.
     * @param message (Optional) The message to display. The default is an empty string
     */
    static assertIsNotNull(value: any, message?: string): void;
    /**
     * Assert that the value is not null or undefined.
     *
     * @param value Value to ensure is not null or undefined.
     * @param paramName Name of the parameter that this value is associated with.
     */
    static assertParamIsNotNull(value: any, paramName: string): void;
    /**
     * Assert that the value is not undefined.
     *
     * @param value Value to ensure is not undefined.
     * @param message (Optional) The message to display. The default is an empty string
     */
    static assertIsNotUndefined(value: any, message?: string): void;
    /**
     * Assert that the value is undefined.
     *
     * @param value Value to ensure is not undefined.
     * @param paramName Name of the parameter that this value is associated with.
     */
    static assertParamIsNotUndefined(value: any, paramName: string): void;
    /**
     * Assert that the value is a jQuery object.
     *
     * @param value Value to ensure is a jQuery object.
     * @param message (Optional) The message to display. The default is an empty string
     */
    static assertIsJQueryObject(value: any, message?: string): void;
    /**
     * Assert that the value is a jQuery object.
     *
     * @param value Value to ensure is a jQuery object.
     * @param paramName Name of the parameter that this value is associated with.
     */
    static assertParamIsJQueryObject(value: any, paramName: string): void;
    /**
     * Assert that the value is an instance of the expected type.
     *
     * @param value The value to test for the correct type
     * @param type Either the constructor function for a type,
     * or a string matching the return value of the typeof operator. This specified the type
     * to test for.
     * @param message The messge to display on Debug.failure.
     * @param optional Flag to determine whether null and undefined are accepted as values.
     */
    static assertIsType(value: any, type: any, message: string, optional?: boolean): void;
    /**
     * Gets the display name for a type.
     *
     * @param type The string value (from the typeof operator) or a constructor function.
     * @return
     */
    static getTypeName(type: any): string;
    /**
     * Assert that the parameter is an instance of the expected type.
     *
     * @param value The value to test for the correct type
     * @param type Either the constructor function for a type,
     * or a string matching the return value of the typeof operator. This specified the type
     * to test for.
     * @param paramName The name of the parameter.
     * @param optional Flag to determine whether null and undefined are accepted as values.
     */
    static assertParamIsType(value: any, type: any, paramName: string, optional?: boolean): void;
    static logInfo(message: string): void;
    static logVerbose(message: string): void;
}
}
declare module "VSS/Diag/Services" {
import Service = require("VSS/Service");
export interface Statistic {
    name: string;
    id: string;
    parentId?: string;
}
export interface ActivityStatistic extends Statistic {
    actionDate: string;
    status?: number;
}
export interface ActivtyStatsCollectionAllowedCallback {
    (): boolean;
}
export class ActivityStatsCollector implements Service.ILocalService {
    static ACTIVITY_COLLECTION_STATUS: string;
    static ACTIVITY_ID_STORAGE_ITEM: string;
    static CURRENT_PAGE: string;
    private _activtyIdHeader;
    private _progressPendingActions;
    private _progressPendingActionsNewId;
    private _activtyStatsCollectionAllowedCallbacks;
    /**
     * Global handler for logging activity data
     */
    constructor();
    initialize(): void;
    addActivtyStatsCollectionAllowedCallback(callback: ActivtyStatsCollectionAllowedCallback): void;
    actionStarted(name: string): number;
    actionCompleted(id: number, jqXHR: JQueryXHR): void;
    logActivity(activityId: string, page: string): void;
    getActivityStatistics(): ActivityStatistic[];
    clearStats(): void;
    collectStats(shouldCollect: boolean): void;
    getCurrentPage(): ActivityStatistic;
    setCurrentPage(currentPage: ActivityStatistic): void;
    isCollectingStats(): boolean;
    private _saveActivity(stat, isCurrentPage?);
    private _allowStatsCollection();
}
}
declare module "VSS/Error" {
/**
 * publish error to telemetry service
 */
export function publishErrorToTelemetry(error: TfsError, immediate?: boolean): void;
}
declare module "VSS/Events/Action" {
import Service = require("VSS/Service");
export interface IActionWorker {
    (actionArgs: any, next: (actionArgs: any) => any): any;
}
export class ActionService implements Service.ILocalService {
    static MaxOrder: any;
    private _actionWorkers;
    /**
     * Register a handler for an action. The handler participates in the Chain of Responsibility pattern.
     *
     * @param action The action to register
     * @param actionWorker Function(actionArgs, next), The handler to invoke for the given action when the performAction
     *     operation is called for the registered action.
     *     The function is passed the action arguments for next which it should call with the actionsArgs UNLESS
     *     it explicitly wants to be the end of the chain.
     *     e.g.
     *     registerActionWorker('some.action', function (actionArgs, next) {
     *         if (iCanHandle(actionArgs)) {
     *             return doProcessing(actionArgs);
     *         }
     *         else {
     *             return next(actionArgs);
     *         }
     *     }, 50);
     *
     * if ActionWorker functions are asynchronous they can still participate in the chain
     *
     *     registerActionWorker('some.async.action', function (actionArgs, next) {
     *         beginDoSomeStuff(function (result) {
     *             if (that.imDone(results)) {
     *                 actionArgs.onSuccess.call(this, results);
     *             }
     *             else {
     *                 next(actionArgs);
     *             }
     *         });
     *     }, 50);
     *
     * @param order The order of the action (default:100).
     *       Action workers are executed in increasing order. Order must be less than MaxOrder (inclusive)
     */
    registerActionWorker(action: string, actionWorker: IActionWorker, order?: number): void;
    /**
     * Un-Register a handler for an action.
     *
     * @param action The action to un-register
     * @param actionWorker Function(actionArgs, next), The IActionWorker that was registered.
     */
    unregisterActionWorker(action: string, actionWorker: IActionWorker): void;
    /**
     * Invoke the registered action workers for the an action
     *
     * @param action The action identifier
     * @param actionArgs An object passed to the registered action workers.
     */
    performAction(action: string, actionArgs?: any): any;
    /**
     *  Clears all action workers
     */
    clearActionWorkers(): void;
    /**
     * Manage actions and the workers that are invoked when those actions are performed.
     * Action workers register to handle specific actions. They take whatever action they desire
     * and usually call the "next" handler in the chain (see the Chain of Responsibility pattern).
     */
    constructor();
}
export module CommonActions {
    var ACTION_WINDOW_OPEN: string;
    var ACTION_WINDOW_NAVIGATE: string;
    var ACTION_WINDOW_RELOAD: string;
    var ACTION_WINDOW_UNLOAD: string;
}
export function getService(): ActionService;
}
declare module "VSS/Events/Document" {
import Service = require("VSS/Service");
/**
 * Represents a document to a host.
 *  A host can be tha browser, an IDE (e.g. Eclipse, Visual Studio)
 */
export interface RunningDocument {
    /**
    * Method which returns true if the document is currently in a dirty-state which should block (prompt) attempts to navigate-away.
    */
    isDirty(): boolean;
    /**
    * (Optional) Callback method called before a save operation is performed on the document service
    */
    beginSave?: (successCallback: IResultCallback, errorCallback?: IErrorCallback) => void;
    /**
    * (Optional) Callback method called to get the titles of the currently dirty items.
    */
    getDirtyDocumentTitles?: (maxTitle?: number) => string[];
}
export interface RunningDocumentsTableEntry {
    document: RunningDocument;
    moniker: string;
}
export class RunningDocumentsTable implements Service.ILocalService {
    private _runningDocEntries;
    constructor();
    /**
     *   Add specified document to the running document table
     *   The document must have a method named isDirty that returns boolean
     *
     * @param moniker Name for this document type
     * @param document Object that will be called to determine state (e.g. dirty//modified)
     * @return A handle to the entry in the running document table. The handle can be used to remove the entry
     */
    add(moniker: string, document: RunningDocument): RunningDocumentsTableEntry;
    /**
     *   Remove an entry from the running document table
     *
     * @param entry The handle to the entry that will be removed. The handle is returned from the add function
     */
    remove(entry: RunningDocumentsTableEntry): void;
    /**
     *   Check if the specified document is modified.  If specified moniker is null or undefined
     *   will return true if any currently opened documents are modified
     *
     * @param moniker Name for this document type
     * @return True if the specified moniker\document is modified, false otherwise.
     *   Null or undefined moniker will return true if any opened documents are modified
     */
    isModified(moniker?: string): boolean;
    beginSave(callback: IResultCallback, errorCallback?: IErrorCallback): void;
    getUnsavedItemsMessage(): string;
    private _isAnyModified();
}
export interface Document {
    save(successCallback: IResultCallback, errorCallback?: IErrorCallback): void;
    getMoniker(): string;
}
/**
* Service for host environment to interact with documents in Web Access
*  A host environment can be tha browser, an IDE (e.g. Eclipse, Visual Studio)
*/
export class DocumentService implements Service.ILocalService {
    private _activeDocument;
    private _runningDocumentsTable;
    constructor();
    addDeleteListener(callBack: Function): void;
    removeDeleteListener(callBack: IEventHandler): void;
    addBuildPropertyChangedListener(callBack: IEventHandler): void;
    removeBuildPropertyChangedListener(callBack: IEventHandler): void;
    addBuildStoppedListener(callBack: IEventHandler): void;
    removeBuildStoppedListener(callBack: IEventHandler): void;
    addModifiedChangedListener(callBack: IEventHandler): void;
    removeModifiedChangedListener(callBack: IEventHandler): void;
    isModified(args?: string): boolean;
    save(successCallback: IResultCallback, errorCallback?: IErrorCallback): void;
    getActiveDocument(): Document;
    setActiveDocument(activeDocument: Document): void;
}
export function getService(): DocumentService;
export function getRunningDocumentsTable(): RunningDocumentsTable;
}
declare module "VSS/Events/Handlers" {
/**
* Represents a collection of named events that event listeners can attach to
*/
export class NamedEventCollection<TSender, TEventArgs> {
    private _namedHandlers;
    /**
    * Adds an event handler to the list of handlers for the given event
    *
    * @param eventName the name of the event to subscribe to
    * @param handler Event handler method to register
    */
    subscribe(eventName: string, handler: IFunctionPPR<TSender, TEventArgs, void>): void;
    /**
    * Removes an event handler from the list of handlers for the given event
    *
    * @param eventName The name of the event to unsubscribe to
    * @param handler Event handler method to remove
    */
    unsubscribe(eventName: string, handler: IFunctionPPR<TSender, TEventArgs, void>): void;
    /**
    * Invoke the handlers that have subscribed to this event
    *
    * @param eventName Name of the event whose handlers to invoke
    * @param sender The source that is triggering the event
    * @param eventArgs Event-specific arguments
    * @param handlerResultFilter Optional callback method to be able to break out of the handler invocation loop based on the return value of a handler. The filter should return true to break out of the loop.
    */
    invokeHandlers(eventName: string, sender?: TSender, eventArgs?: TEventArgs, handlerResultFilter?: (result: any) => boolean): void;
    private _getOrCreateHandlerList(eventName);
}
/**
* Represents a specific event that event listeners can attach to
*/
export class Event<TSender, TEventArgs> {
    private _handlers;
    /**
    * The list of handlers for this event
    */
    getHandlers(): EventHandlerList<TSender, TEventArgs>;
    /**
    * Invoke the handlers that have subscribed to this event
    *
    * @param sender The source that is triggering the event
    * @param eventArgs Event-specific arguments
    * @param handlerResultFilter Optional callback method to be able to break out of the handler invocation loop based on the return value of a handler. The filter should return true to break out of the loop.
    */
    invokeHandlers(sender: TSender, eventArgs: TEventArgs, handlerResultFilter?: (result: any) => boolean): void;
}
/**
* A list of event handlers
*/
export class EventHandlerList<TSender, TEventArgs> {
    private _handlers;
    /**
    * Creates a new event handler list
    *
    * @param handlers Optional initial list of handlers
    */
    constructor(handlers?: IFunctionPPR<TSender, TEventArgs, any>[]);
    /**
    * Adds an event handler to the list
    *
    * @param handler Event handler method to register
    */
    subscribe(handler: IFunctionPPR<TSender, TEventArgs, any>): void;
    /**
    * Removes an event handler from the list
    *
    * @param handler Event handler method to remove
    */
    unsubscribe(handler: IFunctionPPR<TSender, TEventArgs, any>): void;
    /**
    * Get the underlying list of handlers
    */
    getHandlers(): IFunctionPPR<TSender, TEventArgs, any>[];
}
/**
* Command Event Arguments data structure that can be used for "command" events
*/
export class CommandEventArgs {
    private _commandName;
    private _commandArgument;
    private _commandSource;
    constructor(commandName: string, commandArgument?: any, commandSource?: any);
    /**
    * Get the name of the command
    */
    get_commandName(): string;
    /**
    * Get arguments to the command
    */
    get_commandArgument(): any;
    /**
    * Get the source that triggered the event
    */
    get_commandSource(): any;
}
}
declare module "VSS/Events/Services" {
import Service = require("VSS/Service");
export class EventService implements Service.ILocalService {
    private _events;
    fire(eventName: string, sender?: any, eventArgs?: any): boolean;
    /**
     * Attatch a handler to an event.
     *
     * @param eventName The event name.
     * @param handler The handler to attach.
     */
    attachEvent(eventName: string, handler: IEventHandler): void;
    /**
     * Detatch a handler from an event.
     *
     * @param eventName The event name.
     * @param handler The handler to detach.
     */
    detachEvent(eventName: string, handler: IEventHandler): void;
    /**
     * Invoke the specified event passing the specified arguments.
     *
     * @param eventName The event to invoke.
     * @param sender The sender of the event.
     * @param args The arguments to pass through to the specified event.
     */
    private _fireEvent(eventName, sender?, args?);
}
export function getService(): EventService;
}
declare module "VSS/ExtensionManagement/Contracts" {
import VSS_Common_Contracts = require("VSS/WebApi/Contracts");
import VSS_Gallery_Contracts = require("VSS/Gallery/Contracts");
/**
 * An individual contribution made by an extension
 */
export interface Contribution extends ContributionBase {
    /**
     * List of constraints (filters) that should be applied to the availability of this contribution
     */
    constraints: ContributionConstraint[];
    /**
     * Properties/attributes of this contribution
     */
    properties: any;
    /**
     * The ids of the contribution(s) that this contribution targets. (parent contributions)
     */
    targets: string[];
    /**
     * Id of the Contribution Type
     */
    type: string;
}
/**
 * Base class shared by contributions and contribution types
 */
export interface ContributionBase {
    /**
     * Description of the contribution/type
     */
    description: string;
    /**
     * Extension-relative identifier of the contribution/type
     */
    id: string;
}
/**
 * Specifies a constraint that can be used to dynamically include/exclude a given contribution
 */
export interface ContributionConstraint {
    /**
     * An optional property that can be specified to group constraints together. All constraints within a group are AND'd together (all must be evaluate to True in order for the contribution to be included). Different groups of constraints are OR'd (only one group needs to evaluate to True for the contribution to be included).
     */
    group: number;
    /**
     * If true, negate the result of the filter (include the contribution if the applied filter returns false instead of true)
     */
    inverse: boolean;
    /**
     * Name of the IContributionFilter class
     */
    name: string;
    /**
     * Properties that are fed to the contribution filter class
     */
    properties: any;
}
/**
 * Identifier for contributions and contribution types
 */
export interface ContributionIdentifier {
    /**
     * The extension id
     */
    extensionId: string;
    /**
     * The full/unique identifier of the contribution/contributionType
     */
    id: string;
    /**
     * The publisher id
     */
    publisherId: string;
    /**
     * The extension-relative contribution id
     */
    relativeId: string;
}
/**
 * Description about a property of a contribution type
 */
export interface ContributionPropertyDescription {
    /**
     * Description of the property
     */
    description: string;
    /**
     * Name of the property
     */
    name: string;
    /**
     * True if this property is required
     */
    required: boolean;
    /**
     * The type of value used for this property
     */
    type: ContributionPropertyType;
}
export enum ContributionPropertyType {
    /**
     * Contribution type is unknown (value may be anything)
     */
    Unknown = 0,
    /**
     * Value is a string
     */
    String = 1,
    /**
     * Value is a Uri
     */
    Uri = 2,
    /**
     * Value is a GUID
     */
    Guid = 4,
    /**
     * Value is True or False
     */
    Boolean = 8,
    /**
     * Value is an integer
     */
    Integer = 16,
    /**
     * Value is a double
     */
    Double = 32,
    /**
     * Value is a DateTime object
     */
    DateTime = 64,
    /**
     * Value is a generic Dictionary/JObject/property bag
     */
    Dictionary = 128,
    /**
     * Value is an array
     */
    Array = 256,
    /**
     * Value is an arbitrary/custom object
     */
    Object = 512,
}
/**
 * A contribution type, given by a json schema
 */
export interface ContributionType extends ContributionBase {
    /**
     * Controls whether or not contributions of this type have the type indexed for queries. This allows clients to find all extensions that have a contribution of this type.  NOTE: Only TrustedPartners are allowed to specify indexed contribution types.
     */
    indexed: boolean;
    /**
     * Friendly name of the contribution/type
     */
    name: string;
    /**
     * Describes the allowed properties for this contribution type
     */
    properties: {
        [key: string]: ContributionPropertyDescription;
    };
}
/**
 * Contextual information that data providers can examine when populating their data
 */
export interface DataProviderContext {
    /**
     * Generic property bag that contains context-specific properties that data providers can use when populating their data dictionary
     */
    properties: {
        [key: string]: any;
    };
}
/**
 * A query that can be issued for data provider data
 */
export interface DataProviderQuery {
    /**
     * Contextual information to pass to the data providers
     */
    context: DataProviderContext;
    /**
     * The contribution ids of the data providers to resolve
     */
    contributionIds: string[];
}
/**
 * Result structure from calls to GetDataProviderData
 */
export interface DataProviderResult {
    /**
     * Property bag of data keyed off of the data provider contribution id
     */
    data: {
        [key: string]: any;
    };
    /**
     * List of data providers resolved in the data-provider query
     */
    resolvedProviders: ResolvedDataProvider[];
}
/**
 * Represents a VSTS "extension" which is a container for contributions and contribution types
 */
export interface Extension extends ExtensionManifest {
    /**
     * The friendly extension id for this extension - unique for a given publisher.
     */
    extensionId: string;
    /**
     * The display name of the extension.
     */
    extensionName: string;
    /**
     * Extension flags relevant to contribution consumers
     */
    flags: ExtensionFlags;
    /**
     * Unique id of the publisher of this extension
     */
    publisherId: string;
    /**
     * The display name of the publisher
     */
    publisherName: string;
    /**
     * Unique id for this extension (the same id is used for all versions of a single extension)
     */
    registrationId: string;
    /**
     * Version of this extension
     */
    version: string;
}
/**
 * Represents the state of an extension request
 */
export interface ExtensionAuditAction {
}
/**
 * Audit log for an extension
 */
export interface ExtensionAuditLog {
    /**
     * Collection of audit log entries
     */
    entries: ExtensionAuditLogEntry[];
    /**
     * Extension that the change was made for
     */
    extensionName: string;
    /**
     * Publisher that the extension is part of
     */
    publisherName: string;
}
/**
 * An audit log entry for an extension
 */
export interface ExtensionAuditLogEntry {
    /**
     * Change that was made to extension
     */
    auditAction: string;
    /**
     * Date at which the change was made
     */
    auditDate: Date;
    /**
     * Extra information about the change
     */
    comment: string;
    /**
     * Represents the user who made the change
     */
    updatedBy: VSS_Common_Contracts.IdentityRef;
}
/**
 * Represents a single collection for extension data documents
 */
export interface ExtensionDataCollection {
    /**
     * The name of the collection
     */
    collectionName: string;
    /**
     * A list of documents belonging to the collection
     */
    documents: any[];
    /**
     * The type of the collection's scope, such as Default or User
     */
    scopeType: string;
    /**
     * The value of the collection's scope, such as Current or Me
     */
    scopeValue: string;
}
/**
 * Represents a query to receive a set of extension data collections
 */
export interface ExtensionDataCollectionQuery {
    /**
     * A list of collections to query
     */
    collections: ExtensionDataCollection[];
}
/**
 * Base class for an event callback for an extension
 */
export interface ExtensionEventCallback {
    /**
     * The uri of the endpoint that is hit when an event occurs
     */
    uri: string;
}
/**
 * Collection of event callbacks - endpoints called when particular extension events occur.
 */
export interface ExtensionEventCallbackCollection {
    /**
     * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension disable has occurred.
     */
    postDisable: ExtensionEventCallback;
    /**
     * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension enable has occurred.
     */
    postEnable: ExtensionEventCallback;
    /**
     * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension install has completed.
     */
    postInstall: ExtensionEventCallback;
    /**
     * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension uninstall has occurred.
     */
    postUninstall: ExtensionEventCallback;
    /**
     * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension update has occurred.
     */
    postUpdate: ExtensionEventCallback;
    /**
     * Optional.  Defines an endpoint that gets called via a POST reqeust to notify that an extension install is about to occur.  Response indicates whether to proceed or abort.
     */
    preInstall: ExtensionEventCallback;
    /**
     * For multi-version extensions, defines an endpoint that gets called via an OPTIONS request to determine the particular version of the extension to be used
     */
    versionCheck: ExtensionEventCallback;
}
export enum ExtensionFlags {
    /**
     * A built-in extension is installed for all VSTS accounts by default
     */
    BuiltIn = 1,
    /**
     * The extension comes from a fully-trusted publisher
     */
    Trusted = 2,
}
/**
 * Base class for extension properties which are shared by the extension manifest and the extension model
 */
export interface ExtensionManifest {
    /**
     * Uri used as base for other relative uri's defined in extension
     */
    baseUri: string;
    /**
     * List of contributions made by this extension
     */
    contributions: Contribution[];
    /**
     * List of contribution types defined by this extension
     */
    contributionTypes: ContributionType[];
    /**
     * Collection of endpoints that get called when particular extension events occur
     */
    eventCallbacks: ExtensionEventCallbackCollection;
    /**
     * Language Culture Name set by the Gallery
     */
    language: string;
    /**
     * Version of the extension manifest format/content
     */
    manifestVersion: number;
    /**
     * List of all oauth scopes required by this extension
     */
    scopes: string[];
    /**
     * The ServiceInstanceType(Guid) of the VSTS service that must be available to an account in order for the extension to be installed
     */
    serviceInstanceType: string;
}
/**
 * A request for an extension (to be installed or have a license assigned)
 */
export interface ExtensionRequest {
    /**
     * Required message supplied if the request is rejected
     */
    rejectMessage: string;
    /**
     * Date at which the request was made
     */
    requestDate: Date;
    /**
     * Represents the user who made the request
     */
    requestedBy: VSS_Common_Contracts.IdentityRef;
    /**
     * Optional message supplied by the requester justifying the request
     */
    requestMessage: string;
    /**
     * Represents the state of the request
     */
    requestState: ExtensionRequestState;
    /**
     * Date at which the request was resolved
     */
    resolveDate: Date;
    /**
     * Represents the user who resolved the request
     */
    resolvedBy: VSS_Common_Contracts.IdentityRef;
}
export enum ExtensionRequestState {
    /**
     * The request has been opened, but not yet responded to
     */
    Open = 0,
    /**
     * The request was accepted (extension installed or license assigned)
     */
    Accepted = 1,
    /**
     * The request was rejected (extension not installed or license not assigned)
     */
    Rejected = 2,
}
/**
 * The state of an extension
 */
export interface ExtensionState extends InstalledExtensionState {
    extensionName: string;
    /**
     * The time at which the version was last checked
     */
    lastVersionCheck: Date;
    publisherName: string;
    version: string;
}
export enum ExtensionStateFlags {
    /**
     * No flags set
     */
    None = 0,
    /**
     * Extension is disabled
     */
    Disabled = 1,
    /**
     * Extension is a built in
     */
    BuiltIn = 2,
    /**
     * Extension has multiple versions
     */
    MultiVersion = 4,
    /**
     * Extension is not installed.  This is for builtin extensions only and can not otherwise be set.
     */
    UnInstalled = 8,
    /**
     * Error performing version check
     */
    VersionCheckError = 16,
    /**
     * Trusted extensions are ones that are given special capabilities. These tend to come from Microsoft and can't be published by the general public.  Note: BuiltIn extensions are always trusted.
     */
    Trusted = 32,
    /**
     * Extension is currently in an error state
     */
    Error = 64,
}
/**
 * Represents a VSTS extension along with its installation state
 */
export interface InstalledExtension extends Extension {
    /**
     * Information about this particular installation of the extension
     */
    installState: InstalledExtensionState;
}
export interface InstalledExtensionQuery {
    monikers: VSS_Gallery_Contracts.ExtensionIdentifier[];
}
/**
 * The state of an installed extension
 */
export interface InstalledExtensionState {
    /**
     * States of an installed extension
     */
    flags: ExtensionStateFlags;
    /**
     * The time at which this installation was last updated
     */
    lastUpdated: Date;
}
/**
 * A request for an extension (to be installed or have a license assigned)
 */
export interface RequestedExtension {
    /**
     * THe unique name of the extensions
     */
    extensionName: string;
    /**
     * A list of each request for the extension
     */
    extensionRequests: ExtensionRequest[];
    /**
     * DisplayName of the publisher that owns the extension being published.
     */
    publisherDisplayName: string;
    /**
     * Represents the Publisher of the requested extension
     */
    publisherName: string;
    /**
     * The total number of requests for an extension
     */
    requestCount: number;
}
/**
 * Entry for a specific data provider's resulting data
 */
export interface ResolvedDataProvider {
    /**
     * The total time the data provider took to resolve its data (in milliseconds)
     */
    duration: number;
    error: string;
    id: string;
}
export interface Scope {
    description: string;
    title: string;
    value: string;
}
/**
 * Information about the extension
 */
export interface SupportedExtension {
    /**
     * Unique Identifier for this extension
     */
    extension: string;
    /**
     * Unique Identifier for this publisher
     */
    publisher: string;
    /**
     * Supported version for this extension
     */
    version: string;
}
export var TypeInfo: {
    Contribution: {
        fields: any;
    };
    ContributionBase: {
        fields: any;
    };
    ContributionConstraint: {
        fields: any;
    };
    ContributionIdentifier: {
        fields: any;
    };
    ContributionPropertyDescription: {
        fields: any;
    };
    ContributionPropertyType: {
        enumValues: {
            "unknown": number;
            "string": number;
            "uri": number;
            "guid": number;
            "boolean": number;
            "integer": number;
            "double": number;
            "dateTime": number;
            "dictionary": number;
            "array": number;
            "object": number;
        };
    };
    ContributionType: {
        fields: any;
    };
    DataProviderContext: {
        fields: any;
    };
    DataProviderQuery: {
        fields: any;
    };
    DataProviderResult: {
        fields: any;
    };
    Extension: {
        fields: any;
    };
    ExtensionAuditAction: {
        fields: any;
    };
    ExtensionAuditLog: {
        fields: any;
    };
    ExtensionAuditLogEntry: {
        fields: any;
    };
    ExtensionDataCollection: {
        fields: any;
    };
    ExtensionDataCollectionQuery: {
        fields: any;
    };
    ExtensionEventCallback: {
        fields: any;
    };
    ExtensionEventCallbackCollection: {
        fields: any;
    };
    ExtensionFlags: {
        enumValues: {
            "builtIn": number;
            "trusted": number;
        };
    };
    ExtensionManifest: {
        fields: any;
    };
    ExtensionRequest: {
        fields: any;
    };
    ExtensionRequestState: {
        enumValues: {
            "open": number;
            "accepted": number;
            "rejected": number;
        };
    };
    ExtensionState: {
        fields: any;
    };
    ExtensionStateFlags: {
        enumValues: {
            "none": number;
            "disabled": number;
            "builtIn": number;
            "multiVersion": number;
            "unInstalled": number;
            "versionCheckError": number;
            "trusted": number;
            "error": number;
        };
    };
    InstalledExtension: {
        fields: any;
    };
    InstalledExtensionQuery: {
        fields: any;
    };
    InstalledExtensionState: {
        fields: any;
    };
    RequestedExtension: {
        fields: any;
    };
    ResolvedDataProvider: {
        fields: any;
    };
    Scope: {
        fields: any;
    };
    SupportedExtension: {
        fields: any;
    };
};
}
declare module "VSS/ExtensionManagement/RestClient" {
import Contracts = require("VSS/ExtensionManagement/Contracts");
import VSS_Gallery_Contracts = require("VSS/Gallery/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class ExtensionManagementHttpClient3 extends VSS_WebApi.VssHttpClient {
    static serviceInstanceId: string;
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {any} doc
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} scopeType
     * @param {string} scopeValue
     * @param {string} collectionName
     * @return IPromise<any>
     */
    createDocumentByName(doc: any, publisherName: string, extensionName: string, scopeType: string, scopeValue: string, collectionName: string): IPromise<any>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} scopeType
     * @param {string} scopeValue
     * @param {string} collectionName
     * @param {string} documentId
     * @return IPromise<void>
     */
    deleteDocumentByName(publisherName: string, extensionName: string, scopeType: string, scopeValue: string, collectionName: string, documentId: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} scopeType
     * @param {string} scopeValue
     * @param {string} collectionName
     * @param {string} documentId
     * @return IPromise<any>
     */
    getDocumentByName(publisherName: string, extensionName: string, scopeType: string, scopeValue: string, collectionName: string, documentId: string): IPromise<any>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} scopeType
     * @param {string} scopeValue
     * @param {string} collectionName
     * @return IPromise<any[]>
     */
    getDocumentsByName(publisherName: string, extensionName: string, scopeType: string, scopeValue: string, collectionName: string): IPromise<any[]>;
    /**
     * [Preview API]
     *
     * @param {any} doc
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} scopeType
     * @param {string} scopeValue
     * @param {string} collectionName
     * @return IPromise<any>
     */
    setDocumentByName(doc: any, publisherName: string, extensionName: string, scopeType: string, scopeValue: string, collectionName: string): IPromise<any>;
    /**
     * [Preview API]
     *
     * @param {any} doc
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} scopeType
     * @param {string} scopeValue
     * @param {string} collectionName
     * @return IPromise<any>
     */
    updateDocumentByName(doc: any, publisherName: string, extensionName: string, scopeType: string, scopeValue: string, collectionName: string): IPromise<any>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionDataCollectionQuery} collectionQuery
     * @param {string} publisherName
     * @param {string} extensionName
     * @return IPromise<Contracts.ExtensionDataCollection[]>
     */
    queryCollectionsByName(collectionQuery: Contracts.ExtensionDataCollectionQuery, publisherName: string, extensionName: string): IPromise<Contracts.ExtensionDataCollection[]>;
    /**
     * [Preview API]
     *
     * @param {boolean} includeDisabled
     * @param {boolean} includeErrors
     * @return IPromise<Contracts.ExtensionState[]>
     */
    getStates(includeDisabled?: boolean, includeErrors?: boolean): IPromise<Contracts.ExtensionState[]>;
    /**
     * [Preview API]
     *
     * @param {Contracts.InstalledExtensionQuery} query
     * @return IPromise<Contracts.InstalledExtension[]>
     */
    queryExtensions(query: Contracts.InstalledExtensionQuery): IPromise<Contracts.InstalledExtension[]>;
    /**
     * [Preview API]
     *
     * @param {boolean} includeDisabledExtensions
     * @param {boolean} includeErrors
     * @return IPromise<Contracts.InstalledExtension[]>
     */
    getInstalledExtensions(includeDisabledExtensions?: boolean, includeErrors?: boolean): IPromise<Contracts.InstalledExtension[]>;
    /**
     * [Preview API]
     *
     * @param {Contracts.InstalledExtension} extension
     * @return IPromise<Contracts.InstalledExtension>
     */
    installExtension(extension: Contracts.InstalledExtension): IPromise<Contracts.InstalledExtension>;
    /**
     * [Preview API]
     *
     * @param {Contracts.InstalledExtension} extension
     * @return IPromise<Contracts.InstalledExtension>
     */
    updateInstalledExtension(extension: Contracts.InstalledExtension): IPromise<Contracts.InstalledExtension>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @return IPromise<Contracts.InstalledExtension>
     */
    getInstalledExtensionByName(publisherName: string, extensionName: string): IPromise<Contracts.InstalledExtension>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @return IPromise<Contracts.InstalledExtension>
     */
    installExtensionByName(publisherName: string, extensionName: string, version?: string): IPromise<Contracts.InstalledExtension>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} reason
     * @param {string} reasonCode
     * @return IPromise<void>
     */
    uninstallExtensionByName(publisherName: string, extensionName: string, reason?: string, reasonCode?: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} userId
     * @return IPromise<VSS_Gallery_Contracts.UserExtensionPolicy>
     */
    getPolicies(userId: string): IPromise<VSS_Gallery_Contracts.UserExtensionPolicy>;
    /**
     * [Preview API]
     *
     * @param {string} rejectMessage
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} requesterId
     * @param {Contracts.ExtensionRequestState} state
     * @return IPromise<number>
     */
    resolveRequest(rejectMessage: string, publisherName: string, extensionName: string, requesterId: string, state: Contracts.ExtensionRequestState): IPromise<number>;
    /**
     * [Preview API]
     *
     * @return IPromise<Contracts.RequestedExtension[]>
     */
    getRequests(): IPromise<Contracts.RequestedExtension[]>;
    /**
     * [Preview API]
     *
     * @param {string} rejectMessage
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {Contracts.ExtensionRequestState} state
     * @return IPromise<number>
     */
    resolveAllRequests(rejectMessage: string, publisherName: string, extensionName: string, state: Contracts.ExtensionRequestState): IPromise<number>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @return IPromise<void>
     */
    deleteRequest(publisherName: string, extensionName: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} requestMessage
     * @return IPromise<Contracts.RequestedExtension>
     */
    requestExtension(publisherName: string, extensionName: string, requestMessage: string): IPromise<Contracts.RequestedExtension>;
    /**
     * [Preview API]
     *
     * @return IPromise<string>
     */
    getToken(): IPromise<string>;
}
/**
 * @exemptedapi
 */
export class ExtensionManagementHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    static serviceInstanceId: string;
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {any} doc
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} scopeType
     * @param {string} scopeValue
     * @param {string} collectionName
     * @return IPromise<any>
     */
    createDocumentByName(doc: any, publisherName: string, extensionName: string, scopeType: string, scopeValue: string, collectionName: string): IPromise<any>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} scopeType
     * @param {string} scopeValue
     * @param {string} collectionName
     * @param {string} documentId
     * @return IPromise<void>
     */
    deleteDocumentByName(publisherName: string, extensionName: string, scopeType: string, scopeValue: string, collectionName: string, documentId: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} scopeType
     * @param {string} scopeValue
     * @param {string} collectionName
     * @param {string} documentId
     * @return IPromise<any>
     */
    getDocumentByName(publisherName: string, extensionName: string, scopeType: string, scopeValue: string, collectionName: string, documentId: string): IPromise<any>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} scopeType
     * @param {string} scopeValue
     * @param {string} collectionName
     * @return IPromise<any[]>
     */
    getDocumentsByName(publisherName: string, extensionName: string, scopeType: string, scopeValue: string, collectionName: string): IPromise<any[]>;
    /**
     * [Preview API]
     *
     * @param {any} doc
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} scopeType
     * @param {string} scopeValue
     * @param {string} collectionName
     * @return IPromise<any>
     */
    setDocumentByName(doc: any, publisherName: string, extensionName: string, scopeType: string, scopeValue: string, collectionName: string): IPromise<any>;
    /**
     * [Preview API]
     *
     * @param {any} doc
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} scopeType
     * @param {string} scopeValue
     * @param {string} collectionName
     * @return IPromise<any>
     */
    updateDocumentByName(doc: any, publisherName: string, extensionName: string, scopeType: string, scopeValue: string, collectionName: string): IPromise<any>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionDataCollectionQuery} collectionQuery
     * @param {string} publisherName
     * @param {string} extensionName
     * @return IPromise<Contracts.ExtensionDataCollection[]>
     */
    queryCollectionsByName(collectionQuery: Contracts.ExtensionDataCollectionQuery, publisherName: string, extensionName: string): IPromise<Contracts.ExtensionDataCollection[]>;
    /**
     * [Preview API]
     *
     * @param {boolean} includeDisabled
     * @param {boolean} includeErrors
     * @return IPromise<Contracts.ExtensionState[]>
     */
    getStates(includeDisabled?: boolean, includeErrors?: boolean): IPromise<Contracts.ExtensionState[]>;
    /**
     * [Preview API]
     *
     * @param {Contracts.InstalledExtensionQuery} query
     * @return IPromise<Contracts.InstalledExtension[]>
     */
    queryExtensions(query: Contracts.InstalledExtensionQuery): IPromise<Contracts.InstalledExtension[]>;
    /**
     * [Preview API]
     *
     * @param {boolean} includeDisabledExtensions
     * @param {boolean} includeErrors
     * @return IPromise<Contracts.InstalledExtension[]>
     */
    getInstalledExtensions(includeDisabledExtensions?: boolean, includeErrors?: boolean): IPromise<Contracts.InstalledExtension[]>;
    /**
     * [Preview API]
     *
     * @param {Contracts.InstalledExtension} extension
     * @return IPromise<Contracts.InstalledExtension>
     */
    installExtension(extension: Contracts.InstalledExtension): IPromise<Contracts.InstalledExtension>;
    /**
     * [Preview API]
     *
     * @param {Contracts.InstalledExtension} extension
     * @return IPromise<Contracts.InstalledExtension>
     */
    updateInstalledExtension(extension: Contracts.InstalledExtension): IPromise<Contracts.InstalledExtension>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @return IPromise<Contracts.InstalledExtension>
     */
    getInstalledExtensionByName(publisherName: string, extensionName: string): IPromise<Contracts.InstalledExtension>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @return IPromise<Contracts.InstalledExtension>
     */
    installExtensionByName(publisherName: string, extensionName: string, version?: string): IPromise<Contracts.InstalledExtension>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} reason
     * @param {string} reasonCode
     * @return IPromise<void>
     */
    uninstallExtensionByName(publisherName: string, extensionName: string, reason?: string, reasonCode?: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} userId
     * @return IPromise<VSS_Gallery_Contracts.UserExtensionPolicy>
     */
    getPolicies(userId: string): IPromise<VSS_Gallery_Contracts.UserExtensionPolicy>;
    /**
     * [Preview API]
     *
     * @param {string} rejectMessage
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} requesterId
     * @param {Contracts.ExtensionRequestState} state
     * @return IPromise<number>
     */
    resolveRequest(rejectMessage: string, publisherName: string, extensionName: string, requesterId: string, state: Contracts.ExtensionRequestState): IPromise<number>;
    /**
     * [Preview API]
     *
     * @return IPromise<Contracts.RequestedExtension[]>
     */
    getRequests(): IPromise<Contracts.RequestedExtension[]>;
    /**
     * [Preview API]
     *
     * @param {string} rejectMessage
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {Contracts.ExtensionRequestState} state
     * @return IPromise<number>
     */
    resolveAllRequests(rejectMessage: string, publisherName: string, extensionName: string, state: Contracts.ExtensionRequestState): IPromise<number>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @return IPromise<void>
     */
    deleteRequest(publisherName: string, extensionName: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} requestMessage
     * @return IPromise<Contracts.RequestedExtension>
     */
    requestExtension(publisherName: string, extensionName: string, requestMessage: string): IPromise<Contracts.RequestedExtension>;
    /**
     * [Preview API]
     *
     * @return IPromise<string>
     */
    getToken(): IPromise<string>;
}
export class ExtensionManagementHttpClient extends ExtensionManagementHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return ExtensionManagementHttpClient2_2
 */
export function getClient(): ExtensionManagementHttpClient2_2;
}
declare module "VSS/FeatureAvailability/Contracts" {
export interface FeatureFlag {
    description: string;
    effectiveState: string;
    explicitState: string;
    name: string;
    uri: string;
}
/**
 * This is passed to the FeatureFlagController to edit the status of a feature flag
 */
export interface FeatureFlagPatch {
    state: string;
}
export var TypeInfo: {
    FeatureFlag: {
        fields: any;
    };
    FeatureFlagPatch: {
        fields: any;
    };
};
}
declare module "VSS/FeatureAvailability/RestClient" {
import Contracts = require("VSS/FeatureAvailability/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class FeatureAvailabilityHttpClient3 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API] Retrieve a listing of all feature flags and their current states for a user
     *
     * @param {string} userEmail - The email of the user to check
     * @return IPromise<Contracts.FeatureFlag[]>
     */
    getAllFeatureFlags(userEmail?: string): IPromise<Contracts.FeatureFlag[]>;
    /**
     * [Preview API] Retrieve information on a single feature flag and its current states
     *
     * @param {string} name - The name of the feature to retrieve
     * @return IPromise<Contracts.FeatureFlag>
     */
    getFeatureFlagByName(name: string): IPromise<Contracts.FeatureFlag>;
    /**
     * [Preview API] Retrieve information on a single feature flag and its current states for a user
     *
     * @param {string} name - The name of the feature to retrieve
     * @param {string} userEmail - The email of the user to check
     * @return IPromise<Contracts.FeatureFlag>
     */
    getFeatureFlagByNameAndUserEmail(name: string, userEmail: string): IPromise<Contracts.FeatureFlag>;
    /**
     * [Preview API] Retrieve information on a single feature flag and its current states for a user
     *
     * @param {string} name - The name of the feature to retrieve
     * @param {string} userId - The id of the user to check
     * @return IPromise<Contracts.FeatureFlag>
     */
    getFeatureFlagByNameAndUserId(name: string, userId: string): IPromise<Contracts.FeatureFlag>;
    /**
     * [Preview API] Change the state of an individual feature flag for a name
     *
     * @param {Contracts.FeatureFlagPatch} state - State that should be set
     * @param {string} name - The name of the feature to change
     * @param {string} userEmail
     * @return IPromise<Contracts.FeatureFlag>
     */
    updateFeatureFlag(state: Contracts.FeatureFlagPatch, name: string, userEmail?: string): IPromise<Contracts.FeatureFlag>;
}
/**
 * @exemptedapi
 */
export class FeatureAvailabilityHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API] Retrieve a listing of all feature flags and their current states for a user
     *
     * @param {string} userEmail - The email of the user to check
     * @return IPromise<Contracts.FeatureFlag[]>
     */
    getAllFeatureFlags(userEmail?: string): IPromise<Contracts.FeatureFlag[]>;
    /**
     * [Preview API] Retrieve information on a single feature flag and its current states
     *
     * @param {string} name - The name of the feature to retrieve
     * @return IPromise<Contracts.FeatureFlag>
     */
    getFeatureFlagByName(name: string): IPromise<Contracts.FeatureFlag>;
    /**
     * [Preview API] Retrieve information on a single feature flag and its current states for a user
     *
     * @param {string} name - The name of the feature to retrieve
     * @param {string} userEmail - The email of the user to check
     * @return IPromise<Contracts.FeatureFlag>
     */
    getFeatureFlagByNameAndUserEmail(name: string, userEmail: string): IPromise<Contracts.FeatureFlag>;
    /**
     * [Preview API] Retrieve information on a single feature flag and its current states for a user
     *
     * @param {string} name - The name of the feature to retrieve
     * @param {string} userId - The id of the user to check
     * @return IPromise<Contracts.FeatureFlag>
     */
    getFeatureFlagByNameAndUserId(name: string, userId: string): IPromise<Contracts.FeatureFlag>;
    /**
     * [Preview API] Change the state of an individual feature flag for a name
     *
     * @param {Contracts.FeatureFlagPatch} state - State that should be set
     * @param {string} name - The name of the feature to change
     * @param {string} userEmail
     * @return IPromise<Contracts.FeatureFlag>
     */
    updateFeatureFlag(state: Contracts.FeatureFlagPatch, name: string, userEmail?: string): IPromise<Contracts.FeatureFlag>;
}
export class FeatureAvailabilityHttpClient extends FeatureAvailabilityHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return FeatureAvailabilityHttpClient2_2
 */
export function getClient(): FeatureAvailabilityHttpClient2_2;
}
declare module "VSS/FeatureAvailability/Services" {
import Service = require("VSS/Service");
/**
* Service to manage feature availability data
*/
export class FeatureAvailabilityService extends Service.VssService {
    private _featureStatesCache;
    private _httpClient;
    constructor();
    /**
     * Uses the default service to perform a local-only check to determine if the feature is enabled.
     * This requires the feature to be present on the the page scope feature-availability-data island.
     *
     * @param featureName Feature name
     * @param defaultValue Value to return if the feature is not present in page context data.
     */
    static isFeatureEnabled(featureName: string, defaultValue?: boolean): boolean;
    /**
     * Returns whether or not a feature is enabled.
     *
     * @param featureName Feature name
     * @param callback
     * Success callback, taking one parameter (boolean) - the feature availability state
     *
     * @param errorCallback Error callback
     */
    beginIsFeatureEnabled(featureName: string, callback: IResultCallback, errorCallback?: IErrorCallback): void;
    /**
     * Performs a local-only check to determine if the feature is enabled. This requires the feature to be present on the the page scope feature-availability-data island.
     *
     * @param featureName Feature name
     * @param defaultValue Value to return if the feature is not present in page context data.
     */
    isFeatureEnabledLocal(featureName: string, defaultValue?: boolean): boolean;
    /**
     * Returns the cache state for the supplied feature after ensuring the data island has been read.
     */
    private _readLocalState(featureName);
}
}
declare module "VSS/FileContainer/Contracts" {
export enum ContainerItemStatus {
    /**
     * Item is created.
     */
    Created = 1,
    /**
     * Item is a file pending for upload.
     */
    PendingUpload = 2,
}
export enum ContainerItemType {
    /**
     * Any item type.
     */
    Any = 0,
    /**
     * Item is a folder which can have child items.
     */
    Folder = 1,
    /**
     * Item is a file which is stored in the file service.
     */
    File = 2,
}
export enum ContainerOptions {
    /**
     * No option.
     */
    None = 0,
}
/**
 * Represents a container that encapsulates a hierarchical file system.
 */
export interface FileContainer {
    /**
     * Uri of the artifact associated with the container.
     */
    artifactUri: string;
    /**
     * Download Url for the content of this item.
     */
    contentLocation: string;
    /**
     * Owner.
     */
    createdBy: string;
    /**
     * Creation date.
     */
    dateCreated: Date;
    /**
     * Description.
     */
    description: string;
    /**
     * Id.
     */
    id: number;
    /**
     * Location of the item resource.
     */
    itemLocation: string;
    /**
     * Name.
     */
    name: string;
    /**
     * Options the container can have.
     */
    options: ContainerOptions;
    /**
     * Project Id.
     */
    scopeIdentifier: string;
    /**
     * Security token of the artifact associated with the container.
     */
    securityToken: string;
    /**
     * Identifier of the optional encryption key.
     */
    signingKeyId: string;
    /**
     * Total size of the files in bytes.
     */
    size: number;
}
/**
 * Represents an item in a container.
 */
export interface FileContainerItem {
    /**
     * Container Id.
     */
    containerId: number;
    contentId: number[];
    /**
     * Download Url for the content of this item.
     */
    contentLocation: string;
    /**
     * Creator.
     */
    createdBy: string;
    /**
     * Creation date.
     */
    dateCreated: Date;
    /**
     * Last modified date.
     */
    dateLastModified: Date;
    /**
     * Encoding of the file. Zero if not a file.
     */
    fileEncoding: number;
    /**
     * Hash value of the file. Null if not a file.
     */
    fileHash: number[];
    /**
     * Length of the file. Zero if not of a file.
     */
    fileLength: number;
    /**
     * Type of the file. Zero if not a file.
     */
    fileType: number;
    /**
     * Location of the item resource.
     */
    itemLocation: string;
    /**
     * Type of the item: Folder, File or String.
     */
    itemType: ContainerItemType;
    /**
     * Modifier.
     */
    lastModifiedBy: string;
    /**
     * Unique path that identifies the item.
     */
    path: string;
    /**
     * Project Id.
     */
    scopeIdentifier: string;
    /**
     * Status of the item: Created or Pending Upload.
     */
    status: ContainerItemStatus;
    ticket: string;
}
export var TypeInfo: {
    ContainerItemStatus: {
        enumValues: {
            "created": number;
            "pendingUpload": number;
        };
    };
    ContainerItemType: {
        enumValues: {
            "any": number;
            "folder": number;
            "file": number;
        };
    };
    ContainerOptions: {
        enumValues: {
            "none": number;
        };
    };
    FileContainer: {
        fields: any;
    };
    FileContainerItem: {
        fields: any;
    };
};
}
declare module "VSS/FileContainer/RestClient" {
import Contracts = require("VSS/FileContainer/Contracts");
import VSS_Common_Contracts = require("VSS/WebApi/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class FileContainerHttpClient3 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API] Creates the specified item in the container referenced container.
     *
     * @param {string} content - Content to upload
     * @param {number} containerId
     * @param {string} itemPath
     * @param {string} scope - A guid representing the scope of the container. This is often the project id.
     * @return IPromise<Contracts.FileContainerItem>
     */
    createItem(content: string, containerId: number, itemPath: string, scope?: string): IPromise<Contracts.FileContainerItem>;
    /**
     * [Preview API] Creates the specified items in in the referenced container.
     *
     * @param {VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.FileContainerItem[]>} items
     * @param {number} containerId
     * @param {string} scope - A guid representing the scope of the container. This is often the project id.
     * @return IPromise<Contracts.FileContainerItem[]>
     */
    createItems(items: VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.FileContainerItem[]>, containerId: number, scope?: string): IPromise<Contracts.FileContainerItem[]>;
    /**
     * [Preview API] Deletes the specified items in a container.
     *
     * @param {number} containerId - Container Id.
     * @param {string} itemPath - Path to delete.
     * @param {string} scope - A guid representing the scope of the container. This is often the project id.
     * @return IPromise<void>
     */
    deleteItem(containerId: number, itemPath: string, scope?: string): IPromise<void>;
    /**
     * [Preview API] Gets containers filtered by a comma separated list of artifact uris within the same scope, if not specified returns all containers
     *
     * @param {string} scope - A guid representing the scope of the container. This is often the project id.
     * @param {string} artifactUris
     * @return IPromise<Contracts.FileContainer[]>
     */
    getContainers(scope?: string, artifactUris?: string): IPromise<Contracts.FileContainer[]>;
    /**
     * [Preview API]
     *
     * @param {number} containerId
     * @param {string} scope
     * @param {string} itemPath
     * @param {boolean} metadata
     * @param {string} format
     * @param {string} downloadFileName
     * @param {boolean} includeDownloadTickets
     * @param {boolean} isShallow
     * @return IPromise<Contracts.FileContainerItem[]>
     */
    getItems(containerId: number, scope?: string, itemPath?: string, metadata?: boolean, format?: string, downloadFileName?: string, includeDownloadTickets?: boolean, isShallow?: boolean): IPromise<Contracts.FileContainerItem[]>;
    /**
     * [Preview API] Allow browsing of file ,the contentDisposition is inline and Content-Type is determined by FileExtension
     *
     * @param {number} container
     * @param {string} itemPath - The path to the item of interest
     * @return IPromise<Contracts.FileContainerItem[]>
     */
    browseItems(container: number, itemPath?: string): IPromise<Contracts.FileContainerItem[]>;
}
/**
 * @exemptedapi
 */
export class FileContainerHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API] Creates the specified item in the container referenced container.
     *
     * @param {string} content - Content to upload
     * @param {number} containerId
     * @param {string} itemPath
     * @param {string} scope - A guid representing the scope of the container. This is often the project id.
     * @return IPromise<Contracts.FileContainerItem>
     */
    createItem(content: string, containerId: number, itemPath: string, scope?: string): IPromise<Contracts.FileContainerItem>;
    /**
     * [Preview API] Creates the specified items in in the referenced container.
     *
     * @param {VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.FileContainerItem[]>} items
     * @param {number} containerId
     * @param {string} scope - A guid representing the scope of the container. This is often the project id.
     * @return IPromise<Contracts.FileContainerItem[]>
     */
    createItems(items: VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.FileContainerItem[]>, containerId: number, scope?: string): IPromise<Contracts.FileContainerItem[]>;
    /**
     * [Preview API] Deletes the specified items in a container.
     *
     * @param {number} containerId - Container Id.
     * @param {string} itemPath - Path to delete.
     * @param {string} scope - A guid representing the scope of the container. This is often the project id.
     * @return IPromise<void>
     */
    deleteItem(containerId: number, itemPath: string, scope?: string): IPromise<void>;
    /**
     * [Preview API] Gets containers filtered by a comma separated list of artifact uris within the same scope, if not specified returns all containers
     *
     * @param {string} scope - A guid representing the scope of the container. This is often the project id.
     * @param {string} artifactUris
     * @return IPromise<Contracts.FileContainer[]>
     */
    getContainers(scope?: string, artifactUris?: string): IPromise<Contracts.FileContainer[]>;
    /**
     * [Preview API]
     *
     * @param {number} containerId
     * @param {string} scope
     * @param {string} itemPath
     * @param {boolean} metadata
     * @param {string} format
     * @param {string} downloadFileName
     * @param {boolean} includeDownloadTickets
     * @param {boolean} isShallow
     * @return IPromise<Contracts.FileContainerItem[]>
     */
    getItems(containerId: number, scope?: string, itemPath?: string, metadata?: boolean, format?: string, downloadFileName?: string, includeDownloadTickets?: boolean, isShallow?: boolean): IPromise<Contracts.FileContainerItem[]>;
    /**
     * [Preview API] Allow browsing of file ,the contentDisposition is inline and Content-Type is determined by FileExtension
     *
     * @param {number} container
     * @param {string} itemPath - The path to the item of interest
     * @return IPromise<Contracts.FileContainerItem[]>
     */
    browseItems(container: number, itemPath?: string): IPromise<Contracts.FileContainerItem[]>;
}
export class FileContainerHttpClient extends FileContainerHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return FileContainerHttpClient2_2
 */
export function getClient(): FileContainerHttpClient2_2;
}
declare module "VSS/FileContainer/Services" {
import FileContainer_Contracts = require("VSS/FileContainer/Contracts");
import Service = require("VSS/Service");
export interface FileContainerPathInfo {
    containerId: number;
    path: string;
}
/**
* Service to manage file container data
*/
export class FileContainerService extends Service.VssService {
    private _httpClient;
    /**
     * Returns a list of file container items
     *
     * @param containerId The id of the container
     * @param scope The scope of the items
     * @param itemPath The path of the item within the container
     */
    beginGetItems(containerId: number, scope: string, itemPath: string): IPromise<FileContainer_Contracts.FileContainerItem[]>;
    /**
     * Returns the file container info
     *
     * @param fileContainerPath The path of the container. For example, "#/12/drop".
     */
    parseContainerPath(fileContainerPath: string): FileContainerPathInfo;
}
}
declare module "VSS/Gallery/Contracts" {
export enum AcquisitionAssignmentType {
    None = 0,
    /**
     * Just assign for me
     */
    Me = 1,
    /**
     * Assign for all users in the account
     */
    All = 2,
}
export interface AcquisitionOperation {
    /**
     * State of the the AcquisitionOperation for the current user
     */
    operationState: AcquisitionOperationState;
    /**
     * AcquisitionOperationType: install, request, buy, etc...
     */
    operationType: AcquisitionOperationType;
    /**
     * Optional reason to justify current state. Typically used with Disallow state.
     */
    reason: string;
}
export enum AcquisitionOperationState {
    /**
     * Not allowed to use this AcquisitionOperation
     */
    Disallow = 0,
    /**
     * Allowed to use this AcquisitionOperation
     */
    Allow = 1,
    /**
     * Operation has already been completed and is no longer available
     */
    Completed = 3,
}
export enum AcquisitionOperationType {
    /**
     * Not yet used
     */
    Get = 0,
    /**
     * Install this extension into the host provided
     */
    Install = 1,
    /**
     * Buy licenses for this extension and install into the host provided
     */
    Buy = 2,
    /**
     * Not yet used
     */
    Try = 3,
    /**
     * Not yet used
     */
    Request = 4,
    /**
     * No action found
     */
    None = 5,
}
/**
 * Market item acquisition options (install, buy, etc) for an installation target.
 */
export interface AcquisitionOptions {
    /**
     * Default Operation for the ItemId in this target
     */
    defaultOperation: AcquisitionOperation;
    /**
     * The item id that this options refer to
     */
    itemId: string;
    /**
     * Operations allowed for the ItemId in this target
     */
    operations: AcquisitionOperation[];
    /**
     * The target that this options refer to
     */
    target: string;
}
export enum ConcernCategory {
    General = 1,
    Abusive = 2,
    Spam = 4,
}
/**
 * Contract for handling the extension acquisition process
 */
export interface ExtensionAcquisitionRequest {
    /**
     * How the item is being assigned
     */
    assignmentType: AcquisitionAssignmentType;
    /**
     * The id of the subscription used for purchase
     */
    billingId: string;
    /**
     * The marketplace id (publisherName.extensionName) for the item
     */
    itemId: string;
    /**
     * The type of operation, such as install, request, purchase
     */
    operationType: AcquisitionOperationType;
    /**
     * Additional properties which can be added to the request.
     */
    properties: any;
    /**
     * How many licenses should be purchased
     */
    quantity: number;
    /**
     * A list of target guids where the item should be acquired (installed, requested, etc.), such as account id
     */
    targets: string[];
}
export interface ExtensionCategory {
    categoryId: number;
    categoryName: string;
    language: string;
}
export interface ExtensionFile {
    assetType: string;
    contentType: string;
    fileId: number;
    isDefault: boolean;
    isPublic: boolean;
    language: string;
    shortDescription: string;
    source: string;
    version: string;
}
/**
 * The FilterResult is the set of extensions that matched a particular query filter.
 */
export interface ExtensionFilterResult {
    /**
     * This is the set of appplications that matched the query filter supplied.
     */
    extensions: PublishedExtension[];
    /**
     * The PagingToken is returned from a request when more records exist that match the result than were requested or could be returned. A follow-up query with this paging token can be used to retrieve more results.
     */
    pagingToken: string;
    /**
     * This is the additional optional metadata for the given result. E.g. Total count of results which is useful in case of paged results
     */
    resultMetadata: ExtensionFilterResultMetadata[];
}
/**
 * ExtensionFilterResultMetadata is one set of metadata for the result e.g. Total count. There can be multiple metadata items for one metadata.
 */
export interface ExtensionFilterResultMetadata {
    /**
     * The metadata items for the category
     */
    metadataItems: MetadataItem[];
    /**
     * Defines the category of metadata items
     */
    metadataType: string;
}
/**
 * Represents the component pieces of an extensions fully qualified name, along with the fully qualified name.
 */
export interface ExtensionIdentifier {
    /**
     * The ExtensionName component part of the fully qualified ExtensionIdentifier
     */
    extensionName: string;
    /**
     * The PublisherName component part of the fully qualified ExtensionIdentifier
     */
    publisherName: string;
}
/**
 * Package that will be used to create or update a published extension
 */
export interface ExtensionPackage {
    /**
     * Base 64 encoded extension package
     */
    extensionManifest: string;
}
/**
 * Policy with a set of permissions on extension operations
 */
export interface ExtensionPolicy {
    /**
     * Permissions on 'Install' operation
     */
    install: ExtensionPolicyFlags;
    /**
     * Permission on 'Request' operation
     */
    request: ExtensionPolicyFlags;
}
export enum ExtensionPolicyFlags {
    /**
     * No permission
     */
    None = 0,
    /**
     * Permission on private extensions
     */
    Private = 1,
    /**
     * Permission on public extensions
     */
    Public = 2,
    /**
     * Premission in extensions that are in preview
     */
    Preview = 4,
    /**
     * Premission in relased extensions
     */
    Released = 8,
    /**
     * Permission in 1st party extensions
     */
    FirstParty = 16,
    /**
     * Mask that defines all permissions
     */
    All = 31,
}
/**
 * An ExtensionQuery is used to search the gallery for a set of extensions that match one of many filter values.
 */
export interface ExtensionQuery {
    /**
     * When retrieving extensions with a query; frequently the caller only needs a small subset of the assets. The caller may specify a list of asset types that should be returned if the extension contains it. All other assets will not be returned.
     */
    assetTypes: string[];
    /**
     * Each filter is a unique query and will have matching set of extensions returned from the request. Each result will have the same index in the resulting array that the filter had in the incoming query.
     */
    filters: QueryFilter[];
    /**
     * The Flags are used to deterine which set of information the caller would like returned for the matched extensions.
     */
    flags: ExtensionQueryFlags;
}
export enum ExtensionQueryFilterType {
    /**
     * The values are used as tags. All tags are treated as "OR" conditions with each other. There may be some value put on the number of matched tags from the query.
     */
    Tag = 1,
    /**
     * The Values are an ExtensionName or fragment that is used to match other extension names.
     */
    DisplayName = 2,
    /**
     * The Filter is one or more tokens that define what scope to return private extensions for.
     */
    Private = 3,
    /**
     * Retrieve a set of extensions based on their id's. The values should be the extension id's encoded as strings.
     */
    Id = 4,
    /**
     * The catgeory is unlike other filters. It is AND'd with the other filters instead of being a seperate query.
     */
    Category = 5,
    /**
     * Certain contribution types may be indexed to allow for query by type. User defined types can't be indexed at the moment.
     */
    ContributionType = 6,
    /**
     * Retrieve an set extension based on the name based identifier. This differs from the internal id (which is being deprecated).
     */
    Name = 7,
    /**
     * The InstallationTarget for an extension defines the target consumer for the extension. This may be something like VS, VSOnline, or VSCode
     */
    InstallationTarget = 8,
    /**
     * Query for featured extensions, no value is allowed when using the query type.
     */
    Featured = 9,
    /**
     * The SearchText provided by the user to search for extensions
     */
    SearchText = 10,
    /**
     * Query for extensions that are featured in their own category, The filterValue for this is name of category of extensions.
     */
    FeaturedInCategory = 11,
    /**
     * When retrieving extensions from a query, exclude the extensions which are having the given flags. The value specified for this filter should be a string representing the integer values of the flags to be excluded. In case of mulitple flags to be specified, a logical OR of the interger values should be given as value for this filter This should be at most one filter of this type. This filter is only supported when search text is specified
     */
    ExcludeWithFlags = 12,
}
export enum ExtensionQueryFlags {
    /**
     * None is used to retrieve only the basic extension details.
     */
    None = 0,
    /**
     * IncludeVersions will return version information for extensions returned
     */
    IncludeVersions = 1,
    /**
     * IncludeFiles will return information about which files were found within the extension that were stored independant of the manifest. When asking for files, versions will be included as well since files are returned as a property of the versions.  These files can be retrieved using the path to the file without requiring the entire manifest be downloaded.
     */
    IncludeFiles = 2,
    /**
     * Include the Categories and Tags that were added to the extension definition.
     */
    IncludeCategoryAndTags = 4,
    /**
     * Include the details about which accounts the extension has been shared with if the extesion is a private extension.
     */
    IncludeSharedAccounts = 8,
    /**
     * Include properties associated with versions of the extension
     */
    IncludeVersionProperties = 16,
    /**
     * Excluding non-validated extensions will remove any extension versions that either are in the process of being validated or have failed validation.
     */
    ExcludeNonValidated = 32,
    /**
     * Include the set of installation targets the extension has requested.
     */
    IncludeInstallationTargets = 64,
    /**
     * Include the base uri for assets of this extension
     */
    IncludeAssetUri = 128,
    /**
     * Include the statistics associated with this extension
     */
    IncludeStatistics = 256,
    /**
     * When retrieving versions from a query, only include the latest version of the extensions that matched. This is useful when the caller doesn't need all the published versions. It will save a significant size in the returned payload.
     */
    IncludeLatestVersionOnly = 512,
    /**
     * AllAttributes is designed to be a mask that defines all sub-elements of the extension should be returned.  NOTE: This is not actually All flags. This is now locked to the set defined since changing this enum would be a breaking change and would change the behavior of anyone using it. Try not to use this value when making calls to the service, instead be explicit about the options required.
     */
    AllAttributes = 479,
}
/**
 * This is the set of extensions that matched a supplied query through the filters given.
 */
export interface ExtensionQueryResult {
    /**
     * For each filter supplied in the query, a filter result will be returned in the query result.
     */
    results: ExtensionFilterResult[];
}
export interface ExtensionShare {
    id: string;
    name: string;
    type: string;
}
export interface ExtensionStatistic {
    statisticName: string;
    value: number;
}
export enum ExtensionStatisticOperation {
    None = 0,
    Set = 1,
    Increment = 2,
    Decrement = 3,
}
export interface ExtensionVersion {
    assetUri: string;
    files: ExtensionFile[];
    flags: ExtensionVersionFlags;
    lastUpdated: Date;
    properties: {
        key: string;
        value: string;
    }[];
    validationResultMessage: string;
    version: string;
    versionDescription: string;
}
export enum ExtensionVersionFlags {
    /**
     * No flags exist for this version.
     */
    None = 0,
    /**
     * The Validated flag for a version means the extension version has passed validation and can be used..
     */
    Validated = 1,
}
/**
 * One condition in a QueryFilter.
 */
export interface FilterCriteria {
    filterType: number;
    /**
     * The value used in the match based on the filter type.
     */
    value: string;
}
export interface InstallationTarget {
    target: string;
}
/**
 * MetadataItem is one value of metadata under a given category of metadata
 */
export interface MetadataItem {
    /**
     * The count of the metadata item
     */
    count: number;
    /**
     * The name of the metadata item
     */
    name: string;
}
export enum PagingDirection {
    /**
     * Backward will return results from earlier in the resultset.
     */
    Backward = 1,
    /**
     * Forward will return results from later in the resultset.
     */
    Forward = 2,
}
export interface PublishedExtension {
    categories: string[];
    displayName: string;
    extensionId: string;
    extensionName: string;
    flags: PublishedExtensionFlags;
    installationTargets: InstallationTarget[];
    lastUpdated: Date;
    longDescription: string;
    publishedDate: Date;
    publisher: PublisherFacts;
    sharedWith: ExtensionShare[];
    shortDescription: string;
    statistics: ExtensionStatistic[];
    tags: string[];
    versions: ExtensionVersion[];
}
export enum PublishedExtensionFlags {
    /**
     * No flags exist for this extension.
     */
    None = 0,
    /**
     * The Disabled flag for an extension means the extension can't be changed and won't be used by consumers. The disabled flag is managed by the service and can't be supplied by the Extension Developers.
     */
    Disabled = 1,
    /**
     * BuiltIn Extension are available to all Tenants. An explicit registration is not required. This attribute is reserved and can't be supplied by Extension Developers.  BuiltIn extensions are by definition Public. There is no need to set the public flag for extensions marked BuiltIn.
     */
    BuiltIn = 2,
    /**
     * This extension has been validated by the service. The extension meets the requirements specified. This attribute is reserved and can't be supplied by the Extension Developers. Validation is a process that ensures that all contributions are well formed. They meet the requirements defined by the contribution type they are extending. Note this attribute will be updated asynchronously as the extension is validated by the developer of the contribution type. There will be restricted access to the extension while this process is performed.
     */
    Validated = 4,
    /**
     * Trusted extensions are ones that are given special capabilities. These tend to come from Microsoft and can't be published by the general public.  Note: BuiltIn extensions are always trusted.
     */
    Trusted = 8,
    /**
     * This extension registration is public, making its visibilty open to the public. This means all tenants have the ability to install this extension. Without this flag the extension will be private and will need to be shared with the tenants that can install it.
     */
    Public = 256,
    /**
     * This extension has multiple versions active at one time and version discovery should be done usig the defined "Version Discovery" protocol to determine the version available to a specific user or tenant.  @TODO: Link to Version Discovery Protocol.
     */
    MultiVersion = 512,
    /**
     * The system flag is reserved, and cant be used by publishers.
     */
    System = 1024,
    /**
     * The Preview flag indicates that the extension is still under preview (not yet of "release" quality). These extensions may be decorated differently in the gallery and may have different policies applied to them.
     */
    Preview = 2048,
}
export interface Publisher {
    displayName: string;
    emailAddress: string[];
    extensions: PublishedExtension[];
    flags: PublisherFlags;
    lastUpdated: Date;
    longDescription: string;
    publisherId: string;
    publisherName: string;
    shortDescription: string;
}
/**
 * High-level information about the publisher, like id's and names
 */
export interface PublisherFacts {
    displayName: string;
    flags: PublisherFlags;
    publisherId: string;
    publisherName: string;
}
/**
 * The FilterResult is the set of publishers that matched a particular query filter.
 */
export interface PublisherFilterResult {
    /**
     * This is the set of appplications that matched the query filter supplied.
     */
    publishers: Publisher[];
}
export enum PublisherFlags {
    /**
     * This should never be returned, it is used to represent a publisher who's flags havent changed during update calls.
     */
    UnChanged = 1073741824,
    /**
     * No flags exist for this publisher.
     */
    None = 0,
    /**
     * The Disabled flag for a publisher means the publisher can't be changed and won't be used by consumers, this extends to extensions owned by the publisher as well. The disabled flag is managed by the service and can't be supplied by the Extension Developers.
     */
    Disabled = 1,
    /**
     * A verified publisher is one that Microsoft has done some review of and ensured the publisher meets a set of requirements. The requirements to become a verified publisher are not listed here.  They can be found in public documentation (TBD).
     */
    Verified = 2,
    /**
     * This is the set of flags that can't be supplied by the developer and is managed by the service itself.
     */
    ServiceFlags = 3,
}
export enum PublisherPermissions {
    /**
     * This gives the bearer the rights to read Publishers and Extensions.
     */
    Read = 1,
    /**
     * This gives the bearer the rights to update, delete, and share Extensions (but not the ability to create them).
     */
    UpdateExtension = 2,
    /**
     * This gives the bearer the rights to create new Publishers at the root of the namespace.
     */
    CreatePublisher = 4,
    /**
     * This gives the bearer the rights to create new Extensions within a publisher.
     */
    PublishExtension = 8,
    /**
     * Admin gives the bearer the rights to manage restricted attributes of Publishers and Extensions.
     */
    Admin = 16,
    /**
     * TrustedPartner gives the bearer the rights to publish a extensions with restricted capabilities.
     */
    TrustedPartner = 32,
    /**
     * PrivateRead is another form of read designed to allow higher privilege accessors the ability to read private extensions.
     */
    PrivateRead = 64,
    /**
     * This gives the bearer the rights to delete any extension.
     */
    DeleteExtension = 128,
    /**
     * This gives the bearer the rights edit the publisher settings.
     */
    EditSettings = 256,
    /**
     * This gives the bearer the rights to see all permissions on the publisher.
     */
    ViewPermissions = 512,
    /**
     * This gives the bearer the rights to assign permissions on the publisher.
     */
    ManagePermissions = 1024,
    /**
     * This gives the bearer the rights to delete the publisher.
     */
    DeletePublisher = 2048,
}
/**
 * An PublisherQuery is used to search the gallery for a set of publishers that match one of many filter values.
 */
export interface PublisherQuery {
    /**
     * Each filter is a unique query and will have matching set of publishers returned from the request. Each result will have the same index in the resulting array that the filter had in the incoming query.
     */
    filters: QueryFilter[];
    /**
     * The Flags are used to deterine which set of information the caller would like returned for the matched publishers.
     */
    flags: PublisherQueryFlags;
}
export enum PublisherQueryFilterType {
    /**
     * The values are used as tags. All tags are treated as "OR" conditions with each other. There may be some value put on the number of matched tags from the query.
     */
    Tag = 1,
    /**
     * The Values are an PublisherName or fragment that is used to match other extension names.
     */
    DisplayName = 2,
    /**
     * The My Query filter is used to retrieve the set of publishers that I have access to publish extesions into. All Values are ignored and the calling user is used as the filter in this case.
     */
    My = 3,
}
export enum PublisherQueryFlags {
    /**
     * None is used to retrieve only the basic publisher details.
     */
    None = 0,
    /**
     * Is used to include a list of basic extension details for all extensions published by the requested publisher.
     */
    IncludeExtensions = 1,
    /**
     * Is used to include email address of all the users who are marked as owners for the publisher
     */
    IncludeEmailAddress = 2,
}
/**
 * This is the set of publishers that matched a supplied query through the filters given.
 */
export interface PublisherQueryResult {
    /**
     * For each filter supplied in the query, a filter result will be returned in the query result.
     */
    results: PublisherFilterResult[];
}
/**
 * A filter used to define a set of extensions to return during a query.
 */
export interface QueryFilter {
    /**
     * The filter values define the set of values in this query. They are applied based on the QueryFilterType.
     */
    criteria: FilterCriteria[];
    /**
     * The PagingDirection is applied to a paging token if one exists. If not the direction is ignored, and Forward from the start of the resultset is used. Direction should be left out of the request unless a paging token is used to help prevent future issues.
     */
    direction: PagingDirection;
    /**
     * The page number requested by the user. If not provided 1 is assumed by default.
     */
    pageNumber: number;
    /**
     * The page size defines the number of results the caller wants for this filter. The count can't exceed the overall query size limits.
     */
    pageSize: number;
    /**
     * The paging token is a distinct type of filter and the other filter fields are ignored. The paging token represents the continuation of a previously executed query. The information about where in the result and what fields are being filtered are embeded in the token.
     */
    pagingToken: string;
    /**
     * Defines the type of sorting to be applied on the results. The page slice is cut of the sorted results only.
     */
    sortBy: number;
    /**
     * Defines the order of sorting, 1 for Ascending, 2 for Descending, else default ordering based on the SortBy value
     */
    sortOrder: number;
}
export interface Review {
    /**
     * Unique identifier of a review item
     */
    id: number;
    /**
     * Flag for soft deletion
     */
    isDeleted: boolean;
    /**
     * Version of the product for which review was submitted
     */
    productVersion: string;
    /**
     * Rating procided by the user
     */
    rating: number;
    /**
     * Text description of the review
     */
    text: string;
    /**
     * Title of the review
     */
    title: string;
    /**
     * Time when the review was edited/updated
     */
    updatedDate: Date;
    /**
     * Name of the user
     */
    userDisplayName: string;
    /**
     * Id of the user who submitted the review
     */
    userId: string;
}
export enum ReviewFilterOptions {
    /**
     * No filtering, all reviews are returned (default option)
     */
    None = 0,
    /**
     * Filter out review items with empty review text
     */
    FilterEmptyReviews = 1,
    /**
     * Filter out review items with empty usernames
     */
    FilterEmptyUserNames = 2,
}
export interface ReviewPatch {
    /**
     * Denotes the patch operation type
     */
    operation: ReviewPatchOperation;
    /**
     * Use when patch operation is FlagReview
     */
    reportedConcern: UserReportedConcern;
    /**
     * Use when patch operation is EditReview
     */
    reviewItem: Review;
}
export enum ReviewPatchOperation {
    /**
     * Flag a review
     */
    FlagReview = 1,
    /**
     * Update an existing review
     */
    UpdateReview = 2,
}
export interface ReviewsResult {
    /**
     * Flag indicating if there are more reviews to be shown (for paging)
     */
    hasMoreReviews: boolean;
    /**
     * List of reviews
     */
    reviews: Review[];
    /**
     * Count of total review items
     */
    totalReviewCount: number;
}
export enum SigningKeyPermissions {
    Read = 1,
    Write = 2,
}
export enum SortByType {
    /**
     * The results will be sorted by relevance in case search query is given, if no search query resutls will be provided as is
     */
    Relevance = 0,
    /**
     * The results will be sorted as per Last Updated date of the extensions with recently updated at the top
     */
    LastUpdatedDate = 1,
    /**
     * Results will be sorted Alphabetically as per the title of the extension
     */
    Title = 2,
    /**
     * Results will be sorted Alphabetically as per Publisher title
     */
    Publisher = 3,
    /**
     * Results will be sorted by Install Count
     */
    InstallCount = 4,
    /**
     * The results will be sorted as per Published date of the extensions
     */
    PublishedDate = 5,
    /**
     * The results will be sorted as per Average ratings of the extensions
     */
    AverageRating = 6,
}
export enum SortOrderType {
    /**
     * Results will be sorted in the default order as per the sorting type defined. The default varies for each type, e.g. for Relevance, default is Descnding, for Title default is Ascending etc.
     */
    Default = 0,
    /**
     * The results will be sorted in Ascending order
     */
    Ascending = 1,
    /**
     * The results will be sorted in Descending order
     */
    Descending = 2,
}
/**
 * Represents the extension policy applied to a given user
 */
export interface UserExtensionPolicy {
    /**
     * User display name that this policy refers to
     */
    displayName: string;
    /**
     * The extension policy applied to the user
     */
    permissions: ExtensionPolicy;
    /**
     * User id that this policy refers to
     */
    userId: string;
}
export interface UserReportedConcern {
    /**
     * Category of the concern
     */
    category: ConcernCategory;
    /**
     * User comment associated with the report
     */
    concernText: string;
    /**
     * Id of the review which was reported
     */
    reviewId: number;
    /**
     * Date the report was submitted
     */
    submittedDate: Date;
    /**
     * Id of the user who reported a review
     */
    userId: string;
}
export var TypeInfo: {
    AcquisitionAssignmentType: {
        enumValues: {
            "none": number;
            "me": number;
            "all": number;
        };
    };
    AcquisitionOperation: {
        fields: any;
    };
    AcquisitionOperationState: {
        enumValues: {
            "disallow": number;
            "allow": number;
            "completed": number;
        };
    };
    AcquisitionOperationType: {
        enumValues: {
            "get": number;
            "install": number;
            "buy": number;
            "try": number;
            "request": number;
            "none": number;
        };
    };
    AcquisitionOptions: {
        fields: any;
    };
    ConcernCategory: {
        enumValues: {
            "general": number;
            "abusive": number;
            "spam": number;
        };
    };
    ExtensionAcquisitionRequest: {
        fields: any;
    };
    ExtensionCategory: {
        fields: any;
    };
    ExtensionFile: {
        fields: any;
    };
    ExtensionFilterResult: {
        fields: any;
    };
    ExtensionFilterResultMetadata: {
        fields: any;
    };
    ExtensionIdentifier: {
        fields: any;
    };
    ExtensionPackage: {
        fields: any;
    };
    ExtensionPolicy: {
        fields: any;
    };
    ExtensionPolicyFlags: {
        enumValues: {
            "none": number;
            "private": number;
            "public": number;
            "preview": number;
            "released": number;
            "firstParty": number;
            "all": number;
        };
    };
    ExtensionQuery: {
        fields: any;
    };
    ExtensionQueryFilterType: {
        enumValues: {
            "tag": number;
            "displayName": number;
            "private": number;
            "id": number;
            "category": number;
            "contributionType": number;
            "name": number;
            "installationTarget": number;
            "featured": number;
            "searchText": number;
            "featuredInCategory": number;
            "excludeWithFlags": number;
        };
    };
    ExtensionQueryFlags: {
        enumValues: {
            "none": number;
            "includeVersions": number;
            "includeFiles": number;
            "includeCategoryAndTags": number;
            "includeSharedAccounts": number;
            "includeVersionProperties": number;
            "excludeNonValidated": number;
            "includeInstallationTargets": number;
            "includeAssetUri": number;
            "includeStatistics": number;
            "includeLatestVersionOnly": number;
            "allAttributes": number;
        };
    };
    ExtensionQueryResult: {
        fields: any;
    };
    ExtensionShare: {
        fields: any;
    };
    ExtensionStatistic: {
        fields: any;
    };
    ExtensionStatisticOperation: {
        enumValues: {
            "none": number;
            "set": number;
            "increment": number;
            "decrement": number;
        };
    };
    ExtensionVersion: {
        fields: any;
    };
    ExtensionVersionFlags: {
        enumValues: {
            "none": number;
            "validated": number;
        };
    };
    FilterCriteria: {
        fields: any;
    };
    InstallationTarget: {
        fields: any;
    };
    MetadataItem: {
        fields: any;
    };
    PagingDirection: {
        enumValues: {
            "backward": number;
            "forward": number;
        };
    };
    PublishedExtension: {
        fields: any;
    };
    PublishedExtensionFlags: {
        enumValues: {
            "none": number;
            "disabled": number;
            "builtIn": number;
            "validated": number;
            "trusted": number;
            "public": number;
            "multiVersion": number;
            "system": number;
            "preview": number;
        };
    };
    Publisher: {
        fields: any;
    };
    PublisherFacts: {
        fields: any;
    };
    PublisherFilterResult: {
        fields: any;
    };
    PublisherFlags: {
        enumValues: {
            "unChanged": number;
            "none": number;
            "disabled": number;
            "verified": number;
            "serviceFlags": number;
        };
    };
    PublisherPermissions: {
        enumValues: {
            "read": number;
            "updateExtension": number;
            "createPublisher": number;
            "publishExtension": number;
            "admin": number;
            "trustedPartner": number;
            "privateRead": number;
            "deleteExtension": number;
            "editSettings": number;
            "viewPermissions": number;
            "managePermissions": number;
            "deletePublisher": number;
        };
    };
    PublisherQuery: {
        fields: any;
    };
    PublisherQueryFilterType: {
        enumValues: {
            "tag": number;
            "displayName": number;
            "my": number;
        };
    };
    PublisherQueryFlags: {
        enumValues: {
            "none": number;
            "includeExtensions": number;
            "includeEmailAddress": number;
        };
    };
    PublisherQueryResult: {
        fields: any;
    };
    QueryFilter: {
        fields: any;
    };
    Review: {
        fields: any;
    };
    ReviewFilterOptions: {
        enumValues: {
            "none": number;
            "filterEmptyReviews": number;
            "filterEmptyUserNames": number;
        };
    };
    ReviewPatch: {
        fields: any;
    };
    ReviewPatchOperation: {
        enumValues: {
            "flagReview": number;
            "updateReview": number;
        };
    };
    ReviewsResult: {
        fields: any;
    };
    SigningKeyPermissions: {
        enumValues: {
            "read": number;
            "write": number;
        };
    };
    SortByType: {
        enumValues: {
            "relevance": number;
            "lastUpdatedDate": number;
            "title": number;
            "publisher": number;
            "installCount": number;
            "publishedDate": number;
            "averageRating": number;
        };
    };
    SortOrderType: {
        enumValues: {
            "default": number;
            "ascending": number;
            "descending": number;
        };
    };
    UserExtensionPolicy: {
        fields: any;
    };
    UserReportedConcern: {
        fields: any;
    };
};
}
declare module "VSS/Gallery/RestClient" {
import Contracts = require("VSS/Gallery/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class GalleryHttpClient3 extends VSS_WebApi.VssHttpClient {
    static serviceInstanceId: string;
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {string} extensionId
     * @param {string} accountName
     * @return IPromise<void>
     */
    shareExtensionById(extensionId: string, accountName: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} extensionId
     * @param {string} accountName
     * @return IPromise<void>
     */
    unshareExtensionById(extensionId: string, accountName: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} accountName
     * @return IPromise<void>
     */
    shareExtension(publisherName: string, extensionName: string, accountName: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} accountName
     * @return IPromise<void>
     */
    unshareExtension(publisherName: string, extensionName: string, accountName: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} itemId
     * @param {string} installationTarget
     * @return IPromise<Contracts.AcquisitionOptions>
     */
    getAcquisitionOptions(itemId: string, installationTarget: string): IPromise<Contracts.AcquisitionOptions>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionAcquisitionRequest} acquisitionRequest
     * @return IPromise<Contracts.ExtensionAcquisitionRequest>
     */
    requestAcquisition(acquisitionRequest: Contracts.ExtensionAcquisitionRequest): IPromise<Contracts.ExtensionAcquisitionRequest>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} assetType
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @return IPromise<ArrayBuffer>
     */
    getAssetByName(publisherName: string, extensionName: string, version: string, assetType: string, accountToken?: string, acceptDefault?: boolean): IPromise<ArrayBuffer>;
    /**
     * [Preview API]
     *
     * @param {string} extensionId
     * @param {string} version
     * @param {string} assetType
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @return IPromise<ArrayBuffer>
     */
    getAsset(extensionId: string, version: string, assetType: string, accountToken?: string, acceptDefault?: boolean): IPromise<ArrayBuffer>;
    /**
     * [Preview API]
     *
     * @param {string} languages
     * @return IPromise<string[]>
     */
    getCategories(languages?: string): IPromise<string[]>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @return IPromise<ArrayBuffer>
     */
    getCertificate(publisherName: string, extensionName: string, version?: string): IPromise<ArrayBuffer>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionQuery} extensionQuery
     * @param {string} accountToken
     * @return IPromise<Contracts.ExtensionQueryResult>
     */
    queryExtensions(extensionQuery: Contracts.ExtensionQuery, accountToken?: string): IPromise<Contracts.ExtensionQueryResult>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionPackage} extensionPackage
     * @return IPromise<Contracts.PublishedExtension>
     */
    createExtension(extensionPackage: Contracts.ExtensionPackage): IPromise<Contracts.PublishedExtension>;
    /**
     * [Preview API]
     *
     * @param {string} extensionId
     * @param {string} version
     * @return IPromise<void>
     */
    deleteExtensionById(extensionId: string, version?: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} extensionId
     * @param {string} version
     * @param {Contracts.ExtensionQueryFlags} flags
     * @return IPromise<Contracts.PublishedExtension>
     */
    getExtensionById(extensionId: string, version?: string, flags?: Contracts.ExtensionQueryFlags): IPromise<Contracts.PublishedExtension>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionPackage} extensionPackage
     * @param {string} extensionId
     * @return IPromise<Contracts.PublishedExtension>
     */
    updateExtensionById(extensionPackage: Contracts.ExtensionPackage, extensionId: string): IPromise<Contracts.PublishedExtension>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionPackage} extensionPackage
     * @param {string} publisherName
     * @return IPromise<Contracts.PublishedExtension>
     */
    createExtensionWithPublisher(extensionPackage: Contracts.ExtensionPackage, publisherName: string): IPromise<Contracts.PublishedExtension>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @return IPromise<void>
     */
    deleteExtension(publisherName: string, extensionName: string, version?: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {Contracts.ExtensionQueryFlags} flags
     * @param {string} accountToken
     * @return IPromise<Contracts.PublishedExtension>
     */
    getExtension(publisherName: string, extensionName: string, version?: string, flags?: Contracts.ExtensionQueryFlags, accountToken?: string): IPromise<Contracts.PublishedExtension>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionPackage} extensionPackage
     * @param {string} publisherName
     * @param {string} extensionName
     * @return IPromise<Contracts.PublishedExtension>
     */
    updateExtension(extensionPackage: Contracts.ExtensionPackage, publisherName: string, extensionName: string): IPromise<Contracts.PublishedExtension>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @return IPromise<ArrayBuffer>
     */
    getPackage(publisherName: string, extensionName: string, version: string, accountToken?: string, acceptDefault?: boolean): IPromise<ArrayBuffer>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} assetType
     * @param {string} assetToken
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @return IPromise<ArrayBuffer>
     */
    getAssetWithToken(publisherName: string, extensionName: string, version: string, assetType: string, assetToken?: string, accountToken?: string, acceptDefault?: boolean): IPromise<ArrayBuffer>;
    /**
     * [Preview API]
     *
     * @param {Contracts.PublisherQuery} publisherQuery
     * @return IPromise<Contracts.PublisherQueryResult>
     */
    queryPublishers(publisherQuery: Contracts.PublisherQuery): IPromise<Contracts.PublisherQueryResult>;
    /**
     * [Preview API]
     *
     * @param {Contracts.Publisher} publisher
     * @return IPromise<Contracts.Publisher>
     */
    createPublisher(publisher: Contracts.Publisher): IPromise<Contracts.Publisher>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @return IPromise<void>
     */
    deletePublisher(publisherName: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {number} flags
     * @return IPromise<Contracts.Publisher>
     */
    getPublisher(publisherName: string, flags?: number): IPromise<Contracts.Publisher>;
    /**
     * [Preview API]
     *
     * @param {Contracts.Publisher} publisher
     * @param {string} publisherName
     * @return IPromise<Contracts.Publisher>
     */
    updatePublisher(publisher: Contracts.Publisher, publisherName: string): IPromise<Contracts.Publisher>;
    /**
     * [Preview API] Returns a list of reviews associated with an extension
     *
     * @param {string} publisherName - Name of the publisher who published the extension
     * @param {string} extensionName - Name of the extension
     * @param {number} count - Number of reviews to retrieve (defaults to 5)
     * @param {Contracts.ReviewFilterOptions} filterOptions - FilterOptions to filter out empty reviews etcetera, defaults to none
     * @param {Date} beforeDate - Use if you want to fetch reviews older than the specified date, defaults to null
     * @param {Date} afterDate - Use if you want to fetch reviews newer than the specified date, defaults to null
     * @return IPromise<Contracts.ReviewsResult>
     */
    getReviews(publisherName: string, extensionName: string, count?: number, filterOptions?: Contracts.ReviewFilterOptions, beforeDate?: Date, afterDate?: Date): IPromise<Contracts.ReviewsResult>;
    /**
     * [Preview API] Creates a new review for an extension
     *
     * @param {Contracts.Review} review - Review to be created for the extension
     * @param {string} pubName - Name of the publisher who published the extension
     * @param {string} extName - Name of the extension
     * @return IPromise<Contracts.Review>
     */
    createReview(review: Contracts.Review, pubName: string, extName: string): IPromise<Contracts.Review>;
    /**
     * [Preview API] Updates or Flags a review
     *
     * @param {Contracts.ReviewPatch} reviewPatch - ReviewPatch object which contains the changes to be applied to the review
     * @param {string} pubName - Name of the pubilsher who published the extension
     * @param {string} extName - Name of the extension
     * @param {number} resourceId - Id of the review which needs to be updated
     * @return IPromise<Contracts.ReviewPatch>
     */
    updateReview(reviewPatch: Contracts.ReviewPatch, pubName: string, extName: string, resourceId: number): IPromise<Contracts.ReviewPatch>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionCategory} category
     * @return IPromise<Contracts.ExtensionCategory>
     */
    createCategory(category: Contracts.ExtensionCategory): IPromise<Contracts.ExtensionCategory>;
    /**
     * [Preview API]
     *
     * @param {string} keyType
     * @param {number} expireCurrentSeconds
     * @return IPromise<void>
     */
    generateKey(keyType: string, expireCurrentSeconds?: number): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} keyType
     * @return IPromise<string>
     */
    getSigningKey(keyType: string): IPromise<string>;
}
/**
 * @exemptedapi
 */
export class GalleryHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    static serviceInstanceId: string;
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {string} extensionId
     * @param {string} accountName
     * @return IPromise<void>
     */
    shareExtensionById(extensionId: string, accountName: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} extensionId
     * @param {string} accountName
     * @return IPromise<void>
     */
    unshareExtensionById(extensionId: string, accountName: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} accountName
     * @return IPromise<void>
     */
    shareExtension(publisherName: string, extensionName: string, accountName: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} accountName
     * @return IPromise<void>
     */
    unshareExtension(publisherName: string, extensionName: string, accountName: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} itemId
     * @param {string} installationTarget
     * @return IPromise<Contracts.AcquisitionOptions>
     */
    getAcquisitionOptions(itemId: string, installationTarget: string): IPromise<Contracts.AcquisitionOptions>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionAcquisitionRequest} acquisitionRequest
     * @return IPromise<Contracts.ExtensionAcquisitionRequest>
     */
    requestAcquisition(acquisitionRequest: Contracts.ExtensionAcquisitionRequest): IPromise<Contracts.ExtensionAcquisitionRequest>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} assetType
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @return IPromise<ArrayBuffer>
     */
    getAssetByName(publisherName: string, extensionName: string, version: string, assetType: string, accountToken?: string, acceptDefault?: boolean): IPromise<ArrayBuffer>;
    /**
     * [Preview API]
     *
     * @param {string} extensionId
     * @param {string} version
     * @param {string} assetType
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @return IPromise<ArrayBuffer>
     */
    getAsset(extensionId: string, version: string, assetType: string, accountToken?: string, acceptDefault?: boolean): IPromise<ArrayBuffer>;
    /**
     * [Preview API]
     *
     * @param {string} languages
     * @return IPromise<string[]>
     */
    getCategories(languages?: string): IPromise<string[]>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @return IPromise<ArrayBuffer>
     */
    getCertificate(publisherName: string, extensionName: string, version?: string): IPromise<ArrayBuffer>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionQuery} extensionQuery
     * @param {string} accountToken
     * @return IPromise<Contracts.ExtensionQueryResult>
     */
    queryExtensions(extensionQuery: Contracts.ExtensionQuery, accountToken?: string): IPromise<Contracts.ExtensionQueryResult>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionPackage} extensionPackage
     * @return IPromise<Contracts.PublishedExtension>
     */
    createExtension(extensionPackage: Contracts.ExtensionPackage): IPromise<Contracts.PublishedExtension>;
    /**
     * [Preview API]
     *
     * @param {string} extensionId
     * @param {string} version
     * @return IPromise<void>
     */
    deleteExtensionById(extensionId: string, version?: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} extensionId
     * @param {string} version
     * @param {Contracts.ExtensionQueryFlags} flags
     * @return IPromise<Contracts.PublishedExtension>
     */
    getExtensionById(extensionId: string, version?: string, flags?: Contracts.ExtensionQueryFlags): IPromise<Contracts.PublishedExtension>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionPackage} extensionPackage
     * @param {string} extensionId
     * @return IPromise<Contracts.PublishedExtension>
     */
    updateExtensionById(extensionPackage: Contracts.ExtensionPackage, extensionId: string): IPromise<Contracts.PublishedExtension>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionPackage} extensionPackage
     * @param {string} publisherName
     * @return IPromise<Contracts.PublishedExtension>
     */
    createExtensionWithPublisher(extensionPackage: Contracts.ExtensionPackage, publisherName: string): IPromise<Contracts.PublishedExtension>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @return IPromise<void>
     */
    deleteExtension(publisherName: string, extensionName: string, version?: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {Contracts.ExtensionQueryFlags} flags
     * @param {string} accountToken
     * @return IPromise<Contracts.PublishedExtension>
     */
    getExtension(publisherName: string, extensionName: string, version?: string, flags?: Contracts.ExtensionQueryFlags, accountToken?: string): IPromise<Contracts.PublishedExtension>;
    /**
     * [Preview API]
     *
     * @param {Contracts.ExtensionPackage} extensionPackage
     * @param {string} publisherName
     * @param {string} extensionName
     * @return IPromise<Contracts.PublishedExtension>
     */
    updateExtension(extensionPackage: Contracts.ExtensionPackage, publisherName: string, extensionName: string): IPromise<Contracts.PublishedExtension>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @return IPromise<ArrayBuffer>
     */
    getPackage(publisherName: string, extensionName: string, version: string, accountToken?: string, acceptDefault?: boolean): IPromise<ArrayBuffer>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} assetType
     * @param {string} assetToken
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @return IPromise<ArrayBuffer>
     */
    getAssetWithToken(publisherName: string, extensionName: string, version: string, assetType: string, assetToken?: string, accountToken?: string, acceptDefault?: boolean): IPromise<ArrayBuffer>;
    /**
     * [Preview API]
     *
     * @param {Contracts.PublisherQuery} publisherQuery
     * @return IPromise<Contracts.PublisherQueryResult>
     */
    queryPublishers(publisherQuery: Contracts.PublisherQuery): IPromise<Contracts.PublisherQueryResult>;
    /**
     * [Preview API]
     *
     * @param {Contracts.Publisher} publisher
     * @return IPromise<Contracts.Publisher>
     */
    createPublisher(publisher: Contracts.Publisher): IPromise<Contracts.Publisher>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @return IPromise<void>
     */
    deletePublisher(publisherName: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} publisherName
     * @param {number} flags
     * @return IPromise<Contracts.Publisher>
     */
    getPublisher(publisherName: string, flags?: number): IPromise<Contracts.Publisher>;
    /**
     * [Preview API]
     *
     * @param {Contracts.Publisher} publisher
     * @param {string} publisherName
     * @return IPromise<Contracts.Publisher>
     */
    updatePublisher(publisher: Contracts.Publisher, publisherName: string): IPromise<Contracts.Publisher>;
    /**
     * [Preview API]
     *
     * @param {string} keyType
     * @param {number} expireCurrentSeconds
     * @return IPromise<void>
     */
    generateKey(keyType: string, expireCurrentSeconds?: number): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} keyType
     * @return IPromise<string>
     */
    getSigningKey(keyType: string): IPromise<string>;
}
export class GalleryHttpClient extends GalleryHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return GalleryHttpClient2_2
 */
export function getClient(): GalleryHttpClient2_2;
}
declare module "VSS/Identities/Contracts" {
/**
 * Container class for changed identities
 */
export interface ChangedIdentities {
    /**
     * Changed Identities
     */
    identities: Identity[];
    /**
     * Last Identity SequenceId
     */
    sequenceContext: ChangedIdentitiesContext;
}
/**
 * Context class for changed identities
 */
export interface ChangedIdentitiesContext {
    /**
     * Last Group SequenceId
     */
    groupSequenceId: number;
    /**
     * Last Identity SequenceId
     */
    identitySequenceId: number;
}
export interface CreateGroupsInfo {
    groups: Identity[];
    scopeId: string;
}
export interface CreateScopeInfo {
    adminGroupDescription: string;
    adminGroupName: string;
    creatorId: string;
    parentScopeId: string;
    scopeName: string;
    scopeType: GroupScopeType;
}
export interface FrameworkIdentityInfo {
    displayName: string;
    identifier: string;
    identityType: FrameworkIdentityType;
    role: string;
}
export enum FrameworkIdentityType {
    None = 0,
    ServiceIdentity = 1,
    AggregateIdentity = 2,
    ImportedIdentity = 3,
}
export interface GroupMembership {
    active: boolean;
    descriptor: IdentityDescriptor;
    id: string;
    queriedId: string;
}
export enum GroupScopeType {
    Generic = 0,
    ServiceHost = 1,
    TeamProject = 2,
}
export interface Identity {
    /**
     * The custom display name for the identity (if any). Setting this property to an empty string will clear the existing custom display name. Setting this property to null will not affect the existing persisted value (since null values do not get sent over the wire or to the database)
     */
    customDisplayName: string;
    descriptor: IdentityDescriptor;
    id: string;
    isActive: boolean;
    isContainer: boolean;
    masterId: string;
    memberIds: string[];
    memberOf: IdentityDescriptor[];
    members: IdentityDescriptor[];
    metaTypeId: number;
    properties: any;
    /**
     * The display name for the identity as specified by the source identity provider.
     */
    providerDisplayName: string;
    resourceVersion: number;
    uniqueUserId: number;
}
export interface IdentityBatchInfo {
    descriptors: IdentityDescriptor[];
    identityIds: string[];
    includeRestrictedVisibility: boolean;
    propertyNames: string[];
    queryMembership: QueryMembership;
}
/**
 * An Identity descriptor is a wrapper for the identity type (Windows SID, Passport) along with a unique identifier such as the SID or PUID.
 */
export interface IdentityDescriptor {
    /**
     * The unique identifier for this identity, not exceeding 256 chars, which will be persisted.
     */
    identifier: string;
    /**
     * Type of descriptor (for example, Windows, Passport, etc.).
     */
    identityType: string;
}
export enum IdentityMetaType {
    Member = 0,
    Guest = 1,
    Unknown = 255,
}
export interface IdentityScope {
    administrators: IdentityDescriptor;
    id: string;
    isActive: boolean;
    isGlobal: boolean;
    localScopeId: string;
    name: string;
    parentId: string;
    scopeType: GroupScopeType;
    securingHostId: string;
}
export enum IdentitySearchFilter {
    /**
     * NT account name (domain\alias)
     */
    AccountName = 0,
    /**
     * Display name
     */
    DisplayName = 1,
    /**
     * Find project admin group
     */
    AdministratorsGroup = 2,
    /**
     * Find the identity using the identifier
     */
    Identifier = 3,
    /**
     * Email address
     */
    MailAddress = 4,
    /**
     * A general search for an identity.
     */
    General = 5,
    /**
     * Alternate login username
     */
    Alias = 6,
    /**
     * Find identity using Domain/TenantId
     */
    Domain = 7,
}
export interface IdentitySelf {
    accountName: string;
    displayName: string;
    id: string;
    tenants: TenantInfo[];
}
export interface IdentitySnapshot {
    groups: Identity[];
    identityIds: string[];
    memberships: GroupMembership[];
    scopeId: string;
    scopes: IdentityScope[];
}
export enum IdentityTypeId {
    WindowsIdentity = 3,
    TeamFoundationIdentity = 4,
    ClaimsIdentity = 5,
    BindPendingIdentity = 6,
    UnauthenticatedIdentity = 7,
    ServiceIdentity = 8,
    AggregateIdentity = 9,
    ImportedIdentity = 10,
    ServerTestIdentity = 100,
}
export interface IdentityUpdateData {
    id: string;
    index: number;
    updated: boolean;
}
export interface JsonPatchOperationData<T> {
    op: string;
    path: string;
    value: T;
}
export interface MruIdentitiesUpdateData extends JsonPatchOperationData<string[]> {
}
export enum QueryMembership {
    /**
     * Query will not return any membership data
     */
    None = 0,
    /**
     * Query will return only direct membership data
     */
    Direct = 1,
    /**
     * Query will return expanded membership data
     */
    Expanded = 2,
    /**
     * Query will return expanded up membership data (parents only)
     */
    ExpandedUp = 3,
    /**
     * Query will return expanded down membership data (children only)
     */
    ExpandedDown = 4,
}
export enum ReadIdentitiesOptions {
    None = 0,
    FilterIllegalMemberships = 1,
}
export interface ReadOnlyIdentityDescriptor extends IdentityDescriptor {
    identifier: string;
    identityType: string;
}
export enum SpecialGroupType {
    Generic = 0,
    AdministrativeApplicationGroup = 1,
    ServiceApplicationGroup = 2,
    EveryoneApplicationGroup = 3,
    LicenseesApplicationGroup = 4,
    AzureActiveDirectoryApplicationGroup = 5,
}
export interface TenantInfo {
    homeTenant: boolean;
    tenantId: string;
    tenantName: string;
}
export var TypeInfo: {
    ChangedIdentities: {
        fields: any;
    };
    ChangedIdentitiesContext: {
        fields: any;
    };
    CreateGroupsInfo: {
        fields: any;
    };
    CreateScopeInfo: {
        fields: any;
    };
    FrameworkIdentityInfo: {
        fields: any;
    };
    FrameworkIdentityType: {
        enumValues: {
            "none": number;
            "serviceIdentity": number;
            "aggregateIdentity": number;
            "importedIdentity": number;
        };
    };
    GroupMembership: {
        fields: any;
    };
    GroupScopeType: {
        enumValues: {
            "generic": number;
            "serviceHost": number;
            "teamProject": number;
        };
    };
    Identity: {
        fields: any;
    };
    IdentityBatchInfo: {
        fields: any;
    };
    IdentityDescriptor: {
        fields: any;
    };
    IdentityMetaType: {
        enumValues: {
            "member": number;
            "guest": number;
            "unknown": number;
        };
    };
    IdentityScope: {
        fields: any;
    };
    IdentitySearchFilter: {
        enumValues: {
            "accountName": number;
            "displayName": number;
            "administratorsGroup": number;
            "identifier": number;
            "mailAddress": number;
            "general": number;
            "alias": number;
            "domain": number;
        };
    };
    IdentitySelf: {
        fields: any;
    };
    IdentitySnapshot: {
        fields: any;
    };
    IdentityTypeId: {
        enumValues: {
            "windowsIdentity": number;
            "teamFoundationIdentity": number;
            "claimsIdentity": number;
            "bindPendingIdentity": number;
            "unauthenticatedIdentity": number;
            "serviceIdentity": number;
            "aggregateIdentity": number;
            "importedIdentity": number;
            "serverTestIdentity": number;
        };
    };
    IdentityUpdateData: {
        fields: any;
    };
    JsonPatchOperationData: {
        fields: any;
    };
    MruIdentitiesUpdateData: {
        fields: any;
    };
    QueryMembership: {
        enumValues: {
            "none": number;
            "direct": number;
            "expanded": number;
            "expandedUp": number;
            "expandedDown": number;
        };
    };
    ReadIdentitiesOptions: {
        enumValues: {
            "none": number;
            "filterIllegalMemberships": number;
        };
    };
    ReadOnlyIdentityDescriptor: {
        fields: any;
    };
    SpecialGroupType: {
        enumValues: {
            "generic": number;
            "administrativeApplicationGroup": number;
            "serviceApplicationGroup": number;
            "everyoneApplicationGroup": number;
            "licenseesApplicationGroup": number;
            "azureActiveDirectoryApplicationGroup": number;
        };
    };
    TenantInfo: {
        fields: any;
    };
};
}
declare module "VSS/Identities/Mru/Contracts" {
export interface JsonPatchOperationData<T> {
    op: string;
    path: string;
    value: T;
}
export interface MruIdentitiesUpdateData extends JsonPatchOperationData<string[]> {
}
export var TypeInfo: {
    JsonPatchOperationData: {
        fields: any;
    };
    MruIdentitiesUpdateData: {
        fields: any;
    };
};
}
declare module "VSS/Identities/Mru/RestClient" {
import Contracts = require("VSS/Identities/Mru/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class IdentityMruHttpClient3 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string);
    /**
     * [Preview API]
     *
     * @param {string} identityId
     * @param {string} containerId
     * @return IPromise<string[]>
     */
    getMruIdentities(identityId: string, containerId: string): IPromise<string[]>;
    /**
     * [Preview API]
     *
     * @param {string[]} identityIds
     * @param {string} identityId
     * @param {string} containerId
     * @return IPromise<void>
     */
    setMruIdentities(identityIds: string[], identityId: string, containerId: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {Contracts.MruIdentitiesUpdateData} updateData
     * @param {string} identityId
     * @param {string} containerId
     * @return IPromise<void>
     */
    updateMruIdentities(updateData: Contracts.MruIdentitiesUpdateData, identityId: string, containerId: string): IPromise<void>;
}
/**
 * @exemptedapi
 */
export class IdentityMruHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string);
    /**
     * [Preview API]
     *
     * @param {string} identityId
     * @param {string} containerId
     * @return IPromise<string[]>
     */
    getMruIdentities(identityId: string, containerId: string): IPromise<string[]>;
    /**
     * [Preview API]
     *
     * @param {string[]} identityIds
     * @param {string} identityId
     * @param {string} containerId
     * @return IPromise<void>
     */
    setMruIdentities(identityIds: string[], identityId: string, containerId: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {Contracts.MruIdentitiesUpdateData} updateData
     * @param {string} identityId
     * @param {string} containerId
     * @return IPromise<void>
     */
    updateMruIdentities(updateData: Contracts.MruIdentitiesUpdateData, identityId: string, containerId: string): IPromise<void>;
}
export class IdentityMruHttpClient extends IdentityMruHttpClient3 {
    constructor(rootRequestPath: string);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return IdentityMruHttpClient2_2
 */
export function getClient(): IdentityMruHttpClient2_2;
}
declare module "VSS/Identities/Picker/Cache" {
export interface IIdentityPickerCacheException {
    message: string;
    source?: string;
    parameter?: string;
    details?: any;
}
export enum CacheableTypes {
    Unknown = 0,
    UniqueIdentifier = 1,
    Guid = 2,
    Email = 3,
}
export interface ICacheConfiguration {
    expirationIntervalS: number;
}
export interface ICache<V> {
    /**
    *   This method is optimistic
    **/
    set(key: string, value: V): void;
    /**
    *  This method can return null
    **/
    get(key: string): V;
    clear(): void;
    configure(config: ICacheConfiguration): void;
}
export interface IRequestCacheConfiguration {
    delayIntervalMS: number;
}
export interface IRequestCache<T> {
    /**
    *  This method can return null
    **/
    getPromise(request: string): IPromise<T>;
    /**
    *   This method is optimistic
    **/
    setPromise(request: string, promise: IPromise<T>): void;
    configure(config: IRequestCacheConfiguration): void;
}
export class RequestCache<T> implements IRequestCache<T> {
    constructor();
    /**
    *  This method can return null
    **/
    getPromise(request: string): IPromise<T>;
    /**
    *   This method is optimistic
    **/
    setPromise(request: string, promise: IPromise<T>): void;
    configure(config: IRequestCacheConfiguration): void;
    private _setOrResetTimer();
    private _cache;
    private _timer;
    private _config;
    private static _defaultDelayIntervalMS;
}
export interface ITwoLayerCacheConfiguration<V> {
    getUniqueIdentifier: (value: V) => string;
}
export interface ITwoLayerCache<V> {
    addRedirector(cacheType: CacheableTypes, cache?: ICache<string>): void;
    /**
    *  This method can return null
    **/
    get(key: string, cacheTypeHint?: string): V;
    /**
    *   This method is optimistic
    **/
    set(key: string, value: V, cacheTypeHint?: string): void;
    configure(config: ITwoLayerCacheConfiguration<V>): void;
}
export class TwoLayerCache<V> implements ITwoLayerCache<V> {
    constructor(config: ITwoLayerCacheConfiguration<V>);
    configure(config: ITwoLayerCacheConfiguration<V>): void;
    addRedirector(cacheType: CacheableTypes): void;
    /**
    *  This method can return null
    **/
    get(key: string, cacheTypeHint?: string): V;
    /**
    *   This method is optimistic
    **/
    set(key: string, value: V, cacheTypeHint?: string): void;
    private _queryCache(key, cacheTypeHint?);
    private _telemetryOfCacheHitRatio(value);
    private static FEATURE;
    private _config;
    private _redirectors;
    private _objectCache;
}
}
declare module "VSS/Identities/Picker/Constants" {
export class Constants {
    /**
     * For Telemetry, AREA field
     */
    static AREA: string;
}
}
declare module "VSS/Identities/Picker/Controls" {
import Controls = require("VSS/Controls");
import Dialogs = require("VSS/Controls/Dialogs");
import Identities_Picker_RestClient = require("VSS/Identities/Picker/RestClient");
import Identities_Picker_Services = require("VSS/Identities/Picker/Services");
export interface IControlAlignmentOptions {
    /**
    *   the vertex of the dropdown which coincides with the baseAlign (horizontal-vertical). See UI.Positioning for details. Default is "left-top"
    **/
    elementAlign?: string;
    /**
    *   the vertex of the base element used as a reference for positioning (horizontal-vertical). See UI.Positioning for details. Default is "left-bottom"
    **/
    baseAlign?: string;
    /**
    *   an element, or a function which returns an element, to be used for determining the alignment and width of the dropdown control.
    *   Refer to the width, elementAlign, and baseAlign options. Default is the container
    **/
    positioningElement?: JQuery | (() => JQuery);
}
export interface IIdentityPickerDropdownOptions extends Identities_Picker_Services.IIdentityServiceOptions, Identities_Picker_Services.IIdentityPickerExtensionOptions {
    /**
    *   restrict displayed identities in dropdown
    **/
    pageSize?: number;
    /**
    *   what action (usually in parent) should execute when an item in this dropdown is selected
    **/
    onItemSelect?: (identity: Identities_Picker_RestClient.IEntity) => any;
    /**
    *   a pre-render hook that takes in the list of identities that would otherwise have been displayed and rearranges or adds to them prior to returning the new list
    **/
    preDropdownRender?: (entityList: Identities_Picker_RestClient.IEntity[]) => Identities_Picker_RestClient.IEntity[];
    /**
    *   DEPRECATED: the minimum length of the prefix to start searching the directories - in the absence of an MRU - default 3
    **/
    minimumPrefixSize?: number;
    /**
    *   whether to display the contact card icon for each identity in the dropdown. Default false.
    **/
    showContactCard?: boolean;
    /**
    *   whether to display the MRU with the search button or just search directories directly. Default false.
    **/
    showMru?: boolean;
    /**
    *   whether to preload (e.g. the MRU identities) on control creation.
    **/
    loadOnCreate?: boolean;
    /**
    *   the width of the dropdown control. Default is max(positioningElement width, 300px)
    **/
    width?: number;
    coreCssClass?: string;
    /**
    *   the size of the control elements (Medium - most elements are 24px, Large - 32px). Default: Large
    **/
    size?: IdentityPickerControlSize;
    /**
    *   Specify the base element, and the relative alignment of the element and base
    **/
    alignment?: IControlAlignmentOptions;
    /**
    *   what action should execute when identity dropdown is hidden
    **/
    onHide?: (event?: JQueryEventObject) => void;
    /**
    *   Callback to execute when the id card blurs in the dropdown control
    **/
    onIdCardBlurCallback?: () => void;
}
/**
*   For internal / unit testing use only
**/
export interface IIdentityPickerDropdownEventOptions {
    /**
    *   Unique identifier that will be sent as data in events generated by this instance to distinguish it from other instances of this control
    **/
    uniqueId: string;
}
/**
*   For internal / unit testing use only
**/
export interface IIdentityPickerDropdownInternalOptions extends IIdentityPickerDropdownOptions {
    /**
    * Event callback options
    **/
    eventOptions?: IIdentityPickerDropdownEventOptions;
}
export class IdentityPickerDropdownControl extends Controls.Control<IIdentityPickerDropdownOptions> {
    /**
    *   This is intended for usage by unit tests only
    **/
    static SHOW_DROPDOWN_EVENT_INTERNAL: string;
    static HIDE_DROPDOWN_EVENT_INTERNAL: string;
    static UPDATE_THUMBNAILS_EVENT: string;
    static CSS_DROPDOWN_BASE: string;
    private static MIN_RESULTS;
    private static MAX_RESULTS;
    private static MIN_WIDTH;
    private static MAX_HEIGHT;
    private static IMAGE_MARGINS_PX;
    private static DELETE_ICON_SIZE_PX;
    private static CONTACT_CARD_ICON_SIZE_PX;
    private static DROPDOWN_BORDER_PX;
    private static IP_AUTHORIZATION_EXCEPTION_DETAILS_LINK;
    private static CSS_AVATAR;
    private static EVENT_MOUSEDOWN;
    private static FEATURE;
    private _displayedEntities;
    private _mruEntities;
    private _isSearchActive;
    private _isDirectorySearchEnabled;
    private _showOnlyMruIdentities;
    private _$itemsContainer;
    private _$searchResultStatus;
    private _selectedIndex;
    private _numItemsDisplayed;
    private _scrollTimeout;
    private _indexedEntityMap;
    private _prefix;
    private _isVisible;
    private _identityType;
    private _operationScope;
    private _preDropdownRender;
    private _mruEntitiesPromise;
    private _mruEntitiesLoadComplete;
    private _controlLoaded;
    private _loadOnCreate;
    private _size;
    private _baseAlign;
    private _elementAlign;
    private _positioningElement;
    private _eventOptions;
    private _showContactCard;
    constructor(options?: IIdentityPickerDropdownOptions);
    /**
    *   For internal / unit testing use only
    **/
    initializeOptionsInternal(options?: IIdentityPickerDropdownInternalOptions): void;
    initializeOptions(options?: IIdentityPickerDropdownOptions): void;
    initialize(): void;
    load(): IPromise<boolean>;
    /**
    * Adds the identity to the querying identity's MRU
    **/
    addIdentitiesToMru(localIds: string[]): void;
    /**
    * Returns true if the dropdown is currently being shown
    **/
    isVisible(): boolean;
    showAllMruIdentities(selectFirstByDefault?: boolean): IPromise<Identities_Picker_RestClient.IEntity[]>;
    /**
    * Get Identities
    */
    getIdentities(prefix: string, selectFirstByDefault?: boolean): IPromise<Identities_Picker_RestClient.IEntity[]>;
    /**
    * Show the dropdown
    **/
    show(): void;
    /**
    * Hide the dropdown
    **/
    hide(e?: JQueryEventObject, suppressHideEvent?: boolean): void;
    getSelectedIndex(): number;
    getSelectedItem(): Identities_Picker_RestClient.IEntity;
    handleKeyEvent(e: JQueryEventObject): boolean;
    getPrefix(): string;
    /**
    * Set the prefix but does not update the list
    **/
    updatePrefix(prefix: string): void;
    dispose(): void;
    reset(): void;
    private static getClassSelector(className);
    private _loadMruEntitiesAsync();
    private _getUserMruEntitiesPostLoad(selectFirstByDefault?);
    private _enableDirectorySearch();
    private _disableDirectorySearch();
    private _resetSearchStatuses();
    private _getIdentitiesPostLoad(prefix, selectFirstByDefault?);
    private _getDirectoryEntitiesWithRender(prefix, entityDeferred);
    private _getDirectoryEntities(prefix, entityDeferred, quickSearch?);
    private _getImagesForDisplayedEntities();
    private _showPostLoad();
    private _constructDropdown(entitiesToSet, keepIndex?, setupDom?, selectFirstByDefault?);
    /**
    *   Return only the MRU users or groups that have the prefix
    **/
    private static _filterIdentities(identities, prefix);
    /**
    * Removes the identity to the querying identity's MRU
    **/
    private _removeIdentityFromMru(localId);
    /**
    * Get the querying identity's MRU
    **/
    private _getMruIdentities();
    /**
    *   keepIndex: Keep the index of the selected identity at the current location
    **/
    private _alterStateAndRender(showDropDown?, keepIndex?, selectFirstByDefault?);
    /**
    * Scroll to selected item
    **/
    private _setSelectedIndex(newSelectedIndex, scrollIntoView, position?);
    private _scrollItemIntoView(index, position);
    /**
    * Set the position of this control with respect to its parent
    **/
    private _setPosition();
    private _getPositioningElement();
    /**
    * Show the status indicator till all users are loaded
    **/
    private _showLoading();
    /**
    * Show error message in case of non-2xx response
    **/
    private _showError(errorMsg);
    private _nextPage();
    private _prevPage();
    private _nextItem();
    private _prevItem();
    private _highlightPrefix(textValue);
    /**
    * Create the li that shall represent an user item
    **/
    private _createItem(index);
    private _logSelectedEntity(selectedItem);
    private _setupDom();
    private _setupEntitiesInDom();
    private _constructSearchResultStatus();
    private _constructSearchButton();
    private _constructInformativeMessage(errorMessageText);
    private _loadNextPage(force?);
    private _searchButtonClickDelegate();
    private _setShowContactCard();
    private _forceDisableShowContactCardOnPremises();
}
export interface IIdentityPickerIdCardDialogOptions extends Identities_Picker_Services.IIdentityServiceOptions {
    /**
    *   an identity to initialize with (and to avoid a call to the identity picker service API)
    **/
    identity?: Identities_Picker_RestClient.IEntity;
    /**
    *   the uniqueIdentifier of the identity which shall be used for resolving the IdCardDialog - signInAddress or entityId for users and entityId for other kinds of entities
    **/
    uniqueIdentifier?: string;
    /**
    *   The left positioning offset of the dialog
    **/
    leftValue?: number;
    /**
    *   The left positioning offset of the dialog
    **/
    topValue?: number;
    /**
    *   A base element which shall be used as reference for positioning the dialog
    **/
    anchor?: JQuery;
    /**
    *  An optional container of the anchor to be considered. Passing an iframe allows for positioning over an anchor in an other frame.
    **/
    anchorContainer?: JQuery;
    /**
    *   Callback method to execute on blur.
    **/
    onblurCallback?: () => void;
}
export class IdCardDialog extends Dialogs.DialogO<IIdentityPickerIdCardDialogOptions> {
    static IDCARD_LOADED_EVENT: string;
    private static MAX_HEIGHT;
    private static IMAGE_MARGINS_PX;
    private static MEMBERS_TAB_LEFT_PADDING_PX;
    private static CSS_ID_CARD_LIST;
    private static CSS_ID_CARD_MEMBERS_DROPDOWN;
    private _identityType;
    private _operationScope;
    private _$idCardDialog;
    private _scrollTimeout;
    private _numItemsDisplayed;
    private _groupMembers;
    private _$groupMembersContainer;
    private _pageSize;
    private _$loading;
    constructor(options?: IIdentityPickerIdCardDialogOptions);
    initializeOptions(options?: IIdentityPickerIdCardDialogOptions): void;
    initialize(): void;
    private _repositionDialog();
    private _getDirectoryEntities(searchTerm);
    private _getIdentitiesFailure(data);
    private _getIdentitiesSuccess(data);
    private _getThumbnailFailure(data);
    private _getThumbnailSuccess(entityIdThumbnailMap);
    private _displayIdCard(identity);
    private _constructMemberTabContent();
    private _getDirectoryMemberEntities(identity);
    private _onCloseClick(e?);
    private _onCancelClick(e?);
    private _onIdCardBlur(e?);
    private _createItem(item);
    private _renderMembersList();
    private _loadNextPage();
}
export interface ISearchControlCallbackOptions {
    /**
    *   action that should execute when an item in this dropdown is selected. This action, if supplied, shall be called after the dropdown's default onItemSelect action has executed
    **/
    onItemSelect?: (item: Identities_Picker_RestClient.IEntity) => any;
    /**
    *   action that should execute when the input field loses focus. This action, if supplied, shall be called after the control's default onInputBlur action has executed
    **/
    onInputBlur?: () => any;
    /**
    *   action that should execute when a key is pressed. This action, if supplied, shall be called before the dropdown's default onKeyPress action has executed to allow for overrides
    **/
    onKeyPress?: (keyCode: number) => any;
    /**
    *   a pre-render hook that takes in the list of identities that would otherwise have been displayed and rearranges or adds to them prior to returning the new list
    **/
    preDropdownRender?: (entityList: Identities_Picker_RestClient.IEntity[]) => Identities_Picker_RestClient.IEntity[];
}
export interface IIdentityPickerSearchOptions extends Identities_Picker_Services.IIdentityServiceOptions, Identities_Picker_Services.IIdentityPickerExtensionOptions {
    /**
    *   default identities to initialise the dropdown with - if you are constructing the IEntity objects, their identifiers (such as entityId, localId etc.) have to be valid;
    *   alternatively the input can be a semi-colon separated sequence of unique identifiers (such as sign-in addresses or aliases)
    **/
    items?: string | Identities_Picker_RestClient.IEntity[];
    /**
    *   restrict displayed identities in dropdown
    **/
    pageSize?: number;
    /**
    *   DEPRECATED: the minimum length of the prefix to start searching the directories - in the absence of an MRU - default 3
    **/
    minimumPrefixSize?: number;
    /**
    *   whether the search and dropdown controls should handle multiple identities
    **/
    multiIdentitySearch?: boolean;
    /**
    *   whether to display the contact card icon for each identity in the dropdown. Default false.
    **/
    showContactCard?: boolean;
    /**
    *   whether to style the search control with a triangle that displays the MRU on click or not. Default false.
    **/
    showMruTriangle?: boolean;
    /**
    *   whether the dropdown should display the MRU with the search button or just search directories directly. Setting this will also enable the MRU on the dropdown.
    *   Default false.
    **/
    showMru?: boolean;
    /**
    *   whether to preload (e.g. the MRU identities) on control creation.
    **/
    loadOnCreate?: boolean;
    /**
    *   whether for a single-select control a click on the resolved item highlights the text (true) or opens the contact card (false - default)
    **/
    highlightResolved?: boolean;
    /**
    *   the size of the search control elements (Small - most elements are 16px in height, Medium - 24px, Large - 32px). Default: Medium
    **/
    size?: IdentityPickerControlSize;
    /**
    *   the size of the dropdown control elements (Medium - most elements are 24px, Large - 32px). Default: Large
    **/
    dropdownSize?: IdentityPickerControlSize;
    /**
    *   the value of the placeholder attribute for the search text box.
    **/
    placeholderText?: string;
    /**
    *   a custom id for the input element
    **/
    elementId?: string;
    /**
    *   an IEntity to be displayed by default instead of the empty input element
    **/
    watermark?: Identities_Picker_RestClient.IEntity;
    /**
    *   the width of the dropdown control. Default is max(positioningElement width, 300px)
    **/
    dropdownWidth?: number;
    /**
    *   Callbacks supported by the search control
    **/
    callbacks?: ISearchControlCallbackOptions;
}
/**
*   For internal unit testing use only
**/
export interface IIdentityPickerSearchTestOptions {
    /**
    *   Return the container that is to be used for the dropdown - default is body
    **/
    dropdownContainer?: (container?: JQuery) => JQuery;
}
/**
*   For internal unit testing use only
**/
export interface IIdentityPickerSearchOptionsInternal extends IIdentityPickerSearchOptions, IIdentityPickerSearchTestOptions {
}
export interface IIdentityPickerControlInteractable {
    enableReadOnlyMode(): any;
    disableReadOnlyMode(): any;
}
export class IdentityPickerSearchControl extends Controls.Control<IIdentityPickerSearchOptions> implements IdentityPickerSearchControl {
    static INVALID_INPUT_EVENT: string;
    static VALID_INPUT_EVENT: string;
    static DATA_SOURCE_FALLBACK_EVENT: string;
    static DATA_SOURCE_REEVALUATE_EVENT: string;
    static SEARCH_STARTED_EVENT: string;
    static SEARCH_FINISHED_EVENT: string;
    static DIALOG_MOVE_EVENT: string;
    static CSS_SEARCH_MRU_TRIANGLE: string;
    private static DEFAULT_WIDTH;
    private static OUTER_PADDING_PX;
    private static TRIANGLE_WIDTH_PX;
    private static NAME_PADDING_PX;
    private _identityPickerDropdown;
    private _identityPickerDropdownUniqueId;
    private _identityType;
    private _operationScope;
    private _selectedItems;
    private _unresolvedItems;
    private _$input;
    private _$container;
    private _$mruTriangle;
    private _searchTerm;
    private _$focusedOn;
    private _typingTimer;
    private _doneTypingInterval;
    private _controlWidth;
    private _resolvedIEntity;
    private _preDropdownRender;
    private _placeholderText;
    private _controlLoaded;
    private _loadOnCreate;
    private _size;
    private _updateThumbnailDelegate;
    private _dropdownShowEventDelegate;
    private _dropdownHideEventDelegate;
    private _previousInput;
    private _externalEventDelegate;
    private _showContactCard;
    private _dropdownContainerDelegate;
    private _isSearchEverIssued;
    private _readOnlyMode;
    constructor(options?: IIdentityPickerSearchOptions, testUse?: boolean);
    /**
    *   To be used only by unit tests
    **/
    initializeOptionsInternal(options: IIdentityPickerSearchOptionsInternal): void;
    initialize(): void;
    load(): IPromise<boolean>;
    getIdentitySearchResult(): IdentitySearchResult;
    clear(): void;
    isDropdownVisible(): boolean;
    addIdentitiesToMru(identities: Identities_Picker_RestClient.IEntity[]): void;
    /**
    * Appends to the search control's entities - this expects valid IEntity objects or valid query tokens - such as unique email addresses - entity objects must have been retrieved at some point from the control or DDS, or created using EntityFactory
    **/
    setEntities(entities: Identities_Picker_RestClient.IEntity[], queryTokens: string[]): void;
    getDropdownPrefix(): string;
    showMruDropdown(): void;
    /**
    * Currently focuses on an available resolved/unresolved item, else shows the input box, can optionally focus on the search box itself in the future
    **/
    focusOnSearchInput(): void;
    enableReadOnlyMode(): void;
    disableReadOnlyMode(): void;
    dispose(): void;
    private _isReadOnly();
    /**
    *   Use this function to set focus on resolved input, please make sure the input element is already in DOM, otherwise set focus won`t work.
    **/
    private _focusOnResolvedInput(resolvedInput);
    private _hideMruTriangle();
    private _showMruTriangle();
    /**
    *   Clears but does not recreate the watermark
    **/
    private _clearSearchControl();
    private _showAllMruInDropdownWithoutDefaultSelection(showDropdownIfNoMruEntities?);
    private _showAllMruInDropdown(showDropdownIfNoMruEntities?, selectFirstByDefault?);
    private _showProgressCursor();
    private _stopProgressCursor();
    private _fireInvalidInput();
    private _fireValidInput();
    private _fireDataSourceFallback();
    private _fireDataSourceReevaluate();
    private _isShowMruEnabledInDropdown();
    private _attachHandlersOnShowDropdown(data);
    private _detachHandlersOnHideDropdown(data);
    private _hideDropdown(e?);
    private _showDropdown(e?);
    private _compareInputOnInputChangeEvent(input);
    private _setInputText(input);
    private _resetPreviousInput();
    private _onInputChange(e?);
    private _onInputClick(e?);
    private _onMruTriangleMousedown(e);
    private _onMruTriangleClick(e);
    private _onInputBlur(e?);
    private _onInputKeyDown(e?);
    private _fireInputValidityEvent();
    private _resolveSelectedItem(resolveByTab?);
    private _onInputKeyUp(e?);
    private _removeFromUnresolved(item);
    private _removeFromResolved(item);
    private _getInputText();
    private _resolveInputToIdentities(input, queryTokenHint?);
    private _getIdentities(searchTerm);
    private _updateThumbnail(data);
    private _recalculateInputWidth();
    private _replaceAndCleanup(email);
    private _findInSelectedItems(object);
    private _showIdCardDialog(args);
    private _clearWatermark();
    private _showWatermark();
    private _isControlInFocus();
    private _resolveItem(item, clearInput?, prefix?, resolveByTab?);
    private _getItemNameContainerMaxWidth(otherElementsInItemSpan);
    private _getSearchPrefix(input);
    private _unresolveItem(token);
    private _setShowContactCard();
    private _forceDisableShowContactCardOnPremises();
    private _generatePlaceHolder(identityTypeList);
    private _isInArray(s, a);
}
export interface IdentitySearchResult {
    resolvedEntities: Identities_Picker_RestClient.IEntity[];
    unresolvedQueryTokens: string[];
}
export enum IdentityPickerControlSize {
    Small = 0,
    Medium = 1,
    Large = 2,
}
export interface IIdentityDisplayOptions extends Identities_Picker_Services.IIdentityServiceOptions, Identities_Picker_Services.IIdentityPickerExtensionOptions {
    /**
    *   the identity to be displayed - if you are constructing the IEntity object, its identifiers (such as entityId, localId etc.) have to be valid;
    *   alternatively the input can be a unique identifier (such as a sign-in address or alias)
    **/
    item: string | Identities_Picker_RestClient.IEntity;
    /**
    *   the size of the control elements (Small - most elements are 16px in height, Medium - 24px, Large - 32px). Default: Medium
    **/
    size?: IdentityPickerControlSize;
    /**
    *   Determines what is shown in the control
    **/
    displayType?: EDisplayControlType;
    /**
    *   the string to be shown before the IEntity gets resolved
    **/
    friendlyDisplayName?: string;
    /**
    *   Turn off the hover effect. Default: false
    **/
    turnOffHover?: boolean;
}
export enum EDisplayControlType {
    AvatarText = 0,
    AvatarOnly = 1,
    TextOnly = 2,
}
export class IdentityDisplayControl extends Controls.Control<IIdentityDisplayOptions> {
    private static DEFAULT_HOVER_WAIT_ENTER_INTERVAL;
    private static DEFAULT_HOVER_WAIT_EXIT_INTERVAL;
    private static MIN_WIDTH;
    private static OUTER_PADDING_PX;
    private _identityType;
    private _operationScope;
    private _size;
    private _displayType;
    private _hoverIdCardEnterTimer;
    private _hoverIdCardExitTimer;
    private _displayedEntity;
    private _turnOffHover;
    private _showIdCard;
    constructor(options?: IIdentityDisplayOptions);
    initialize(): void;
    getDisplayedEntity(): Identities_Picker_RestClient.IEntity;
    private _resolveStringToEntity(input);
    private _updateThumbnail(data);
    private _showIdCardDialog(args);
    private _displayString(item);
    private _displayEntity(entity, prefix);
}
/**
*   Contruct an IEntity from a string.
*   Creation is only intended to be called by the controls here, public due to lack of internal-like keywords in ts.
*   isStringEntity and isStringEntityId are publicly supported.
**/
export class EntityFactory {
    static STRING_ENTITY_TYPE: string;
    private static STRING_ENTITY_ID_PREFIX;
    private static STRING_DIRECTORY;
    private static STRING_ORIGIN_ID_PREFIX;
    private static STRING_LOCAL_ID_PREFIX;
    static createStringEntity(displayName: string, imageUrl?: string): Identities_Picker_RestClient.IEntity;
    static isStringEntityId(entityId: string): boolean;
    static isStringPrefixedLocalId(localId: string): boolean;
}
export class EntityMergeOptions {
    static PreferFirst: string;
    static PreferSecond: string;
}
export class EntityHelpers {
    /**
    *   This is the default way the controls internally merge MRU and DDS entities entities.
    *   Assumes that list1 and list2 are lists of distinct entities.
    *   Use-cases apart from calls by the controls here are not supported; provided as a example of merging logic.
    **/
    static mergeEntities(list1: Identities_Picker_RestClient.IEntity[], list2: Identities_Picker_RestClient.IEntity[], mergePreference?: string): Identities_Picker_RestClient.IEntity[];
    static isDirectoryEntityType(entity: Identities_Picker_RestClient.IEntity): boolean;
    /**
    *   This is the default way the controls internally fetch the key for disambiguating entities.
    *   Use-cases apart from calls by the controls here are not supported; provided as a example of merging logic.
    **/
    private static _getMergingKeyFromEntity(entity);
    static getUniqueIdentifierForDisambiguation(entity: Identities_Picker_RestClient.IEntity): string;
    private static _mergeSimilarEntities(x, y, mergePreference?);
    private static _computeValue(key, x, y, mergePreference?);
}
export class IdentityAttributesFactory {
    getIdentityAttributes(identity: Identities_Picker_RestClient.IEntity): IEntityTypeIdCardAttribute;
}
export class EntityIdCardAttribute {
    private _displayTitle;
    private _displayContent;
    private _needWordWrap;
    constructor(displayTitle: string, displayContent: string, needWordWrap?: boolean);
    getDisplayTitle(): string;
    getDisplayContent(): string;
    constructAttribute(): Array<JQuery>;
    /**
    *   Add a click event handler for the target element that opens a mail client with the input email address.
    *   Note: We should use "mailto" in the anchor tag directly but since it`s not working here for some reason, use js to launch the mail client instead.
    **/
    private _addEmailAddressClickHandler(element, emailAddress);
    /**
    *   Check whether the attribute title equals with Resources_Platform.IdentityPicker_IdCardMail and the content is a valid email address.
    **/
    private _isValidSendEmailAttribute();
}
export interface IEntityTypeIdCardAttribute {
    isEmpty(): boolean;
    toRows(): Array<JQuery>;
}
export class UserEntityTypeAttributes implements IEntityTypeIdCardAttribute {
    private _attributes;
    constructor(identity: Identities_Picker_RestClient.IEntity);
    private _mapEntityPropertiesToAttributes(identity);
    isEmpty(): boolean;
    private _appendAttributeBlock(index, appendee);
    toRows(): Array<JQuery>;
    private _isEven(value);
}
export class GroupEntityTypeAttributes implements IEntityTypeIdCardAttribute {
    private _attributes;
    constructor(identity: Identities_Picker_RestClient.IEntity);
    private _mapEntityPropertiesToAttributes(identity);
    private _getScopeNameByDirectoryType(identity);
    isEmpty(): boolean;
    private _appendAttributeBlock(index, appendee);
    toRows(): Array<JQuery>;
    private _isValidIndex(index);
}
}
declare module "VSS/Identities/Picker/RestClient" {
import WebApi_RestClient = require("VSS/WebApi/RestClient");
export class AbstractIdentityPickerHttpClient extends WebApi_RestClient.VssHttpClient {
    beginGetIdentities(identitiesRequest: IdentitiesSearchRequestModel): IPromise<IdentitiesSearchResponseModel>;
    beginGetIdentityImageLocation(objectId: string): IPromise<string>;
    beginGetConnections(objectId: string, getRequestParams: IdentitiesGetConnectionsRequestModel): IPromise<IdentitiesGetConnectionsResponseModel>;
    beginGetIdentityFeatureMru(identityId: string, featureId: string, getRequestParams: IdentitiesGetMruRequestModel): IPromise<IdentitiesGetMruResponseModel>;
    beginPatchIdentityFeatureMru(identityId: string, featureId: string, patchRequestBody: IdentitiesPatchMruAction[]): IPromise<IdentitiesPatchMruResponseModel>;
}
export class CommonIdentityPickerHttpClient extends AbstractIdentityPickerHttpClient {
    private static _identityImageLocation;
    beginGetIdentities(identitiesRequest: IdentitiesSearchRequestModel): IPromise<IdentitiesSearchResponseModel>;
    beginGetIdentityImageLocation(objectId: string): IPromise<string>;
    beginGetConnections(objectId: string, getRequestParams: IdentitiesGetConnectionsRequestModel): IPromise<IdentitiesGetConnectionsResponseModel>;
    beginGetIdentityFeatureMru(identityId: string, featureId: string, getRequestParams: IdentitiesGetMruRequestModel): IPromise<IdentitiesGetMruResponseModel>;
    beginPatchIdentityFeatureMru(identityId: string, featureId: string, patchRequestBody: IdentitiesPatchMruAction[]): IPromise<IdentitiesPatchMruResponseModel>;
}
/**
 *   Identity Picker Models
**/
export interface IEntity {
    /**
    *   Always set. Not to be parsed as any non-string type.
    **/
    entityId: string;
    /**
    *   Always set. e.g. user or group
    **/
    entityType: string;
    /**
    *   Always set. e.g. vsd or aad - aad for AAD-backed/linked accounts, vsd otherwise
    **/
    originDirectory: string;
    /**
    *   Always set. e.g. the objectId in case of AAD sourced entities (AAD-backed/linked accounts).
    **/
    originId: string;
    /**
    *   Set to the IMS vsid in case of non-AAD-backed/linked entities.
    **/
    localDirectory?: string;
    localId?: string;
    /**
    *   Always set.
    **/
    displayName?: string;
    scopeName?: string;
    department?: string;
    jobTitle?: string;
    mail?: string;
    mailNickname?: string;
    physicalDeliveryOfficeName?: string;
    signInAddress?: string;
    surname?: string;
    guest?: boolean;
    description?: string;
    image?: string;
    manager?: string;
    samAccountName?: string;
    /**
    *   The isMru field denotes whether this identity was loaded via a MruService operation or an IdentityService operation.
    *   Furthermore, this should not be set for identities that were constructed (for constants etc.)
    **/
    isMru?: boolean;
}
export interface QueryTokenResultModel {
    queryToken: string;
    identities: IEntity[];
    pagingToken?: string;
}
export interface IdentitiesSearchRequestModel {
    query: string;
    identityTypes: string[];
    operationScopes: string[];
    queryTypeHint?: string;
    pagingToken?: string;
    properties?: string[];
    options?: any;
}
export interface IdentitiesSearchResponseModel {
    results: QueryTokenResultModel[];
}
export interface IdentitiesGetAvatarResponseModel {
    avatar: string;
}
export interface IdentitiesGetConnectionsRequestModel {
    connectionTypes: string[];
    identityTypes: string[];
    operationScopes: string[];
    depth?: number;
    options?: any;
    pagingToken?: string;
    properties?: string[];
}
export interface IdentitiesGetConnectionsResponseModel {
    successors?: IEntity[];
}
export interface IdentitiesGetMruRequestModel {
    operationScopes: string[];
    properties?: string[];
}
export interface IdentitiesGetMruResponseModel {
    mruIdentities: IEntity[];
}
export interface IdentitiesPatchMruAction {
    op: string;
    value: string[];
    operationScopes: string[];
}
export interface IdentitiesPatchMruResponseModel {
    result: boolean;
}
}
declare module "VSS/Identities/Picker/Services" {
import Service = require("VSS/Service");
import Identities_Picker_RestClient = require("VSS/Identities/Picker/RestClient");
/**
*   Maps to static Directory in the DirectoryDiscoveryService
**/
export interface IOperationScope {
    /**
    *   Search the applicable source directory - AAD tenant-level for AAD-backed accounts or IMS account-level for MSA accounts/on-premise TFS
    **/
    Source?: boolean;
    /**
    *   Search IMS (Identity service)
    **/
    IMS?: boolean;
    /**
    *   Search the Azure Active Directory
    **/
    AAD?: boolean;
    /**
    *   Search Active Directory
    **/
    AD?: boolean;
    /**
    *   Search Windows Machine Directory
    **/
    WMD?: boolean;
}
/**
*   Suggest that the query need not be treated as a prefix
**/
export interface IQueryTypeHint {
    UID?: boolean;
}
/**
*   Maps to static DirectoryObjectType in the DirectoryDiscoveryService
**/
export interface IEntityType {
    User?: boolean;
    Group?: boolean;
}
/**
*  The kinds of edges in the identity directed graph that you want to traverse
**/
export interface IConnectionType {
    successors?: boolean;
}
/**
*   These client service helpers are meant to be used only by the framework identity picker controls and services and should not be used elsewhere.
**/
export class ServiceHelpers {
    static _defaultProperties: string[];
    static _defaultUserProperties: string[];
    static _defaultGroupProperties: string[];
    static DefaultUserImage: string;
    static DefaultVsoGroupImage: string;
    static DefaultAadGroupImage: string;
    static VisualStudioDirectory: string;
    static AzureActiveDirectory: string;
    static SourceDirectory: string;
    static UserEntity: string;
    static GroupEntity: string;
    static ExtensionData_ExtensionIdKey: string;
    static ExtensionData_ProjectScopeNameKey: string;
    static ExtensionData_CollectionScopeNameKey: string;
    static ExtensionData_ConstraintListKey: string;
    static ExtensionData_NoServiceIdentities: string;
    static ExtensionData_MaterializedAadGroupsOnlyItem: string;
    static GetIdentities_Prefix_Separator: string;
    /**
    *   Currently supports only AAD, Source, AD and WMD (AAD for AAD-backed accounts, IMS for MSA accounts/on-premise TFS and AD and WMD for on-premise TFS)
    **/
    static getOperationScopeList(operationScope: IOperationScope): string[];
    static getQueryTypeHint(queryTypeHint: IQueryTypeHint): string;
    /**
    *   Currently supports only Users and Groups
    **/
    static getIdentityTypeList(identityType: IEntityType): string[];
    /**
    *   Currently supports only Successors
    **/
    static getConnectionTypeList(connectionType: IConnectionType): string[];
    static getDefaultIdentityImage(identity: Identities_Picker_RestClient.IEntity): string;
    static getDistinct(array: string[]): string[];
}
/**
*   This interface is for identity picker service extension
**/
export interface IExtensionData {
    extensionId: string;
    projectScopeName?: string;
    collectionScopeName?: string;
    constraints?: string[];
}
export interface IIdentityPickerExtensionOptions {
    /**
    *   The source of the request - please update the vso wiki at "Common_Identity_Picker" with your consumer UID
    **/
    consumerId?: string;
    /**
    *   Extension options that might help the service in modifying requests.
    **/
    extensionData?: IExtensionData;
}
export interface IIdentityServiceOptions {
    /**
    *   The httpClient that should be used instead of the CommonIdentityPickerHttpClient
    **/
    httpClient?: Identities_Picker_RestClient.AbstractIdentityPickerHttpClient;
    /**
    *   The minimum results that need to be fetched
    **/
    minResults?: number;
    /**
    *   The maximum results that need to be fetched
    **/
    maxResults?: number;
    /**
    *   Details about the control's current environment that might help an IEntityOperationsExtension in modifying requests.
    **/
    extensionData?: IExtensionData;
    /**
    *   type of identities - one or more of User or Group
    **/
    identityType?: IEntityType;
    /**
    *   scope - one or more of AAD, IMS, Source
    **/
    operationScope?: IOperationScope;
}
export interface IIdentityService {
    getIdentities(prefix: string, operationScope: IOperationScope, identityType: IEntityType, options?: IIdentityServiceOptions): IDictionaryStringTo<IPromise<Identities_Picker_RestClient.QueryTokenResultModel>>;
    getIdentityImages(identities: Identities_Picker_RestClient.IEntity[], options?: IIdentityServiceOptions): IDictionaryStringTo<IPromise<IDictionaryStringTo<string>>>;
    getIdentityConnections(identity: Identities_Picker_RestClient.IEntity, operationScope: IOperationScope, identityType: IEntityType, connectionType: IConnectionType, options?: IIdentityServiceOptions): IPromise<Identities_Picker_RestClient.IdentitiesGetConnectionsResponseModel>;
}
/**
*   This client service is meant to be used only by the framework identity picker controls and should not be used elsewhere.
**/
export class IdentityService extends Service.VssService implements IIdentityService {
    constructor();
    /**
    *   Get all users with specific properties starting with the prefix.
    **/
    getIdentities(prefix: string, operationScope: IOperationScope, identityType: IEntityType, options?: IIdentityServiceOptions, queryTypeHint?: IQueryTypeHint): IDictionaryStringTo<IPromise<Identities_Picker_RestClient.QueryTokenResultModel>>;
    /**
    *   Get images of identities asynchronously, if available. Currently only supports AAD and profile images.
    *   @param  successCallback:    This is called once all the images have been loaded for the identities supplied
    *   @param  errorCallback:      This is called for each error received from either the controller or one of the federated services
    **/
    getIdentityImages(identities: Identities_Picker_RestClient.IEntity[], options?: IIdentityServiceOptions): IDictionaryStringTo<IPromise<IDictionaryStringTo<string>>>;
    /**
    *   Get an identity's connections in the overlay of the AD graph on the VSTS Identity graph
    **/
    getIdentityConnections(identity: Identities_Picker_RestClient.IEntity, operationScope: IOperationScope, identityType: IEntityType, connectionType: IConnectionType, options?: IIdentityServiceOptions): IPromise<Identities_Picker_RestClient.IdentitiesGetConnectionsResponseModel>;
    private static _getEntityIdsAsQueryTokens(identities);
    private _cacheQueryTokenResult(queryTokenResult);
    private static _removeQueryToken(queryToken, queryTokens);
    private static getUniqueRequestString(queryToken, operationScope, identityType);
    private static _ffClientPerformanceEnabled;
    private static _ffClientPerformance;
    private _qtrCache;
    private _qtrRequestAggregator;
    private _entityImageRequestAggregator;
}
export interface IMruServiceOptions {
    /**
    *   The httpClient that should be used instead of the CommonIdentityPickerHttpClient
    **/
    httpClient?: Identities_Picker_RestClient.AbstractIdentityPickerHttpClient;
}
/**
*   Operations on the account-bound MRU identities (across all IdentityTypeFilters) of the querying user in its account
**/
export interface IMruService {
    getMruIdentities(operationScope: IOperationScope, identityId?: string, featureId?: string, options?: IMruServiceOptions): IPromise<Identities_Picker_RestClient.IEntity[]>;
    removeMruIdentities(objectIds: string[], operationScope: IOperationScope, identityId?: string, featureId?: string, options?: IMruServiceOptions): IPromise<boolean>;
    addMruIdentities(objectIds: string[], operationScope: IOperationScope, identityId?: string, featureId?: string, options?: IMruServiceOptions): IPromise<boolean>;
}
/**
*   This client service is meant to be used only by the framework identity picker controls and should not be used elsewhere.
**/
export class MruService extends Service.VssService implements IMruService {
    static DEFAULT_IDENTITY_ID: string;
    static DEFAULT_FEATURE_ID: string;
    getMruIdentities(operationScope: IOperationScope, identityId?: string, featureId?: string, options?: IMruServiceOptions): IPromise<Identities_Picker_RestClient.IEntity[]>;
    removeMruIdentities(objectIds: string[], operationScope: IOperationScope, identityId?: string, featureId?: string, options?: IMruServiceOptions): IPromise<boolean>;
    addMruIdentities(objectIds: string[], operationScope: IOperationScope, identityId?: string, featureId?: string, options?: IMruServiceOptions): IPromise<boolean>;
}
}
declare module "VSS/Identities/RestClient" {
import Contracts = require("VSS/Identities/Contracts");
import VSS_Common_Contracts = require("VSS/WebApi/Contracts");
import VSS_DelegatedAuthorization_Contracts = require("VSS/DelegatedAuthorization/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class IdentitiesHttpClient3 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {any} container
     * @return IPromise<Contracts.Identity[]>
     */
    createGroups(container: any): IPromise<Contracts.Identity[]>;
    /**
     * [Preview API]
     *
     * @param {string} groupId
     * @return IPromise<void>
     */
    deleteGroup(groupId: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} scopeIds
     * @param {boolean} recurse
     * @param {boolean} deleted
     * @param {string} properties
     * @return IPromise<Contracts.Identity[]>
     */
    listGroups(scopeIds?: string, recurse?: boolean, deleted?: boolean, properties?: string): IPromise<Contracts.Identity[]>;
    /**
     * [Preview API]
     *
     * @param {number} identitySequenceId
     * @param {number} groupSequenceId
     * @param {string} scopeId
     * @return IPromise<Contracts.ChangedIdentities>
     */
    getIdentityChanges(identitySequenceId: number, groupSequenceId: number, scopeId?: string): IPromise<Contracts.ChangedIdentities>;
    /**
     * [Preview API]
     *
     * @param {string} descriptors
     * @param {string} identityIds
     * @param {string} searchFilter
     * @param {string} filterValue
     * @param {Contracts.QueryMembership} queryMembership
     * @param {string} properties
     * @param {boolean} includeRestrictedVisibility
     * @param {Contracts.ReadIdentitiesOptions} options
     * @return IPromise<Contracts.Identity[]>
     */
    readIdentities(descriptors?: string, identityIds?: string, searchFilter?: string, filterValue?: string, queryMembership?: Contracts.QueryMembership, properties?: string, includeRestrictedVisibility?: boolean, options?: Contracts.ReadIdentitiesOptions): IPromise<Contracts.Identity[]>;
    /**
     * [Preview API]
     *
     * @param {string} scopeId
     * @param {Contracts.QueryMembership} queryMembership
     * @param {string} properties
     * @return IPromise<Contracts.Identity[]>
     */
    readIdentitiesByScope(scopeId: string, queryMembership?: Contracts.QueryMembership, properties?: string): IPromise<Contracts.Identity[]>;
    /**
     * [Preview API]
     *
     * @param {string} identityId
     * @param {Contracts.QueryMembership} queryMembership
     * @param {string} properties
     * @return IPromise<Contracts.Identity>
     */
    readIdentity(identityId: string, queryMembership?: Contracts.QueryMembership, properties?: string): IPromise<Contracts.Identity>;
    /**
     * [Preview API]
     *
     * @param {VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.Identity[]>} identities
     * @return IPromise<Contracts.IdentityUpdateData[]>
     */
    updateIdentities(identities: VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.Identity[]>): IPromise<Contracts.IdentityUpdateData[]>;
    /**
     * [Preview API]
     *
     * @param {Contracts.Identity} identity
     * @param {string} identityId
     * @return IPromise<void>
     */
    updateIdentity(identity: Contracts.Identity, identityId: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {Contracts.FrameworkIdentityInfo} frameworkIdentityInfo
     * @return IPromise<Contracts.Identity>
     */
    createIdentity(frameworkIdentityInfo: Contracts.FrameworkIdentityInfo): IPromise<Contracts.Identity>;
    /**
     * [Preview API]
     *
     * @param {Contracts.IdentityBatchInfo} batchInfo
     * @return IPromise<Contracts.Identity[]>
     */
    readIdentityBatch(batchInfo: Contracts.IdentityBatchInfo): IPromise<Contracts.Identity[]>;
    /**
     * [Preview API]
     *
     * @param {string} scopeId
     * @return IPromise<Contracts.IdentitySnapshot>
     */
    getIdentitySnapshot(scopeId: string): IPromise<Contracts.IdentitySnapshot>;
    /**
     * [Preview API]
     *
     * @return IPromise<Contracts.IdentitySelf>
     */
    getSelf(): IPromise<Contracts.IdentitySelf>;
    /**
     * [Preview API]
     *
     * @param {string} containerId
     * @param {string} memberId
     * @return IPromise<boolean>
     */
    addMember(containerId: string, memberId: string): IPromise<boolean>;
    /**
     * [Preview API]
     *
     * @param {string} containerId
     * @param {string} memberId
     * @param {Contracts.QueryMembership} queryMembership
     * @return IPromise<Contracts.IdentityDescriptor>
     */
    readMember(containerId: string, memberId: string, queryMembership?: Contracts.QueryMembership): IPromise<Contracts.IdentityDescriptor>;
    /**
     * [Preview API]
     *
     * @param {string} containerId
     * @param {Contracts.QueryMembership} queryMembership
     * @return IPromise<Contracts.IdentityDescriptor[]>
     */
    readMembers(containerId: string, queryMembership?: Contracts.QueryMembership): IPromise<Contracts.IdentityDescriptor[]>;
    /**
     * [Preview API]
     *
     * @param {string} containerId
     * @param {string} memberId
     * @return IPromise<boolean>
     */
    removeMember(containerId: string, memberId: string): IPromise<boolean>;
    /**
     * [Preview API]
     *
     * @param {string} memberId
     * @param {string} containerId
     * @param {Contracts.QueryMembership} queryMembership
     * @return IPromise<Contracts.IdentityDescriptor>
     */
    readMemberOf(memberId: string, containerId: string, queryMembership?: Contracts.QueryMembership): IPromise<Contracts.IdentityDescriptor>;
    /**
     * [Preview API]
     *
     * @param {string} memberId
     * @param {Contracts.QueryMembership} queryMembership
     * @return IPromise<Contracts.IdentityDescriptor[]>
     */
    readMembersOf(memberId: string, queryMembership?: Contracts.QueryMembership): IPromise<Contracts.IdentityDescriptor[]>;
    /**
     * [Preview API]
     *
     * @param {Contracts.CreateScopeInfo} info
     * @param {string} scopeId
     * @return IPromise<Contracts.IdentityScope>
     */
    createScope(info: Contracts.CreateScopeInfo, scopeId: string): IPromise<Contracts.IdentityScope>;
    /**
     * [Preview API]
     *
     * @param {string} scopeId
     * @return IPromise<void>
     */
    deleteScope(scopeId: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} scopeId
     * @return IPromise<Contracts.IdentityScope>
     */
    getScopeById(scopeId: string): IPromise<Contracts.IdentityScope>;
    /**
     * [Preview API]
     *
     * @param {string} scopeName
     * @return IPromise<Contracts.IdentityScope>
     */
    getScopeByName(scopeName: string): IPromise<Contracts.IdentityScope>;
    /**
     * [Preview API]
     *
     * @param {Contracts.IdentityScope} renameScope
     * @param {string} scopeId
     * @return IPromise<void>
     */
    renameScope(renameScope: Contracts.IdentityScope, scopeId: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @return IPromise<VSS_DelegatedAuthorization_Contracts.AccessTokenResult>
     */
    getSignoutToken(): IPromise<VSS_DelegatedAuthorization_Contracts.AccessTokenResult>;
    /**
     * [Preview API]
     *
     * @param {string} tenantId
     * @return IPromise<Contracts.TenantInfo>
     */
    getTenant(tenantId: string): IPromise<Contracts.TenantInfo>;
}
export class IdentitiesHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * @param {any} container
     * @return IPromise<Contracts.Identity[]>
     */
    createGroups(container: any): IPromise<Contracts.Identity[]>;
    /**
     * @param {string} groupId
     * @return IPromise<void>
     */
    deleteGroup(groupId: string): IPromise<void>;
    /**
     * @param {string} scopeIds
     * @param {boolean} recurse
     * @param {boolean} deleted
     * @param {string} properties
     * @return IPromise<Contracts.Identity[]>
     */
    listGroups(scopeIds?: string, recurse?: boolean, deleted?: boolean, properties?: string): IPromise<Contracts.Identity[]>;
    /**
     * @param {number} identitySequenceId
     * @param {number} groupSequenceId
     * @param {string} scopeId
     * @return IPromise<Contracts.ChangedIdentities>
     */
    getIdentityChanges(identitySequenceId: number, groupSequenceId: number, scopeId?: string): IPromise<Contracts.ChangedIdentities>;
    /**
     * @param {string} descriptors
     * @param {string} identityIds
     * @param {string} searchFilter
     * @param {string} filterValue
     * @param {Contracts.QueryMembership} queryMembership
     * @param {string} properties
     * @param {boolean} includeRestrictedVisibility
     * @param {Contracts.ReadIdentitiesOptions} options
     * @return IPromise<Contracts.Identity[]>
     */
    readIdentities(descriptors?: string, identityIds?: string, searchFilter?: string, filterValue?: string, queryMembership?: Contracts.QueryMembership, properties?: string, includeRestrictedVisibility?: boolean, options?: Contracts.ReadIdentitiesOptions): IPromise<Contracts.Identity[]>;
    /**
     * @param {string} scopeId
     * @param {Contracts.QueryMembership} queryMembership
     * @param {string} properties
     * @return IPromise<Contracts.Identity[]>
     */
    readIdentitiesByScope(scopeId: string, queryMembership?: Contracts.QueryMembership, properties?: string): IPromise<Contracts.Identity[]>;
    /**
     * @param {string} identityId
     * @param {Contracts.QueryMembership} queryMembership
     * @param {string} properties
     * @return IPromise<Contracts.Identity>
     */
    readIdentity(identityId: string, queryMembership?: Contracts.QueryMembership, properties?: string): IPromise<Contracts.Identity>;
    /**
     * @param {VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.Identity[]>} identities
     * @return IPromise<Contracts.IdentityUpdateData[]>
     */
    updateIdentities(identities: VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.Identity[]>): IPromise<Contracts.IdentityUpdateData[]>;
    /**
     * @param {Contracts.Identity} identity
     * @param {string} identityId
     * @return IPromise<void>
     */
    updateIdentity(identity: Contracts.Identity, identityId: string): IPromise<void>;
    /**
     * @param {Contracts.FrameworkIdentityInfo} frameworkIdentityInfo
     * @return IPromise<Contracts.Identity>
     */
    createIdentity(frameworkIdentityInfo: Contracts.FrameworkIdentityInfo): IPromise<Contracts.Identity>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {Contracts.IdentityBatchInfo} batchInfo
     * @return IPromise<Contracts.Identity[]>
     */
    readIdentityBatch(batchInfo: Contracts.IdentityBatchInfo): IPromise<Contracts.Identity[]>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {string} scopeId
     * @return IPromise<Contracts.IdentitySnapshot>
     */
    getIdentitySnapshot(scopeId: string): IPromise<Contracts.IdentitySnapshot>;
    /**
     * @return IPromise<Contracts.IdentitySelf>
     */
    getSelf(): IPromise<Contracts.IdentitySelf>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {string} containerId
     * @param {string} memberId
     * @return IPromise<boolean>
     */
    addMember(containerId: string, memberId: string): IPromise<boolean>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {string} containerId
     * @param {string} memberId
     * @param {Contracts.QueryMembership} queryMembership
     * @return IPromise<Contracts.IdentityDescriptor>
     */
    readMember(containerId: string, memberId: string, queryMembership?: Contracts.QueryMembership): IPromise<Contracts.IdentityDescriptor>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {string} containerId
     * @param {Contracts.QueryMembership} queryMembership
     * @return IPromise<Contracts.IdentityDescriptor[]>
     */
    readMembers(containerId: string, queryMembership?: Contracts.QueryMembership): IPromise<Contracts.IdentityDescriptor[]>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {string} containerId
     * @param {string} memberId
     * @return IPromise<boolean>
     */
    removeMember(containerId: string, memberId: string): IPromise<boolean>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {string} memberId
     * @param {string} containerId
     * @param {Contracts.QueryMembership} queryMembership
     * @return IPromise<Contracts.IdentityDescriptor>
     */
    readMemberOf(memberId: string, containerId: string, queryMembership?: Contracts.QueryMembership): IPromise<Contracts.IdentityDescriptor>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {string} memberId
     * @param {Contracts.QueryMembership} queryMembership
     * @return IPromise<Contracts.IdentityDescriptor[]>
     */
    readMembersOf(memberId: string, queryMembership?: Contracts.QueryMembership): IPromise<Contracts.IdentityDescriptor[]>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {Contracts.CreateScopeInfo} info
     * @param {string} scopeId
     * @return IPromise<Contracts.IdentityScope>
     */
    createScope(info: Contracts.CreateScopeInfo, scopeId: string): IPromise<Contracts.IdentityScope>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {string} scopeId
     * @return IPromise<void>
     */
    deleteScope(scopeId: string): IPromise<void>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {string} scopeId
     * @return IPromise<Contracts.IdentityScope>
     */
    getScopeById(scopeId: string): IPromise<Contracts.IdentityScope>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {string} scopeName
     * @return IPromise<Contracts.IdentityScope>
     */
    getScopeByName(scopeName: string): IPromise<Contracts.IdentityScope>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {Contracts.IdentityScope} renameScope
     * @param {string} scopeId
     * @return IPromise<void>
     */
    renameScope(renameScope: Contracts.IdentityScope, scopeId: string): IPromise<void>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @return IPromise<VSS_DelegatedAuthorization_Contracts.AccessTokenResult>
     */
    getSignoutToken(): IPromise<VSS_DelegatedAuthorization_Contracts.AccessTokenResult>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @param {string} tenantId
     * @return IPromise<Contracts.TenantInfo>
     */
    getTenant(tenantId: string): IPromise<Contracts.TenantInfo>;
}
export class IdentitiesHttpClient extends IdentitiesHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return IdentitiesHttpClient2_2
 */
export function getClient(): IdentitiesHttpClient2_2;
}
declare module "VSS/Licensing/Contracts" {
export enum AccountLicenseType {
    None = 0,
    EarlyAdopter = 1,
    Express = 2,
    Professional = 3,
    Advanced = 4,
    Stakeholder = 5,
}
export interface ClientRightsContainer {
    certificateBytes: number[];
    token: string;
}
export enum ExtensionFilterOptions {
    None = 1,
    Bundle = 2,
    AccountAssignment = 4,
    All = 7,
}
export enum ExtensionOperation {
    Assign = 0,
    Unassign = 1,
}
export enum LicensingSource {
    None = 0,
    Account = 1,
    Msdn = 2,
    Profile = 3,
    Auto = 4,
}
export enum MsdnLicenseType {
    None = 0,
    Eligible = 1,
    Professional = 2,
    Platforms = 3,
    TestProfessional = 4,
    Premium = 5,
    Ultimate = 6,
    Enterprise = 7,
}
export enum OperationResult {
    Success = 0,
    Warning = 1,
    Error = 2,
}
export enum VisualStudioOnlineServiceLevel {
    /**
     * No service rights. The user cannot access the account
     */
    None = 0,
    /**
     * Default or minimum service level
     */
    Express = 1,
    /**
     * Premium service level - either by purchasing on the Azure portal or by purchasing the appropriate MSDN subscription
     */
    Advanced = 2,
    /**
     * Only available to a specific set of MSDN Subscribers
     */
    AdvancedPlus = 3,
    /**
     * Stakeholder service level
     */
    Stakeholder = 4,
}
export var TypeInfo: {
    AccountLicenseType: {
        enumValues: {
            "none": number;
            "earlyAdopter": number;
            "express": number;
            "professional": number;
            "advanced": number;
            "stakeholder": number;
        };
    };
    ClientRightsContainer: {
        fields: any;
    };
    ExtensionFilterOptions: {
        enumValues: {
            "none": number;
            "bundle": number;
            "accountAssignment": number;
            "all": number;
        };
    };
    ExtensionOperation: {
        enumValues: {
            "assign": number;
            "unassign": number;
        };
    };
    LicensingSource: {
        enumValues: {
            "none": number;
            "account": number;
            "msdn": number;
            "profile": number;
            "auto": number;
        };
    };
    MsdnLicenseType: {
        enumValues: {
            "none": number;
            "eligible": number;
            "professional": number;
            "platforms": number;
            "testProfessional": number;
            "premium": number;
            "ultimate": number;
            "enterprise": number;
        };
    };
    OperationResult: {
        enumValues: {
            "success": number;
            "warning": number;
            "error": number;
        };
    };
    VisualStudioOnlineServiceLevel: {
        enumValues: {
            "none": number;
            "express": number;
            "advanced": number;
            "advancedPlus": number;
            "stakeholder": number;
        };
    };
};
}
declare module "VSS/Locations" {
import Contracts_Platform = require("VSS/Common/Contracts/Platform");
/**
* Options for generating content urls
*/
export interface ContentLocationOptions {
    /**
    * Unique id of the service to generate the url for
    */
    serviceInstanceId?: string;
    /**
    * Specific web context to use when generating the url
    */
    webContext?: Contracts_Platform.WebContext;
    /**
    * Host level to get the url of
    */
    hostType?: Contracts_Platform.ContextHostType;
    /**
    * Relative path to append to the url. This needs to be properly encoded by the consumer.
    */
    relativePath?: string;
    /**
    * Query parameters to add to the url
    */
    queryParams?: IDictionaryStringTo<string>;
}
/**
* Options for generating MVC urls
*/
export interface MvcRouteOptions {
    /**
    * Unique id of the service to generate the url for
    */
    serviceInstanceId?: string;
    /**
    * Specific web context to use when generating the url
    */
    webContext?: Contracts_Platform.WebContext;
    /**
    * Navigation level at which to generate the url (Deployment, Account, Collection, Project, Team)
    */
    level?: Contracts_Platform.NavigationContextLevels;
    /**
    * Route Area (e.g. "admin") or null/undefined for the default
    */
    area?: string;
    /**
    * MVC controller name
    */
    controller?: string;
    /**
    * Controller action
    */
    action?: string;
    /**
    * Array of parameters (path parts) to append to the path (after controller and action)
    */
    parameters?: string[];
    /**
    * Override the project in the web context
    */
    project?: string;
    /**
    * Override the team in the web context
    */
    team?: string;
    /**
    * Query parameters to add to the url
    */
    queryParams?: IDictionaryStringTo<string>;
}
/**
* Helper class for generating urls
*/
export class UrlHelper {
    private _areaPrefix;
    private _controllerPrefix;
    constructor(areaPrefix?: string, controllerPrefix?: string);
    /**
    * Get the url of particular content. If a service id is specified, its url needs to already be in the cached locations.
    *
    * @param options Url generation options
    * @return The generated url string
    */
    getContentUrl(options: ContentLocationOptions): string;
    /**
    * Get the url of a versioned _content file from the hosting page's service.
    *
    * @param contentFileName filename relative to "/_static/tfs/{Version}/_content/"
    * @param serviceInstanceTypeId The id of the service instance to generate the content url of
    * @return The generated url string
    */
    getVersionedContentUrl(contentFileName: string, serviceInstanceTypeId?: string): string;
    /**
    * Get the url of an MVC endpoint.
    *
    * @param options Url generation options
    * @return Promise which returns the generated url string
    */
    beginGetMvcUrl(options: MvcRouteOptions): IPromise<string>;
    /**
    * Get the url of an MVC endpoint. If a service id is specified, its url needs to already be in the cached locations.
    *
    * @param options Url generation options
    * @return The generated url string
    */
    getMvcUrl(options: MvcRouteOptions): string;
}
/**
* Url helper which provides methods for generating urls
*/
export var urlHelper: UrlHelper;
/**
* Get the url for the given service if its location has already been cached
*
* @param serviceInstanceId Unique id for the service
* @param hostType The host level to get the url for
* @param webContext The original context to get the url for
* @return Url if the location could be resolved
*/
export function getCachedServiceLocation(serviceInstanceId: string, hostType: Contracts_Platform.ContextHostType, webContext?: Contracts_Platform.WebContext): string;
/**
* Set the url for the given service and host type
*
* @param url The Url of the location to add
* @param serviceInstanceId Unique id for the service
* @param hostType The host level of the url
*/
export function addServiceLocation(url: string, serviceInstanceId: string, hostType: Contracts_Platform.ContextHostType): void;
/**
* Get the url for the given service
* @param serviceInstanceId Unique id for the service
* @param hostType The host level to get the url for
* @param webContext The original context to get the url for
* @param faultInMissingHost If true, attempt to fault in the target host if the location's service definition doesn't already exist.
* @return Promise that resolves to the location string
*/
export function beginGetServiceLocation(serviceInstanceId: string, hostType: Contracts_Platform.ContextHostType, webContext?: Contracts_Platform.WebContext, faultInMissingHost?: boolean): IPromise<string>;
}
declare module "VSS/Locations/Contracts" {
import VSS_Identities_Contracts = require("VSS/Identities/Contracts");
export interface AccessMapping {
    accessPoint: string;
    displayName: string;
    moniker: string;
    /**
     * Part of the access mapping which applies context after the access point of the server.
     */
    virtualDirectory: string;
}
/**
 * Data transfer class that holds information needed to set up a connection with a VSS server.
 */
export interface ConnectionData {
    /**
     * The Id of the authenticated user who made this request. More information about the user can be obtained by passing this Id to the Identity service
     */
    authenticatedUser: VSS_Identities_Contracts.Identity;
    /**
     * The Id of the authorized user who made this request. More information about the user can be obtained by passing this Id to the Identity service
     */
    authorizedUser: VSS_Identities_Contracts.Identity;
    /**
     * The instance id for this server.
     */
    instanceId: string;
    /**
     * The last user access for this instance.  Null if not requested specifically.
     */
    lastUserAccess: Date;
    /**
     * Data that the location service holds.
     */
    locationServiceData: LocationServiceData;
    /**
     * The virtual directory of the host we are talking to.
     */
    webApplicationRelativeDirectory: string;
}
export enum InheritLevel {
    None = 0,
    Deployment = 1,
    Account = 2,
    Collection = 4,
    All = 7,
}
export interface LocationMapping {
    accessMappingMoniker: string;
    location: string;
}
/**
 * Data transfer class used to transfer data about the location service data over the web service.
 */
export interface LocationServiceData {
    /**
     * Data about the access mappings contained by this location service.
     */
    accessMappings: AccessMapping[];
    /**
     * Data that the location service holds.
     */
    clientCacheFresh: boolean;
    /**
     * The time to live on the location service cache.
     */
    clientCacheTimeToLive: number;
    /**
     * The default access mapping moniker for the server.
     */
    defaultAccessMappingMoniker: string;
    /**
     * The obsolete id for the last change that took place on the server (use LastChangeId64).
     */
    lastChangeId: number;
    /**
     * The non-truncated 64-bit id for the last change that took place on the server.
     */
    lastChangeId64: number;
    /**
     * Data about the service definitions contained by this location service.
     */
    serviceDefinitions: ServiceDefinition[];
    /**
     * The identifier of the deployment which is hosting this location data (e.g. SPS, TFS, ELS, Napa, etc.)
     */
    serviceOwner: string;
}
export enum RelativeToSetting {
    Context = 0,
    WebApplication = 2,
    FullyQualified = 3,
}
export interface ServiceDefinition {
    description: string;
    displayName: string;
    identifier: string;
    inheritLevel: InheritLevel;
    locationMappings: LocationMapping[];
    /**
     * Maximum api version that this resource supports (current server version for this resource). Copied from ApiResourceLocation.
     */
    maxVersion: string;
    /**
     * Minimum api version that this resource supports. Copied from ApiResourceLocation.
     */
    minVersion: string;
    parentIdentifier: string;
    parentServiceType: string;
    properties: any;
    relativePath: string;
    relativeToSetting: RelativeToSetting;
    /**
     * The latest version of this resource location that is in "Release" (non-preview) mode. Copied from ApiResourceLocation.
     */
    releasedVersion: string;
    /**
     * The current resource version supported by this resource location. Copied from ApiResourceLocation.
     */
    resourceVersion: number;
    serviceType: string;
    status: ServiceStatus;
}
export enum ServiceStatus {
    Assigned = 0,
    Active = 1,
    Moving = 2,
}
export var TypeInfo: {
    AccessMapping: {
        fields: any;
    };
    ConnectionData: {
        fields: any;
    };
    InheritLevel: {
        enumValues: {
            "none": number;
            "deployment": number;
            "account": number;
            "collection": number;
            "all": number;
        };
    };
    LocationMapping: {
        fields: any;
    };
    LocationServiceData: {
        fields: any;
    };
    RelativeToSetting: {
        enumValues: {
            "context": number;
            "webApplication": number;
            "fullyQualified": number;
        };
    };
    ServiceDefinition: {
        fields: any;
    };
    ServiceStatus: {
        enumValues: {
            "assigned": number;
            "active": number;
            "moving": number;
        };
    };
};
}
declare module "VSS/Locations/RestClient" {
import Contracts = require("VSS/Locations/Contracts");
import VSS_Common_Contracts = require("VSS/WebApi/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class LocationsHttpClient3 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API] This was copied and adapted from TeamFoundationConnectionService.Connect()
     *
     * @param {VSS_Common_Contracts.ConnectOptions} connectOptions
     * @param {number} lastChangeId - Obsolete 32-bit LastChangeId
     * @param {number} lastChangeId64 - Non-truncated 64-bit LastChangeId
     * @return IPromise<Contracts.ConnectionData>
     */
    getConnectionData(connectOptions?: VSS_Common_Contracts.ConnectOptions, lastChangeId?: number, lastChangeId64?: number): IPromise<Contracts.ConnectionData>;
    /**
     * [Preview API]
     *
     * @param {string} serviceType
     * @param {string} identifier
     * @return IPromise<void>
     */
    deleteServiceDefinition(serviceType: string, identifier: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} serviceType
     * @param {string} identifier
     * @return IPromise<Contracts.ServiceDefinition>
     */
    getServiceDefinition(serviceType: string, identifier: string): IPromise<Contracts.ServiceDefinition>;
    /**
     * [Preview API]
     *
     * @param {string} serviceType
     * @return IPromise<Contracts.ServiceDefinition[]>
     */
    getServiceDefinitions(serviceType?: string): IPromise<Contracts.ServiceDefinition[]>;
    /**
     * [Preview API]
     *
     * @param {VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.ServiceDefinition[]>} serviceDefinitions
     * @return IPromise<void>
     */
    updateServiceDefinitions(serviceDefinitions: VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.ServiceDefinition[]>): IPromise<void>;
}
/**
 * @exemptedapi
 */
export class LocationsHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API] This was copied and adapted from TeamFoundationConnectionService.Connect()
     *
     * @param {VSS_Common_Contracts.ConnectOptions} connectOptions
     * @param {number} lastChangeId - Obsolete 32-bit LastChangeId
     * @param {number} lastChangeId64 - Non-truncated 64-bit LastChangeId
     * @return IPromise<Contracts.ConnectionData>
     */
    getConnectionData(connectOptions?: VSS_Common_Contracts.ConnectOptions, lastChangeId?: number, lastChangeId64?: number): IPromise<Contracts.ConnectionData>;
    /**
     * [Preview API]
     *
     * @param {string} serviceType
     * @param {string} identifier
     * @return IPromise<void>
     */
    deleteServiceDefinition(serviceType: string, identifier: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} serviceType
     * @param {string} identifier
     * @return IPromise<Contracts.ServiceDefinition>
     */
    getServiceDefinition(serviceType: string, identifier: string): IPromise<Contracts.ServiceDefinition>;
    /**
     * [Preview API]
     *
     * @param {string} serviceType
     * @return IPromise<Contracts.ServiceDefinition[]>
     */
    getServiceDefinitions(serviceType?: string): IPromise<Contracts.ServiceDefinition[]>;
    /**
     * [Preview API]
     *
     * @param {VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.ServiceDefinition[]>} serviceDefinitions
     * @return IPromise<void>
     */
    updateServiceDefinitions(serviceDefinitions: VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.ServiceDefinition[]>): IPromise<void>;
}
export class LocationsHttpClient extends LocationsHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
}
declare module "VSS/Navigation/Services" {
import Service = require("VSS/Service");
/**
* Local service to manage history and navigation state
*/
export class HistoryService implements Service.ILocalService {
    private _namedEvents;
    private _usePushState;
    private _suppressNavigate;
    private _initialized;
    private _lastNavigatedHashString;
    private _lastNavigatedQueryString;
    private _ignoreQueryString;
    constructor();
    /**
    * Gets the serialized version of the current navigation state.
    */
    getCurrentFragment(): string;
    /**
    * Gets the current url's hash string
    */
    getCurrentHashString(): string;
    /**
    * Gets the current url's query string
    */
    getCurrentQueryString(): string;
    /**
     * Creates a fragment url to be used in flight navigation.
     * This always returns a fragment link, regardless of the browser's capability to handle push state.
     *
     * @param action The action name
     * @param data Action parameters
     * @return fragment URL in the form of #_a=[action]&routevalue1=routevalue2...
     */
    getFragmentActionLink(action: string, data?: any): string;
    /**
    * Get the current navigation state dictionary. Uses query parameters and hash parameters.
    */
    getCurrentState(): any;
    /**
    * Replace the current history entry with the given state.
    * The back button will therefore not map to the current url (at the time this call is made), but rather to the previous history entry.
    *
    * @param action The "action" state parameter. This is the _a key in the url or "action" in the current state dictionary
    * @param data The new full set of navigation/history entries. This set completely replaces the current set.
    * @param windowTitle The new window title. A null or empty value indicates to leave the title unchanged.
    * @param suppressNavigate If true, don't trigger any of the attached navigate event handlers due to this update.
    */
    replaceHistoryPoint(action: string, data: any, windowTitle?: string, suppressNavigate?: boolean): void;
    /**
    * Add a new history entry with the given state. Merges data with the current navigation data.
    *
    * @param action The "action" state parameter. This is the _a key in the url or "action" in the current state dictionary
    * @param data New history entries to merge into the current navigation data. Set keys to null/undefined to remove them from the current state.
    * @param windowTitle The new window title. A null or empty value indicates to leave the title unchanged.
    * @param suppressNavigate If true, don't trigger any of the attached navigate event handlers due to this update.
    */
    addHistoryPoint(action: string, data?: any, windowTitle?: string, suppressNavigate?: boolean): void;
    /**
    * Update the current history entry
    *
    * @param action The "action" state parameter. This is the _a key in the url or "action" in the current state dictionary
    * @param data The history entry's new state key/value pairs
    * @param replaceHistoryEntry If true, replace the current history entry. Otherwise, add a new history entry.
    * @param mergeWithCurrentState If true, the supplied data just modify the existing/current state. If false, they replace all existing key/value pairs.
    * @param windowTitle The new window title. A null or empty value indicates to leave the title unchanged.
    * @param suppressNavigate If true, don't trigger any of the attached navigate event handlers due to this update.
    */
    updateHistoryEntry(action: string, data?: IDictionaryStringTo<any>, replaceHistoryEntry?: boolean, mergeWithCurrentState?: boolean, windowTitle?: string, suppressNavigate?: boolean): void;
    /**
    * Serialize a navigation data lookup into a string that can be used as a hash or query string.
    *
    * @param state The navigation state dictionary to convert
    */
    static serializeState(state: IDictionaryStringTo<any>): string;
    /**
    * Deserialize a navigation state string into a navigation data lookup.
    *
    * @param state The serialized navigation state string (hash or query string)
    */
    static deserializeState(state: string): IDictionaryStringTo<any>;
    /**
    * Attach a new navigate handler
    *
    * @param handler The method called whenever a navigation event occurs
    * @param checkCurrentState If true, immediately invoke the handler
    */
    attachNavigate(handler: IFunctionPPR<any, any, void>, checkCurrentState?: boolean): void;
    /**
    * Attach a new navigate handler
    *
    * @param action The action that the handler applies to
    * @param handler The method called whenever a navigation event occurs with the matching action value
    * @param checkCurrentState If true, immediately invoke the handler if the current state is appropriate (has the matching action value)
    */
    attachNavigate(action: string, handler: IFunctionPPR<any, any, void>, checkCurrentState?: boolean): void;
    /**
    * Remove a navigate handler
    *
    * @param handler The global navigate handler method to remove
    */
    detachNavigate(handler: IFunctionPPR<any, any, void>): void;
    /**
    * Remove a navigate handler
    *
    * @param action The action that the handler applies to
    * @param handler The method called whenever a navigation event occurs with the matching action value
    */
    detachNavigate(action: string, handler?: IFunctionPPR<any, any, void>): void;
    private _moveHashStateToQueryParams();
    private _onHashChanged(e);
    private _onPopState(e);
    private _onNavigate();
    private _setLastNavigateState();
}
/**
* Gets the instance of the local History service
*/
export function getHistoryService(): HistoryService;
}
declare module "VSS/Operations/Contracts" {
/**
 * Represents an async operation and its progress or result information.
 */
export interface Operation extends OperationReference {
    /**
     * The links to other objects related to this object.
     */
    _links: any;
    /**
     * The result message which is generally not set.
     */
    resultMessage: string;
}
/**
 * Reference for an async operation.
 */
export interface OperationReference {
    /**
     * The identifier for this operation.
     */
    id: string;
    /**
     * The current status of the operation.
     */
    status: OperationStatus;
    /**
     * Url to get the full object.
     */
    url: string;
}
export enum OperationStatus {
    /**
     * The operation object does not have the status set.
     */
    NotSet = 0,
    /**
     * The operation has been queued.
     */
    Queued = 1,
    /**
     * The operation is in progress.
     */
    InProgress = 2,
    /**
     * The operation was cancelled by the user.
     */
    Cancelled = 3,
    /**
     * The operation completed successfully.
     */
    Succeeded = 4,
    /**
     * The operation completed with a failure.
     */
    Failed = 5,
}
export var TypeInfo: {
    Operation: {
        fields: any;
    };
    OperationReference: {
        fields: any;
    };
    OperationStatus: {
        enumValues: {
            "notSet": number;
            "queued": number;
            "inProgress": number;
            "cancelled": number;
            "succeeded": number;
            "failed": number;
        };
    };
};
}
declare module "VSS/Operations/RestClient" {
import Contracts = require("VSS/Operations/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class OperationsHttpClient3 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API] Gets an operation from the the Id.
     *
     * @param {string} operationId - The id for the operation.
     * @return IPromise<Contracts.Operation>
     */
    getOperation(operationId: string): IPromise<Contracts.Operation>;
}
export class OperationsHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * Gets an operation from the the Id.
     *
     * @param {string} operationId - The id for the operation.
     * @return IPromise<Contracts.Operation>
     */
    getOperation(operationId: string): IPromise<Contracts.Operation>;
}
export class OperationsHttpClient extends OperationsHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return OperationsHttpClient2_2
 */
export function getClient(): OperationsHttpClient2_2;
}
declare module "VSS/Organization/CollectionRestClient" {
import VSS_Organization_Contracts = require("VSS/Organization/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class CollectionHttpClient3 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {VSS_Organization_Contracts.CollectionCreationContext} creationContext
     * @return IPromise<VSS_Organization_Contracts.Collection>
     */
    createCollection(creationContext: VSS_Organization_Contracts.CollectionCreationContext): IPromise<VSS_Organization_Contracts.Collection>;
    /**
     * [Preview API]
     *
     * @param {string} collectionId
     * @param {VSS_Organization_Contracts.CollectionSearchKind} searchKind
     * @return IPromise<VSS_Organization_Contracts.Collection>
     */
    getCollection(collectionId: string, searchKind: VSS_Organization_Contracts.CollectionSearchKind): IPromise<VSS_Organization_Contracts.Collection>;
    /**
     * [Preview API]
     *
     * @param {VSS_Organization_Contracts.Collection} collection
     * @param {string} collectionId
     * @param {VSS_Organization_Contracts.CollectionSearchKind} searchKind
     * @return IPromise<VSS_Organization_Contracts.Collection>
     */
    updateCollection(collection: VSS_Organization_Contracts.Collection, collectionId: string, searchKind: VSS_Organization_Contracts.CollectionSearchKind): IPromise<VSS_Organization_Contracts.Collection>;
}
/**
 * @exemptedapi
 */
export class CollectionHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {VSS_Organization_Contracts.CollectionCreationContext} creationContext
     * @return IPromise<VSS_Organization_Contracts.Collection>
     */
    createCollection(creationContext: VSS_Organization_Contracts.CollectionCreationContext): IPromise<VSS_Organization_Contracts.Collection>;
    /**
     * [Preview API]
     *
     * @param {string} collectionId
     * @param {VSS_Organization_Contracts.CollectionSearchKind} searchKind
     * @return IPromise<VSS_Organization_Contracts.Collection>
     */
    getCollection(collectionId: string, searchKind: VSS_Organization_Contracts.CollectionSearchKind): IPromise<VSS_Organization_Contracts.Collection>;
    /**
     * [Preview API]
     *
     * @param {VSS_Organization_Contracts.Collection} collection
     * @param {string} collectionId
     * @param {VSS_Organization_Contracts.CollectionSearchKind} searchKind
     * @return IPromise<VSS_Organization_Contracts.Collection>
     */
    updateCollection(collection: VSS_Organization_Contracts.Collection, collectionId: string, searchKind: VSS_Organization_Contracts.CollectionSearchKind): IPromise<VSS_Organization_Contracts.Collection>;
}
export class CollectionHttpClient extends CollectionHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return CollectionHttpClient2_2
 */
export function getClient(): CollectionHttpClient2_2;
}
declare module "VSS/Organization/Contracts" {
export interface Collection {
    /**
     * Unique identifier for a collection
     */
    id: string;
    /**
     * The globally unqiue name of the collection
     */
    name: string;
}
export interface CollectionCreationContext {
    data: {
        [key: string]: any;
    };
    name: string;
}
export interface CollectionQueryContext {
    searchKind: CollectionSearchKind;
    searchValue: string;
}
export interface CollectionRef {
    /**
     * Identifier for a collection under an organization
     */
    id: string;
    /**
     * The unqiue name of collection under an organziation
     */
    name: string;
}
export enum CollectionSearchKind {
    Unknown = 0,
    ById = 1,
    ByName = 2,
}
export interface Organization {
    collections: CollectionRef[];
    dataCreated: Date;
    /**
     * Identifier for an Organization
     */
    id: string;
    lastUpdated: Date;
    /**
     * The globally unqiue name of the organziation
     */
    name: string;
    type: OrganizationType;
}
export interface OrganizationCreationContext {
    creatorId: string;
    name: string;
    primaryCollection: CollectionCreationContext;
}
export interface OrganizationQueryContext {
    searchKind: OrganizationSearchKind;
    searchValue: string;
}
export enum OrganizationSearchKind {
    Unknown = 0,
    ById = 1,
    ByName = 2,
}
export enum OrganizationType {
    Unknown = 0,
    Personal = 1,
    Work = 2,
}
export var TypeInfo: {
    Collection: {
        fields: any;
    };
    CollectionCreationContext: {
        fields: any;
    };
    CollectionQueryContext: {
        fields: any;
    };
    CollectionRef: {
        fields: any;
    };
    CollectionSearchKind: {
        enumValues: {
            "unknown": number;
            "byId": number;
            "byName": number;
        };
    };
    Organization: {
        fields: any;
    };
    OrganizationCreationContext: {
        fields: any;
    };
    OrganizationQueryContext: {
        fields: any;
    };
    OrganizationSearchKind: {
        enumValues: {
            "unknown": number;
            "byId": number;
            "byName": number;
        };
    };
    OrganizationType: {
        enumValues: {
            "unknown": number;
            "personal": number;
            "work": number;
        };
    };
};
}
declare module "VSS/Organization/OrganizationRestClient" {
import Contracts = require("VSS/Organization/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class OrganizationHttpClient3 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {Contracts.OrganizationCreationContext} creationContext
     * @return IPromise<Contracts.Organization>
     */
    createOrganization(creationContext: Contracts.OrganizationCreationContext): IPromise<Contracts.Organization>;
    /**
     * [Preview API]
     *
     * @param {string} organizationId
     * @param {Contracts.OrganizationSearchKind} searchKind
     * @return IPromise<Contracts.Organization>
     */
    getOrganization(organizationId: string, searchKind: Contracts.OrganizationSearchKind): IPromise<Contracts.Organization>;
    /**
     * [Preview API]
     *
     * @param {Contracts.Organization} organization
     * @param {string} organizationId
     * @param {Contracts.OrganizationSearchKind} searchKind
     * @return IPromise<Contracts.Organization>
     */
    updateOrganization(organization: Contracts.Organization, organizationId: string, searchKind: Contracts.OrganizationSearchKind): IPromise<Contracts.Organization>;
}
/**
 * @exemptedapi
 */
export class OrganizationHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {Contracts.OrganizationCreationContext} creationContext
     * @return IPromise<Contracts.Organization>
     */
    createOrganization(creationContext: Contracts.OrganizationCreationContext): IPromise<Contracts.Organization>;
    /**
     * [Preview API]
     *
     * @param {string} organizationId
     * @param {Contracts.OrganizationSearchKind} searchKind
     * @return IPromise<Contracts.Organization>
     */
    getOrganization(organizationId: string, searchKind: Contracts.OrganizationSearchKind): IPromise<Contracts.Organization>;
    /**
     * [Preview API]
     *
     * @param {Contracts.Organization} organization
     * @param {string} organizationId
     * @param {Contracts.OrganizationSearchKind} searchKind
     * @return IPromise<Contracts.Organization>
     */
    updateOrganization(organization: Contracts.Organization, organizationId: string, searchKind: Contracts.OrganizationSearchKind): IPromise<Contracts.Organization>;
}
export class OrganizationHttpClient extends OrganizationHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return OrganizationHttpClient2_2
 */
export function getClient(): OrganizationHttpClient2_2;
}
declare module "VSS/Performance" {
import Telemetry = require("VSS/Telemetry/Services");
/** Gets scenario manager instance */
export function getScenarioManager(): IScenarioManager;
/** DO NOT USE: Only exported for unit testing */
export function _createScenarioManagerForTesting(): IScenarioManager;
/** Scenario management */
export interface IScenarioManager {
    /**
     * Start new scenario
     * @param area Feature area of scenario.
     * @param name Name of scenario.
     * @param startTime Optional: Scenario start time. IMPORTANT: Has to be obtained using getTimestamp
     * @param isPageInteractive Optional: Whether or not the scenario is the primary one for the page, indicating whether or not hte page is yet interactive (TTI)
     *
     * @returns Scenario descriptor
     */
    startScenario(featureArea: string, name: string, startTime?: number, isPageInteractive?: boolean): IScenarioDescriptor;
    /**
     * End scenario if it's currently active
     * @param area Feature area of scenario.
     * @param name Name of scenario.
     */
    endScenario(featureArea: string, name: string): void;
    /**
     * Abort scenario if it's currently active. Use this when a scenario that has started hit an error condition and you want to abort performance tracking for the scenario.
     * @param area Feature area of scenario.
     * @param name Name of scenario.
     */
    abortScenario(featureArea: string, name: string): void;
    /**
     * Start new scenario beginning at the browser's navigationStart event
     * @param area Feature area name for CI event.
     * @param name Name of scenario.
     * @param isPageInteractive Optional: Whether or not the scenario is the primary one for the page, indicating whether or not hte page is yet interactive (TTI)
     *
     * @returns Scenario descriptor
     */
    startScenarioFromNavigation(featureArea: string, name: string, isPageInteractive?: boolean): IScenarioDescriptor;
    /**
     * Get active scenarios with given area/name
     * @param area Feature area of scenario.
     * @param name Name of scenario.
     */
    getScenarios(featureArea: string, name: string): IScenarioDescriptor[];
    /**
     * Insert split timing for all currently active scenarios
     * @param splitName Name of split timing
     */
    split(splitName: string): void;
}
/** Describes split timing within scenarios */
export interface ISplitTiming {
    /** Name of split timing */
    name: string;
    /** Time relative to scenario start */
    timestamp: number;
    /** Deprecated: Elapsed time for split timing. */
    elapsedTime?: number;
}
/** Describes single scenario */
export interface IScenarioDescriptor {
    /** Returns a value indicating whether the scenario is active */
    isActive(): boolean;
    /**
    * Determines whether or not the scenario is the primary indicator
    * of Time-to-Interactive on the page
    */
    isPageInteractive(): boolean;
    /** Returns scenario area */
    getFeatureArea(): string;
    /** Returns scenario name */
    getName(): string;
    /** Returns scenario duration in ms */
    getDuration(): number;
    /** Returns scenario's correlation id */
    getCorrelationId(): string;
    /** Return split timings */
    getSplitTimings(): ISplitTiming[];
    /** Return the data associated with the scenario */
    getData(): any;
    /** Ends this scenario
     * @param endTime Optional Scenario End Time. IMPORTANT: Has to be obtained using getTimestamp
     */
    end(endTime?: number): void;
    /** Aborts this scenario */
    abort(): void;
    /**
     * Add split timing at current timestamp
     * @param name Name of split timing
     * @param elapsedTime Optional: Deprecated: Store elapsed time in addition to split
     */
    addSplitTiming(name: string, elapsedTime?: number): any;
    /**
     * Add additional data to the scenario.
     * @param data Property bag of additional data
     */
    addData(data: any): void;
    /**
     * Logs scenario data to the browser's console
     */
    log(): void;
    /** Returns telemetry data for scenario */
    getTelemetry(): Telemetry.TelemetryEventData;
}
export function getTimestamp(): number;
/**
 * Returns navigation start timestamp, or 0 if browser doesn't support it
 */
export function getNavigationStartTimestamp(): number;
export function getJsonIslandDataProviderTiming(): IDictionaryStringTo<number>;
export function getJsonIslandServerTiming(): IDictionaryStringTo<WebPerformanceTimingGroup[]>;
}
declare module "VSS/Profile/Contracts" {
export interface AttributeDescriptor {
    attributeName: string;
    containerName: string;
}
export interface AttributesContainer {
    attributes: {
        [key: string]: ProfileAttribute;
    };
    containerName: string;
    revision: number;
}
export enum AttributesScope {
    Core = 1,
    Application = 2,
}
export interface Avatar {
    isAutoGenerated: boolean;
    size: AvatarSize;
    timeStamp: Date;
    value: number[];
}
export enum AvatarSize {
    Small = 0,
    Medium = 1,
    Large = 2,
}
export interface CoreProfileAttribute extends ProfileAttributeBase<any> {
}
export enum CoreProfileAttributes {
    Minimal = 0,
    Email = 1,
    Avatar = 2,
    DisplayName = 4,
    All = 65535,
}
export interface Country {
    code: string;
    englishName: string;
}
export interface CreateProfileContext {
    cIData: {
        [key: string]: any;
    };
    contactWithOffers: boolean;
    countryName: string;
    displayName: string;
    emailAddress: string;
    language: string;
}
export interface GeoRegion {
    regionCode: string;
}
export interface Profile {
    applicationContainer: AttributesContainer;
    coreAttributes: {
        [key: string]: CoreProfileAttribute;
    };
    coreRevision: number;
    id: string;
    revision: number;
    timeStamp: Date;
}
export interface ProfileAttribute extends ProfileAttributeBase<string> {
}
export interface ProfileAttributeBase<T> {
    descriptor: AttributeDescriptor;
    revision: number;
    timeStamp: Date;
    value: T;
}
export enum ProfilePageType {
    Update = 0,
    Create = 1,
    CreateIDE = 2,
    Review = 3,
    AvatarImageFormat = 4,
}
export enum ProfilePropertyType {
    DisplayName = 0,
    EmailAddress = 1,
    PublicAlias = 2,
    Country = 3,
}
/**
 * Country/region information
 */
export interface ProfileRegion {
    /**
     * The two-letter code defined in ISO 3166 for the country/region.
     */
    code: string;
    /**
     * Localized country/region name
     */
    name: string;
}
/**
 * Container of country/region information
 */
export interface ProfileRegions {
    /**
     * List of country/region code with contact consent requirement type of notice
     */
    noticeContactConsentRequirementRegions: string[];
    /**
     * List of country/region code with contact consent requirement type of opt-out
     */
    optOutContactConsentRequirementRegions: string[];
    /**
     * List of country/regions
     */
    regions: ProfileRegion[];
}
export interface ProfileTermsOfService {
    activatedDate: Date;
    id: string;
    lastModified: Date;
    termsOfServiceUrl: string;
    version: number;
}
export interface UserTermsOfService {
    currentAcceptedTermsOfService: number;
    currentAcceptedTermsOfServiceDate: Date;
    latestTermsOfService: ProfileTermsOfService;
}
export interface VerifyPreferredEmailContext {
    emailAddress: string;
    hashCode: string;
    id: string;
}
export var TypeInfo: {
    AttributeDescriptor: {
        fields: any;
    };
    AttributesContainer: {
        fields: any;
    };
    AttributesScope: {
        enumValues: {
            "core": number;
            "application": number;
        };
    };
    Avatar: {
        fields: any;
    };
    AvatarSize: {
        enumValues: {
            "small": number;
            "medium": number;
            "large": number;
        };
    };
    CoreProfileAttribute: {
        fields: any;
    };
    CoreProfileAttributes: {
        enumValues: {
            "minimal": number;
            "email": number;
            "avatar": number;
            "displayName": number;
            "all": number;
        };
    };
    Country: {
        fields: any;
    };
    CreateProfileContext: {
        fields: any;
    };
    GeoRegion: {
        fields: any;
    };
    Profile: {
        fields: any;
    };
    ProfileAttribute: {
        fields: any;
    };
    ProfileAttributeBase: {
        fields: any;
    };
    ProfilePageType: {
        enumValues: {
            "update": number;
            "create": number;
            "createIDE": number;
            "review": number;
            "avatarImageFormat": number;
        };
    };
    ProfilePropertyType: {
        enumValues: {
            "displayName": number;
            "emailAddress": number;
            "publicAlias": number;
            "country": number;
        };
    };
    ProfileRegion: {
        fields: any;
    };
    ProfileRegions: {
        fields: any;
    };
    ProfileTermsOfService: {
        fields: any;
    };
    UserTermsOfService: {
        fields: any;
    };
    VerifyPreferredEmailContext: {
        fields: any;
    };
};
}
declare module "VSS/Profile/Metrics" {
import Q = require("q");
import Telemetry_RestClient = require("VSS/Telemetry/RestClient");
import Telemetry_Services = require("VSS/Telemetry/Services");
/**
 * Service used to report telemetry via CI events and app insights, derived from VSS/Telemetry/Services
 * @remark export for testing only, do not use it externally
 */
export class TelemetryAsyncHelper {
    private static DelayMs;
    private items;
    private client;
    private queue;
    private pending;
    constructor(client?: Telemetry_RestClient.CustomerIntelligenceHttpClient);
    private queueEvent(eventData);
    /**
     * @param eventData
     * @param publishImmediately flush all currently queueed events and publish them immediately
     */
    publish(eventData: Telemetry_Services.TelemetryEventData, publishImmediately?: boolean): Q.Promise<void>;
    private publishEvents();
}
export interface MetricsEvent {
    setValue<T>(key: string, value: T): any;
    close(): Q.Promise<void>;
    inner(feature: string): MetricsEvent;
}
/**
 * Base metrics event
 * @remarks Should be abstract when compiler supports
 */
export class BaseMetricsEvent<T extends MetricsEvent> implements MetricsEvent {
    protected isClosed: boolean;
    protected area: string;
    protected feature: string;
    protected properties: IDictionaryStringTo<any>;
    protected publishOnClose: boolean;
    private children;
    /**
     * Creates a MetricsEvent with specified area and feature
     */
    constructor(area: string, feature: string, publishOnClose: boolean);
    /**
     * Set value for a metric field
     */
    setValue<T>(key: string, value: T): any;
    /**
     * Publishes data to telemetry services
     * To be overriden for specific implementations
     * @remarks Should be abstract when compiler supports
     */
    protected closeThis(): Q.Promise<void>;
    /**
     * Marks a MetricsEvent project as closed, once it is closed, it will not be updated with any new values
     * invokes closeThis for specific implementations.
     */
    close(): Q.Promise<void>;
    /**
     * Create inner metrics by prefixing the keys with innerFeature
     * @remarks Should be abstract when compiler supports, must be overriden
     */
    protected newInnerMetrics(feature: string): T;
    inner(feature: string): T;
}
/**
 * Provides an easy-to-use tracking object for sending customer intelligence telemetries
 */
export class IntervalMetricsEvent extends BaseMetricsEvent<IntervalMetricsEvent> {
    protected startTime: number;
    protected elapsedTime: number;
    /**
     * Set startTime for this metrics event to Date.now()
     * @return set startTime
     */
    begin(): number;
    /**
     * Set elapsedTime if the start timestamp has been set by Date.now() - startTime
     * @return set elapsedTime
     */
    end(): number;
    /**
     * Publishes data to telemetry services
     * To be overriden for specific implementations
     */
    protected closeThis(): Q.Promise<void>;
    /**
     * Create inner metrics by prefixing the keys with innerFeature
     */
    protected newInnerMetrics(innerFeature: string): IntervalMetricsEvent;
}
export class InstantMetricsEvent extends BaseMetricsEvent<MetricsEvent> {
    /**
     * Publishes data to telemetry services
     * To be overriden for specific implementations
     */
    protected closeThis(): Q.Promise<void>;
    /**
     * Create inner metrics by prefixing the keys with innerFeature
     */
    newInnerMetrics(innerFeature: string): MetricsEvent;
}
/**
 * Metrics event that does nothing
 */
export class NullMetricsEvent implements MetricsEvent {
    setValue<T>(key: string, value: T): void;
    close(): Q.Promise<void>;
    inner(feature: string): MetricsEvent;
}
/**
 * Interval metrics event that does nothing
 */
export class NullIntervalMetricsEvent extends IntervalMetricsEvent {
    constructor();
    begin(): number;
    end(): number;
    setValue<T>(key: string, value: T): void;
    close(): Q.Promise<void>;
    inner(): NullIntervalMetricsEvent;
}
/**
 * Convenient metrics event object that does nothing
 */
export var nullMetrics: NullMetricsEvent;
export var nullIntervalMetrics: NullIntervalMetricsEvent;
/**
 * Create auto metered async action with StartTime and ElapsedTime automatially set for a new metrics
 * @param action
 * @param metricsArea
 * @param metricsFeature
 */
export function meterAsyncAction<T>(action: (metrics: IntervalMetricsEvent) => Q.Promise<T>, metricsArea: string, metricsFeature: string, metricsPublishOnClose: boolean): Q.Promise<T>;
/**
 * Create auto metered async action with StartTime and ElapsedTime automatially set for a new inner metrics
 * @param action
 * @param parentMetrics
 * @param innerFeature
 */
export function meterAsyncActionInner<T>(action: (metrics: MetricsEvent) => Q.Promise<T>, parentMetrics: IntervalMetricsEvent, innerFeature: string): Q.Promise<T>;
/**
 * Publish all metrics immediately
 */
export function publishAllImmediately(): Q.Promise<void>;
/**
 * Wrapped async action with metrics automatically logged for beginning and end
 * Change to abstract class when using ts-api-checker supports it
 */
export class MeteredAsyncAction<T> {
    private parentMetrics;
    private feature;
    /**
     * Create metered async action
     * @param metrics parent metrics to put the metrics of this enaction into.
     */
    constructor(metrics?: IntervalMetricsEvent, feature?: string);
    /**
     * Creates metrics to be consumed, no direct passing metrics object from outside of the class, so the metrics lives only in the scope of this class
     * Creates child metrics if parent metrics and feature are specified
     * Override with method returning arbitrary IntervalMetricsEvent
     */
    protected createMetrics(): IntervalMetricsEvent;
    /**
     * Action implementation
     * Abstract method, must be overriden
     * @param metrics
     */
    protected action(metrics: MetricsEvent): Q.Promise<T>;
    /**
     * Enact action
     */
    enact(): Q.Promise<T>;
}
}
declare module "VSS/Profile/RestClient" {
import Contracts = require("VSS/Profile/Contracts");
import VSS_Common_Contracts = require("VSS/WebApi/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class ProfileHttpClient3 extends VSS_WebApi.VssHttpClient {
    static serviceInstanceId: string;
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {string} id
     * @param {string} descriptor
     * @return IPromise<void>
     */
    deleteProfileAttribute(id: string, descriptor: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} id
     * @param {string} descriptor
     * @return IPromise<Contracts.ProfileAttribute>
     */
    getProfileAttribute(id: string, descriptor: string): IPromise<Contracts.ProfileAttribute>;
    /**
     * [Preview API]
     *
     * @param {any} container
     * @param {string} id
     * @param {string} descriptor
     * @return IPromise<void>
     */
    setProfileAttribute(container: any, id: string, descriptor: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.ProfileAttributeBase<any>[]>} attributesCollection
     * @param {string} id
     * @return IPromise<void>
     */
    setProfileAttributes(attributesCollection: VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.ProfileAttributeBase<any>[]>, id: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string} id
     * @param {string} size
     * @param {string} format
     * @return IPromise<Contracts.Avatar>
     */
    getAvatar(id: string, size?: string, format?: string): IPromise<Contracts.Avatar>;
    /**
     * [Preview API]
     *
     * @param {string} id
     * @return IPromise<void>
     */
    resetAvatar(id: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {any} container
     * @param {string} id
     * @return IPromise<void>
     */
    setAvatar(container: any, id: string): IPromise<void>;
    /**
     * [Preview API] Lookup up country/region based on provided IPv4, null if using the remote IPv4 address.
     *
     * @param {string} ipaddress - IPv4 address to be used for reverse lookup, null if using RemoteIPAddress in request context
     * @return IPromise<Contracts.GeoRegion>
     */
    getGeoRegion(ipaddress: string): IPromise<Contracts.GeoRegion>;
    /**
     * [Preview API] Create profile
     *
     * @param {Contracts.CreateProfileContext} createProfileContext - Context for profile creation
     * @return IPromise<Contracts.Profile>
     */
    createProfile(createProfileContext: Contracts.CreateProfileContext): IPromise<Contracts.Profile>;
    /**
     * [Preview API]
     *
     * @param {string} id
     * @param {boolean} details
     * @param {boolean} withAttributes
     * @param {string} partition
     * @param {string} coreAttributes
     * @return IPromise<Contracts.Profile>
     */
    getProfile(id: string, details?: boolean, withAttributes?: boolean, partition?: string, coreAttributes?: string): IPromise<Contracts.Profile>;
    /**
     * [Preview API] Update profile
     *
     * @param {Contracts.Profile} profile - Update profile
     * @param {string} id - Profile ID
     * @return IPromise<void>
     */
    updateProfile(profile: Contracts.Profile, id: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @return IPromise<Contracts.ProfileRegions>
     */
    getRegions(): IPromise<Contracts.ProfileRegions>;
    /**
     * [Preview API]
     *
     * @return IPromise<string[]>
     */
    getSupportedLcids(): IPromise<string[]>;
}
export class ProfileHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    static serviceInstanceId: string;
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * @param {string} id
     * @param {string} descriptor
     * @return IPromise<void>
     */
    deleteProfileAttribute(id: string, descriptor: string): IPromise<void>;
    /**
     * @param {string} id
     * @param {string} descriptor
     * @return IPromise<Contracts.ProfileAttribute>
     */
    getProfileAttribute(id: string, descriptor: string): IPromise<Contracts.ProfileAttribute>;
    /**
     * @param {any} container
     * @param {string} id
     * @param {string} descriptor
     * @return IPromise<void>
     */
    setProfileAttribute(container: any, id: string, descriptor: string): IPromise<void>;
    /**
     * @param {VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.ProfileAttributeBase<any>[]>} attributesCollection
     * @param {string} id
     * @return IPromise<void>
     */
    setProfileAttributes(attributesCollection: VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.ProfileAttributeBase<any>[]>, id: string): IPromise<void>;
    /**
     * @param {string} id
     * @param {string} size
     * @param {string} format
     * @return IPromise<Contracts.Avatar>
     */
    getAvatar(id: string, size?: string, format?: string): IPromise<Contracts.Avatar>;
    /**
     * @param {string} id
     * @return IPromise<void>
     */
    resetAvatar(id: string): IPromise<void>;
    /**
     * @param {any} container
     * @param {string} id
     * @return IPromise<void>
     */
    setAvatar(container: any, id: string): IPromise<void>;
    /**
     * @return IPromise<Contracts.Country[]>
     */
    getCountries(): IPromise<Contracts.Country[]>;
    /**
     * Lookup up country/region based on provided IPv4, null if using the remote IPv4 address.
     *
     * @param {string} ipaddress - IPv4 address to be used for reverse lookup, null if using RemoteIPAddress in request context
     * @return IPromise<Contracts.GeoRegion>
     */
    getGeoRegion(ipaddress: string): IPromise<Contracts.GeoRegion>;
    /**
     * Create profile
     *
     * @param {Contracts.CreateProfileContext} createProfileContext - Context for profile creation
     * @return IPromise<Contracts.Profile>
     */
    createProfile(createProfileContext: Contracts.CreateProfileContext): IPromise<Contracts.Profile>;
    /**
     * @param {string} id
     * @param {boolean} details
     * @param {boolean} withAttributes
     * @param {string} partition
     * @param {string} coreAttributes
     * @return IPromise<Contracts.Profile>
     */
    getProfile(id: string, details?: boolean, withAttributes?: boolean, partition?: string, coreAttributes?: string): IPromise<Contracts.Profile>;
    /**
     * Update profile
     *
     * @param {Contracts.Profile} profile - Update profile
     * @param {string} id - Profile ID
     * @return IPromise<void>
     */
    updateProfile(profile: Contracts.Profile, id: string): IPromise<void>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @return IPromise<Contracts.ProfileRegions>
     */
    getRegions(): IPromise<Contracts.ProfileRegions>;
    /**
     * @exemptedapi
     * [Preview API]
     *
     * @return IPromise<string[]>
     */
    getSupportedLcids(): IPromise<string[]>;
}
export class ProfileHttpClient extends ProfileHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return ProfileHttpClient2_2
 */
export function getClient(): ProfileHttpClient2_2;
}
declare module "VSS/SDK/Services/Dialogs" {
import Contracts_Platform = require("VSS/Common/Contracts/Platform");
import Dialogs = require("VSS/Controls/Dialogs");
/**
* Class which manages showing dialogs in the parent frame
* @serviceId "vss.dialogs"
*/
export class HostDialogService implements IHostDialogService {
    /**
    * Open a modal dialog in the host frame which will get its content from a contributed control.
    *
    * @param contributionId The id of the control contribution to host in the dialog
    * @param dialogOptions options.title - title of dialog
    * @param contributionConfig Initial configuration to pass to the contribution control.
    * @param postContent Optional data to post to the contribution endpoint. If not specified, a GET request will be performed.
    */
    openDialog(contributionId: string, dialogOptions: IHostDialogOptions, contributionConfig?: Object, postContent?: Object): IPromise<IExternalDialog>;
    /**
     * Open a modal dialog in the host frame which will display the supplied message.
     * @param message the message to display in the dialog. If it's a string, the message is displayed as plain text (no html). For HTML display, pass in a jQuery object.
     * @param methodOptions options affecting the dialog
     * @returns a promise that is resolved when the user accepts the dialog (Ok, Yes, any button with Button.reject===false), or rejected if the user does not (Cancel, No, any button with Button.reject===true).
     */
    openMessageDialog(message: string | JQuery, options?: IOpenMessageDialogOptions): IPromise<IMessageDialogResult>;
    buttons: {
        ok: Dialogs.IMessageDialogButton;
        cancel: Dialogs.IMessageDialogButton;
        yes: Dialogs.IMessageDialogButton;
        no: Dialogs.IMessageDialogButton;
    };
}
export interface ExternalDialogOptions extends Dialogs.IModalDialogOptions {
    contributionId: string;
    webContext?: Contracts_Platform.WebContext;
    urlReplacementObject?: any;
    contributionConfig?: any;
    getDialogResult: () => IPromise<any>;
    postContent?: any;
}
/**
* Represents a dialog which hosts an ExternalPart.
*/
export class ExternalDialog extends Dialogs.ModalDialogO<ExternalDialogOptions> implements IExternalDialog {
    private _loadingPromise;
    initializeOptions(options?: any): void;
    initialize(): void;
    /**
    * Gets an object registered in the dialog's contribution control.
    *
    * @param instanceId Id of the instance to get
    * @param contextData Optional data to pass to the extension for it to use when creating the instance
    * @return Promise that is resolved to the instance (a proxy object that talks to the instance)
    */
    getContributionInstance<T>(instanceId: string, contextData?: any): IPromise<T>;
    onOkClick(e?: JQueryEventObject): any;
}
}
declare module "VSS/SDK/Services/ExtensionData" {
import Contracts_Platform = require("VSS/Common/Contracts/Platform");
import ExtensionManagement_Contracts = require("VSS/ExtensionManagement/Contracts");
/**
* Provides a wrapper around the REST client for getting and saving extension setting values
* @serviceId "vss.extensionSettings"
*/
export class ExtensionDataService implements IExtensionDataService {
    private _extensionManagementPromise;
    private _publisherName;
    private _extensionName;
    private static DEFAULT_SCOPE_TYPE;
    private static CURRENT_DEFAULT_SCOPE_VALUE;
    private static USER_SCOPE_TYPE;
    private static CURRENT_USER_SCOPE_VALUE;
    private static SETTINGS_COLLECTION_NAME;
    private static _serviceInstances;
    constructor(publisherName: string, extensionName: string, registrationId: string, webContext: Contracts_Platform.WebContext);
    /**
    * Factory method for creating/getting an instance of the extension settings service.
    *
    * @param extensionId The extension id to get or save settings for
    */
    static getServiceInstance(publisherName: string, extensionName: string, registrationId: string, webContext?: Contracts_Platform.WebContext): ExtensionDataService;
    /**
    * Returns a promise for retrieving a setting at the provided key and scope
    *
    * @param key The key to retrieve a value for
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    getValue<T>(key: string, documentOptions?: IDocumentOptions): IPromise<T>;
    /**
    * Returns a promise for retrieving a list of settings at the provided keys and scope
    *
    * @param keys The keys to retrieve values for
    * @param documentOptions The scope in which the values are stored - default value is collection-wide
    */
    getValues(keys: string[], documentOptions?: IDocumentOptions): IPromise<{
        [key: string]: any;
    }>;
    /**
    * Returns a promise for saving a setting at the provided key and scope
    *
    * @param key The key to save a value for
    * @param value The value to save
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    setValue<T>(key: string, value: T, documentOptions?: IDocumentOptions): IPromise<T>;
    /**
    * Returns a promise for saving a collection of settings at the provided keys and scope
    *
    * @param keyValuePairs A set of key/value pairs to set values for
    * @param documentOptions The scope in which the values are stored - default value is collection-wide
    */
    setValues(keyValuePairs: {
        [key: string]: any;
    }, documentOptions?: IDocumentOptions): IPromise<any[]>;
    /**
    * Returns a promise for getting a document with the provided id in the provided collection
    *
    * @param collectionName The name of the collection where the document lives
    * @param id The id of the document in the collection
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    getDocument(collectionName: string, id: string, documentOptions?: IDocumentOptions): IPromise<any>;
    /**
    * Returns a promise for getting all of the documents in the provided collection
    *
    * @param collectionName The name of the collection where the document lives
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    getDocuments(collectionName: string, documentOptions?: IDocumentOptions): IPromise<any[]>;
    /**
    * Returns a promise for creating a document in the provided collection
    *
    * @param collectionName The name of the collection where the document lives
    * @param doc The document to store
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    createDocument(collectionName: string, doc: any, documentOptions?: IDocumentOptions): IPromise<any>;
    /**
    * Returns a promise for setting a document in the provided collection
    * Creates the document if it does not exist, otherwise updates the existing document with the id provided
    *
    * @param collectionName The name of the collection where the document lives
    * @param doc The document to store
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    setDocument(collectionName: string, doc: any, documentOptions?: IDocumentOptions): IPromise<any>;
    /**
    * Returns a promise for updating a document in the provided collection
    * A document with the id provided must exist
    *
    * @param collectionName The name of the collection where the document lives
    * @param doc The document to store
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    updateDocument(collectionName: string, doc: any, documentOptions?: IDocumentOptions): IPromise<any>;
    /**
    * Returns a promise for deleting the document at the provided scope, collection and id
    *
    * @param collectionName The name of the collection where the document lives
    * @param id The id of the document in the collection
    * @param documentOptions The scope in which the value is stored - default value is account-wide
    */
    deleteDocument(collectionName: string, id: string, documentOptions?: IDocumentOptions): IPromise<void>;
    /**
    * Returns a promise for querying a set of collections
    *
    * @param collections The list of collections to query. Assumes Default Scope Type and Current Scope Value
    */
    queryCollectionNames(collectionNames: string[]): IPromise<ExtensionManagement_Contracts.ExtensionDataCollection[]>;
    /**
    * Returns a promise for querying a set of collections
    *
    * @param collections The list of collections to query. Each collection will contain its collectionName, scopeType, and scopeValue
    */
    queryCollections(collections: ExtensionManagement_Contracts.ExtensionDataCollection[]): IPromise<ExtensionManagement_Contracts.ExtensionDataCollection[]>;
    private _checkDocument(document);
    private _checkDocumentOptions(documentOptions);
    private _createDictionaryForArray(docs);
}
}
declare module "VSS/SDK/Services/Navigation" {
import Q = require("q");
/**
* Service which allows interaction with the browser location and navigation of the host frame
* @serviceId "ms.vss-web.navigation-service"
*/
export class HostNavigationService implements IHostNavigationService {
    /**
    * Update the current history entry
    *
    * @param action The "action" state parameter. This is the _a key in the url or "action" in the current state dictionary
    * @param data The history entry's new state key/value pairs
    * @param replaceHistoryEntry If true, replace the current history entry. Otherwise, add a new history entry.
    * @param mergeWithCurrentState If true, the supplied data just modify the existing/current state. If false, they replace all existing key/value pairs.
    * @param windowTitle The new window title. A null or empty value indicates to leave the title unchanged.
    * @param suppressNavigate If true, don't trigger any of the attached navigate event handlers due to this update.
    */
    updateHistoryEntry(action: string, data?: IDictionaryStringTo<any>, replaceHistoryEntry?: boolean, mergeWithCurrentState?: boolean, windowTitle?: string, suppressNavigate?: boolean): void;
    /**
    * Get the current navigation state dictionary. Uses query parameters and hash parameters.
    */
    getCurrentState(): any;
    /**
    * Attach a new navigate handler
    *
    * @param action The action that the handler applies to (or null to listen for all events)
    * @param handler The method called whenever a navigation event occurs with the matching action value
    * @param checkCurrentState If true, immediately invoke the handler if the current state is appropriate (has the matching action value)
    */
    attachNavigate(action: string, handler: IFunctionPPR<any, any, void>, checkCurrentState?: boolean): void;
    /**
    * Remove a navigate handler
    *
    * @param action The action that the handler applies to (or null for global handlers)
    * @param handler The method called whenever a navigation event occurs with the matching action value
    */
    detachNavigate(action: string, handler?: IFunctionPPR<any, any, void>): void;
    /**
    * Add a callback to be invoked each time the hash navigation has changed
    *
    * @param callback Method invoked on each navigation hash change
    */
    onHashChanged(callback: (hash: string) => void): void;
    private _getHash();
    /**
    * Gets the current hash.
    */
    getHash(): Q.Promise<string>;
    /**
     * Reloads the parent frame
     */
    reload(): void;
    /**
    * Sets the provided hash from the hosted content.
    */
    setHash(hash: string): void;
    /**
    * Replace existing hash with the provided hash from the hosted content.
    */
    replaceHash(hash: string): void;
    /**
    * Update the host document's title (appears as the browser tab title).
    *
    * @param title The new title of the window
    */
    setWindowTitle(title: string): void;
}
}
declare module "VSS/Search" {
export class SearchCore<T> {
    private _strategy;
    private _adapter;
    /**
     * The search core, allows users to perform searches on data using a custom strategy.
     *
     * @param strategy The search strategy to use.
     * @param adapter The search adapter to use.
     */
    constructor(strategy: SearchStrategy<T>, adapter: SearchAdapter<T>);
    /**
     * Add items to the search strategy
     *
     * @param items Items to add
     */
    addItems(items: SearchableObject<T>[]): void;
    /**
     * Performs a search using the Indexer and then runs the adapter's resultHandler on the results
     *
     * @param query Query to run search on
     */
    beginSearch(query: string): void;
    /**
     * Returns the search strategy currently being used.
     *
     * @return The strategy in use
     */
    getStrategy(): SearchStrategy<T>;
    /**
     * Clears the stored items in the strategy
     */
    clearStrategyStore(): void;
}
export interface ISearchStrategyOptions<T> {
    specialCharacters?: string[];
    delimiter?: string | RegExp;
    comparer?: IComparer<T>;
}
export class SearchStrategy<T> {
    /**
     * Tokenizes the searchText into separate words using a regex. Empty terms ("") will not be returned.
     *
     * @param searchText The searchText to split up.
     * @param delimiter The string or regex delimiter to use to split up the search terms
     * @return An array of strings, the separate words.
     */
    static getTerms(searchText: string[], delimiter?: string | RegExp): string[];
    protected _options: ISearchStrategyOptions<T>;
    private _specialCharactersHashSet;
    /**
     * Abstract Class to inherit from in order to implement the methods needed to store items and search on them.
     */
    constructor(options?: ISearchStrategyOptions<T>);
    private _buildSpecialCharacterHashSet(specialCharacters);
    _getTerms(searchTerms: string[]): string[];
    /**
     *     Stores items and terms for each item in order to later retrieve
     *     and search upon.
     *
     * @param searchableObjects SearchableObjects to add
     */
    processItems(searchableObjects: SearchableObject<T>[]): void;
    /**
     * Clears the items stored in the strategy.
     */
    clearStrategyStore(): void;
    /**
     *     Searches the item store for the query given to it. Returns an
     *     array of documents representing the documents which match the query.
     *
     * @param query The query to search for
     * @return The list of items which match the query
     */
    search(query: string): T[];
    /**
     * Checks whether data exists in the search strategy
     *
     * @return True if data exists in the strategy, false if it doesn't.
     */
    dataExists(): boolean;
    /**
     * Return the total count of item indexed.
     */
    getIndexedItemsCount(): number;
    /**
     * Return the total size of the indexed store.
     */
    getIndexTotalSize(): number;
}
export class IndexedSearchStrategy<T> extends SearchStrategy<T> {
    private _searchStore;
    private _dataExists;
    private _indexedItems;
    constructor(store?: IndexedSearchStore<T>, options?: ISearchStrategyOptions<T>);
    getIndexTotalSize(): number;
    /**
     * Clears the items stored in the strategy.
     */
    clearStrategyStore(): void;
    /**
     * Return the total count of item indexed.
     */
    getIndexedItemsCount(): number;
    /**
     * Processes all SearchableObjects and adds them to the index
     *
     * @param searchableObjects SearchableObjects to add
     */
    processItems(searchableObjects: SearchableObject<T>[]): void;
    /**
     * Performs a search using the Indexer and then runs the resultHandler on the results.
     *
     * @param query Query to run search on
     * @return The search results
     */
    search(query: string): T[];
    /**
     * Checks whether data exists in the search strategy
     *
     * @return True if data exists in the strategy, false if it doesn't.
     */
    dataExists(): boolean;
}
export interface IndexedSearchStoreOptions<T> {
    delimiter?: string | RegExp;
    comparer?: IComparer<T>;
}
export class IndexedSearchStore<T> {
    protected _options: IndexedSearchStoreOptions<T>;
    protected _comparer: IComparer<T>;
    /**
     *  Abstract function allowing for additional stores for an IndexedSearchStrategy
     */
    constructor(options?: IndexedSearchStoreOptions<T>);
    /**
     * Runs a query on the index.
     *
     * @param query The query to run.
     * @return An array of items, representing the results.
     */
    search(query: string): T[];
    /**
     * Adds an item to the index, under its token and its subparts.
     *
     * @param item The item to add to the index.
     * @param tokens The tokens to add the item under.
     * @returns true if the item was added to the index, false if it was already in the index
     */
    addToIndex(item: T, tokens: string[]): boolean;
    /**
     * Clears the items stored in the strategy.
     */
    clearStrategyStore(): void;
    /**
     * totalsize of the index store
     */
    getStoreTotalSize(): number;
}
export class TrieStore<T> extends IndexedSearchStore<T> {
    private _trie;
    constructor(options?: IndexedSearchStoreOptions<T>);
    search(query: string): T[];
    /**
     * Adds an item to the index, under its token and its subparts.
     *
     * @param item The item to add to the index.
     * @param tokens The tokens to add the item under.
     * @returns true if the item was added to the index, false if it was already in the index
     */
    addToIndex(item: T, tokens: string[]): boolean;
    clearStrategyStore(): void;
    getStoreTotalSize(): number;
}
export class InvertedIndexStore<T> extends IndexedSearchStore<T> {
    private _index;
    private _tokenCache;
    constructor(options?: IndexedSearchStoreOptions<T>);
    /**
     * Runs a query on the index.
     *
     * @param query The query to run.
     * @return An array of items, representing the results.
     */
    search(query: string): T[];
    /**
     * Adds an item to the index, under its token and its subparts.
     *
     * @param item The item to add to the index.
     * @param tokens The tokens to add the item under.
     * @returns true if the item was added to the index, false if it was already in the index
     */
    addToIndex(item: T, tokens: string[]): boolean;
    /**
     * Clears the items stored in the strategy.
     */
    clearStrategyStore(): void;
    /**
     * Adds a item to the index, under a single key's location.
     *
     * @param item The item to add.
     * @param key The key to add the item under
     * @returns true if the item was added to the index, false if it was already in the index under the given key
     */
    private _addItemToIndex(item, key);
}
export class SearchAdapter<T> {
    /**
     * Abstract Class to inherit from in order to implement the UI methods for search.
     */
    constructor();
    /**
     * Adds additional items to the search strategy
     *
     * @param addItemsCallback The function which adds items to the search strategy.
     * @param searchCallback The function which searches the newly updated strategy.
     */
    addMoreItems(addItemsCallback: (items: SearchableObject<T>[]) => void, searchCallback: () => void): void;
    /**
     * Creates SearchableObjects for all available work items
     *
     * @return An array of SearchableObjects.
     */
    createSearchableObjects(): SearchableObject<T>[];
    /**
     *     Handles the results in the UI by filtering through all available items to the ones
     *     provided in the results array.
     *
     * @param results An array of items
     * @param finished Represents whether or not the search is finished
     */
    handleResults(results: T[], finished: boolean): void;
    /**
     *     Handles an error being thrown in the search process.
     *
     * @param message Specific error message if provided.
     */
    handleError(message: string): void;
    /**
     *     Handles the search results being cleared and the view resetting to normal.
     */
    handleClear(): void;
    /**
     *     Returns whether or not there is more data to be loaded.
     *
     * @return True if no more data needs to be loaded, false otherwise
     */
    isDataSetComplete(): boolean;
}
export class SearchableObject<T> {
    item: T;
    terms: string[];
    /**
     * Represents a single item to be placed in the index.
     *
     * @param item The item to be added
     * @param terms The terms associated to the item.
     */
    constructor(item: T, terms: string[]);
    /**
     * Set the terms for this item
     *
     * @param terms The new terms
     */
    setTerms(terms: string[]): void;
    /**
     * Add a term to the item
     *
     * @param term The additional term
     */
    addTerm(term: string): void;
}
/**
 * Return the unique (and sorted) elements of an array.
 * @param data The array to sort and filter down to unique items
 * @param comparer Comparer for objects of type T. If T is a primitive type, then the comparer can be null/undefined
 */
export function fastUnique<T>(data: T[], comparer?: IComparer<T>): T[];
}
declare module "VSS/SecurityRoles/Contracts" {
import VSS_Common_Contracts = require("VSS/WebApi/Contracts");
export enum RoleAccess {
    /**
     * Access has been explicitly set.
     */
    Assigned = 1,
    /**
     * Access has been inherited from a higher scope.
     */
    Inherited = 2,
}
export interface RoleAssignment {
    /**
     * Designates the role as explicitly assigned or inherited.
     */
    access: RoleAccess;
    /**
     * User friendly description of access assignment.
     */
    accessDisplayName: string;
    /**
     * The user to whom the role is assigned.
     */
    identity: VSS_Common_Contracts.IdentityRef;
    /**
     * The role assigned to the user.
     */
    role: SecurityRole;
}
export interface SecurityRole {
    /**
     * Permissions the role is allowed.
     */
    allowPermissions: number;
    /**
     * Permissions the role is denied.
     */
    denyPermissions: number;
    /**
     * User friendly name of the role.
     */
    displayName: string;
    /**
     * Globally unique identifier for the role.
     */
    identifier: string;
    /**
     * Unique name of the role in the scope.
     */
    name: string;
    /**
     * Returns the id of the ParentScope.
     */
    scope: string;
}
export interface UserRoleAssignmentRef {
    /**
     * The name of the role assigned.
     */
    roleName: string;
    /**
     * Identifier of the user given the role assignment.
     */
    uniqueName: string;
    /**
     * Unique id of the user given the role assignment.
     */
    userId: string;
}
export var TypeInfo: {
    RoleAccess: {
        enumValues: {
            "assigned": number;
            "inherited": number;
        };
    };
    RoleAssignment: {
        fields: any;
    };
    SecurityRole: {
        fields: any;
    };
    UserRoleAssignmentRef: {
        fields: any;
    };
};
}
declare module "VSS/SecurityRoles/RestClient" {
import Contracts = require("VSS/SecurityRoles/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class SecurityRolesHttpClient3 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {string} scopeId
     * @param {string} resourceId
     * @return IPromise<Contracts.RoleAssignment[]>
     */
    getRoleAssignments(scopeId: string, resourceId: string): IPromise<Contracts.RoleAssignment[]>;
    /**
     * [Preview API]
     *
     * @param {string} scopeId
     * @param {string} resourceId
     * @param {string} identityId
     * @return IPromise<void>
     */
    removeRoleAssignment(scopeId: string, resourceId: string, identityId: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string[]} identityIds
     * @param {string} scopeId
     * @param {string} resourceId
     * @return IPromise<void>
     */
    removeRoleAssignments(identityIds: string[], scopeId: string, resourceId: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {Contracts.UserRoleAssignmentRef} roleAssignment
     * @param {string} scopeId
     * @param {string} resourceId
     * @param {string} identityId
     * @return IPromise<Contracts.RoleAssignment>
     */
    setRoleAssignment(roleAssignment: Contracts.UserRoleAssignmentRef, scopeId: string, resourceId: string, identityId: string): IPromise<Contracts.RoleAssignment>;
    /**
     * [Preview API]
     *
     * @param {Contracts.UserRoleAssignmentRef[]} roleAssignments
     * @param {string} scopeId
     * @param {string} resourceId
     * @return IPromise<Contracts.RoleAssignment[]>
     */
    setRoleAssignments(roleAssignments: Contracts.UserRoleAssignmentRef[], scopeId: string, resourceId: string): IPromise<Contracts.RoleAssignment[]>;
    /**
     * [Preview API]
     *
     * @param {string} scopeId
     * @return IPromise<Contracts.SecurityRole[]>
     */
    getRoleDefinitions(scopeId: string): IPromise<Contracts.SecurityRole[]>;
}
/**
 * @exemptedapi
 */
export class SecurityRolesHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {string} scopeId
     * @param {string} resourceId
     * @return IPromise<Contracts.RoleAssignment[]>
     */
    getRoleAssignments(scopeId: string, resourceId: string): IPromise<Contracts.RoleAssignment[]>;
    /**
     * [Preview API]
     *
     * @param {string} scopeId
     * @param {string} resourceId
     * @param {string} identityId
     * @return IPromise<void>
     */
    removeRoleAssignment(scopeId: string, resourceId: string, identityId: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {string[]} identityIds
     * @param {string} scopeId
     * @param {string} resourceId
     * @return IPromise<void>
     */
    removeRoleAssignments(identityIds: string[], scopeId: string, resourceId: string): IPromise<void>;
    /**
     * [Preview API]
     *
     * @param {Contracts.UserRoleAssignmentRef} roleAssignment
     * @param {string} scopeId
     * @param {string} resourceId
     * @param {string} identityId
     * @return IPromise<Contracts.RoleAssignment>
     */
    setRoleAssignment(roleAssignment: Contracts.UserRoleAssignmentRef, scopeId: string, resourceId: string, identityId: string): IPromise<Contracts.RoleAssignment>;
    /**
     * [Preview API]
     *
     * @param {Contracts.UserRoleAssignmentRef[]} roleAssignments
     * @param {string} scopeId
     * @param {string} resourceId
     * @return IPromise<Contracts.RoleAssignment[]>
     */
    setRoleAssignments(roleAssignments: Contracts.UserRoleAssignmentRef[], scopeId: string, resourceId: string): IPromise<Contracts.RoleAssignment[]>;
    /**
     * [Preview API]
     *
     * @param {string} scopeId
     * @return IPromise<Contracts.SecurityRole[]>
     */
    getRoleDefinitions(scopeId: string): IPromise<Contracts.SecurityRole[]>;
}
export class SecurityRolesHttpClient extends SecurityRolesHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return SecurityRolesHttpClient2_2
 */
export function getClient(): SecurityRolesHttpClient2_2;
}
declare module "VSS/Security/Contracts" {
import VSS_Identities_Contracts = require("VSS/Identities/Contracts");
/**
 * Class for encapsulating the allowed and denied permissions for a given IdentityDescriptor.
 */
export interface AccessControlEntry {
    /**
     * The set of permission bits that represent the actions that the associated descriptor is allowed to perform.
     */
    allow: number;
    /**
     * The set of permission bits that represent the actions that the associated descriptor is not allowed to perform.
     */
    deny: number;
    /**
     * The descriptor for the user this AccessControlEntry applies to.
     */
    descriptor: VSS_Identities_Contracts.IdentityDescriptor;
    /**
     * This value, when set, reports the inherited and effective information for the associated descriptor. This value is only set on AccessControlEntries returned by the QueryAccessControlList(s) call when its includeExtendedInfo parameter is set to true.
     */
    extendedInfo: AceExtendedInformation;
}
/**
 * The AccessControlList class is meant to associate a set of AccessControlEntries with a security token and its inheritance settings.
 */
export interface AccessControlList {
    /**
     * Storage of permissions keyed on the identity the permission is for.
     */
    acesDictionary: {
        [key: string]: AccessControlEntry;
    };
    /**
     * True if this ACL holds ACEs that have extended information.
     */
    includeExtendedInfo: boolean;
    /**
     * True if the given token inherits permissions from parents.
     */
    inheritPermissions: boolean;
    /**
     * The token that this AccessControlList is for.
     */
    token: string;
}
export interface AccessControlListsCollection {
}
/**
 * Holds the inherited and effective permission information for a given AccessControlEntry.
 */
export interface AceExtendedInformation {
    /**
     * This is the combination of all of the explicit and inherited permissions for this identity on this token.  These are the permissions used when determining if a given user has permission to perform an action.
     */
    effectiveAllow: number;
    /**
     * This is the combination of all of the explicit and inherited permissions for this identity on this token.  These are the permissions used when determining if a given user has permission to perform an action.
     */
    effectiveDeny: number;
    /**
     * These are the permissions that are inherited for this identity on this token.  If the token does not inherit permissions this will be 0.  Note that any permissions that have been explicitly set on this token for this identity, or any groups that this identity is a part of, are not included here.
     */
    inheritedAllow: number;
    /**
     * These are the permissions that are inherited for this identity on this token.  If the token does not inherit permissions this will be 0.  Note that any permissions that have been explicitly set on this token for this identity, or any groups that this identity is a part of, are not included here.
     */
    inheritedDeny: number;
}
export interface ActionDefinition {
    /**
     * The bit mask integer for this action. Must be a power of 2.
     */
    bit: number;
    /**
     * The localized display name for this action.
     */
    displayName: string;
    /**
     * The non-localized name for this action.
     */
    name: string;
    /**
     * The namespace that this action belongs to.  This will only be used for reading from the database.
     */
    namespaceId: string;
}
/**
 * Represents an evaluated permission.
 */
export interface PermissionEvaluation {
    /**
     * Permission bit for this evaluated permission.
     */
    permissions: number;
    /**
     * Security namespace identifier for this evaluated permission.
     */
    securityNamespaceId: string;
    /**
     * Security namespace-specific token for this evaluated permission.
     */
    token: string;
    /**
     * Permission evaluation value.
     */
    value: boolean;
}
/**
 * Represents a set of evaluated permissions.
 */
export interface PermissionEvaluationBatch {
    alwaysAllowAdministrators: boolean;
    /**
     * Array of permission evaluations to evaluate.
     */
    evaluations: PermissionEvaluation[];
}
/**
 * Represents a raw access control entry from a remote backing store.
 */
export interface RemoteBackingStoreAccessControlEntry {
    /**
     * The set of permission bits that represent the actions that the associated descriptor is allowed to perform.
     */
    allow: number;
    /**
     * The set of permission bits that represent the actions that the associated descriptor is not allowed to perform.
     */
    deny: number;
    /**
     * The identity for which the access control entry is allowing / denying permission.
     */
    identityId: string;
    /**
     * The token of the access control list in which this access control entry belongs.
     */
    token: string;
}
export interface RemoveAccessControlListsRequest {
    recurse: boolean;
    tokens: string[];
}
export interface RemovePermissionsRequest {
    identityIds: string[];
    token: string;
}
export interface RenameTokensRequest {
    renames: TokenRename[];
}
/**
 * Encapsulates the result of a QuerySecurityData call to the backing store.
 */
export interface SecurityNamespaceData {
    /**
     * The access control entries in this snapshot of the security namespace data.
     */
    accessControlEntries: RemoteBackingStoreAccessControlEntry[];
    /**
     * Indicates the ACL store whose data is persisted in this SecurityNamespaceData object.
     */
    aclStoreId: string;
    /**
     * The identity domain for the service host on which this security namespace resides.
     */
    identityDomain: string;
    /**
     * The sequence ID for this snapshot of or incremental update to the security namespace data.
     */
    newSequenceId: number;
    /**
     * The list of tokens in the security namespace which have inheritance disabled.
     */
    noInheritTokens: string[];
    /**
     * If this is a full snapshot of the security namespace data, this value is -1. Otherwise, this instance represents the delta from OldSequenceId to NewSequenceId.
     */
    oldSequenceId: number;
}
/**
 * Class for describing the details of a TeamFoundationSecurityNamespace.
 */
export interface SecurityNamespaceDescription {
    /**
     * The list of actions that this Security Namespace is responsible for securing.
     */
    actions: ActionDefinition[];
    /**
     * This is the dataspace category that describes where the security information for this SecurityNamespace should be stored.
     */
    dataspaceCategory: string;
    /**
     * This localized name for this namespace.
     */
    displayName: string;
    /**
     * If the security tokens this namespace will be operating on need to be split on certain character lengths to determine its elements, that length should be specified here. If not, this value will be -1.
     */
    elementLength: number;
    /**
     * This is the type of the extension that should be loaded from the plugins directory for extending this security namespace.
     */
    extensionType: string;
    /**
     * If true, the security namespace is remotable, allowing another service to proxy the namespace.
     */
    isRemotable: boolean;
    /**
     * This non-localized for this namespace.
     */
    name: string;
    /**
     * The unique identifier for this namespace.
     */
    namespaceId: string;
    /**
     * The permission bits needed by a user in order to read security data on the Security Namespace.
     */
    readPermission: number;
    /**
     * If the security tokens this namespace will be operating on need to be split on certain characters to determine its elements that character should be specified here. If not, this value will be the null character.
     */
    separatorValue: string;
    /**
     * Used to send information about the structure of the security namespace over the web service.
     */
    structureValue: number;
    /**
     * If true, the security service will expect an ISecurityDataspaceTokenTranslator plugin to exist for this namespace
     */
    useTokenTranslator: boolean;
    /**
     * The permission bits needed by a user in order to modify security data on the Security Namespace.
     */
    writePermission: number;
}
export interface SetAccessControlEntriesInfo {
    accessControlEntries: AccessControlEntry[];
    merge: boolean;
    token: string;
}
export interface SetAccessControlListsRequest {
    accessControlEntries: AccessControlEntry[];
    accessControlLists: AccessControlList[];
    throwOnInvalidIdentity: boolean;
}
export interface SetInheritFlagInfo {
    inherit: boolean;
    token: string;
}
export interface SetPermissionsRequest {
    accessControlEntries: AccessControlEntry[];
    merge: boolean;
    throwOnInvalidIdentity: boolean;
    token: string;
}
/**
 * Represents a request to rename a token in a security namespace.
 */
export interface TokenRename {
    /**
     * True if the existing token should be preserved; false if it should be deleted.
     */
    copy: boolean;
    /**
     * The desired new name of the token.
     */
    newToken: string;
    /**
     * The current name of the token.
     */
    oldToken: string;
    /**
     * True if the scope of the operation should be extended to all child tokens of OldToken; false otherwise.
     */
    recurse: boolean;
}
export var TypeInfo: {
    AccessControlEntry: {
        fields: any;
    };
    AccessControlList: {
        fields: any;
    };
    AccessControlListsCollection: {
        fields: any;
    };
    AceExtendedInformation: {
        fields: any;
    };
    ActionDefinition: {
        fields: any;
    };
    PermissionEvaluation: {
        fields: any;
    };
    PermissionEvaluationBatch: {
        fields: any;
    };
    RemoteBackingStoreAccessControlEntry: {
        fields: any;
    };
    RemoveAccessControlListsRequest: {
        fields: any;
    };
    RemovePermissionsRequest: {
        fields: any;
    };
    RenameTokensRequest: {
        fields: any;
    };
    SecurityNamespaceData: {
        fields: any;
    };
    SecurityNamespaceDescription: {
        fields: any;
    };
    SetAccessControlEntriesInfo: {
        fields: any;
    };
    SetAccessControlListsRequest: {
        fields: any;
    };
    SetInheritFlagInfo: {
        fields: any;
    };
    SetPermissionsRequest: {
        fields: any;
    };
    TokenRename: {
        fields: any;
    };
};
}
declare module "VSS/Security/RestClient" {
import Contracts = require("VSS/Security/Contracts");
import VSS_Common_Contracts = require("VSS/WebApi/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class SecurityHttpClient3 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {string} securityNamespaceId
     * @param {string} token
     * @param {string} descriptors
     * @return IPromise<boolean>
     */
    removeAccessControlEntries(securityNamespaceId: string, token?: string, descriptors?: string): IPromise<boolean>;
    /**
     * [Preview API]
     *
     * @param {any} container
     * @param {string} securityNamespaceId
     * @return IPromise<Contracts.AccessControlEntry[]>
     */
    setAccessControlEntries(container: any, securityNamespaceId: string): IPromise<Contracts.AccessControlEntry[]>;
    /**
     * [Preview API]
     *
     * @param {string} securityNamespaceId
     * @param {string} token
     * @param {string} descriptors
     * @param {boolean} includeExtendedInfo
     * @param {boolean} recurse
     * @return IPromise<Contracts.AccessControlList[]>
     */
    queryAccessControlLists(securityNamespaceId: string, token?: string, descriptors?: string, includeExtendedInfo?: boolean, recurse?: boolean): IPromise<Contracts.AccessControlList[]>;
    /**
     * [Preview API]
     *
     * @param {string} securityNamespaceId
     * @param {string} tokens
     * @param {boolean} recurse
     * @return IPromise<boolean>
     */
    removeAccessControlLists(securityNamespaceId: string, tokens?: string, recurse?: boolean): IPromise<boolean>;
    /**
     * [Preview API]
     *
     * @param {VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.AccessControlListsCollection>} accessControlLists
     * @param {string} securityNamespaceId
     * @return IPromise<void>
     */
    setAccessControlLists(accessControlLists: VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.AccessControlListsCollection>, securityNamespaceId: string): IPromise<void>;
    /**
     * [Preview API] Perform a batch of "has permission" checks. This methods does not aggregate the results nor does it shortcircut if one of the permissions evaluates to false.
     *
     * @param {Contracts.PermissionEvaluationBatch} evalBatch
     * @return IPromise<Contracts.PermissionEvaluationBatch>
     */
    hasPermissionsBatch(evalBatch: Contracts.PermissionEvaluationBatch): IPromise<Contracts.PermissionEvaluationBatch>;
    /**
     * [Preview API]
     *
     * @param {string} securityNamespaceId
     * @param {number} permissions
     * @param {string} tokens
     * @param {boolean} alwaysAllowAdministrators
     * @param {string} delimiter
     * @return IPromise<boolean[]>
     */
    hasPermissions(securityNamespaceId: string, permissions?: number, tokens?: string, alwaysAllowAdministrators?: boolean, delimiter?: string): IPromise<boolean[]>;
    /**
     * [Preview API]
     *
     * @param {string} securityNamespaceId
     * @param {number} permissions
     * @param {string} token
     * @param {string} descriptor
     * @return IPromise<Contracts.AccessControlEntry>
     */
    removePermission(securityNamespaceId: string, permissions?: number, token?: string, descriptor?: string): IPromise<Contracts.AccessControlEntry>;
    /**
     * [Preview API]
     *
     * @param {string} securityNamespaceId
     * @param {boolean} localOnly
     * @return IPromise<Contracts.SecurityNamespaceDescription[]>
     */
    querySecurityNamespaces(securityNamespaceId: string, localOnly?: boolean): IPromise<Contracts.SecurityNamespaceDescription[]>;
    /**
     * [Preview API]
     *
     * @param {any} container
     * @param {string} securityNamespaceId
     * @return IPromise<void>
     */
    setInheritFlag(container: any, securityNamespaceId: string): IPromise<void>;
}
export class SecurityHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * @param {string} securityNamespaceId
     * @param {string} token
     * @param {string} descriptors
     * @return IPromise<boolean>
     */
    removeAccessControlEntries(securityNamespaceId: string, token?: string, descriptors?: string): IPromise<boolean>;
    /**
     * @param {any} container
     * @param {string} securityNamespaceId
     * @return IPromise<Contracts.AccessControlEntry[]>
     */
    setAccessControlEntries(container: any, securityNamespaceId: string): IPromise<Contracts.AccessControlEntry[]>;
    /**
     * @param {string} securityNamespaceId
     * @param {string} token
     * @param {string} descriptors
     * @param {boolean} includeExtendedInfo
     * @param {boolean} recurse
     * @return IPromise<Contracts.AccessControlList[]>
     */
    queryAccessControlLists(securityNamespaceId: string, token?: string, descriptors?: string, includeExtendedInfo?: boolean, recurse?: boolean): IPromise<Contracts.AccessControlList[]>;
    /**
     * @param {string} securityNamespaceId
     * @param {string} tokens
     * @param {boolean} recurse
     * @return IPromise<boolean>
     */
    removeAccessControlLists(securityNamespaceId: string, tokens?: string, recurse?: boolean): IPromise<boolean>;
    /**
     * @param {VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.AccessControlListsCollection>} accessControlLists
     * @param {string} securityNamespaceId
     * @return IPromise<void>
     */
    setAccessControlLists(accessControlLists: VSS_Common_Contracts.VssJsonCollectionWrapperV<Contracts.AccessControlListsCollection>, securityNamespaceId: string): IPromise<void>;
    /**
     * @param {string} securityNamespaceId
     * @param {number} permissions
     * @param {string} tokens
     * @param {boolean} alwaysAllowAdministrators
     * @param {string} delimiter
     * @return IPromise<boolean[]>
     */
    hasPermissions(securityNamespaceId: string, permissions?: number, tokens?: string, alwaysAllowAdministrators?: boolean, delimiter?: string): IPromise<boolean[]>;
    /**
     * @param {string} securityNamespaceId
     * @param {number} permissions
     * @param {string} token
     * @param {string} descriptor
     * @return IPromise<Contracts.AccessControlEntry>
     */
    removePermission(securityNamespaceId: string, permissions?: number, token?: string, descriptor?: string): IPromise<Contracts.AccessControlEntry>;
    /**
     * @param {string} securityNamespaceId
     * @param {boolean} localOnly
     * @return IPromise<Contracts.SecurityNamespaceDescription[]>
     */
    querySecurityNamespaces(securityNamespaceId: string, localOnly?: boolean): IPromise<Contracts.SecurityNamespaceDescription[]>;
    /**
     * @param {any} container
     * @param {string} securityNamespaceId
     * @return IPromise<void>
     */
    setInheritFlag(container: any, securityNamespaceId: string): IPromise<void>;
}
export class SecurityHttpClient extends SecurityHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return SecurityHttpClient2_2
 */
export function getClient(): SecurityHttpClient2_2;
}
declare module "VSS/Serialization" {
/**
 * Metadata for deserializing an enum field on a contract/type
 */
export interface ContractEnumMetadata {
    enumValues?: {
        [name: string]: number;
    };
}
/**
 * Metadata for deserializing a particular field on a contract/type
 */
export interface ContractFieldMetadata {
    isArray?: boolean;
    isDate?: boolean;
    enumType?: ContractEnumMetadata;
    typeInfo?: ContractMetadata;
    isDictionary?: boolean;
    dictionaryKeyIsDate?: boolean;
    dictionaryValueIsDate?: boolean;
    dictionaryKeyEnumType?: ContractEnumMetadata;
    dictionaryValueEnumType?: ContractEnumMetadata;
    dictionaryValueTypeInfo?: ContractMetadata;
    dictionaryValueFieldInfo?: ContractFieldMetadata;
}
/**
 * Metadata required for deserializing a given type
 */
export interface ContractMetadata {
    fields?: {
        [fieldName: string]: ContractFieldMetadata;
    };
}
/**
 * Module for handling serialization and deserialization of data contracts
 * (contracts sent from the server using the VSTS default REST api serialization settings)
 */
export module ContractSerializer {
    /**
     * Process a contract in its raw form (e.g. date fields are Dates, and Enums are numbers) and
     * return a pure JSON object that can be posted to REST endpoint.
     *
     * @param data The object to serialize
     * @param contractMetadata The type info/metadata for the contract type being serialized
     * @param preserveOriginal If true, don't modify the original object. False modifies the original object (the return value points to the data argument).
     */
    function serialize(data: any, contractMetadata: ContractMetadata, preserveOriginal?: boolean): any;
    /**
     * Process a pure JSON object (e.g. that came from a REST call) and transform it into a JS object
     * where date strings are converted to Date objects and enum values are converted from strings into
     * their numerical value.
     *
     * @param data The object to deserialize
     * @param contractMetadata The type info/metadata for the contract type being deserialize
     * @param preserveOriginal If true, don't modify the original object. False modifies the original object (the return value points to the data argument).
     * @param unwrapWrappedCollections If true check for wrapped arrays (REST apis will not return arrays directly as the root result but will instead wrap them in a { values: [], count: 0 } object.
     */
    function deserialize(data: any, contractMetadata: ContractMetadata, preserveOriginal?: boolean, unwrapWrappedCollections?: boolean): any;
}
/**
* Deserialize the JSON island data that is stored in the given element
*
* @param $element JQuery element containing the JSON to deserialize
* @param contractMetadata The type info/metadata for the contract type being deserialize
* @param removeElement If true remove the element from the DOM after deserializing the content
*/
export function deserializeJsonIsland<T>($element: JQuery, contractMetadata: ContractMetadata, removeElement?: boolean): T;
}
declare module "VSS/Service" {
import Contracts_Platform = require("VSS/Common/Contracts/Platform");
import WebApi_RestClient = require("VSS/WebApi/RestClient");
/**
* A connection to a particular TeamFoundation host
*/
export class VssConnection {
    private static _connectionsCache;
    private _webContext;
    private _hostType;
    private _hostContext;
    private _services;
    private _httpClients;
    /**
    * Get a (cached) VssConnection object of the given type
    *
    * @param webContext Specific web context to get the connection for
    * @param hostType Host type to scope the connection to
    */
    static getConnection(webContext?: Contracts_Platform.WebContext, hostType?: Contracts_Platform.ContextHostType): VssConnection;
    /**
    * Get the host context information given a web context and the desired host type
    */
    private static getHostContext(webContext, hostType);
    /**
    * Create a new connection object
    * @param webContext Specific web context to get the connection for
    * @param hostType Host type to scope the connection to
    */
    constructor(webContext: Contracts_Platform.WebContext, hostType?: Contracts_Platform.ContextHostType);
    getWebContext(): Contracts_Platform.WebContext;
    /**
    * Gets the host information that this service is scoped to
    */
    getHostContext(): Contracts_Platform.HostContext;
    /**
    * Gets the host type that this service is scoped to
    */
    getHostType(): Contracts_Platform.ContextHostType;
    /**
    * Gets the service host url for this connection. This is typically
    * a relative url, but it can be absolute in child iframes (e.g. extensions)
    */
    getHostUrl(): string;
    /**
    * Gets a (potentially-cached) service associated with this connection
    */
    getService<T extends VssService>(serviceType: {
        new (): T;
    }, useCached?: boolean): T;
    /**
     * Returns a new or a cached instance of an httpClient for the given type.
     *
     * @param httpClientType Type of requeested httpClient.
     * @param serviceInstanceId Unique id of the service to scope the http client to
     * @return http client of the specified type (clients are cached for this connection)
     */
    getHttpClient<T extends WebApi_RestClient.VssHttpClient>(httpClientType: {
        new (url: string, options?: WebApi_RestClient.IVssHttpClientOptions): T;
    }, serviceInstanceId?: string, authTokenManager?: IAuthTokenManager<any>, clientOptions?: WebApi_RestClient.IVssHttpClientOptions): T;
    /**
    * Get the url for the given service
    *
    * @param serviceInstanceId Unique identifier of the VSTS service to get the url for
    * @param hostType The type of host to get the url for
    * @param faultInMissingHost If true, attempt to fault in the target host if the location's service definition doesn't already exist.
    */
    beginGetServiceUrl(serviceInstanceId: string, hostType?: Contracts_Platform.ContextHostType, faultInMissingHost?: boolean): IPromise<string>;
    private _isSameOrigin(serviceUrl);
}
/**
* A client service which can be cached per TFS connection.
*/
export class VssService {
    private _connection;
    /**
    * Gets the relative location for the service's connection
    */
    getConnection(): VssConnection;
    getWebContext(): Contracts_Platform.WebContext;
    /**
    * Sets the VssConnection to use for this service
    * @param connection VssConnection used by this service
    */
    initializeConnection(connection: VssConnection): void;
}
export interface ILocalService {
}
/**
 * Get a local service.
 * @param serviceType Type of the local service to get.
 * @param webContext optional web context.
 * @returns {ILocalService}
 */
export function getLocalService<T extends ILocalService>(serviceType: {
    new (): T;
}, useCached?: boolean, webContext?: Contracts_Platform.WebContext): T;
/**
* Get a collection-level service
* @param serviceType Type of service to get
* @param webContext optional web context to use for the connection
* @return Collection-level service
*/
export function getCollectionService<T extends VssService>(serviceType: {
    new (): T;
}, webContext?: Contracts_Platform.WebContext): T;
/**
* Get an application-level (Account) service
* @param serviceType Type of service to get
* @param webContext optional web context to use for the connection
* @return Application-level service
*/
export function getApplicationService<T extends VssService>(serviceType: {
    new (): T;
}, webContext?: Contracts_Platform.WebContext): T;
/**
* Get a service for the web context's default host type
* @param serviceType Type of service to get
* @param webContext optional web context to use for the connection
* @return Collection-level or Application-level service
*/
export function getService<T extends VssService>(serviceType: {
    new (): T;
}, webContext?: Contracts_Platform.WebContext): T;
/**
* Get a collection-level HTTP client
* @param httpClientType Type of http client to get
* @param webContext optional web context to use for the connection
* @return collection-level client
*/
export function getCollectionClient<T extends WebApi_RestClient.VssHttpClient>(httpClientType: {
    new (url: string, options?: WebApi_RestClient.IVssHttpClientOptions): T;
}, webContext?: Contracts_Platform.WebContext, serviceInstanceId?: string, authTokenManager?: IAuthTokenManager<any>, options?: WebApi_RestClient.IVssHttpClientOptions): T;
/**
* Get an application-level (Account) HTTP client
* @param httpClientType Type of http client to get
* @param webContext optional web context to use for the connection
* @return application-level client
*/
export function getApplicationClient<T extends WebApi_RestClient.VssHttpClient>(httpClientType: {
    new (url: string, options?: WebApi_RestClient.IVssHttpClientOptions): T;
}, webContext?: Contracts_Platform.WebContext, serviceInstanceId?: string, authTokenManager?: IAuthTokenManager<any>, options?: WebApi_RestClient.IVssHttpClientOptions): T;
/**
* Get an http client for the web context's default host type
* @param serviceType Type of http client to get
* @param webContext optional web context to use for the connection
* @return Collection-level or Application-level http client
*/
export function getClient<T extends WebApi_RestClient.VssHttpClient>(httpClientType: {
    new (url: string, options?: WebApi_RestClient.IVssHttpClientOptions): T;
}, webContext?: Contracts_Platform.WebContext, serviceInstanceId?: string, authTokenManager?: IAuthTokenManager<any>, options?: WebApi_RestClient.IVssHttpClientOptions): T;
}
declare module "VSS/Settings" {
import Contracts_Platform = require("VSS/Common/Contracts/Platform");
import Service = require("VSS/Service");
/**
* Scope at which the local user setting applies
*/
export enum LocalSettingsScope {
    /**
    * Global (account-specific) settings for a user
    */
    Global = 0,
    /**
    * Project-specific settings for a user
    */
    Project = 1,
    /**
    * Team-specific settings for a user
    */
    Team = 2,
}
/**
* Service for reading and writing to local storage
*/
export class LocalSettingsService implements Service.ILocalService {
    private static GLOBAL_SETTING_KEY;
    private static PROJECT_SETTING_KEY;
    private static TEAM_SETTING_KEY;
    private _webContext;
    constructor(webContext?: Contracts_Platform.WebContext);
    /**
     * Write a settings value to browser local storage
     *
     * @param key Key for the setting to be written. This key will be prefixed with a scope.
     * @param value Value for the setting to be written
     * @param scope Scope for the setting to apply to. This will determine the prefix to use at the beginning of the setting key.
     */
    write(key: string, value: any, scope?: LocalSettingsScope): void;
    /**
     * Read a setting from browser local storage.
     *
     * @param key Key for the setting to be written. This key will be prefixed with a scope.
     * @param defaultValue The value to return in case no setting exists
     * @param scope Scope for the setting to apply to. This will determine the prefix to use at the beginning of the setting key.
     * @return Value read from the setting or undefined if no value stored
     */
    read<T>(key: string, defaultValue?: T, scope?: LocalSettingsScope): T;
    private _getScopedKey(key, scope);
}
}
declare module "VSS/Telemetry/Contracts" {
export interface CustomerIntelligenceEvent {
    area: string;
    feature: string;
    properties: {
        [key: string]: any;
    };
}
export enum DelegatedAppTokenType {
    Session = 0,
    App = 1,
}
export interface WebSessionToken {
    appId: string;
    force: boolean;
    name: string;
    namedTokenId: string;
    token: string;
    tokenType: DelegatedAppTokenType;
    validTo: Date;
}
export var TypeInfo: {
    CustomerIntelligenceEvent: {
        fields: any;
    };
    DelegatedAppTokenType: {
        enumValues: {
            "session": number;
            "app": number;
        };
    };
    WebSessionToken: {
        fields: any;
    };
};
}
declare module "VSS/Telemetry/RestClient" {
import Contracts = require("VSS/Telemetry/Contracts");
import VSS_WebApi = require("VSS/WebApi/RestClient");
/**
 * @exemptedapi
 */
export class CustomerIntelligenceHttpClient3 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {Contracts.CustomerIntelligenceEvent[]} events
     * @return IPromise<void>
     */
    publishEvents(events: Contracts.CustomerIntelligenceEvent[]): IPromise<void>;
}
/**
 * @exemptedapi
 */
export class CustomerIntelligenceHttpClient2_2 extends VSS_WebApi.VssHttpClient {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
    /**
     * [Preview API]
     *
     * @param {Contracts.CustomerIntelligenceEvent[]} events
     * @return IPromise<void>
     */
    publishEvents(events: Contracts.CustomerIntelligenceEvent[]): IPromise<void>;
}
export class CustomerIntelligenceHttpClient extends CustomerIntelligenceHttpClient3 {
    constructor(rootRequestPath: string, options?: VSS_WebApi.IVssHttpClientOptions);
}
/**
 * Gets an http client targeting the latest released version of the APIs.
 *
 * @return CustomerIntelligenceHttpClient2_2
 */
export function getClient(): CustomerIntelligenceHttpClient2_2;
}
declare module "VSS/Telemetry/Services" {
/**
 * Event data that can be published
 */
export class TelemetryEventData {
    area: string;
    feature: string;
    properties: {
        [key: string]: any;
    };
    elapsedTime: number;
    /**
     * Constructor for CIPublishPropertiesOptions.
     *
     * @param area The Customer Intelligence Area to publish to.
     * @param feature The feature name.
     * @param properties The key:value list of event properties.
     * @param elapsedTime The elapsedTime for the event. Defaults to Date.now() - startTime if startTime is supplied.
     * @param startTime The Date.now() at the start of the event process.
     */
    constructor(area: string, feature: string, properties: {
        [key: string]: any;
    }, startTime?: number, elapsedTime?: number);
    /**
     * Create Telemetry event data from a single property
     */
    static fromProperty(area: string, feature: string, property: string, value: any, startTime?: number, elapsedTime?: number): TelemetryEventData;
}
/**
 * Gets all the events published to the service.
 * Intended to be used internally for analysing telemetry data.
 */
export function getPublishedEvents(): TelemetryEventData[];
/**
 * Publish event data to the CustomerIntelligence service and App insights.
 * (events are queued and sent in delayed batches unless immediate = true is supplied)
 *
 * @param eventData {TelemetryEventData} telemetry event to publish
 * @param immediate {boolean} If true, make ajax calls to publish the event immediately. Otherwise queue the event and send in delayed batches.
 */
export function publishEvent(eventData: TelemetryEventData, immediate?: boolean): void;
}
declare module "VSS/Utils/Array" {
/**
* Returns the first element of an array that matches the predicate.
*
* @param array Array used to perform predicate.
* @param predicate The Predicate function.
* @return The first element that matches the predicate.
*/
export function first<T>(array: T[], predicate?: (value: T) => boolean): T;
export function arrayContains<S, T>(value: S, target: T[], comparer?: (s: S, t: T) => boolean): boolean;
export function arrayEquals<S, T>(source: S[], target: T[], comparer?: (s: S, t: T) => boolean, nullResult?: boolean): boolean;
/**
    * Take an array of values and convert it to a dictionary/lookup table.
    * @param array Values to convert
    * @param getKey Function to get the key for a given item
    * @param getValue Optional function to get teh value for a given item (defaults to the item itself)
    * @param throwOnDuplicateKeys Optional value indicating to throw an error when duplicate keys are present. Otherwise just overwrite any duplicates
    * @return
    */
export function toDictionary<TArray, TValue>(array: TArray[], getKey: (item: TArray, index: number) => string, getValue?: (item: TArray, index: number) => TValue, throwOnDuplicateKeys?: boolean): IDictionaryStringTo<TValue>;
/**
    * @param array
    * @param value
    * @param comparer
    * @return
    */
export function contains<T>(array: T[], value: T, comparer?: IComparer<any>): boolean;
/**
    * @param array
    * @param predicate
    * @return
    */
export function findIndex<T>(array: T[], predicate: IFunctionPR<T, boolean>): number;
/**
    * @param arrayA
    * @param arrayB
    * @param comparer
    * @return
    */
export function intersect<T>(arrayA: T[], arrayB: T[], comparer?: IComparer<T>): T[];
/**
    * Helper method used to intersect arrays of strings or numbers
    *
    * @param arrayA
    * @param arrayB
    * @param caseInsensitive
    * @return
    */
export function intersectPrimitives<T>(arrayA: T[], arrayB: T[], caseInsensitive?: boolean): T[];
/**
    * @param arrayA
    * @param arrayB
    * @param comparer
    * @return
    */
export function union<T>(arrayA: T[], arrayB: T[], comparer?: IComparer<T>): T[];
/**
    * Sorts and removes duplicate elements
    *
    * @param array
    * @param comparer
    * @return
    */
export function uniqueSort<T>(array: T[], comparer?: IComparer<T>): T[];
/**
    * @param array
    * @param comparer
    * @return
    */
export function unique<T>(array: T[], comparer?: IComparer<T>): T[];
/**
    * @param arrayA
    * @param arrayB
    * @param comparer
    * @return
    */
export function subtract<T>(arrayA: T[], arrayB: T[], comparer?: IComparer<T>): T[];
/**
    * Reorders an array by moving oldIndex + the "count" next elements to the newIndex in the array
    *
    * @param array
    * @param oldIndex The index of the array element to move
    * @param newIndex The index of the array to insert the element at
    * @param count The number of subsequent, contiguous elements to take with the oldIndex in the reorder
    */
export function reorder<T>(array: T[], oldIndex: number, newIndex: number, count: number): T[];
/**
    * @param array
    * @param comparer
    * @return
    */
export function flagSorted<T>(array: T[], comparer: IComparer<T>): void;
/**
    * @param toArray
    * @param fromArray
    * @return
    */
export function copySortFlag<T>(toArray: T[], fromArray: T[]): void;
/**
    * @param array
    * @param comparer
    * @return
    */
export function isSorted<T>(array: T[], comparer: IComparer<T>): boolean;
/**
    * @param array
    * @param comparer
    * @return
    */
export function sortIfNotSorted<T>(array: T[], comparer: IComparer<T>): boolean;
/**
    * @param array
    * @return
    */
export function clone<T>(array: T[]): T[];
/**
    * @param array
    * @param item
    * @return
    */
export function indexOf<T>(array: T[], item: T): number;
/**
    * @param array
    * @param item
    */
export function add<T>(array: T[], item: T): void;
/**
    * @param array
    * @param items
    */
export function addRange<T>(array: T[], items: T[]): void;
/**
    * @param array
    * @param item
    * @return
    */
export function remove<T>(array: T[], item: T): boolean;
/**
    * @param array
    */
export function clear<T>(array: T[]): void;
/**
 * Returns an array which is the sorted intersection of values between two other arrays.
 * This function is optimized to work only with sorted arrays with unique values.
 * @param sortedUniqueArray1 Input array - which must already be sorted and only contain unique values
 * @param sortedUniqueArray2 Input array - which must already be sorted and only contain unique values
 * @param comparer A comparer for values of type T
 * @returns An array that is the intersection of the values from the two input arrays (as determined by the comparer). The result array will be sorted. If there is no intersection, an empty array is returned.
 */
export function intersectUniqueSorted<T>(sortedUniqueArray1: T[], sortedUniqueArray2: T[], comparer?: IComparer<T>): T[];
}
declare module "VSS/Utils/Clipboard" {
/**
 * Copies the specified data to the clipboard in the TEXT format using a progressively degrading experience.
 *
 * @param data The data to copy.
 */
export function copyToClipboard(data: string, options?: any): void;
/**
 * Gets a boolean value indicating whether the current browser supports native clipboard access.
 */
export function supportsNativeCopy(): boolean;
/**
 * Gets a boolean value indicating whether the current browser supports native clipboard access for HTML content.
 */
export function supportsNativeHtmlCopy(): boolean;
}
declare module "VSS/Utils/Core" {
/**
 * Wrap a function to ensure that a specific value of 'this' is passed to the function when it is invoked (regardless of the caller).
 *
 * @param instance The object that will be set to the value of 'this' when the function is invoked.
 * @param method The function to wrap.
 * @param data Arguments that will be appended to the arguments passed when the delegate is invoked.
 * @return The wrapper function
 */
export function delegate(instance: any, method: Function, data?: any): IArgsFunctionR<any>;
/**
 *     Curries a function with a set of arguments and returns the resulting function.
 *     When eventually evaluated, the returned function will call the original function
 *     with the current arguments prepended to the list of arguments.
 *
 *     var add3, result;
 *     function add(x, y) {
 *         return x + y;
 *     }
 *     add3 = add.curry(3);
 *     results = add3(4); // result === 7
 *
 *     See http://en.wikipedia.org/wiki/Curry_function
 *
 * @param fn
 * @param args
 */
export function curry(fn: Function, ...args: any[]): IArgsFunctionR<any>;
export class DelayedFunction {
    private _interval;
    private _func;
    private _timeoutHandle;
    private _name;
    /**
     * Creates an object that can be used to delay-execute the specified method.
     *
     * @param instance Context to use when calling the provided function
     * @param ms Delay in milliseconds to wait before executing the Function
     * @param name Name to use when tracing this delayed function
     * @param method Method to execute
     * @param data Arguments to pass to the method
     */
    constructor(instance: any, ms: number, name: string, method: Function, data?: any[]);
    /**
     * Starts the timer (if not already started) which will invoke the method once expired.
     */
    start(): void;
    /**
     * Resets the timer (cancel, then re-start) which will invoke the method once expired.
     */
    reset(): void;
    /**
     * Cancels any pending operation (stops the timer).
     */
    cancel(): void;
    /**
     * Invokes the method immediately (canceling an existing timer).
     */
    invokeNow(): void;
    /**
     * Modifies the length of the delay timer (for subsequent starts).
     *
     * @param ms Delay in milliseconds to wait before executing the Function
     */
    setDelay(ms: number): void;
    /**
     * Modify the method being executed.
     *
     * @param instance Context to use when calling the provided function
     * @param method Method to execute
     * @param data (Optional) arguments to pass to the method
     */
    setMethod(instance: any, method: Function, data?: any[]): void;
    /**
     * Is the timer currently running (operation in progress)
     *
     * @return True if this operation is already in progress
     */
    isPending(): boolean;
}
/**
 * Executes the provided function after the specified amount of time
 *
 * @param instance Context to use when calling the provided function
 * @param ms Delay in milliseconds to wait before executing the Function
 * @param method Method to execute
 * @param data Arguments to pass to the method
 * @return The delayed function that was started
 */
export function delay(instance: any, ms: number, method: Function, data?: any[]): DelayedFunction;
/**
 * Creates a delegate that is delayed for the specified interval when invoked. Subsequent calls to the returned delegate reset the timer.
 *
 * @param instance Context to use when calling the provided function
 * @param ms Delay in milliseconds to wait before executing the Function
 * @param method Method to execute
 * @param data Arguments to pass to the method
 * @return The delayed delegate function.
 */
export function throttledDelegate(instance: any, ms: number, method: Function, data?: any[]): IArgsFunctionR<any>;
/**
 * Splits a string that contains a list of comma-separated (signed) integer values into an array
 *
 * @param stringRepresentation String representation of comma-separated integer array
 * @return Array of parsed integers
 */
export function parseIntArray(stringRepresentation: string): number[];
export class Cancelable {
    private _callbacks;
    canceled: boolean;
    context: any;
    /**
     * Manage cancellable operations.
     *
     * @param context The context for the cancellable operation.
     * The context is passed to actions when they are called.
     */
    constructor(context: any);
    /**
     * Perform the action if not cancelled.
     *
     * @param action The action to call if the current operation has not been cancelled.
     */
    perform(action: Function): void;
    /**
     * Wrap an action to make it cancellable.
     *
     * @param action The action to wrap.
     * @return The cancellable action.
     */
    wrap(action: Function): Function;
    /**
     * Cancel the operation.
     */
    cancel(): void;
    /**
     * Register a callback to be called when the object is cancelled.
     *
     * @param callback The callback function.
     */
    register(callback: Function): void;
}
export class DisposalManager implements IDisposable {
    /**
     * List of disposables.
     */
    private _disposables;
    constructor();
    /**
     * Add the specified disposable to the list.
     *
     * @param disposable Disposable to be added to the list.
     */
    addDisposable<TDisposable extends IDisposable>(disposable: TDisposable): TDisposable;
    /**
     * Disposes all disposables.
     */
    dispose(): void;
}
/**
* Deserialize an "MSJSON" formatted string into the corresponding JSON object. This converts a
* string like "\\/Date(1448375104308)\\/" into the corresponding Date object.
*
* Returns null if not a valid JSON string.
*
* @param data The JSON string to deserialize
* @param secure Unused parameter
*/
export function tryParseMSJSON(data: any, secure?: boolean): any;
/**
* Deserialize an "MSJSON" formatted string into the corresponding JSON object. This converts a
* string like "\\/Date(1448375104308)\\/" into the corresponding Date object.
*
* Throws if not a valid JSON string.
*
* @param data The JSON string to deserialize
* @param secure Unused parameter
*/
export function parseMSJSON(data: any, secure?: boolean): any;
/**
* Serialize a JSON object into "MSJSON" format which has date objects serialized in the
* format: "\\/Date(1448375104308)\\/"
*
* @param object The JSON object to serialize
*/
export function stringifyMSJSON(object: any): string;
/**
 * Parse data from a JSON Island into an object
 *
 * @param $context The context in which to search for the JSON data
 * @param selectionFilter An optional selector that will filter the selection of JSON islands found.
 * @param remove .
 * @return
 */
export function parseJsonIsland($context: JQuery, selectionFilter?: string, remove?: boolean): any;
/**
 * Converts the specified value to a display string.
 *
 * @param value The value to convert.
 * @param format The value to convert.
 */
export function convertValueToDisplayString(value: any, format?: string): string;
export function domToXml(xmlNode: any): string;
export function parseXml(xml: string): any;
/**
 * Compare two objects value are deep equal, order matters in array comparision.
 *
 * @param first The first object
 * @param second The second object
 * @return True if two objects are deepEqual, otherwise false.
 */
export function equals(first: any, second: any): boolean;
export var documentSelection: any;
}
declare module "VSS/Utils/Culture" {
/**
* Culture-related settings
*/
export interface ICultureInfo {
    name: string;
    numberFormat: INumberFormatSettings;
    dateTimeFormat: IDateTimeFormatSettings;
}
/**
* Number formatting culture settings
*/
export interface INumberFormatSettings {
    CurrencyDecimalDigits: number;
    CurrencyDecimalSeparator: string;
    CurrencyGroupSizes: number[];
    NumberGroupSizes: number[];
    PercentGroupSizes: number[];
    CurrencyGroupSeparator: string;
    CurrencySymbol: string;
    NaNSymbol: string;
    CurrencyNegativePattern: number;
    NumberNegativePattern: number;
    PercentPositivePattern: number;
    PercentNegativePattern: number;
    NegativeInfinitySymbol: string;
    NegativeSign: string;
    NumberDecimalDigits: number;
    NumberDecimalSeparator: string;
    NumberGroupSeparator: string;
    CurrencyPositivePattern: number;
    PositiveInfinitySymbol: string;
    PositiveSign: string;
    PercentDecimalDigits: number;
    PercentDecimalSeparator: string;
    PercentGroupSeparator: string;
    PercentSymbol: string;
    PerMilleSymbol: string;
    NativeDigits: string[];
    DigitSubstitution: number;
}
/**
* DateTime-format related culture settings
*/
export interface IDateTimeFormatSettings {
    AMDesignator: string;
    Calendar: {
        MinSupportedDateTime: string;
        MaxSupportedDateTime: string;
        AlgorithmType: number;
        CalendarType: number;
        Eras: any[];
        TwoDigitYearMax: number;
        convert?: {
            fromGregorian: (date: Date) => number[];
            toGregorian: (year: number, month: number, day: number) => Date;
        };
    };
    DateSeparator: string;
    FirstDayOfWeek: number;
    CalendarWeekRule: number;
    FullDateTimePattern: string;
    LongDatePattern: string;
    LongTimePattern: string;
    MonthDayPattern: string;
    PMDesignator: string;
    RFC1123Pattern: string;
    ShortDatePattern: string;
    ShortTimePattern: string;
    SortableDateTimePattern: string;
    TimeSeparator: string;
    UniversalSortableDateTimePattern: string;
    YearMonthPattern: string;
    AbbreviatedDayNames: string[];
    ShortestDayNames: string[];
    DayNames: string[];
    AbbreviatedMonthNames: string[];
    MonthNames: string[];
    NativeCalendarName: string;
    AbbreviatedMonthGenitiveNames: string[];
    MonthGenitiveNames: string[];
    eras: any[];
}
/**
* Get culture settings for the invariant culture
*/
export function getInvariantCulture(): ICultureInfo;
/**
* Get culture settings for the current user's preferred culture
*/
export function getCurrentCulture(): ICultureInfo;
/**
* Get the name of the current culture being used on this page
*/
export function getCurrentCultureName(): string;
/**
* Get the number format settings for the current culture
*/
export function getNumberFormat(): INumberFormatSettings;
/**
* Get the DateTime format settings for the current culture
*/
export function getDateTimeFormat(): IDateTimeFormatSettings;
}
declare module "VSS/Utils/Date" {
import Contracts_Platform = require("VSS/Common/Contracts/Platform");
export var utcOffset: number;
export var timeZoneMap: Contracts_Platform.DaylightSavingsAdjustmentEntry[];
export var MILLISECONDS_IN_MINUTE: number;
export var MILLISECONDS_IN_HOUR: number;
export var MILLISECONDS_IN_DAY: number;
export var MILLISECONDS_IN_WEEK: number;
export var DATETIME_MINDATE_UTC_MS: number;
/**
 * Checks whether the specified datestring is in ISO 8601 date format or not.
 * @param dateString
 */
export function isIsoDate(dateString: string): boolean;
/**
    * Checks whether this date object corresponds to a min date or not
    *
    * @return
    */
export function isMinDate(date: Date): boolean;
/**
    * Compares two date objects. Returns a number:
    *    Less than 0 if date1 is earlier than date2
    *    Zero if date1 is the same as date2
    *    Greater than zero if date1 is later than date2
    *
    * If an argument is not an instance of a Date then it is considered earlier than
    * the other argument, or the same if the other argument is also not an instance of
    * a Date
    *
    * @param date1 Date object to compare
    * @param date2 Date object to compare
    * @return
    */
export function defaultComparer(date1: Date, date2: Date): number;
/**
    * Compare two dates to see if they are equal - returning true if they are equal.
    *
    * @param date1 The first value to compare
    * @param date2 The second value to compare
    * @return
    */
export function equals(date1: Date, date2: Date): boolean;
/**
    * Shifts the date to match the UTC date.  This is done by removing the timezone offset which is applied.
    *
    * @param date The date to be converted.
    * @return
    */
export function shiftToUTC(date: Date): Date;
/**
    * Shifts the date to match the local date.  This is done by adding the timezone offset to the date.
    *
    * @param date The date to be converted.
    * @return
    */
export function shiftToLocal(date: Date): Date;
/**
    * Parses the string into a date.
    *
    * @param dateString Date string to parse.
    * @param parseFormat Optional format string to use in parsing the date. May be null or undefined
    * @param ignoreTimeZone
    *     Optional value indicating to ignore the time zone set set in user preferences?
    *     Should be set to true when a Date string should be parsed irrespective of the user's time zone (e.g. calendar control).
    *
    * @return
    */
export function parseDateString(dateString: string, parseFormat?: string, ignoreTimeZone?: boolean): Date;
/**
    * Returns the number of days between the two dates. Note that any time component is ignored and the dates
    * can be supplied in any order
    *
    * @param startDate The first date
    * @param endDate The second date
    * @param exclusive If true then the result is exclusive of the second date (Mon->Fri==4).
    * Otherwise the date includes the later date (Mon->Fri==5)
    */
export function daysBetweenDates(startDate: Date, endDate: Date, exclusive?: boolean): number;
/**
    * @param value Date string
    * @param formats Date string formats
    * @param ignoreTimeZone
    * @return
    */
export function parseLocale(value: string, formats?: string[] | string, ignoreTimeZone?: boolean): Date;
/**
    * @param date The Date object to format
    * @param format Date string format
    * @param ignoreTimeZone
    * @return
    */
export function localeFormat(date: Date, format?: string, ignoreTimeZone?: boolean): string;
/**
    * Converts a time from the client (e.g. new Date()) to the user's preferred timezone
    *
    * @param date The Date object to convert
    * @param adjustOffset
    *     If true, consider the date portion when converting (get the timezone offset at that particular date).
    *     False indicates to use the current (today's) timezone offset regardless of the date given.
    *
    */
export function convertClientTimeToUserTimeZone(date: Date, adjustOffset?: boolean): Date;
/**
    * Converts a time from the user's preferred timezone to the client (e.g. new Date()) timezone
    *
    * @param date The Date object to convert
    * @param adjustOffset
    *     If true, consider the date portion when converting (get the timezone offset at that particular date).
    *     False indicates to use the current (today's) timezone offset regardless of the date given.
    *
    */
export function convertUserTimeToClientTimeZone(date: Date, adjustOffset?: boolean): Date;
/**
    * Strip the time from the given date (return a new date) such that the new date is of 12:00:00 AM
    */
export function stripTimeFromDate(date: Date): Date;
/**
    * Get the equivalent of "Now" in the user's time zone.
    */
export function getNowInUserTimeZone(): Date;
/**
    * Get the equivalent of "Today" (date as of midnight) in the user's time zone
    */
export function getTodayInUserTimeZone(): Date;
/**
    * @param date The Date object to format
    * @param format Date string format
    * @return
    */
export function format(date: Date, format?: string): string;
/**
    * Generate a string indicating how long ago the date is.
    *
    * @param date The Date object to format
    * @param now
    * @return A friendly string
    */
export function ago(date: Date, now?: Date): string;
/**
    * Adds days to a given date
    *
    * @param date The Date object to add to
    * @param days Number of days to add
    * @param adjustOffset is true then the offset will be adjusted if the offset between the date passed
    * and the date obtained after adding days is different.
    *
    */
export function addDays(date: Date, days: number, adjustOffset?: boolean): Date;
/**
    * Adds hours to a given date
    *
    * @param date The Date object to add to
    * @param hours Number of hours to add
    * @param adjustOffset is true then the offset will be adjusted if the offset between the date passed
    * and the date obtained after adding hours is different.
    *
    */
export function addHours(date: Date, hours: number, adjustOffset?: boolean): Date;
/**
    * Adjusts the time zone offset by applying the time difference in the offsets.
    *
    * @param oldDate The Date object which was used before time zone changed.
    * @param newDate The Date object which was used after time zone changed.
    */
export function adjustOffsetForTimes(oldDate: Date, newDate: Date, applicationDate?: Date): Date;
/**
    * Gets the offset of the date passed in.
    *
    * @param date The Date object for which the offset is required.
    * @param defaultToUtcOffset A value indicating whether the server side set utc offset should be returned if no offset for date is returned.
    */
export function getOffsetForDate(date: Date): number;
/**
    * Checks whether given day is today in user timezone
    *
    * @param date The Date object to check
    */
export function isGivenDayToday(date: Date): boolean;
/**
    * Checks whether given day is a day in past in user timezone
    *
    * @param date The Date object to check
    */
export function isGivenDayInPast(date: Date): boolean;
/**
    * Checks whether given day is a day in future in user timezone
    *
    * @param date The Date object to check
    */
export function isGivenDayInFuture(date: Date): boolean;
/**
    * Get a user friendly string for a date that indicates how long ago the date was. e.g. "4 hours ago", "Tuesday", "7/4/2012".
    *
    * @param date The Date object to format
    * @param now
    * @return A string version of the date.
    */
export function friendly(date: Date, now?: Date): string;
}
declare module "VSS/Utils/File" {
/**
* File encoding values.
*/
export enum FileEncoding {
    Unknown = 0,
    Binary = 1,
    ASCII = 2,
    UTF8 = 3,
    UTF32_BE = 4,
    UTF32_LE = 5,
    UTF16_BE = 6,
    UTF16_LE = 7,
}
export function tryDetectFileEncoding(base64Content: string): FileEncoding;
/**
* Combine 2 path segments using the given separator ("/" is the default)
*
* @param path1 First path segment
* @param path2 Second path segment
* @param pathSeparator Optional path separator ("/" is the default)
* @return combined string
*/
export function combinePaths(path1: string, path2: string, pathSeparator?: string): string;
/**
* Ensure that the given path ends with a separator. If not, add the separator to the end.
*
* @param path Path to verify
* @param pathSeparator Optional path separator ("/" is the default)
* @return resulting string that ends with the separator
*/
export function ensureTrailingSeparator(path: string, pathSeparator?: string): string;
}
declare module "VSS/Utils/Html" {
export module HtmlNormalizer {
    /**
     * Normalizes the given html by removing the attributes like script and fixing incomplete tags
     *
     * @param html Html to normalize
     * @return normalized Html
     */
    function normalize(html: string): string;
    /**
     * Normalizes the given html by removing the attributes like script and fixing incomplete tags.
     * Also allows the caller to specify additional attributes to remove, like 'class'
     *
     * @param html Html to normalize
     * @param additionalInvalidAttributes Additional attributes to remove
     * @param additionalValidAttributes Additional attributes to keep
     * @return normalized Html
     */
    function normalizeStripAttributes(html: string, additionalInvalidAttributes: string[], additionalValidAttributes?: string[]): string;
    /**
     * Sanitizes the given html by fixing incomplete tags and encoding unsafe text
     *
     * @param html Html to sanitize
     * @return sanitized Html
     */
    function sanitize(html: string): string;
}
export class TemplateEngine {
    /**
     * Replaces simple tokens, such as ${Foo}, in the input HTML template.
     *
     * @param template The HTML markup or text to use as a a template.
     * @param data The data to render.
     * @return The HTML string with template replacements.
     */
    private static _replaceSimpleTemplateTokens(template, data);
    /**
     * Replaces simple tokens which will not be HTML encoded, such as {{html Foo}}, in the input HTML template.
     *
     * @param template The HTML markup or text to use as a a template.
     * @param data The data to render.
     * @return The HTML string with template replacements.
     */
    private static _replaceUnencodedTemplateTokens(template, data);
    /**
     * Replaces foreach style tokens, such as {{each Foo}}, in the input HTML template.
     *
     * @param template The HTML markup or text to use as a a template.
     * @param data The data to render.
     * @return The HTML string with template replacements.
     */
    private static _replaceForEachTemplateTokens(template, data);
    /**
     * Replaces a Regex match within some text with a replacement.
     *
     * @param text The original text.
     * @param match A regex match within that text.
     * @param replacement The replacement string.
     * @return The updated string.
     */
    private static _replaceMatch(text, match, replacement);
    private static _getEncodedTextPropertyValue(data, propertyPath);
    private static _getTextPropertyValue(data, propertyPath);
    /**
     * Obtains a value from a given data object using a string property path.
     *
     * @param data An object.
     * @param propertyPath A dot separrated property path. Undefined or empty string returns the plain data object.
     * @return The resolved data property value or undefined if property was not found.
     */
    private static _getPropertyValue(data, propertyPath);
    /**
     * A poor man's implementation of $.tmpl() from jquery templates. Renderes the
     * specified HTML content as a template, using the specified data.
     *
     * @param template The HTML markup or text to use as a a template.
     * @param data The data to render.
     * @return A jquery element.
     */
    static tmpl(template: string, data: any): string;
    /**
     * A static template engine for applying JS objects to a "jquery-tmpl" like template.
     */
    constructor();
}
}
declare module "VSS/Utils/Number" {
import Culture = require("VSS/Utils/Culture");
/**
    * @param a
    * @param b
    * @return
    */
export function defaultComparer(a: any, b: any): number;
/**
    * Converts this number to a string in the current culture's locale
    * without specifying a precision. So, for example, with Spanish culture,
    * (3) gets translated to "3", and (3.1416) becomes "3,1416". The jQuery's
    * localeFormat requires a precision (the default is "2" if not specified).
    * So 3.localeFormat("N") become "3,00".
    *
    * @param num  The Number to format
    * @param includeGroupSeparators If true, use locale-specific
    * group separators (i.e. 3,000) in the output
    * @param cultureInfo Culture info (CurrentCulture if not specified)
    * @return
    */
export function toDecimalLocaleString(num: number, includeGroupSeparators?: boolean, cultureInfo?: Culture.ICultureInfo): string;
/**
    * @param value
    * @return
    */
export function isPositiveNumber(value: any): boolean;
/**
    * @param value
    * @return
    */
export function parseLocale(value: string): number;
/**
    * @param value
    * @return
    */
export function parseInvariant(value: string): number;
/**
    * @param value
    * @param format
    * @return
    */
export function localeFormat(value: number, format: string): string;
}
declare module "VSS/Utils/String" {
import Culture = require("VSS/Utils/Culture");
export var EmptyGuidString: string;
export var empty: string;
export var newLine: string;
export var tab: string;
export var lineFeed: string;
/**
    * 		HTML Encodes the string. Use this method to help prevent cross site scripting attacks
    *     by cleaning text which may contain HTML elements before the string is display in a web page.
    *
    *
    * @param str The string to be encoded
    * @return A copy of the current string which has been HTML encoded
    */
export function htmlEncode(str: string): string;
/**
    * 		HTML Encodes the string. Use this method to help prevent cross site scripting attacks
    *     by cleaning text which may contain HTML elements before the string is display in a web page.
    *     Does not encode single quotes.
    *
    *
    * @param str The string to be encoded
    * @return A copy of the current string which has been HTML encoded
    */
export function htmlEncodeJavascriptAttribute(str: string): string;
/**
    * 		HTML Decodes the string.
    *
    *
    * @param str The string to be decoded
    * @return A copy of the current string which has been HTML decoded
    */
export function htmlDecode(str: string): string;
/**
    * 		HTML Decodes the string.
    *
    *
    * @param str The string to be decoded
    * @return
    *    A copy of the current string which has been HTML decoded.
    *    > < etc are converted back to HTML form(<, > etc)
    *
    */
export function decodeHtmlSpecialChars(str: string): string;
/**
    * 		HTML encodes the string and replaces newlines with HTML break tags.
    * 		Use this method to maintain line breaks when displaying strings.
    *
    *
    * @param str The string to be encoded.
    * @return A copy of the current string which has been HTML encoded
    */
export function nl2br(str: string): string;
/**
*	returns a string with the first letter as UpperCase and the rest lower case
*   Assumes the string is trimmed (no leading white-space) and starts with a valid character
*   if the first char is not an alphabet, no char will be made upper case
* @param str  The string to be converted.</param>
* @return A copy of the current string which has been sentence cased
*/
export function toSentenceCase(str: string): string;
/**
    * @param a
    * @param b
    * @return
    */
export function defaultComparer(a: string, b: string): number;
/**
    * @param a
    * @param b
    * @return
    */
export function ignoreCaseComparer(a: string, b: string): number;
/**
    * @param a
    * @param b
    * @return
    */
export function localeComparer(a: string, b: string): number;
/**
    * @param a
    * @param b
    * @return
    */
export function localeIgnoreCaseComparer(a: string, b: string): number;
/**
* Compares 2 strings for equality.
*
* @param a First string to compare
* @param b Second string to compare
* @param ignoreCase If true, do a case-insensitive comparison.
*/
export function equals(a: string, b: string, ignoreCase?: boolean): boolean;
/**
    * @param str
    * @param prefix
    * @param comparer
    * @return
    */
export function startsWith(str: string, prefix: string, comparer?: IComparer<string>): boolean;
/**
    * @param str
    * @param suffix
    * @param comparer
    * @return
    */
export function endsWith(str: string, suffix: string, comparer?: IComparer<string>): boolean;
/**
    * @param str
    * @param subStr
    * @return
    */
export function caseInsensitiveContains(str: string, subStr: string): boolean;
/**
    * @param format
    * @param args
    * @return
    */
export function format(format: string, ...args: any[]): string;
/**
    * @param format
    * @param args
    * @return
    */
export function localeFormat(format: string, ...args: any[]): string;
export function dateToString(value: Date, useLocale?: boolean, format?: string): string;
export function numberToString(value: number, useLocale?: boolean, format?: string): string;
export function parseDateString(value: string, cultureInfo?: Culture.ICultureInfo, formats?: string[]): Date;
export function containsControlChars(str: string): boolean;
export function containsMismatchedSurrogateChars(str: string): boolean;
/**
    *  Base64 encodes the string. Uses the native version if available.
    *  @param s The string that should be encoded.
    *  @return The string in base64 encoding.
    */
export function base64Encode(s: string): string;
export function isGuid(str: string): boolean;
export function isEmptyGuid(str: string): boolean;
/** Returns a new, pseudo-random uid */
export function generateUID(): string;
/**
* Result from a singleSplit operation
*/
export interface ISingleSplitResult {
    /**
    * The part of the string before the split (or the original string if no match)
    */
    part1: string;
    /**
    * The segment of the string after the split
    */
    part2: string;
    /**
    * Whether or not the separator was found in the string
    */
    match: boolean;
}
/**
* Split a string into 2 parts by finding the first (or optionally, last) match of a given separator.
* This is close to the C# String.Split API using 2 as the "count". In javascript, supplying the count ignores everything
* in the string after that number of segments. For example calling "a b c".split(" ", 2) returns ["a", "b"] where in C#
* this would return ["a", "b c"]. This method works like the C# version where singleSplit("a b c", " ") will return
* { part1: "a", part2: "b c"}.
*
* @param value The string to split
* @param separator The separator string to split on
* @param ignoreCase Optional parameter to ignore case of the separator
* @param lastMatch If true, search in the reverse direction (find the last instance of the separator). By default, the first instance of the separator is used.
*/
export function singleSplit(value: string, separator: string, ignoreCase?: boolean, lastMatch?: boolean): ISingleSplitResult;
export class StringBuilder {
    private _textBuilder;
    /**
     * Utility class for building strings - similar to the System.Text.StringBuilder .NET class.
     *
     * @param initialText The initial text for the builder
     */
    constructor(initialText?: string);
    /**
     * Appends the specified text to the end of the string buffer.
     *
     * @param text The text to append.
     */
    append(text: string | any): void;
    /**
     * Appends a new-line to the current text buffer.
     */
    appendNewLine(): void;
    /**
     * Concatenates all text in the string buffer into a single string value.
     *
     * @return The string version of the accumulated text.
     */
    toString(): string;
}
}
declare module "VSS/Utils/UI" {
export function getWheelDelta(e?: any): number;
/**
 * @param element
 * @param enable
 */
export function enableElement(element: any, enable: boolean): void;
export function makeElementUnselectable(element: any): void;
/**
 * Best-effort attempt to set focus on the specified element. Exceptions will be caught and logged to console.
 *
 * @param element Element to set focus on (DomElement or jQuery element)
 * @param delay Optional delay in ms before calling focus
 */
export function tryFocus(element: any, delay?: number): void;
export function alignWidth(element: any, baseWidth: any): void;
/**
* Is the given element in the DOM hierarchy
*
* @param element Element to check if it exists somewhere in the current document
*/
export function isInDomTree(element: any): boolean;
export function getCustomData(element: any, key: any): any;
export enum KeyCode {
    ALT = 18,
    BACKSPACE = 8,
    CAPS_LOCK = 20,
    COMMA = 188,
    CONTROL = 17,
    DELETE = 46,
    DOWN = 40,
    END = 35,
    ENTER = 13,
    ESCAPE = 27,
    HOME = 36,
    INSERT = 45,
    LEFT = 37,
    PAGE_DOWN = 34,
    PAGE_UP = 33,
    PERIOD = 190,
    RIGHT = 39,
    SEMI_COLON = 186,
    FIREFOX_SEMI_COLON = 59,
    SHIFT = 16,
    SPACE = 32,
    TAB = 9,
    UP = 38,
    F1 = 112,
    F2 = 113,
    F10 = 121,
    IME_INPUT = 229,
    N = 78,
    P = 80,
    Q = 81,
    S = 83,
    A = 65,
    C = 67,
    H = 72,
    T = 84,
    QUESTION_MARK = 191,
}
export module KeyUtils {
    /**
     * Check if only the ctrl key modifier was pressed.
     *
     * @param e The event object.
     */
    function isExclusivelyCtrl(e: JQueryKeyEventObject): boolean;
    /**
     * Check if any modifier keys were pressed
     *
     * @param e The event object.
     */
    function isModifierKey(e: JQueryKeyEventObject): boolean;
}
export module Constants {
    var HtmlNewLine: string;
    var BlurTimeout: any;
}
export module Measurement {
    var _PROBE_ID: string;
    function _createProbe($parent: any): JQuery;
    /**
     * Get a probe element to use to measure
     *
     * @param $parent Parent element to create a probe under (null for document body)
     * @return
     */
    function _getProbe($parent?: JQuery): JQuery;
    /**
     * Get the pixel equivalent for em's
     *
     * @return
     */
    function getUnitEm(): number;
    /**
     * Get the pixel equivalent for ex's
     *
     * @return
     */
    function getUnitEx(): number;
    /**
     * Get the pixel equivalent for inches
     *
     * @return
     */
    function getUnitIn(): number;
    /**
     * Get the scrollbar width in pixels
     *
     * @param $parent The element to measure
     * @return
     */
    function getScrollbarWidth($parent: JQuery): number;
    /**
     * Get the scrollbar height in pixels
     *
     * @param $parent The element to measure
     * @return
     */
    function getScrollbarHeight($parent: JQuery): number;
    /**
     * Get the number of pixels for the given measurement
     *
     * @param unit Measurement (e.g. "14.5 px" or "2 em")
     * @return
     */
    function getUnitAsPixel(unit: string): number;
}
/**
 * @param tagName
 * @param className
 */
export function domElem(tagName: string, className?: string): HTMLElement;
export function htmlEncode(input: any): any;
export module Positioning {
    enum VerticalScrollBehavior {
        Default = 0,
        Top = 1,
        Middle = 2,
        Bottom = 3,
    }
    interface IPositionOptions {
        /**
         * where to align the element (horizontal-vertical)
         */
        elementAlign?: string;
        /**
         * where to align the element against base element (horizontal-vertical)
         */
        baseAlign?: string;
        /**
         * behavior when the element overflows the window (horizontal-vertical)
         */
        overflow?: string;
        /**
         * flag to specify that markers should be used to horizontally align the elements rather than the elements themselves.
         */
        alignToMarkerHorizontal?: boolean;
        /**
         * flag to specify that markers should be used to vertically align the elements rather than the elements themselves.
         */
        alignToMarkerVertical?: boolean;
        /**
         * jQuery object inside the element that should be aligned with the base
         */
        elementAlignmentMarker?: JQuery;
        /**
         * jQuery object inside the base element that should be aligned with the element
         */
        baseAlignmentMarker?: JQuery;
        /**
         * how much extra left offset (if any) should be given to the target element versus the reference element.
         */
        leftOffsetPixels?: Number;
        /**
         * how much extra top offset (if any) should be given to the target element versus the reference element.
         */
        topOffsetPixels?: Number;
        supportScroll?: boolean;
        /**
         * prevent setting z-index on the target element
         */
        skipZIndexSetting?: boolean;
    }
    function _topOverflow(top: any): number;
    function _bottomOverflow(bottom: any): number;
    function _fitHorizontal(position: any, data: any): void;
    function _flipHorizontal(position: any, data: any): void;
    /**
     * Tries to fit the positioned element by using the base element if any overflow exists.
     * If still overflow exists after flipping, it shrinks the element where it best fits.
     */
    function _fitVertical(position: any, data: any): {
        top: any;
        shrink: number;
    };
    /**
     * Tries to flip the positioned element by using the base element if any overflow exists.
     * If still overflow exists after flipping, it shrinks the element where it best fits.
     */
    function _flipVertical(position: any, data: any): {
        top: any;
        shrink: any;
    };
    /**
     * Positions the given element by taking the given base element
     * as a reference using the options provided
     *
     * @param element Element to position
     * @param baseElement Reference element for positioning
     * @param options Options for positioning
     */
    function position(element: any, baseElement: any, options?: IPositionOptions): void;
    /**
     * Get the first parent of the given element that allows scrolling
     *
     * @param $element Element to scroll into view
     */
    function getVerticalScrollContainer($element: JQuery): JQuery;
    /**
     * Sets the scroll (top) position of the $container element so that the $element is visible.
     * This is a no-op if the element is already visible.
     *
     * @param $element Element to scroll into view
     * @param position The destination position of the element after scrolling (top, middle, bottom)
     * @param scrollIfAlreadyVisible
     *    If true, perform the scroll even if the element is already in view
     *
     * @param scrollAnimationDuration
     *    If true, scroll with animation using the given animation time
     *
     */
    function scrollIntoViewVertical($element: JQuery, position?: Positioning.VerticalScrollBehavior, scrollIfAlreadyVisible?: boolean, scrollAnimationDuration?: number): void;
}
export function attachResize(element: any, handler: (e: JQueryEventObject, args?) => void): void;
export function detachResize(element: any): void;
export function clearResizeHandlers(): void;
export interface SelectionRange {
    $startNode: JQuery;
    $endNode: JQuery;
    startNodeOffset: number;
    endNodeOffset: number;
}
export interface IBrowserInformation {
    msie?: boolean;
    edge?: boolean;
    chrome?: boolean;
    safari?: boolean;
    mozilla?: boolean;
    webkit?: boolean;
    version?: string;
    isWindows?: boolean;
    isMacintosh?: boolean;
}
export module BrowserCheckUtils {
    function isFirefox(): boolean;
    function isChrome(): boolean;
    function isMozilla(): boolean;
    function isMsie(): boolean;
    function isIE(): boolean;
    function isEdge(): boolean;
    function getVersion(): string;
    function isIEVersion(version: number): boolean;
    function isLessThanOrEqualToIE9(): boolean;
    function isLessThanOrEqualToIE8(): boolean;
    function isMacintosh(): boolean;
    function isWindows(): boolean;
}
export module SelectionUtils {
    function getSelection(): SelectionRange;
    function selectInputText($input: JQuery, startPosition: number, endPosition: number, focus: boolean): void;
}
export module HtmlInsertionUtils {
    function pasteHtmlAtCaret(html: string, parentWindow?: Window): void;
}
export enum HotKeyCombination {
    None = 0,
    Ctrl = 1,
    Alt = 2,
    Shift = 3,
    CtrlShift = 4,
    CtrlAlt = 5,
}
export interface HotKey {
    combination: HotKeyCombination;
    which: number;
    displayText: string;
    handler: () => boolean;
}
export interface IGlobalHotKeyManager {
    registerHotKey: (hotKey: HotKey) => void;
    registerCtrlAltHotkey: (which: number, text: string, handler: () => boolean) => void;
    dispose: () => void;
}
export var globalHotKeyManager: IGlobalHotKeyManager;
export interface ISectionManager {
    identifySections: () => void;
    nextSection: () => boolean;
    previousSection: () => boolean;
}
export var sectionManager: ISectionManager;
export interface IFilterGroup {
    start: number;
    end: number;
    level: number;
}
export function updateFilterGroups(groups: IFilterGroup[], clauseNumber: number, insert: boolean): IFilterGroup[];
export function updateFilterGroupLevels(groups: IFilterGroup[]): number;
export function findTreeNode(path: string, separator: string, comparer: IComparer<string>, textField: string): any;
export function calculateTreePath(includeRoot: boolean, separator: string, textField: string, rootField: string): string;
export function walkTree(f: IFunctionPPR<any, any, void>): void;
export function injectStylesheets(cssReferenceUrls: string[], baseUrl?: string): void;
export function accessible(element: JQuery, handler?: Function): JQuery;
export function Watermark(element: JQuery, ...args: any[]): JQuery;
}
declare module "VSS/Utils/Url" {
/**
 * Check if specified URL is safe - i.e. part of an approved list of URL schemes.
 *
 * @param url Url to check.
 * @returns {boolean}
 */
export function isSafeProtocol(url: string): boolean;
/**
 * Return a new url that adds (if the given parameter name does not exist in the url),
 * or replaces the value of given parameter name with the given parameter value.
 *
 * @param url The original url.
 * @param paramName The parameter name to replace in the url.
 * @param paramValue The parameter value to replace in the url.
 * @returns {string}
 */
export function replaceUrlParam(url: string, paramName: string, paramValue: string): string;
/**
 * Verifies that the given url is within the constraints of 2000 characters.
 *
 * @param url The url to verify.
 * @returns {boolean}
 */
export function isUrlWithinConstraints(url: string): boolean;
export class UrlTranslatorService {
    private _urlTranslators;
    /**
     * Registers a URL translator function.
     *
     * @param translatorFunction The translator function of the form function(url, options, successCallback, errorCallback, nextTranslator){}
     * @param order The order of the translator function.
     */
    registerUrlTranslator(translatorFunction: Function, order?: number): void;
    beginTranslateUrl(url: string, options?: any, callback?: IFunctionPR<string, any>, errorCallback?: IErrorCallback): void;
}
export function getTranslatorService(): UrlTranslatorService;
/**
 * Extract query parameters as a dictionary
 */
export function getQueryParameters(url: string): IDictionaryStringTo<string>;
/**
* A single query parameter entry in a Uri
*/
export interface IQueryParameter {
    /**
    * Unencoded name of the query parameter
    */
    name: string;
    /**
    * Unencoded value of the query parameter
    */
    value: string;
}
/**
* Options for parsing a Uri string
*/
export interface IUriParseOptions {
    /**
    * If true, throw if the Uri is not absolute
    */
    absoluteUriRequired?: boolean;
}
/**
* Class that represents a Uri and allows parsing/getting and setting of individual parts
*/
export class Uri {
    /**
    * The uri scheme such as http or https
    */
    scheme: string;
    /**
    * The uri hostname (does not include port or scheme)
    */
    host: string;
    /**
    * The port number of the uri as supplied in the url. 0 if left out in the url (e.g. the default port for the scheme).
    */
    port: number;
    /**
    * The relative path of the uri
    */
    path: string;
    /**
    * The array of query parameters in the uri
    */
    queryParameters: IQueryParameter[];
    /**
    * The hash string of the uri
    */
    hashString: string;
    /**
    * Parse a uri string into a Uri member
    *
    * @param uri Uri string to parse
    * @param options Options for parsing the uri string
    */
    static parse(uri: string, options?: IUriParseOptions): Uri;
    /**
    * Create a new Uri.
    *
    * @param uri Optional uri string to populate values with
    */
    constructor(uri?: string);
    private _setFromUriString(uriString, options?);
    /**
    * Get the absolute uri string for this Uri
    */
    /**
    * Set the absolute uri string for this Uri. Replaces all existing values
    */
    absoluteUri: string;
    /**
    * Get the query string for this Uri.
    */
    /**
    * Set the query string for this Uri. Replaces existing value
    */
    queryString: string;
    /**
    * Get the value of the query parameter with the given key
    *
    * @param name Query parameter name
    */
    getQueryParam(name: string): string;
    /**
    * Adds a query string parameter to the current uri
    *
    * @param name The Query parameter name
    * @param value The Query parameter value
    * @param replaceExisting If true, replace all existing parameters with the same name
    */
    addQueryParam(name: string, value: string, replaceExisting?: boolean): void;
}
}
declare module "VSS/VSS" {
export var uiCulture: string;
export var errorHandler: ErrorHandler;
export var globalProgressIndicator: GlobalProgressIndicator;
export var activtyStatsCollector: ActivtyStatsCollector;
/**
 * @param data
 */
export function queueCallbacks(context: any, callback: IResultCallback, errorCallback: IErrorCallback, data?: any): IQueueCallbacksResult;
export interface IQueueCallbacksResult {
    cookie: number;
    count: IFunctionPR<void, number>;
    finish: IArgsFunctionR<void>;
    error: IArgsFunctionR<void>;
    register: (callback: IResultCallback, errorCallback: IErrorCallback, data: any) => number;
    unregister: (cookie: number) => void;
}
/**
 * Queues a request for a piece of data.  Handles situations where the data has already been
 * retrieved as well as when multiple requests are pending for the same data.  When the data has
 * already been retrieved, the successCallback will be invoked immediately.  When multiple
 * requests are pending for the same data, each of the callers will be notified when the data
 * request has been completed (worker will only be invoked once).
 *
 * Sample usage:  This will invoke the worker function using the current object as the context.  The "_teamSettings"
 *                property of the current object will be checked for a value before invoking the worker.  If the value
 *                needs to be looked up, the worker will be invoked and it will make a request for the data.  If the
 *                request is completed successfully the data is passed to the succeeded callback.  If there is an error
 *                with the request the failed callback is invoked.
 *
 *     queueRequest(this, this, "_teamSettings", successCallback, errorCallback,
 *         function (succeeded, failed) {
 *             Ajax.getMSJSON(url, null, function (teamSettings) {
 *                 succeeded(teamSettings);
 *             }, failed);
 *         });
 *
 * @param context The "this" that the worker and successCallback functions will be invoked with.
 * @param target
 * The object which the propName property should be checked on to see if the request has already been performed.
 * If the property has a value (that is not a function), then the success callback is invoked immediately with the properties value as the result.
 * If the property does not have a value, the request is processed and the result is stored in the property.
 *
 * @param propName Name of the property on the target to store the result in and check to see if the request is needed.
 * @param successCallback Function invoked when the request is completed.  The function should take the "result" as its first parameter.
 * @param errroCallback Function invoked when the request has completed with an error. The function should take the "error" as its first parameter.
 * @param worker
 * This is the which performs the work to retrieve the data.  The function should have the following signature:
 *     function worker(succeeded, failed)
 *
 * The worker should invoke the "succeeded" function that it is provided passing it the result.  If an error occurs the worker should invoke the
 * "failed" function with the error.
 *
 * NOTE: It is important to note that the "successCallback" is not the same as the "succeeded" callback provided to the worker
 *       function.  It is important for the worker to invoke the callbacks it is provided with rather than the callbacks which are
 *       provided to the queueRequest method.  The same holds true for the failed callback provided to the worker function.
 *
 */
export function queueRequest(context: any, target: any, propName: string, successCallback: IResultCallback, errorCallback: IErrorCallback, worker: IResultCallback): void;
/**
 * Checks if a queued request has been completed.
 *
 * @param cachedResult The property passed to queueRequest as target[propName]
 */
export function queuedRequestHasResult(cachedResult: any): boolean;
export function getErrorMessage(errorString: string): string;
export function getErrorMessage(errorFunction: Function): string;
export function getErrorMessage(error: Error): string;
export interface errorPublisher {
    publishError(error: TfsError): void;
}
export class ErrorHandler {
    $error: JQuery;
    visible: boolean;
    private _errorPublishers;
    /**
     * Global error handler class which is attached to TFS
     */
    constructor();
    /**
     * (Internal function) Initializes error handler
     */
    initialize(): void;
    private attachWindowErrorHandler();
    static ignoreRejectedPromiseTag: string;
    private attachQPromiseErrorHandler();
    private publishError(error);
    /**
     * (Internal function) Checks whether error container exists or not
     */
    exists(): boolean;
    /**
     * (Internal function) Shows error in the container
     */
    showError(message: string, status?: string, stackTrace?: string): void;
    /**
     * (Internal function) Hides the error when clicked
     */
    hideError(): void;
    /**
     * Displays error in a container. If no container is found, error
     * message is displayed in an alert dialog
     */
    show(error: TfsError): void;
    /**
     * Add error publisher to ErrorHander class
     */
    attachErrorPublisher(errorPublisher: errorPublisher): void;
    /**
     * Remove error publisher to ErrorHander class
     */
    detachErrorPublisher(errorPublisher: errorPublisher): void;
}
/**
 * @param callback
 * @param context
 */
export function handleError(error: TfsError, callback?: IErrorCallback, context?: any): void;
/**Remove in M91 **/
export class ClientActivtyStatistic {
    name: string;
    id: string;
    parentId: string;
    startOffset: number;
    duration: number;
    constructor();
}
export class ActivtyStatistic {
    name: string;
    id: string;
    parentId: string;
    status: number;
    actionDate: Date;
    constructor();
}
export interface ActivtyStatsCollectionAllowedCallback {
    (): boolean;
}
export class ActivtyStatsCollector {
    static ACTIVITY_COLLECTION_STATUS: string;
    static ACTIVITY_ID_STORAGE_ITEM: string;
    static ACTIVITY_CLIENT_STATE_STORAGE_ITEM: string;
    static CURRENT_PAGE: string;
    /**
     * Global handler for logging activity data
     */
    constructor();
    addActivtyStatsCollectionAllowedCallback(activtyStatsCollectionAllowedCallback: ActivtyStatsCollectionAllowedCallback): void;
    actionStarted(name: string): number;
    actionCompleted(id: number, jqXHR: JQueryXHR): void;
    logActivity(activityId: string, page: string): void;
    getClientStatistics(): IDictionaryStringTo<ClientActivtyStatistic[]>;
    getActivtyStatistics(): ActivtyStatistic[];
    clearStats(): void;
    collectStats(shouldCollect: boolean): void;
    getCurrentPage(): ActivtyStatistic;
    setCurrentPage(currentPage: ActivtyStatistic): void;
    isCollectingStats(): boolean;
}
export class GlobalProgressIndicator {
    private _progressPendingActions;
    private _progressPendingActionsCount;
    private _progressPendingActionsNewId;
    private _pageProgressElements;
    private _pageProgressDelayShowTimeout;
    private _pageProgressMinShowTimeout;
    private _showingProgress;
    /**
     * Global handler for displaying progress during page loads, module_ loads, ajax requests, or any other registered long-running operations
     */
    constructor();
    getProgressElements(): JQuery[];
    registerProgressElement(element: JQuery): void;
    unRegisterProgressElement(element: JQuery): void;
    private _addProgressElement(element);
    private _showProgressElements();
    private _hideProgressElements();
    actionStarted(name: string, immediate?: boolean): number;
    actionCompleted(id: number): void;
    getPendingActions(): string[];
}
export function hasUnloadRequest(): boolean;
export function classExtend(ctor: any, members: any): any;
export function getTypeName(type: any): string;
export function initClassPrototype(ctor: Function, members: any): void;
export function getModuleBase(moduleName: string): string;
/**
* Issue a require statement for the specified modules and invoke the given callback method once available.
* This is a wrapper around the requireJS 'require' statement which ensures that the missing modules are
* pulled in via the minimum number of resource requests.
*
* @param moduleNames An array of AMD modules to asynchronously require
* @param callback Method to invoke once the modules have been resolved.
*/
export function using(moduleNames: string[], callback: Function): void;
export function tfsModuleLoaded(moduleName: string, moduleExports: any): void;
}
declare module "VSS/WebApi/Constants" {
export module AccessMappingConstants {
    var PublicAccessMappingMoniker: string;
    var ServerAccessMappingMoniker: string;
    var ClientAccessMappingMoniker: string;
    var HostGuidAccessMappingMoniker: string;
    var RootDomainMappingMoniker: string;
    var AzureInstanceMappingMoniker: string;
}
export module AuthenticationResourceIds {
    var AuthenticationLocationId: string;
    var AreaId: string;
    var AuthenticationAreaName: string;
    var SessionTokenResource: string;
}
export module BlobCopyLocationIds {
    var ResourceId: string;
    var ResourceString: string;
    var ResouceName: string;
    var AreaName: string;
}
export module CommonIdentityPickerResourceIds {
    var IdentitiesLocationId: string;
    var IdentityAvatarLocationId: string;
    var IdentityFeatureMruLocationId: string;
    var IdentityConnectionsLocationId: string;
    var ServiceArea: string;
    var IdentitiesResource: string;
}
export module ContributionsResourceIds {
    var DataProvidersQueryLocationId: string;
    var InstalledAppsLocationId: string;
    var InstalledAppsByNameLocationId: string;
    var VDiscId: string;
    var VersionDiscoveryLocationId: string;
    var VDiscCompatLocationId: string;
    var AreaId: string;
    var ContributionsAreaName: string;
    var ExtensionsAreaName: string;
    var DataProvidersQueryLocationIdString: string;
    var InstalledExtensionsLocationIdString: string;
    var InstalledExtensionsByNameLocationIdString: string;
    var VersionDiscoveryLocationIdString: string;
    var VDiscCompatLocationIdString: string;
}
export module CustomerIntelligenceResourceIds {
    var EventsLocationId: string;
    var AreaId: string;
    var CustomerIntelligenceAreaName: string;
}
export module DatabaseMigrationLocationIds {
    var ResourceId: string;
    var ResourceString: string;
    var ResouceName: string;
    var AreaName: string;
}
/**
* Mustache items names available in replacement oject while resolving a mustache template
*/
export module ExtensionTemplateContextItemNames {
    var ServiceInstanceType: string;
}
export module FeatureAvailabilityResourceIds {
    var FeatureFlagsLocationId: string;
    var AreaId: string;
    var FeatureAvailabilityAreaName: string;
}
export module IdentityMruResourceIds {
    var MruIdentitiesLocationId: string;
    var AreaId: string;
    var AreaName: string;
    var MruIdentitiesResource: string;
}
export module LocationResourceIds {
    var ConnectionData: string;
    var ServiceDefinitions: string;
    var AccessMappings: string;
    var LocationServiceArea: string;
    var ConnectionDataResource: string;
    var ServiceDefinitionsResource: string;
    var AccessMappingsResource: string;
}
export module OperationsResourceIds {
    var OperationsLocationId: string;
    var AreaName: string;
    var OperationsResource: string;
    var OperationsRouteName: string;
    var OperationsApi: string;
}
export module ServiceInstanceTypes {
    var SPS: string;
    var TFS: string;
    var TFSOnPremises: string;
    var SpsExtension: string;
    var SDKSample: string;
    var SPSString: string;
    var TFSString: string;
    var TFSOnPremisesString: string;
    var SpsExtensionString: string;
    var SDKSampleString: string;
}
}
declare module "VSS/WebApi/Contracts" {
import VSS_Licensing_Contracts = require("VSS/Licensing/Contracts");
/**
 * Information about the location of a REST API resource
 */
export interface ApiResourceLocation {
    /**
     * Area name for this resource
     */
    area: string;
    /**
     * Unique Identifier for this location
     */
    id: string;
    /**
     * Maximum api version that this resource supports (current server version for this resource)
     */
    maxVersion: string;
    /**
     * Minimum api version that this resource supports
     */
    minVersion: string;
    /**
     * The latest version of this resource location that is in "Release" (non-preview) mode
     */
    releasedVersion: string;
    /**
     * Resource name
     */
    resourceName: string;
    /**
     * The current resource version supported by this resource location
     */
    resourceVersion: number;
    /**
     * This location's route template (templated relative path)
     */
    routeTemplate: string;
}
/**
 * Represents version information for a REST Api resource
 */
export interface ApiResourceVersion {
    /**
     * String representation of the Public API version. This is the version that the public sees and is used for a large group of services (e.g. the TFS 1.0 API)
     */
    apiVersion: string;
    /**
     * Is the public API version in preview
     */
    isPreview: boolean;
    /**
     * Internal resource version. This is defined per-resource and is used to support build-to-build compatibility of API changes within a given (in-preview) public api version. For example, within the TFS 1.0 API release cycle, while it is still in preview, a resource's data structure may be changed. This resource can be versioned such that older clients will still work (requests will be sent to the older version) and new/upgraded clients will talk to the new version of the resource.
     */
    resourceVersion: number;
}
export enum ConnectOptions {
    /**
     * Retrieve no optional data.
     */
    None = 0,
    /**
     * Includes information about AccessMappings and ServiceDefinitions.
     */
    IncludeServices = 1,
    /**
     * Includes the last user access for this host.
     */
    IncludeLastUserAccess = 2,
}
export interface ExtensionLicenseData {
    createdDate: Date;
    extensionId: string;
    isFree: boolean;
    minimumRequiredAccessLevel: VSS_Licensing_Contracts.VisualStudioOnlineServiceLevel;
    updatedDate: Date;
}
export interface IdentityRef {
    displayName: string;
    id: string;
    imageUrl: string;
    isAadIdentity: boolean;
    isContainer: boolean;
    profileUrl: string;
    uniqueName: string;
    url: string;
}
/**
 * The JSON model for JSON Patch Operations
 */
export interface JsonPatchDocument {
}
/**
 * The JSON model for a JSON Patch operation
 */
export interface JsonPatchOperation {
    /**
     * The path to copy from for the Move/Copy operation.
     */
    from: string;
    /**
     * The patch operation
     */
    op: Operation;
    /**
     * The path for the operation
     */
    path: string;
    /**
     * The value for the operation. This is either a primitive or a JToken.
     */
    value: any;
}
export interface JsonWebToken {
}
export enum JWTAlgorithm {
    None = 0,
    HS256 = 1,
    RS256 = 2,
}
export enum Operation {
    Add = 0,
    Remove = 1,
    Replace = 2,
    Move = 3,
    Copy = 4,
    Test = 5,
}
export interface Publisher {
    /**
     * Name of the publishing service.
     */
    name: string;
    /**
     * Service Owner Guid Eg. Tfs : 00025394-6065-48CA-87D9-7F5672854EF7
     */
    serviceOwnerId: string;
}
/**
 * The class to represent a REST reference link.  Example: { self: { href: "http://localhost:8080/tfs/DefaultCollection/_apis/wit/workItems/1" } }  RFC: http://tools.ietf.org/html/draft-kelly-json-hal-06  The RFC is not fully implemented, additional properties are allowed on the reference link but as of yet we don't have a need for them.
 */
export interface ReferenceLink {
    href: string;
}
export interface ResourceRef {
    id: string;
    url: string;
}
export interface ServiceEvent {
    /**
     * This is the id of the type. Constants that will be used by subscribers to identify/filter events being published on a topic.
     */
    eventType: string;
    /**
     * This is the service that published this event.
     */
    publisher: Publisher;
    /**
     * The resource object that carries specific information about the event. The object must have the ServiceEventObject applied for serialization/deserialization to work.
     */
    resource: any;
    /**
     * This dictionary carries the context descriptors along with their ids.
     */
    resourceContainers: {
        [key: string]: any;
    };
    /**
     * This is the version of the resource.
     */
    resourceVersion: string;
}
export interface VssJsonCollectionWrapper extends VssJsonCollectionWrapperBase {
    value: any[];
}
/**
 * This class is used to serialized collections as a single JSON object on the wire, to avoid serializing JSON arrays directly to the client, which can be a security hole
 */
export interface VssJsonCollectionWrapperV<T> extends VssJsonCollectionWrapperBase {
    value: T;
}
export interface VssJsonCollectionWrapperBase {
    count: number;
}
export interface WrappedException {
    customProperties: {
        [key: string]: any;
    };
    errorCode: number;
    eventId: number;
    helpLink: string;
    innerException: WrappedException;
    message: string;
    stackTrace: string;
    typeKey: string;
    typeName: string;
}
export var TypeInfo: {
    ApiResourceLocation: {
        fields: any;
    };
    ApiResourceVersion: {
        fields: any;
    };
    ConnectOptions: {
        enumValues: {
            "none": number;
            "includeServices": number;
            "includeLastUserAccess": number;
        };
    };
    ExtensionLicenseData: {
        fields: any;
    };
    IdentityRef: {
        fields: any;
    };
    JsonPatchDocument: {
        fields: any;
    };
    JsonPatchOperation: {
        fields: any;
    };
    JsonWebToken: {
        fields: any;
    };
    JWTAlgorithm: {
        enumValues: {
            "none": number;
            "hS256": number;
            "rS256": number;
        };
    };
    Operation: {
        enumValues: {
            "add": number;
            "remove": number;
            "replace": number;
            "move": number;
            "copy": number;
            "test": number;
        };
    };
    Publisher: {
        fields: any;
    };
    ReferenceLink: {
        fields: any;
    };
    ResourceRef: {
        fields: any;
    };
    ServiceEvent: {
        fields: any;
    };
    VssJsonCollectionWrapper: {
        fields: any;
    };
    VssJsonCollectionWrapperV: {
        fields: any;
    };
    VssJsonCollectionWrapperBase: {
        fields: any;
    };
    WrappedException: {
        fields: any;
    };
};
}
declare module "VSS/WebApi/RestClient" {
import Q = require("q");
import Serialization = require("VSS/Serialization");
import WebApi_Contracts = require("VSS/WebApi/Contracts");
/**
* Parameters for sending a WebApi request
*/
export interface VssApiResourceRequestParams {
    /**
    * Name of the area for the resource
    */
    area: string;
    /**
    * Unique identifier for the resource's route to issue a request to. Used to lookup the route template
    * for this request if the routeTemplate parameter is not supplied or for version negotiation in S2S calls.
    * This is required to ensure any S2S calls work.
    */
    locationId: string;
    /**
    * Route template that is used to form the request path. If routeTemplate is NOT specified, then locationId
    * is used to lookup the template via an OPTIONS request.
    */
    routeTemplate?: string;
    /**
    * Name of the resource to use in route template replacements. Only used if routeTemplate is provided.
    */
    resource?: string;
    /**
    * Dictionary of route template replacement values
    */
    routeValues?: {
        [key: string]: any;
    };
    /**
    * Data to post. In this case of a GET, this indicates query parameters.
    * For other requests, this is the request body object (which will be serialized
    * into a JSON string unless isRawData is set to true).
    */
    data?: any;
    /**
    * Query parameters to add to the url. In the case of a GET, query parameters can
    * be supplied via 'data' or 'queryParams'. For other verbs such as POST, the
    * data object specifies the POST body, so queryParams is needed to indicate
    * parameters to add to the query string of the url (not included in the post body).
    */
    queryParams?: IDictionaryStringTo<any>;
    /**
    * HTTP verb (GET by default if not specified)
    */
    httpMethod?: string;
    /**
    * The http response (Accept) type. This is "json" (corresponds to application/json Accept header)
    * unless otherwise specified. Other possible values are "html", "text", "zip", or "binary" or their accept
    * header equivalents (e.g. application/zip).
    */
    httpResponseType?: string;
    /**
    * Contract metadata for the request body. This allows us to do the necessary serialization
    * for the provided 'data' object using VSS serialization settings.
    */
    requestType?: Serialization.ContractMetadata;
    /**
    * Contract metadata for the response. This allows us to do the necessary deserialization
    * for the response object using VSS serialization settings.
    */
    responseType?: Serialization.ContractMetadata;
    /**
    * Indicates that the response is expected to be a wrapped array, so unwrap the response to
    * a regular array.
    */
    responseIsCollection?: boolean;
    /**
    * Allows the caller to specify custom request headers.
    */
    customHeaders?: {
        [headerName: string]: any;
    };
    /**
    * Request timeout in milliseconds. The default is 5 minutes.
    */
    timeout?: number;
    /**
    * The api version string to send in the request (e.g. "1.0" or "2.0-preview.2")
    */
    apiVersion?: string;
    /**
    * If true, this indicates that no processing should be done on the 'data' object
    * before it is sent in the request. *This is rarely needed*. One case is when posting
    * an HTML5 File object.
    */
    isRawData?: boolean;
}
export interface IVssHttpClientOptions {
    /**
     * If true, the progress indicator will be shown while the request is executing. Defaults to true.
     */
    showProgressIndicator?: boolean;
}
/**
* Base class that should be used (derived from) to make requests to VSS REST apis
*/
export class VssHttpClient {
    private static APIS_RELATIVE_PATH;
    private static DEFAULT_REQUEST_TIMEOUT;
    private static _legacyDateRegExp;
    private static cacheFromJsonIslands;
    private _locationsByAreaPromises;
    _rootRequestPath: string;
    authTokenManager: IAuthTokenManager<any>;
    private _initializationPromise;
    forceOptionsCallForAutoNegotiate: boolean;
    private _options;
    constructor(rootRequestPath: string, options?: IVssHttpClientOptions);
    /**
     * Sets a promise that is waited on before any requests are issued. Can be used to asynchronously
     * set the request url and auth token manager.
     */
    _setInitializationPromise(promise: IPromise<any>): void;
    /**
    * Issue a request to a VSS REST endpoint.
    *
    * @param requestParams request options
    * @param useAjaxResult If true, textStatus and jqXHR are added to the success callback. In this case, spread (instead of then) needs to be used
    * @returns Q Promise for the response
    */
    _beginRequest<T>(requestParams: VssApiResourceRequestParams, useAjaxResult?: boolean): IPromise<T>;
    _autoNegotiateApiVersion(location: WebApi_Contracts.ApiResourceLocation, requestedVersion: string): string;
    private _beginRequestToResolvedUrl<T>(requestUrl, apiVersion, requestParams, deferred, useAjaxResult);
    /**
    * Issue a request to a VSS REST endpoint and makes sure the result contains jqXHR. Use spread to access jqXHR.
    *
    * @param requestParams request options
    * @returns Q Promise for the response
    */
    _beginRequestWithAjaxResult<T>(requestParams: VssApiResourceRequestParams): Q.Promise<T>;
    /**
     * Issue an AJAX request. This is a wrapper around jquery's ajax method that handles VSS authentication
     * and triggers events that can be listened to by other modules.
     *
     * @param requestUrl Url to send the request to
     * @param ajaxOptions jQuery.ajax options
     * @param useAjaxResult If true, textStatus and jqXHR are added to the success callback. In this case, spread (instead of then) needs to be used.
     */
    _issueAjaxRequest(requestUrl: string, ajaxOptions: JQueryAjaxSettings, useAjaxResult?: boolean, vssRequestOptions?: IVssAjaxOptions): IPromise<any>;
    /**
     * Gets information about an API resource location (route template, supported versions, etc.)
     *
     * @param area resource area name
     * @param locationId Guid of the location to get
     */
    _beginGetLocation(area: string, locationId: string): IPromise<WebApi_Contracts.ApiResourceLocation>;
    private static processOptionsRequestResponse(locationsResult?, textStatus?, jqXHR?);
    private static initializeLocationsByAreaJsonIslandCacheIfNecessary();
    private static createLocationsByAreaPromisesCache();
    private beginGetAreaLocations(area);
    protected getRequestUrl(routeTemplate: string, area: string, resource: string, routeValues: any, queryParams?: IDictionaryStringTo<any>): string;
    private replaceRouteValues(routeTemplate, routeValues);
    _getLinkResponseHeaders(xhr: XMLHttpRequest): {
        [relName: string]: string;
    };
}
}
