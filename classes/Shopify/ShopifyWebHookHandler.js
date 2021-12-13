"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ShopifyWebHookHandler {
    requester;
    app = express();
    subscription;
    handlerURL;
    constructor(requester, port, handlerURL) {
        this.requester = requester;
        this.handlerURL = handlerURL;
        https_1.default.createServer({
            key: fs_1.default.readFileSync(path_1.default.join('..', __dirname, 'ssl', 'privkey.pem')),
            cert: fs_1.default.readFileSync(path_1.default.join('..', __dirname, 'ssl', 'fullchain.pem')),
        }, this.app).listen(port, function () {
            console.log("App listening on port 3000! Go to https://localhost:3000/");
        });
    }
    async createWebListener(kind, fn) {
        return new Promise((resolve, reject) => {
            this.app.post(`/listener/${kind}`, (req, res) => {
                fn(req, res, resolve, reject);
                res.status(200).end();
            });
        });
    }
    async createSubscription(kind) {
        try {
            const req = await this.requester.query({
                data: {
                    query: `
                              mutation webhookSubscriptionCreate($webhookSubscription: WebhookSubscriptionInput!) {
                                   webhookSubscriptionCreate(topic: BULK_OPERATIONS_FINISH, webhookSubscription: $webhookSubscription) {
                                        userErrors {
                                             field
                                             message
                                        }
                                        webhookSubscription {
                                             id
                                        }
                                   }
                              }
                         `,
                    variables: {
                        "webhookSubscription": {
                            "format": "JSON",
                            "callbackUrl": `${this.handlerURL}/listener/${kind}`
                        }
                    }
                }
            });
            if (req.body["data"].webhookSubscription == null) {
                const req2 = await this.requester.query({
                    data: `
                              {
                                   webhookSubscriptions(first: 10, topics: BULK_OPERATIONS_FINISH) {
                                        edges {
                                             node {
                                                  id
                                             }
                                        }
                                   }
                              }
                         `
                });
                this.subscription = req2.body["data"].webhookSubscriptions.edges[0].node.id;
            }
            else {
                this.subscription = req.body["data"].webhookSubscription.id;
            }
            console.log(kind + " webhook ID is: " + this.subscription);
            return Promise.resolve(this.subscription);
        }
        catch (err) {
            if (this.subscription) {
                return Promise.resolve(this.subscription);
            }
            return Promise.reject(err);
        }
    }
    async deleteSubscription() {
        if (!this.subscription)
            return;
        return await this.requester.query({ data: `
                    mutation {
                         webhookSubscriptionDelete(id: "${this.subscription}") {
                              userErrors {
                                   field
                                   message
                              }
                              deletedWebhookSubscriptionId
                         }
                    }
               `
        });
    }
}
exports.default = ShopifyWebHookHandler;
