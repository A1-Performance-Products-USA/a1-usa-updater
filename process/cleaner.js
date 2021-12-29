"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config({ path: './.env' });
const Cleaner_1 = __importDefault(require("../classes/Cleaner"));
const path_1 = __importDefault(require("path"));
var fs = require('fs');
const util_1 = __importDefault(require("util"));
const d = new Date();
var log_file = fs.createWriteStream(`./logs/${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}_cleaner.log`, { flags: "w" });
console.log = function (d) {
    //
    log_file.write(util_1.default.format(d) + "\n");
    process.stdout.write(util_1.default.format(d) + "\n");
};
(() => {
    const cleaner = new Cleaner_1.default(path_1.default.join(__dirname, 'cache'), parseInt(process.env.CLEANER_CACHE_DAYS), path_1.default.join(__dirname, 'logs'), parseInt(process.env.CLEANER_LOGS_DAYS));
    return cleaner.clean();
})();
