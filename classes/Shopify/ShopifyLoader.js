"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readline_1 = __importDefault(require("readline"));
const fs_1 = __importDefault(require("fs"));
const ShopifyProduct_1 = __importDefault(require("./ShopifyProduct"));
const ShopifyVariant_1 = __importDefault(require("./ShopifyVariant"));
class SHLoader {
    saveLocation;
    saveFileName;
    constructor(saveLocation, saveFileName) {
        this.saveLocation = saveLocation;
        this.saveFileName = saveFileName;
    }
    //1
    async readProducts() {
        return new Promise(async (resolve, reject) => {
            try {
                const rl = readline_1.default.createInterface({
                    input: fs_1.default.createReadStream(this.saveLocation + '/' + this.saveFileName)
                });
                let products = [];
                let variants = [];
                rl.on('line', (line) => {
                    let lineObject = JSON.parse(line);
                    if (lineObject.id.includes("/Product/")) {
                        products[lineObject.id] = new ShopifyProduct_1.default(lineObject);
                    }
                    else if (lineObject.id.includes("/ProductVariant/")) {
                        variants[lineObject.id] = new ShopifyVariant_1.default(lineObject);
                    }
                    else if (lineObject.id.includes("/InventoryLevel/")) {
                        variants[lineObject["__parentId"]].setInventoryLocation(lineObject.location.id);
                    }
                    else if (lineObject.id.includes("/ProductImage/")) {
                        products[lineObject["__parentId"]].setImage(lineObject);
                    }
                    else if (lineObject.id.includes("/Metafield/")) {
                        products[lineObject["__parentId"]].addMetafield(lineObject || {});
                    }
                    else {
                        console.log("Encountered something unexpected...");
                    }
                });
                rl.on('close', async () => {
                    resolve([products, variants]);
                });
                rl.on('error', (err) => {
                    reject(err);
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    //2
    async attachProductVariants(products, variants) {
        return new Promise((resolve, reject) => {
            let keys = Object.keys(variants);
            keys.forEach(async (key, i) => {
                try {
                    products[variants[key].__parentId].setVariant(variants[key]);
                    if (i == (keys.length - 1))
                        resolve(products);
                }
                catch (err) {
                    reject(key);
                }
            });
        });
    }
    //3
    async mapProducts(products) {
        return new Promise((resolve, reject) => {
            let mappedProducts = new Map();
            let keys = Object.keys(products);
            keys.forEach(async (key, i) => {
                mappedProducts.set(products[key].getHandle(), products[key]);
                if (i == (keys.length - 1))
                    resolve(mappedProducts);
            });
        });
    }
    async loadProducts() {
        return new Promise(async (resolve, reject) => {
            try {
                const [productsRaw, variantsRaw] = await this.readProducts();
                const parsedProducts = await this.attachProductVariants(productsRaw, variantsRaw);
                const products = await this.mapProducts(parsedProducts);
                resolve(products);
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
exports.default = SHLoader;
