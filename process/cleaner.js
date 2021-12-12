"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Cleaner_1 = __importDefault(require("../classes/Cleaner"));
var fs = require('fs');
const util_1 = __importDefault(require("util"));
const d = new Date();
var log_file = fs.createWriteStream(`./build/logs/${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}_cleaner.log`, { flags: "w" });
console.log = function (d) {
    //
    log_file.write(util_1.default.format(d) + "\n");
    process.stdout.write(util_1.default.format(d) + "\n");
};
require('dotenv').config()(() => {
    const cleaner = new Cleaner_1.default('./build/cache', parseInt(process.env.CLEANER_CACHE_DAYS), './build/logs', parseInt(process.env.CLEANER_LOGS_DAYS));
    return cleaner.clean();
})();
