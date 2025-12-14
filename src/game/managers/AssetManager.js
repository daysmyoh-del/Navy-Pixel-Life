export class AssetManager {
    constructor() {
        this.images = {};
    }

    async loadImages(assets) {
        const promises = Object.keys(assets).map(key => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = assets[key];
                img.onload = () => {
                    this.images[key] = img;
                    resolve();
                };
                img.onerror = reject;
            });
        });
        await Promise.all(promises);
    }

    getImage(key) {
        return this.images[key];
    }
}
