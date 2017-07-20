import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';

import * as handlebars from 'handlebars';

import * as models from '../Models';
import * as Stream from 'stream';

export class WebProvider implements models.IArtifactProvider {
    constructor(itemsUrl: string, templateFile: string, username: string, password: string, variables: any) {
        this._itemsUrl = itemsUrl;
        this._templateFile = templateFile;
        this._username = username;
        this._password = password;
        this._variables = variables;
    }

    getArtifactItems(): Promise<models.ArtifactItem[]> {
        var promise = new Promise<models.ArtifactItem[]>((resolve, reject) => {
            this.getRequestHandler(this._itemsUrl).get(this.getRequestOptions(this._itemsUrl), (resp) => {
                var body = '';
                resp.setEncoding('utf8');
                resp.on('data', (chunk) => {
                    body += chunk;
                }).on('error', (e) => {
                    console.log('Error ' + e);
                    reject(e);
                }).on('end', () => {
                    fs.readFile(this.getTemplateFilePath(), 'utf8', (err,data) => {
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        var template = handlebars.compile(data);
                        console.log(data);
                        console.log('Response body: ' + body);         
                        var response = JSON.parse(body);
                        var context = this.extend({}, response, this._variables)
                        var result = template(context);
                        var items = JSON.parse(result);
                        resolve(items);
                        console.log('Response json: ' + response);   
                    });             
                })
            });
        });

        return promise;
    }

    getArtifactItem(artifactItem: models.ArtifactItem): Promise<Stream.Readable> {
        var promise = new Promise<Stream.Readable>((resolve, reject) => {
            var itemUrl: string = artifactItem.metadata['downloadUrl'];
            this.getRequestHandler(itemUrl).get(this.getRequestOptions(itemUrl), (resp) => {
                resolve(resp);
            });
        });

        return promise;
    }

    private getRequestHandler(inputUrl: string) {
        var adapters = {
            'http:': http,
            'https:': https,
        };

        return adapters[url.parse(inputUrl).protocol];
    }

    private getTemplateFilePath(): string {
        return path.isAbsolute(this._templateFile) ? this._templateFile : path.join(__dirname, this._templateFile);
    }

    private getRequestOptions(inputUrl: string) {
        var options = {
            'hostname': url.parse(inputUrl).hostname,
            'port': url.parse(inputUrl).port,
            'auth': this._username + ":" + this._password,
            'path': inputUrl
        }

        return options;
    }

    private extend(target, ...args: any[]) {
        var sources = [].slice.call(arguments, 1);
        sources.forEach(function (source) {
            for (var prop in source) {
                target[prop] = source[prop];
            }
        });
        return target;
    }

    private _itemsUrl: string;
    private _templateFile: string;
    private _username: string;
    private _password: string;
    private _variables: string;
}