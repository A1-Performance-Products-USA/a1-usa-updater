"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const csv = require("csv-parser");
const MotorStateProduct_1 = __importDefault(require("../MotorState/MotorStateProduct"));
const ShopifyProduct_1 = __importDefault(require("../Shopify/ShopifyProduct"));
const ShopifyVariant_1 = __importDefault(require("../Shopify/ShopifyVariant"));
const ShopifyCategory_1 = __importDefault(require("../Shopify/ShopifyCategory"));
class MSLoader {
    saveLocation;
    saveFileName;
    constructor(saveLocation, saveFileName) {
        this.saveLocation = saveLocation;
        this.saveFileName = saveFileName;
    }
    async loadProducts(fn) {
        return new Promise((resolve, reject) => {
            fs.createReadStream(`${this.saveLocation}/${this.saveFileName}`)
                .pipe(csv({
                headers: [
                    'part_number',
                    'description',
                    'brand',
                    'price',
                    'cost',
                    'length',
                    'width',
                    'height',
                    'weight',
                    'quantity',
                    'upc',
                    'Jobber',
                    'AAIACode',
                    'map_price',
                    'vendor_msrp',
                    'air_restricted',
                    'state_restricted',
                    'freight_only',
                    'man_part_number',
                    'shipalone',
                    'status',
                    'ms_notes',
                    'image_url',
                    'category_1',
                    'category_2',
                    'category_3',
                    'long_description',
                ],
                skipLines: 1
            }))
                .on('data', async (data) => {
                if (data.long_description.toLowerCase().includes('sanitizer'))
                    return;
                fn(await this.translateToShopify(new MotorStateProduct_1.default(data)));
            })
                .on('end', () => {
                resolve();
            })
                .on('error', (err) => {
                reject(err);
            });
        });
    }
    async loadProp65(fn) {
        return new Promise((resolve, reject) => {
            fs.createReadStream(`${this.saveLocation}/prop_65.csv`)
                .pipe(csv({
                headers: [
                    'part_number',
                    'msg'
                ],
                skipLines: 1
            }))
                .on('data', async (data) => {
                fn(data);
            })
                .on('end', () => {
                resolve();
            })
                .on('error', (err) => {
                reject(err);
            });
        });
    }
    async loadInventory(fn) {
        return new Promise((resolve, reject) => {
            fs.createReadStream(`${this.saveLocation}/${this.saveFileName}`)
                .pipe(csv({
                headers: [
                    'part_number',
                    'quantity'
                ],
                skipLines: 1
            }))
                .on('data', async (data) => {
                fn(await this.translateToShopifyInventory(new MotorStateProduct_1.default(data)));
            })
                .on('end', () => {
                resolve();
            })
                .on('error', (err) => {
                reject(err);
            });
        });
    }
    async loadCategories(fn, cacheCheck) {
        return new Promise((resolve, reject) => {
            fs.createReadStream(`${this.saveLocation}/${this.saveFileName}`)
                .pipe(csv({
                headers: [
                    'part_number',
                    'description',
                    'brand',
                    'price',
                    'cost',
                    'length',
                    'width',
                    'height',
                    'weight',
                    'quantity',
                    'upc',
                    'Jobber',
                    'AAIACode',
                    'map_price',
                    'vendor_msrp',
                    'air_restricted',
                    'state_restricted',
                    'freight_only',
                    'man_part_number',
                    'shipalone',
                    'status',
                    'ms_notes',
                    'image_url',
                    'category_1',
                    'category_2',
                    'category_3',
                    'long_description'
                ],
                skipLines: 1
            }))
                .on('data', async (data) => {
                console.log('adding category for product: ' + data.part_number);
                //if (cacheCheck(data.category_1.toLowerCase().replace(/[^a-z0-9]+/g, '-') + "_" + data.category_2.toLowerCase().replace(/[^a-z0-9]+/g, '-') + "_" + data.category_3.toLowerCase().replace(/[^a-z0-9]+/g, '-'))) return;
                fn(await this.translateToShopifyCategory(new MotorStateProduct_1.default(data)));
            })
                .on('end', () => {
                resolve();
            })
                .on('error', (err) => {
                reject(err);
            });
        });
    }
    createTags(product) {
        let priceNum = parseFloat(product.price);
        let priceTag = "Less than $25";
        if (priceNum >= 25 && priceNum < 50) {
            priceTag = "$25 to $50";
        }
        else if (priceNum >= 50 && priceNum < 100) {
            priceTag = "$50 to $100";
        }
        else if (priceNum >= 100 && priceNum < 500) {
            priceTag = "$100 to $500";
        }
        else if (priceNum >= 500) {
            priceTag = "More than $500";
        }
        return [product.category_1.replace(/,/g, ''), product.category_2.replace(/,/g, ''), product.category_3.replace(/,/g, ''), this.formatBrand(product), priceTag];
    }
    formatBrand(product) {
        let brand = product.brand.replace(/,/g, '');
        let brandWords = brand.split(' ');
        for (let i = 0; i < brandWords.length; i++) {
            brandWords[i] = brandWords[i][0].toUpperCase() + brandWords[i].substring(1);
        }
        return brandWords.join(' ');
    }
    setPriceMetafield(product) {
        let priceNum = parseFloat(product.price);
        let priceTag = "Less than $25";
        if (priceNum >= 25 && priceNum < 50) {
            priceTag = "$25 to $50";
        }
        else if (priceNum >= 50 && priceNum < 100) {
            priceTag = "$50 to $100";
        }
        else if (priceNum >= 100 && priceNum < 500) {
            priceTag = "$100 to $500";
        }
        else if (priceNum >= 500) {
            priceTag = "More than $500";
        }
        return {
            key: "price_range",
            value: priceTag,
            namespace: "prod_info",
            description: "",
            type: "single_line_text_field"
        };
    }
    async translateToShopifyInventory(product) {
        return new Promise((resolve, reject) => {
            resolve(new ShopifyProduct_1.default({
                handle: product.handle,
                variants: new ShopifyVariant_1.default({
                    inventoryQuantity: parseInt(product.quantity)
                })
            }));
        });
    }
    async translateToShopifyCategory(product) {
        return new Promise((resolve, reject) => {
            resolve([
                new ShopifyCategory_1.default({
                    title: product.category_1,
                    handle: product.category_1.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    sortOrder: "BEST_SELLING",
                    seo: {
                        title: product.category_1,
                        description: `View all ${product.category_1} products at A1 Performance Products.`
                    },
                    ruleSet: {
                        appliedDisjunctively: false,
                        rules: [
                            {
                                column: "TAG",
                                condition: product.category_1.replace(/,/g, ''),
                                relation: "EQUALS"
                            }
                        ]
                    },
                    image: {
                        src: product.image_url || "",
                        altText: product.category_1
                    }
                }),
                new ShopifyCategory_1.default({
                    title: product.category_2,
                    handle: product.category_1.toLowerCase().replace(/[^a-z0-9]+/g, '-') + "_" + product.category_2.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    sortOrder: "BEST_SELLING",
                    seo: {
                        title: product.category_2,
                        description: `View all ${product.category_2} products at A1 Performance Products.`
                    },
                    ruleSet: {
                        appliedDisjunctively: false,
                        rules: [
                            {
                                column: "TAG",
                                condition: product.category_1.replace(/,/g, ''),
                                relation: "EQUALS"
                            },
                            {
                                column: "TAG",
                                condition: product.category_2.replace(/,/g, ''),
                                relation: "EQUALS"
                            }
                        ]
                    },
                    image: {
                        src: product.image_url || "",
                        altText: product.category_2
                    }
                }),
                new ShopifyCategory_1.default({
                    title: product.category_3,
                    handle: product.category_1.toLowerCase().replace(/[^a-z0-9]+/g, '-') + "_" + product.category_2.toLowerCase().replace(/[^a-z0-9]+/g, '-') + "_" + product.category_3.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    sortOrder: "BEST_SELLING",
                    seo: {
                        title: product.category_3,
                        description: `View all ${product.category_3} products at A1 Performance Products.`
                    },
                    ruleSet: {
                        appliedDisjunctively: false,
                        rules: [
                            {
                                column: "TAG",
                                condition: product.category_1.replace(/,/g, ''),
                                relation: "EQUALS"
                            },
                            {
                                column: "TAG",
                                condition: product.category_2.replace(/,/g, ''),
                                relation: "EQUALS"
                            },
                            {
                                column: "TYPE",
                                condition: product.category_3.replace(/,/g, ''),
                                relation: "EQUALS"
                            }
                        ]
                    },
                    image: {
                        src: product.image_url || "",
                        altText: product.category_3
                    }
                })
            ]);
        });
    }
    async translateToShopify(product) {
        return new Promise((resolve, reject) => {
            resolve(new ShopifyProduct_1.default({
                handle: product.handle,
                title: `${product.long_description || ""}`.substring(0, 255),
                descriptionHtml: `<p>${product.long_description || ""}</p><p>${product.ms_notes.replace(/\\/g, '-') || ""}</p>`,
                vendor: this.formatBrand(product) || "",
                productType: product.category_3.replace(/,/g, '') || "Unclassified",
                tags: this.createTags(product),
                status: 'ACTIVE',
                metafields: [
                    {
                        "key": "part_number",
                        "description": "Store Part Number",
                        "namespace": "product_extra",
                        "value": product.part_number || "",
                        "type": "single_line_text_field"
                    },
                    {
                        "key": "manufacturer_number",
                        "description": "Manufacturer Part Number",
                        "namespace": "product_extra",
                        "value": product.man_part_number || "",
                        "type": "single_line_text_field"
                    },
                    this.setPriceMetafield(product)
                ],
                images: {
                    altText: product.description,
                    originalSrc: product.image_url
                },
                seo: {
                    title: `${product.part_number} - ${product.description}`,
                    description: `${product.long_description}`
                },
                variants: new ShopifyVariant_1.default({
                    barcode: product.upc || "",
                    inventoryPolicy: "DENY",
                    price: product.price,
                    sku: product.part_number,
                    weight: parseFloat(product.weight) || 0.0,
                    weightUnit: "POUNDS",
                    inventoryQuantity: parseInt(product.quantity),
                    inventoryItem: {
                        unitCost: {
                            amount: parseFloat(product.cost) || 0.0
                        },
                        tracked: true
                    }
                })
            }));
        });
    }
}
exports.default = MSLoader;
