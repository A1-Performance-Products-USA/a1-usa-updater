"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
class Cleaner {
    date;
    time;
    cacheDir;
    cacheDays;
    logDir;
    logDays;
    oldDay;
    constructor(cacheDir, cacheDays, logDir, logDays) {
        this.date = new Date();
        this.time = this.date.getTime();
        this.cacheDir = cacheDir;
        this.cacheDays = cacheDays;
        this.logDir = logDir;
        this.logDays = logDays;
    }
    getTimeDifference(file) {
        let ext = path.extname(file);
        let fileName = path.basename(file).replace(ext, "");
        let fileNameSplit = fileName.split("_");
        let fileDate = fileNameSplit[0].split("-");
        let newFileDate = new Date(parseInt(fileDate[2]), (parseInt(fileDate[1]) - 1), parseInt(fileDate[0]));
        let dateDiff = this.time - newFileDate.getTime();
        return dateDiff / (1000 * 3600 * 24);
    }
    cleanCache() {
        try {
            let filenames = fs.readdirSync(this.cacheDir);
            filenames.forEach((file, i) => {
                if (this.getTimeDifference(file) > this.cacheDays) {
                    fs.unlinkSync(`${this.cacheDir}/${file}`);
                    console.log("Removing file: " + `${this.logDir}/${file}`);
                }
            });
        }
        catch (err) {
            console.log(err);
        }
    }
    cleanLogs() {
        try {
            let filenames = fs.readdirSync(this.logDir);
            filenames.forEach((file, i) => {
                if (this.getTimeDifference(file) > this.logDays) {
                    fs.unlinkSync(`${this.logDir}/${file}`);
                    console.log("Removing file: " + `${this.logDir}/${file}`);
                }
            });
        }
        catch (err) {
            console.log(err);
        }
    }
    clean() {
        console.log("Starting to clean up the application cache and logs.");
        this.cleanCache();
        this.cleanLogs();
        console.log("Cleaned up application cache and logs.");
    }
}
exports.default = Cleaner;
