const PORT = 8080;
export default class ShopifyBulkHandler {
    saveLocation;
    saveFileName;
    kind;
    requester;
    listener;
    downloadURL;
    getDownloadLinkQuery;
    bulkID;
    constructor(requester, listener, saveLocation, saveFileName, kind) {
        this.requester = requester;
        this.listener = listener;
        const d = new Date();
        this.saveLocation = saveLocation;
        this.saveFileName = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}_${saveFileName}`;
        this.kind = kind;
        this.getDownloadLinkQuery = { data: `
               {
                    currentBulkOperation {
                         id
                         url
                    }
               }
          ` };
    }
    async getDownloadURL() {
        return new Promise(async (resolve, reject) => {
            try {
                const req = await this.requester.query(this.getDownloadLinkQuery);
                this.bulkID = req.body["data"].currentBulkOperation.id || req.body["data"].currentBulkOperation[0].id;
                this.downloadURL = req.body["data"].currentBulkOperation.url || req.body["data"].currentBulkOperation[0].url;
                console.log("This bulk operation ID: " + this.bulkID);
                console.log("This bulk download URL: " + this.downloadURL);
                resolve(this.downloadURL);
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
