import SHFetcher from "./ShopifyFetcher";
import SHMutator from "./ShopifyMutator";
import ShopifyWebHookHandler from "./ShopifyWebHookHandler";
import SHLoader from "./ShopifyLoader";
import { Shopify } from "@shopify/shopify-api";
export default class ShopifyHandler {
    shop;
    token;
    fetcher;
    mutator;
    webHook;
    requester;
    listener;
    loader;
    products;
    collections;
    constructor(shop, token, handlerURL, port, saveLocation, cacheFileName) {
        this.shop = shop;
        this.token = token;
        this.requester = new Shopify.Clients.Graphql(`${shop}.myshopify.com`, token);
        this.listener = new ShopifyWebHookHandler(this.requester, parseInt(port), handlerURL);
        this.fetcher = new SHFetcher(this.requester, this.listener, saveLocation, cacheFileName);
        this.loader = new SHLoader(saveLocation, this.fetcher.saveFileName);
        this.mutator = new SHMutator(this.requester, this.listener, saveLocation, '');
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
    async updateCollections(createCount, updateCount) {
        return Promise.resolve(await this.mutator.process('CREATE', createCount, updateCount, true));
    }
    async getCollections(exclusionList) {
        await this.fetcher.fetchCollections();
        return this.collections = await this.loader.loadCollections(exclusionList);
    }
    terminate() {
        this.listener.deleteSubscription();
    }
}
