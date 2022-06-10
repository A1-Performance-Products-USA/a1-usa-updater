import path from 'path';
require('dotenv').config({ path: path.join(__dirname, '.env') });
import Cleaner from "@class/Cleaner";
var fs = require('fs');
import util from 'util';
const d = new Date();
var log_file = fs.createWriteStream(path.join(__dirname, 'logs', `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}_cleaner.log`), { flags: "w" });
console.log = function (d) {
    //
    log_file.write(util.format(d) + "\n");
    process.stdout.write(util.format(d) + "\n");
};
(() => {
    const cleaner = new Cleaner(path.join(__dirname, 'cache'), parseInt(process.env.CLEANER_CACHE_DAYS), path.join(__dirname, 'logs'), parseInt(process.env.CLEANER_LOGS_DAYS));
    return cleaner.clean();
})();
