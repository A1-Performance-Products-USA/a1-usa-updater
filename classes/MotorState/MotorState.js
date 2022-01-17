"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MotorStateFetcher_1 = require("./MotorStateFetcher");
const MotorStateLoader_1 = __importDefault(require("./MotorStateLoader"));
class MotorState {
    productList;
    exclusionList;
    prop65;
    fetcher;
    loader;
    allCollections;
    collectionCache;
    collectionImageCache;
    constructor(fetchLocation, fetchFileName, saveLocation, saveFileName, exclusionList) {
        this.fetcher = new MotorStateFetcher_1.MSFetcher(fetchLocation, fetchFileName, saveLocation, saveFileName);
        this.loader = new MotorStateLoader_1.default(saveLocation, this.fetcher.saveFileName);
        this.productList = new Map();
        this.exclusionList = exclusionList || Array();
        this.prop65 = new Map();
        this.loadProp65();
        this.addProduct = this.addProduct || this.addProduct.bind(this);
        this.addProp65 = this.addProp65 || this.addProp65.bind(this);
    }
    addProduct = (product) => {
        if (this.exclusionList.find((ex) => ex === product.getHandle()))
            return;
        if (this.prop65.has(product.handle)) {
            product.addMetafield({
                key: "prop_65",
                value: this.prop65.get(product.handle),
                namespace: "product_warning",
                description: "CA Proposition 65 Warning",
                type: "multi_line_text_field"
            });
        }
        this.productList.set(product.getHandle(), product);
    };
    addExclusion = (handle) => {
        this.exclusionList.push(handle);
    };
    addProp65 = ({ part_number, msg }) => {
        this.prop65.set(part_number.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '').replace(/^-/, ''), msg);
    };
    async loadProp65() {
        return new Promise(async (resolve, reject) => {
            resolve(await this.loader.loadProp65(this.addProp65));
        });
    }
    async loadProducts() {
        return new Promise(async (resolve, reject) => {
            //Fetch and download the products from MotorState
            await this.fetcher.fetchInformation();
            //Read the Downloaded File into Product List
            resolve(await this.loader.loadProducts(this.addProduct));
        });
    }
    async loadInventory() {
        return new Promise(async (resolve, reject) => {
            await this.fetcher.fetchInformation();
            resolve(await this.loader.loadInventory(this.addProduct));
        });
    }
    checkCategoryCache(handle) {
        this.collectionCache = this.collectionCache || new Array();
        return this.collectionCache.includes(handle);
    }
    addCategory(catList) {
        this.allCollections = this.allCollections || new Map();
        this.collectionCache = this.collectionCache || new Array();
        this.collectionImageCache = this.collectionImageCache || new Array();
        catList.forEach((category) => {
            if (this.collectionImageCache.includes(category.image.src))
                return;
            if (this.collectionCache.includes(category.handle))
                return;
            if (category.title == null || category.title == "")
                return;
            if (category.image.src != "") {
                this.collectionCache.push(category.handle);
                this.collectionImageCache.push(category.image.src);
            }
            this.allCollections.set(category.handle, category);
        });
    }
    async loadCategories() {
        return new Promise(async (resolve, reject) => {
            await this.fetcher.fetchInformation();
            this.allCollections = this.allCollections || new Map();
            this.collectionCache = this.collectionCache || new Array();
            resolve(await this.loader.loadCategories(this.addCategory.bind(this), this.checkCategoryCache.bind(this)));
        });
    }
}
exports.default = MotorState;
