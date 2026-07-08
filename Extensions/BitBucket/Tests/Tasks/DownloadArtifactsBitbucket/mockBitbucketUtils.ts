import Q = require("q");
import events = require("events");

export const TestGuid: string = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

// Mock repository data returned by Bitbucket API
export const MockRepositoryResponse = {
    scm: "git",
    full_name: "testuser/testrepo",
    links: {
        clone: [
            { href: "https://bitbucket.org/testuser/testrepo.git", name: "https" },
            { href: "git@bitbucket.org:testuser/testrepo.git", name: "ssh" }
        ]
    }
};

export const MockRepositoryResponseMercurial = {
    scm: "hg",
    full_name: "testuser/testrepo-hg",
    links: {
        clone: [
            { href: "https://bitbucket.org/testuser/testrepo-hg", name: "https" }
        ]
    }
};

export const MockRepositoryNotFoundResponse = {
    type: "error",
    error: {
        message: "Repository not found"
    }
};

export const MockApiV1DeprecatedResponse = {
    type: "error",
    error: {
        message: "Resource removed",
        detail: "This API is no longer supported."
    }
};

export function _writeLine(str: string): void {
    console.log(str);
}

// Mock SourceControlWrapper for testing git/hg operations
export class MockSourceControlWrapper extends events.EventEmitter {
    public toolType: string;
    public username: string;
    public password: string;
    public cloneCalled: boolean = false;
    public checkoutCalled: boolean = false;
    public lastCloneArgs: any = {};
    public lastCheckoutRef: string = "";
    public shouldFail: boolean = false;
    public failMessage: string = "";

    constructor(toolType: string) {
        super();
        this.toolType = toolType;
        console.log(`SourceControlWrapper initialized with toolType: ${toolType}`);
    }

    clone(repository: string, progress: boolean, folder: string, options: any): Q.Promise<number> {
        var defer = Q.defer<number>();
        this.cloneCalled = true;
        this.lastCloneArgs = { repository, progress, folder, options };
        console.log(`git clone called: ${repository} -> ${folder}`);
        
        if (this.shouldFail) {
            defer.reject(new Error(this.failMessage || "Clone failed"));
        } else {
            defer.resolve(0);
        }
        return defer.promise;
    }

    checkout(ref: string, options?: any): Q.Promise<number> {
        var defer = Q.defer<number>();
        this.checkoutCalled = true;
        this.lastCheckoutRef = ref;
        console.log(`git checkout called: ${ref}`);
        
        if (this.shouldFail) {
            defer.reject(new Error(this.failMessage || "Checkout failed"));
        } else {
            defer.resolve(0);
        }
        return defer.promise;
    }

    fetch(args: string[], options?: any): Q.Promise<number> {
        var defer = Q.defer<number>();
        console.log(`git fetch called with args: ${args.join(' ')}`);
        defer.resolve(0);
        return defer.promise;
    }

    reset(args: string[], options?: any): Q.Promise<number> {
        var defer = Q.defer<number>();
        console.log(`git reset called with args: ${args.join(' ')}`);
        defer.resolve(0);
        return defer.promise;
    }
}

// Mock HTTPS module for API calls
export class MockHttpsResponse {
    public statusCode: number;
    public statusMessage: string;
    private data: string;
    private dataCallback: Function | null = null;
    private endCallback: Function | null = null;

    constructor(statusCode: number, statusMessage: string, data: any) {
        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
        this.data = typeof data === 'string' ? data : JSON.stringify(data);
    }

    on(event: string, callback: Function): void {
        if (event === 'data') {
            this.dataCallback = callback;
            // Simulate async data event
            setTimeout(() => {
                if (this.dataCallback) {
                    this.dataCallback(this.data);
                }
            }, 0);
        } else if (event === 'end') {
            this.endCallback = callback;
            // Simulate async end event after data
            setTimeout(() => {
                if (this.endCallback) {
                    this.endCallback();
                }
            }, 10);
        }
    }
}

export class MockHttpsRequest {
    private responseCallback: Function | null = null;
    private response: MockHttpsResponse;

    constructor(response: MockHttpsResponse) {
        this.response = response;
    }

    end(): void {
        if (this.responseCallback) {
            this.responseCallback(this.response);
        }
    }

    on(event: string, callback: Function): this {
        return this;
    }
}

export function createMockHttps(statusCode: number, responseData: any): any {
    return {
        request: function(options: any, callback: Function): MockHttpsRequest {
            console.log(`HTTPS request to: ${options.host}${options.path}`);
            const response = new MockHttpsResponse(statusCode, statusCode === 200 ? 'OK' : 'Error', responseData);
            const request = new MockHttpsRequest(response);
            (request as any).responseCallback = callback;
            return request;
        }
    };
}

// Mock shell module
export const mockShell = {
    removedPaths: [] as string[],
    currentDir: "",
    errorMessage: null as string | null,

    rm: function(flags: string, path: string): void {
        console.log(`shell.rm ${flags} ${path}`);
        this.removedPaths.push(path);
    },

    cd: function(path: string): void {
        console.log(`shell.cd ${path}`);
        this.currentDir = path;
    },

    error: function(): string | null {
        return this.errorMessage;
    },

    which: function(tool: string, silent?: boolean): string | null {
        console.log(`shell.which ${tool}`);
        return `/usr/bin/${tool}`;
    },

    reset: function(): void {
        this.removedPaths = [];
        this.currentDir = "";
        this.errorMessage = null;
    }
};

// Helper to create endpoint auth environment variables
export function setupTokenAuthEndpoint(endpointId: string, email: string, token: string): void {
    process.env[`ENDPOINT_AUTH_SCHEME_${endpointId}`] = "Token";
    process.env[`ENDPOINT_AUTH_PARAMETER_${endpointId}_APITOKEN`] = token;
    process.env[`ENDPOINT_AUTH_PARAMETER_${endpointId}_EMAIL`] = email;
}

export function setupUsernamePasswordAuthEndpoint(endpointId: string, username: string, password: string): void {
    process.env[`ENDPOINT_AUTH_SCHEME_${endpointId}`] = "UsernamePassword";
    process.env[`ENDPOINT_AUTH_PARAMETER_${endpointId}_USERNAME`] = username;
    process.env[`ENDPOINT_AUTH_PARAMETER_${endpointId}_PASSWORD`] = password;
}

export function cleanupEndpointEnvVars(endpointId: string): void {
    delete process.env[`ENDPOINT_AUTH_SCHEME_${endpointId}`];
    delete process.env[`ENDPOINT_AUTH_PARAMETER_${endpointId}_APITOKEN`];
    delete process.env[`ENDPOINT_AUTH_PARAMETER_${endpointId}_EMAIL`];
    delete process.env[`ENDPOINT_AUTH_PARAMETER_${endpointId}_USERNAME`];
    delete process.env[`ENDPOINT_AUTH_PARAMETER_${endpointId}_PASSWORD`];
}
