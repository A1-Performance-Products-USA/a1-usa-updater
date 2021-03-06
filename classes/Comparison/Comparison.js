"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Comparison {
    ms_products;
    sh_products;
    ms_collections;
    sh_collections;
    changeList;
    compareFields;
    stats;
    constructor(changeList, ms_products, sh_products) {
        this.ms_products = ms_products;
        this.sh_products = sh_products;
        this.changeList = changeList;
        this.stats = {
            ms_products: 0,
            sh_products: 0,
            ms_collections: 0,
            sh_collections: 0,
            changes: 0,
            creations: 0,
            archives: 0,
            no_changes: 0
        };
    }
    async compareItem(ms_product, handle) {
        console.log("Comparing Item: " + ms_product.handle);
        return new Promise((resolve, reject) => {
            try {
                //Check product exists on shopify.
                if (!this.sh_products.has(handle)) {
                    console.log('Creating product: ' + handle);
                    this.stats.creations++;
                    return resolve(this.changeList.createProduct(ms_product));
                }
                const sh_product = this.sh_products.get(handle);
                let fields = {
                    id: sh_product.id,
                    handle: sh_product.handle,
                    descriptionHtml: ms_product.descriptionHtml,
                    variants: {
                        id: sh_product.variants.id
                    }
                };
                //Check Title
                if (ms_product.title != sh_product.title) {
                    fields.title = ms_product.title;
                }
                //Check status
                if (ms_product.status != sh_product.status) {
                    fields.status = ms_product.status;
                }
                //Check type
                if (ms_product.productType != sh_product.productType) {
                    fields.productType = ms_product.productType;
                }
                //Check vendor
                if (ms_product.vendor != sh_product.vendor) {
                    fields.vendor = ms_product.vendor;
                }
                //Check metafields
                fields.metafields = [];
                for (let i = 0; i < ms_product.metafields.length; i++) {
                    for (let j = 0; j < sh_product.metafields.length; j++) {
                        if (ms_product.metafields[i].key == sh_product.metafields[j].key) {
                            if (ms_product.metafields[i].value != sh_product.metafields[j].value) {
                                fields.metafields.push({
                                    ...sh_product.metafields[j],
                                    ...ms_product.metafields[i]
                                });
                            }
                            break;
                        }
                        if (j == sh_product.metafields.length - 1) {
                            fields.metafields.push({
                                ...ms_product.metafields[i]
                            });
                        }
                    }
                }
                if (fields.metafields.length <= 0) {
                    delete fields.metafields;
                }
                //Check SEO
                if (ms_product.seo.title != sh_product.seo.title) {
                    fields.seo = fields.seo || {};
                    fields.seo.title = ms_product.seo.title;
                }
                if (ms_product.seo.description != sh_product.seo.description) {
                    fields.seo = fields.seo || {};
                    fields.seo.description = ms_product.seo.description;
                }
                //Check Tags
                for (let i = 0; i < ms_product.tags.length; i++) {
                    if (!sh_product.tags.includes(ms_product.tags[i])) {
                        fields.tags = ms_product.tags;
                        break;
                    }
                }
                //Check Variant Information:
                //Check Barcode
                if (ms_product.variants.barcode != sh_product.variants.barcode) {
                    fields.variants.barcode = ms_product.variants.barcode;
                }
                //Check Cost
                if (ms_product.variants.inventoryItem.unitCost.amount != sh_product.variants.inventoryItem.unitCost.amount) {
                    fields.variants.inventoryItem = fields.variants.inventoryItem || {};
                    fields.variants.inventoryItem.cost = ms_product.variants.inventoryItem.unitCost.amount;
                }
                //Check Tracked
                if (ms_product.variants.inventoryItem.tracked != sh_product.variants.inventoryItem.tracked) {
                    fields.variants.inventoryItem = fields.variants.inventoryItem || {};
                    fields.variants.inventoryItem.tracked = ms_product.variants.inventoryItem.tracked;
                }
                //Check Policy
                if (ms_product.variants.inventoryPolicy != sh_product.variants.inventoryPolicy) {
                    fields.variants.inventoryPolicy = ms_product.variants.inventoryPolicy;
                }
                //Check Quantity
                if (ms_product.variants.inventoryQuantity != sh_product.variants.inventoryQuantity) {
                    fields.variants.inventoryQuantities = fields.variants.inventoryQuantities || {};
                    fields.variants.inventoryQuantities.locationId = sh_product.variants.locationId;
                    fields.variants.inventoryQuantities.availableQuantity = ms_product.variants.inventoryQuantity;
                }
                //Check Price
                if (ms_product.variants.price != sh_product.variants.price) {
                    fields.variants.price = ms_product.variants.price;
                }
                //Check Sku
                if (ms_product.variants.sku != sh_product.variants.sku) {
                    fields.variants.sku = ms_product.variants.sku;
                }
                //Check Weight
                if (ms_product.variants.weight != sh_product.variants.weight) {
                    fields.variants.weight = ms_product.variants.weight;
                }
                //Check Weight Unit
                if (ms_product.variants.weightUnit != sh_product.variants.weightUnit) {
                    fields.variants.weightUnit = ms_product.variants.weightUnit;
                }
                //Remove processed item.
                this.sh_products.delete(handle);
                //Write update, if necessary.
                if (Object.keys(fields).length <= 4) {
                    console.log("No update necessary.");
                    this.stats.no_changes++;
                    return resolve('NO_UPDATE_NECESSARY');
                }
                else {
                    console.log("Updating...");
                    this.stats.changes++;
                    return resolve(this.changeList.updateProduct(fields));
                }
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async compareInventoryItem(ms_product, handle) {
        console.log("Comparing Item: " + ms_product.handle);
        return new Promise((resolve, reject) => {
            try {
                //Check product exists on shopify.
                if (!this.sh_products.has(handle)) {
                    return resolve(null);
                }
                const sh_product = this.sh_products.get(handle);
                let fields = {
                    id: sh_product.id,
                    handle: sh_product.handle,
                    variants: {
                        id: sh_product.variants.id
                    }
                };
                if (ms_product.variants.inventoryQuantity != sh_product.variants.inventoryQuantity) {
                    fields.variants.inventoryQuantities = fields.variants.inventoryQuantities || {};
                    fields.variants.inventoryQuantities.locationId = sh_product.variants.locationId;
                    fields.variants.inventoryQuantities.availableQuantity = ms_product.variants.inventoryQuantity;
                }
                if (Object.keys(fields.variants).length <= 1) {
                    console.log("No update necessary.");
                    this.stats.no_changes++;
                    return resolve('NO_UPDATE_NECESSARY');
                }
                else {
                    console.log("Updating...");
                    this.stats.changes++;
                    return resolve(this.changeList.updateProduct(fields));
                }
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async compareAll() {
        return new Promise((resolve, reject) => {
            let counter = 0;
            this.stats.ms_products = this.ms_products.size;
            this.stats.sh_products = this.sh_products.size;
            this.ms_products.forEach(async (product, handle, map) => {
                await this.compareItem(product, handle);
                counter++;
                if (counter == this.ms_products.size)
                    return resolve();
            });
        });
    }
    async compareInventory() {
        return new Promise((resolve, reject) => {
            let counter = 0;
            this.stats.ms_products = this.ms_products.size;
            this.stats.sh_products = this.sh_products.size;
            this.ms_products.forEach(async (product, handle, map) => {
                await this.compareInventoryItem(product, handle);
                counter++;
                if (counter == this.ms_products.size)
                    return resolve();
            });
        });
    }
    async removeOld() {
        return new Promise((resolve, reject) => {
            let counter = 0;
            let ogSize = this.sh_products.size;
            if (ogSize <= 0)
                return resolve(this.changeList);
            this.sh_products.forEach((product, handle) => {
                console.log('Disabling Product: ' + handle);
                if (product.status == 'ARCHIVED')
                    return;
                this.changeList.disableProduct(product.id, handle);
                this.stats.archives++;
                counter++;
                if (counter == this.sh_products.size)
                    return resolve(this.changeList);
            });
        });
    }
    async processProducts() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.compareAll();
                console.log('Compared... Attempting to remove old...');
                await this.removeOld();
                console.log('These are the Daily Task Update Stats:');
                console.log(this.stats);
                console.log('Saving changes...');
                resolve(await this.changeList.saveChangeFiles());
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async processInventory() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.compareInventory();
                console.log('Compared... Saving changes...');
                console.log('These are the Inventory Update Stats:');
                console.log(this.stats);
                console.log('Saving changes...');
                resolve(await this.changeList.saveChangeFiles());
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async compareCollectionItem(ms_collection, handle) {
        console.log("Comparing Item: " + ms_collection.handle);
        return new Promise((resolve, reject) => {
            try {
                //Check product exists on shopify.
                if (!this.sh_collections.has(handle)) {
                    console.log("Not found. Creating...");
                    this.stats.creations++;
                    return resolve(this.changeList.addCollection(ms_collection));
                }
                const sh_collection = this.sh_collections.get(handle);
                let fields = {
                    id: sh_collection.id
                };
                if (ms_collection.title != sh_collection.title) {
                    fields.title = ms_collection.title;
                }
                if (ms_collection.sortOrder != sh_collection.sortOrder) {
                    fields.sortOrder = ms_collection.sortOrder;
                }
                if (!sh_collection.seo || sh_collection.seo == null) {
                    fields.seo = ms_collection.seo;
                }
                else {
                    if (ms_collection.seo.title != ms_collection.seo.title) {
                        fields.seo = fields.seo || {};
                        fields.seo.title = ms_collection.seo.title;
                    }
                    if (ms_collection.seo.description != ms_collection.seo.description) {
                        fields.seo = fields.seo || {};
                        fields.seo.description = ms_collection.seo.description;
                    }
                }
                if (!sh_collection.ruleSet || sh_collection.ruleSet == null) {
                    fields.ruleSet = ms_collection.ruleSet;
                }
                else {
                    if (ms_collection.ruleSet.rules != sh_collection.ruleSet.rules) {
                        fields.ruleSet = fields.ruleSet || {};
                        fields.ruleSet.appliedDisjunctively = ms_collection.ruleSet.appliedDisjunctively;
                        fields.ruleSet.rules = ms_collection.ruleSet.rules;
                    }
                }
                if (!sh_collection.image || sh_collection.image == null) {
                    fields.image = ms_collection.image;
                }
                else {
                    if (ms_collection.image.altText != sh_collection.image.altText) {
                        fields.image = fields.image || {};
                        fields.image.id = sh_collection.image.id;
                        fields.image.altText = ms_collection.image.altText;
                    }
                    if (ms_collection.image.src != sh_collection.image.src) {
                        fields.image = fields.image || {};
                        fields.image.id = sh_collection.image.id;
                        fields.image.src = ms_collection.image.src;
                    }
                }
                this.sh_collections.delete(handle);
                if (Object.keys(fields).length <= 1) {
                    console.log("No update necessary.");
                    this.stats.no_changes++;
                    return resolve('NO_UPDATE_NECESSARY');
                }
                else {
                    console.log("Updating...");
                    this.stats.changes++;
                    return resolve(this.changeList.updateCollection(fields));
                }
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async removeOldCollections() {
        return new Promise((resolve, reject) => {
            let counter = 0;
            let ogSize = this.sh_collections.size;
            if (ogSize <= 0)
                return resolve(this.changeList);
            this.sh_collections.forEach((collection, handle) => {
                console.log('Disabling Collection: ' + handle);
                this.changeList.disableCollection(collection.id, handle);
                this.stats.archives++;
                counter++;
                if (counter == this.sh_collections.size)
                    return resolve(this.changeList);
            });
        });
    }
    async compareCollections() {
        return new Promise((resolve, reject) => {
            let counter = 0;
            this.stats.ms_collections = this.ms_collections.size;
            this.stats.sh_collections = this.sh_collections.size;
            this.ms_collections.forEach(async (collection, handle, map) => {
                await this.compareCollectionItem(collection, handle);
                counter++;
                if (counter == this.ms_collections.size)
                    return resolve();
            });
        });
    }
    async processCollections(ms_collections, sh_collections) {
        return new Promise(async (resolve, reject) => {
            try {
                this.ms_collections = this.ms_collections || ms_collections;
                this.sh_collections = this.sh_collections || sh_collections;
                await this.compareCollections();
                console.log('Compared... Attempting to remove old...');
                //await this.removeOldCollections();
                console.log('These are the Collection Update Stats:');
                console.log(this.stats);
                console.log('Saving changes...');
                resolve(await this.changeList.saveCollectionFiles());
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
exports.default = Comparison;
