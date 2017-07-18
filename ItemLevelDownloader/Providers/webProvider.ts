import * as http from "http"
import * as https from "https"
import * as url from "url"

import * as models from "../Models"
import * as Stream from "stream"

export class WebProvider implements models.IArtifactProvider {
    constructor(itemsUrl: string) {
        this._itemsUrl = itemsUrl;
    }

    getArtifactItems(): Promise<models.ArtifactItem[]> {
        var promise = new Promise<models.ArtifactItem[]>((resolve, reject) => {
            var adapterFor = (function() {
            var adapters = {
                'http:': http,
                'https:': https,
                };

                return function(inputUrl) {
                    return adapters[url.parse(inputUrl).protocol]
                }
            }());

            var options = {
                'hostname': url.parse(this._itemsUrl).hostname,
                'port': url.parse(this._itemsUrl).port,
                'auth': "admin:jenkins123",
                'path': this._itemsUrl
            }

            adapterFor(this._itemsUrl).get(options, function(resp) {
                var body = '';
                resp.setEncoding('utf8');
                resp.on('data', function(chunk) {
                    body += chunk;
                }).on('error', function(e) {
                    console.log('Error ' + e);
                    reject(e);
                }).on('end', function() {
                    console.log('Response body: ' + body);                
                    var response = JSON.parse(body);
                    resolve(response.artifacts);
                    console.log('Response json: ' + response);                
                })
            });
        });

        return promise;
    }

    getArtifactItem(artifactItem: models.ArtifactItem): Promise<Stream.Stream> {
        throw new Error("Not implemented");
    }

    private _itemsUrl: string;
}