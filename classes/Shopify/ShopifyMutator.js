"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShopifyBulkHandler_1 = __importDefault(require("./ShopifyBulkHandler"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const form_data_1 = __importDefault(require("form-data"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const https_1 = __importDefault(require("https"));
class SHMutator extends ShopifyBulkHandler_1.default {
    createFileName;
    updateFileName;
    basePath;
    focus;
    uploadInfo;
    createCount;
    updateCount;
    currentCreate;
    currentUpdate;
    mutationId;
    constructor(requester, listener, saveLocation, saveFileName) {
        super(requester, listener, saveLocation, saveFileName, "mutation");
        this.uploadInfo = {
            url: "",
            parameters: [],
            key: ""
        };
        this.createCount = 0;
        this.updateCount = 0;
        this.finishBulk = this.finishBulk.bind(this);
    }
    setSavePaths(dir, create, update) {
        this.createFileName = create;
        this.updateFileName = update;
        this.basePath = dir;
    }
    setFocus(focus) {
        this.focus = focus;
    }
    async uploadFile(url) {
        return new Promise(async (resolve, reject) => {
            let fileName = (this.focus == "CREATE"
                ? this.createFileName
                : this.updateFileName) + "_" +
                (this.focus == "CREATE"
                    ? this.createCount
                    : this.updateCount) + '.jsonl';
            var form = new form_data_1.default();
            for (let i = 0; i < this.uploadInfo.parameters.length; i++) {
                if (this.uploadInfo.parameters[i]["name"] == "key") {
                    this.uploadInfo.key = this.uploadInfo.parameters[i]["value"];
                }
                form.append(this.uploadInfo.parameters[i]["name"], this.uploadInfo.parameters[i]["value"]);
            }
            form.append("file", fs_1.default.createReadStream(path_1.default.join(this.basePath, fileName)), { filename: fileName, contentType: 'text/jsonl' });
            try {
                form.getLength(async (err, length) => {
                    if (err)
                        return reject(err);
                    const res = await (0, node_fetch_1.default)(this.uploadInfo.url, {
                        method: "POST",
                        body: form,
                        headers: {
                            'Content-Length': length.toString(),
                            ...form.getHeaders()
                        }
                    });
                    resolve(res.text());
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async fetchInformation() {
        const req = await this.requester.query({ data: {
                query: `
                    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
                         stagedUploadsCreate(input: $input) {
                              stagedTargets {
                                   resourceUrl
                                   url
                                   parameters {
                                        name
                                        value
                                   }
                              }
                              userErrors {
                                   field
                                   message
                              }
                         }
                    }
               `,
                variables: {
                    input: {
                        filename: (this.focus == "CREATE"
                            ? this.createFileName
                            : this.updateFileName) + "_" +
                            (this.focus == "CREATE"
                                ? this.createCount
                                : this.updateCount) + '.jsonl',
                        mimeType: "text/jsonl",
                        resource: "BULK_MUTATION_VARIABLES",
                        httpMethod: "POST",
                    }
                }
            } });
        this.uploadInfo = req.body["data"].stagedUploadsCreate.stagedTargets[0];
        console.log('The upload information for ' + this.kind + ':');
        console.log(this.uploadInfo);
        return Promise.resolve(req.body["data"].stagedUploadsCreate.stagedTargets[0]);
    }
    async startBulk() {
        try {
            console.log('Starting bulk operation ' + this.kind + ' for ' + this.uploadInfo.key);
            const req = await this.requester.query({
                data: this.focus == "CREATE"
                    ? `
                         mutation {
                              bulkOperationRunMutation(
                                   mutation: "mutation call($input: ProductInput!) { productCreate(input: $input) { product { id title } userErrors { message field } } }",
                                   stagedUploadPath: "${this.uploadInfo.key}") {
                                   bulkOperation {
                                        id
                                        url
                                        status
                                   }
                                   userErrors {
                                        message
                                        field
                                   }
                              }
                         }
                    `
                    : `
                         mutation {
                              bulkOperationRunMutation(
                                   mutation: "mutation call($input: ProductInput!) { productUpdate(input: $input) { product { id title } userErrors { message field } } }",
                                   stagedUploadPath: "${this.uploadInfo.key}") {
                                   bulkOperation {
                                        id
                                        url
                                        status
                                   }
                                   userErrors {
                                        message
                                        field
                                   }
                              }
                         }
                    `
            });
            if (req.body["data"].bulkOperationRunMutation.bulkOperation) {
                this.mutationId = req.body["data"].bulkOperationRunMutation.bulkOperation.id;
                console.log("Running bulk mutation ID: " + this.mutationId);
                return Promise.resolve(this.mutationId);
            }
            if (req.body["errors"]) {
                return Promise.reject(req.body["errors"]);
            }
            if (req.body["data"].bulkOperationRunMutation.userErrors) {
                console.log(req.body["data"].bulkOperationRunMutation.userErrors[0]);
                return Promise.reject(req.body["data"].bulkOperationRunMutation.userErrors[0]);
            }
            console.log(req.body);
            return Promise.resolve(req.body);
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    async getResultsURL() {
        return new Promise(async (resolve, reject) => {
            try {
                const req = await this.requester.query({
                    data: `
                              query {
                                   node(id: "${this.mutationId}") {
                                        ... on BulkOperation {
                                             url
                                        }
                                   }
                              }
                         `
                });
                console.log(req.body["data"]);
                resolve(req.body["data"].node.url);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async downloadResults() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Downloading the results of mutation ID: " + this.mutationId);
                const date = new Date();
                let fileWrite = fs_1.default.createWriteStream(path_1.default.join(this.saveLocation, `${(this.focus == "CREATE" ? this.createFileName : this.updateFileName) + "_" + (this.focus == "CREATE" ? this.createCount : this.updateCount) + '_results.jsonl'}`));
                let stream = https_1.default.get(await this.getResultsURL(), {
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3',
                        'Cache-Control': 'max-age=0',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
                    }
                }, (response) => {
                    response.pipe(fileWrite).on('finish', () => {
                        console.log("Downloaded the results.");
                        resolve(null);
                    });
                }).on('error', (err) => {
                    reject(err);
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async finishBulk(req, res, resolve, reject) {
        try {
            console.log("Bulk operation finished!");
            await this.downloadResults();
            this.listener.deleteSubscription();
            if (this.focus == "CREATE") {
                this.createCount--;
                if (this.createCount == 0) {
                    return resolve(await this.process("UPDATE"));
                }
                else {
                    return resolve(await this.process("CREATE"));
                }
            }
            if (this.focus == 'UPDATE') {
                this.updateCount--;
                if (this.updateCount == 0) {
                    return resolve();
                }
                else {
                    return resolve(await this.process("UPDATE"));
                }
            }
            return resolve();
        }
        catch (err) {
            reject(err);
        }
    }
    async process(focus, createCount, updateCount) {
        this.createCount = createCount || this.createCount;
        this.updateCount = updateCount || this.updateCount;
        return new Promise(async (resolve, reject) => {
            try {
                if (focus == "CREATE" && createCount == 0)
                    return resolve(this.listener.createWebListener("mutation", this.finishBulk.bind(this)));
                if (focus == "UPDATE" && updateCount == 0)
                    return resolve(this.listener.createWebListener("mutation", this.finishBulk.bind(this)));
                this.setFocus(focus);
                console.log("Starting the update on the " + focus + "...");
                //Get Upload Information
                let info = await this.fetchInformation();
                console.log("Fetched information! Uploading file...");
                //Upload File
                let upload = await this.uploadFile(info.url);
                console.log(upload);
                console.log("File uploaded! Starting bulk operation.");
            }
            catch (err) {
                reject(err);
            }
            try {
                //Start Bulk Operation
                await this.startBulk();
                this.listener.createSubscription("mutation");
                resolve(this.listener.createWebListener("mutation", this.finishBulk.bind(this)));
            }
            catch (err) {
                if (this.focus == "CREATE") {
                    resolve(await this.process('UPDATE'));
                }
                return reject(err);
            }
        });
    }
}
exports.default = SHMutator;
