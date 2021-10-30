/**
 * Make Http requests
 * @module httpUtils
 */


/**
 * promisified XMLHttpRequest
 * @param {object} options options = {
 *  method,  // default: "GET"
 *  url,
 *  async,  // default: true
 *  requestHeaders : [{name, value}],
 *  data
 * }
 * @returns {object} Resolve returns : { responseText }
 *   Reject returns : { status, statusText, responseText}
 */
export function request(options) {
    return new Promise(function promiseHttpRequest(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open(options.method || "GET", options.url, options.async || true);
        if (options.requestHeaders) {
            for (let i = 0; i < options.requestHeaders.length; i++) {
                xhr.setRequestHeader(options.requestHeaders[i].name, options.requestHeaders[i].value);
            };
        };
        xhr.onloadend = function httpRequestLoadEnd() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                resolve({
                    responseText: xhr.responseText
                });
            } else {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText
                });
            };
        };
        xhr.onerror = function httpRequestError() {
            reject({
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText
            });
        };
        xhr.send(options.data);
    })
}
