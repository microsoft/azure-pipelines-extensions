import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as providers from 'artifact-engine/Providers';
import { HttpClientResponse } from 'artifact-engine/Providers/typed-rest-client/HttpClient';
import * as tl from 'azure-pipelines-task-lib-nr-test/task';
import * as Q from 'q';

type BuildObject = {
    build_num: string;
    all_commit_details: CommitObject[];
};

type CommitObject = {
    id: string;
    commit: unknown;
    subject: unknown;
    author_name: unknown;
    commit_url: unknown;
    author_date: unknown;
};

export class CommitsDownloader {
    private webProvider: providers.WebProvider;
    private retryLimit: number;

    constructor(webProvider: providers.WebProvider) {
        this.webProvider = webProvider;
        let retryLimitValue: string = tl.getVariable("VSTS_HTTP_RETRY")!;
        this.retryLimit = (!!retryLimitValue && !isNaN(parseInt(retryLimitValue))) ? parseInt(retryLimitValue) : 4;
        tl.debug("RetryLimit set to: " + this.retryLimit);
    }

    public DownloadFromSingleBuildAndSave(buildId: string): Q.Promise<string> {
        let defer: Q.Deferred<string> = Q.defer<string>();

        console.log(tl.loc("GettingCommitsFromSingleBuild", buildId));
        this.GetCommitsFromSingleBuild(buildId).then((commits: string) => {
            this.UploadCommits(commits).then(() => {
                defer.resolve(commits);
            }, (error) => {
                defer.reject(error);
            });
        }, (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    public DownloadFromBuildRangeAndSave(startBuildId: string, endBuildId: string): Q.Promise<string> {
        let defer: Q.Deferred<string> = Q.defer<string>();

        console.log(tl.loc("DownloadingCircleCICommitsBetween", startBuildId, endBuildId));
        this.GetCommits(startBuildId, endBuildId).then((commits: string) => {
            this.UploadCommits(commits).then(() => {
                defer.resolve(commits);
            }, (error) => {
                defer.reject(error);
            });
        }, (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    private GetCommitsFromSingleBuild(buildId: string): Q.Promise<string> {
        let connection = tl.getInput("connection", true)!;
        let definitionId = tl.getInput("definition", true);
        var endpointUrl = tl.getEndpointUrl(connection, false);
        let defer = Q.defer<string>();
        let url: string = `${endpointUrl}/api/v1.1/project/${definitionId}/${buildId}`;
        url = url.replace(/([^:]\/)\/+/g, "$1");

        this.executeWithRetries("getCommitsFromSingleBuild", (url, headers) => { return this.webProvider.webClient.get(url, headers) }, url, { 'Accept': 'application/json' }).then((res: HttpClientResponse) => {
            if (res && res.message.statusCode === 200) {
                res.readBody().then((body: string) => {
                    let jsonResult = JSON.parse(body);
                    let commits: unknown[] = [];
                    if (!!jsonResult) {
                        jsonResult.all_commit_details.forEach((c: CommitObject) => {
                            let commit = {
                                "Id": c.commit,
                                "Message": c.subject,
                                "Author": {
                                    "displayName": c.author_name
                                },
                                "DisplayUri": c.commit_url,
                                "Timestamp": c.author_date
                            };

                            commits.push(commit);
                        });
                    }

                    tl.debug("Downloaded " + commits.length + " commits");
                    defer.resolve(JSON.stringify(commits));
                }, (error) => {
                    defer.reject(error);
                });
            }
        }, (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    private GetCommits(startBuildId: string, endBuildId: string): Q.Promise<string> {
        let connection = tl.getInput("connection", true)!;
        let definitionId = tl.getInput("definition", true);
        var endpointUrl = tl.getEndpointUrl(connection, false);
        let defer = Q.defer<string>();
        let url: string = `${endpointUrl}/api/v1.1/project/${definitionId}/${startBuildId}`;
        url = url.replace(/([^:]\/)\/+/g, "$1");
        let commits: unknown[] = [];

        this.executeWithRetries("getCommits", (url: string, headers: unknown) => { return this.webProvider.webClient.get(url, headers) }, url, { 'Accept': 'application/json' }).then((res: HttpClientResponse) => {
            if (res && res.message.statusCode === 200) {
                res.readBody().then((body: string) => {
                    let jsonResult = JSON.parse(body);
                    let branch;
                    if (!!jsonResult) {
                        branch = jsonResult.branch;
                    }
                    else {
                        defer.reject(tl.loc("BranchNotFound"));
                        return;
                    }

                    let buildsUrl = `${endpointUrl}/api/v1.1/project/${definitionId}/tree/${branch}`;
                    buildsUrl = buildsUrl.replace(/([^:]\/)\/+/g, "$1");
                    this.webProvider.webClient.get(buildsUrl, { 'Accept': 'application/json' }).then((res: HttpClientResponse) => {
                        res.readBody().then((body: string) => {
                            let builds = JSON.parse(body);
                            let commitsIdsMap: Record<string, unknown> = {};
                            if (!!builds) {
                                builds.forEach((build: BuildObject) => {
                                    if (Number(build.build_num) <= Number(endBuildId) && Number(build.build_num) >= Number(startBuildId) && build.all_commit_details[0]) {
                                        build.all_commit_details.forEach((c: CommitObject) => {
                                            let commit = {
                                                "Id": c.commit,
                                                "Message": c.subject,
                                                "Author": {
                                                    "displayName": c.author_name
                                                },
                                                "DisplayUri": c.commit_url,
                                                "Timestamp": c.author_date
                                            };

                                            if (!commitsIdsMap[commit.Id as string]) {
                                                commits.push(commit);
                                                commitsIdsMap[commit.Id as string] = true;
                                            }
                                        });
                                    }
                                });
                            }

                            tl.debug("Downloaded " + commits.length + " commits");
                            defer.resolve(JSON.stringify(commits));
                        }, (error) => {
                            defer.reject(error);
                        });

                    }, (error) => {
                        defer.reject(error);
                    });
                });
            }
        });

        return defer.promise;
    }

    private UploadCommits(commits: string): Q.Promise<void> {
        let defer: Q.Deferred<void> = Q.defer<void>();1
        let commitsFilePath = path.join(os.tmpdir(), this.GetCommitsFileName());

        console.log(tl.loc("WritingCommitsTo", commitsFilePath));
        this.WriteContentToFileAndUploadAsAttachment(commits, commitsFilePath).then(() => {
            console.log(tl.loc("SuccessfullyUploadedCommitsAttachment"));
            // @ts-ignore
            defer.resolve(null);
        }, (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    private GetCommitsFileName(): string {
        let fileName: string = "commits.json";
        let commitfileName: string = tl.getInput("artifactDetailsFileNameSuffix", false)!;

        if (commitfileName) {
            fileName = `commits_${commitfileName}`;
        }

        return fileName;
    }

    private WriteContentToFileAndUploadAsAttachment(content: string, filePath: string): Q.Promise<any> {
        let defer = Q.defer<void>();

        // ensure it has .json extension
        if (path.extname(filePath) !== ".json") {
            filePath = `${filePath}.json`;
        }

        fs.writeFile(filePath, content, (err) => {
            if (err) {
                console.log(tl.loc("CouldNotWriteToFile", err));
                defer.reject(err);
                return;
            }

            console.log(tl.loc("UploadingAttachment", filePath));
            console.log(`##vso[task.uploadfile]${filePath}`);
            // @ts-ignore
            defer.resolve(null);
        });

        return defer.promise;
    }

    private executeWithRetries(operationName: string, operation: (url: string, headers: unknown) => Promise<any>, url: string, headers: unknown): Promise<HttpClientResponse> {
        var executePromise = new Promise<HttpClientResponse>((resolve, reject) => {
            this.executeWithRetriesImplementation(operationName, operation, this.retryLimit, url, headers, resolve, reject);
        });

        return executePromise;
    }

    private executeWithRetriesImplementation(operationName: string, operation: (string: string, headers: unknown) => Promise<any>, currentRetryCount: number, url: string, headers: unknown, resolve: (v: HttpClientResponse) => void, reject: (reason: unknown) => void) {
        operation(url, headers).then((result) => {
            resolve(result);
        }).catch((error) => {
            if (currentRetryCount <= 0) {
                tl.error(tl.loc("OperationFailed", operationName, error));
                reject(error);
            }
            else {
                console.log(tl.loc('RetryingOperation', operationName, currentRetryCount));
                currentRetryCount = currentRetryCount - 1;
                setTimeout(() => this.executeWithRetriesImplementation(operationName, operation, currentRetryCount, url, headers, resolve, reject), 4 * 1000);
            }
        });
    }
}