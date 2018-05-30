import * as assert from 'assert';
import * as path from 'path'
import * as http from 'http';
import * as net from 'net';

import * as models from "../Models"
import * as engine from "../Engine"
import * as providers from "../Providers"
import { BasicCredentialHandler } from "../Providers/typed-rest-client/handlers/basiccreds";
import { PersonalAccessTokenCredentialHandler } from "../Providers/typed-rest-client/handlers/personalaccesstoken";
import { TicketState } from '../Models/ticketState';

var packagejson = require('../package.json');

describe('proxy tests', () => {

    it('should be able to download jenkins artifact under proxy', function (done) {

        // nock isn't working well with tunnel proxy so setting up custom server
        var proxy = http.createServer(function (req, res) {

            assert.equal(req.headers['authorization'], 'Basic ' + new Buffer('username:password').toString('base64'));
            assert.equal(req.headers['user-agent'], 'artifact-engine ' + packagejson.version);

            if (req.url === "/job/ArtifactEngineJob/6/api/json?tree=artifacts[*]") {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.write(JSON.stringify({
                    "artifacts": [
                        { "displayPath": "file1.pdb", "fileName": "file1.pdb", "relativePath": "Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb" },
                    ]
                }));
                res.end();
                return;
            }

            if (req.url === "/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb") {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.write('dummyFileContent');
                res.end();
                return;
            }

            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.write('page not found!');
            res.end();
        });

        proxy.on('connect', onConnect);
        function onConnect(req, clientSocket, head) {
            assert.equal(req.headers['proxy-authorization'], 'Basic ' + new Buffer('admin:123:pass#123:').toString('base64'));

            var serverSocket = net.connect({ port: 9011 }, function () {
                clientSocket.write('HTTP/1.1 200 Connection established\r\n\r\n');
                clientSocket.pipe(serverSocket);
                serverSocket.write(head);
                serverSocket.pipe(clientSocket);
                // workaround, see joyent/node#2524
                serverSocket.on('end', function () {
                    clientSocket.end();
                });
            });
        };

        proxy.listen(9011, setUpClient);

        function setUpClient() {
            let processor = new engine.ArtifactEngine();
            let processorOptions = getArtifactEngineOptions();
            let webProvider = getJenkinsWebProvider();
            let stubProvider = new providers.StubProvider();

            var processItemsPromise = processor.processItems(webProvider, stubProvider, processorOptions);
            processItemsPromise.then((tickets) => {
                assert.equal(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb"], "dummyFileContent");
                assert.equal(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb").retryCount, 0);
                proxy.close();
                done();
            }, (err) => {
                throw err;
            });
        }
    });
});

function getArtifactEngineOptions(): engine.ArtifactEngineOptions {
    let processorOptions = new engine.ArtifactEngineOptions();
    processorOptions.fileProcessingTimeoutInMinutes = 5;
    processorOptions.itemPattern = "**";
    processorOptions.parallelProcessingLimit = 8;
    processorOptions.retryIntervalInSeconds = 0;
    processorOptions.retryLimit = 2;
    processorOptions.verbose = true;

    return processorOptions;
}

function getJenkinsWebProvider(): providers.WebProvider {
    var itemsUrl = "http://redvstt-lab43:8080/job/ArtifactEngineJob/6/api/json?tree=artifacts[*]"
    var variables = {
        "endpoint": {
            "url": "http://redvstt-lab43:8080"
        },
        "definition": "ArtifactEngineJob",
        "version": "6"
    };

    var handler = new BasicCredentialHandler("username", "password");
    var webProvider = new providers.WebProvider(itemsUrl, "jenkins.handlebars", variables, handler, {
        ignoreSslError: false,
        keepAlive: true,
        proxy: {
            proxyUrl: 'http://127.0.0.1:9011',
            proxyUsername: 'admin:123',
            proxyPassword: 'pass#123:'
        }
    });

    return webProvider;
}