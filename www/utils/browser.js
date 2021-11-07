/**
 * Browser utilities
 */

/**
 * The BrowserInfo Resource
 */
const Resource_BrowserInfo = {
    name: "browserInfo",
    prepareInit: function BrowserInfo_prepareInit(initOptions) {
        this.initOptions = initOptions || {};
    },
    init: function BrowserInfo_init() {
        this.urlParameters = new URLSearchParams(window.location.search);
    },
};

/** Call when loading */
export function init(engine) {
    engine.registerResource(Resource_BrowserInfo);
}