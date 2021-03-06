"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class ChangeList {
    productUpdates;
    productCreates;
    collectionUpdates;
    collectionCreates;
    createPath;
    updatePath;
    createFileName;
    updateFileName;
    createName;
    updateName;
    createCount;
    updateCount;
    dir;
    constructor(dir, createName, updateName) {
        this.productCreates = [];
        this.productUpdates = [];
        this.createCount = 0;
        this.updateCount = 0;
        this.createName = createName;
        this.updateName = updateName;
        this.dir = dir;
        const d = new Date();
        this.createFileName = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}_${createName}`;
        this.updateFileName = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}_${updateName}`;
        this.createPath = path_1.default.join(dir, this.createFileName);
        this.updatePath = path_1.default.join(dir, this.updateFileName);
    }
    createProduct(product) {
        let task = {
            handle: product.handle,
            descriptionHtml: product.descriptionHtml,
            images: {
                altText: product.images.altText,
                src: product.images.originalSrc
            },
            metafields: product.metafields,
            productType: product.productType,
            seo: product.seo,
            status: product.status,
            tags: product.tags,
            title: product.title,
            vendor: product.vendor,
            variants: {
                barcode: product.variants.barcode,
                inventoryItem: {
                    cost: product.variants.inventoryItem.unitCost.amount,
                    tracked: product.variants.inventoryItem.tracked
                },
                inventoryPolicy: "DENY",
                price: product.variants.price,
                requiresShipping: true,
                sku: product.variants.sku,
                taxable: true,
                weight: product.variants.weight,
                weightUnit: "POUNDS"
            }
        };
        this.productCreates.push({
            input: task
        });
    }
    updateProduct(update) {
        this.productUpdates.push({
            input: update
        });
    }
    disableProduct(id, handle) {
        this.productUpdates.push({
            input: {
                id: id,
                handle: handle,
                status: 'ARCHIVED'
            }
        });
    }
    addCollection(collection) {
        delete collection['id'];
        delete collection['productsCount'];
        if (collection['image'].src == "") {
            delete collection['image'];
        }
        this.collectionCreates = this.collectionCreates || [];
        this.collectionCreates.push({
            input: collection
        });
    }
    updateCollection(collection) {
        delete collection['productsCount'];
        if (collection['image']) {
            delete collection['image']['id'];
        }
        this.collectionUpdates = this.collectionUpdates || [];
        this.collectionUpdates.push({
            input: collection
        });
    }
    disableCollection(id, handle) {
        // TODO: Delete product from store. (Not implemented on the shopify mutator)
    }
    writeProductCreateFile() {
        return new Promise((resolve, reject) => {
            if (this.productCreates.length <= 0)
                return resolve(0);
            try {
                this.createCount = 1;
                let counter = 0;
                this.productCreates.forEach((v, i) => {
                    counter++;
                    if (i >= 999) {
                        return resolve(this.createCount);
                    }
                    fs_1.default.appendFileSync(this.createPath + "_" + this.createCount + '.jsonl', JSON.stringify(v) + "\r\n");
                    if (counter == this.productCreates.length)
                        return resolve(this.createCount);
                    let stat = fs_1.default.statSync(this.createPath + "_" + this.createCount + '.jsonl');
                    if (stat.size >= 19000000) {
                        this.createCount++;
                    }
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    writeProductUpdateFile() {
        return new Promise((resolve, reject) => {
            if (this.productUpdates.length <= 0)
                return resolve(0);
            try {
                this.updateCount = 1;
                let counter = 0;
                this.productUpdates.forEach((v, i) => {
                    counter++;
                    fs_1.default.appendFileSync(this.updatePath + "_" + this.updateCount + '.jsonl', JSON.stringify(v) + "\r\n");
                    if (counter == this.productUpdates.length)
                        return resolve(this.updateCount);
                    let stat = fs_1.default.statSync(this.updatePath + "_" + this.updateCount + '.jsonl');
                    if (stat.size >= 19000000) {
                        this.updateCount++;
                    }
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    writeCollectionCreateFile() {
        this.collectionCreates = this.collectionCreates || [];
        return new Promise((resolve, reject) => {
            if (this.collectionCreates.length <= 0)
                return resolve(0);
            try {
                this.createCount = 1;
                let counter = 0;
                this.collectionCreates.forEach((v, i) => {
                    counter++;
                    if (i >= 999) {
                        return resolve(this.createCount);
                    }
                    fs_1.default.appendFileSync(this.createPath + "_" + this.createCount + '.jsonl', JSON.stringify(v) + "\r\n");
                    if (counter == this.collectionCreates.length)
                        return resolve(this.createCount);
                    let stat = fs_1.default.statSync(this.createPath + "_" + this.createCount + '.jsonl');
                    if (stat.size >= 19000000) {
                        this.createCount++;
                    }
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    writeCollectionUpdateFile() {
        this.collectionUpdates = this.collectionUpdates || [];
        return new Promise((resolve, reject) => {
            if (this.collectionUpdates.length <= 0)
                return resolve(0);
            try {
                this.updateCount = 1;
                let counter = 0;
                this.collectionUpdates.forEach((v, i) => {
                    counter++;
                    fs_1.default.appendFileSync(this.updatePath + "_" + this.updateCount + '.jsonl', JSON.stringify(v) + "\r\n");
                    if (counter == this.collectionUpdates.length)
                        return resolve(this.updateCount);
                    let stat = fs_1.default.statSync(this.updatePath + "_" + this.updateCount + '.jsonl');
                    if (stat.size >= 19000000) {
                        this.updateCount++;
                    }
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async saveChangeFiles() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.writeProductCreateFile();
                await this.writeProductUpdateFile();
                resolve({
                    create: this.createPath,
                    update: this.updatePath
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async saveCollectionFiles() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.writeCollectionCreateFile();
                await this.writeCollectionUpdateFile();
                resolve({
                    create: this.createPath,
                    update: this.updatePath
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
exports.default = ChangeList;
