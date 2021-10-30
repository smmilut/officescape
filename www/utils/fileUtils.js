/**
 * Load and cache files
 * @module fileUtils
 */

/**
* Load and cache images
*/
export const ImageLoader = (function build_ImageLoader() {
    const obj_ImageLoader = {};
    const ImageLoader_cache = new Map();

    /**
    * Get image from cache or load it if not found
    */
    obj_ImageLoader.get = async function ImageLoader_get(src) {
        if (ImageLoader_cache.has(src)) {
            /// getting Promise from cache
            return ImageLoader_cache.get(src);
        } else {
            /// loading image and returning Promise
            let imagePromise = loadImage(src);
            /// adding Promise to cache
            ImageLoader_cache.set(src, imagePromise);
            return imagePromise;
        }
    };

    /**
    * Actually load image file (not from cache)
    */
    function loadImage(src) {
        return new Promise(function promiseImageLoading(resolve, reject) {
            const image = new Image();
            image.addEventListener("load", function onloadImage() {
                resolve(image);
            });
            image.addEventListener("error", function onerrorImage() {
                console.warn("image load error", src);
                reject();
            });
            image.src = src;
        });
    }

    return obj_ImageLoader;
})();
