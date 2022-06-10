import path from 'path';
require('dotenv').config({ path: path.join(__dirname, '.env') });
import ChangeList from "@class/Comparison/ChangeList";
import Comparison from "@class/Comparison/Comparison";
import MotorState from "@class/MotorState/MotorState";
import ShopifyHandler from "@class/Shopify/ShopifyHandler";
import { PerformanceObserver, performance } from "perf_hooks";
var fs = require('fs');
var util = require("util");
const d = new Date();
var log_file = fs.createWriteStream(path.join(__dirname, 'logs', `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}_${d.getHours()}_inventory.log`), { flags: "w" });
console.log = function (d) {
    //
    log_file.write(util.format(d) + "\n");
    process.stdout.write(util.format(d) + "\n");
};
const perfObserver = new PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
        console.log(entry);
    });
});
perfObserver.observe({ entryTypes: ["measure"] });
(async () => {
    performance.mark("APP_LOAD_TIME_START");
    const DOWNLOAD_DIR = path.join(__dirname, 'cache');
    const motorstate = new MotorState({
        host: process.env.MOTORSTATE_HOST,
        user: process.env.MOTORSTATE_USER,
        pass: process.env.MOTORSTATE_PASS
    }, process.env.MOTORSTATE_INVENTORY_FILE, DOWNLOAD_DIR, d.getHours() + "_ms_inventory.csv", ["gdx613", "luc11176", "luc11176-50", "vpf2073", "vpf2075", "vpf2080"]);
    const shopify = new ShopifyHandler(process.env.SHOPIFY_SHOP, process.env.SHOPIFY_API, process.env.SHOPIFY_WEBHOOK_URL, process.env.SERVER_PORT, DOWNLOAD_DIR, d.getHours() + "_sh_inventory.jsonl");
    try {
        performance.mark("MS_LOAD_TIME_START");
        console.log("Loading MotorState Products...");
        await motorstate.loadInventory();
        performance.mark("MS_LOAD_TIME_END");
        performance.measure("MS_LOAD_TIME", "MS_LOAD_TIME_START", "MS_LOAD_TIME_END");
        performance.mark("SH_LOAD_TIME_START");
        console.log("Loading Shopify Products...");
        await shopify.loadInventory();
        performance.mark("SH_LOAD_TIME_END");
        performance.measure("SH_LOAD_TIME", "SH_LOAD_TIME_START", "SH_LOAD_TIME_END");
        performance.mark("CMPR_LOAD_TIME_START");
        console.log("Comparing and saving the changes...");
        const changeList = new ChangeList(DOWNLOAD_DIR, d.getHours() + "_sh_creations", d.getHours() + "_sh_updates");
        shopify.mutator.setSavePaths(DOWNLOAD_DIR, changeList.createFileName, changeList.updateFileName);
        const compare = new Comparison(changeList, motorstate.productList, shopify.products);
        await compare.processInventory();
        performance.mark("CMPR_LOAD_TIME_END");
        performance.measure("CMPR_LOAD_TIME", "CMPR_LOAD_TIME_START", "CMPR_LOAD_TIME_END");
        console.log('Files written... Starting Updater...');
        if (changeList.updateCount > 0) {
            performance.mark("UPDT_LOAD_TIME_START");
            await shopify.updateInventory(changeList.updateCount);
            performance.mark("UPDT_LOAD_TIME_END");
            performance.measure("UPDT_LOAD_TIME", "UPDT_LOAD_TIME_START", "UPDT_LOAD_TIME_END");
        }
        else {
            console.log('No changes were found!');
        }
        console.log('Process Complete!');
        performance.mark("APP_LOAD_TIME_END");
        performance.measure("APP_LOAD_TIME", "APP_LOAD_TIME_START", "APP_LOAD_TIME_END");
        return process.exit(1);
    }
    catch (err) {
        shopify.terminate();
        console.log(err);
        return process.exit(0);
    }
})();
