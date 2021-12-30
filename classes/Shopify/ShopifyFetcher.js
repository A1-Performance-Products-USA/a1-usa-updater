"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShopifyBulkHandler_1 = __importDefault(require("@class/Shopify/ShopifyBulkHandler"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const path = require("path");
class SHFetcher extends ShopifyBulkHandler_1.default {
    bulkProductQuery;
    bulkInventoryQuery;
    process;
    constructor(requester, listener, saveLocation, saveFileName) {
        super(requester, listener, saveLocation, saveFileName, 'query');
        this.listener = listener;
        this.bulkProductQuery = {
            data: `
                    mutation {
                         bulkOperationRunQuery(query: "{
                              products (first: 200000) {
                                   edges {
                                        node {
                                             id
                                             handle
                                             title
                                             descriptionHtml
                                             vendor
                                             productType
                                             seo {
                                                  title
                                                  description
                                             }
                                             tags
                                             metafields(first: 10) {
                                                  edges {
                                                       node {
                                                            id
                                                            key
                                                            description
                                                            namespace
                                                            value
                                                            type
                                                       }
                                                  }
                                             }
                                             images (first: 10) {
                                                  edges {
                                                       node {
                                                            id
                                                            src
                                                       }
                                                  }
                                             }
                                             variants(first: 10) {
                                                  edges {
                                                       node {
                                                            id
                                                            barcode
                                                            inventoryPolicy
                                                            price
                                                            sku
                                                            weight
                                                            weightUnit
                                                            inventoryQuantity
                                                            inventoryItem {
                                                                 id
                                                                 tracked
                                                                 unitCost {
                                                                      amount
                                                                 }
                                                                 inventoryLevels (first: 1) {
                                                                      edges {
                                                                           node {
                                                                                id
                                                                                location {
                                                                                     id
                                                                                }
                                                                           }
                                                                      }
                                                                 }
                                                            }
                                                       }
                                                  }
                                             }
                                        }
                                   }
                              }
                         }"
                         ) {
                              bulkOperation {
                                   id
                                   status
                              }
                              userErrors {
                                   field
                                   message
                              }
                         }
                    }
               `
        };
        this.bulkInventoryQuery = {
            data: `
                    mutation {
                         bulkOperationRunQuery(query: "{
                              products (first: 200000) {
                                   edges {
                                        node {
                                             id
                                             handle
                                             variants(first: 10) {
                                                  edges {
                                                       node {
                                                            id
                                                            inventoryQuantity
                                                            inventoryItem {
                                                                 id
                                                                 inventoryLevels (first: 1) {
                                                                      edges {
                                                                           node {
                                                                                id
                                                                                location {
                                                                                     id
                                                                                }
                                                                           }
                                                                      }
                                                                 }
                                                            }
                                                       }
                                                  }
                                             }
                                        }
                                   }
                              }
                         }"
                         ) {
                              bulkOperation {
                                   id
                                   status
                              }
                              userErrors {
                                   field
                                   message
                              }
                         }
                    }
               `
        };
        this.finishBulk = this.finishBulk.bind(this);
    }
    //Start the query of all files.
    async startBulk(query) {
        this.process = this.requester.query(query);
    }
    //Download all files.
    async finishBulk(req, res, resolve, reject) {
        try {
            let fileWrite = fs_1.default.createWriteStream(path.join(this.saveLocation, this.saveFileName));
            let stream = https_1.default.get(await this.getDownloadURL(), {
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
                    this.listener.deleteSubscription();
                    resolve(null);
                });
            }).on('error', (err) => {
                reject(err);
            });
        }
        catch (err) {
            reject(err);
        }
    }
    //Start to Finish Entire process
    async fetchInformation() {
        return new Promise(async (resolve, reject) => {
            try {
                if (fs_1.default.existsSync(path.join(this.saveLocation, this.saveFileName))) {
                    return resolve(null);
                }
                //Start Bulk Query
                this.startBulk(this.bulkProductQuery);
                //Listen for Query to finish
                this.listener.createSubscription('query');
                resolve(await this.listener.createWebListener('query', this.finishBulk));
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async fetchInventory() {
        return new Promise(async (resolve, reject) => {
            try {
                if (fs_1.default.existsSync(path.join(this.saveLocation, this.saveFileName))) {
                    return resolve(null);
                }
                this.startBulk(this.bulkInventoryQuery);
                this.listener.createSubscription('query');
                resolve(await this.listener.createWebListener('query', this.finishBulk));
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
exports.default = SHFetcher;
