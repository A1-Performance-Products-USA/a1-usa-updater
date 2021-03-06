"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
require('dotenv').config({ path: path_1.default.join(__dirname, '.env') });
const ChangeList_1 = __importDefault(require("./classes/Comparison/ChangeList"));
const Comparison_1 = __importDefault(require("./classes/Comparison/Comparison"));
const MotorState_1 = __importDefault(require("./classes/MotorState/MotorState"));
const ShopifyHandler_1 = __importDefault(require("./classes/Shopify/ShopifyHandler"));
const perf_hooks_1 = require("perf_hooks");
var fs = require('fs');
var util = require("util");
const d = new Date();
var log_file = fs.createWriteStream(path_1.default.join(__dirname, 'logs', `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}_import.log`), { flags: "w" });
console.log = function (d) {
    //
    log_file.write(util.format(d) + "\n");
    process.stdout.write(util.format(d) + "\n");
};
const perfObserver = new perf_hooks_1.PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
        console.log(entry);
    });
});
perfObserver.observe({ entryTypes: ["measure"] });
(async () => {
    perf_hooks_1.performance.mark("APP_LOAD_TIME_START");
    const DOWNLOAD_DIR = path_1.default.join(__dirname, 'cache');
    const motorstate = new MotorState_1.default({
        host: process.env.MOTORSTATE_HOST,
        user: process.env.MOTORSTATE_USER,
        pass: process.env.MOTORSTATE_PASS
    }, process.env.MOTORSTATE_DAILY_FILE, DOWNLOAD_DIR, "ms_products.csv", ["gdx613", "gdx600", "luc11176", "luc11176-50", "vpf2073", "vpf2075", "vpf2080"]);
    const shopify = new ShopifyHandler_1.default(process.env.SHOPIFY_SHOP, process.env.SHOPIFY_API, process.env.SHOPIFY_WEBHOOK_URL, process.env.SERVER_PORT, DOWNLOAD_DIR, "sh_products.jsonl");
    try {
        perf_hooks_1.performance.mark("MS_LOAD_TIME_START");
        console.log("Loading MotorState Products...");
        await motorstate.loadProducts();
        perf_hooks_1.performance.mark("MS_LOAD_TIME_END");
        perf_hooks_1.performance.measure("MS_LOAD_TIME", "MS_LOAD_TIME_START", "MS_LOAD_TIME_END");
        perf_hooks_1.performance.mark("SH_LOAD_TIME_START");
        console.log("Loading Shopify Products...");
        await shopify.getProducts();
        perf_hooks_1.performance.mark("SH_LOAD_TIME_END");
        perf_hooks_1.performance.measure("SH_LOAD_TIME", "SH_LOAD_TIME_START", "SH_LOAD_TIME_END");
        perf_hooks_1.performance.mark("CMPR_LOAD_TIME_START");
        console.log("Comparing and saving the changes...");
        const changeList = new ChangeList_1.default(DOWNLOAD_DIR, "sh_creations", "sh_updates");
        shopify.mutator.setSavePaths(DOWNLOAD_DIR, changeList.createFileName, changeList.updateFileName);
        const compare = new Comparison_1.default(changeList, motorstate.productList, shopify.products);
        await compare.processProducts();
        perf_hooks_1.performance.mark("CMPR_LOAD_TIME_END");
        perf_hooks_1.performance.measure("CMPR_LOAD_TIME", "CMPR_LOAD_TIME_START", "CMPR_LOAD_TIME_END");
        console.log('Files written... Starting Updater...');
        if (changeList.updateCount > 0 || changeList.createCount > 0) {
            perf_hooks_1.performance.mark("UPDT_LOAD_TIME_START");
            await shopify.updateProducts(changeList.createCount, changeList.updateCount);
            perf_hooks_1.performance.mark("UPDT_LOAD_TIME_END");
            perf_hooks_1.performance.measure("UPDT_LOAD_TIME", "UPDT_LOAD_TIME_START", "UPDT_LOAD_TIME_END");
        }
        else {
            console.log('No creations or changes were found.');
        }
        console.log('Process Complete!');
        perf_hooks_1.performance.mark("APP_LOAD_TIME_END");
        perf_hooks_1.performance.measure("APP_LOAD_TIME", "APP_LOAD_TIME_START", "APP_LOAD_TIME_END");
        return process.exit(1);
    }
    catch (err) {
        shopify.terminate();
        console.log(err);
        return process.exit(0);
    }
})();
