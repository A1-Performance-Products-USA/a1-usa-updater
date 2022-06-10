export class FileFetcher {
    fetchLocation;
    fetchFileName;
    saveLocation;
    saveFileName;
    constructor(fetchLocation, fetchFileName, saveLocation, saveFileName) {
        const d = new Date();
        this.fetchLocation = fetchLocation;
        this.fetchFileName = fetchFileName;
        this.saveLocation = saveLocation;
        this.saveFileName = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}_${saveFileName}`;
    }
}
