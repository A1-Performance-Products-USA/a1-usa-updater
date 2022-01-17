"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ShopifyCategory {
    id;
    title;
    handle;
    productsCount;
    sortOrder;
    seo;
    ruleSet;
    image;
    constructor(info) {
        this.id = info.id || "";
        this.title = info.title;
        this.handle = info.handle;
        this.productsCount = info.productsCount || 0;
        this.sortOrder = info.sortOrder || "BEST_SELLING";
        this.ruleSet = info.ruleSet || {};
        this.ruleSet.rules = info["ruleSet"]["rules"] || [];
        this.image = info.image || {};
        this.seo = info.seo || {};
    }
}
exports.default = ShopifyCategory;
