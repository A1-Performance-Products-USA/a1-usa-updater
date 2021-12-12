"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShopifyFetcher_1 = __importDefault(require("./ShopifyFetcher"));
const ShopifyMutator_1 = __importDefault(require("./ShopifyMutator"));
const ShopifyWebHookHandler_1 = __importDefault(require("./ShopifyWebHookHandler"));
const ShopifyLoader_1 = __importDefault(require("./ShopifyLoader"));
const shopify_api_1 = require("@shopify/shopify-api");
class ShopifyHandler {
    shop;
    token;
    fetcher;
    mutator;
    webHook;
    requester;
    listener;
    loader;
    products;
    constructor(shop, token, handlerURL, port, saveLocation, cacheFileName) {
        this.shop = shop;
        this.token = token;
        this.requester = new shopify_api_1.Shopify.Clients.Graphql(`${shop}.myshopify.com`, token);
        this.listener = new ShopifyWebHookHandler_1.default(this.requester, parseInt(port), handlerURL);
        this.fetcher = new ShopifyFetcher_1.default(this.requester, this.listener, saveLocation, cacheFileName);
        this.loader = new ShopifyLoader_1.default(saveLocation, this.fetcher.saveFileName);
        this.mutator = new ShopifyMutator_1.default(this.requester, this.listener, saveLocation, '');
    }
    async getProducts() {
        await this.fetcher.fetchInformation();
        return this.products = await this.loader.loadProducts();
    }
    async loadInventory() {
        await this.fetcher.fetchInventory();
        return this.products = await this.loader.loadProducts();
    }
    async updateProducts(createCount, updateCount) {
        return Promise.resolve(await this.mutator.process('CREATE', createCount, updateCount));
    }
    async updateInventory(updateCount) {
        return Promise.resolve(await this.mutator.process('UPDATE', 0, updateCount));
    }
    terminate() {
        this.listener.deleteSubscription();
    }
}
exports.default = ShopifyHandler;
