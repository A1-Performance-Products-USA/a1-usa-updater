import readline from 'readline';
import fs from 'fs';
import ShopifyProduct from './ShopifyProduct';
import ShopifyVariant from './ShopifyVariant';
import ShopifyCategory from './ShopifyCategory';
export default class SHLoader {
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
                const rl = readline.createInterface({
                    input: fs.createReadStream(this.saveLocation + '/' + this.saveFileName)
                });
                let products = [];
                let variants = [];
                rl.on('line', (line) => {
                    let lineObject = JSON.parse(line);
                    if (lineObject.id.includes("/Product/")) {
                        products[lineObject.id] = new ShopifyProduct(lineObject);
                    }
                    else if (lineObject.id.includes("/ProductVariant/")) {
                        variants[lineObject.id] = new ShopifyVariant(lineObject);
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
            let counter = 0;
            keys.forEach(async (key, i) => {
                counter++;
                try {
                    products[variants[key].__parentId].setVariant(variants[key]);
                    if (counter == keys.length)
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
            let counter = 0;
            keys.forEach(async (key, i) => {
                counter++;
                mappedProducts.set(products[key].getHandle(), products[key]);
                if (counter == keys.length)
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
    async loadCollections(exclusionList) {
        return new Promise(async (resolve, reject) => {
            try {
                const rl = readline.createInterface({
                    input: fs.createReadStream(this.saveLocation + '/' + this.saveFileName)
                });
                let collections = new Map();
                rl.on('line', (line) => {
                    let lineObject = JSON.parse(line);
                    if (exclusionList.includes(lineObject.handle))
                        return;
                    collections.set(lineObject.handle, new ShopifyCategory(lineObject));
                });
                rl.on('close', async () => {
                    resolve(collections);
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
}
