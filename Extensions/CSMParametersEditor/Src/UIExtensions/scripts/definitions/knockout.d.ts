// Type definitions for Knockout 2.2
// Project: http://knockoutjs.com
// Definitions by: Boris Yankov <https://github.com/borisyankov/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped
// Modified: Windows Azure Framework <http://www.windowsazure.com>

interface KnockoutDisposable {
    dispose(): void;
}

interface KnockoutSubscription<T> extends KnockoutDisposable {
    callback(value: T): void;
    disposeCallback(): void;
    target: KnockoutObservableBase<T>;
    isDisposed?: boolean;
}

interface KnockoutObservableBase<T> extends KnockoutSubscribable<T> {
    peek(): T;
    (): T;
    (value: T): void;
}

interface KnockoutComputedOptions<T> {
    read?: () => T;
    write?: (value: T, args: any) => void;
    owner?: any;
    disposeWhenNodeIsRemoved?: Element;
    disposeWhen? (): boolean;
    deferEvaluation?: boolean;
}

interface KnockoutComputed<T> extends KnockoutObservableBase<T>, KnockoutDisposable {
    getDependenciesCount(): number;
    hasWriteFunction(): boolean;
    isActive(): boolean;
    dispose(): void; // Double-declaration is workaround for TypeScript bug with interface multiple inheritance
}

interface KnockoutComputedStatic {
    fn: KnockoutComputed<any>;

    <T>(func: () => T, context?: any, options?: KnockoutComputedOptions<T>): KnockoutComputed<T>;
    <T>(options?: KnockoutComputedOptions<T>): KnockoutComputed<T>;
}

interface KnockoutObservable<T> extends KnockoutObservableBase<T> {
    equalityComparer(a: T, b: T): boolean;
    valueHasMutated(): void;
    valueWillMutate(): void;
}

interface KnockoutObservableArray<T> extends KnockoutObservable<T[]> {
    // General Array functions
    indexOf(searchElement: T, fromIndex?: number): number;
    slice(start: number, end?: number): T[];
    splice(start: number, deleteCount?: number, ...items: T[]): T[];
    pop(): T;
    push(...items: T[]): void;
    shift(): T;
    unshift(...items: T[]): number;
    reverse(): T[];
    sort(compareFunction?: (a: T, b: T) => number): void;

    // Ko specific
    replace(oldItem: T, newItem: T): void;

    remove(item: T): T[];
    remove(predicate: (item: T) => boolean): T[];
    removeAll(items?: T[]): T[];

    destroy(item: T): void;
    destroyAll(items?: T[]): void;

    subscribeArrayChanged(itemAddedCallback: (addedItem: T) => void, itemRemovedCallback: (removedItem: T) => void, context?: any): KnockoutSubscription<T>[];
}

interface KnockoutObservableArrayStatic {
    fn: KnockoutObservableArray<any>;

    <T>(value?: T[]): KnockoutObservableArray<T>;
}

interface KnockoutSubscribable<T> {
    extend(source: any): KnockoutObservableBase<T>;
    getSubscriptionsCount(): number;
    subscribe(callback: (newValue: T) => void, target?: any, topic?: string): KnockoutSubscription<T>;
    notifySubscribers(valueToWrite: T, topic?: string): void;
}

interface KnockoutObservableStatic {
    fn: KnockoutObservable<any>;

    <T>(value?: T): KnockoutObservable<T>;
}

interface KnockoutBindingContext {
    $parent: any;
    $parents: any[];
    $root: any;
    $data: any;
    $index?: number;
    $parentContext?: KnockoutBindingContext;

    extend(properties: any): KnockoutBindingContext;
    createChildContext(dataItem: any, dataItemAlias?: any): KnockoutBindingContext;
}

interface KnockoutBindingHandler {
    init? (element: any, valueAccessor: () => any, allBindingsAccessor: () => any, viewModel: any, bindingContext: KnockoutBindingContext): void;
    update? (element: any, valueAccessor: () => any, allBindingsAccessor: () => any, viewModel: any, bindingContext: KnockoutBindingContext): void;
    options?: any;
}

interface KnockoutBindingHandlers {
    visible: KnockoutBindingHandler;
    text: KnockoutBindingHandler;
    html: KnockoutBindingHandler;
    css: KnockoutBindingHandler;
    style: KnockoutBindingHandler;
    attr: KnockoutBindingHandler;

    foreach: KnockoutBindingHandler;
    if: KnockoutBindingHandler;
    ifnot: KnockoutBindingHandler;
    with: KnockoutBindingHandler;

    click: KnockoutBindingHandler;
    event: KnockoutBindingHandler;
    submit: KnockoutBindingHandler;
    enable: KnockoutBindingHandler;
    disable: KnockoutBindingHandler;
    value: KnockoutBindingHandler;
    hasfocus: KnockoutBindingHandler;
    checked: KnockoutBindingHandler;
    options: KnockoutBindingHandler;
    selectedOptions: KnockoutBindingHandler;
    uniqueName: KnockoutBindingHandler;

    template: KnockoutBindingHandler;

    [key: string]: KnockoutBindingHandler;
}

interface KnockoutMemoization {
    memoize(callback: Function): string;
    unmemoize(memoId: string, callbackParams?: any[]): boolean;
    unmemoizeDomNodeAndDescendants(domNode: Element, extraCallbackParamsArray?: any[]): void;
    parseMemoText(memoText: string): string;
}

interface KnockoutExtenders {
    throttle<T>(target: any, timeout: number): KnockoutComputed<T>;
    notify(target: any, notifyWhen: string): any;
}

interface KnockoutArrayEdit<T> {
    status: string;
    index: number;
    moved: number;
    value: T;
}

interface KnockoutUtils {
    parseHtmlFragment(html: string): Element[];
    setHtml(node: Element, html: string): void;

    domData: {
        get(node: Element, key: string): any;
        set(node: Element, key: string, value: any): void;
        getAll(node: Element, createIfNotFound?: boolean): any;
        clear(node: Element): boolean;
    };

    domNodeDisposal: {
        addDisposeCallback(node: Element, callback: (node: Element) => void): void;
        removeDisposeCallback(node: Element, callback: (node: Element) => void): void;
    };

    fieldsIncludedWithJsonPost: any[];
    arrayForEach<T>(array: T[], action: (item: T) => void): void;
    arrayIndexOf<T>(array: T[], item: T): number;
    arrayFirst<T>(array: T[], predicate: (item: T) => boolean, predicateOwner?: any): T;
    arrayRemoveItem<T>(array: T[], itemToRemove: T): void;
    arrayGetDistinctValues<T>(array: T[]): T[];
    arrayMap<T, U>(array: T[], mapping: (item: T) => U): U[];
    arrayFilter<T>(array: T[], predicate: (item: T) => boolean): T[];
    arrayPushAll<T>(array: T[], valuesToPush: T[]): T[];
    arrayPushAll<T>(array: KnockoutObservableArray<T>, valuesToPush: T[]): KnockoutObservableArray<T>;
    compareArrays<T>(oldArray: T[], newArray: T[], dontLimitMoves?: boolean): KnockoutArrayEdit<T>[];
    extend(target: any, source: any): any;
    emptyDomNode(domNode: Element): void;
    moveCleanedNodesToContainerElement(nodes: Element[]): Element;
    cloneNodes(nodesArray: Element[], shouldCleanNodes?: boolean): Element[];
    setDomNodeChildren(domNode: Element, childNodes: Element[]): void;
    replaceDomNodes(nodeToReplaceOrNodeArray: Element[], newNodesArray: Element[]): void;
    setOptionNodeSelectionState(optionNode: any, isSelected: boolean): void;
    stringTrim(str: string): string;
    stringTokenize(str: string, delimiter: string): string[];
    stringStartsWith(str: string, startsWith: string): boolean;
    domNodeIsContainedBy(node: Element, containedByNode: Element): boolean;
    domNodeIsAttachedToDocument(node: Element): boolean;
    tagNameLower(element: Element): string;
    registerEventHandler(element: Element, eventType: string, handler: Function): void;
    triggerEvent(element: Element, eventType: string): void;
    unwrapObservable(value: any): any;
    peekObservable(value: any): any;
    toggleDomNodeCssClass(node: Element, classNames: string, shouldHaveClass?: boolean): void;
    setElementName(element: Element, name: string): void;
    forceRefresh(node: Element): void;
    ensureSelectElementIsRenderedCorrectly(selectElement: Element): void;
    range(min: KnockoutObservable<number>, max: KnockoutObservable<number>): number[];
    range(min: number, max: number): number[];
    makeArray<T>(arrayLikeObject: { [index: number]: T; length: number; }): T[];
    isIe6: boolean;
    isIe7: boolean;
    ieVersion: number;
    getFormFields(form: Element, fieldName: string): Element[];
    parseJson(jsonString: string): any;
    stringifyJson<T>(data: KnockoutObservable<T>, replacer?: (key: string, value: any) => any, space?: any): string;
    stringifyJson<T>(data: KnockoutObservable<T>, replacer?: any[], space?: any): string;
    stringifyJson(data: any, replacer?: (key: string, value: any) => any, space?: any): string;
    stringifyJson(data: any, replacer?: any[], space?: any): string;
    postJson(urlOrForm: string, data: any, options?: any): void;
    postJson(urlOrForm: Element, data: any, options?: any): void;
}

interface KnockoutVirtualElements {
    allowedBindings: any;
    childNodes: (node: Element) => Element[];
    emptyNode: (node: Element) => void;
    setDomNodeChildren: (node: Element, childNodes: Element[]) => void;
    prepend: (containerNode: Element, nodeToPrepend: Element) => void;
    insertAfter: (containerNode: Element, nodeToInsert: Element, insertAfterNod: Element) => void;
    firstChild: (node: Element) => Element;
    nextSibling: (node: Element) => Element;
    virtualNodeBindingValue: (node: Element) => string;
    normaliseVirtualElementDomStructure: (elementVerified: Element) => void;
}

interface KnockoutTemplateRewriting {
    ensureTemplateIsRewritten(template: string, templateEngine: knockout.templateEngine, templateDocument?: Document): void;
    ensureTemplateIsRewritten(template: Element, templateEngine: knockout.templateEngine, templateDocument?: Document): void;
    memoizeBindingAttributeSyntax(htmlString: string, templateEngine: knockout.templateEngine): string;
    applyMemoizedBindingsToNextSibling(bindings: any): string;
}

interface KnockoutExpressionRewriting {
    bindingRewriteValidators: any;
    parseObjectLiteral(objectLiteralString: string): any;
    preProcessBindings(objectLiteralStringOrKeyValueArray: string): string;
    preProcessBindings(objectLiteralStringOrKeyValueArray: any): string;
}

interface KnockoutSubscribableStatic {
    fn: KnockoutSubscribable<any>;

    <T>(): KnockoutSubscribable<T>;
}

interface KnockoutTemplateSource {
    text(): string;
    text(value: string): void;
    data(key: string): string;
    data(key: string, value: string): void;
    nodes? (): Element;
    nodes? (value: Element): void;
}

interface KnockoutAnonymousTemplateSource extends KnockoutTemplateSource {
}

declare module knockout {
    export var bindingHandlers: KnockoutBindingHandlers;
    export var memoization: KnockoutMemoization;
    export var extenders: KnockoutExtenders;
    export var utils: KnockoutUtils;
    export var virtualElements: KnockoutVirtualElements;
    export var version: string;

    export function applyBindings(viewModel: any, rootNode?: any): void;
    export function applyBindingsToDescendants(viewModel: any, rootNode: any): void;
    export function applyBindingsToNode(node: Element, bindings: any, viewModel: any): void;

    export function observable<T>(data?: T): KnockoutObservable<T>;
    export function observable(data?: any): KnockoutObservableStatic;

    export function computed<T>(data?: () => T, instance?: any, options?: KnockoutComputedOptions<T>): KnockoutComputed<T>;
    export function computed<T>(options: KnockoutComputedOptions<T>): KnockoutComputed<T>;
    export function computed(): KnockoutComputedStatic;

    // export function observableArray<T>(data?: T[]): KnockoutObservableArray<T>;
    // export function observableArray(data?: any): KnockoutObservableArrayStatic;
    export var observableArray: KnockoutObservableArrayStatic;

    export function subscribable<T>(): KnockoutSubscribable<T>;
    export function subscribable(): KnockoutSubscribableStatic;

    export function contextFor(node: any): any;
    export function dataFor(node: any): any;
    export function isSubscribable(instance: any): boolean;
    export function toJS(rootObject: any): any;
    export function toJSON(rootObject: any, replacer?: (key: string, value: any) => any, space?: any): string;
    export function toJSON(rootObject: any, replacer?: any[], space?: any): string;
    export function isObservable(instance: any): boolean;
    export function isComputed(instance: any): boolean;
    export function cleanNode(node: Element): void;
    export function removeNode(node: Element): void;

    export var templateSources: {
        domElement: new (element: Element) => KnockoutTemplateSource;
        anonymousTemplate: new (element: Element) => KnockoutAnonymousTemplateSource;
    };

    export var templateRewriting: KnockoutTemplateRewriting;

    export function setTemplateEngine(templateEngine: templateEngine): void;
    export function renderTemplate(template: string, dataOrBindingContext: any, options?: any, targetNodeOrNodeArray?: Element, renderMode?: string): any;
    export function renderTemplate(template: string, dataOrBindingContext: any, options?: any, targetNodeOrNodeArray?: Element[], renderMode?: string): any;
    export function renderTemplate(template: (data: any, bindingContext: KnockoutBindingContext) => string, dataOrBindingContext: any, options?: any, targetNodeOrNodeArray?: Element, renderMode?: string): any;
    export function renderTemplate(template: (data: any, bindingContext: KnockoutBindingContext) => string, dataOrBindingContext: any, options?: any, targetNodeOrNodeArray?: Element[], renderMode?: string): any;
    export function renderTemplateForEach(template: string, arrayOrObservableArray: any[], options: any, targetNode: Element, parentBindingContext: KnockoutBindingContext): any;
    export function renderTemplateForEach(template: (value: any[], itemContext: any[]) => string, arrayOrObservableArray: any[], options: any, targetNode: Element, parentBindingContext: KnockoutBindingContext): any;

    export var expressionRewriting: KnockoutExpressionRewriting;

    export class bindingProvider {
        public nodeHasBindings(node: Element): boolean;
        public getBindings(node: Element, bindingContext: KnockoutBindingContext): any;
        private getBindingsString(node: Element, bindingContext: KnockoutBindingContext): string;
        private parseBindingsString(bindingsString: string, bindingContext: KnockoutBindingContext, node: Element): void;

        public static instance: bindingProvider;
    }

    export class templateEngine {
        public allowTemplateRewriting: boolean;
        public renderTemplateSource(templateSource: KnockoutTemplateSource, bindingContext: KnockoutBindingContext, options?: any): Element[];
        public createJavaScriptEvaluatorBlock(script: string): string;
        public makeTemplateSource(template: string, templateDocument?: Document): KnockoutTemplateSource;
        public makeTemplateSource(template: Element, templateDocument?: Document): KnockoutTemplateSource;
        public renderTemplate(template: string, bindingContext: KnockoutBindingContext, options?: any, templateDocument?: Document): Element[];
        public renderTemplate(template: Element, bindingContext: KnockoutBindingContext, options?: any, templateDocument?: Document): Element[];
        public isTemplateRewritten(template: string, templateDocument?: Document): boolean;
        public isTemplateRewritten(template: Element, templateDocument?: Document): boolean;
        public rewriteTemplate(template: string, rewriterCallback: (text: string) => string, templateDocument?: Document): void;
        public rewriteTemplate(template: Element, rewriterCallback: (text: string) => string, templateDocument?: Document): void;
    }

    // "extends templateEngine" isn't working... "type name 'templateEngine' in extends clause does not reference constructor function for 'templateEngine'"
    export class nativeTemplateEngine {
        public static instance: nativeTemplateEngine;

        public allowTemplateRewriting: boolean;
        public renderTemplateSource(templateSource: KnockoutTemplateSource, bindingContext: KnockoutBindingContext, options?: any): Element[];
        public createJavaScriptEvaluatorBlock(script: string): string;
        public makeTemplateSource(template: string, templateDocument?: Document): KnockoutTemplateSource;
        public makeTemplateSource(template: Element, templateDocument?: Document): KnockoutTemplateSource;
        public renderTemplate(template: string, bindingContext: KnockoutBindingContext, options?: any, templateDocument?: Document): Element[];
        public renderTemplate(template: Element, bindingContext: KnockoutBindingContext, options?: any, templateDocument?: Document): Element[];
        public isTemplateRewritten(template: string, templateDocument?: Document): boolean;
        public isTemplateRewritten(template: Element, templateDocument?: Document): boolean;
        public rewriteTemplate(template: string, rewriterCallback: (text: string) => string, templateDocument?: Document): void;
        public rewriteTemplate(template: Element, rewriterCallback: (text: string) => string, templateDocument?: Document): void;
    }

    export class jqueryTmplTemplateEngine {
        public addTemplate(templateName: string, templateMarkup: string): void;

        public allowTemplateRewriting: boolean;
        public renderTemplateSource(templateSource: KnockoutTemplateSource, bindingContext: KnockoutBindingContext, options?: any): Element[];
        public createJavaScriptEvaluatorBlock(script: string): string;
        public makeTemplateSource(template: string, templateDocument?: Document): KnockoutTemplateSource;
        public makeTemplateSource(template: Element, templateDocument?: Document): KnockoutTemplateSource;
        public renderTemplate(template: string, bindingContext: KnockoutBindingContext, options?: any, templateDocument?: Document): Element[];
        public renderTemplate(template: Element, bindingContext: KnockoutBindingContext, options?: any, templateDocument?: Document): Element[];
        public isTemplateRewritten(template: string, templateDocument?: Document): boolean;
        public isTemplateRewritten(template: Element, templateDocument?: Document): boolean;
        public rewriteTemplate(template: string, rewriterCallback: (text: string) => string, templateDocument?: Document): void;
        public rewriteTemplate(template: Element, rewriterCallback: (text: string) => string, templateDocument?: Document): void;
    }

}

declare module 'knockout' {
    export = knockout;
}