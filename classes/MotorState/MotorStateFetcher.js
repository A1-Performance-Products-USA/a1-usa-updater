import { createRequire as _createRequire } from "module";
const __require = _createRequire(import.meta.url);
const fs = __require("fs");
const Client = __require("ftp");
const path = __require("path");
import { FileFetcher } from './FileFetcher';
export class MSFetcher extends FileFetcher {
    constructor(fetchLocation, fetchFileName, saveLocation, saveFileName) {
        super(fetchLocation, fetchFileName, saveLocation, saveFileName);
        try {
            this.verifyFetchLocation();
        }
        catch (err) {
            console.log(err); //TODO: Create better exception handling.
        }
    }
    verifyFetchLocation() {
        if (!this.fetchLocation.user) {
            throw "The fetch location on MSFetcher is missing: Username"; //TODO: Create better exception handling.
        }
        if (!this.fetchLocation.pass) {
            throw "The fetch location on MSFetcher is missing: Password"; //TODO: Create better exception handling.
        }
    }
    async fetchInformation() {
        return new Promise(async (resolve, reject) => {
            if (fs.existsSync(path.join(this.saveLocation, this.saveFileName))) {
                return resolve(null);
            }
            const self = this;
            let client = new Client();
            client.on('ready', () => {
                client.get('./' + this.fetchFileName, (err, stream) => {
                    if (err)
                        return reject(err);
                    stream.once('close', function () { client.end(); });
                    const saveFile = fs.createWriteStream(self.saveLocation + "/" + this.saveFileName);
                    saveFile.on('error', (err) => {
                        reject(err);
                    });
                    saveFile.on('close', () => {
                        resolve(null);
                    });
                    stream.pipe(saveFile);
                });
            });
            client.connect({
                host: this.fetchLocation.host,
                secure: false,
                user: this.fetchLocation.user,
                password: this.fetchLocation.pass
            });
            client.on('error', function (err) {
                reject(err);
            });
        });
    }
}
