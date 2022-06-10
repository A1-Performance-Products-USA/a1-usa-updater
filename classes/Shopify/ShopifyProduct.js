"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ShopifyProduct {
    id;
    handle;
    title;
    descriptionHtml;
    vendor;
    productType;
    tags;
    metafields;
    variants;
    images;
    seo;
    status;
    constructor(info) {
        this.id = info.id;
        this.handle = info.handle;
        this.title = info.title;
        this.descriptionHtml = info.descriptionHtml;
        this.vendor = info.vendor;
        this.productType = info.productType;
        this.tags = info.tags;
        this.images = info.images;
        this.metafields = info.metafields || [];
        this.variants = info.variants;
        this.seo = info.seo || { title: "", description: "" };
        this.status = info.status || 'ACTIVE';
    }
    setVariant(variant) {
        this.variants = variant;
    }
    setImage(image) {
        this.images = image;
    }
    addMetafield(metafield) {
        if (metafield == null || typeof metafield == 'undefined')
            return;
        delete metafield.__parentId;
        this.metafields.push(metafield);
    }
    getHandle() {
        return this.handle;
    }
}
exports.default = ShopifyProduct;
