export default class ShopifyVariant {
    id;
    barcode;
    inventoryPolicy;
    price;
    sku;
    weight;
    weightUnit;
    inventoryQuantity;
    inventoryItem;
    locationId;
    __parentId;
    constructor(info) {
        this.id = info.id;
        this.barcode = info.barcode;
        this.inventoryPolicy = info.inventoryPolicy;
        this.price = info.price;
        this.sku = info.sku;
        this.weight = info.weight;
        this.weightUnit = info.weightUnit;
        this.inventoryQuantity = info.inventoryQuantity;
        this.inventoryItem = info.inventoryItem;
        this.locationId = info.locationId;
        this.__parentId = info.__parentId;
    }
    setInventoryLocation(id) {
        this.locationId = id;
    }
}
