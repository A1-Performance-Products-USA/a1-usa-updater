"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MotorStateProduct {
    title;
    part_number;
    description;
    brand;
    price;
    cost;
    length;
    width;
    height;
    weight;
    quantity;
    upc;
    Jobber;
    AAIACode;
    map_price;
    vendor_msrp;
    air_restricted;
    state_restricted;
    freight_only;
    man_part_number;
    shipalone;
    status;
    ms_notes;
    image_url;
    category_1;
    category_2;
    category_3;
    long_description;
    handle;
    constructor(info) {
        this.title = info.title;
        this.part_number = info.part_number;
        this.description = info.description;
        this.brand = info.brand;
        this.price = info.price;
        this.length = info.length;
        this.width = info.width;
        this.height = info.height;
        this.weight = info.weight;
        this.quantity = info.quantity;
        this.upc = info.upc;
        this.Jobber = info.Jobber;
        this.AAIACode = info.AAIACode;
        this.vendor_msrp = info.vendor_msrp;
        this.map_price = info.map_price;
        this.air_restricted = info.air_restricted;
        this.state_restricted = info.state_restricted;
        this.freight_only = info.freight_only;
        this.man_part_number = info.man_part_number;
        this.shipalone = info.shipalone;
        this.status = info.status;
        this.ms_notes = info.ms_notes;
        this.image_url = info.image_url;
        this.category_1 = info.category_1;
        this.category_2 = info.category_2;
        this.category_3 = info.category_3;
        this.long_description = info.long_description;
        this.cost = info.cost;
        this.createHandle();
    }
    createHandle() {
        return this.handle = this.part_number.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '').replace(/^-/, '');
    }
    getHandle() {
        return this.handle;
    }
}
exports.default = MotorStateProduct;
