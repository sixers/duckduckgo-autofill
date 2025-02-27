(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processConfig = processConfig;

function getTopLevelURL() {
  try {
    // FROM: https://stackoverflow.com/a/7739035/73479
    // FIX: Better capturing of top level URL so that trackers in embedded documents are not considered first party
    if (window.location !== window.parent.location) {
      return new URL(window.location.href !== 'about:blank' ? document.referrer : window.parent.location.href);
    } else {
      return new URL(window.location.href);
    }
  } catch (error) {
    return new URL(location.href);
  }
}

function isUnprotectedDomain(topLevelUrl, featureList) {
  let unprotectedDomain = false;
  const domainParts = topLevelUrl && topLevelUrl.host ? topLevelUrl.host.split('.') : []; // walk up the domain to see if it's unprotected

  while (domainParts.length > 1 && !unprotectedDomain) {
    const partialDomain = domainParts.join('.');
    unprotectedDomain = featureList.filter(domain => domain.domain === partialDomain).length > 0;
    domainParts.shift();
  }

  return unprotectedDomain;
}

function processConfig(data, userList, preferences) {
  const topLevelUrl = getTopLevelURL();
  const allowlisted = userList.filter(domain => domain === topLevelUrl.host).length > 0;
  const enabledFeatures = Object.keys(data.features).filter(featureName => {
    const feature = data.features[featureName];
    return feature.state === 'enabled' && !isUnprotectedDomain(topLevelUrl, feature.exceptions);
  });
  const isBroken = isUnprotectedDomain(topLevelUrl, data.unprotectedTemporary);
  preferences.site = {
    domain: topLevelUrl.hostname,
    isBroken,
    allowlisted,
    enabledFeatures
  }; // TODO

  preferences.cookie = {};
  return preferences;
}

},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _messaging = require("./messaging.js");

Object.keys(_messaging).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _messaging[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _messaging[key];
    }
  });
});

},{"./messaging.js":3}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MissingHandler = exports.MessagingTransport = exports.Messaging = void 0;
Object.defineProperty(exports, "WebkitMessagingConfig", {
  enumerable: true,
  get: function () {
    return _webkit.WebkitMessagingConfig;
  }
});
Object.defineProperty(exports, "WindowsMessagingConfig", {
  enumerable: true,
  get: function () {
    return _windows.WindowsMessagingConfig;
  }
});

var _windows = require("./messaging/windows.js");

var _webkit = require("./messaging/webkit.js");

/**
 * @module Messaging
 *
 * @description
 *
 * An abstraction for communications between JavaScript and host platforms.
 *
 * 1) First you construct your platform-specific configuration (eg: {@link WebkitMessagingConfig})
 * 2) Then use that to get an instance of the Messaging utility which allows
 * you to send and receive data in a unified way
 * 3) Each platform implements {@link MessagingTransport} along with its own Configuration
 *     - For example, to learn what configuration is required for Webkit, see: {@link "Webkit Messaging".WebkitMessagingConfig}
 *     - Or, to learn about how messages are sent and received in Webkit, see {@link "Webkit Messaging".WebkitMessagingTransport}
 *
 * @example Webkit Messaging
 *
 * ```js
 * import { Messaging, WebkitMessagingConfig } from "@duckduckgo/content-scope-scripts/lib/messaging.js"
 *
 * // This config would be injected into the UserScript
 * const injectedConfig = {
 *   hasModernWebkitAPI: true,
 *   webkitMessageHandlerNames: ["foo", "bar", "baz"],
 *   secret: "dax",
 * };
 *
 * // Then use that config to construct platform-specific configuration
 * const config = new WebkitMessagingConfig(injectedConfig);
 *
 * // finally, get an instance of Messaging and start sending messages in a unified way 🚀
 * const messaging = new Messaging(config);
 * messaging.notify("hello world!", {foo: "bar"})
 *
 * ```
 *
 * @example Windows Messaging
 *
 * ```js
 * import { Messaging, WindowsMessagingConfig } from "@duckduckgo/content-scope-scripts/lib/messaging.js"
 *
 * // Messaging on Windows is namespaced, so you can create multiple messaging instances
 * const autofillConfig  = new WindowsMessagingConfig({ featureName: "Autofill" });
 * const debugConfig     = new WindowsMessagingConfig({ featureName: "Debugging" });
 *
 * const autofillMessaging = new Messaging(autofillConfig);
 * const debugMessaging    = new Messaging(debugConfig);
 *
 * // Now send messages to both features as needed 🚀
 * autofillMessaging.notify("storeFormData", { "username": "dax" })
 * debugMessaging.notify("pageLoad", { time: window.performance.now() })
 * ```
 */

/**
 * @implements {MessagingTransport}
 */
class Messaging {
  /**
   * @param {WebkitMessagingConfig | WindowsMessagingConfig} config
   */
  constructor(config) {
    this.transport = getTransport(config);
  }
  /**
   * Send a 'fire-and-forget' message.
   * @throws
   * {@link MissingHandler}
   *
   * @example
   *
   * ```
   * const messaging = new Messaging(config)
   * messaging.notify("foo", {bar: "baz"})
   * ```
   * @param {string} name
   * @param {Record<string, any>} [data]
   */


  notify(name) {
    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.transport.notify(name, data);
  }
  /**
   * Send a request, and wait for a response
   * @throws
   * {@link MissingHandler}
   *
   * @example
   * ```
   * const messaging = new Messaging(config)
   * const response = await messaging.request("foo", {bar: "baz"})
   * ```
   *
   * @param {string} name
   * @param {Record<string, any>} [data]
   * @return {Promise<any>}
   */


  request(name) {
    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return this.transport.request(name, data);
  }

}
/**
 * @interface
 */


exports.Messaging = Messaging;

class MessagingTransport {
  /**
   * @param {string} name
   * @param {Record<string, any>} [data]
   * @returns {void}
   */
  // @ts-ignore - ignoring a no-unused ts error, this is only an interface.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  notify(name) {
    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    throw new Error("must implement 'notify'");
  }
  /**
   * @param {string} name
   * @param {Record<string, any>} [data]
   * @return {Promise<any>}
   */
  // @ts-ignore - ignoring a no-unused ts error, this is only an interface.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars


  request(name) {
    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    throw new Error('must implement');
  }

}
/**
 * @param {WebkitMessagingConfig | WindowsMessagingConfig} config
 * @returns {MessagingTransport}
 */


exports.MessagingTransport = MessagingTransport;

function getTransport(config) {
  if (config instanceof _webkit.WebkitMessagingConfig) {
    return new _webkit.WebkitMessagingTransport(config);
  }

  if (config instanceof _windows.WindowsMessagingConfig) {
    return new _windows.WindowsMessagingTransport(config);
  }

  throw new Error('unreachable');
}
/**
 * Thrown when a handler cannot be found
 */


class MissingHandler extends Error {
  /**
   * @param {string} message
   * @param {string} handlerName
   */
  constructor(message, handlerName) {
    super(message);
    this.handlerName = handlerName;
  }

}
/**
 * Some re-exports for convenience
 */


exports.MissingHandler = MissingHandler;

},{"./messaging/webkit.js":4,"./messaging/windows.js":5}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebkitMessagingTransport = exports.WebkitMessagingConfig = exports.SecureMessagingParams = void 0;

var _messaging = require("../messaging.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @example
 * On macOS 11+, this will just call through to `window.webkit.messageHandlers.x.postMessage`
 *
 * Eg: for a `foo` message defined in Swift that accepted the payload `{"bar": "baz"}`, the following
 * would occur:
 *
 * ```js
 * const json = await window.webkit.messageHandlers.foo.postMessage({ bar: "baz" });
 * const response = JSON.parse(json)
 * ```
 *
 * @example
 * On macOS 10 however, the process is a little more involved. A method will be appended to `window`
 * that allows the response to be delivered there instead. It's not exactly this, but you can visualize the flow
 * as being something along the lines of:
 *
 * ```js
 * // add the window method
 * window["_0123456"] = (response) => {
 *    // decrypt `response` and deliver the result to the caller here
 *    // then remove the temporary method
 *    delete window["_0123456"]
 * };
 *
 * // send the data + `messageHanding` values
 * window.webkit.messageHandlers.foo.postMessage({
 *   bar: "baz",
 *   messagingHandling: {
 *     methodName: "_0123456",
 *     secret: "super-secret",
 *     key: [1, 2, 45, 2],
 *     iv: [34, 4, 43],
 *   }
 * });
 *
 * // later in swift, the following JavaScript snippet will be executed
 * (() => {
 *   window["_0123456"]({
 *     ciphertext: [12, 13, 4],
 *     tag: [3, 5, 67, 56]
 *   })
 * })()
 * ```
 * @implements {MessagingTransport}
 */
class WebkitMessagingTransport {
  /** @type {WebkitMessagingConfig} */

  /**
   * @param {WebkitMessagingConfig} config
   */
  constructor(config) {
    _defineProperty(this, "config", void 0);

    _defineProperty(this, "globals", void 0);

    _defineProperty(this, "algoObj", {
      name: 'AES-GCM',
      length: 256
    });

    this.config = config;
    this.globals = captureGlobals();

    if (!this.config.hasModernWebkitAPI) {
      this.captureWebkitHandlers(this.config.webkitMessageHandlerNames);
    }
  }
  /**
   * Sends message to the webkit layer (fire and forget)
   * @param {String} handler
   * @param {*} data
   * @internal
   */


  wkSend(handler) {
    var _this$globals$window$, _this$globals$window$2;

    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (!(handler in this.globals.window.webkit.messageHandlers)) {
      throw new _messaging.MissingHandler("Missing webkit handler: '".concat(handler, "'"), handler);
    }

    const outgoing = { ...data,
      messageHandling: { ...data.messageHandling,
        secret: this.config.secret
      }
    };

    if (!this.config.hasModernWebkitAPI) {
      if (!(handler in this.globals.capturedWebkitHandlers)) {
        throw new _messaging.MissingHandler("cannot continue, method ".concat(handler, " not captured on macos < 11"), handler);
      } else {
        return this.globals.capturedWebkitHandlers[handler](outgoing);
      }
    }

    return (_this$globals$window$ = (_this$globals$window$2 = this.globals.window.webkit.messageHandlers[handler]).postMessage) === null || _this$globals$window$ === void 0 ? void 0 : _this$globals$window$.call(_this$globals$window$2, outgoing);
  }
  /**
   * Sends message to the webkit layer and waits for the specified response
   * @param {String} handler
   * @param {*} data
   * @returns {Promise<*>}
   * @internal
   */


  async wkSendAndWait(handler) {
    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (this.config.hasModernWebkitAPI) {
      const response = await this.wkSend(handler, data);
      return this.globals.JSONparse(response || '{}');
    }

    try {
      const randMethodName = this.createRandMethodName();
      const key = await this.createRandKey();
      const iv = this.createRandIv();
      const {
        ciphertext,
        tag
      } = await new this.globals.Promise((
      /** @type {any} */
      resolve) => {
        this.generateRandomMethod(randMethodName, resolve);
        data.messageHandling = new SecureMessagingParams({
          methodName: randMethodName,
          secret: this.config.secret,
          key: this.globals.Arrayfrom(key),
          iv: this.globals.Arrayfrom(iv)
        });
        this.wkSend(handler, data);
      });
      const cipher = new this.globals.Uint8Array([...ciphertext, ...tag]);
      const decrypted = await this.decrypt(cipher, key, iv);
      return this.globals.JSONparse(decrypted || '{}');
    } catch (e) {
      // re-throw when the error is just a 'MissingHandler'
      if (e instanceof _messaging.MissingHandler) {
        throw e;
      } else {
        console.error('decryption failed', e);
        console.error(e);
        return {
          error: e
        };
      }
    }
  }
  /**
   * @param {string} name
   * @param {Record<string, any>} [data]
   */


  notify(name) {
    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.wkSend(name, data);
  }
  /**
   * @param {string} name
   * @param {Record<string, any>} [data]
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars


  request(name) {
    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return this.wkSendAndWait(name, data);
  }
  /**
   * Generate a random method name and adds it to the global scope
   * The native layer will use this method to send the response
   * @param {string | number} randomMethodName
   * @param {Function} callback
   */


  generateRandomMethod(randomMethodName, callback) {
    var _this = this;

    this.globals.ObjectDefineProperty(this.globals.window, randomMethodName, {
      enumerable: false,
      // configurable, To allow for deletion later
      configurable: true,
      writable: false,

      /**
       * @param {any[]} args
       */
      value: function () {
        callback(...arguments); // @ts-ignore - we want this to throw if it fails as it would indicate a fatal error.

        delete _this.globals.window[randomMethodName];
      }
    });
  }

  randomString() {
    return '' + this.globals.getRandomValues(new this.globals.Uint32Array(1))[0];
  }

  createRandMethodName() {
    return '_' + this.randomString();
  }
  /**
   * @type {{name: string, length: number}}
   */


  /**
   * @returns {Promise<Uint8Array>}
   */
  async createRandKey() {
    const key = await this.globals.generateKey(this.algoObj, true, ['encrypt', 'decrypt']);
    const exportedKey = await this.globals.exportKey('raw', key);
    return new this.globals.Uint8Array(exportedKey);
  }
  /**
   * @returns {Uint8Array}
   */


  createRandIv() {
    return this.globals.getRandomValues(new this.globals.Uint8Array(12));
  }
  /**
   * @param {BufferSource} ciphertext
   * @param {BufferSource} key
   * @param {Uint8Array} iv
   * @returns {Promise<string>}
   */


  async decrypt(ciphertext, key, iv) {
    const cryptoKey = await this.globals.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
    const algo = {
      name: 'AES-GCM',
      iv
    };
    let decrypted = await this.globals.decrypt(algo, cryptoKey, ciphertext);
    let dec = new this.globals.TextDecoder();
    return dec.decode(decrypted);
  }
  /**
   * When required (such as on macos 10.x), capture the `postMessage` method on
   * each webkit messageHandler
   *
   * @param {string[]} handlerNames
   */


  captureWebkitHandlers(handlerNames) {
    const handlers = window.webkit.messageHandlers;
    if (!handlers) throw new _messaging.MissingHandler('window.webkit.messageHandlers was absent', 'all');

    for (let webkitMessageHandlerName of handlerNames) {
      var _handlers$webkitMessa;

      if (typeof ((_handlers$webkitMessa = handlers[webkitMessageHandlerName]) === null || _handlers$webkitMessa === void 0 ? void 0 : _handlers$webkitMessa.postMessage) === 'function') {
        var _handlers$webkitMessa2;

        /**
         * `bind` is used here to ensure future calls to the captured
         * `postMessage` have the correct `this` context
         */
        const original = handlers[webkitMessageHandlerName];
        const bound = (_handlers$webkitMessa2 = handlers[webkitMessageHandlerName].postMessage) === null || _handlers$webkitMessa2 === void 0 ? void 0 : _handlers$webkitMessa2.bind(original);
        this.globals.capturedWebkitHandlers[webkitMessageHandlerName] = bound;
        delete handlers[webkitMessageHandlerName].postMessage;
      }
    }
  }

}
/**
 * Use this configuration to create an instance of {@link Messaging} for WebKit
 *
 * ```js
 * import { fromConfig, WebkitMessagingConfig } from "@duckduckgo/content-scope-scripts/lib/messaging.js"
 *
 * const config = new WebkitMessagingConfig({
 *   hasModernWebkitAPI: true,
 *   webkitMessageHandlerNames: ["foo", "bar", "baz"],
 *   secret: "dax",
 * });
 *
 * const messaging = new Messaging(config)
 * const resp = await messaging.request("debugConfig")
 * ```
 */


exports.WebkitMessagingTransport = WebkitMessagingTransport;

class WebkitMessagingConfig {
  /**
   * @param {object} params
   * @param {boolean} params.hasModernWebkitAPI
   * @param {string[]} params.webkitMessageHandlerNames
   * @param {string} params.secret
   */
  constructor(params) {
    /**
     * Whether or not the current WebKit Platform supports secure messaging
     * by default (eg: macOS 11+)
     */
    this.hasModernWebkitAPI = params.hasModernWebkitAPI;
    /**
     * A list of WebKit message handler names that a user script can send
     */

    this.webkitMessageHandlerNames = params.webkitMessageHandlerNames;
    /**
     * A string provided by native platforms to be sent with future outgoing
     * messages
     */

    this.secret = params.secret;
  }

}
/**
 * This is the additional payload that gets appended to outgoing messages.
 * It's used in the Swift side to encrypt the response that comes back
 */


exports.WebkitMessagingConfig = WebkitMessagingConfig;

class SecureMessagingParams {
  /**
   * @param {object} params
   * @param {string} params.methodName
   * @param {string} params.secret
   * @param {number[]} params.key
   * @param {number[]} params.iv
   */
  constructor(params) {
    /**
     * The method that's been appended to `window` to be called later
     */
    this.methodName = params.methodName;
    /**
     * The secret used to ensure message sender validity
     */

    this.secret = params.secret;
    /**
     * The CipherKey as number[]
     */

    this.key = params.key;
    /**
     * The Initial Vector as number[]
     */

    this.iv = params.iv;
  }

}
/**
 * Capture some globals used for messaging handling to prevent page
 * scripts from tampering with this
 */


exports.SecureMessagingParams = SecureMessagingParams;

function captureGlobals() {
  // Creat base with null prototype
  return {
    window,
    // Methods must be bound to their interface, otherwise they throw Illegal invocation
    encrypt: window.crypto.subtle.encrypt.bind(window.crypto.subtle),
    decrypt: window.crypto.subtle.decrypt.bind(window.crypto.subtle),
    generateKey: window.crypto.subtle.generateKey.bind(window.crypto.subtle),
    exportKey: window.crypto.subtle.exportKey.bind(window.crypto.subtle),
    importKey: window.crypto.subtle.importKey.bind(window.crypto.subtle),
    getRandomValues: window.crypto.getRandomValues.bind(window.crypto),
    TextEncoder,
    TextDecoder,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    JSONstringify: window.JSON.stringify,
    JSONparse: window.JSON.parse,
    Arrayfrom: window.Array.from,
    Promise: window.Promise,
    ObjectDefineProperty: window.Object.defineProperty,
    addEventListener: window.addEventListener.bind(window),

    /** @type {Record<string, any>} */
    capturedWebkitHandlers: {}
  };
}

},{"../messaging.js":3}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WindowsMessagingTransport = exports.WindowsMessagingConfig = void 0;

var _messaging = require("../messaging.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @implements {MessagingTransport}
 */
class WindowsMessagingTransport {
  /**
   * @param {WindowsMessagingConfig} config
   */
  constructor(config) {
    _defineProperty(this, "config", void 0);

    this.config = config;
  }
  /**
   * @param {string} name
   * @param {Record<string, any>} [data]
   */
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars


  notify(name) {
    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    throw new Error('todo: implement notify for windows');
  }
  /**
   * @param {string} name
   * @param {Record<string, any>} [data]
   * @param {{signal?: AbortSignal}} opts
   * @return {Promise<any>}
   */
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars


  request(name) {
    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    throw new Error('todo: implement request for windows');
  }

}

exports.WindowsMessagingTransport = WindowsMessagingTransport;

class WindowsMessagingConfig {
  /**
   * @param {object} params
   * @param {string} params.featureName
   */
  constructor(params) {
    this.featureName = params.featureName;
  }

}

exports.WindowsMessagingConfig = WindowsMessagingConfig;

},{"../messaging.js":3}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setErrorMap = exports.overrideErrorMap = exports.defaultErrorMap = exports.ZodError = exports.quotelessJson = exports.ZodIssueCode = void 0;

const parseUtil_1 = require("./helpers/parseUtil");

const util_1 = require("./helpers/util");

exports.ZodIssueCode = util_1.util.arrayToEnum(["invalid_type", "invalid_literal", "custom", "invalid_union", "invalid_union_discriminator", "invalid_enum_value", "unrecognized_keys", "invalid_arguments", "invalid_return_type", "invalid_date", "invalid_string", "too_small", "too_big", "invalid_intersection_types", "not_multiple_of"]);

const quotelessJson = obj => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};

exports.quotelessJson = quotelessJson;

class ZodError extends Error {
  constructor(issues) {
    var _this;

    super();
    _this = this;
    this.issues = [];

    this.addIssue = sub => {
      this.issues = [...this.issues, sub];
    };

    this.addIssues = function () {
      let subs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      _this.issues = [..._this.issues, ...subs];
    };

    const actualProto = new.target.prototype;

    if (Object.setPrototypeOf) {
      // eslint-disable-next-line ban/ban
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }

    this.name = "ZodError";
    this.issues = issues;
  }

  get errors() {
    return this.issues;
  }

  format(_mapper) {
    const mapper = _mapper || function (issue) {
      return issue.message;
    };

    const fieldErrors = {
      _errors: []
    };

    const processError = error => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;

          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;

            if (!terminal) {
              curr[el] = curr[el] || {
                _errors: []
              }; // if (typeof el === "string") {
              //   curr[el] = curr[el] || { _errors: [] };
              // } else if (typeof el === "number") {
              //   const errorArray: any = [];
              //   errorArray._errors = [];
              //   curr[el] = curr[el] || errorArray;
              // }
            } else {
              curr[el] = curr[el] || {
                _errors: []
              };

              curr[el]._errors.push(mapper(issue));
            }

            curr = curr[el];
            i++;
          }
        }
      }
    };

    processError(this);
    return fieldErrors;
  }

  toString() {
    return this.message;
  }

  get message() {
    return JSON.stringify(this.issues, null, 2);
  }

  get isEmpty() {
    return this.issues.length === 0;
  }

  flatten() {
    let mapper = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : issue => issue.message;
    const fieldErrors = {};
    const formErrors = [];

    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
        fieldErrors[sub.path[0]].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }

    return {
      formErrors,
      fieldErrors
    };
  }

  get formErrors() {
    return this.flatten();
  }

}

exports.ZodError = ZodError;

ZodError.create = issues => {
  const error = new ZodError(issues);
  return error;
};

const defaultErrorMap = (issue, _ctx) => {
  let message;

  switch (issue.code) {
    case exports.ZodIssueCode.invalid_type:
      if (issue.received === parseUtil_1.ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = "Expected ".concat(issue.expected, ", received ").concat(issue.received);
      }

      break;

    case exports.ZodIssueCode.invalid_literal:
      message = "Invalid literal value, expected ".concat(JSON.stringify(issue.expected));
      break;

    case exports.ZodIssueCode.unrecognized_keys:
      message = "Unrecognized key(s) in object: ".concat(util_1.util.joinValues(issue.keys, ", "));
      break;

    case exports.ZodIssueCode.invalid_union:
      message = "Invalid input";
      break;

    case exports.ZodIssueCode.invalid_union_discriminator:
      message = "Invalid discriminator value. Expected ".concat(util_1.util.joinValues(issue.options));
      break;

    case exports.ZodIssueCode.invalid_enum_value:
      message = "Invalid enum value. Expected ".concat(util_1.util.joinValues(issue.options), ", received '").concat(issue.received, "'");
      break;

    case exports.ZodIssueCode.invalid_arguments:
      message = "Invalid function arguments";
      break;

    case exports.ZodIssueCode.invalid_return_type:
      message = "Invalid function return type";
      break;

    case exports.ZodIssueCode.invalid_date:
      message = "Invalid date";
      break;

    case exports.ZodIssueCode.invalid_string:
      if (issue.validation !== "regex") message = "Invalid ".concat(issue.validation);else message = "Invalid";
      break;

    case exports.ZodIssueCode.too_small:
      if (issue.type === "array") message = "Array must contain ".concat(issue.inclusive ? "at least" : "more than", " ").concat(issue.minimum, " element(s)");else if (issue.type === "string") message = "String must contain ".concat(issue.inclusive ? "at least" : "over", " ").concat(issue.minimum, " character(s)");else if (issue.type === "number") message = "Number must be greater than ".concat(issue.inclusive ? "or equal to " : "").concat(issue.minimum);else message = "Invalid input";
      break;

    case exports.ZodIssueCode.too_big:
      if (issue.type === "array") message = "Array must contain ".concat(issue.inclusive ? "at most" : "less than", " ").concat(issue.maximum, " element(s)");else if (issue.type === "string") message = "String must contain ".concat(issue.inclusive ? "at most" : "under", " ").concat(issue.maximum, " character(s)");else if (issue.type === "number") message = "Number must be less than ".concat(issue.inclusive ? "or equal to " : "").concat(issue.maximum);else message = "Invalid input";
      break;

    case exports.ZodIssueCode.custom:
      message = "Invalid input";
      break;

    case exports.ZodIssueCode.invalid_intersection_types:
      message = "Intersection results could not be merged";
      break;

    case exports.ZodIssueCode.not_multiple_of:
      message = "Number must be a multiple of ".concat(issue.multipleOf);
      break;

    default:
      message = _ctx.defaultError;
      util_1.util.assertNever(issue);
  }

  return {
    message
  };
};

exports.defaultErrorMap = defaultErrorMap;
exports.overrideErrorMap = exports.defaultErrorMap;

const setErrorMap = map => {
  exports.overrideErrorMap = map;
};

exports.setErrorMap = setErrorMap;

},{"./helpers/parseUtil":9,"./helpers/util":11}],7:[function(require,module,exports){
"use strict";

var __createBinding = void 0 && (void 0).__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);

  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function () {
        return m[k];
      }
    };
  }

  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});

var __exportStar = void 0 && (void 0).__exportStar || function (m, exports) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

__exportStar(require("./helpers/parseUtil"), exports);

__exportStar(require("./helpers/typeAliases"), exports);

__exportStar(require("./types"), exports);

__exportStar(require("./ZodError"), exports);

},{"./ZodError":6,"./helpers/parseUtil":9,"./helpers/typeAliases":10,"./types":13}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.errorUtil = void 0;
var errorUtil;

(function (errorUtil) {
  errorUtil.errToObj = message => typeof message === "string" ? {
    message
  } : message || {};

  errorUtil.toString = message => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
})(errorUtil = exports.errorUtil || (exports.errorUtil = {}));

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isAsync = exports.isValid = exports.isDirty = exports.isAborted = exports.OK = exports.DIRTY = exports.INVALID = exports.ParseStatus = exports.addIssueToContext = exports.EMPTY_PATH = exports.makeIssue = exports.getParsedType = exports.ZodParsedType = void 0;

const ZodError_1 = require("../ZodError");

const util_1 = require("./util");

exports.ZodParsedType = util_1.util.arrayToEnum(["string", "nan", "number", "integer", "float", "boolean", "date", "bigint", "symbol", "function", "undefined", "null", "array", "object", "unknown", "promise", "void", "never", "map", "set"]);

const getParsedType = data => {
  const t = typeof data;

  switch (t) {
    case "undefined":
      return exports.ZodParsedType.undefined;

    case "string":
      return exports.ZodParsedType.string;

    case "number":
      return isNaN(data) ? exports.ZodParsedType.nan : exports.ZodParsedType.number;

    case "boolean":
      return exports.ZodParsedType.boolean;

    case "function":
      return exports.ZodParsedType.function;

    case "bigint":
      return exports.ZodParsedType.bigint;

    case "object":
      if (Array.isArray(data)) {
        return exports.ZodParsedType.array;
      }

      if (data === null) {
        return exports.ZodParsedType.null;
      }

      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return exports.ZodParsedType.promise;
      }

      if (typeof Map !== "undefined" && data instanceof Map) {
        return exports.ZodParsedType.map;
      }

      if (typeof Set !== "undefined" && data instanceof Set) {
        return exports.ZodParsedType.set;
      }

      if (typeof Date !== "undefined" && data instanceof Date) {
        return exports.ZodParsedType.date;
      }

      return exports.ZodParsedType.object;

    default:
      return exports.ZodParsedType.unknown;
  }
};

exports.getParsedType = getParsedType;

const makeIssue = params => {
  const {
    data,
    path,
    errorMaps,
    issueData
  } = params;
  const fullPath = [...path, ...(issueData.path || [])];
  const fullIssue = { ...issueData,
    path: fullPath
  };
  let errorMessage = "";
  const maps = errorMaps.filter(m => !!m).slice().reverse();

  for (const map of maps) {
    errorMessage = map(fullIssue, {
      data,
      defaultError: errorMessage
    }).message;
  }

  return { ...issueData,
    path: fullPath,
    message: issueData.message || errorMessage
  };
};

exports.makeIssue = makeIssue;
exports.EMPTY_PATH = [];

function addIssueToContext(ctx, issueData) {
  const issue = (0, exports.makeIssue)({
    issueData: issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, ZodError_1.overrideErrorMap, ZodError_1.defaultErrorMap // then global default map
    ].filter(x => !!x)
  });
  ctx.common.issues.push(issue);
}

exports.addIssueToContext = addIssueToContext;

class ParseStatus {
  constructor() {
    this.value = "valid";
  }

  dirty() {
    if (this.value === "valid") this.value = "dirty";
  }

  abort() {
    if (this.value !== "aborted") this.value = "aborted";
  }

  static mergeArray(status, results) {
    const arrayValue = [];

    for (const s of results) {
      if (s.status === "aborted") return exports.INVALID;
      if (s.status === "dirty") status.dirty();
      arrayValue.push(s.value);
    }

    return {
      status: status.value,
      value: arrayValue
    };
  }

  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];

    for (const pair of pairs) {
      syncPairs.push({
        key: await pair.key,
        value: await pair.value
      });
    }

    return ParseStatus.mergeObjectSync(status, syncPairs);
  }

  static mergeObjectSync(status, pairs) {
    const finalObject = {};

    for (const pair of pairs) {
      const {
        key,
        value
      } = pair;
      if (key.status === "aborted") return exports.INVALID;
      if (value.status === "aborted") return exports.INVALID;
      if (key.status === "dirty") status.dirty();
      if (value.status === "dirty") status.dirty();

      if (typeof value.value !== "undefined" || pair.alwaysSet) {
        finalObject[key.value] = value.value;
      }
    }

    return {
      status: status.value,
      value: finalObject
    };
  }

}

exports.ParseStatus = ParseStatus;
exports.INVALID = Object.freeze({
  status: "aborted"
});

const DIRTY = value => ({
  status: "dirty",
  value
});

exports.DIRTY = DIRTY;

const OK = value => ({
  status: "valid",
  value
});

exports.OK = OK;

const isAborted = x => x.status === "aborted";

exports.isAborted = isAborted;

const isDirty = x => x.status === "dirty";

exports.isDirty = isDirty;

const isValid = x => x.status === "valid";

exports.isValid = isValid;

const isAsync = x => typeof Promise !== undefined && x instanceof Promise;

exports.isAsync = isAsync;

},{"../ZodError":6,"./util":11}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.util = void 0;
var util;

(function (util) {
  function assertNever(_x) {
    throw new Error();
  }

  util.assertNever = assertNever;

  util.arrayToEnum = items => {
    const obj = {};

    for (const item of items) {
      obj[item] = item;
    }

    return obj;
  };

  util.getValidEnumValues = obj => {
    const validKeys = util.objectKeys(obj).filter(k => typeof obj[obj[k]] !== "number");
    const filtered = {};

    for (const k of validKeys) {
      filtered[k] = obj[k];
    }

    return util.objectValues(filtered);
  };

  util.objectValues = obj => {
    return util.objectKeys(obj).map(function (e) {
      return obj[e];
    });
  };

  util.objectKeys = typeof Object.keys === "function" // eslint-disable-line ban/ban
  ? obj => Object.keys(obj) // eslint-disable-line ban/ban
  : object => {
    const keys = [];

    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }

    return keys;
  };

  util.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item)) return item;
    }

    return undefined;
  };

  util.isInteger = typeof Number.isInteger === "function" ? val => Number.isInteger(val) // eslint-disable-line ban/ban
  : val => typeof val === "number" && isFinite(val) && Math.floor(val) === val;

  function joinValues(array) {
    let separator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : " | ";
    return array.map(val => typeof val === "string" ? "'".concat(val, "'") : val).join(separator);
  }

  util.joinValues = joinValues;
})(util = exports.util || (exports.util = {}));

},{}],12:[function(require,module,exports){
"use strict";

var __createBinding = void 0 && (void 0).__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);

  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function () {
        return m[k];
      }
    };
  }

  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});

var __setModuleDefault = void 0 && (void 0).__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});

var __importStar = void 0 && (void 0).__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);

  __setModuleDefault(result, mod);

  return result;
};

var __exportStar = void 0 && (void 0).__exportStar || function (m, exports) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.z = void 0;

const mod = __importStar(require("./external"));

exports.z = mod;

__exportStar(require("./external"), exports);

exports.default = mod;

},{"./external":7}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.intersection = exports.instanceof = exports.function = exports.enum = exports.effect = exports.discriminatedUnion = exports.date = exports.boolean = exports.bigint = exports.array = exports.any = exports.ZodFirstPartyTypeKind = exports.late = exports.ZodSchema = exports.Schema = exports.custom = exports.ZodNaN = exports.ZodDefault = exports.ZodNullable = exports.ZodOptional = exports.ZodTransformer = exports.ZodEffects = exports.ZodPromise = exports.ZodNativeEnum = exports.ZodEnum = exports.ZodLiteral = exports.ZodLazy = exports.ZodFunction = exports.ZodSet = exports.ZodMap = exports.ZodRecord = exports.ZodTuple = exports.ZodIntersection = exports.ZodDiscriminatedUnion = exports.ZodUnion = exports.ZodObject = exports.objectUtil = exports.ZodArray = exports.ZodVoid = exports.ZodNever = exports.ZodUnknown = exports.ZodAny = exports.ZodNull = exports.ZodUndefined = exports.ZodDate = exports.ZodBoolean = exports.ZodBigInt = exports.ZodNumber = exports.ZodString = exports.ZodType = void 0;
exports.void = exports.unknown = exports.union = exports.undefined = exports.tuple = exports.transformer = exports.string = exports.strictObject = exports.set = exports.record = exports.promise = exports.preprocess = exports.ostring = exports.optional = exports.onumber = exports.oboolean = exports.object = exports.number = exports.nullable = exports.null = exports.never = exports.nativeEnum = exports.nan = exports.map = exports.literal = exports.lazy = void 0;

const errorUtil_1 = require("./helpers/errorUtil");

const parseUtil_1 = require("./helpers/parseUtil");

const util_1 = require("./helpers/util");

const ZodError_1 = require("./ZodError");

class ParseInputLazyPath {
  constructor(parent, value, path, key) {
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }

  get path() {
    return this._path.concat(this._key);
  }

}

const handleResult = (ctx, result) => {
  if ((0, parseUtil_1.isValid)(result)) {
    return {
      success: true,
      data: result.value
    };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }

    const error = new ZodError_1.ZodError(ctx.common.issues);
    return {
      success: false,
      error
    };
  }
};

function processCreateParams(params) {
  if (!params) return {};
  const {
    errorMap,
    invalid_type_error,
    required_error,
    description
  } = params;

  if (errorMap && (invalid_type_error || required_error)) {
    throw new Error("Can't use \"invalid\" or \"required\" in conjunction with custom error map.");
  }

  if (errorMap) return {
    errorMap: errorMap,
    description
  };

  const customMap = (iss, ctx) => {
    if (iss.code !== "invalid_type") return {
      message: ctx.defaultError
    };
    if (typeof ctx.data === "undefined" && required_error) return {
      message: required_error
    };
    if (params.invalid_type_error) return {
      message: params.invalid_type_error
    };
    return {
      message: ctx.defaultError
    };
  };

  return {
    errorMap: customMap,
    description
  };
}

class ZodType {
  constructor(def) {
    /** Alias of safeParseAsync */
    this.spa = this.safeParseAsync;
    this.superRefine = this._refinement;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.default = this.default.bind(this);
    this.describe = this.describe.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
  }

  get description() {
    return this._def.description;
  }

  _getType(input) {
    return (0, parseUtil_1.getParsedType)(input.data);
  }

  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: (0, parseUtil_1.getParsedType)(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }

  _processInputParams(input) {
    return {
      status: new parseUtil_1.ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: (0, parseUtil_1.getParsedType)(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }

  _parseSync(input) {
    const result = this._parse(input);

    if ((0, parseUtil_1.isAsync)(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }

    return result;
  }

  _parseAsync(input) {
    const result = this._parse(input);

    return Promise.resolve(result);
  }

  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success) return result.data;
    throw result.error;
  }

  safeParse(data, params) {
    var _a;

    const ctx = {
      common: {
        issues: [],
        async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,
        contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap
      },
      path: (params === null || params === void 0 ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: (0, parseUtil_1.getParsedType)(data)
    };

    const result = this._parseSync({
      data,
      path: ctx.path,
      parent: ctx
    });

    return handleResult(ctx, result);
  }

  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success) return result.data;
    throw result.error;
  }

  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
        async: true
      },
      path: (params === null || params === void 0 ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: (0, parseUtil_1.getParsedType)(data)
    };

    const maybeAsyncResult = this._parse({
      data,
      path: [],
      parent: ctx
    });

    const result = await ((0, parseUtil_1.isAsync)(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }

  refine(check, message) {
    const getIssueProperties = val => {
      if (typeof message === "string" || typeof message === "undefined") {
        return {
          message
        };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };

    return this._refinement((val, ctx) => {
      const result = check(val);

      const setError = () => ctx.addIssue({
        code: ZodError_1.ZodIssueCode.custom,
        ...getIssueProperties(val)
      });

      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then(data => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }

      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }

  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }

  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: {
        type: "refinement",
        refinement
      }
    });
  }

  optional() {
    return ZodOptional.create(this);
  }

  nullable() {
    return ZodNullable.create(this);
  }

  nullish() {
    return this.optional().nullable();
  }

  array() {
    return ZodArray.create(this);
  }

  promise() {
    return ZodPromise.create(this);
  }

  or(option) {
    return ZodUnion.create([this, option]);
  }

  and(incoming) {
    return ZodIntersection.create(this, incoming);
  }

  transform(transform) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: {
        type: "transform",
        transform
      }
    });
  }

  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }

  describe(description) {
    const This = this.constructor;
    return new This({ ...this._def,
      description
    });
  }

  isOptional() {
    return this.safeParse(undefined).success;
  }

  isNullable() {
    return this.safeParse(null).success;
  }

}

exports.ZodType = ZodType;
exports.Schema = ZodType;
exports.ZodSchema = ZodType;
const cuidRegex = /^c[^\s-]{8,}$/i;
const uuidRegex = /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i; // from https://stackoverflow.com/a/46181/1550155
// old version: too slow, didn't support unicode
// const emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
// eslint-disable-next-line

const emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

class ZodString extends ZodType {
  constructor() {
    super(...arguments);

    this._regex = (regex, validation, message) => this.refinement(data => regex.test(data), {
      validation,
      code: ZodError_1.ZodIssueCode.invalid_string,
      ...errorUtil_1.errorUtil.errToObj(message)
    });
    /**
     * Deprecated.
     * Use z.string().min(1) instead.
     */


    this.nonempty = message => this.min(1, errorUtil_1.errorUtil.errToObj(message));
  }

  _parse(input) {
    const parsedType = this._getType(input);

    if (parsedType !== parseUtil_1.ZodParsedType.string) {
      const ctx = this._getOrReturnCtx(input);

      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.string,
        received: ctx.parsedType
      } //
      );
      return parseUtil_1.INVALID;
    }

    const status = new parseUtil_1.ParseStatus();
    let ctx = undefined;

    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            validation: "email",
            code: ZodError_1.ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            validation: "uuid",
            code: ZodError_1.ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            validation: "cuid",
            code: ZodError_1.ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch (_a) {
          ctx = this._getOrReturnCtx(input, ctx);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            validation: "url",
            code: ZodError_1.ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);

        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            validation: "regex",
            code: ZodError_1.ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      }
    }

    return {
      status: status.value,
      value: input.data
    };
  }

  _addCheck(check) {
    return new ZodString({ ...this._def,
      checks: [...this._def.checks, check]
    });
  }

  email(message) {
    return this._addCheck({
      kind: "email",
      ...errorUtil_1.errorUtil.errToObj(message)
    });
  }

  url(message) {
    return this._addCheck({
      kind: "url",
      ...errorUtil_1.errorUtil.errToObj(message)
    });
  }

  uuid(message) {
    return this._addCheck({
      kind: "uuid",
      ...errorUtil_1.errorUtil.errToObj(message)
    });
  }

  cuid(message) {
    return this._addCheck({
      kind: "cuid",
      ...errorUtil_1.errorUtil.errToObj(message)
    });
  }

  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex: regex,
      ...errorUtil_1.errorUtil.errToObj(message)
    });
  }

  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil_1.errorUtil.errToObj(message)
    });
  }

  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil_1.errorUtil.errToObj(message)
    });
  }

  length(len, message) {
    return this.min(len, message).max(len, message);
  }

  get isEmail() {
    return !!this._def.checks.find(ch => ch.kind === "email");
  }

  get isURL() {
    return !!this._def.checks.find(ch => ch.kind === "url");
  }

  get isUUID() {
    return !!this._def.checks.find(ch => ch.kind === "uuid");
  }

  get isCUID() {
    return !!this._def.checks.find(ch => ch.kind === "cuid");
  }

  get minLength() {
    let min = -Infinity;

    this._def.checks.map(ch => {
      if (ch.kind === "min") {
        if (min === null || ch.value > min) {
          min = ch.value;
        }
      }
    });

    return min;
  }

  get maxLength() {
    let max = null;

    this._def.checks.map(ch => {
      if (ch.kind === "max") {
        if (max === null || ch.value < max) {
          max = ch.value;
        }
      }
    });

    return max;
  }

}

exports.ZodString = ZodString;

ZodString.create = params => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    ...processCreateParams(params)
  });
}; // https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034


function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / Math.pow(10, decCount);
}

class ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }

  _parse(input) {
    const parsedType = this._getType(input);

    if (parsedType !== parseUtil_1.ZodParsedType.number) {
      const ctx = this._getOrReturnCtx(input);

      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.number,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    let ctx = undefined;
    const status = new parseUtil_1.ParseStatus();

    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util_1.util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;

        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;

        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util_1.util.assertNever(check);
      }
    }

    return {
      status: status.value,
      value: input.data
    };
  }

  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil_1.errorUtil.toString(message));
  }

  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil_1.errorUtil.toString(message));
  }

  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil_1.errorUtil.toString(message));
  }

  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil_1.errorUtil.toString(message));
  }

  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({ ...this._def,
      checks: [...this._def.checks, {
        kind,
        value,
        inclusive,
        message: errorUtil_1.errorUtil.toString(message)
      }]
    });
  }

  _addCheck(check) {
    return new ZodNumber({ ...this._def,
      checks: [...this._def.checks, check]
    });
  }

  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil_1.errorUtil.toString(message)
    });
  }

  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil_1.errorUtil.toString(message)
    });
  }

  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil_1.errorUtil.toString(message)
    });
  }

  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil_1.errorUtil.toString(message)
    });
  }

  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil_1.errorUtil.toString(message)
    });
  }

  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value: value,
      message: errorUtil_1.errorUtil.toString(message)
    });
  }

  get minValue() {
    let min = null;

    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min) min = ch.value;
      }
    }

    return min;
  }

  get maxValue() {
    let max = null;

    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max) max = ch.value;
      }
    }

    return max;
  }

  get isInt() {
    return !!this._def.checks.find(ch => ch.kind === "int");
  }

}

exports.ZodNumber = ZodNumber;

ZodNumber.create = params => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    ...processCreateParams(params)
  });
};

class ZodBigInt extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);

    if (parsedType !== parseUtil_1.ZodParsedType.bigint) {
      const ctx = this._getOrReturnCtx(input);

      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.bigint,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    return (0, parseUtil_1.OK)(input.data);
  }

}

exports.ZodBigInt = ZodBigInt;

ZodBigInt.create = params => {
  return new ZodBigInt({
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    ...processCreateParams(params)
  });
};

class ZodBoolean extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);

    if (parsedType !== parseUtil_1.ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);

      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    return (0, parseUtil_1.OK)(input.data);
  }

}

exports.ZodBoolean = ZodBoolean;

ZodBoolean.create = params => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    ...processCreateParams(params)
  });
};

class ZodDate extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);

    if (parsedType !== parseUtil_1.ZodParsedType.date) {
      const ctx = this._getOrReturnCtx(input);

      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.date,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    if (isNaN(input.data.getTime())) {
      const ctx = this._getOrReturnCtx(input);

      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_date
      });
      return parseUtil_1.INVALID;
    }

    return {
      status: "valid",
      value: new Date(input.data.getTime())
    };
  }

}

exports.ZodDate = ZodDate;

ZodDate.create = params => {
  return new ZodDate({
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};

class ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);

    if (parsedType !== parseUtil_1.ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);

      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    return (0, parseUtil_1.OK)(input.data);
  }

}

exports.ZodUndefined = ZodUndefined;

ZodUndefined.create = params => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};

class ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);

    if (parsedType !== parseUtil_1.ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);

      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.null,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    return (0, parseUtil_1.OK)(input.data);
  }

}

exports.ZodNull = ZodNull;

ZodNull.create = params => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};

class ZodAny extends ZodType {
  constructor() {
    super(...arguments); // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.

    this._any = true;
  }

  _parse(input) {
    return (0, parseUtil_1.OK)(input.data);
  }

}

exports.ZodAny = ZodAny;

ZodAny.create = params => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};

class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments); // required

    this._unknown = true;
  }

  _parse(input) {
    return (0, parseUtil_1.OK)(input.data);
  }

}

exports.ZodUnknown = ZodUnknown;

ZodUnknown.create = params => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};

class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);

    (0, parseUtil_1.addIssueToContext)(ctx, {
      code: ZodError_1.ZodIssueCode.invalid_type,
      expected: parseUtil_1.ZodParsedType.never,
      received: ctx.parsedType
    });
    return parseUtil_1.INVALID;
  }

}

exports.ZodNever = ZodNever;

ZodNever.create = params => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};

class ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);

    if (parsedType !== parseUtil_1.ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);

      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.void,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    return (0, parseUtil_1.OK)(input.data);
  }

}

exports.ZodVoid = ZodVoid;

ZodVoid.create = params => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};

class ZodArray extends ZodType {
  _parse(input) {
    const {
      ctx,
      status
    } = this._processInputParams(input);

    const def = this._def;

    if (ctx.parsedType !== parseUtil_1.ZodParsedType.array) {
      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.array,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        (0, parseUtil_1.addIssueToContext)(ctx, {
          code: ZodError_1.ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          message: def.minLength.message
        });
        status.dirty();
      }
    }

    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        (0, parseUtil_1.addIssueToContext)(ctx, {
          code: ZodError_1.ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }

    if (ctx.common.async) {
      return Promise.all(ctx.data.map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then(result => {
        return parseUtil_1.ParseStatus.mergeArray(status, result);
      });
    }

    const result = ctx.data.map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return parseUtil_1.ParseStatus.mergeArray(status, result);
  }

  get element() {
    return this._def.type;
  }

  min(minLength, message) {
    return new ZodArray({ ...this._def,
      minLength: {
        value: minLength,
        message: errorUtil_1.errorUtil.toString(message)
      }
    });
  }

  max(maxLength, message) {
    return new ZodArray({ ...this._def,
      maxLength: {
        value: maxLength,
        message: errorUtil_1.errorUtil.toString(message)
      }
    });
  }

  length(len, message) {
    return this.min(len, message).max(len, message);
  }

  nonempty(message) {
    return this.min(1, message);
  }

}

exports.ZodArray = ZodArray;

ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
}; /////////////////////////////////////////
/////////////////////////////////////////
//////////                     //////////
//////////      ZodObject      //////////
//////////                     //////////
/////////////////////////////////////////
/////////////////////////////////////////


var objectUtil;

(function (objectUtil) {
  objectUtil.mergeShapes = (first, second) => {
    return { ...first,
      ...second // second overwrites first

    };
  };
})(objectUtil = exports.objectUtil || (exports.objectUtil = {}));

const AugmentFactory = def => augmentation => {
  return new ZodObject({ ...def,
    shape: () => ({ ...def.shape(),
      ...augmentation
    })
  });
};

function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};

    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }

    return new ZodObject({ ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return ZodArray.create(deepPartialify(schema.element));
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map(item => deepPartialify(item)));
  } else {
    return schema;
  }
}

class ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    /**
     * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
     * If you want to pass through unknown properties, use `.passthrough()` instead.
     */

    this.nonstrict = this.passthrough;
    this.augment = AugmentFactory(this._def);
    this.extend = AugmentFactory(this._def);
  }

  _getCached() {
    if (this._cached !== null) return this._cached;

    const shape = this._def.shape();

    const keys = util_1.util.objectKeys(shape);
    return this._cached = {
      shape,
      keys
    };
  }

  _parse(input) {
    const parsedType = this._getType(input);

    if (parsedType !== parseUtil_1.ZodParsedType.object) {
      const ctx = this._getOrReturnCtx(input);

      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.object,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    const {
      status,
      ctx
    } = this._processInputParams(input);

    const {
      shape,
      keys: shapeKeys
    } = this._getCached();

    const extraKeys = [];

    for (const key in ctx.data) {
      if (!shapeKeys.includes(key)) {
        extraKeys.push(key);
      }
    }

    const pairs = [];

    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: {
          status: "valid",
          value: key
        },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }

    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;

      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: {
              status: "valid",
              value: key
            },
            value: {
              status: "valid",
              value: ctx.data[key]
            }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {} else {
        throw new Error("Internal ZodObject error: invalid unknownKeys value.");
      }
    } else {
      // run catchall validation
      const catchall = this._def.catchall;

      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: {
            status: "valid",
            value: key
          },
          value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key) //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }

    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];

        for (const pair of pairs) {
          const key = await pair.key;
          syncPairs.push({
            key,
            value: await pair.value,
            alwaysSet: pair.alwaysSet
          });
        }

        return syncPairs;
      }).then(syncPairs => {
        return parseUtil_1.ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return parseUtil_1.ParseStatus.mergeObjectSync(status, pairs);
    }
  }

  get shape() {
    return this._def.shape();
  }

  strict(message) {
    errorUtil_1.errorUtil.errToObj;
    return new ZodObject({ ...this._def,
      unknownKeys: "strict",
      ...(message !== undefined ? {
        errorMap: (issue, ctx) => {
          var _a, _b, _c, _d;

          const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
          if (issue.code === "unrecognized_keys") return {
            message: (_d = errorUtil_1.errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError
          };
          return {
            message: defaultError
          };
        }
      } : {})
    });
  }

  strip() {
    return new ZodObject({ ...this._def,
      unknownKeys: "strip"
    });
  }

  passthrough() {
    return new ZodObject({ ...this._def,
      unknownKeys: "passthrough"
    });
  }

  setKey(key, schema) {
    return this.augment({
      [key]: schema
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */


  merge(merging) {
    // const mergedShape = objectUtil.mergeShapes(
    //   this._def.shape(),
    //   merging._def.shape()
    // );
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }

  catchall(index) {
    return new ZodObject({ ...this._def,
      catchall: index
    });
  }

  pick(mask) {
    const shape = {};
    util_1.util.objectKeys(mask).map(key => {
      shape[key] = this.shape[key];
    });
    return new ZodObject({ ...this._def,
      shape: () => shape
    });
  }

  omit(mask) {
    const shape = {};
    util_1.util.objectKeys(this.shape).map(key => {
      if (util_1.util.objectKeys(mask).indexOf(key) === -1) {
        shape[key] = this.shape[key];
      }
    });
    return new ZodObject({ ...this._def,
      shape: () => shape
    });
  }

  deepPartial() {
    return deepPartialify(this);
  }

  partial(mask) {
    const newShape = {};

    if (mask) {
      util_1.util.objectKeys(this.shape).map(key => {
        if (util_1.util.objectKeys(mask).indexOf(key) === -1) {
          newShape[key] = this.shape[key];
        } else {
          newShape[key] = this.shape[key].optional();
        }
      });
      return new ZodObject({ ...this._def,
        shape: () => newShape
      });
    } else {
      for (const key in this.shape) {
        const fieldSchema = this.shape[key];
        newShape[key] = fieldSchema.optional();
      }
    }

    return new ZodObject({ ...this._def,
      shape: () => newShape
    });
  }

  required() {
    const newShape = {};

    for (const key in this.shape) {
      const fieldSchema = this.shape[key];
      let newField = fieldSchema;

      while (newField instanceof ZodOptional) {
        newField = newField._def.innerType;
      }

      newShape[key] = newField;
    }

    return new ZodObject({ ...this._def,
      shape: () => newShape
    });
  }

}

exports.ZodObject = ZodObject;

ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};

ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};

ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};

class ZodUnion extends ZodType {
  _parse(input) {
    const {
      ctx
    } = this._processInputParams(input);

    const options = this._def.options;

    function handleResults(results) {
      // return first issue-free validation if it exists
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }

      for (const result of results) {
        if (result.result.status === "dirty") {
          // add issues from dirty option
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      } // return invalid


      const unionErrors = results.map(result => new ZodError_1.ZodError(result.ctx.common.issues));
      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_union,
        unionErrors
      });
      return parseUtil_1.INVALID;
    }

    if (ctx.common.async) {
      return Promise.all(options.map(async option => {
        const childCtx = { ...ctx,
          common: { ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = undefined;
      const issues = [];

      for (const option of options) {
        const childCtx = { ...ctx,
          common: { ...ctx.common,
            issues: []
          },
          parent: null
        };

        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });

        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = {
            result,
            ctx: childCtx
          };
        }

        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }

      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }

      const unionErrors = issues.map(issues => new ZodError_1.ZodError(issues));
      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_union,
        unionErrors
      });
      return parseUtil_1.INVALID;
    }
  }

  get options() {
    return this._def.options;
  }

}

exports.ZodUnion = ZodUnion;

ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};

class ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const {
      ctx
    } = this._processInputParams(input);

    if (ctx.parsedType !== parseUtil_1.ZodParsedType.object) {
      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.object,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.options.get(discriminatorValue);

    if (!option) {
      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_union_discriminator,
        options: this.validDiscriminatorValues,
        path: [discriminator]
      });
      return parseUtil_1.INVALID;
    }

    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }

  get discriminator() {
    return this._def.discriminator;
  }

  get validDiscriminatorValues() {
    return Array.from(this.options.keys());
  }

  get options() {
    return this._def.options;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */


  static create(discriminator, types, params) {
    // Get all the valid discriminator values
    const options = new Map();

    try {
      types.forEach(type => {
        const discriminatorValue = type.shape[discriminator].value;
        options.set(discriminatorValue, type);
      });
    } catch (e) {
      throw new Error("The discriminator value could not be extracted from all the provided schemas");
    } // Assert that all the discriminator values are unique


    if (options.size !== types.length) {
      throw new Error("Some of the discriminator values are not unique");
    }

    return new ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      ...processCreateParams(params)
    });
  }

}

exports.ZodDiscriminatedUnion = ZodDiscriminatedUnion;

function mergeValues(a, b) {
  const aType = (0, parseUtil_1.getParsedType)(a);
  const bType = (0, parseUtil_1.getParsedType)(b);

  if (a === b) {
    return {
      valid: true,
      data: a
    };
  } else if (aType === parseUtil_1.ZodParsedType.object && bType === parseUtil_1.ZodParsedType.object) {
    const bKeys = util_1.util.objectKeys(b);
    const sharedKeys = util_1.util.objectKeys(a).filter(key => bKeys.indexOf(key) !== -1);
    const newObj = { ...a,
      ...b
    };

    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);

      if (!sharedValue.valid) {
        return {
          valid: false
        };
      }

      newObj[key] = sharedValue.data;
    }

    return {
      valid: true,
      data: newObj
    };
  } else if (aType === parseUtil_1.ZodParsedType.array && bType === parseUtil_1.ZodParsedType.array) {
    if (a.length !== b.length) {
      return {
        valid: false
      };
    }

    const newArray = [];

    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);

      if (!sharedValue.valid) {
        return {
          valid: false
        };
      }

      newArray.push(sharedValue.data);
    }

    return {
      valid: true,
      data: newArray
    };
  } else if (aType === parseUtil_1.ZodParsedType.date && bType === parseUtil_1.ZodParsedType.date && +a === +b) {
    return {
      valid: true,
      data: a
    };
  } else {
    return {
      valid: false
    };
  }
}

class ZodIntersection extends ZodType {
  _parse(input) {
    const {
      status,
      ctx
    } = this._processInputParams(input);

    const handleParsed = (parsedLeft, parsedRight) => {
      if ((0, parseUtil_1.isAborted)(parsedLeft) || (0, parseUtil_1.isAborted)(parsedRight)) {
        return parseUtil_1.INVALID;
      }

      const merged = mergeValues(parsedLeft.value, parsedRight.value);

      if (!merged.valid) {
        (0, parseUtil_1.addIssueToContext)(ctx, {
          code: ZodError_1.ZodIssueCode.invalid_intersection_types
        });
        return parseUtil_1.INVALID;
      }

      if ((0, parseUtil_1.isDirty)(parsedLeft) || (0, parseUtil_1.isDirty)(parsedRight)) {
        status.dirty();
      }

      return {
        status: status.value,
        value: merged.data
      };
    };

    if (ctx.common.async) {
      return Promise.all([this._def.left._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      })]).then(_ref => {
        let [left, right] = _ref;
        return handleParsed(left, right);
      });
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }

}

exports.ZodIntersection = ZodIntersection;

ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left: left,
    right: right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};

class ZodTuple extends ZodType {
  _parse(input) {
    const {
      status,
      ctx
    } = this._processInputParams(input);

    if (ctx.parsedType !== parseUtil_1.ZodParsedType.array) {
      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.array,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    if (ctx.data.length < this._def.items.length) {
      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        type: "array"
      });
      return parseUtil_1.INVALID;
    }

    const rest = this._def.rest;

    if (!rest && ctx.data.length > this._def.items.length) {
      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        type: "array"
      });
      status.dirty();
    }

    const items = ctx.data.map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema) return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter(x => !!x); // filter nulls

    if (ctx.common.async) {
      return Promise.all(items).then(results => {
        return parseUtil_1.ParseStatus.mergeArray(status, results);
      });
    } else {
      return parseUtil_1.ParseStatus.mergeArray(status, items);
    }
  }

  get items() {
    return this._def.items;
  }

  rest(rest) {
    return new ZodTuple({ ...this._def,
      rest
    });
  }

}

exports.ZodTuple = ZodTuple;

ZodTuple.create = (schemas, params) => {
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};

class ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }

  get valueSchema() {
    return this._def.valueType;
  }

  _parse(input) {
    const {
      status,
      ctx
    } = this._processInputParams(input);

    if (ctx.parsedType !== parseUtil_1.ZodParsedType.object) {
      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.object,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;

    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key))
      });
    }

    if (ctx.common.async) {
      return parseUtil_1.ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return parseUtil_1.ParseStatus.mergeObjectSync(status, pairs);
    }
  }

  get element() {
    return this._def.valueType;
  }

  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }

    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }

}

exports.ZodRecord = ZodRecord;

class ZodMap extends ZodType {
  _parse(input) {
    const {
      status,
      ctx
    } = this._processInputParams(input);

    if (ctx.parsedType !== parseUtil_1.ZodParsedType.map) {
      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.map,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map((_ref2, index) => {
      let [key, value] = _ref2;
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });

    if (ctx.common.async) {
      const finalMap = new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;

          if (key.status === "aborted" || value.status === "aborted") {
            return parseUtil_1.INVALID;
          }

          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }

          finalMap.set(key.value, value.value);
        }

        return {
          status: status.value,
          value: finalMap
        };
      });
    } else {
      const finalMap = new Map();

      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;

        if (key.status === "aborted" || value.status === "aborted") {
          return parseUtil_1.INVALID;
        }

        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }

        finalMap.set(key.value, value.value);
      }

      return {
        status: status.value,
        value: finalMap
      };
    }
  }

}

exports.ZodMap = ZodMap;

ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};

class ZodSet extends ZodType {
  _parse(input) {
    const {
      status,
      ctx
    } = this._processInputParams(input);

    if (ctx.parsedType !== parseUtil_1.ZodParsedType.set) {
      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.set,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    const def = this._def;

    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        (0, parseUtil_1.addIssueToContext)(ctx, {
          code: ZodError_1.ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          message: def.minSize.message
        });
        status.dirty();
      }
    }

    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        (0, parseUtil_1.addIssueToContext)(ctx, {
          code: ZodError_1.ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }

    const valueType = this._def.valueType;

    function finalizeSet(elements) {
      const parsedSet = new Set();

      for (const element of elements) {
        if (element.status === "aborted") return parseUtil_1.INVALID;
        if (element.status === "dirty") status.dirty();
        parsedSet.add(element.value);
      }

      return {
        status: status.value,
        value: parsedSet
      };
    }

    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));

    if (ctx.common.async) {
      return Promise.all(elements).then(elements => finalizeSet(elements));
    } else {
      return finalizeSet(elements);
    }
  }

  min(minSize, message) {
    return new ZodSet({ ...this._def,
      minSize: {
        value: minSize,
        message: errorUtil_1.errorUtil.toString(message)
      }
    });
  }

  max(maxSize, message) {
    return new ZodSet({ ...this._def,
      maxSize: {
        value: maxSize,
        message: errorUtil_1.errorUtil.toString(message)
      }
    });
  }

  size(size, message) {
    return this.min(size, message).max(size, message);
  }

  nonempty(message) {
    return this.min(1, message);
  }

}

exports.ZodSet = ZodSet;

ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};

class ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }

  _parse(input) {
    var _this = this;

    const {
      ctx
    } = this._processInputParams(input);

    if (ctx.parsedType !== parseUtil_1.ZodParsedType.function) {
      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.function,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    function makeArgsIssue(args, error) {
      return (0, parseUtil_1.makeIssue)({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, ZodError_1.overrideErrorMap, ZodError_1.defaultErrorMap].filter(x => !!x),
        issueData: {
          code: ZodError_1.ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }

    function makeReturnsIssue(returns, error) {
      return (0, parseUtil_1.makeIssue)({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, ZodError_1.overrideErrorMap, ZodError_1.defaultErrorMap].filter(x => !!x),
        issueData: {
          code: ZodError_1.ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }

    const params = {
      errorMap: ctx.common.contextualErrorMap
    };
    const fn = ctx.data;

    if (this._def.returns instanceof ZodPromise) {
      return (0, parseUtil_1.OK)(async function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        const error = new ZodError_1.ZodError([]);
        const parsedArgs = await _this._def.args.parseAsync(args, params).catch(e => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await fn(...parsedArgs);
        const parsedReturns = await _this._def.returns._def.type.parseAsync(result, params).catch(e => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      return (0, parseUtil_1.OK)(function () {
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        const parsedArgs = _this._def.args.safeParse(args, params);

        if (!parsedArgs.success) {
          throw new ZodError_1.ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }

        const result = fn(...parsedArgs.data);

        const parsedReturns = _this._def.returns.safeParse(result, params);

        if (!parsedReturns.success) {
          throw new ZodError_1.ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }

        return parsedReturns.data;
      });
    }
  }

  parameters() {
    return this._def.args;
  }

  returnType() {
    return this._def.returns;
  }

  args() {
    for (var _len3 = arguments.length, items = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      items[_key3] = arguments[_key3];
    }

    return new ZodFunction({ ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }

  returns(returnType) {
    return new ZodFunction({ ...this._def,
      returns: returnType
    });
  }

  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }

  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }

}

exports.ZodFunction = ZodFunction;

ZodFunction.create = (args, returns, params) => {
  return new ZodFunction({
    args: args ? args.rest(ZodUnknown.create()) : ZodTuple.create([]).rest(ZodUnknown.create()),
    returns: returns || ZodUnknown.create(),
    typeName: ZodFirstPartyTypeKind.ZodFunction,
    ...processCreateParams(params)
  });
};

class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }

  _parse(input) {
    const {
      ctx
    } = this._processInputParams(input);

    const lazySchema = this._def.getter();

    return lazySchema._parse({
      data: ctx.data,
      path: ctx.path,
      parent: ctx
    });
  }

}

exports.ZodLazy = ZodLazy;

ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter: getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};

class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);

      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return parseUtil_1.INVALID;
    }

    return {
      status: "valid",
      value: input.data
    };
  }

  get value() {
    return this._def.value;
  }

}

exports.ZodLiteral = ZodLiteral;

ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value: value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};

function createZodEnum(values) {
  return new ZodEnum({
    values: values,
    typeName: ZodFirstPartyTypeKind.ZodEnum
  });
}

class ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);

      const expectedValues = this._def.values;
      (0, parseUtil_1.addIssueToContext)(ctx, {
        expected: util_1.util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodError_1.ZodIssueCode.invalid_type
      });
      return parseUtil_1.INVALID;
    }

    if (this._def.values.indexOf(input.data) === -1) {
      const ctx = this._getOrReturnCtx(input);

      const expectedValues = this._def.values;
      (0, parseUtil_1.addIssueToContext)(ctx, {
        received: ctx.data,
        code: ZodError_1.ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return parseUtil_1.INVALID;
    }

    return (0, parseUtil_1.OK)(input.data);
  }

  get options() {
    return this._def.values;
  }

  get enum() {
    const enumValues = {};

    for (const val of this._def.values) {
      enumValues[val] = val;
    }

    return enumValues;
  }

  get Values() {
    const enumValues = {};

    for (const val of this._def.values) {
      enumValues[val] = val;
    }

    return enumValues;
  }

  get Enum() {
    const enumValues = {};

    for (const val of this._def.values) {
      enumValues[val] = val;
    }

    return enumValues;
  }

}

exports.ZodEnum = ZodEnum;
ZodEnum.create = createZodEnum;

class ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util_1.util.getValidEnumValues(this._def.values);

    const ctx = this._getOrReturnCtx(input);

    if (ctx.parsedType !== parseUtil_1.ZodParsedType.string && ctx.parsedType !== parseUtil_1.ZodParsedType.number) {
      const expectedValues = util_1.util.objectValues(nativeEnumValues);
      (0, parseUtil_1.addIssueToContext)(ctx, {
        expected: util_1.util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodError_1.ZodIssueCode.invalid_type
      });
      return parseUtil_1.INVALID;
    }

    if (nativeEnumValues.indexOf(input.data) === -1) {
      const expectedValues = util_1.util.objectValues(nativeEnumValues);
      (0, parseUtil_1.addIssueToContext)(ctx, {
        received: ctx.data,
        code: ZodError_1.ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return parseUtil_1.INVALID;
    }

    return (0, parseUtil_1.OK)(input.data);
  }

  get enum() {
    return this._def.values;
  }

}

exports.ZodNativeEnum = ZodNativeEnum;

ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values: values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};

class ZodPromise extends ZodType {
  _parse(input) {
    const {
      ctx
    } = this._processInputParams(input);

    if (ctx.parsedType !== parseUtil_1.ZodParsedType.promise && ctx.common.async === false) {
      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.promise,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    const promisified = ctx.parsedType === parseUtil_1.ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return (0, parseUtil_1.OK)(promisified.then(data => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }

}

exports.ZodPromise = ZodPromise;

ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};

class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }

  _parse(input) {
    const {
      status,
      ctx
    } = this._processInputParams(input);

    const effect = this._def.effect || null;

    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data);

      if (ctx.common.async) {
        return Promise.resolve(processed).then(processed => {
          return this._def.schema._parseAsync({
            data: processed,
            path: ctx.path,
            parent: ctx
          });
        });
      } else {
        return this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
      }
    }

    const checkCtx = {
      addIssue: arg => {
        (0, parseUtil_1.addIssueToContext)(ctx, arg);

        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },

      get path() {
        return ctx.path;
      }

    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);

    if (effect.type === "refinement") {
      const executeRefinement = (acc // effect: RefinementEffect<any>
      ) => {
        const result = effect.refinement(acc, checkCtx);

        if (ctx.common.async) {
          return Promise.resolve(result);
        }

        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }

        return acc;
      };

      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });

        if (inner.status === "aborted") return parseUtil_1.INVALID;
        if (inner.status === "dirty") status.dirty(); // return value is ignored

        executeRefinement(inner.value);
        return {
          status: status.value,
          value: inner.value
        };
      } else {
        return this._def.schema._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }).then(inner => {
          if (inner.status === "aborted") return parseUtil_1.INVALID;
          if (inner.status === "dirty") status.dirty();
          return executeRefinement(inner.value).then(() => {
            return {
              status: status.value,
              value: inner.value
            };
          });
        });
      }
    }

    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }); // if (base.status === "aborted") return INVALID;
        // if (base.status === "dirty") {
        //   return { status: "dirty", value: base.value };
        // }


        if (!(0, parseUtil_1.isValid)(base)) return base;
        const result = effect.transform(base.value, checkCtx);

        if (result instanceof Promise) {
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        }

        return {
          status: status.value,
          value: result
        };
      } else {
        return this._def.schema._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }).then(base => {
          if (!(0, parseUtil_1.isValid)(base)) return base; // if (base.status === "aborted") return INVALID;
          // if (base.status === "dirty") {
          //   return { status: "dirty", value: base.value };
          // }

          return Promise.resolve(effect.transform(base.value, checkCtx)).then(result => ({
            status: status.value,
            value: result
          }));
        });
      }
    }

    util_1.util.assertNever(effect);
  }

}

exports.ZodEffects = ZodEffects;
exports.ZodTransformer = ZodEffects;

ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};

ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: {
      type: "preprocess",
      transform: preprocess
    },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};

class ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);

    if (parsedType === parseUtil_1.ZodParsedType.undefined) {
      return (0, parseUtil_1.OK)(undefined);
    }

    return this._def.innerType._parse(input);
  }

  unwrap() {
    return this._def.innerType;
  }

}

exports.ZodOptional = ZodOptional;

ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};

class ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);

    if (parsedType === parseUtil_1.ZodParsedType.null) {
      return (0, parseUtil_1.OK)(null);
    }

    return this._def.innerType._parse(input);
  }

  unwrap() {
    return this._def.innerType;
  }

}

exports.ZodNullable = ZodNullable;

ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};

class ZodDefault extends ZodType {
  _parse(input) {
    const {
      ctx
    } = this._processInputParams(input);

    let data = ctx.data;

    if (ctx.parsedType === parseUtil_1.ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }

    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }

  removeDefault() {
    return this._def.innerType;
  }

}

exports.ZodDefault = ZodDefault;

ZodDefault.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};

class ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);

    if (parsedType !== parseUtil_1.ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);

      (0, parseUtil_1.addIssueToContext)(ctx, {
        code: ZodError_1.ZodIssueCode.invalid_type,
        expected: parseUtil_1.ZodParsedType.nan,
        received: ctx.parsedType
      });
      return parseUtil_1.INVALID;
    }

    return {
      status: "valid",
      value: input.data
    };
  }

}

exports.ZodNaN = ZodNaN;

ZodNaN.create = params => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};

const custom = (check, params) => {
  if (check) return ZodAny.create().refine(check, params);
  return ZodAny.create();
};

exports.custom = custom;
exports.late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;

(function (ZodFirstPartyTypeKind) {
  ZodFirstPartyTypeKind["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
})(ZodFirstPartyTypeKind = exports.ZodFirstPartyTypeKind || (exports.ZodFirstPartyTypeKind = {}));

const instanceOfType = function (cls) {
  let params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    message: "Input not instance of ".concat(cls.name)
  };
  return (0, exports.custom)(data => data instanceof cls, params);
};

exports.instanceof = instanceOfType;
const stringType = ZodString.create;
exports.string = stringType;
const numberType = ZodNumber.create;
exports.number = numberType;
const nanType = ZodNaN.create;
exports.nan = nanType;
const bigIntType = ZodBigInt.create;
exports.bigint = bigIntType;
const booleanType = ZodBoolean.create;
exports.boolean = booleanType;
const dateType = ZodDate.create;
exports.date = dateType;
const undefinedType = ZodUndefined.create;
exports.undefined = undefinedType;
const nullType = ZodNull.create;
exports.null = nullType;
const anyType = ZodAny.create;
exports.any = anyType;
const unknownType = ZodUnknown.create;
exports.unknown = unknownType;
const neverType = ZodNever.create;
exports.never = neverType;
const voidType = ZodVoid.create;
exports.void = voidType;
const arrayType = ZodArray.create;
exports.array = arrayType;
const objectType = ZodObject.create;
exports.object = objectType;
const strictObjectType = ZodObject.strictCreate;
exports.strictObject = strictObjectType;
const unionType = ZodUnion.create;
exports.union = unionType;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
exports.discriminatedUnion = discriminatedUnionType;
const intersectionType = ZodIntersection.create;
exports.intersection = intersectionType;
const tupleType = ZodTuple.create;
exports.tuple = tupleType;
const recordType = ZodRecord.create;
exports.record = recordType;
const mapType = ZodMap.create;
exports.map = mapType;
const setType = ZodSet.create;
exports.set = setType;
const functionType = ZodFunction.create;
exports.function = functionType;
const lazyType = ZodLazy.create;
exports.lazy = lazyType;
const literalType = ZodLiteral.create;
exports.literal = literalType;
const enumType = ZodEnum.create;
exports.enum = enumType;
const nativeEnumType = ZodNativeEnum.create;
exports.nativeEnum = nativeEnumType;
const promiseType = ZodPromise.create;
exports.promise = promiseType;
const effectsType = ZodEffects.create;
exports.effect = effectsType;
exports.transformer = effectsType;
const optionalType = ZodOptional.create;
exports.optional = optionalType;
const nullableType = ZodNullable.create;
exports.nullable = nullableType;
const preprocessType = ZodEffects.createWithPreprocess;
exports.preprocess = preprocessType;

const ostring = () => stringType().optional();

exports.ostring = ostring;

const onumber = () => numberType().optional();

exports.onumber = onumber;

const oboolean = () => booleanType().optional();

exports.oboolean = oboolean;

},{"./ZodError":6,"./helpers/errorUtil":8,"./helpers/parseUtil":9,"./helpers/util":11}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "DeviceApi", {
  enumerable: true,
  get: function () {
    return _deviceApi.DeviceApi;
  }
});
Object.defineProperty(exports, "DeviceApiCall", {
  enumerable: true,
  get: function () {
    return _deviceApiCall.DeviceApiCall;
  }
});
Object.defineProperty(exports, "DeviceApiTransport", {
  enumerable: true,
  get: function () {
    return _deviceApi.DeviceApiTransport;
  }
});
Object.defineProperty(exports, "createNotification", {
  enumerable: true,
  get: function () {
    return _deviceApiCall.createNotification;
  }
});
Object.defineProperty(exports, "createRequest", {
  enumerable: true,
  get: function () {
    return _deviceApiCall.createRequest;
  }
});
Object.defineProperty(exports, "validate", {
  enumerable: true,
  get: function () {
    return _deviceApiCall.validate;
  }
});

var _deviceApiCall = require("./lib/device-api-call.js");

var _deviceApi = require("./lib/device-api.js");

},{"./lib/device-api-call.js":15,"./lib/device-api.js":16}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SchemaValidationError = exports.DeviceApiCallError = exports.DeviceApiCall = void 0;
exports.createDeviceApiCall = createDeviceApiCall;
exports.createNotification = void 0;
exports.createRequest = createRequest;
exports.validate = validate;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * This roughly follows https://www.jsonrpc.org/specification
 * @template {import("zod").ZodType} Params=import("zod").ZodType
 * @template {import("zod").ZodType} Result=import("zod").ZodType
 */
class DeviceApiCall {
  /** @type {string} */

  /**
   * An optional 'id' - used to indicate if a request requires a response.
   * @type {string|null}
   */

  /** @type {Params | null | undefined} */

  /** @type {Result | null | undefined} */

  /** @type {import("zod").infer<Params>} */

  /**
   * This is a carve-out for legacy messages that are not typed yet.
   * If you set this to 'true', then the response will not be checked to conform
   * to any shape
   * @deprecated this is here to aid migration, should be removed ASAP
   * @type {boolean}
   */

  /**
   * New messages should be in a particular format, eg: { success: T },
   * but you can set this to false if you want to access the result as-is,
   * without any unwrapping logic
   * @deprecated this is here to aid migration, should be removed ASAP
   * @type {boolean}
   */

  /**
   * @param {import("zod").infer<Params>} data
   */
  constructor(data) {
    _defineProperty(this, "method", 'unknown');

    _defineProperty(this, "id", null);

    _defineProperty(this, "paramsValidator", null);

    _defineProperty(this, "resultValidator", null);

    _defineProperty(this, "params", void 0);

    _defineProperty(this, "throwOnResultKeysMissing", true);

    _defineProperty(this, "unwrapResult", true);

    this.params = data;
  }
  /**
   * @returns {import("zod").infer<Params>|undefined}
   */


  validateParams() {
    if (this.params === undefined) {
      return undefined;
    }

    this._validate(this.params, this.paramsValidator);

    return this.params;
  }
  /**
   * @param {any|null} incoming
   * @returns {import("zod").infer<Result>}
   */


  validateResult(incoming) {
    this._validate(incoming, this.resultValidator);

    if (!incoming) {
      return incoming;
    }

    if (!this.unwrapResult) {
      return incoming;
    }

    if ('data' in incoming) {
      console.warn('response had `data` property. Please migrate to `success`');
      return incoming.data;
    }

    if ('success' in incoming) {
      return incoming.success;
    }

    if ('error' in incoming) {
      if (typeof incoming.error.message === 'string') {
        throw new DeviceApiCallError("".concat(this.method, ": ").concat(incoming.error.message));
      }
    }

    if (this.throwOnResultKeysMissing) {
      throw new Error('unreachable. Response did not contain `success` or `data`');
    }

    return incoming;
  }
  /**
   * @param {any} data
   * @param {import("zod").ZodType|undefined|null} [validator]
   * @private
   */


  _validate(data, validator) {
    if (!validator) return data;

    if (validator) {
      const result = validator === null || validator === void 0 ? void 0 : validator.safeParse(data);

      if (!result) {
        throw new Error('unreachable');
      }

      if (!result.success) {
        if ('error' in result) {
          this.throwError(result.error.issues);
        } else {
          console.error('unknown error from validate');
        }
      }
    }
  }
  /**
   * @param {import('zod').ZodIssue[]} errors
   */


  throwError(errors) {
    const error = SchemaValidationError.fromZodErrors(errors, this.constructor.name);
    throw error;
  }
  /**
   * Use this helper for creating stand-in response messages that are typed correctly.
   *
   * @examples
   *
   * ```js
   * const msg = new Message();
   * const response = msg.response({}) // <-- This argument will be typed correctly
   * ```
   *
   * @param {import("zod").infer<Result>} response
   * @returns {import("zod").infer<Result>}
   */


  result(response) {
    return response;
  }
  /**
   * @returns {import("zod").infer<Result>}
   */


  preResultValidation(response) {
    return response;
  }

}

exports.DeviceApiCall = DeviceApiCall;

class DeviceApiCallError extends Error {}
/**
 * Check for this error if you'd like to
 */


exports.DeviceApiCallError = DeviceApiCallError;

class SchemaValidationError extends Error {
  constructor() {
    super(...arguments);

    _defineProperty(this, "validationErrors", []);
  }

  /**
   * @param {import("zod").ZodIssue[]} errors
   * @param {string} name
   * @returns {SchemaValidationError}
   */
  static fromZodErrors(errors, name) {
    const heading = "".concat(errors.length, " SchemaValidationError(s) errors for ") + name;

    function log(issue) {
      switch (issue.code) {
        case 'invalid_literal':
        case 'invalid_type':
          {
            console.log("".concat(name, ". Path: '").concat(issue.path.join('.'), "', Error: '").concat(issue.message, "'"));
            break;
          }

        case 'invalid_union':
          {
            for (let unionError of issue.unionErrors) {
              for (let issue1 of unionError.issues) {
                log(issue1);
              }
            }

            break;
          }

        default:
          {
            console.log(name, 'other issue:', issue);
          }
      }
    }

    for (let error of errors) {
      log(error);
    }

    const message = [heading, 'please see the details above'].join('\n    ');
    const error = new SchemaValidationError(message);
    error.validationErrors = errors;
    return error;
  }

}
/**
 * Creates an instance of `DeviceApiCall` from only a name and 'params'
 * and optional validators. Use this to help migrate existing messages.
 *
 * @template {import("zod").ZodType} Params
 * @template {import("zod").ZodType} Result
 * @param {string} method
 * @param {import("zod").infer<Params>} [params]
 * @param {Params|null} [paramsValidator]
 * @param {Result|null} [resultValidator]
 * @returns {DeviceApiCall<Params, Result>}
 */


exports.SchemaValidationError = SchemaValidationError;

function createDeviceApiCall(method, params) {
  let paramsValidator = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  let resultValidator = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  /** @type {DeviceApiCall<Params, Result>} */
  const deviceApiCall = new DeviceApiCall(params);
  deviceApiCall.paramsValidator = paramsValidator;
  deviceApiCall.resultValidator = resultValidator;
  deviceApiCall.method = method;
  deviceApiCall.throwOnResultKeysMissing = false;
  deviceApiCall.unwrapResult = false;
  return deviceApiCall;
}
/**
 * Creates an instance of `DeviceApiCall` from only a name and 'params'
 * and optional validators. Use this to help migrate existing messages.
 *
 * Note: This creates a regular DeviceApiCall, but adds the 'id' as a string
 * so that transports know that it expects a response.
 *
 * @template {import("zod").ZodType} Params
 * @template {import("zod").ZodType} Result
 * @param {string} method
 * @param {import("zod").infer<Params>} [params]
 * @param {string} [id]
 * @param {Params|null} [paramsValidator]
 * @param {Result|null} [resultValidator]
 * @returns {DeviceApiCall<Params, Result>}
 */


function createRequest(method, params) {
  let id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'n/a';
  let paramsValidator = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  let resultValidator = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
  const call = createDeviceApiCall(method, params, paramsValidator, resultValidator);
  call.id = id;
  return call;
}

const createNotification = createDeviceApiCall;
/**
 * Validate any arbitrary data with any Zod validator
 *
 * @template {import("zod").ZodType} Validator
 * @param {any} data
 * @param {Validator | null} [validator]
 * @returns {import("zod").infer<Validator>}
 */

exports.createNotification = createNotification;

function validate(data) {
  let validator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  if (validator) {
    return validator.parse(data);
  }

  return data;
}

},{}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DeviceApiTransport = exports.DeviceApi = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Platforms should only need to implement this `send` method
 */
class DeviceApiTransport {
  /**
   * @param {import("./device-api-call.js").DeviceApiCall} _deviceApiCall
   * @param {CallOptions} [_options]
   * @returns {Promise<any>}
   */
  async send(_deviceApiCall, _options) {
    return undefined;
  }

}
/**
 * This is the base Sender class that platforms can will implement.
 *
 * Note: The 'handle' method must be implemented, unless you also implement 'send'
 *
 * @typedef CallOptions
 * @property {AbortSignal} [signal]
 */


exports.DeviceApiTransport = DeviceApiTransport;

class DeviceApi {
  /** @type {DeviceApiTransport} */

  /** @param {DeviceApiTransport} transport */
  constructor(transport) {
    _defineProperty(this, "transport", void 0);

    this.transport = transport;
  }
  /**
   * @template {import("./device-api-call").DeviceApiCall} D
   * @param {D} deviceApiCall
   * @param {CallOptions} [options]
   * @returns {Promise<NonNullable<ReturnType<D['validateResult']>['success']>>}
   */


  async request(deviceApiCall, options) {
    deviceApiCall.validateParams();
    let result = await this.transport.send(deviceApiCall, options);
    let processed = deviceApiCall.preResultValidation(result);
    return deviceApiCall.validateResult(processed);
  }
  /**
   * @template {import("./device-api-call").DeviceApiCall} P
   * @param {P} deviceApiCall
   * @param {CallOptions} [options]
   * @returns {Promise<void>}
   */


  async notify(deviceApiCall, options) {
    deviceApiCall.validateParams();
    return this.transport.send(deviceApiCall, options);
  }

}

exports.DeviceApi = DeviceApi;

},{}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HostnameInputError = void 0;
Object.defineProperty(exports, "ParserError", {
  enumerable: true,
  get: function () {
    return _rulesParser.ParserError;
  }
});
exports._selectPasswordRules = _selectPasswordRules;
Object.defineProperty(exports, "constants", {
  enumerable: true,
  get: function () {
    return _constants.constants;
  }
});
exports.generate = generate;

var _applePassword = require("./lib/apple.password.js");

var _rulesParser = require("./lib/rules-parser.js");

var _constants = require("./lib/constants.js");

/**
 * @typedef {{
 *   domain?: string | null | undefined;
 *   input?: string | null | undefined;
 *   rules?: RulesFormat | null | undefined;
 *   onError?: ((error: unknown) => void) | null | undefined;
 * }} GenerateOptions
 */

/**
 * Generate a random password based on the following attempts
 *
 * 1) using `options.input` if provided -> falling back to default ruleset
 * 2) using `options.domain` if provided -> falling back to default ruleset
 * 3) using default ruleset
 *
 * Note: This API is designed to never throw - if you want to observe errors
 * during development, you can provide an `onError` callback
 *
 * @param {GenerateOptions} [options]
 */
function generate() {
  let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  try {
    if (typeof (options === null || options === void 0 ? void 0 : options.input) === 'string') {
      return _applePassword.Password.generateOrThrow(options.input);
    }

    if (typeof (options === null || options === void 0 ? void 0 : options.domain) === 'string') {
      if (options !== null && options !== void 0 && options.rules) {
        const rules = _selectPasswordRules(options.domain, options.rules);

        if (rules) {
          return _applePassword.Password.generateOrThrow(rules);
        }
      }
    }
  } catch (e) {
    // if an 'onError' callback was provided, forward all errors
    if (options !== null && options !== void 0 && options.onError && typeof (options === null || options === void 0 ? void 0 : options.onError) === 'function') {
      options.onError(e);
    } else {
      // otherwise, only console.error unknown errors (which could be implementation bugs)
      const isKnownError = e instanceof _rulesParser.ParserError || e instanceof HostnameInputError;

      if (!isKnownError) {
        console.error(e);
      }
    }
  } // At this point, we have to trust the generation will not throw
  // as it is NOT using any user/page-provided data


  return _applePassword.Password.generateDefault();
} // An extension type to differentiate between known errors


class HostnameInputError extends Error {}
/**
 * @typedef {Record<string, {"password-rules": string}>} RulesFormat
 */

/**
 * @private
 * @param {string} inputHostname
 * @param {RulesFormat} rules
 * @returns {string | undefined}
 * @throws {HostnameInputError}
 */


exports.HostnameInputError = HostnameInputError;

function _selectPasswordRules(inputHostname, rules) {
  const hostname = _safeHostname(inputHostname); // direct match


  if (rules[hostname]) {
    return rules[hostname]['password-rules'];
  } // otherwise, start chopping off subdomains and re-joining to compare


  const pieces = hostname.split('.');

  while (pieces.length > 1) {
    pieces.shift();
    const joined = pieces.join('.');

    if (rules[joined]) {
      return rules[joined]['password-rules'];
    }
  }

  return undefined;
}
/**
 * @private
 * @param {string} inputHostname;
 * @throws {HostnameInputError}
 * @returns {string}
 */


function _safeHostname(inputHostname) {
  if (inputHostname.startsWith('http:') || inputHostname.startsWith('https:')) {
    throw new HostnameInputError('invalid input, you can only provide a hostname but you gave a scheme');
  }

  if (inputHostname.includes(':')) {
    throw new HostnameInputError('invalid input, you can only provide a hostname but you gave a :port');
  }

  try {
    const asUrl = new URL('https://' + inputHostname);
    return asUrl.hostname;
  } catch (e) {
    throw new HostnameInputError("could not instantiate a URL from that hostname ".concat(inputHostname));
  }
}

},{"./lib/apple.password.js":18,"./lib/constants.js":19,"./lib/rules-parser.js":20}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Password = void 0;

var parser = _interopRequireWildcard(require("./rules-parser.js"));

var _constants = require("./constants.js");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @typedef {{
 *     PasswordAllowedCharacters?: string,
 *     PasswordRequiredCharacters?: string[],
 *     PasswordRepeatedCharacterLimit?: number,
 *     PasswordConsecutiveCharacterLimit?: number,
 *     PasswordMinLength?: number,
 *     PasswordMaxLength?: number,
 * }} Requirements
 */

/**
 * @typedef {{
 *     NumberOfRequiredRandomCharacters: number,
 *     PasswordAllowedCharacters: string,
 *     RequiredCharacterSets: string[]
 * }} PasswordParameters
 */
const defaults = Object.freeze({
  SCAN_SET_ORDER: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-~!@#$%^&*_+=`|(){}[:;\\\"'<>,.?/ ]",
  defaultUnambiguousCharacters: 'abcdefghijkmnopqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ0123456789',
  defaultPasswordLength: _constants.constants.DEFAULT_MIN_LENGTH,
  defaultPasswordRules: _constants.constants.DEFAULT_PASSWORD_RULES,
  defaultRequiredCharacterSets: ['abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '0123456789'],

  /**
   * @type {typeof window.crypto.getRandomValues | null}
   */
  getRandomValues: null
});
/**
 * This is added here to ensure:
 *
 * 1) `getRandomValues` is called with the correct prototype chain
 * 2) `window` is not accessed when in a node environment
 * 3) `bind` is not called in a hot code path
 *
 * @type {{ getRandomValues: typeof window.crypto.getRandomValues }}
 */

const safeGlobals = {};

if (typeof window !== 'undefined') {
  safeGlobals.getRandomValues = window.crypto.getRandomValues.bind(window.crypto);
}

class Password {
  /**
   * @type {typeof defaults}
   */

  /**
   * @param {Partial<typeof defaults>} [options]
   */
  constructor() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _defineProperty(this, "options", void 0);

    this.options = { ...defaults,
      ...options
    };
    return this;
  }
  /**
   * This is here to provide external access to un-modified defaults
   * in case they are needed for tests/verifications
   * @type {typeof defaults}
   */


  /**
   * Generates a password from the given input.
   *
   * Note: This method will throw an error if parsing fails - use with caution
   *
   * @example
   *
   * ```javascript
   * const password = Password.generateOrThrow("minlength: 20")
   * ```
   * @public
   * @param {string} inputString
   * @param {Partial<typeof defaults>} [options]
   * @throws {ParserError|Error}
   * @returns {string}
   */
  static generateOrThrow(inputString) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return new Password(options).parse(inputString).generate();
  }
  /**
   * Generates a password using the default ruleset.
   *
   * @example
   *
   * ```javascript
   * const password = Password.generateDefault()
   * ```
   *
   * @public
   * @param {Partial<typeof defaults>} [options]
   * @returns {string}
   */


  static generateDefault() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return new Password(options).parse(Password.defaults.defaultPasswordRules).generate();
  }
  /**
   * Convert a ruleset into it's internally-used component pieces.
   *
   * @param {string} inputString
   * @throws {parser.ParserError|Error}
   * @returns {{
   *    requirements: Requirements;
   *    parameters: PasswordParameters;
   *    rules: parser.Rule[],
   *    get entropy(): number;
   *    generate: () => string;
   * }}
   */


  parse(inputString) {
    const rules = parser.parsePasswordRules(inputString);

    const requirements = this._requirementsFromRules(rules);

    if (!requirements) throw new Error('could not generate requirements for ' + JSON.stringify(inputString));

    const parameters = this._passwordGenerationParametersDictionary(requirements);

    return {
      requirements,
      parameters,
      rules,

      get entropy() {
        return Math.log2(parameters.PasswordAllowedCharacters.length ** parameters.NumberOfRequiredRandomCharacters);
      },

      generate: () => {
        const password = this._generatedPasswordMatchingRequirements(requirements, parameters);
        /**
         * The following is unreachable because if user input was incorrect then
         * the parsing phase would throw. The following lines is to satisfy Typescript
         */


        if (password === '') throw new Error('unreachable');
        return password;
      }
    };
  }
  /**
   * Given an array of `Rule's`, convert into `Requirements`
   *
   * @param {parser.Rule[]} passwordRules
   * @returns {Requirements | null}
   */


  _requirementsFromRules(passwordRules) {
    /** @type {Requirements} */
    const requirements = {};

    for (let rule of passwordRules) {
      if (rule.name === parser.RuleName.ALLOWED) {
        console.assert(!('PasswordAllowedCharacters' in requirements));

        const chars = this._charactersFromCharactersClasses(rule.value);

        const scanSet = this._canonicalizedScanSetFromCharacters(chars);

        if (scanSet) {
          requirements.PasswordAllowedCharacters = scanSet;
        }
      } else if (rule.name === parser.RuleName.MAX_CONSECUTIVE) {
        console.assert(!('PasswordRepeatedCharacterLimit' in requirements));
        requirements.PasswordRepeatedCharacterLimit = rule.value;
      } else if (rule.name === parser.RuleName.REQUIRED) {
        let requiredCharacters = requirements.PasswordRequiredCharacters;

        if (!requiredCharacters) {
          requiredCharacters = requirements.PasswordRequiredCharacters = [];
        }

        requiredCharacters.push(this._canonicalizedScanSetFromCharacters(this._charactersFromCharactersClasses(rule.value)));
      } else if (rule.name === parser.RuleName.MIN_LENGTH) {
        requirements.PasswordMinLength = rule.value;
      } else if (rule.name === parser.RuleName.MAX_LENGTH) {
        requirements.PasswordMaxLength = rule.value;
      }
    } // Only include an allowed rule matching SCAN_SET_ORDER (all characters) when a required rule is also present.


    if (requirements.PasswordAllowedCharacters === this.options.SCAN_SET_ORDER && !requirements.PasswordRequiredCharacters) {
      delete requirements.PasswordAllowedCharacters;
    } // Fix up PasswordRequiredCharacters, if needed.


    if (requirements.PasswordRequiredCharacters && requirements.PasswordRequiredCharacters.length === 1 && requirements.PasswordRequiredCharacters[0] === this.options.SCAN_SET_ORDER) {
      delete requirements.PasswordRequiredCharacters;
    }

    return Object.keys(requirements).length ? requirements : null;
  }
  /**
   * @param {number} range
   * @returns {number}
   */


  _randomNumberWithUniformDistribution(range) {
    const getRandomValues = this.options.getRandomValues || safeGlobals.getRandomValues; // Based on the algorithm described in https://pthree.org/2018/06/13/why-the-multiply-and-floor-rng-method-is-biased/

    const max = Math.floor(2 ** 32 / range) * range;
    let x;

    do {
      x = getRandomValues(new Uint32Array(1))[0];
    } while (x >= max);

    return x % range;
  }
  /**
   * @param {number} numberOfRequiredRandomCharacters
   * @param {string} allowedCharacters
   */


  _classicPassword(numberOfRequiredRandomCharacters, allowedCharacters) {
    const length = allowedCharacters.length;
    const randomCharArray = Array(numberOfRequiredRandomCharacters);

    for (let i = 0; i < numberOfRequiredRandomCharacters; i++) {
      const index = this._randomNumberWithUniformDistribution(length);

      randomCharArray[i] = allowedCharacters[index];
    }

    return randomCharArray.join('');
  }
  /**
   * @param {string} password
   * @param {number} consecutiveCharLimit
   * @returns {boolean}
   */


  _passwordHasNotExceededConsecutiveCharLimit(password, consecutiveCharLimit) {
    let longestConsecutiveCharLength = 1;
    let firstConsecutiveCharIndex = 0; // Both "123" or "abc" and "321" or "cba" are considered consecutive.

    let isSequenceAscending;

    for (let i = 1; i < password.length; i++) {
      const currCharCode = password.charCodeAt(i);
      const prevCharCode = password.charCodeAt(i - 1);

      if (isSequenceAscending) {
        // If `isSequenceAscending` is defined, then we know that we are in the middle of an existing
        // pattern. Check if the pattern continues based on whether the previous pattern was
        // ascending or descending.
        if (isSequenceAscending.valueOf() && currCharCode === prevCharCode + 1 || !isSequenceAscending.valueOf() && currCharCode === prevCharCode - 1) {
          continue;
        } // Take into account the case when the sequence transitions from descending
        // to ascending.


        if (currCharCode === prevCharCode + 1) {
          firstConsecutiveCharIndex = i - 1;
          isSequenceAscending = Boolean(true);
          continue;
        } // Take into account the case when the sequence transitions from ascending
        // to descending.


        if (currCharCode === prevCharCode - 1) {
          firstConsecutiveCharIndex = i - 1;
          isSequenceAscending = Boolean(false);
          continue;
        }

        isSequenceAscending = null;
      } else if (currCharCode === prevCharCode + 1) {
        isSequenceAscending = Boolean(true);
        continue;
      } else if (currCharCode === prevCharCode - 1) {
        isSequenceAscending = Boolean(false);
        continue;
      }

      const currConsecutiveCharLength = i - firstConsecutiveCharIndex;

      if (currConsecutiveCharLength > longestConsecutiveCharLength) {
        longestConsecutiveCharLength = currConsecutiveCharLength;
      }

      firstConsecutiveCharIndex = i;
    }

    if (isSequenceAscending) {
      const currConsecutiveCharLength = password.length - firstConsecutiveCharIndex;

      if (currConsecutiveCharLength > longestConsecutiveCharLength) {
        longestConsecutiveCharLength = currConsecutiveCharLength;
      }
    }

    return longestConsecutiveCharLength <= consecutiveCharLimit;
  }
  /**
   * @param {string} password
   * @param {number} repeatedCharLimit
   * @returns {boolean}
   */


  _passwordHasNotExceededRepeatedCharLimit(password, repeatedCharLimit) {
    let longestRepeatedCharLength = 1;
    let lastRepeatedChar = password.charAt(0);
    let lastRepeatedCharIndex = 0;

    for (let i = 1; i < password.length; i++) {
      const currChar = password.charAt(i);

      if (currChar === lastRepeatedChar) {
        continue;
      }

      const currRepeatedCharLength = i - lastRepeatedCharIndex;

      if (currRepeatedCharLength > longestRepeatedCharLength) {
        longestRepeatedCharLength = currRepeatedCharLength;
      }

      lastRepeatedChar = currChar;
      lastRepeatedCharIndex = i;
    }

    return longestRepeatedCharLength <= repeatedCharLimit;
  }
  /**
   * @param {string} password
   * @param {string[]} requiredCharacterSets
   * @returns {boolean}
   */


  _passwordContainsRequiredCharacters(password, requiredCharacterSets) {
    const requiredCharacterSetsLength = requiredCharacterSets.length;
    const passwordLength = password.length;

    for (let i = 0; i < requiredCharacterSetsLength; i++) {
      const requiredCharacterSet = requiredCharacterSets[i];
      let hasRequiredChar = false;

      for (let j = 0; j < passwordLength; j++) {
        const char = password.charAt(j);

        if (requiredCharacterSet.indexOf(char) !== -1) {
          hasRequiredChar = true;
          break;
        }
      }

      if (!hasRequiredChar) {
        return false;
      }
    }

    return true;
  }
  /**
   * @param {string} string1
   * @param {string} string2
   * @returns {boolean}
   */


  _stringsHaveAtLeastOneCommonCharacter(string1, string2) {
    const string2Length = string2.length;

    for (let i = 0; i < string2Length; i++) {
      const char = string2.charAt(i);

      if (string1.indexOf(char) !== -1) {
        return true;
      }
    }

    return false;
  }
  /**
   * @param {Requirements} requirements
   * @returns {PasswordParameters}
   */


  _passwordGenerationParametersDictionary(requirements) {
    let minPasswordLength = requirements.PasswordMinLength;
    const maxPasswordLength = requirements.PasswordMaxLength; // @ts-ignore

    if (minPasswordLength > maxPasswordLength) {
      // Resetting invalid value of min length to zero means "ignore min length parameter in password generation".
      minPasswordLength = 0;
    }

    const requiredCharacterArray = requirements.PasswordRequiredCharacters;
    let allowedCharacters = requirements.PasswordAllowedCharacters;
    let requiredCharacterSets = this.options.defaultRequiredCharacterSets;

    if (requiredCharacterArray) {
      const mutatedRequiredCharacterSets = [];
      const requiredCharacterArrayLength = requiredCharacterArray.length;

      for (let i = 0; i < requiredCharacterArrayLength; i++) {
        const requiredCharacters = requiredCharacterArray[i];

        if (allowedCharacters && this._stringsHaveAtLeastOneCommonCharacter(requiredCharacters, allowedCharacters)) {
          mutatedRequiredCharacterSets.push(requiredCharacters);
        }
      }

      requiredCharacterSets = mutatedRequiredCharacterSets;
    } // If requirements allow, we will generateOrThrow the password in default format: "xxx-xxx-xxx-xxx".


    let numberOfRequiredRandomCharacters = this.options.defaultPasswordLength;

    if (minPasswordLength && minPasswordLength > numberOfRequiredRandomCharacters) {
      numberOfRequiredRandomCharacters = minPasswordLength;
    }

    if (maxPasswordLength && maxPasswordLength < numberOfRequiredRandomCharacters) {
      numberOfRequiredRandomCharacters = maxPasswordLength;
    }

    if (!allowedCharacters) {
      allowedCharacters = this.options.defaultUnambiguousCharacters;
    } // In default password format, we use dashes only as separators, not as symbols you can encounter at a random position.


    if (!requiredCharacterSets) {
      requiredCharacterSets = this.options.defaultRequiredCharacterSets;
    } // If we have more requirements of the type "need a character from set" than the length of the password we want to generateOrThrow, then
    // we will never be able to meet these requirements, and we'll end up in an infinite loop generating passwords. To avoid this,
    // reset required character sets if the requirements are impossible to meet.


    if (requiredCharacterSets.length > numberOfRequiredRandomCharacters) {
      requiredCharacterSets = [];
    } // Do not require any character sets that do not contain allowed characters.


    const requiredCharacterSetsLength = requiredCharacterSets.length;
    const mutatedRequiredCharacterSets = [];
    const allowedCharactersLength = allowedCharacters.length;

    for (let i = 0; i < requiredCharacterSetsLength; i++) {
      const requiredCharacterSet = requiredCharacterSets[i];
      let requiredCharacterSetContainsAllowedCharacters = false;

      for (let j = 0; j < allowedCharactersLength; j++) {
        const character = allowedCharacters.charAt(j);

        if (requiredCharacterSet.indexOf(character) !== -1) {
          requiredCharacterSetContainsAllowedCharacters = true;
          break;
        }
      }

      if (requiredCharacterSetContainsAllowedCharacters) {
        mutatedRequiredCharacterSets.push(requiredCharacterSet);
      }
    }

    requiredCharacterSets = mutatedRequiredCharacterSets;
    return {
      NumberOfRequiredRandomCharacters: numberOfRequiredRandomCharacters,
      PasswordAllowedCharacters: allowedCharacters,
      RequiredCharacterSets: requiredCharacterSets
    };
  }
  /**
   * @param {Requirements | null} requirements
   * @param {PasswordParameters} [parameters]
   * @returns {string}
   */


  _generatedPasswordMatchingRequirements(requirements, parameters) {
    requirements = requirements || {};
    parameters = parameters || this._passwordGenerationParametersDictionary(requirements);
    const numberOfRequiredRandomCharacters = parameters.NumberOfRequiredRandomCharacters;
    const repeatedCharLimit = requirements.PasswordRepeatedCharacterLimit;
    const allowedCharacters = parameters.PasswordAllowedCharacters;
    const shouldCheckRepeatedCharRequirement = !!repeatedCharLimit;

    while (true) {
      const password = this._classicPassword(numberOfRequiredRandomCharacters, allowedCharacters);

      if (!this._passwordContainsRequiredCharacters(password, parameters.RequiredCharacterSets)) {
        continue;
      }

      if (shouldCheckRepeatedCharRequirement) {
        if (repeatedCharLimit !== undefined && repeatedCharLimit >= 1 && !this._passwordHasNotExceededRepeatedCharLimit(password, repeatedCharLimit)) {
          continue;
        }
      }

      const consecutiveCharLimit = requirements.PasswordConsecutiveCharacterLimit;

      if (consecutiveCharLimit && consecutiveCharLimit >= 1) {
        if (!this._passwordHasNotExceededConsecutiveCharLimit(password, consecutiveCharLimit)) {
          continue;
        }
      }

      return password || '';
    }
  }
  /**
   * @param {parser.CustomCharacterClass | parser.NamedCharacterClass} characterClass
   * @returns {string[]}
   */


  _scanSetFromCharacterClass(characterClass) {
    if (characterClass instanceof parser.CustomCharacterClass) {
      return characterClass.characters;
    }

    console.assert(characterClass instanceof parser.NamedCharacterClass);

    switch (characterClass.name) {
      case parser.Identifier.ASCII_PRINTABLE:
      case parser.Identifier.UNICODE:
        return this.options.SCAN_SET_ORDER.split('');

      case parser.Identifier.DIGIT:
        return this.options.SCAN_SET_ORDER.substring(this.options.SCAN_SET_ORDER.indexOf('0'), this.options.SCAN_SET_ORDER.indexOf('9') + 1).split('');

      case parser.Identifier.LOWER:
        return this.options.SCAN_SET_ORDER.substring(this.options.SCAN_SET_ORDER.indexOf('a'), this.options.SCAN_SET_ORDER.indexOf('z') + 1).split('');

      case parser.Identifier.SPECIAL:
        return this.options.SCAN_SET_ORDER.substring(this.options.SCAN_SET_ORDER.indexOf('-'), this.options.SCAN_SET_ORDER.indexOf(']') + 1).split('');

      case parser.Identifier.UPPER:
        return this.options.SCAN_SET_ORDER.substring(this.options.SCAN_SET_ORDER.indexOf('A'), this.options.SCAN_SET_ORDER.indexOf('Z') + 1).split('');
    }

    console.assert(false, parser.SHOULD_NOT_BE_REACHED);
    return [];
  }
  /**
   * @param {(parser.CustomCharacterClass | parser.NamedCharacterClass)[]} characterClasses
   */


  _charactersFromCharactersClasses(characterClasses) {
    const output = [];

    for (let characterClass of characterClasses) {
      output.push(...this._scanSetFromCharacterClass(characterClass));
    }

    return output;
  }
  /**
   * @param {string[]} characters
   * @returns {string}
   */


  _canonicalizedScanSetFromCharacters(characters) {
    if (!characters.length) {
      return '';
    }

    let shadowCharacters = Array.prototype.slice.call(characters);
    shadowCharacters.sort((a, b) => this.options.SCAN_SET_ORDER.indexOf(a) - this.options.SCAN_SET_ORDER.indexOf(b));
    let uniqueCharacters = [shadowCharacters[0]];

    for (let i = 1, length = shadowCharacters.length; i < length; ++i) {
      if (shadowCharacters[i] === shadowCharacters[i - 1]) {
        continue;
      }

      uniqueCharacters.push(shadowCharacters[i]);
    }

    return uniqueCharacters.join('');
  }

}

exports.Password = Password;

_defineProperty(Password, "defaults", defaults);

},{"./constants.js":19,"./rules-parser.js":20}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.constants = void 0;
const DEFAULT_MIN_LENGTH = 20;
const DEFAULT_MAX_LENGTH = 30;
const DEFAULT_REQUIRED_CHARS = '-!?$&#%';
const DEFAULT_UNAMBIGUOUS_CHARS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';
const DEFAULT_PASSWORD_RULES = ["minlength: ".concat(DEFAULT_MIN_LENGTH), "maxlength: ".concat(DEFAULT_MAX_LENGTH), "required: [".concat(DEFAULT_REQUIRED_CHARS, "]"), "allowed: [".concat(DEFAULT_UNAMBIGUOUS_CHARS, "]")].join('; ');
const constants = {
  DEFAULT_MIN_LENGTH,
  DEFAULT_MAX_LENGTH,
  DEFAULT_PASSWORD_RULES,
  DEFAULT_REQUIRED_CHARS,
  DEFAULT_UNAMBIGUOUS_CHARS
};
exports.constants = constants;

},{}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SHOULD_NOT_BE_REACHED = exports.RuleName = exports.Rule = exports.ParserError = exports.NamedCharacterClass = exports.Identifier = exports.CustomCharacterClass = void 0;
exports.parsePasswordRules = parsePasswordRules;
// Copyright (c) 2019 - 2020 Apple Inc. Licensed under MIT License.

/*
 *
 * NOTE:
 *
 * This file was taken as intended from https://github.com/apple/password-manager-resources.
 *
 * The only additions from DuckDuckGo employees are
 *
 * 1) exporting some identifiers
 * 2) adding some JSDoc comments
 * 3) making this parser throw when it cannot produce any rules
 *    ^ the default implementation still returns a base-line ruleset, which we didn't want.
 *
 */
const Identifier = {
  ASCII_PRINTABLE: 'ascii-printable',
  DIGIT: 'digit',
  LOWER: 'lower',
  SPECIAL: 'special',
  UNICODE: 'unicode',
  UPPER: 'upper'
};
exports.Identifier = Identifier;
const RuleName = {
  ALLOWED: 'allowed',
  MAX_CONSECUTIVE: 'max-consecutive',
  REQUIRED: 'required',
  MIN_LENGTH: 'minlength',
  MAX_LENGTH: 'maxlength'
};
exports.RuleName = RuleName;
const CHARACTER_CLASS_START_SENTINEL = '[';
const CHARACTER_CLASS_END_SENTINEL = ']';
const PROPERTY_VALUE_SEPARATOR = ',';
const PROPERTY_SEPARATOR = ';';
const PROPERTY_VALUE_START_SENTINEL = ':';
const SPACE_CODE_POINT = ' '.codePointAt(0);
const SHOULD_NOT_BE_REACHED = 'Should not be reached';
exports.SHOULD_NOT_BE_REACHED = SHOULD_NOT_BE_REACHED;

class Rule {
  constructor(name, value) {
    this._name = name;
    this.value = value;
  }

  get name() {
    return this._name;
  }

  toString() {
    return JSON.stringify(this);
  }

}

exports.Rule = Rule;
;

class NamedCharacterClass {
  constructor(name) {
    console.assert(_isValidRequiredOrAllowedPropertyValueIdentifier(name));
    this._name = name;
  }

  get name() {
    return this._name.toLowerCase();
  }

  toString() {
    return this._name;
  }

  toHTMLString() {
    return this._name;
  }

}

exports.NamedCharacterClass = NamedCharacterClass;
;

class ParserError extends Error {}

exports.ParserError = ParserError;
;

class CustomCharacterClass {
  constructor(characters) {
    console.assert(characters instanceof Array);
    this._characters = characters;
  }

  get characters() {
    return this._characters;
  }

  toString() {
    return "[".concat(this._characters.join(''), "]");
  }

  toHTMLString() {
    return "[".concat(this._characters.join('').replace('"', '&quot;'), "]");
  }

}

exports.CustomCharacterClass = CustomCharacterClass;
; // MARK: Lexer functions

function _isIdentifierCharacter(c) {
  console.assert(c.length === 1); // eslint-disable-next-line no-mixed-operators

  return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c === '-';
}

function _isASCIIDigit(c) {
  console.assert(c.length === 1);
  return c >= '0' && c <= '9';
}

function _isASCIIPrintableCharacter(c) {
  console.assert(c.length === 1);
  return c >= ' ' && c <= '~';
}

function _isASCIIWhitespace(c) {
  console.assert(c.length === 1);
  return c === ' ' || c === '\f' || c === '\n' || c === '\r' || c === '\t';
} // MARK: ASCII printable character bit set and canonicalization functions


function _bitSetIndexForCharacter(c) {
  console.assert(c.length === 1); // @ts-ignore

  return c.codePointAt(0) - SPACE_CODE_POINT;
}

function _characterAtBitSetIndex(index) {
  return String.fromCodePoint(index + SPACE_CODE_POINT);
}

function _markBitsForNamedCharacterClass(bitSet, namedCharacterClass) {
  console.assert(bitSet instanceof Array);
  console.assert(namedCharacterClass.name !== Identifier.UNICODE);
  console.assert(namedCharacterClass.name !== Identifier.ASCII_PRINTABLE);

  if (namedCharacterClass.name === Identifier.UPPER) {
    bitSet.fill(true, _bitSetIndexForCharacter('A'), _bitSetIndexForCharacter('Z') + 1);
  } else if (namedCharacterClass.name === Identifier.LOWER) {
    bitSet.fill(true, _bitSetIndexForCharacter('a'), _bitSetIndexForCharacter('z') + 1);
  } else if (namedCharacterClass.name === Identifier.DIGIT) {
    bitSet.fill(true, _bitSetIndexForCharacter('0'), _bitSetIndexForCharacter('9') + 1);
  } else if (namedCharacterClass.name === Identifier.SPECIAL) {
    bitSet.fill(true, _bitSetIndexForCharacter(' '), _bitSetIndexForCharacter('/') + 1);
    bitSet.fill(true, _bitSetIndexForCharacter(':'), _bitSetIndexForCharacter('@') + 1);
    bitSet.fill(true, _bitSetIndexForCharacter('['), _bitSetIndexForCharacter('`') + 1);
    bitSet.fill(true, _bitSetIndexForCharacter('{'), _bitSetIndexForCharacter('~') + 1);
  } else {
    console.assert(false, SHOULD_NOT_BE_REACHED, namedCharacterClass);
  }
}

function _markBitsForCustomCharacterClass(bitSet, customCharacterClass) {
  for (let character of customCharacterClass.characters) {
    bitSet[_bitSetIndexForCharacter(character)] = true;
  }
}

function _canonicalizedPropertyValues(propertyValues, keepCustomCharacterClassFormatCompliant) {
  // @ts-ignore
  let asciiPrintableBitSet = new Array('~'.codePointAt(0) - ' '.codePointAt(0) + 1);

  for (let propertyValue of propertyValues) {
    if (propertyValue instanceof NamedCharacterClass) {
      if (propertyValue.name === Identifier.UNICODE) {
        return [new NamedCharacterClass(Identifier.UNICODE)];
      }

      if (propertyValue.name === Identifier.ASCII_PRINTABLE) {
        return [new NamedCharacterClass(Identifier.ASCII_PRINTABLE)];
      }

      _markBitsForNamedCharacterClass(asciiPrintableBitSet, propertyValue);
    } else if (propertyValue instanceof CustomCharacterClass) {
      _markBitsForCustomCharacterClass(asciiPrintableBitSet, propertyValue);
    }
  }

  let charactersSeen = [];

  function checkRange(start, end) {
    let temp = [];

    for (let i = _bitSetIndexForCharacter(start); i <= _bitSetIndexForCharacter(end); ++i) {
      if (asciiPrintableBitSet[i]) {
        temp.push(_characterAtBitSetIndex(i));
      }
    }

    let result = temp.length === _bitSetIndexForCharacter(end) - _bitSetIndexForCharacter(start) + 1;

    if (!result) {
      charactersSeen = charactersSeen.concat(temp);
    }

    return result;
  }

  let hasAllUpper = checkRange('A', 'Z');
  let hasAllLower = checkRange('a', 'z');
  let hasAllDigits = checkRange('0', '9'); // Check for special characters, accounting for characters that are given special treatment (i.e. '-' and ']')

  let hasAllSpecial = false;
  let hasDash = false;
  let hasRightSquareBracket = false;
  let temp = [];

  for (let i = _bitSetIndexForCharacter(' '); i <= _bitSetIndexForCharacter('/'); ++i) {
    if (!asciiPrintableBitSet[i]) {
      continue;
    }

    let character = _characterAtBitSetIndex(i);

    if (keepCustomCharacterClassFormatCompliant && character === '-') {
      hasDash = true;
    } else {
      temp.push(character);
    }
  }

  for (let i = _bitSetIndexForCharacter(':'); i <= _bitSetIndexForCharacter('@'); ++i) {
    if (asciiPrintableBitSet[i]) {
      temp.push(_characterAtBitSetIndex(i));
    }
  }

  for (let i = _bitSetIndexForCharacter('['); i <= _bitSetIndexForCharacter('`'); ++i) {
    if (!asciiPrintableBitSet[i]) {
      continue;
    }

    let character = _characterAtBitSetIndex(i);

    if (keepCustomCharacterClassFormatCompliant && character === ']') {
      hasRightSquareBracket = true;
    } else {
      temp.push(character);
    }
  }

  for (let i = _bitSetIndexForCharacter('{'); i <= _bitSetIndexForCharacter('~'); ++i) {
    if (asciiPrintableBitSet[i]) {
      temp.push(_characterAtBitSetIndex(i));
    }
  }

  if (hasDash) {
    temp.unshift('-');
  }

  if (hasRightSquareBracket) {
    temp.push(']');
  }

  let numberOfSpecialCharacters = _bitSetIndexForCharacter('/') - _bitSetIndexForCharacter(' ') + 1 + (_bitSetIndexForCharacter('@') - _bitSetIndexForCharacter(':') + 1) + (_bitSetIndexForCharacter('`') - _bitSetIndexForCharacter('[') + 1) + (_bitSetIndexForCharacter('~') - _bitSetIndexForCharacter('{') + 1);
  hasAllSpecial = temp.length === numberOfSpecialCharacters;

  if (!hasAllSpecial) {
    charactersSeen = charactersSeen.concat(temp);
  }

  let result = [];

  if (hasAllUpper && hasAllLower && hasAllDigits && hasAllSpecial) {
    return [new NamedCharacterClass(Identifier.ASCII_PRINTABLE)];
  }

  if (hasAllUpper) {
    result.push(new NamedCharacterClass(Identifier.UPPER));
  }

  if (hasAllLower) {
    result.push(new NamedCharacterClass(Identifier.LOWER));
  }

  if (hasAllDigits) {
    result.push(new NamedCharacterClass(Identifier.DIGIT));
  }

  if (hasAllSpecial) {
    result.push(new NamedCharacterClass(Identifier.SPECIAL));
  }

  if (charactersSeen.length) {
    result.push(new CustomCharacterClass(charactersSeen));
  }

  return result;
} // MARK: Parser functions


function _indexOfNonWhitespaceCharacter(input) {
  let position = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  console.assert(position >= 0);
  console.assert(position <= input.length);
  let length = input.length;

  while (position < length && _isASCIIWhitespace(input[position])) {
    ++position;
  }

  return position;
}

function _parseIdentifier(input, position) {
  console.assert(position >= 0);
  console.assert(position < input.length);
  console.assert(_isIdentifierCharacter(input[position]));
  let length = input.length;
  let seenIdentifiers = [];

  do {
    let c = input[position];

    if (!_isIdentifierCharacter(c)) {
      break;
    }

    seenIdentifiers.push(c);
    ++position;
  } while (position < length);

  return [seenIdentifiers.join(''), position];
}

function _isValidRequiredOrAllowedPropertyValueIdentifier(identifier) {
  return identifier && Object.values(Identifier).includes(identifier.toLowerCase());
}

function _parseCustomCharacterClass(input, position) {
  console.assert(position >= 0);
  console.assert(position < input.length);
  console.assert(input[position] === CHARACTER_CLASS_START_SENTINEL);
  let length = input.length;
  ++position;

  if (position >= length) {
    // console.error('Found end-of-line instead of character class character')
    return [null, position];
  }

  let initialPosition = position;
  let result = [];

  do {
    let c = input[position];

    if (!_isASCIIPrintableCharacter(c)) {
      ++position;
      continue;
    }

    if (c === '-' && position - initialPosition > 0) {
      // FIXME: Should this be an error?
      console.warn("Ignoring '-'; a '-' may only appear as the first character in a character class");
      ++position;
      continue;
    }

    result.push(c);
    ++position;

    if (c === CHARACTER_CLASS_END_SENTINEL) {
      break;
    }
  } while (position < length);

  if (position < length && input[position] !== CHARACTER_CLASS_END_SENTINEL) {
    // Fix up result; we over consumed.
    result.pop();
    return [result, position];
  } else if (position === length && input[position - 1] === CHARACTER_CLASS_END_SENTINEL) {
    // Fix up result; we over consumed.
    result.pop();
    return [result, position];
  }

  if (position < length && input[position] === CHARACTER_CLASS_END_SENTINEL) {
    return [result, position + 1];
  } // console.error('Found end-of-line instead of end of character class')


  return [null, position];
}

function _parsePasswordRequiredOrAllowedPropertyValue(input, position) {
  console.assert(position >= 0);
  console.assert(position < input.length);
  let length = input.length;
  let propertyValues = [];

  while (true) {
    if (_isIdentifierCharacter(input[position])) {
      let identifierStartPosition = position; // eslint-disable-next-line no-redeclare

      var [propertyValue, position] = _parseIdentifier(input, position);

      if (!_isValidRequiredOrAllowedPropertyValueIdentifier(propertyValue)) {
        // console.error('Unrecognized property value identifier: ' + propertyValue)
        return [null, identifierStartPosition];
      }

      propertyValues.push(new NamedCharacterClass(propertyValue));
    } else if (input[position] === CHARACTER_CLASS_START_SENTINEL) {
      // eslint-disable-next-line no-redeclare
      var [propertyValue, position] = _parseCustomCharacterClass(input, position);

      if (propertyValue && propertyValue.length) {
        propertyValues.push(new CustomCharacterClass(propertyValue));
      }
    } else {
      // console.error('Failed to find start of property value: ' + input.substr(position))
      return [null, position];
    }

    position = _indexOfNonWhitespaceCharacter(input, position);

    if (position >= length || input[position] === PROPERTY_SEPARATOR) {
      break;
    }

    if (input[position] === PROPERTY_VALUE_SEPARATOR) {
      position = _indexOfNonWhitespaceCharacter(input, position + 1);

      if (position >= length) {
        // console.error('Found end-of-line instead of start of next property value')
        return [null, position];
      }

      continue;
    } // console.error('Failed to find start of next property or property value: ' + input.substr(position))


    return [null, position];
  }

  return [propertyValues, position];
}
/**
 * @param input
 * @param position
 * @returns {[Rule|null, number, string|undefined]}
 * @private
 */


function _parsePasswordRule(input, position) {
  console.assert(position >= 0);
  console.assert(position < input.length);
  console.assert(_isIdentifierCharacter(input[position]));
  let length = input.length;
  var mayBeIdentifierStartPosition = position; // eslint-disable-next-line no-redeclare

  var [identifier, position] = _parseIdentifier(input, position);

  if (!Object.values(RuleName).includes(identifier)) {
    // console.error('Unrecognized property name: ' + identifier)
    return [null, mayBeIdentifierStartPosition, undefined];
  }

  if (position >= length) {
    // console.error('Found end-of-line instead of start of property value')
    return [null, position, undefined];
  }

  if (input[position] !== PROPERTY_VALUE_START_SENTINEL) {
    // console.error('Failed to find start of property value: ' + input.substr(position))
    return [null, position, undefined];
  }

  let property = {
    name: identifier,
    value: null
  };
  position = _indexOfNonWhitespaceCharacter(input, position + 1); // Empty value

  if (position >= length || input[position] === PROPERTY_SEPARATOR) {
    return [new Rule(property.name, property.value), position, undefined];
  }

  switch (identifier) {
    case RuleName.ALLOWED:
    case RuleName.REQUIRED:
      {
        // eslint-disable-next-line no-redeclare
        var [propertyValue, position] = _parsePasswordRequiredOrAllowedPropertyValue(input, position);

        if (propertyValue) {
          property.value = propertyValue;
        }

        return [new Rule(property.name, property.value), position, undefined];
      }

    case RuleName.MAX_CONSECUTIVE:
      {
        // eslint-disable-next-line no-redeclare
        var [propertyValue, position] = _parseMaxConsecutivePropertyValue(input, position);

        if (propertyValue) {
          property.value = propertyValue;
        }

        return [new Rule(property.name, property.value), position, undefined];
      }

    case RuleName.MIN_LENGTH:
    case RuleName.MAX_LENGTH:
      {
        // eslint-disable-next-line no-redeclare
        var [propertyValue, position] = _parseMinLengthMaxLengthPropertyValue(input, position);

        if (propertyValue) {
          property.value = propertyValue;
        }

        return [new Rule(property.name, property.value), position, undefined];
      }
  }

  console.assert(false, SHOULD_NOT_BE_REACHED);
  return [null, -1, undefined];
}

function _parseMinLengthMaxLengthPropertyValue(input, position) {
  return _parseInteger(input, position);
}

function _parseMaxConsecutivePropertyValue(input, position) {
  return _parseInteger(input, position);
}

function _parseInteger(input, position) {
  console.assert(position >= 0);
  console.assert(position < input.length);

  if (!_isASCIIDigit(input[position])) {
    // console.error('Failed to parse value of type integer; not a number: ' + input.substr(position))
    return [null, position];
  }

  let length = input.length; // let initialPosition = position

  let result = 0;

  do {
    result = 10 * result + parseInt(input[position], 10);
    ++position;
  } while (position < length && input[position] !== PROPERTY_SEPARATOR && _isASCIIDigit(input[position]));

  if (position >= length || input[position] === PROPERTY_SEPARATOR) {
    return [result, position];
  } // console.error('Failed to parse value of type integer; not a number: ' + input.substr(initialPosition))


  return [null, position];
}
/**
 * @param input
 * @returns {[Rule[]|null, string|undefined]}
 * @private
 */


function _parsePasswordRulesInternal(input) {
  let parsedProperties = [];
  let length = input.length;

  var position = _indexOfNonWhitespaceCharacter(input);

  while (position < length) {
    if (!_isIdentifierCharacter(input[position])) {
      // console.warn('Failed to find start of property: ' + input.substr(position))
      return [parsedProperties, undefined];
    } // eslint-disable-next-line no-redeclare


    var [parsedProperty, position, message] = _parsePasswordRule(input, position);

    if (parsedProperty && parsedProperty.value) {
      parsedProperties.push(parsedProperty);
    }

    position = _indexOfNonWhitespaceCharacter(input, position);

    if (position >= length) {
      break;
    }

    if (input[position] === PROPERTY_SEPARATOR) {
      position = _indexOfNonWhitespaceCharacter(input, position + 1);

      if (position >= length) {
        return [parsedProperties, undefined];
      }

      continue;
    } // console.error('Failed to find start of next property: ' + input.substr(position))


    return [null, message || 'Failed to find start of next property: ' + input.substr(position)];
  }

  return [parsedProperties, undefined];
}
/**
 * @param {string} input
 * @param {boolean} [formatRulesForMinifiedVersion]
 * @returns {Rule[]}
 */


function parsePasswordRules(input, formatRulesForMinifiedVersion) {
  let [passwordRules, maybeMessage] = _parsePasswordRulesInternal(input);

  if (!passwordRules) {
    throw new ParserError(maybeMessage);
  }

  if (passwordRules.length === 0) {
    throw new ParserError('No valid rules were provided');
  } // When formatting rules for minified version, we should keep the formatted rules
  // as similar to the input as possible. Avoid copying required rules to allowed rules.


  let suppressCopyingRequiredToAllowed = formatRulesForMinifiedVersion;
  let requiredRules = [];
  let newAllowedValues = [];
  let minimumMaximumConsecutiveCharacters = null;
  let maximumMinLength = 0;
  let minimumMaxLength = null;

  for (let rule of passwordRules) {
    switch (rule.name) {
      case RuleName.MAX_CONSECUTIVE:
        minimumMaximumConsecutiveCharacters = minimumMaximumConsecutiveCharacters ? Math.min(rule.value, minimumMaximumConsecutiveCharacters) : rule.value;
        break;

      case RuleName.MIN_LENGTH:
        maximumMinLength = Math.max(rule.value, maximumMinLength);
        break;

      case RuleName.MAX_LENGTH:
        minimumMaxLength = minimumMaxLength ? Math.min(rule.value, minimumMaxLength) : rule.value;
        break;

      case RuleName.REQUIRED:
        rule.value = _canonicalizedPropertyValues(rule.value, formatRulesForMinifiedVersion);
        requiredRules.push(rule);

        if (!suppressCopyingRequiredToAllowed) {
          newAllowedValues = newAllowedValues.concat(rule.value);
        }

        break;

      case RuleName.ALLOWED:
        newAllowedValues = newAllowedValues.concat(rule.value);
        break;
    }
  }

  let newPasswordRules = [];

  if (maximumMinLength > 0) {
    newPasswordRules.push(new Rule(RuleName.MIN_LENGTH, maximumMinLength));
  }

  if (minimumMaxLength !== null) {
    newPasswordRules.push(new Rule(RuleName.MAX_LENGTH, minimumMaxLength));
  }

  if (minimumMaximumConsecutiveCharacters !== null) {
    newPasswordRules.push(new Rule(RuleName.MAX_CONSECUTIVE, minimumMaximumConsecutiveCharacters));
  }

  let sortedRequiredRules = requiredRules.sort(function (a, b) {
    const namedCharacterClassOrder = [Identifier.LOWER, Identifier.UPPER, Identifier.DIGIT, Identifier.SPECIAL, Identifier.ASCII_PRINTABLE, Identifier.UNICODE];
    let aIsJustOneNamedCharacterClass = a.value.length === 1 && a.value[0] instanceof NamedCharacterClass;
    let bIsJustOneNamedCharacterClass = b.value.length === 1 && b.value[0] instanceof NamedCharacterClass;

    if (aIsJustOneNamedCharacterClass && !bIsJustOneNamedCharacterClass) {
      return -1;
    }

    if (!aIsJustOneNamedCharacterClass && bIsJustOneNamedCharacterClass) {
      return 1;
    }

    if (aIsJustOneNamedCharacterClass && bIsJustOneNamedCharacterClass) {
      let aIndex = namedCharacterClassOrder.indexOf(a.value[0].name);
      let bIndex = namedCharacterClassOrder.indexOf(b.value[0].name);
      return aIndex - bIndex;
    }

    return 0;
  });
  newPasswordRules = newPasswordRules.concat(sortedRequiredRules);
  newAllowedValues = _canonicalizedPropertyValues(newAllowedValues, suppressCopyingRequiredToAllowed);

  if (!suppressCopyingRequiredToAllowed && !newAllowedValues.length) {
    newAllowedValues = [new NamedCharacterClass(Identifier.ASCII_PRINTABLE)];
  }

  if (newAllowedValues.length) {
    newPasswordRules.push(new Rule(RuleName.ALLOWED, newAllowedValues));
  }

  return newPasswordRules;
}

},{}],21:[function(require,module,exports){
module.exports={
  "163.com": {
    "password-rules": "minlength: 6; maxlength: 16;"
  },
  "1800flowers.com": {
    "password-rules": "minlength: 6; required: lower, upper; required: digit;"
  },
  "access.service.gov.uk": {
    "password-rules": "minlength: 10; required: lower; required: upper; required: digit; required: special;"
  },
  "admiral.com": {
    "password-rules": "minlength: 8; required: digit; required: [- !\"#$&'()*+,.:;<=>?@[^_`{|}~]]; allowed: lower, upper;"
  },
  "ae.com": {
    "password-rules": "minlength: 8; maxlength: 25; required: lower; required: upper; required: digit;"
  },
  "aetna.com": {
    "password-rules": "minlength: 8; maxlength: 20; max-consecutive: 2; required: upper; required: digit; allowed: lower, [-_&#@];"
  },
  "airasia.com": {
    "password-rules": "minlength: 8; maxlength: 15; required: lower; required: upper; required: digit;"
  },
  "airfrance.com": {
    "password-rules": "minlength: 8; maxlength: 12; required: lower; required: upper; required: digit; allowed: [-!#$&+/?@_];"
  },
  "airfrance.us": {
    "password-rules": "minlength: 8; maxlength: 12; required: lower; required: upper; required: digit; allowed: [-!#$&+/?@_];"
  },
  "ajisushionline.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; allowed: [ !#$%&*?@];"
  },
  "aliexpress.com": {
    "password-rules": "minlength: 6; maxlength: 20; allowed: lower, upper, digit;"
  },
  "alliantcreditunion.com": {
    "password-rules": "minlength: 8; maxlength: 20; max-consecutive: 3; required: lower, upper; required: digit; allowed: [!#$*];"
  },
  "allianz.com.br": {
    "password-rules": "minlength: 4; maxlength: 4;"
  },
  "americanexpress.com": {
    "password-rules": "minlength: 8; maxlength: 20; max-consecutive: 4; required: lower, upper; required: digit; allowed: [%&_?#=];"
  },
  "anatel.gov.br": {
    "password-rules": "minlength: 6; maxlength: 15; allowed: lower, upper, digit;"
  },
  "ancestry.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [-!\"#$%&'()*+,./:;<=>?@[^_`{|}~]];"
  },
  "angieslist.com": {
    "password-rules": "minlength: 6; maxlength: 15;"
  },
  "anthem.com": {
    "password-rules": "minlength: 8; maxlength: 20; max-consecutive: 3; required: lower, upper; required: digit; allowed: [!$*?@|];"
  },
  "app.digio.in": {
    "password-rules": "minlength: 8; maxlength: 15;"
  },
  "app.parkmobile.io": {
    "password-rules": "minlength: 8; maxlength: 25; required: lower; required: upper; required: digit; required: [!@#$%^&];"
  },
  "apple.com": {
    "password-rules": "minlength: 8; maxlength: 63; required: lower; required: upper; required: digit; allowed: ascii-printable;"
  },
  "areariservata.bancaetica.it": {
    "password-rules": "minlength: 8; maxlength: 10; required: lower; required: upper; required: digit; required: [!#&*+/=@_];"
  },
  "artscyclery.com": {
    "password-rules": "minlength: 6; maxlength: 19;"
  },
  "astonmartinf1.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; allowed: special;"
  },
  "autify.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [!\"#$%&'()*+,./:;<=>?@[^_`{|}~]];"
  },
  "axa.de": {
    "password-rules": "minlength: 8; maxlength: 65; required: lower; required: upper; required: digit; allowed: [-!\"§$%&/()=?;:_+*'#];"
  },
  "baidu.com": {
    "password-rules": "minlength: 6; maxlength: 14;"
  },
  "bancochile.cl": {
    "password-rules": "minlength: 8; maxlength: 8; required: lower; required: upper; required: digit;"
  },
  "bankofamerica.com": {
    "password-rules": "minlength: 8; maxlength: 20; max-consecutive: 3; required: lower; required: upper; required: digit; allowed: [-@#*()+={}/?~;,._];"
  },
  "battle.net": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower, upper; allowed: digit, special;"
  },
  "bcassessment.ca": {
    "password-rules": "minlength: 8; maxlength: 14;"
  },
  "belkin.com": {
    "password-rules": "minlength: 8; required: lower, upper; required: digit; required: [$!@~_,%&];"
  },
  "benefitslogin.discoverybenefits.com": {
    "password-rules": "minlength: 10; required: upper; required: digit; required: [!#$%&*?@]; allowed: lower;"
  },
  "benjerry.com": {
    "password-rules": "required: upper; required: upper; required: digit; required: digit; required: special; required: special; allowed: lower;"
  },
  "bestbuy.com": {
    "password-rules": "minlength: 20; required: lower; required: upper; required: digit; required: special;"
  },
  "bhphotovideo.com": {
    "password-rules": "maxlength: 15;"
  },
  "bilibili.com": {
    "password-rules": "maxlength: 16;"
  },
  "billerweb.com": {
    "password-rules": "minlength: 8; max-consecutive: 2; required: digit; required: upper,lower;"
  },
  "biovea.com": {
    "password-rules": "maxlength: 19;"
  },
  "bitly.com": {
    "password-rules": "minlength: 6; required: lower; required: upper; required: digit; required: [`!@#$%^&*()+~{}'\";:<>?]];"
  },
  "bloomingdales.com": {
    "password-rules": "minlength: 7; maxlength: 16; required: lower, upper; required: digit; required: [`!@#$%^&*()+~{}'\";:<>?]];"
  },
  "bluesguitarunleashed.com": {
    "password-rules": "allowed: lower, upper, digit, [!$#@];"
  },
  "bochk.com": {
    "password-rules": "minlength: 8; maxlength: 12; max-consecutive: 3; required: lower; required: upper; required: digit; allowed: [#$%&()*+,.:;<=>?@_];"
  },
  "box.com": {
    "password-rules": "minlength: 6; maxlength: 20; required: lower; required: upper; required: digit; required: digit;"
  },
  "brighthorizons.com": {
    "password-rules": "minlength: 8; maxlength: 16;"
  },
  "callofduty.com": {
    "password-rules": "minlength: 8; maxlength: 20; max-consecutive: 2; required: lower, upper; required: digit;"
  },
  "capitalone.com": {
    "password-rules": "minlength: 8; maxlength: 32; required: lower, upper; required: digit; allowed: [-_./\\@$*&!#];"
  },
  "cardbenefitservices.com": {
    "password-rules": "minlength: 7; maxlength: 100; required: lower, upper; required: digit;"
  },
  "carrefour.it": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [!#$%&*?@_];"
  },
  "cb2.com": {
    "password-rules": "minlength: 7; maxlength: 18; required: lower, upper; required: digit;"
  },
  "ccs-grp.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: digit; required: upper,lower; allowed: [-!#$%&'+./=?\\^_`{|}~];"
  },
  "cecredentialtrust.com": {
    "password-rules": "minlength: 12; required: lower; required: upper; required: digit; required: [!#$%&*@^];"
  },
  "chase.com": {
    "password-rules": "minlength: 8; maxlength: 32; max-consecutive: 2; required: lower, upper; required: digit; required: [!#$%+/=@~];"
  },
  "cigna.co.uk": {
    "password-rules": "minlength: 8; maxlength: 12; required: lower; required: upper; required: digit;"
  },
  "citi.com": {
    "password-rules": "minlength: 8; maxlength: 64; max-consecutive: 2; required: digit; required: upper; required: lower; required: [-~`!@#$%^&*()_\\/|];"
  },
  "claimlookup.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; required: [@#$%^&+=!];"
  },
  "claro.com.br": {
    "password-rules": "minlength: 8; required: lower; allowed: upper, digit, [-!@#$%&*_+=<>];"
  },
  "clien.net": {
    "password-rules": "minlength: 5; required: lower, upper; required: digit;"
  },
  "collectivehealth.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit;"
  },
  "comcastpaymentcenter.com": {
    "password-rules": "minlength: 8; maxlength: 20; max-consecutive: 2;required: lower, upper; required: digit;"
  },
  "comed.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; allowed: [-~!@#$%^&*_+=`|(){}[:;\"'<>,.?/\\]];"
  },
  "commerzbank.de": {
    "password-rules": "minlength: 5; maxlength: 8; required: lower, upper; required: digit;"
  },
  "consorsbank.de": {
    "password-rules": "minlength: 5; maxlength: 5; required: lower, upper, digit;"
  },
  "consorsfinanz.de": {
    "password-rules": "minlength: 6; maxlength: 15; allowed: lower, upper, digit, [-.];"
  },
  "costco.com": {
    "password-rules": "minlength: 8; maxlength: 20; required: lower, upper; allowed: digit, [-!#$%&'()*+/:;=?@[^_`{|}~]];"
  },
  "coursera.com": {
    "password-rules": "minlength: 8; maxlength: 72;"
  },
  "cox.com": {
    "password-rules": "minlength: 8; maxlength: 24; required: digit; required: upper,lower; allowed: [!#$%()*@^];"
  },
  "crateandbarrel.com": {
    "password-rules": "minlength: 9; maxlength: 64; required: lower; required: upper; required: digit; required: [!\"#$%&()*,.:<>?@^_{|}];"
  },
  "cvs.com": {
    "password-rules": "minlength: 8; maxlength: 25; required: lower, upper; required: digit; allowed: [!@#$%^&*()];"
  },
  "dailymail.co.uk": {
    "password-rules": "minlength: 5; maxlength: 15;"
  },
  "dan.org": {
    "password-rules": "minlength: 8; maxlength: 25; required: lower; required: upper; required: digit; required: [!@$%^&*];"
  },
  "danawa.com": {
    "password-rules": "minlength: 8; maxlength: 21; required: lower, upper; required: digit; required: [!@$%^&*];"
  },
  "darty.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit;"
  },
  "dbs.com.hk": {
    "password-rules": "minlength: 8; maxlength: 30; required: lower; required: upper; required: digit;"
  },
  "decluttr.com": {
    "password-rules": "minlength: 8; maxlength: 45; required: lower; required: upper; required: digit;"
  },
  "delta.com": {
    "password-rules": "minlength: 8; maxlength: 20; required: lower; required: upper; required: digit;"
  },
  "deutsche-bank.de": {
    "password-rules": "minlength: 5; maxlength: 5; required: lower, upper, digit;"
  },
  "devstore.cn": {
    "password-rules": "minlength: 6; maxlength: 12;"
  },
  "dickssportinggoods.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [!#$%&*?@^];"
  },
  "dkb.de": {
    "password-rules": "minlength: 8; maxlength: 38; required: lower, upper; required: digit; allowed: [-äüöÄÜÖß!$%&/()=?+#,.:];"
  },
  "dmm.com": {
    "password-rules": "minlength: 4; maxlength: 16; required: lower; required: upper; required: digit;"
  },
  "dowjones.com": {
    "password-rules": "maxlength: 15;"
  },
  "ea.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; allowed: special;"
  },
  "easycoop.com": {
    "password-rules": "minlength: 8; required: upper; required: special; allowed: lower, digit;"
  },
  "easyjet.com": {
    "password-rules": "minlength: 6; maxlength: 20; required: lower; required: upper; required: digit; required: [-];"
  },
  "ebrap.org": {
    "password-rules": "minlength: 15; required: lower; required: lower; required: upper; required: upper; required: digit; required: digit; required: [-!@#$%^&*()_+|~=`{}[:\";'?,./.]]; required: [-!@#$%^&*()_+|~=`{}[:\";'?,./.]];"
  },
  "ecompanystore.com": {
    "password-rules": "minlength: 8; maxlength: 16; max-consecutive: 2; required: lower; required: upper; required: digit; required: [#$%*+.=@^_];"
  },
  "eddservices.edd.ca.gov": {
    "password-rules": "minlength: 8; maxlength: 12; required: lower; required: upper; required: digit; required: [!@#$%^&*()];"
  },
  "empower-retirement.com": {
    "password-rules": "minlength: 8; maxlength: 16;"
  },
  "epicgames.com": {
    "password-rules": "minlength: 7; required: lower; required: upper; required: digit; required: [-!\"#$%&'()*+,./:;<=>?@[^_`{|}~]];"
  },
  "epicmix.com": {
    "password-rules": "minlength: 8; maxlength: 16;"
  },
  "equifax.com": {
    "password-rules": "minlength: 8; maxlength: 20; required: lower; required: upper; required: digit; required: [!$*+@];"
  },
  "essportal.excelityglobal.com": {
    "password-rules": "minlength: 6; maxlength: 8; allowed: lower, upper, digit;"
  },
  "ettoday.net": {
    "password-rules": "minlength: 6; maxlength: 12;"
  },
  "examservice.com.tw": {
    "password-rules": "minlength: 6; maxlength: 8;"
  },
  "expertflyer.com": {
    "password-rules": "minlength: 5; maxlength: 16; required: lower, upper; required: digit;"
  },
  "extraspace.com": {
    "password-rules": "minlength: 8; maxlength: 20; allowed: lower; required: upper, digit, [!#$%&*?@];"
  },
  "ezpassva.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; required: special;"
  },
  "fc2.com": {
    "password-rules": "minlength: 8; maxlength: 16;"
  },
  "fedex.com": {
    "password-rules": "minlength: 8; max-consecutive: 3; required: lower; required: upper; required: digit; allowed: [-!@#$%^&*_+=`|(){}[:;,.?]];"
  },
  "fidelity.com": {
    "password-rules": "minlength: 6; maxlength: 20; required: lower; allowed: upper,digit,[!$%'()+,./:;=?@^_|~];"
  },
  "flysas.com": {
    "password-rules": "minlength: 8; maxlength: 14; required: lower; required: upper; required: digit; required: [-~!@#$%^&_+=`|(){}[:\"'<>,.?]];"
  },
  "fnac.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit;"
  },
  "fuelrewards.com": {
    "password-rules": "minlength: 8; maxlength: 16; allowed: upper,lower,digit,[!#$%@];"
  },
  "gamestop.com": {
    "password-rules": "minlength: 8; maxlength: 225; required: lower; required: upper; required: digit; required: [!@#$%];"
  },
  "getflywheel.com": {
    "password-rules": "minlength: 7; maxlength: 72;"
  },
  "girlscouts.org": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; allowed: [$#!];"
  },
  "gmx.net": {
    "password-rules": "minlength: 8; maxlength: 40; allowed: lower, upper, digit, [-<=>~!|()@#{}$%,.?^'&*_+`:;\"[]];"
  },
  "google.com": {
    "password-rules": "minlength: 8; allowed: lower, upper, digit, [-!\"#$%&'()*+,./:;<=>?@[^_{|}~]];"
  },
  "guardiananytime.com": {
    "password-rules": "minlength: 8; maxlength: 50; max-consecutive: 2; required: lower; required: upper; required: digit, [-~!@#$%^&*_+=`|(){}[:;,.?]];"
  },
  "gwl.greatwestlife.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [-!#$%_=+<>];"
  },
  "hangseng.com": {
    "password-rules": "minlength: 8; maxlength: 30; required: lower; required: upper; required: digit;"
  },
  "hawaiianairlines.com": {
    "password-rules": "maxlength: 16;"
  },
  "hertz.com": {
    "password-rules": "minlength: 8; maxlength: 30; max-consecutive: 3; required: lower; required: upper; required: digit; required: [#$%^&!@];"
  },
  "hetzner.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit, special;"
  },
  "hilton.com": {
    "password-rules": "minlength: 8; maxlength: 32; required: lower; required: upper; required: digit;"
  },
  "hkbea.com": {
    "password-rules": "minlength: 8; maxlength: 12; required: lower; required: upper; required: digit;"
  },
  "hkexpress.com": {
    "password-rules": "minlength: 8; maxlength: 15; required: lower; required: upper; required: digit; required: special;"
  },
  "hotels.com": {
    "password-rules": "minlength: 6; maxlength: 20; required: digit; allowed: lower, upper, [@$!#()&^*%];"
  },
  "hotwire.com": {
    "password-rules": "minlength: 6; maxlength: 30; allowed: lower, upper, digit, [-~!@#$%^&*_+=`|(){}[:;\"'<>,.?]];"
  },
  "hrblock.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [$#%!];"
  },
  "hsbc.com.hk": {
    "password-rules": "minlength: 6; maxlength: 30; required: lower; required: upper; required: digit; allowed: ['.@_];"
  },
  "hsbc.com.my": {
    "password-rules": "minlength: 8; maxlength: 30; required: lower, upper; required: digit; allowed: [-!$*.=?@_'];"
  },
  "hypovereinsbank.de": {
    "password-rules": "minlength: 6; maxlength: 10; required: lower, upper, digit; allowed: [!\"#$%&()*+:;<=>?@[{}~]];"
  },
  "hyresbostader.se": {
    "password-rules": "minlength: 6; maxlength: 20; required: lower, upper; required: digit;"
  },
  "id.sonyentertainmentnetwork.com": {
    "password-rules": "minlength: 8; maxlength: 30; required: lower, upper; required: digit; allowed: [-!@#^&*=+;:];"
  },
  "identitytheft.gov": {
    "password-rules": "allowed: lower, upper, digit, [!#%&*@^];"
  },
  "idestination.info": {
    "password-rules": "maxlength: 15;"
  },
  "impots.gouv.fr": {
    "password-rules": "minlength: 12; maxlength: 128; required: lower; required: digit; allowed: [-!#$%&*+/=?^_'.{|}];"
  },
  "indochino.com": {
    "password-rules": "minlength: 6; maxlength: 15; required: upper; required: digit; allowed: lower, special;"
  },
  "internationalsos.com": {
    "password-rules": "required: lower; required: upper; required: digit; required: [@#$%^&+=_];"
  },
  "irctc.co.in": {
    "password-rules": "minlength: 8; maxlength: 15; required: lower; required: upper; required: digit; required: [!@#$%^&*()+];"
  },
  "irs.gov": {
    "password-rules": "minlength: 8; maxlength: 32; required: lower; required: upper; required: digit; required: [!#$%&*@];"
  },
  "jal.co.jp": {
    "password-rules": "minlength: 8; maxlength: 16;"
  },
  "japanpost.jp": {
    "password-rules": "minlength: 8; maxlength: 16; required: digit; required: upper,lower;"
  },
  "jordancu-onlinebanking.org": {
    "password-rules": "minlength: 6; maxlength: 32; allowed: upper, lower, digit,[-!\"#$%&'()*+,.:;<=>?@[^_`{|}~]];"
  },
  "keldoc.com": {
    "password-rules": "minlength: 12; required: lower; required: upper; required: digit; required: [!@#$%^&*];"
  },
  "key.harvard.edu": {
    "password-rules": "minlength: 10; maxlength: 100; required: lower; required: upper; required: digit; allowed: [-@_#!&$`%*+()./,;~:{}|?>=<^[']];"
  },
  "kfc.ca": {
    "password-rules": "minlength: 6; maxlength: 15; required: lower; required: upper; required: digit; required: [!@#$%&?*];"
  },
  "klm.com": {
    "password-rules": "minlength: 8; maxlength: 12;"
  },
  "la-z-boy.com": {
    "password-rules": "minlength: 6; maxlength: 15; required: lower, upper; required: digit;"
  },
  "labcorp.com": {
    "password-rules": "minlength: 8; maxlength: 20; required: upper; required: lower; required: digit; required: [!@#$%^&*];"
  },
  "ladwp.com": {
    "password-rules": "minlength: 8; maxlength: 20; required: digit; allowed: lower, upper;"
  },
  "launtel.net.au": {
    "password-rules": "minlength: 8; required: digit; required: digit; allowed: lower, upper;"
  },
  "leetchi.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [!#$%&()*+,./:;<>?@\"_];"
  },
  "lepida.it": {
    "password-rules": "minlength: 8; maxlength: 16; max-consecutive: 2; required: lower; required: upper; required: digit; required: [-!\"#$%&'()*+,.:;<=>?@[^_`{|}~]];"
  },
  "lg.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; allowed: [-!#$%&'()*+,.:;=?@[^_{|}~]];"
  },
  "live.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; allowed: [-@_#!&$`%*+()./,;~:{}|?>=<^'[]];"
  },
  "lloydsbank.co.uk": {
    "password-rules": "minlength: 8; maxlength: 15; required: lower; required: digit; allowed: upper;"
  },
  "lowes.com": {
    "password-rules": "minlength: 8; maxlength: 12; required: lower, upper; required: digit;"
  },
  "loyalty.accor.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [!#$%&=@];"
  },
  "lsacsso.b2clogin.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit, [-!#$%&*?@^_];"
  },
  "lufthansa.com": {
    "password-rules": "minlength: 8; maxlength: 32; required: lower; required: upper; required: digit; required: [!#$%&()*+,./:;<>?@\"_];"
  },
  "macys.com": {
    "password-rules": "minlength: 7; maxlength: 16; allowed: lower, upper, digit, [~!@#$%^&*+`(){}[:;\"'<>?]];"
  },
  "mailbox.org": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; allowed: [-!$\"%&/()=*+#.,;:@?{}[]];"
  },
  "makemytrip.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [@$!%*#?&];"
  },
  "marriott.com": {
    "password-rules": "minlength: 8; maxlength: 20; required: lower; required: upper; required: digit; allowed: [$!#&@?%=];"
  },
  "maybank2u.com.my": {
    "password-rules": "minlength: 8; maxlength: 12; max-consecutive: 2; required: lower; required: upper; required: digit; required: [-~!@#$%^&*_+=`|(){}[:;\"'<>,.?];"
  },
  "medicare.gov": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; required: [@!$%^*()];"
  },
  "metlife.com": {
    "password-rules": "minlength: 6; maxlength: 20;"
  },
  "microsoft.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: special;"
  },
  "minecraft.com": {
    "password-rules": "minlength: 8; required: lower, upper; required: digit; allowed: ascii-printable;"
  },
  "mintmobile.com": {
    "password-rules": "minlength: 8; maxlength: 20; required: lower; required: upper; required: digit; required: special; allowed: [!#$%&()*+:;=@[^_`{}~]];"
  },
  "mlb.com": {
    "password-rules": "minlength: 8; maxlength: 15; required: lower; required: upper; required: digit; allowed: [!\"#$%&'()*+,./:;<=>?[\\^_`{|}~]];"
  },
  "mpv.tickets.com": {
    "password-rules": "minlength: 8; maxlength: 15; required: lower; required: upper; required: digit;"
  },
  "museumofflight.org": {
    "password-rules": "minlength: 8; maxlength: 15;"
  },
  "my.konami.net": {
    "password-rules": "minlength: 8; maxlength: 32; required: lower; required: upper; required: digit;"
  },
  "myaccess.dmdc.osd.mil": {
    "password-rules": "minlength: 9; maxlength: 20; required: lower; required: upper; required: digit; allowed: [-@_#!&$`%*+()./,;~:{}|?>=<^'[]];"
  },
  "mygoodtogo.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower, upper, digit;"
  },
  "myhealthrecord.com": {
    "password-rules": "minlength: 8; maxlength: 20; allowed: lower, upper, digit, [_.!$*=];"
  },
  "mysubaru.com": {
    "password-rules": "minlength: 8; maxlength: 15; required: lower; required: upper; required: digit; allowed: [!#$%()*+,./:;=?@\\^`~];"
  },
  "naver.com": {
    "password-rules": "minlength: 6; maxlength: 16;"
  },
  "nelnet.net": {
    "password-rules": "minlength: 8; maxlength: 15; required: lower; required: upper; required: digit, [!@#$&*];"
  },
  "netflix.com": {
    "password-rules": "minlength: 4; maxlength: 60; required: lower, upper, digit; allowed: special;"
  },
  "netgear.com": {
    "password-rules": "minlength: 6; maxlength: 128; allowed: lower, upper, digit, [!@#$%^&*()];"
  },
  "nowinstock.net": {
    "password-rules": "minlength: 6; maxlength: 20; allowed: lower, upper, digit;"
  },
  "order.wendys.com": {
    "password-rules": "minlength: 6; maxlength: 20; required: lower; required: upper; required: digit; allowed: [!#$%&()*+/=?^_{}];"
  },
  "ototoy.jp": {
    "password-rules": "minlength: 8; allowed: upper,lower,digit,[- .=_];"
  },
  "packageconciergeadmin.com": {
    "password-rules": "minlength: 4; maxlength: 4; allowed: digit;"
  },
  "paypal.com": {
    "password-rules": "minlength: 8; maxlength: 20; max-consecutive: 3; required: lower, upper; required: digit, [!@#$%^&*()];"
  },
  "payvgm.youraccountadvantage.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: special;"
  },
  "pilotflyingj.com": {
    "password-rules": "minlength: 7; required: digit; allowed: lower, upper;"
  },
  "pixnet.cc": {
    "password-rules": "minlength: 4; maxlength: 16; allowed: lower, upper;"
  },
  "planetary.org": {
    "password-rules": "minlength: 5; maxlength: 20; required: lower; required: upper; required: digit; allowed: ascii-printable;"
  },
  "plazapremiumlounge.com": {
    "password-rules": "minlength: 8; maxlength: 15; required: lower; required: upper; required: digit; allowed: [!#$%&*,@^];"
  },
  "portal.edd.ca.gov": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [!#$%&()*@^];"
  },
  "portals.emblemhealth.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [!#$%&'()*+,./:;<>?@\\^_`{|}~[]];"
  },
  "portlandgeneral.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; allowed: [!#$%&*?@];"
  },
  "poste.it": {
    "password-rules": "minlength: 8; maxlength: 16; max-consecutive: 2; required: lower; required: upper; required: digit; required: special;"
  },
  "posteo.de": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit, [-~!#$%&_+=|(){}[:;\"’<>,.? ]];"
  },
  "powells.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; required: [\"!@#$%^&*(){}[]];"
  },
  "preferredhotels.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [!#$%&()*+@^_];"
  },
  "premier.ticketek.com.au": {
    "password-rules": "minlength: 6; maxlength: 16;"
  },
  "premierinn.com": {
    "password-rules": "minlength: 8; required: upper; required: digit; allowed: lower;"
  },
  "prepaid.bankofamerica.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; required: [!@#$%^&*()+~{}'\";:<>?];"
  },
  "prestocard.ca": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit,[!\"#$%&'()*+,<>?@];"
  },
  "propelfuels.com": {
    "password-rules": "minlength: 6; maxlength: 16;"
  },
  "qdosstatusreview.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [!#$%&@^];"
  },
  "questdiagnostics.com": {
    "password-rules": "minlength: 8; maxlength: 30; required: upper, lower; required: digit, [!#$%&()*+<>?@^_~];"
  },
  "rejsekort.dk": {
    "password-rules": "minlength: 7; maxlength: 15; required: lower; required: upper; required: digit;"
  },
  "renaud-bray.com": {
    "password-rules": "minlength: 8; maxlength: 38; allowed: upper,lower,digit;"
  },
  "ring.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [!@#$%^&*<>?];"
  },
  "riteaid.com": {
    "password-rules": "minlength: 8; maxlength: 15; required: lower; required: upper; required: digit;"
  },
  "robinhood.com": {
    "password-rules": "minlength: 10;"
  },
  "rogers.com": {
    "password-rules": "minlength: 8; required: lower, upper; required: digit; required: [!@#$];"
  },
  "ruc.dk": {
    "password-rules": "minlength: 6; maxlength: 8; required: lower, upper; required: [-!#%&(){}*+;%/<=>?_];"
  },
  "runescape.com": {
    "password-rules": "minlength: 5; maxlength: 20; required: lower; required: upper; required: digit;"
  },
  "ruten.com.tw": {
    "password-rules": "minlength: 6; maxlength: 15; required: lower, upper;"
  },
  "salslimo.com": {
    "password-rules": "minlength: 8; maxlength: 50; required: upper; required: lower; required: digit; required: [!@#$&*];"
  },
  "santahelenasaude.com.br": {
    "password-rules": "minlength: 8; maxlength: 15; required: lower; required: upper; required: digit; required: [-!@#$%&*_+=<>];"
  },
  "santander.de": {
    "password-rules": "minlength: 8; maxlength: 12; required: lower, upper; required: digit; allowed: [-!#$%&'()*,.:;=?^{}];"
  },
  "sbisec.co.jp": {
    "password-rules": "minlength: 10; maxlength: 20; allowed: upper,lower,digit;"
  },
  "secure-arborfcu.org": {
    "password-rules": "minlength: 8; maxlength: 15; required: lower; required: upper; required: digit; required: [!#$%&'()+,.:?@[_`~]];"
  },
  "secure.orclinic.com": {
    "password-rules": "minlength: 6; maxlength: 15; required: lower; required: digit; allowed: ascii-printable;"
  },
  "secure.snnow.ca": {
    "password-rules": "minlength: 7; maxlength: 16; required: digit; allowed: lower, upper;"
  },
  "secure.wa.aaa.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; allowed: ascii-printable;"
  },
  "sephora.com": {
    "password-rules": "minlength: 6; maxlength: 12;"
  },
  "serviziconsolari.esteri.it": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; required: special;"
  },
  "servizioelettriconazionale.it": {
    "password-rules": "minlength: 8; maxlength: 20; required: lower; required: upper; required: digit; required: [!#$%&*?@^_~];"
  },
  "sfwater.org": {
    "password-rules": "minlength: 10; maxlength: 30; required: digit; allowed: lower, upper, [!@#$%*()_+^}{:;?.];"
  },
  "signin.ea.com": {
    "password-rules": "minlength: 8; maxlength: 64; required: lower, upper; required: digit; allowed: [-!@#^&*=+;:];"
  },
  "southwest.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: upper; required: digit; allowed: lower, [!@#$%^*(),.;:/\\];"
  },
  "speedway.com": {
    "password-rules": "minlength: 4; maxlength: 8; required: digit;"
  },
  "spirit.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; required: [!@#$%^&*()];"
  },
  "splunk.com": {
    "password-rules": "minlength: 8; maxlength: 64; required: lower; required: upper; required: digit; required: [-!@#$%&*_+=<>];"
  },
  "ssa.gov": {
    "password-rules": "required: lower; required: upper; required: digit; required: [~!@#$%^&*];"
  },
  "store.nintendo.co.uk": {
    "password-rules": "minlength: 8; maxlength: 20;"
  },
  "store.nvidia.com": {
    "password-rules": "minlength: 8; maxlength: 32; required: lower; required: upper; required: digit; required: [-!@#$%^*~:;&><[{}|_+=?]];"
  },
  "store.steampowered.com": {
    "password-rules": "minlength: 6; required: lower; required: upper; required: digit; allowed: [~!@#$%^&*];"
  },
  "successfactors.eu": {
    "password-rules": "minlength: 8; maxlength: 18; required: lower; required: upper; required: digit,[-!\"#$%&'()*+,.:;<=>?@[^_`{|}~]];"
  },
  "sulamericaseguros.com.br": {
    "password-rules": "minlength: 6; maxlength: 6;"
  },
  "sunlife.com": {
    "password-rules": "minlength: 8; maxlength: 10; required: digit; required: lower, upper;"
  },
  "t-mobile.net": {
    "password-rules": "minlength: 8; maxlength: 16;"
  },
  "target.com": {
    "password-rules": "minlength: 8; maxlength: 20; required: lower, upper; required: digit, [-!\"#$%&'()*+,./:;=?@[\\^_`{|}~];"
  },
  "telekom-dienste.de": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; required: [#$%&()*+,./<=>?@_{|}~];"
  },
  "thameswater.co.uk": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; required: special;"
  },
  "tix.soundrink.com": {
    "password-rules": "minlength: 6; maxlength: 16;"
  },
  "training.confluent.io": {
    "password-rules": "minlength: 6; maxlength: 16; required: lower; required: upper; required: digit; allowed: [!#$%*@^_~];"
  },
  "twitch.tv": {
    "password-rules": "minlength: 8; maxlength: 71;"
  },
  "twitter.com": {
    "password-rules": "minlength: 8;"
  },
  "ubisoft.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower; required: upper; required: digit; required: [-]; required: [!@#$%^&*()+];"
  },
  "udel.edu": {
    "password-rules": "minlength: 12; maxlength: 30; required: lower; required: upper; required: digit; required: [!@#$%^&*()+];"
  },
  "user.ornl.gov": {
    "password-rules": "minlength: 8; maxlength: 30; max-consecutive: 3; required: lower, upper; required: digit; allowed: [!#$%./_];"
  },
  "usps.com": {
    "password-rules": "minlength: 8; maxlength: 50; max-consecutive: 2; required: lower; required: upper; required: digit; allowed: [-!\"#&'()+,./?@];"
  },
  "vanguard.com": {
    "password-rules": "minlength: 6; maxlength: 20; required: lower; required: upper; required: digit; required: digit;"
  },
  "vanguardinvestor.co.uk": {
    "password-rules": "minlength: 8; maxlength: 50; required: lower; required: upper; required: digit; required: digit;"
  },
  "ventrachicago.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit, [!@#$%^];"
  },
  "verizonwireless.com": {
    "password-rules": "minlength: 8; maxlength: 20; required: lower, upper; required: digit; allowed: unicode;"
  },
  "vetsfirstchoice.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; allowed: [?!@$%^+=&];"
  },
  "virginmobile.ca": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [!#$@];"
  },
  "visa.com": {
    "password-rules": "minlength: 6; maxlength: 32;"
  },
  "visabenefits-auth.axa-assistance.us": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [!\"#$%&()*,.:<>?@^{|}];"
  },
  "vivo.com.br": {
    "password-rules": "maxlength: 6; max-consecutive: 3; allowed: digit;"
  },
  "walkhighlands.co.uk": {
    "password-rules": "minlength: 9; maxlength: 15; required: lower; required: upper; required: digit; allowed: special;"
  },
  "walmart.com": {
    "password-rules": "allowed: lower, upper, digit, [-(~!@#$%^&*_+=`|(){}[:;\"'<>,.?]];"
  },
  "waze.com": {
    "password-rules": "minlength: 8; maxlength: 64; required: lower, upper, digit;"
  },
  "wccls.org": {
    "password-rules": "minlength: 4; maxlength: 16; allowed: lower, upper, digit;"
  },
  "web.de": {
    "password-rules": "minlength: 8; maxlength: 40; allowed: lower, upper, digit, [-<=>~!|()@#{}$%,.?^'&*_+`:;\"[]];"
  },
  "wegmans.com": {
    "password-rules": "minlength: 8; required: digit; required: upper,lower; required: [!#$%&*+=?@^];"
  },
  "weibo.com": {
    "password-rules": "minlength: 6; maxlength: 16;"
  },
  "wellsfargo.com": {
    "password-rules": "minlength: 8; maxlength: 32; required: lower; required: upper; required: digit;"
  },
  "wsj.com": {
    "password-rules": "minlength: 5; maxlength: 15; required: digit; allowed: lower, upper, [-~!@#$^*_=`|(){}[:;\"'<>,.?]];"
  },
  "xfinity.com": {
    "password-rules": "minlength: 8; maxlength: 16; required: lower, upper; required: digit;"
  },
  "xvoucher.com": {
    "password-rules": "minlength: 11; required: upper; required: digit; required: [!@#$%&_];"
  },
  "yatra.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit; required: [!#$%&'()+,.:?@[_`~]];"
  },
  "zara.com": {
    "password-rules": "minlength: 8; required: lower; required: upper; required: digit;"
  },
  "zdf.de": {
    "password-rules": "minlength: 8; required: upper; required: digit; allowed: lower, special;"
  },
  "zoom.us": {
    "password-rules": "minlength: 8; maxlength: 32; max-consecutive: 6; required: lower; required: upper; required: digit;"
  }
}
},{}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDevice = createDevice;

var _config = require("./config.js");

var _AndroidInterface = require("./DeviceInterface/AndroidInterface.js");

var _ExtensionInterface = require("./DeviceInterface/ExtensionInterface.js");

var _AppleDeviceInterface = require("./DeviceInterface/AppleDeviceInterface.js");

var _AppleOverlayDeviceInterface = require("./DeviceInterface/AppleOverlayDeviceInterface.js");

var _transports = require("./deviceApiCalls/transports/transports.js");

var _index = require("../packages/device-api/index.js");

var _Settings = require("./Settings.js");

var _WindowsInterface = require("./DeviceInterface/WindowsInterface.js");

var _WindowsOverlayDeviceInterface = require("./DeviceInterface/WindowsOverlayDeviceInterface.js");

function createDevice() {
  const globalConfig = (0, _config.createGlobalConfig)();
  const transport = (0, _transports.createTransport)(globalConfig);
  /**
   * A wrapper around transports to assist in debugging/integrations
   * @type {import("../packages/device-api").DeviceApiTransport}
   */

  const loggingTransport = {
    async send(deviceApiCall) {
      console.log('[->outgoing]', 'id:', deviceApiCall.method, deviceApiCall.params || null);
      const result = await transport.send(deviceApiCall);
      console.log('[<-incoming]', 'id:', deviceApiCall.method, result || null);
      return result;
    }

  }; // Create the DeviceAPI + Setting

  let deviceApi = new _index.DeviceApi(globalConfig.isDDGTestMode ? loggingTransport : transport);
  const settings = new _Settings.Settings(globalConfig, deviceApi);

  if (globalConfig.isWindows) {
    if (globalConfig.isTopFrame) {
      return new _WindowsOverlayDeviceInterface.WindowsOverlayDeviceInterface(globalConfig, deviceApi, settings);
    }

    return new _WindowsInterface.WindowsInterface(globalConfig, deviceApi, settings);
  }

  if (globalConfig.isDDGApp) {
    if (globalConfig.isAndroid) {
      return new _AndroidInterface.AndroidInterface(globalConfig, deviceApi, settings);
    }

    if (globalConfig.isTopFrame) {
      return new _AppleOverlayDeviceInterface.AppleOverlayDeviceInterface(globalConfig, deviceApi, settings);
    }

    return new _AppleDeviceInterface.AppleDeviceInterface(globalConfig, deviceApi, settings);
  }

  return new _ExtensionInterface.ExtensionInterface(globalConfig, deviceApi, settings);
}

},{"../packages/device-api/index.js":14,"./DeviceInterface/AndroidInterface.js":23,"./DeviceInterface/AppleDeviceInterface.js":24,"./DeviceInterface/AppleOverlayDeviceInterface.js":25,"./DeviceInterface/ExtensionInterface.js":26,"./DeviceInterface/WindowsInterface.js":28,"./DeviceInterface/WindowsOverlayDeviceInterface.js":29,"./Settings.js":49,"./config.js":61,"./deviceApiCalls/transports/transports.js":69}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AndroidInterface = void 0;

var _InterfacePrototype = _interopRequireDefault(require("./InterfacePrototype.js"));

var _autofillUtils = require("../autofill-utils.js");

var _NativeUIController = require("../UI/controllers/NativeUIController.js");

var _appleUtils = require("@duckduckgo/content-scope-scripts/src/apple-utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class AndroidInterface extends _InterfacePrototype.default {
  async isEnabled() {
    return (0, _autofillUtils.autofillEnabled)(this.globalConfig, _appleUtils.processConfig);
  }

  async getAlias() {
    const {
      alias
    } = await (0, _autofillUtils.sendAndWaitForAnswer)(() => {
      return window.EmailInterface.showTooltip();
    }, 'getAliasResponse');
    return alias;
  }
  /**
   * @override
   */


  createUIController() {
    return new _NativeUIController.NativeUIController();
  }
  /**
   * @deprecated use `this.settings.availableInputTypes.email` in the future
   * @returns {boolean}
   */


  isDeviceSignedIn() {
    var _this$globalConfig$av;

    // on DDG domains, always check via `window.EmailInterface.isSignedIn()`
    if (this.globalConfig.isDDGDomain) {
      return window.EmailInterface.isSignedIn() === 'true';
    } // on non-DDG domains, where `availableInputTypes.email` is present, use it


    if (typeof ((_this$globalConfig$av = this.globalConfig.availableInputTypes) === null || _this$globalConfig$av === void 0 ? void 0 : _this$globalConfig$av.email) === 'boolean') {
      return this.globalConfig.availableInputTypes.email;
    } // ...on other domains we assume true because the script wouldn't exist otherwise


    return true;
  }

  async setupAutofill() {}

  postInit() {
    const cleanup = this.scanner.init();
    this.addLogoutListener(cleanup);
  }
  /**
   * Used by the email web app
   * Settings page displays data of the logged in user data
   */


  getUserData() {
    let userData = null;

    try {
      userData = JSON.parse(window.EmailInterface.getUserData());
    } catch (e) {
      if (this.globalConfig.isDDGTestMode) {
        console.error(e);
      }
    }

    return Promise.resolve(userData);
  }
  /**
   * Used by the email web app
   * Device capabilities determine which functionality is available to the user
   */


  getEmailProtectionCapabilities() {
    let deviceCapabilities = null;

    try {
      deviceCapabilities = JSON.parse(window.EmailInterface.getDeviceCapabilities());
    } catch (e) {
      if (this.globalConfig.isDDGTestMode) {
        console.error(e);
      }
    }

    return Promise.resolve(deviceCapabilities);
  }

  storeUserData(_ref) {
    let {
      addUserData: {
        token,
        userName,
        cohort
      }
    } = _ref;
    return window.EmailInterface.storeCredentials(token, userName, cohort);
  }
  /**
    * Used by the email web app
    * Provides functionality to log the user out
    */


  removeUserData() {
    try {
      return window.EmailInterface.removeCredentials();
    } catch (e) {
      if (this.globalConfig.isDDGTestMode) {
        console.error(e);
      }
    }
  }

  addLogoutListener(handler) {
    // Only deal with logging out if we're in the email web app
    if (!this.globalConfig.isDDGDomain) return;
    window.addEventListener('message', e => {
      if (this.globalConfig.isDDGDomain && e.data.emailProtectionSignedOut) {
        handler();
      }
    });
  }

}

exports.AndroidInterface = AndroidInterface;

},{"../UI/controllers/NativeUIController.js":54,"../autofill-utils.js":59,"./InterfacePrototype.js":27,"@duckduckgo/content-scope-scripts/src/apple-utils":1}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AppleDeviceInterface = void 0;

var _InterfacePrototype = _interopRequireDefault(require("./InterfacePrototype.js"));

var _autofillUtils = require("../autofill-utils.js");

var _appleUtils = require("@duckduckgo/content-scope-scripts/src/apple-utils");

var _HTMLTooltip = require("../UI/HTMLTooltip.js");

var _HTMLTooltipUIController = require("../UI/controllers/HTMLTooltipUIController.js");

var _OverlayUIController = require("../UI/controllers/OverlayUIController.js");

var _index = require("../../packages/device-api/index.js");

var _additionalDeviceApiCalls = require("../deviceApiCalls/additionalDeviceApiCalls.js");

var _NativeUIController = require("../UI/controllers/NativeUIController.js");

var _deviceApiCalls = require("../deviceApiCalls/__generated__/deviceApiCalls.js");

var _matching = require("../Form/matching.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @typedef {import('../deviceApiCalls/__generated__/validators-ts').GetAutofillDataRequest} GetAutofillDataRequest
 */
class AppleDeviceInterface extends _InterfacePrototype.default {
  constructor() {
    super(...arguments);

    _defineProperty(this, "initialSetupDelayMs", 300);

    _defineProperty(this, "pollingTimeout", null);
  }

  async isEnabled() {
    return (0, _autofillUtils.autofillEnabled)(this.globalConfig, _appleUtils.processConfig);
  }
  /**
   * The default functionality of this class is to operate as an 'overlay controller' -
   * which means it's purpose is to message the native layer about when to open/close the overlay.
   *
   * There is an additional use-case though, when running on older macOS versions, we just display the
   * HTMLTooltip in-page (like the extension does). This is why the `!this.globalConfig.supportsTopFrame`
   * check exists below - if we know we don't support the overlay, we fall back to in-page.
   *
   * @override
   * @returns {import("../UI/controllers/UIController.js").UIController}
   */


  createUIController() {
    var _this$globalConfig$us, _this$globalConfig$us2;

    if (((_this$globalConfig$us = this.globalConfig.userPreferences) === null || _this$globalConfig$us === void 0 ? void 0 : (_this$globalConfig$us2 = _this$globalConfig$us.platform) === null || _this$globalConfig$us2 === void 0 ? void 0 : _this$globalConfig$us2.name) === 'ios') {
      return new _NativeUIController.NativeUIController();
    }

    if (!this.globalConfig.supportsTopFrame) {
      const options = { ..._HTMLTooltip.defaultOptions,
        testMode: this.isTestMode()
      };
      return new _HTMLTooltipUIController.HTMLTooltipUIController({
        device: this,
        tooltipKind: 'modern'
      }, options);
    }
    /**
     * If we get here, we're just a controller for an overlay
     */


    return new _OverlayUIController.OverlayUIController({
      remove: async () => this._closeAutofillParent(),
      show: async details => this._show(details)
    });
  }
  /**
   * For now, this could be running
   *  1) on iOS
   *  2) on macOS + Overlay
   *  3) on macOS + in-page HTMLTooltip
   *
   * @override
   * @returns {Promise<void>}
   */


  async setupAutofill() {
    if (!this.globalConfig.supportsTopFrame) {
      await this._getAutofillInitData();
    }

    const signedIn = await this._checkDeviceSignedIn();

    if (signedIn) {
      if (this.globalConfig.isApp) {
        await this.getAddresses();
      }
    }
  }

  async postInit() {
    if (this.isDeviceSignedIn()) {
      this.scanner.forms.forEach(form => form.redecorateAllInputs());
    }

    const cleanup = this.scanner.init();
    this.addLogoutListener(cleanup);
  }
  /**
   * Used by the email web app
   * Settings page displays data of the logged in user data
   */


  getUserData() {
    return this.deviceApi.request((0, _index.createRequest)('emailHandlerGetUserData'));
  }
  /**
   * Used by the email web app
   * Device capabilities determine which functionality is available to the user
   */


  getEmailProtectionCapabilities() {
    return this.deviceApi.request((0, _index.createRequest)('emailHandlerGetCapabilities'));
  }
  /**
   */


  async getSelectedCredentials() {
    return this.deviceApi.request((0, _index.createRequest)('getSelectedCredentials'));
  }
  /**
   * The data format provided here for `parentArgs` matches Window now.
   * @param {GetAutofillDataRequest} parentArgs
   */


  async _showAutofillParent(parentArgs) {
    const applePayload = { ...parentArgs.triggerContext,
      serializedInputContext: parentArgs.serializedInputContext
    };
    return this.deviceApi.notify((0, _index.createNotification)('showAutofillParent', applePayload));
  }
  /**
   * @returns {Promise<any>}
   */


  async _closeAutofillParent() {
    return this.deviceApi.notify((0, _index.createNotification)('closeAutofillParent', {}));
  }
  /**
   * @param {GetAutofillDataRequest} details
   */


  async _show(details) {
    await this._showAutofillParent(details);

    this._listenForSelectedCredential().then(response => {
      if (!response) {
        return;
      }

      this.selectedDetail(response.data, response.configType);
    }).catch(e => {
      console.error('unknown error', e);
    });
  }

  async getAddresses() {
    if (!this.globalConfig.isApp) return this.getAlias();
    const {
      addresses
    } = await this.deviceApi.request((0, _index.createRequest)('emailHandlerGetAddresses'));
    this.storeLocalAddresses(addresses);
    return addresses;
  }

  async refreshAlias() {
    await this.deviceApi.notify((0, _index.createNotification)('emailHandlerRefreshAlias')); // On macOS we also update the addresses stored locally

    if (this.globalConfig.isApp) this.getAddresses();
  }

  async _checkDeviceSignedIn() {
    const {
      isAppSignedIn
    } = await this.deviceApi.request((0, _index.createRequest)('emailHandlerCheckAppSignedInStatus'));

    this.isDeviceSignedIn = () => !!isAppSignedIn;

    return !!isAppSignedIn;
  }

  storeUserData(_ref) {
    let {
      addUserData: {
        token,
        userName,
        cohort
      }
    } = _ref;
    return this.deviceApi.notify((0, _index.createNotification)('emailHandlerStoreToken', {
      token,
      username: userName,
      cohort
    }));
  }
  /**
   * Used by the email web app
   * Provides functionality to log the user out
   */


  removeUserData() {
    this.deviceApi.notify((0, _index.createNotification)('emailHandlerRemoveToken'));
  }
  /**
   * PM endpoints
   */

  /**
   * Sends credentials to the native layer
   * @param {{username: string, password: string}} credentials
   */


  storeCredentials(credentials) {
    return this.deviceApi.notify((0, _index.createNotification)('pmHandlerStoreCredentials', credentials));
  }
  /**
   * Sends form data to the native layer
   * @deprecated should use the base implementation once available on Apple devices (instead of this override)
   * @param {DataStorageObject} data
   */


  storeFormData(data) {
    this.deviceApi.notify((0, _index.createNotification)('pmHandlerStoreData', data));
  }
  /**
   * Gets the init data from the device
   * @returns {APIResponse<PMData>}
   */


  async _getAutofillInitData() {
    const response = await this.deviceApi.request((0, _index.createRequest)('pmHandlerGetAutofillInitData'));
    this.storeLocalData(response.success);
    return response;
  }
  /**
   * Gets credentials ready for autofill
   * @param {CredentialsObject['id']} id - the credential id
   * @returns {APIResponseSingle<CredentialsObject>}
   */


  getAutofillCredentials(id) {
    return this.deviceApi.request((0, _index.createRequest)('pmHandlerGetAutofillCredentials', {
      id
    }));
  }
  /**
   * Opens the native UI for managing passwords
   */


  openManagePasswords() {
    return this.deviceApi.notify((0, _index.createNotification)('pmHandlerOpenManagePasswords'));
  }
  /**
   * Opens the native UI for managing identities
   */


  openManageIdentities() {
    return this.deviceApi.notify((0, _index.createNotification)('pmHandlerOpenManageIdentities'));
  }
  /**
   * Opens the native UI for managing credit cards
   */


  openManageCreditCards() {
    return this.deviceApi.notify((0, _index.createNotification)('pmHandlerOpenManageCreditCards'));
  }
  /**
   * Gets a single identity obj once the user requests it
   * @param {IdentityObject['id']} id
   * @returns {Promise<{success: IdentityObject|undefined}>}
   */


  getAutofillIdentity(id) {
    const identity = this.getLocalIdentities().find(_ref2 => {
      let {
        id: identityId
      } = _ref2;
      return "".concat(identityId) === "".concat(id);
    });
    return Promise.resolve({
      success: identity
    });
  }
  /**
   * Gets a single complete credit card obj once the user requests it
   * @param {CreditCardObject['id']} id
   * @returns {APIResponse<CreditCardObject>}
   */


  getAutofillCreditCard(id) {
    return this.deviceApi.request((0, _index.createRequest)('pmHandlerGetCreditCard', {
      id
    }));
  }

  getCurrentInputType() {
    var _this$activeForm;

    const topContextData = this.getTopContextData();
    return topContextData !== null && topContextData !== void 0 && topContextData.inputType ? topContextData.inputType : (0, _matching.getInputType)((_this$activeForm = this.activeForm) === null || _this$activeForm === void 0 ? void 0 : _this$activeForm.activeInput);
  }
  /**
   * @returns {Promise<string>}
   */


  async getAlias() {
    const {
      alias
    } = await this.deviceApi.request(new _additionalDeviceApiCalls.GetAlias({
      requiresUserPermission: !this.globalConfig.isApp,
      shouldConsumeAliasIfProvided: !this.globalConfig.isApp
    }));
    return (0, _autofillUtils.formatDuckAddress)(alias);
  }

  addLogoutListener(handler) {
    // Only deal with logging out if we're in the email web app
    if (!this.globalConfig.isDDGDomain) return;
    window.addEventListener('message', e => {
      if (this.globalConfig.isDDGDomain && e.data.emailProtectionSignedOut) {
        handler();
      }
    });
  }

  async addDeviceListeners() {
    if (this.settings.featureToggles.third_party_credentials_provider) {
      if (this.globalConfig.hasModernWebkitAPI) {
        Object.defineProperty(window, 'providerStatusUpdated', {
          enumerable: false,
          configurable: false,
          writable: false,
          value: data => {
            this.providerStatusUpdated(data);
          }
        });
      } else {
        // On Catalina we poll the native layer
        setTimeout(() => this._pollForUpdatesToCredentialsProvider(), 2000);
      }
    }
  } // Only used on Catalina


  async _pollForUpdatesToCredentialsProvider() {
    try {
      const response = await this.deviceApi.request(new _deviceApiCalls.CheckCredentialsProviderStatusCall(null));

      if (response.availableInputTypes.credentialsProviderStatus !== this.settings.availableInputTypes.credentialsProviderStatus) {
        this.providerStatusUpdated(response);
      }

      setTimeout(() => this._pollForUpdatesToCredentialsProvider(), 2000);
    } catch (e) {
      if (this.globalConfig.isDDGTestMode) {
        console.log('isDDGTestMode: _pollForUpdatesToCredentialsProvider: ❌', e);
      }
    }
  }
  /** @type {any} */


  /**
   * Poll the native listener until the user has selected a credential.
   * Message return types are:
   * - 'stop' is returned whenever the message sent doesn't match the native last opened tooltip.
   *     - This also is triggered when the close event is called and prevents any edge case continued polling.
   * - 'ok' is when the user has selected a credential and the value can be injected into the page.
   * - 'none' is when the tooltip is open in the native window however hasn't been entered.
   * @returns {Promise<{data:IdentityObject|CreditCardObject|CredentialsObject, configType: string} | null>}
   */
  async _listenForSelectedCredential() {
    return new Promise(resolve => {
      // Prevent two timeouts from happening
      // @ts-ignore
      const poll = async () => {
        clearTimeout(this.pollingTimeout);
        const response = await this.getSelectedCredentials();

        switch (response.type) {
          case 'none':
            // Parent hasn't got a selected credential yet
            // @ts-ignore
            this.pollingTimeout = setTimeout(() => {
              poll();
            }, 100);
            return;

          case 'ok':
            {
              return resolve({
                data: response.data,
                configType: response.configType
              });
            }

          case 'stop':
            // Parent wants us to stop polling
            resolve(null);
            break;
        }
      };

      poll();
    });
  }

  firePixel(pixelName) {
    this.deviceApi.notify(new _deviceApiCalls.SendJSPixelCall({
      pixelName
    }));
  }

}

exports.AppleDeviceInterface = AppleDeviceInterface;

},{"../../packages/device-api/index.js":14,"../Form/matching.js":41,"../UI/HTMLTooltip.js":52,"../UI/controllers/HTMLTooltipUIController.js":53,"../UI/controllers/NativeUIController.js":54,"../UI/controllers/OverlayUIController.js":55,"../autofill-utils.js":59,"../deviceApiCalls/__generated__/deviceApiCalls.js":63,"../deviceApiCalls/additionalDeviceApiCalls.js":65,"./InterfacePrototype.js":27,"@duckduckgo/content-scope-scripts/src/apple-utils":1}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AppleOverlayDeviceInterface = void 0;

var _AppleDeviceInterface = require("./AppleDeviceInterface.js");

var _HTMLTooltipUIController = require("../UI/controllers/HTMLTooltipUIController.js");

var _overlayApi = require("./overlayApi.js");

var _index = require("../../packages/device-api/index.js");

var _deviceApiCalls = require("../deviceApiCalls/__generated__/deviceApiCalls.js");

var _validatorsZod = require("../deviceApiCalls/__generated__/validators.zod.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * This subclass is designed to separate code that *only* runs inside the
 * Overlay into a single place.
 *
 * It will only run inside the macOS overlay, therefor all code here
 * can be viewed as *not* executing within a regular page context.
 */
class AppleOverlayDeviceInterface extends _AppleDeviceInterface.AppleDeviceInterface {
  constructor() {
    super(...arguments);

    _defineProperty(this, "stripCredentials", false);

    _defineProperty(this, "overlay", (0, _overlayApi.overlayApi)(this));
  }

  /**
   * Because we're running inside the Overlay, we always create the HTML
   * Tooltip controller.
   *
   * @override
   * @returns {import("../UI/controllers/UIController.js").UIController}
   */
  createUIController() {
    return new _HTMLTooltipUIController.HTMLTooltipUIController({
      tooltipKind:
      /** @type {const} */
      'modern',
      device: this
    }, {
      wrapperClass: 'top-autofill',
      tooltipPositionClass: () => '.wrapper { transform: none; }',
      setSize: details => this.deviceApi.notify((0, _index.createNotification)('setSize', details)),
      testMode: this.isTestMode()
    });
  }
  /**
   * Since we're running inside the Overlay we can limit what happens here to
   * be only things that are needed to power the HTML Tooltip
   *
   * @override
   * @returns {Promise<void>}
   */


  async setupAutofill() {
    await this._getAutofillInitData();
    const signedIn = await this._checkDeviceSignedIn();

    if (signedIn) {
      await this.getAddresses();
    } // setup overlay API pieces


    this.overlay.showImmediately();
  }
  /**
   * In the top-frame scenario we override the base 'selectedDetail'.
   *
   * This
   *
   * @override
   * @param {IdentityObject|CreditCardObject|CredentialsObject|{email:string, id: string}} data
   * @param {string} type
   */


  async selectedDetail(data, type) {
    return this.overlay.selectedDetail(data, type);
  }

  async askToUnlockProvider() {
    const response = await this.deviceApi.request(new _deviceApiCalls.AskToUnlockProviderCall(null));
    this.providerStatusUpdated(response);
  }

  providerStatusUpdated(data) {
    const {
      credentials,
      availableInputTypes
    } = (0, _index.validate)(data, _validatorsZod.providerStatusUpdatedSchema); // Update local settings and data

    this.settings.setAvailableInputTypes(availableInputTypes);
    this.storeLocalCredentials(credentials); // rerender the tooltip

    this.uiController.updateItems(credentials);
  }

  firePixel(pixelName) {
    this.deviceApi.notify(new _deviceApiCalls.SendJSPixelCall({
      pixelName
    }));
  }

}

exports.AppleOverlayDeviceInterface = AppleOverlayDeviceInterface;

},{"../../packages/device-api/index.js":14,"../UI/controllers/HTMLTooltipUIController.js":53,"../deviceApiCalls/__generated__/deviceApiCalls.js":63,"../deviceApiCalls/__generated__/validators.zod.js":64,"./AppleDeviceInterface.js":24,"./overlayApi.js":31}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExtensionInterface = void 0;

var _InterfacePrototype = _interopRequireDefault(require("./InterfacePrototype.js"));

var _autofillUtils = require("../autofill-utils.js");

var _HTMLTooltipUIController = require("../UI/controllers/HTMLTooltipUIController.js");

var _HTMLTooltip = require("../UI/HTMLTooltip.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ExtensionInterface extends _InterfacePrototype.default {
  /**
   * @override
   */
  createUIController() {
    /** @type {import('../UI/HTMLTooltip.js').HTMLTooltipOptions} */
    const htmlTooltipOptions = { ..._HTMLTooltip.defaultOptions,
      css: "<link rel=\"stylesheet\" href=\"".concat(chrome.runtime.getURL('public/css/autofill.css'), "\" crossOrigin=\"anonymous\">"),
      testMode: this.isTestMode()
    };
    return new _HTMLTooltipUIController.HTMLTooltipUIController({
      tooltipKind: 'legacy',
      device: this
    }, htmlTooltipOptions);
  }

  async isEnabled() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({
        registeredTempAutofillContentScript: true,
        documentUrl: window.location.href
      }, response => {
        if (response && 'site' in response) {
          resolve((0, _autofillUtils.isAutofillEnabledFromProcessedConfig)(response));
        }
      });
    });
  }

  isDeviceSignedIn() {
    return this.hasLocalAddresses;
  }

  setupAutofill() {
    return this.getAddresses();
  }

  postInit() {
    if (this.hasLocalAddresses) {
      const cleanup = this.scanner.init();
      this.addLogoutListener(cleanup);
    }
  }

  getAddresses() {
    return new Promise(resolve => chrome.runtime.sendMessage({
      getAddresses: true
    }, data => {
      this.storeLocalAddresses(data);
      return resolve(data);
    }));
  }
  /**
   * Used by the email web app
   * Settings page displays data of the logged in user data
   */


  getUserData() {
    return new Promise(resolve => chrome.runtime.sendMessage({
      getUserData: true
    }, data => resolve(data)));
  }
  /**
   * Used by the email web app
   * Device capabilities determine which functionality is available to the user
   */


  getEmailProtectionCapabilities() {
    return new Promise(resolve => chrome.runtime.sendMessage({
      getEmailProtectionCapabilities: true
    }, data => resolve(data)));
  }

  refreshAlias() {
    return chrome.runtime.sendMessage({
      refreshAlias: true
    }, addresses => this.storeLocalAddresses(addresses));
  }

  async trySigningIn() {
    if (this.globalConfig.isDDGDomain) {
      const data = await (0, _autofillUtils.sendAndWaitForAnswer)(_autofillUtils.SIGN_IN_MSG, 'addUserData');
      this.storeUserData(data);
    }
  }
  /**
   * @param {object} message
   * @param {object} message.addUserData
   * @param {string} message.addUserData.token
   * @param {string} message.addUserData.userName
   * @param {string} message.addUserData.cohort
   */


  storeUserData(message) {
    return chrome.runtime.sendMessage(message);
  }
  /**
   * Used by the email web app
   * Provides functionality to log the user out
   */


  removeUserData() {
    return chrome.runtime.sendMessage({
      removeUserData: true
    });
  }

  addDeviceListeners() {
    // Add contextual menu listeners
    let activeEl = null;
    document.addEventListener('contextmenu', e => {
      activeEl = e.target;
    });
    chrome.runtime.onMessage.addListener((message, sender) => {
      if (sender.id !== chrome.runtime.id) return;

      switch (message.type) {
        case 'ddgUserReady':
          this.setupAutofill().then(() => {
            this.refreshSettings().then(() => {
              this.setupSettingsPage({
                shouldLog: true
              }).then(() => {
                return this.postInit();
              });
            });
          });
          break;

        case 'contextualAutofill':
          (0, _autofillUtils.setValue)(activeEl, (0, _autofillUtils.formatDuckAddress)(message.alias), this.globalConfig);
          activeEl.classList.add('ddg-autofilled');
          this.refreshAlias(); // If the user changes the alias, remove the decoration

          activeEl.addEventListener('input', e => e.target.classList.remove('ddg-autofilled'), {
            once: true
          });
          break;

        default:
          break;
      }
    });
  }

  addLogoutListener(handler) {
    // Cleanup on logout events
    chrome.runtime.onMessage.addListener((message, sender) => {
      if (sender.id === chrome.runtime.id && message.type === 'logout') {
        handler();
      }
    });
  }

}

exports.ExtensionInterface = ExtensionInterface;

},{"../UI/HTMLTooltip.js":52,"../UI/controllers/HTMLTooltipUIController.js":53,"../autofill-utils.js":59,"./InterfacePrototype.js":27}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _autofillUtils = require("../autofill-utils.js");

var _matching = require("../Form/matching.js");

var _formatters = require("../Form/formatters.js");

var _Credentials = require("../InputTypes/Credentials.js");

var _PasswordGenerator = require("../PasswordGenerator.js");

var _Scanner = require("../Scanner.js");

var _config = require("../config.js");

var _NativeUIController = require("../UI/controllers/NativeUIController.js");

var _transports = require("../deviceApiCalls/transports/transports.js");

var _Settings = require("../Settings.js");

var _index = require("../../packages/device-api/index.js");

var _deviceApiCalls = require("../deviceApiCalls/__generated__/deviceApiCalls.js");

var _initFormSubmissionsApi = require("./initFormSubmissionsApi.js");

var _validatorsZod = require("../deviceApiCalls/__generated__/validators.zod.js");

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set"); _classApplyDescriptorSet(receiver, descriptor, value); return value; }

function _classApplyDescriptorSet(receiver, descriptor, value) { if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get"); return _classApplyDescriptorGet(receiver, descriptor); }

function _classExtractFieldDescriptor(receiver, privateMap, action) { if (!privateMap.has(receiver)) { throw new TypeError("attempted to " + action + " private field on non-instance"); } return privateMap.get(receiver); }

function _classApplyDescriptorGet(receiver, descriptor) { if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

var _addresses = /*#__PURE__*/new WeakMap();

var _data2 = /*#__PURE__*/new WeakMap();

/**
 * @typedef {import('../deviceApiCalls/__generated__/validators-ts').StoreFormData} StoreFormData
 */

/**
 * @implements {GlobalConfigImpl}
 * @implements {FormExtensionPoints}
 * @implements {DeviceExtensionPoints}
 */
class InterfacePrototype {
  /** @type {import("../Form/Form").Form | null} */

  /** @type {import("../UI/HTMLTooltip.js").default | null} */

  /** @type {number} */

  /** @type {PasswordGenerator} */

  /** @type {{privateAddress: string, personalAddress: string}} */

  /** @type {GlobalConfig} */

  /** @type {import('../Scanner').Scanner} */

  /** @type {import("../UI/controllers/UIController.js").UIController} */

  /** @type {import("../../packages/device-api").DeviceApi} */

  /**
   * @param {GlobalConfig} config
   * @param {import("../../packages/device-api").DeviceApi} deviceApi
   * @param {Settings} settings
   */
  constructor(config, deviceApi, settings) {
    _defineProperty(this, "attempts", 0);

    _defineProperty(this, "activeForm", null);

    _defineProperty(this, "currentTooltip", null);

    _defineProperty(this, "initialSetupDelayMs", 0);

    _defineProperty(this, "autopromptFired", false);

    _defineProperty(this, "passwordGenerator", new _PasswordGenerator.PasswordGenerator());

    _classPrivateFieldInitSpec(this, _addresses, {
      writable: true,
      value: {
        privateAddress: '',
        personalAddress: ''
      }
    });

    _defineProperty(this, "globalConfig", void 0);

    _defineProperty(this, "scanner", void 0);

    _defineProperty(this, "uiController", void 0);

    _defineProperty(this, "deviceApi", void 0);

    _classPrivateFieldInitSpec(this, _data2, {
      writable: true,
      value: {
        credentials: [],
        creditCards: [],
        identities: [],
        topContextData: undefined
      }
    });

    this.globalConfig = config;
    this.deviceApi = deviceApi;
    this.uiController = this.createUIController();
    this.settings = settings;
    this.scanner = (0, _Scanner.createScanner)(this, {
      initialDelay: this.initialSetupDelayMs
    });
  }
  /**
   * Implementors should override this with a UI controller that suits
   * their platform.
   *
   * @returns {import("../UI/controllers/UIController.js").UIController}
   */


  createUIController() {
    return new _NativeUIController.NativeUIController();
  }

  get hasLocalAddresses() {
    var _classPrivateFieldGet2, _classPrivateFieldGet3;

    return !!((_classPrivateFieldGet2 = _classPrivateFieldGet(this, _addresses)) !== null && _classPrivateFieldGet2 !== void 0 && _classPrivateFieldGet2.privateAddress && (_classPrivateFieldGet3 = _classPrivateFieldGet(this, _addresses)) !== null && _classPrivateFieldGet3 !== void 0 && _classPrivateFieldGet3.personalAddress);
  }

  getLocalAddresses() {
    return _classPrivateFieldGet(this, _addresses);
  }

  storeLocalAddresses(addresses) {
    _classPrivateFieldSet(this, _addresses, addresses); // When we get new duck addresses, add them to the identities list


    const identities = this.getLocalIdentities();
    const privateAddressIdentity = identities.find(_ref => {
      let {
        id
      } = _ref;
      return id === 'privateAddress';
    }); // If we had previously stored them, just update the private address

    if (privateAddressIdentity) {
      privateAddressIdentity.emailAddress = (0, _autofillUtils.formatDuckAddress)(addresses.privateAddress);
    } else {
      // Otherwise, add both addresses
      _classPrivateFieldGet(this, _data2).identities = this.addDuckAddressesToIdentities(identities);
    }
  }
  /** @type { PMData } */


  /**
   * @returns {import('../Form/matching').SupportedTypes}
   */
  getCurrentInputType() {
    throw new Error('Not implemented');
  }

  addDuckAddressesToIdentities(identities) {
    if (!this.hasLocalAddresses) return identities;
    const newIdentities = [];
    let {
      privateAddress,
      personalAddress
    } = this.getLocalAddresses();
    privateAddress = (0, _autofillUtils.formatDuckAddress)(privateAddress);
    personalAddress = (0, _autofillUtils.formatDuckAddress)(personalAddress); // Get the duck addresses in identities

    const duckEmailsInIdentities = identities.reduce((duckEmails, _ref2) => {
      let {
        emailAddress: email
      } = _ref2;
      return email !== null && email !== void 0 && email.includes(_autofillUtils.ADDRESS_DOMAIN) ? duckEmails.concat(email) : duckEmails;
    }, []); // Only add the personal duck address to identities if the user hasn't
    // already manually added it

    if (!duckEmailsInIdentities.includes(personalAddress)) {
      newIdentities.push({
        id: 'personalAddress',
        emailAddress: personalAddress,
        title: 'Blocks email trackers'
      });
    }

    newIdentities.push({
      id: 'privateAddress',
      emailAddress: privateAddress,
      title: 'Blocks email trackers and hides your address'
    });
    return [...identities, ...newIdentities];
  }
  /**
   * Stores init data coming from the tooltipHandler
   * @param { InboundPMData } data
   */


  storeLocalData(data) {
    this.storeLocalCredentials(data.credentials);
    data.creditCards.forEach(cc => delete cc.cardNumber && delete cc.cardSecurityCode); // Store the full name as a separate field to simplify autocomplete

    const updatedIdentities = data.identities.map(identity => ({ ...identity,
      fullName: (0, _formatters.formatFullName)(identity)
    })); // Add addresses

    _classPrivateFieldGet(this, _data2).identities = this.addDuckAddressesToIdentities(updatedIdentities);
    _classPrivateFieldGet(this, _data2).creditCards = data.creditCards; // Top autofill only

    if (data.serializedInputContext) {
      try {
        _classPrivateFieldGet(this, _data2).topContextData = JSON.parse(data.serializedInputContext);
      } catch (e) {
        console.error(e);
        this.removeTooltip();
      }
    }
  }
  /**
   * Stores credentials locally
   * @param {CredentialsObject[]} credentials
   */


  storeLocalCredentials(credentials) {
    credentials.forEach(cred => delete cred.password);
    _classPrivateFieldGet(this, _data2).credentials = credentials;
  }

  getTopContextData() {
    return _classPrivateFieldGet(this, _data2).topContextData;
  }
  /**
   * @deprecated use `availableInputTypes.credentials` directly instead
   * @returns {boolean}
   */


  get hasLocalCredentials() {
    return _classPrivateFieldGet(this, _data2).credentials.length > 0;
  }

  getLocalCredentials() {
    return _classPrivateFieldGet(this, _data2).credentials.map(cred => {
      const {
        password,
        ...rest
      } = cred;
      return rest;
    });
  }
  /**
   * @deprecated use `availableInputTypes.identities` directly instead
   * @returns {boolean}
   */


  get hasLocalIdentities() {
    return _classPrivateFieldGet(this, _data2).identities.length > 0;
  }

  getLocalIdentities() {
    return _classPrivateFieldGet(this, _data2).identities;
  }
  /**
   * @deprecated use `availableInputTypes.creditCards` directly instead
   * @returns {boolean}
   */


  get hasLocalCreditCards() {
    return _classPrivateFieldGet(this, _data2).creditCards.length > 0;
  }
  /** @return {CreditCardObject[]} */


  getLocalCreditCards() {
    return _classPrivateFieldGet(this, _data2).creditCards;
  }

  async startInit() {
    await this.refreshSettings();
    this.addDeviceListeners();
    await this.setupAutofill(); // this is the temporary measure to support windows whilst we still have 'setupAutofill'
    // eventually all interfaces will use this

    if (!this.isEnabledViaSettings()) {
      return;
    }

    await this.setupSettingsPage();
    await this.postInit();

    if (this.settings.featureToggles.credentials_saving) {
      (0, _initFormSubmissionsApi.initFormSubmissionsApi)(this.scanner.forms);
    }
  }
  /**
   * This is to aid the migration to all platforms using Settings.enabled.
   *
   * For now, Windows is the only platform that can be 'enabled' or 'disabled' via
   * the new Settings - which is why in that interface it has `return this.settings.enabled`
   *
   * Whilst we wait for other platforms to catch up, we offer this default implementation
   * of just returning true.
   *
   * @returns {boolean}
   */


  isEnabledViaSettings() {
    return true;
  }
  /**
   * This is a fall-back situation for macOS since it was the only
   * platform to support anything none-email based in the past.
   *
   * Once macOS fully supports 'getAvailableInputTypes' this can be removed
   *
   * @returns {Promise<void>}
   */


  async refreshSettings() {
    await this.settings.refresh();
  }

  postInit() {}

  async isEnabled() {
    return (0, _autofillUtils.autofillEnabled)(this.globalConfig);
  }

  async init() {
    const isEnabled = await this.isEnabled();
    if (!isEnabled) return;

    if (document.readyState === 'complete') {
      this.startInit();
    } else {
      window.addEventListener('load', () => {
        this.startInit();
      });
    }
  }
  /**
   * @deprecated This was a port from the macOS implementation so the API may not be suitable for all
   * @returns {Promise<any>}
   */


  async getSelectedCredentials() {
    throw new Error('`getSelectedCredentials` not implemented');
  }

  isTestMode() {
    return this.globalConfig.isDDGTestMode;
  }
  /**
   * This indicates an item was selected, and we should try to autofill
   *
   * Note: When we're in a top-frame scenario, like on like macOS & Windows in the webview,
   * this method gets overridden {@see WindowsOverlayDeviceInterface} {@see AppleOverlayDeviceInterface}
   *
   * @param {IdentityObject|CreditCardObject|CredentialsObject|{email:string, id: string}} data
   * @param {string} type
   */


  async selectedDetail(data, type) {
    const form = this.activeForm;

    if (!form) {
      return;
    }

    if (data.id === 'privateAddress') {
      this.refreshAlias();
    }

    if (type === 'email' && 'email' in data) {
      form.autofillEmail(data.email);
    } else {
      form.autofillData(data, type);
    }

    this.removeTooltip();
  }
  /**
   * Before the DataWebTooltip opens, we collect the data based on the config.type
   * @param {InputTypeConfigs} config
   * @param {import('../Form/matching').SupportedTypes} inputType
   * @param {TopContextData} [data]
   * @returns {(CredentialsObject|CreditCardObject|IdentityObject)[]}
   */


  dataForAutofill(config, inputType, data) {
    const subtype = (0, _matching.getSubtypeFromType)(inputType);

    if (config.type === 'identities') {
      return this.getLocalIdentities().filter(identity => !!identity[subtype]);
    }

    if (config.type === 'creditCards') {
      return this.getLocalCreditCards();
    }

    if (config.type === 'credentials') {
      if (data) {
        if (Array.isArray(data.credentials) && data.credentials.length > 0) {
          return data.credentials;
        } else {
          return this.getLocalCredentials();
        }
      }
    }

    return [];
  }
  /**
   * @param {import("../Form/Form").Form} form
   * @param {HTMLInputElement} input
   * @param {{ x: number; y: number; } | null} click
   * @param {'userInitiated' | 'autoprompt'} trigger
   */


  attachTooltip(form, input, click) {
    let trigger = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'userInitiated';
    // Avoid flashing tooltip from background tabs on macOS
    if (document.visibilityState !== 'visible') return; // Only autoprompt on mobile devices

    if (trigger === 'autoprompt' && !this.globalConfig.isMobileApp) return; // Only fire autoprompt once

    if (trigger === 'autoprompt' && this.autopromptFired) return;
    form.activeInput = input;
    this.activeForm = form;
    const inputType = (0, _matching.getInputType)(input);
    /** @type {PosFn} */

    const getPosition = () => {
      // In extensions, the tooltip is centered on the Dax icon
      const alignLeft = this.globalConfig.isApp || this.globalConfig.isWindows;
      return alignLeft ? input.getBoundingClientRect() : (0, _autofillUtils.getDaxBoundingBox)(input);
    }; // todo: this will be migrated to use NativeUIController soon


    if (this.globalConfig.isMobileApp && inputType === 'identities.emailAddress') {
      this.getAlias().then(alias => {
        var _form$activeInput;

        if (alias) form.autofillEmail(alias);else (_form$activeInput = form.activeInput) === null || _form$activeInput === void 0 ? void 0 : _form$activeInput.focus();
      });
      return;
    }
    /** @type {TopContextData} */


    const topContextData = {
      inputType
    }; // Allow features to append/change top context data
    // for example, generated passwords may get appended here

    const processedTopContext = this.preAttachTooltip(topContextData, input, form);
    this.uiController.attach({
      input,
      form,
      click,
      getPosition,
      topContextData: processedTopContext,
      device: this,
      trigger
    });

    if (trigger === 'autoprompt') {
      this.autopromptFired = true;
    }
  }
  /**
   * When an item was selected, we then call back to the device
   * to fetch the full suite of data needed to complete the autofill
   *
   * @param {InputTypeConfigs} config
   * @param {(CreditCardObject|IdentityObject|CredentialsObject)[]} items
   * @param {CreditCardObject['id']|IdentityObject['id']|CredentialsObject['id']} id
   */


  onSelect(config, items, id) {
    id = String(id);

    if (id === _Credentials.PROVIDER_LOCKED) {
      return this.askToUnlockProvider();
    }

    const matchingData = items.find(item => String(item.id) === id);
    if (!matchingData) throw new Error('unreachable (fatal)');

    const dataPromise = (() => {
      switch (config.type) {
        case 'creditCards':
          return this.getAutofillCreditCard(id);

        case 'identities':
          return this.getAutofillIdentity(id);

        case 'credentials':
          {
            if (_Credentials.AUTOGENERATED_KEY in matchingData) {
              return Promise.resolve({
                success: matchingData
              });
            }

            return this.getAutofillCredentials(id);
          }

        default:
          throw new Error('unreachable!');
      }
    })(); // wait for the data back from the device


    dataPromise.then(response => {
      if (response) {
        if (config.type === 'identities') {
          this.firePixel('autofill_identity');
        } // some platforms do not include a `success` object, why?


        const data = response.success || response;
        return this.selectedDetail(data, config.type);
      } else {
        return Promise.reject(new Error('none-success response'));
      }
    }).catch(e => {
      console.error(e);
      return this.removeTooltip();
    });
  }

  async askToUnlockProvider() {
    const response = await this.deviceApi.request(new _deviceApiCalls.AskToUnlockProviderCall(null));
    this.providerStatusUpdated(response);
  }

  isTooltipActive() {
    var _this$uiController$is, _this$uiController$is2, _this$uiController;

    return (_this$uiController$is = (_this$uiController$is2 = (_this$uiController = this.uiController).isActive) === null || _this$uiController$is2 === void 0 ? void 0 : _this$uiController$is2.call(_this$uiController)) !== null && _this$uiController$is !== void 0 ? _this$uiController$is : false;
  }

  removeTooltip() {
    var _this$uiController$re, _this$uiController2;

    return (_this$uiController$re = (_this$uiController2 = this.uiController).removeTooltip) === null || _this$uiController$re === void 0 ? void 0 : _this$uiController$re.call(_this$uiController2, 'interface');
  }

  async setupSettingsPage() {
    let {
      shouldLog
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      shouldLog: false
    };

    if (!this.globalConfig.isDDGDomain) {
      return;
    }

    (0, _autofillUtils.notifyWebApp)({
      isApp: this.globalConfig.isApp
    });

    if (this.isDeviceSignedIn()) {
      let userData;

      try {
        userData = await this.getUserData();
      } catch (e) {}

      let capabilities;

      try {
        capabilities = await this.getEmailProtectionCapabilities();
      } catch (e) {} // Set up listener for web app actions


      window.addEventListener('message', e => {
        if (this.globalConfig.isDDGDomain && e.data.removeUserData) {
          this.removeUserData();
        }
      });
      const hasUserData = userData && !userData.error && Object.entries(userData).length > 0;
      (0, _autofillUtils.notifyWebApp)({
        deviceSignedIn: {
          value: true,
          shouldLog,
          userData: hasUserData ? userData : undefined,
          capabilities
        }
      });
    } else {
      this.trySigningIn();
    }
  }

  async setupAutofill() {}
  /** @returns {Promise<EmailAddresses>} */


  async getAddresses() {
    throw new Error('unimplemented');
  }
  /** @returns {Promise<null|Record<any,any>>} */


  getUserData() {
    return Promise.resolve(null);
  }
  /** @returns {void} */


  removeUserData() {}
  /** @returns {Promise<null|Record<string,boolean>>} */


  getEmailProtectionCapabilities() {
    throw new Error('unimplemented');
  }

  refreshAlias() {}

  async trySigningIn() {
    if (this.globalConfig.isDDGDomain) {
      if (this.attempts < 10) {
        this.attempts++;
        const data = await (0, _autofillUtils.sendAndWaitForAnswer)(_autofillUtils.SIGN_IN_MSG, 'addUserData'); // This call doesn't send a response, so we can't know if it succeeded

        this.storeUserData(data);
        await this.setupAutofill();
        await this.refreshSettings();
        await this.setupSettingsPage({
          shouldLog: true
        });
        await this.postInit();
      } else {
        console.warn('max attempts reached, bailing');
      }
    }
  }

  storeUserData(_data) {}

  addDeviceListeners() {}
  /**
   * Called by the native layer on all tabs when the provider status is updated
   * @param {import("../deviceApiCalls/__generated__/validators-ts").ProviderStatusUpdated} data
   */


  providerStatusUpdated(data) {
    try {
      var _availableInputTypes$;

      const {
        credentials,
        availableInputTypes
      } = (0, _index.validate)(data, _validatorsZod.providerStatusUpdatedSchema); // Update local settings and data

      this.settings.setAvailableInputTypes(availableInputTypes);
      this.storeLocalCredentials(credentials); // rerender the tooltip

      this.uiController.updateItems(credentials); // If the tooltip is open on an autofill type that's not available, close it

      const currentInputSubtype = (0, _matching.getSubtypeFromType)(this.getCurrentInputType());

      if (!((_availableInputTypes$ = availableInputTypes.credentials) !== null && _availableInputTypes$ !== void 0 && _availableInputTypes$[currentInputSubtype])) {
        this.removeTooltip();
      } // Redecorate fields according to the new types


      this.scanner.forms.forEach(form => form.redecorateAllInputs());
    } catch (e) {
      if (this.globalConfig.isDDGTestMode) {
        console.log('isDDGTestMode: providerStatusUpdated error: ❌', e);
      }
    }
  }
  /** @param {() => void} _fn */


  addLogoutListener(_fn) {}

  isDeviceSignedIn() {
    return false;
  }
  /**
   * @returns {Promise<null|string>}
   */


  async getAlias() {
    return null;
  } // PM endpoints


  storeCredentials(_opts) {}

  getAccounts() {}
  /**
   * Gets credentials ready for autofill
   * @param {CredentialsObject['id']} id - the credential id
   * @returns {Promise<CredentialsObject|{success:CredentialsObject}>}
   */


  async getAutofillCredentials(id) {
    return this.deviceApi.request(new _deviceApiCalls.GetAutofillCredentialsCall({
      id: String(id)
    }));
  }
  /** @returns {APIResponse<CreditCardObject>} */


  async getAutofillCreditCard(_id) {
    throw new Error('getAutofillCreditCard unimplemented');
  }
  /** @returns {Promise<{success: IdentityObject|undefined}>} */


  async getAutofillIdentity(_id) {
    throw new Error('getAutofillIdentity unimplemented');
  }

  openManagePasswords() {}
  /** @param {StoreFormData} values */


  storeFormData(values) {
    this.deviceApi.notify(new _deviceApiCalls.StoreFormDataCall(values));
  }
  /**
   * `preAttachTooltip` happens just before a tooltip is show - features may want to append some data
   * at this point.
   *
   * For example, if password generation is enabled, this will generate
   * a password and send it to the tooltip as though it were a stored credential.
   *
   * @param {TopContextData} topContextData
   * @param {HTMLInputElement} input
   * @param {{isSignup: boolean|null}} form
   */


  preAttachTooltip(topContextData, input, form) {
    // A list of checks to determine if we need to generate a password
    const checks = [topContextData.inputType === 'credentials.password', this.settings.featureToggles.password_generation, form.isSignup]; // if all checks pass, generate and save a password

    if (checks.every(Boolean)) {
      const password = this.passwordGenerator.generate({
        input: input.getAttribute('passwordrules'),
        domain: window.location.hostname
      }); // append the new credential to the topContextData so that the top autofill can display it

      topContextData.credentials = [(0, _Credentials.fromPassword)(password)];
    }

    return topContextData;
  }
  /**
   * `postAutofill` gives features an opportunity to perform an action directly
   * following an autofill.
   *
   * For example, if a generated password was used, we want to fire a save event.
   *
   * @param {IdentityObject|CreditCardObject|CredentialsObject} data
   * @param {SupportedMainTypes} dataType
   * @param {import("../Form/Form").Form} formObj
   */


  postAutofill(data, dataType, formObj) {
    if (_Credentials.AUTOGENERATED_KEY in data && 'password' in data) {
      var _formValues$credentia;

      const formValues = formObj.getValues();

      if (((_formValues$credentia = formValues.credentials) === null || _formValues$credentia === void 0 ? void 0 : _formValues$credentia.password) === data.password) {
        const withAutoGeneratedFlag = (0, _Credentials.appendGeneratedId)(formValues, data.password);
        this.storeFormData(withAutoGeneratedFlag);
      }
    }

    if (dataType === 'credentials' && this.settings.globalConfig.isMobileApp) {
      formObj.attemptSubmissionIfNeeded();
    }
  }
  /**
   * `postSubmit` gives features a one-time-only opportunity to perform an
   * action directly after a form submission was observed.
   *
   * Mostly this is about storing data from the form submission, but it can
   * also be used like in the case of Password generation, to append additional
   * data before it's sent to be saved.
   *
   * @param {DataStorageObject} values
   * @param {import("../Form/Form").Form} form
   */


  postSubmit(values, form) {
    if (!form.form) return;
    if (!form.hasValues(values)) return;
    const checks = [form.shouldPromptToStoreData, this.passwordGenerator.generated];

    if (checks.some(Boolean)) {
      const withAutoGeneratedFlag = (0, _Credentials.appendGeneratedId)(values, this.passwordGenerator.password);
      this.storeFormData(withAutoGeneratedFlag);
    }
  }
  /**
   * Sends a pixel to be fired on the client side
   * @param {import('../deviceApiCalls/__generated__/validators-ts').SendJSPixelParams['pixelName']} _pixelName
   */


  firePixel(_pixelName) {}
  /**
   * This serves as a single place to create a default instance
   * of InterfacePrototype that can be useful in testing scenarios
   * @returns {InterfacePrototype}
   */


  static default() {
    const globalConfig = (0, _config.createGlobalConfig)();
    const transport = (0, _transports.createTransport)(globalConfig);
    const deviceApi = new _index.DeviceApi(transport);

    const settings = _Settings.Settings.default(globalConfig, deviceApi);

    return new InterfacePrototype(globalConfig, deviceApi, settings);
  }

}

var _default = InterfacePrototype;
exports.default = _default;

},{"../../packages/device-api/index.js":14,"../Form/formatters.js":35,"../Form/matching.js":41,"../InputTypes/Credentials.js":44,"../PasswordGenerator.js":47,"../Scanner.js":48,"../Settings.js":49,"../UI/controllers/NativeUIController.js":54,"../autofill-utils.js":59,"../config.js":61,"../deviceApiCalls/__generated__/deviceApiCalls.js":63,"../deviceApiCalls/__generated__/validators.zod.js":64,"../deviceApiCalls/transports/transports.js":69,"./initFormSubmissionsApi.js":30}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WindowsInterface = void 0;

var _InterfacePrototype = _interopRequireDefault(require("./InterfacePrototype.js"));

var _OverlayUIController = require("../UI/controllers/OverlayUIController.js");

var _deviceApiCalls = require("../deviceApiCalls/__generated__/deviceApiCalls.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @typedef {import('../deviceApiCalls/__generated__/validators-ts').GetAutofillDataRequest} GetAutofillDataRequest
 */
class WindowsInterface extends _InterfacePrototype.default {
  constructor() {
    super(...arguments);

    _defineProperty(this, "ready", false);

    _defineProperty(this, "_abortController", null);
  }

  /**
   * @deprecated This runs too early, and will be removed eventually.
   * @returns {Promise<boolean>}
   */
  async isEnabled() {
    return true;
  }

  isEnabledViaSettings() {
    return Boolean(this.settings.enabled);
  }

  postInit() {
    const cleanup = this.scanner.init();
    this.addLogoutListener(cleanup);
    this.ready = true;
  }

  createUIController() {
    /**
     * If we get here, we're just a controller for an overlay
     */
    return new _OverlayUIController.OverlayUIController({
      remove: async () => this._closeAutofillParent(),
      show: async details => this._show(details)
    });
  }
  /**
   * @param {GetAutofillDataRequest} details
   */


  async _show(details) {
    const {
      mainType
    } = details; // prevent overlapping listeners

    if (this._abortController && !this._abortController.signal.aborted) {
      this._abortController.abort();
    }

    this._abortController = new AbortController();
    this.deviceApi.request(new _deviceApiCalls.GetAutofillDataCall(details), {
      signal: this._abortController.signal
    }).then(resp => {
      if (!this.activeForm) {
        throw new Error('this.currentAttached was absent');
      }

      switch (resp.action) {
        case 'fill':
          {
            if (mainType in resp) {
              var _this$activeForm;

              (_this$activeForm = this.activeForm) === null || _this$activeForm === void 0 ? void 0 : _this$activeForm.autofillData(resp[mainType], mainType);
            } else {
              throw new Error("action: \"fill\" cannot occur because \"".concat(mainType, "\" was missing"));
            }

            break;
          }

        case 'focus':
          {
            var _this$activeForm2, _this$activeForm2$act;

            (_this$activeForm2 = this.activeForm) === null || _this$activeForm2 === void 0 ? void 0 : (_this$activeForm2$act = _this$activeForm2.activeInput) === null || _this$activeForm2$act === void 0 ? void 0 : _this$activeForm2$act.focus();
            break;
          }

        case 'none':
          {
            // do nothing
            break;
          }

        default:
          {
            if (this.globalConfig.isDDGTestMode) {
              console.warn('unhandled response', resp);
            }
          }
      }

      return this._closeAutofillParent();
    }).catch(e => {
      if (this.globalConfig.isDDGTestMode) {
        if (e.name === 'AbortError') {
          console.log('Promise Aborted');
        } else {
          console.error('Promise Rejected', e);
        }
      }
    });
  }
  /**
   * @returns {Promise<any>}
   */


  async _closeAutofillParent() {
    return this.deviceApi.notify(new _deviceApiCalls.CloseAutofillParentCall(null));
  }

}

exports.WindowsInterface = WindowsInterface;

},{"../UI/controllers/OverlayUIController.js":55,"../deviceApiCalls/__generated__/deviceApiCalls.js":63,"./InterfacePrototype.js":27}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WindowsOverlayDeviceInterface = void 0;

var _InterfacePrototype = _interopRequireDefault(require("./InterfacePrototype.js"));

var _HTMLTooltipUIController = require("../UI/controllers/HTMLTooltipUIController.js");

var _deviceApiCalls = require("../deviceApiCalls/__generated__/deviceApiCalls.js");

var _overlayApi = require("./overlayApi.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * This subclass is designed to separate code that *only* runs inside the
 * Windows Overlay into a single place.
 *
 * It has some subtle differences to the macOS version, which is why
 * this is another DeviceInterface
 */
class WindowsOverlayDeviceInterface extends _InterfacePrototype.default {
  constructor() {
    super(...arguments);

    _defineProperty(this, "stripCredentials", false);

    _defineProperty(this, "overlay", (0, _overlayApi.overlayApi)(this));
  }

  /**
   * Because we're running inside the Overlay, we always create the HTML
   * Tooltip controller.
   *
   * @override
   * @returns {import("../UI/controllers/UIController.js").UIController}
   */
  createUIController() {
    return new _HTMLTooltipUIController.HTMLTooltipUIController({
      tooltipKind:
      /** @type {const} */
      'modern',
      device: this
    }, {
      wrapperClass: 'top-autofill',
      tooltipPositionClass: () => '.wrapper { transform: none; }',
      setSize: details => this.deviceApi.notify(new _deviceApiCalls.SetSizeCall(details)),
      testMode: this.isTestMode(),

      /**
       * Note: This is needed because Mutation observer didn't support visibility checks on Windows
       */
      checkVisibility: false
    });
  }
  /**
   * Since we're running inside the Overlay we can limit what happens here to
   * be only things that are needed to power the HTML Tooltip
   *
   * @override
   * @returns {Promise<void>}
   */


  async setupAutofill() {
    const response = await this.deviceApi.request(new _deviceApiCalls.GetAutofillInitDataCall(null)); // @ts-ignore

    this.storeLocalData(response); // setup overlay API pieces

    this.overlay.showImmediately();
  }
  /**
   * In the top-frame scenario, we send a message to the native
   * side to indicate a selection. Once received, the native side will store that selection so that a
   * subsequence call from main webpage can retrieve it
   *
   * @override
   * @param {IdentityObject|CreditCardObject|CredentialsObject|{email:string, id: string}} data
   * @param {string} type
   */


  async selectedDetail(data, type) {
    return this.overlay.selectedDetail(data, type);
  }

}

exports.WindowsOverlayDeviceInterface = WindowsOverlayDeviceInterface;

},{"../UI/controllers/HTMLTooltipUIController.js":53,"../deviceApiCalls/__generated__/deviceApiCalls.js":63,"./InterfacePrototype.js":27,"./overlayApi.js":31}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initFormSubmissionsApi = initFormSubmissionsApi;

var _selectorsCss = require("../Form/selectors-css.js");

var _matching = require("../Form/matching.js");

var _autofillUtils = require("../autofill-utils.js");

/**
 * This is a single place to contain all functionality relating to form submission detection
 *
 * @param {Map<HTMLElement, import("../Form/Form").Form>} forms
 */
function initFormSubmissionsApi(forms) {
  /**
   * Global submit events
   */
  window.addEventListener('submit', e => {
    var _forms$get;

    // @ts-ignore
    return (_forms$get = forms.get(e.target)) === null || _forms$get === void 0 ? void 0 : _forms$get.submitHandler('global submit event');
  }, true);
  /**
   * Global keydown events
   */

  window.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const focusedForm = [...forms.values()].find(form => form.hasFocus(e));
      focusedForm === null || focusedForm === void 0 ? void 0 : focusedForm.submitHandler('global keydown + Enter');
    }
  });
  /**
   * Global pointer down events
   * @param {PointerEvent} event
   */

  window.addEventListener('pointerdown', event => {
    const matchingForm = [...forms.values()].find(form => {
      const btns = [...form.submitButtons]; // @ts-ignore

      if (btns.includes(event.target)) return true; // @ts-ignore

      if (btns.find(btn => btn.contains(event.target))) return true;
    });
    matchingForm === null || matchingForm === void 0 ? void 0 : matchingForm.submitHandler('global pointerdown event + matching form');

    if (!matchingForm) {
      var _event$target;

      const selector = _selectorsCss.SUBMIT_BUTTON_SELECTOR + ', a[href="#"], a[href^=javascript], *[onclick]'; // check if the click happened on a button

      const button =
      /** @type HTMLElement */
      (_event$target = event.target) === null || _event$target === void 0 ? void 0 : _event$target.closest(selector);
      if (!button) return;
      const text = (0, _matching.removeExcessWhitespace)(button === null || button === void 0 ? void 0 : button.textContent);
      const hasRelevantText = /(log|sign).?(in|up)|continue|next|submit/i.test(text);

      if (hasRelevantText && text.length < 25) {
        // check if there's a form with values
        const filledForm = [...forms.values()].find(form => form.hasValues());

        if (filledForm && (0, _autofillUtils.buttonMatchesFormType)(
        /** @type HTMLElement */
        button, filledForm)) {
          filledForm === null || filledForm === void 0 ? void 0 : filledForm.submitHandler('global pointerdown event + filled form');
        }
      }
    }
  }, true);
  /**
   * @type {PerformanceObserver}
   */

  const observer = new PerformanceObserver(list => {
    const entries = list.getEntries().filter(entry => // @ts-ignore why does TS not know about `entry.initiatorType`?
    ['fetch', 'xmlhttprequest'].includes(entry.initiatorType) && /login|sign-in|signin/.test(entry.name));
    if (!entries.length) return;
    const filledForm = [...forms.values()].find(form => form.hasValues());
    filledForm === null || filledForm === void 0 ? void 0 : filledForm.submitHandler('performance observer');
  });
  observer.observe({
    entryTypes: ['resource']
  });
}

},{"../Form/matching.js":41,"../Form/selectors-css.js":42,"../autofill-utils.js":59}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.overlayApi = overlayApi;

var _deviceApiCalls = require("../deviceApiCalls/__generated__/deviceApiCalls.js");

/**
 * These are some re-usable parts for handling 'overlays' (like on macOS + Windows)
 *
 * @param {import("./InterfacePrototype").default} device
 */
function overlayApi(device) {
  /**
   * The native side will send a custom event 'mouseMove' to indicate
   * that the HTMLTooltip should fake an element being focused.
   *
   * Note: There's no cleanup required here since the Overlay has a fresh
   * page load every time it's opened.
   */
  window.addEventListener('mouseMove', event => {
    var _device$uiController$, _device$uiController;

    const activeTooltip = (_device$uiController$ = (_device$uiController = device.uiController).getActiveTooltip) === null || _device$uiController$ === void 0 ? void 0 : _device$uiController$.call(_device$uiController);
    activeTooltip === null || activeTooltip === void 0 ? void 0 : activeTooltip.focus(event.detail.x, event.detail.y);
  });
  return {
    /**
     * When we are inside an 'overlay' - the HTML tooltip will be opened immediately
     */
    showImmediately() {
      var _device$uiController$2, _device$uiController2;

      const topContextData = device.getTopContextData();
      if (!topContextData) throw new Error('unreachable, topContextData should be available'); // Provide dummy values

      const getPosition = () => {
        return {
          x: 0,
          y: 0,
          height: 50,
          width: 50
        };
      }; // Create the tooltip, and set it as active


      const tooltip = (_device$uiController$2 = (_device$uiController2 = device.uiController).createTooltip) === null || _device$uiController$2 === void 0 ? void 0 : _device$uiController$2.call(_device$uiController2, getPosition, topContextData);

      if (tooltip) {
        var _device$uiController$3, _device$uiController3;

        (_device$uiController$3 = (_device$uiController3 = device.uiController).setActiveTooltip) === null || _device$uiController$3 === void 0 ? void 0 : _device$uiController$3.call(_device$uiController3, tooltip);
      }
    },

    /**
     * @param {IdentityObject|CreditCardObject|CredentialsObject|{email:string, id: string}} data
     * @param {string} type
     * @returns {Promise<void>}
     */
    async selectedDetail(data, type) {
      let detailsEntries = Object.entries(data).map(_ref => {
        let [key, value] = _ref;
        return [key, String(value)];
      });
      const entries = Object.fromEntries(detailsEntries);
      /** @link {import("../deviceApiCalls/schemas/getAutofillData.result.json")} */

      await device.deviceApi.notify(new _deviceApiCalls.SelectedDetailCall({
        data: entries,
        configType: type
      }));
    }

  };
}

},{"../deviceApiCalls/__generated__/deviceApiCalls.js":63}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Form = void 0;

var _FormAnalyzer = _interopRequireDefault(require("./FormAnalyzer.js"));

var _autofillUtils = require("../autofill-utils.js");

var _matching = require("./matching.js");

var _inputStyles = require("./inputStyles.js");

var _inputTypeConfig = require("./inputTypeConfig.js");

var _formatters = require("./formatters.js");

var _constants = require("../constants.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  ATTR_AUTOFILL
} = _constants.constants;

class Form {
  /** @type {import("../Form/matching").Matching} */

  /** @type {HTMLElement} */

  /** @type {HTMLInputElement | null} */

  /** @type {boolean | null} */

  /**
   * @param {HTMLElement} form
   * @param {HTMLInputElement|HTMLSelectElement} input
   * @param {import("../DeviceInterface/InterfacePrototype").default} deviceInterface
   * @param {import("../Form/matching").Matching} [matching]
   * @param {Boolean} [shouldAutoprompt]
   */
  constructor(form, input, deviceInterface, matching) {
    let shouldAutoprompt = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

    _defineProperty(this, "matching", void 0);

    _defineProperty(this, "form", void 0);

    _defineProperty(this, "activeInput", void 0);

    _defineProperty(this, "isSignup", void 0);

    this.form = form;
    this.matching = matching || (0, _matching.createMatching)();
    this.formAnalyzer = new _FormAnalyzer.default(form, input, matching);
    this.isLogin = this.formAnalyzer.isLogin;
    this.isSignup = this.formAnalyzer.isSignup;
    this.device = deviceInterface;
    /** @type Record<'all' | SupportedMainTypes, Set> */

    this.inputs = {
      all: new Set(),
      credentials: new Set(),
      creditCards: new Set(),
      identities: new Set(),
      unknown: new Set()
    };
    this.touched = new Set();
    this.listeners = new Set();
    this.activeInput = null; // We set this to true to skip event listeners while we're autofilling

    this.isAutofilling = false;
    this.handlerExecuted = false;
    this.shouldPromptToStoreData = true;
    /**
     * @type {IntersectionObserver | null}
     */

    this.intObs = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) this.removeTooltip();
      }
    }); // This ensures we fire the handler again if the form is changed

    this.addListener(form, 'input', () => {
      if (!this.isAutofilling) {
        this.handlerExecuted = false;
        this.shouldPromptToStoreData = true;
      }
    });
    this.categorizeInputs();

    if (shouldAutoprompt) {
      this.promptLoginIfNeeded();
    }
  }
  /**
   * Checks if the form element contains the activeElement or the event target
   * @return {boolean}
   * @param {KeyboardEvent | null} [e]
   */


  hasFocus(e) {
    return this.form.contains(document.activeElement) || this.form.contains(
    /** @type HTMLElement */
    e === null || e === void 0 ? void 0 : e.target);
  }
  /**
   * Checks that the form element doesn't contain an invalid field
   * @return {boolean}
   */


  isValid() {
    if (this.form instanceof HTMLFormElement) {
      return this.form.checkValidity();
    } // If the container is not a valid form, we must check fields individually


    let validity = true;
    this.execOnInputs(input => {
      if (input.validity && !input.validity.valid) validity = false;
    }, 'all', false);
    return validity;
  }

  submitHandler() {
    var _this$device$postSubm, _this$device;

    let via = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'unknown';

    if (this.device.globalConfig.isDDGTestMode) {
      console.log('Form.submitHandler via:', via, this);
    }

    if (this.handlerExecuted) return;
    if (!this.isValid()) return;
    const values = this.getValues();
    (_this$device$postSubm = (_this$device = this.device).postSubmit) === null || _this$device$postSubm === void 0 ? void 0 : _this$device$postSubm.call(_this$device, values, this); // mark this form as being handled

    this.handlerExecuted = true;
  }
  /** @return {DataStorageObject} */


  getValues() {
    const formValues = [...this.inputs.credentials, ...this.inputs.identities, ...this.inputs.creditCards].reduce((output, inputEl) => {
      var _output$mainType, _value;

      const mainType = (0, _matching.getInputMainType)(inputEl);
      const subtype = (0, _matching.getInputSubtype)(inputEl);
      let value = inputEl.value || ((_output$mainType = output[mainType]) === null || _output$mainType === void 0 ? void 0 : _output$mainType[subtype]);

      if (subtype === 'addressCountryCode') {
        value = (0, _formatters.inferCountryCodeFromElement)(inputEl);
      } // Discard passwords that are shorter than 4 characters


      if (subtype === 'password' && ((_value = value) === null || _value === void 0 ? void 0 : _value.length) <= 3) {
        value = undefined;
      }

      if (value) {
        output[mainType][subtype] = value;
      }

      return output;
    }, {
      credentials: {},
      creditCards: {},
      identities: {}
    });

    if (formValues.credentials.password && !formValues.credentials.username && !formValues.identities.emailAddress) {
      // If we have a password but no username, let's search further
      const hiddenFields =
      /** @type [HTMLInputElement] */
      [...this.form.querySelectorAll('input[type=hidden]')];
      const probableField = hiddenFields.find(field => {
        var _this$matching$ddgMat;

        const regex = (0, _matching.safeRegex)('email|' + ((_this$matching$ddgMat = this.matching.ddgMatcher('username')) === null || _this$matching$ddgMat === void 0 ? void 0 : _this$matching$ddgMat.match));
        const attributeText = field.id + ' ' + field.name;
        return regex === null || regex === void 0 ? void 0 : regex.test(attributeText);
      });

      if (probableField !== null && probableField !== void 0 && probableField.value) {
        formValues.credentials.username = probableField.value;
      } else {
        // If we still don't have a username, try scanning the form's text for an email address
        this.form.querySelectorAll('*:not(select):not(option)').forEach(el => {
          var _elText$match;

          const elText = (0, _autofillUtils.getText)(el);
          const emailOrUsername = (_elText$match = elText.match( // https://www.emailregex.com/
          /[a-zA-Z\d.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z\d-]+(?:\.[a-zA-Z\d-]+)*/)) === null || _elText$match === void 0 ? void 0 : _elText$match[0];

          if (emailOrUsername) {
            formValues.credentials.username = emailOrUsername;
          }
        });
      }
    }

    return (0, _formatters.prepareFormValuesForStorage)(formValues);
  }
  /**
   * Determine if the form has values we want to store in the device
   * @param {DataStorageObject} [values]
   * @return {boolean}
   */


  hasValues(values) {
    const {
      credentials,
      creditCards,
      identities
    } = values || this.getValues();
    return Boolean(credentials || creditCards || identities);
  }

  removeTooltip() {
    var _this$intObs;

    const tooltip = this.device.isTooltipActive();

    if (this.isAutofilling || !tooltip) {
      return;
    }

    this.device.removeTooltip();
    (_this$intObs = this.intObs) === null || _this$intObs === void 0 ? void 0 : _this$intObs.disconnect();
  }

  showingTooltip(input) {
    var _this$intObs2;

    (_this$intObs2 = this.intObs) === null || _this$intObs2 === void 0 ? void 0 : _this$intObs2.observe(input);
  }

  removeInputHighlight(input) {
    (0, _autofillUtils.removeInlineStyles)(input, (0, _inputStyles.getIconStylesAutofilled)(input, this));
    input.classList.remove('ddg-autofilled');
    this.addAutofillStyles(input);
  }

  removeAllHighlights(e, dataType) {
    // This ensures we are not removing the highlight ourselves when autofilling more than once
    if (e && !e.isTrusted) return; // If the user has changed the value, we prompt to update the stored creds

    this.shouldPromptToStoreCredentials = true;
    this.execOnInputs(input => this.removeInputHighlight(input), dataType);
  }

  removeInputDecoration(input) {
    (0, _autofillUtils.removeInlineStyles)(input, (0, _inputStyles.getIconStylesBase)(input, this));
    input.removeAttribute(ATTR_AUTOFILL);
  }

  removeAllDecorations() {
    this.execOnInputs(input => this.removeInputDecoration(input));
    this.listeners.forEach(_ref => {
      let {
        el,
        type,
        fn
      } = _ref;
      return el.removeEventListener(type, fn);
    });
  }

  redecorateAllInputs() {
    this.removeAllDecorations();
    this.execOnInputs(input => {
      if (input instanceof HTMLInputElement) {
        this.decorateInput(input);
      }
    });
  }

  resetAllInputs() {
    this.execOnInputs(input => {
      (0, _autofillUtils.setValue)(input, '', this.device.globalConfig);
      this.removeInputHighlight(input);
    });
    if (this.activeInput) this.activeInput.focus();
    this.matching.clear();
  }

  dismissTooltip() {
    this.removeTooltip();
  } // This removes all listeners to avoid memory leaks and weird behaviours


  destroy() {
    this.removeAllDecorations();
    this.removeTooltip();
    this.matching.clear();
    this.intObs = null;
  }

  categorizeInputs() {
    const selector = this.matching.cssSelector('FORM_INPUTS_SELECTOR');
    this.form.querySelectorAll(selector).forEach(input => this.addInput(input));
  }

  get submitButtons() {
    const selector = this.matching.cssSelector('SUBMIT_BUTTON_SELECTOR');
    const allButtons =
    /** @type {HTMLElement[]} */
    [...this.form.querySelectorAll(selector)];
    return allButtons.filter(btn => (0, _autofillUtils.isVisible)(btn) && (0, _autofillUtils.isLikelyASubmitButton)(btn) && (0, _autofillUtils.buttonMatchesFormType)(btn, this));
  }

  attemptSubmissionIfNeeded() {
    if (!this.isLogin || // Only submit login forms
    this.submitButtons.length > 1 || // Do not submit if we're unsure about the submit button
    !this.isValid() // Do not submit invalid forms
    ) return; // check for visible empty fields before attemtping submission
    // this is to avoid loops where a captcha keeps failing for the user

    let isThereAnEmptyVisibleField = false;
    this.execOnInputs(input => {
      if (input.value === '' && (0, _autofillUtils.isVisible)(input)) isThereAnEmptyVisibleField = true;
    }, 'all', false);
    if (isThereAnEmptyVisibleField) return; // We're not using .submit() to minimise breakage with client-side forms

    this.submitButtons.forEach(button => {
      if ((0, _autofillUtils.isVisible)(button)) {
        button.click();
      }
    });
  }
  /**
   * Executes a function on input elements. Can be limited to certain element types
   * @param {(input: HTMLInputElement|HTMLSelectElement) => void} fn
   * @param {'all' | SupportedMainTypes} inputType
   * @param {boolean} shouldCheckForDecorate
   */


  execOnInputs(fn) {
    let inputType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'all';
    let shouldCheckForDecorate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    const inputs = this.inputs[inputType];

    for (const input of inputs) {
      let canExecute = true; // sometimes we want to execute even if we didn't decorate

      if (shouldCheckForDecorate) {
        canExecute = (0, _inputTypeConfig.isFieldDecorated)(input);
      }

      if (canExecute) fn(input);
    }
  }

  addInput(input) {
    // Nothing to do with 1-character fields
    if (input.maxLength === 1) return this;
    if (this.inputs.all.has(input)) return this;
    this.inputs.all.add(input);
    this.matching.setInputType(input, this.form, {
      isLogin: this.isLogin
    });
    const mainInputType = (0, _matching.getInputMainType)(input);
    this.inputs[mainInputType].add(input);
    this.decorateInput(input);
    return this;
  }

  addListener(el, type, fn) {
    el.addEventListener(type, fn);
    this.listeners.add({
      el,
      type,
      fn
    });
  }

  addAutofillStyles(input) {
    const styles = (0, _inputStyles.getIconStylesBase)(input, this);
    (0, _autofillUtils.addInlineStyles)(input, styles);
  }
  /**
   * Decorate here means adding listeners and an optional icon
   * @param {HTMLInputElement} input
   * @returns {Promise<Form>}
   */


  async decorateInput(input) {
    const config = (0, _inputTypeConfig.getInputConfig)(input);
    const shouldDecorate = await config.shouldDecorate(input, this);
    if (!shouldDecorate) return this;
    input.setAttribute(ATTR_AUTOFILL, 'true');
    const hasIcon = !!config.getIconBase(input, this);

    if (hasIcon) {
      this.addAutofillStyles(input);
      this.addListener(input, 'mousemove', e => {
        if ((0, _autofillUtils.isEventWithinDax)(e, e.target)) {
          e.target.style.setProperty('cursor', 'pointer', 'important');
        } else {
          e.target.style.removeProperty('cursor');
        }
      });
    }

    function getMainClickCoords(e) {
      if (!e.isTrusted) return;
      const isMainMouseButton = e.button === 0;
      if (!isMainMouseButton) return;
      return {
        x: e.clientX,
        y: e.clientY
      };
    } // Store the click to a label so we can use the click when the field is focused


    let storedClick = new WeakMap();
    let timeout = null;

    const handlerLabel = e => {
      // Look for e.target OR it's closest parent to be a HTMLLabelElement
      const control = e.target.closest('label').control;
      if (!control) return;
      storedClick.set(control, getMainClickCoords(e));
      clearTimeout(timeout); // Remove the stored click if the timer expires

      timeout = setTimeout(() => {
        storedClick = new WeakMap();
      }, 1000);
    };

    const handler = e => {
      if (this.isAutofilling) {
        return;
      }

      const input = e.target;
      let click = null;
      if (!(0, _inputTypeConfig.canBeInteractedWith)(input)) return; // Checks for pointerdown event

      if (e.type === 'pointerdown') {
        click = getMainClickCoords(e);
        if (!click) return;
      } else if (storedClick) {
        // Reuse a previous click if one exists for this element
        click = storedClick.get(input);
        storedClick.delete(input);
      }

      if (this.shouldOpenTooltip(e, input)) {
        if (this.device.globalConfig.isMobileApp && // Avoid the icon capturing clicks on small fields making it impossible to focus
        input.offsetWidth > 50 && (0, _autofillUtils.isEventWithinDax)(e, input)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }

        this.touched.add(input);
        this.device.attachTooltip(this, input, click);
      }
    };

    if (!(input instanceof HTMLSelectElement)) {
      var _input$labels;

      const events = ['pointerdown'];
      if (!this.device.globalConfig.isMobileApp) events.push('focus');
      (_input$labels = input.labels) === null || _input$labels === void 0 ? void 0 : _input$labels.forEach(label => {
        this.addListener(label, 'pointerdown', handlerLabel);
      });
      events.forEach(ev => this.addListener(input, ev, handler));
    }

    return this;
  }

  shouldOpenTooltip(e, input) {
    if (this.device.globalConfig.isApp) return true;
    if (this.device.globalConfig.isWindows) return true;
    return !this.touched.has(input) && !input.classList.contains('ddg-autofilled') || (0, _autofillUtils.isEventWithinDax)(e, input);
  }

  autofillInput(input, string, dataType) {
    // Do not autofill if it's invisible (select elements can be hidden because of custom implementations)
    if (input instanceof HTMLInputElement && !(0, _autofillUtils.isVisible)(input)) return; // Do not autofill if it's disabled or readonly to avoid potential breakage

    if (!(0, _inputTypeConfig.canBeInteractedWith)(input)) return; // @ts-ignore

    const activeInputSubtype = (0, _matching.getInputSubtype)(this.activeInput);
    const inputSubtype = (0, _matching.getInputSubtype)(input);
    const isEmailAutofill = activeInputSubtype === 'emailAddress' && inputSubtype === 'emailAddress'; // Don't override values for identities, unless it's the current input or we're autofilling email

    if (dataType === 'identities' && // only for identities
    input.nodeName !== 'SELECT' && input.value !== '' && // if the input is not empty
    this.activeInput !== input && // and this is not the active input
    !isEmailAutofill // and we're not auto-filling email
    ) return; // do not overwrite the value
    // If the value is already there, just return

    if (input.value === string) return;
    const successful = (0, _autofillUtils.setValue)(input, string, this.device.globalConfig);
    if (!successful) return;
    input.classList.add('ddg-autofilled');
    (0, _autofillUtils.addInlineStyles)(input, (0, _inputStyles.getIconStylesAutofilled)(input, this)); // If the user changes the value, remove the decoration

    input.addEventListener('input', e => this.removeAllHighlights(e, dataType), {
      once: true
    });
  }
  /**
   * Autofill method for email protection only
   * @param {string} alias
   * @param {'all' | SupportedMainTypes} dataType
   */


  autofillEmail(alias) {
    let dataType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'identities';
    this.isAutofilling = true;
    this.execOnInputs(input => {
      const inputSubtype = (0, _matching.getInputSubtype)(input);

      if (inputSubtype === 'emailAddress') {
        this.autofillInput(input, alias, dataType);
      }
    }, dataType);
    this.isAutofilling = false;
    this.removeTooltip();
  }

  autofillData(data, dataType) {
    var _this$device$postAuto, _this$device2;

    this.shouldPromptToStoreData = false;
    this.isAutofilling = true;
    this.execOnInputs(input => {
      const inputSubtype = (0, _matching.getInputSubtype)(input);
      let autofillData = data[inputSubtype];

      if (inputSubtype === 'expiration' && input instanceof HTMLInputElement) {
        autofillData = (0, _formatters.getUnifiedExpiryDate)(input, data.expirationMonth, data.expirationYear, this);
      }

      if (inputSubtype === 'expirationYear' && input instanceof HTMLInputElement) {
        autofillData = (0, _formatters.formatCCYear)(input, autofillData, this);
      }

      if (inputSubtype === 'addressCountryCode') {
        autofillData = (0, _formatters.getCountryName)(input, data);
      }

      if (autofillData) this.autofillInput(input, autofillData, dataType);
    }, dataType);
    this.isAutofilling = false;
    (_this$device$postAuto = (_this$device2 = this.device).postAutofill) === null || _this$device$postAuto === void 0 ? void 0 : _this$device$postAuto.call(_this$device2, data, dataType, this);
    this.removeTooltip();
  }

  getFirstViableCredentialsInput() {
    return [...this.inputs.credentials].find(input => (0, _inputTypeConfig.canBeInteractedWith)(input) && (0, _autofillUtils.isVisible)(input));
  }

  async promptLoginIfNeeded() {
    if (document.visibilityState !== 'visible' || !this.isLogin) return;
    const firstCredentialInput = this.getFirstViableCredentialsInput();
    const input = this.activeInput || firstCredentialInput;
    if (!input) return;
    const mainType = (0, _matching.getInputMainType)(input);
    const subtype = (0, _matching.getInputSubtype)(input);

    if (await this.device.settings.canAutofillType(mainType, subtype)) {
      // The timeout is needed in case the page shows a cookie prompt with a slight delay
      setTimeout(() => {
        // safeExecute checks that the element is on screen according to IntersectionObserver
        (0, _autofillUtils.safeExecute)(this.form, () => {
          const {
            x,
            y,
            width,
            height
          } = this.form.getBoundingClientRect();
          const elHCenter = x + width / 2;
          const elVCenter = y + height / 2; // This checks that the form is not covered by anything else

          const topMostElementFromPoint = document.elementFromPoint(elHCenter, elVCenter);

          if (this.form.contains(topMostElementFromPoint)) {
            this.execOnInputs(input => {
              if ((0, _autofillUtils.isVisible)(input)) {
                this.touched.add(input);
              }
            }, 'credentials');
            this.device.attachTooltip(this, input, null, 'autoprompt');
          }
        });
      }, 200);
    }
  }

}

exports.Form = Form;

},{"../autofill-utils.js":59,"../constants.js":62,"./FormAnalyzer.js":33,"./formatters.js":35,"./inputStyles.js":36,"./inputTypeConfig.js":37,"./matching.js":41}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _matching = require("./matching.js");

var _constants = require("../constants.js");

var _matchingConfiguration = require("./matching-configuration.js");

var _autofillUtils = require("../autofill-utils.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const negativeRegex = new RegExp(/sign(ing)?.?in(?!g)|log.?in|unsubscri|(forgot(ten)?|reset) (your )?password|password (forgotten|lost)/i);
const positiveRegex = new RegExp(/sign(ing)?.?up|join|\bregist(er|ration)|newsletter|\bsubscri(be|ption)|contact|create|start|enroll|settings|preferences|profile|update|checkout|guest|purchase|buy|order|schedule|estimate|request|new.?customer|(confirm|retype|repeat|reset) password|password confirm?/i);
const conservativePositiveRegex = new RegExp(/sign.?up|join|register|enroll|newsletter|subscri(be|ption)|settings|preferences|profile|update/i);
const strictPositiveRegex = new RegExp(/sign.?up|join|register|enroll|settings|preferences|profile|update/i);

class FormAnalyzer {
  /** @type HTMLElement */

  /** @type Matching */

  /**
   * @param {HTMLElement} form
   * @param {HTMLInputElement|HTMLSelectElement} input
   * @param {Matching} [matching]
   */
  constructor(form, input, matching) {
    _defineProperty(this, "form", void 0);

    _defineProperty(this, "matching", void 0);

    this.form = form;
    this.matching = matching || new _matching.Matching(_matchingConfiguration.matchingConfiguration);
    this.autofillSignal = 0;
    this.signals = []; // Avoid autofill on our signup page

    if (window.location.href.match(/^https:\/\/(.+\.)?duckduckgo\.com\/email\/choose-address/i)) {
      return this;
    }

    this.evaluateElAttributes(input, 3, true);
    form ? this.evaluateForm() : this.evaluatePage();
    return this;
  }

  get isLogin() {
    return this.autofillSignal < 0;
  }

  get isSignup() {
    return this.autofillSignal >= 0;
  }

  increaseSignalBy(strength, signal) {
    this.autofillSignal += strength;
    this.signals.push("".concat(signal, ": +").concat(strength));
    return this;
  }

  decreaseSignalBy(strength, signal) {
    this.autofillSignal -= strength;
    this.signals.push("".concat(signal, ": -").concat(strength));
    return this;
  }
  /**
   *
   * @param {object} p
   * @param {string} p.string - The string to check
   * @param {number} p.strength - Strength of the signal
   * @param {string} [p.signalType] - For debugging purposes, we give a name to the signal
   * @param {boolean} [p.shouldFlip] - Flips the signals, i.e. when a link points outside. See below
   * @param {boolean} [p.shouldCheckUnifiedForm] - Should check for login/signup forms
   * @param {boolean} [p.shouldBeConservative] - Should use the conservative signup regex
   * @returns {FormAnalyzer}
   */


  updateSignal(_ref) {
    let {
      string,
      strength,
      signalType = 'generic',
      shouldFlip = false,
      shouldCheckUnifiedForm = false,
      shouldBeConservative = false
    } = _ref;
    const matchesNegative = string === 'current-password' || negativeRegex.test(string); // Check explicitly for unified login/signup forms. They should always be negative, so we increase signal

    if (shouldCheckUnifiedForm && matchesNegative && strictPositiveRegex.test(string)) {
      this.decreaseSignalBy(strength + 2, "Unified detected ".concat(signalType));
      return this;
    }

    const positiveRegexToUse = shouldBeConservative ? conservativePositiveRegex : positiveRegex;
    const matchesPositive = string === 'new-password' || positiveRegexToUse.test(string); // In some cases a login match means the login is somewhere else, i.e. when a link points outside

    if (shouldFlip) {
      if (matchesNegative) this.increaseSignalBy(strength, signalType);
      if (matchesPositive) this.decreaseSignalBy(strength, signalType);
    } else {
      if (matchesNegative) this.decreaseSignalBy(strength, signalType);
      if (matchesPositive) this.increaseSignalBy(strength, signalType);
    }

    return this;
  }

  evaluateElAttributes(el) {
    let signalStrength = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;
    let isInput = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    Array.from(el.attributes).forEach(attr => {
      if (attr.name === 'style') return;
      const attributeString = "".concat(attr.name, "=").concat(attr.value);
      this.updateSignal({
        string: attributeString,
        strength: signalStrength,
        signalType: "".concat(el.name, " attr: ").concat(attributeString),
        shouldCheckUnifiedForm: isInput
      });
    });
  }

  evaluatePageTitle() {
    const pageTitle = document.title;
    this.updateSignal({
      string: pageTitle,
      strength: 2,
      signalType: "page title: ".concat(pageTitle)
    });
  }

  evaluatePageHeadings() {
    const headings = document.querySelectorAll('h1, h2, h3, [class*="title"], [id*="title"]');

    if (headings) {
      headings.forEach(_ref2 => {
        let {
          textContent
        } = _ref2;
        textContent = (0, _matching.removeExcessWhitespace)(textContent || '');
        this.updateSignal({
          string: textContent,
          strength: 0.5,
          signalType: "heading: ".concat(textContent),
          shouldCheckUnifiedForm: true,
          shouldBeConservative: true
        });
      });
    }
  }

  evaluatePage() {
    this.evaluatePageTitle();
    this.evaluatePageHeadings(); // Check for submit buttons

    const buttons = document.querySelectorAll("\n                button[type=submit],\n                button:not([type]),\n                [role=button]\n            ");
    buttons.forEach(button => {
      // if the button has a form, it's not related to our input, because our input has no form here
      if (button instanceof HTMLButtonElement) {
        if (!button.form && !button.closest('form')) {
          this.evaluateElement(button);
          this.evaluateElAttributes(button, 0.5);
        }
      }
    });
  }

  evaluateElement(el) {
    const string = (0, _autofillUtils.getText)(el);

    if (el.matches(this.matching.cssSelector('password'))) {
      // These are explicit signals by the web author, so we weigh them heavily
      this.updateSignal({
        string: el.getAttribute('autocomplete') || '',
        strength: 10,
        signalType: "explicit: ".concat(el.getAttribute('autocomplete'))
      });
    } // check button contents


    if (el.matches(this.matching.cssSelector('SUBMIT_BUTTON_SELECTOR'))) {
      // If we're confident this is a submit button, it's a stronger signal
      const strength = (0, _autofillUtils.isLikelyASubmitButton)(el) ? 20 : 2;
      this.updateSignal({
        string,
        strength,
        signalType: "submit: ".concat(string)
      });
    } // if an external link matches one of the regexes, we assume the match is not pertinent to the current form


    if (el instanceof HTMLAnchorElement && el.href && el.getAttribute('href') !== '#' || (el.getAttribute('role') || '').toUpperCase() === 'LINK' || el.matches('button[class*=secondary]')) {
      // Unless it's a forgotten password link, we don't flip those links
      let shouldFlip = true;

      if (/(forgot(ten)?|reset) (your )?password|password forgotten/i.test(string)) {
        shouldFlip = false;
      }

      this.updateSignal({
        string,
        strength: 1,
        signalType: "external link: ".concat(string),
        shouldFlip
      });
    } else {
      var _removeExcessWhitespa;

      // any other case
      // only consider the el if it's a small text to avoid noisy disclaimers
      if (((_removeExcessWhitespa = (0, _matching.removeExcessWhitespace)(el.textContent)) === null || _removeExcessWhitespa === void 0 ? void 0 : _removeExcessWhitespa.length) < _constants.constants.TEXT_LENGTH_CUTOFF) {
        this.updateSignal({
          string,
          strength: 1,
          signalType: "generic: ".concat(string),
          shouldCheckUnifiedForm: true
        });
      }
    }
  }

  evaluateForm() {
    // Check page title
    this.evaluatePageTitle(); // Check form attributes

    this.evaluateElAttributes(this.form); // Check form contents (skip select and option because they contain too much noise)

    this.form.querySelectorAll('*:not(select):not(option):not(script)').forEach(el => {
      // Check if element is not hidden. Note that we can't use offsetHeight
      // nor intersectionObserver, because the element could be outside the
      // viewport or its parent hidden
      const displayValue = window.getComputedStyle(el, null).getPropertyValue('display');
      if (displayValue !== 'none') this.evaluateElement(el);
    }); // A form with many fields is unlikely to be a login form

    const relevantFields = this.form.querySelectorAll(this.matching.cssSelector('GENERIC_TEXT_FIELD'));

    if (relevantFields.length > 4) {
      this.increaseSignalBy(relevantFields.length * 1.5, 'many fields: it is probably not a login');
    } // If we can't decide at this point, try reading page headings


    if (this.autofillSignal === 0) {
      this.evaluatePageHeadings();
    }

    return this;
  }

}

var _default = FormAnalyzer;
exports.default = _default;

},{"../autofill-utils.js":59,"../constants.js":62,"./matching-configuration.js":40,"./matching.js":41}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.COUNTRY_NAMES_TO_CODES = exports.COUNTRY_CODES_TO_NAMES = void 0;

/**
 * Country names object using 2-letter country codes to reference country name
 * Derived from the Intl.DisplayNames implementation
 * @source https://stackoverflow.com/a/70517921/1948947
 */
const COUNTRY_CODES_TO_NAMES = {
  AC: 'Ascension Island',
  AD: 'Andorra',
  AE: 'United Arab Emirates',
  AF: 'Afghanistan',
  AG: 'Antigua & Barbuda',
  AI: 'Anguilla',
  AL: 'Albania',
  AM: 'Armenia',
  AN: 'Curaçao',
  AO: 'Angola',
  AQ: 'Antarctica',
  AR: 'Argentina',
  AS: 'American Samoa',
  AT: 'Austria',
  AU: 'Australia',
  AW: 'Aruba',
  AX: 'Åland Islands',
  AZ: 'Azerbaijan',
  BA: 'Bosnia & Herzegovina',
  BB: 'Barbados',
  BD: 'Bangladesh',
  BE: 'Belgium',
  BF: 'Burkina Faso',
  BG: 'Bulgaria',
  BH: 'Bahrain',
  BI: 'Burundi',
  BJ: 'Benin',
  BL: 'St. Barthélemy',
  BM: 'Bermuda',
  BN: 'Brunei',
  BO: 'Bolivia',
  BQ: 'Caribbean Netherlands',
  BR: 'Brazil',
  BS: 'Bahamas',
  BT: 'Bhutan',
  BU: 'Myanmar (Burma)',
  BV: 'Bouvet Island',
  BW: 'Botswana',
  BY: 'Belarus',
  BZ: 'Belize',
  CA: 'Canada',
  CC: 'Cocos (Keeling) Islands',
  CD: 'Congo - Kinshasa',
  CF: 'Central African Republic',
  CG: 'Congo - Brazzaville',
  CH: 'Switzerland',
  CI: 'Côte d’Ivoire',
  CK: 'Cook Islands',
  CL: 'Chile',
  CM: 'Cameroon',
  CN: 'China mainland',
  CO: 'Colombia',
  CP: 'Clipperton Island',
  CR: 'Costa Rica',
  CS: 'Serbia',
  CU: 'Cuba',
  CV: 'Cape Verde',
  CW: 'Curaçao',
  CX: 'Christmas Island',
  CY: 'Cyprus',
  CZ: 'Czechia',
  DD: 'Germany',
  DE: 'Germany',
  DG: 'Diego Garcia',
  DJ: 'Djibouti',
  DK: 'Denmark',
  DM: 'Dominica',
  DO: 'Dominican Republic',
  DY: 'Benin',
  DZ: 'Algeria',
  EA: 'Ceuta & Melilla',
  EC: 'Ecuador',
  EE: 'Estonia',
  EG: 'Egypt',
  EH: 'Western Sahara',
  ER: 'Eritrea',
  ES: 'Spain',
  ET: 'Ethiopia',
  EU: 'European Union',
  EZ: 'Eurozone',
  FI: 'Finland',
  FJ: 'Fiji',
  FK: 'Falkland Islands',
  FM: 'Micronesia',
  FO: 'Faroe Islands',
  FR: 'France',
  FX: 'France',
  GA: 'Gabon',
  GB: 'United Kingdom',
  GD: 'Grenada',
  GE: 'Georgia',
  GF: 'French Guiana',
  GG: 'Guernsey',
  GH: 'Ghana',
  GI: 'Gibraltar',
  GL: 'Greenland',
  GM: 'Gambia',
  GN: 'Guinea',
  GP: 'Guadeloupe',
  GQ: 'Equatorial Guinea',
  GR: 'Greece',
  GS: 'So. Georgia & So. Sandwich Isl.',
  GT: 'Guatemala',
  GU: 'Guam',
  GW: 'Guinea-Bissau',
  GY: 'Guyana',
  HK: 'Hong Kong',
  HM: 'Heard & McDonald Islands',
  HN: 'Honduras',
  HR: 'Croatia',
  HT: 'Haiti',
  HU: 'Hungary',
  HV: 'Burkina Faso',
  IC: 'Canary Islands',
  ID: 'Indonesia',
  IE: 'Ireland',
  IL: 'Israel',
  IM: 'Isle of Man',
  IN: 'India',
  IO: 'Chagos Archipelago',
  IQ: 'Iraq',
  IR: 'Iran',
  IS: 'Iceland',
  IT: 'Italy',
  JE: 'Jersey',
  JM: 'Jamaica',
  JO: 'Jordan',
  JP: 'Japan',
  KE: 'Kenya',
  KG: 'Kyrgyzstan',
  KH: 'Cambodia',
  KI: 'Kiribati',
  KM: 'Comoros',
  KN: 'St. Kitts & Nevis',
  KP: 'North Korea',
  KR: 'South Korea',
  KW: 'Kuwait',
  KY: 'Cayman Islands',
  KZ: 'Kazakhstan',
  LA: 'Laos',
  LB: 'Lebanon',
  LC: 'St. Lucia',
  LI: 'Liechtenstein',
  LK: 'Sri Lanka',
  LR: 'Liberia',
  LS: 'Lesotho',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  LV: 'Latvia',
  LY: 'Libya',
  MA: 'Morocco',
  MC: 'Monaco',
  MD: 'Moldova',
  ME: 'Montenegro',
  MF: 'St. Martin',
  MG: 'Madagascar',
  MH: 'Marshall Islands',
  MK: 'North Macedonia',
  ML: 'Mali',
  MM: 'Myanmar (Burma)',
  MN: 'Mongolia',
  MO: 'Macao',
  MP: 'Northern Mariana Islands',
  MQ: 'Martinique',
  MR: 'Mauritania',
  MS: 'Montserrat',
  MT: 'Malta',
  MU: 'Mauritius',
  MV: 'Maldives',
  MW: 'Malawi',
  MX: 'Mexico',
  MY: 'Malaysia',
  MZ: 'Mozambique',
  NA: 'Namibia',
  NC: 'New Caledonia',
  NE: 'Niger',
  NF: 'Norfolk Island',
  NG: 'Nigeria',
  NH: 'Vanuatu',
  NI: 'Nicaragua',
  NL: 'Netherlands',
  NO: 'Norway',
  NP: 'Nepal',
  NR: 'Nauru',
  NU: 'Niue',
  NZ: 'New Zealand',
  OM: 'Oman',
  PA: 'Panama',
  PE: 'Peru',
  PF: 'French Polynesia',
  PG: 'Papua New Guinea',
  PH: 'Philippines',
  PK: 'Pakistan',
  PL: 'Poland',
  PM: 'St. Pierre & Miquelon',
  PN: 'Pitcairn Islands',
  PR: 'Puerto Rico',
  PS: 'Palestinian Territories',
  PT: 'Portugal',
  PW: 'Palau',
  PY: 'Paraguay',
  QA: 'Qatar',
  QO: 'Outlying Oceania',
  RE: 'Réunion',
  RH: 'Zimbabwe',
  RO: 'Romania',
  RS: 'Serbia',
  RU: 'Russia',
  RW: 'Rwanda',
  SA: 'Saudi Arabia',
  SB: 'Solomon Islands',
  SC: 'Seychelles',
  SD: 'Sudan',
  SE: 'Sweden',
  SG: 'Singapore',
  SH: 'St. Helena',
  SI: 'Slovenia',
  SJ: 'Svalbard & Jan Mayen',
  SK: 'Slovakia',
  SL: 'Sierra Leone',
  SM: 'San Marino',
  SN: 'Senegal',
  SO: 'Somalia',
  SR: 'Suriname',
  SS: 'South Sudan',
  ST: 'São Tomé & Príncipe',
  SU: 'Russia',
  SV: 'El Salvador',
  SX: 'Sint Maarten',
  SY: 'Syria',
  SZ: 'Eswatini',
  TA: 'Tristan da Cunha',
  TC: 'Turks & Caicos Islands',
  TD: 'Chad',
  TF: 'French Southern Territories',
  TG: 'Togo',
  TH: 'Thailand',
  TJ: 'Tajikistan',
  TK: 'Tokelau',
  TL: 'Timor-Leste',
  TM: 'Turkmenistan',
  TN: 'Tunisia',
  TO: 'Tonga',
  TP: 'Timor-Leste',
  TR: 'Turkey',
  TT: 'Trinidad & Tobago',
  TV: 'Tuvalu',
  TW: 'Taiwan',
  TZ: 'Tanzania',
  UA: 'Ukraine',
  UG: 'Uganda',
  UK: 'United Kingdom',
  UM: 'U.S. Outlying Islands',
  UN: 'United Nations',
  US: 'United States',
  UY: 'Uruguay',
  UZ: 'Uzbekistan',
  VA: 'Vatican City',
  VC: 'St. Vincent & Grenadines',
  VD: 'Vietnam',
  VE: 'Venezuela',
  VG: 'British Virgin Islands',
  VI: 'U.S. Virgin Islands',
  VN: 'Vietnam',
  VU: 'Vanuatu',
  WF: 'Wallis & Futuna',
  WS: 'Samoa',
  XA: 'Pseudo-Accents',
  XB: 'Pseudo-Bidi',
  XK: 'Kosovo',
  YD: 'Yemen',
  YE: 'Yemen',
  YT: 'Mayotte',
  YU: 'Serbia',
  ZA: 'South Africa',
  ZM: 'Zambia',
  ZR: 'Congo - Kinshasa',
  ZW: 'Zimbabwe',
  ZZ: 'Unknown Region'
};
/**
 * Country names object using country name to reference 2-letter country codes
 * Derived from the solution above with
 * Object.fromEntries(Object.entries(COUNTRY_CODES_TO_NAMES).map(entry => [entry[1], entry[0]]))
 */

exports.COUNTRY_CODES_TO_NAMES = COUNTRY_CODES_TO_NAMES;
const COUNTRY_NAMES_TO_CODES = {
  'Ascension Island': 'AC',
  Andorra: 'AD',
  'United Arab Emirates': 'AE',
  Afghanistan: 'AF',
  'Antigua & Barbuda': 'AG',
  Anguilla: 'AI',
  Albania: 'AL',
  Armenia: 'AM',
  'Curaçao': 'CW',
  Angola: 'AO',
  Antarctica: 'AQ',
  Argentina: 'AR',
  'American Samoa': 'AS',
  Austria: 'AT',
  Australia: 'AU',
  Aruba: 'AW',
  'Åland Islands': 'AX',
  Azerbaijan: 'AZ',
  'Bosnia & Herzegovina': 'BA',
  Barbados: 'BB',
  Bangladesh: 'BD',
  Belgium: 'BE',
  'Burkina Faso': 'HV',
  Bulgaria: 'BG',
  Bahrain: 'BH',
  Burundi: 'BI',
  Benin: 'DY',
  'St. Barthélemy': 'BL',
  Bermuda: 'BM',
  Brunei: 'BN',
  Bolivia: 'BO',
  'Caribbean Netherlands': 'BQ',
  Brazil: 'BR',
  Bahamas: 'BS',
  Bhutan: 'BT',
  'Myanmar (Burma)': 'MM',
  'Bouvet Island': 'BV',
  Botswana: 'BW',
  Belarus: 'BY',
  Belize: 'BZ',
  Canada: 'CA',
  'Cocos (Keeling) Islands': 'CC',
  'Congo - Kinshasa': 'ZR',
  'Central African Republic': 'CF',
  'Congo - Brazzaville': 'CG',
  Switzerland: 'CH',
  'Côte d’Ivoire': 'CI',
  'Cook Islands': 'CK',
  Chile: 'CL',
  Cameroon: 'CM',
  'China mainland': 'CN',
  Colombia: 'CO',
  'Clipperton Island': 'CP',
  'Costa Rica': 'CR',
  Serbia: 'YU',
  Cuba: 'CU',
  'Cape Verde': 'CV',
  'Christmas Island': 'CX',
  Cyprus: 'CY',
  Czechia: 'CZ',
  Germany: 'DE',
  'Diego Garcia': 'DG',
  Djibouti: 'DJ',
  Denmark: 'DK',
  Dominica: 'DM',
  'Dominican Republic': 'DO',
  Algeria: 'DZ',
  'Ceuta & Melilla': 'EA',
  Ecuador: 'EC',
  Estonia: 'EE',
  Egypt: 'EG',
  'Western Sahara': 'EH',
  Eritrea: 'ER',
  Spain: 'ES',
  Ethiopia: 'ET',
  'European Union': 'EU',
  Eurozone: 'EZ',
  Finland: 'FI',
  Fiji: 'FJ',
  'Falkland Islands': 'FK',
  Micronesia: 'FM',
  'Faroe Islands': 'FO',
  France: 'FX',
  Gabon: 'GA',
  'United Kingdom': 'UK',
  Grenada: 'GD',
  Georgia: 'GE',
  'French Guiana': 'GF',
  Guernsey: 'GG',
  Ghana: 'GH',
  Gibraltar: 'GI',
  Greenland: 'GL',
  Gambia: 'GM',
  Guinea: 'GN',
  Guadeloupe: 'GP',
  'Equatorial Guinea': 'GQ',
  Greece: 'GR',
  'So. Georgia & So. Sandwich Isl.': 'GS',
  Guatemala: 'GT',
  Guam: 'GU',
  'Guinea-Bissau': 'GW',
  Guyana: 'GY',
  'Hong Kong': 'HK',
  'Heard & McDonald Islands': 'HM',
  Honduras: 'HN',
  Croatia: 'HR',
  Haiti: 'HT',
  Hungary: 'HU',
  'Canary Islands': 'IC',
  Indonesia: 'ID',
  Ireland: 'IE',
  Israel: 'IL',
  'Isle of Man': 'IM',
  India: 'IN',
  'Chagos Archipelago': 'IO',
  Iraq: 'IQ',
  Iran: 'IR',
  Iceland: 'IS',
  Italy: 'IT',
  Jersey: 'JE',
  Jamaica: 'JM',
  Jordan: 'JO',
  Japan: 'JP',
  Kenya: 'KE',
  Kyrgyzstan: 'KG',
  Cambodia: 'KH',
  Kiribati: 'KI',
  Comoros: 'KM',
  'St. Kitts & Nevis': 'KN',
  'North Korea': 'KP',
  'South Korea': 'KR',
  Kuwait: 'KW',
  'Cayman Islands': 'KY',
  Kazakhstan: 'KZ',
  Laos: 'LA',
  Lebanon: 'LB',
  'St. Lucia': 'LC',
  Liechtenstein: 'LI',
  'Sri Lanka': 'LK',
  Liberia: 'LR',
  Lesotho: 'LS',
  Lithuania: 'LT',
  Luxembourg: 'LU',
  Latvia: 'LV',
  Libya: 'LY',
  Morocco: 'MA',
  Monaco: 'MC',
  Moldova: 'MD',
  Montenegro: 'ME',
  'St. Martin': 'MF',
  Madagascar: 'MG',
  'Marshall Islands': 'MH',
  'North Macedonia': 'MK',
  Mali: 'ML',
  Mongolia: 'MN',
  Macao: 'MO',
  'Northern Mariana Islands': 'MP',
  Martinique: 'MQ',
  Mauritania: 'MR',
  Montserrat: 'MS',
  Malta: 'MT',
  Mauritius: 'MU',
  Maldives: 'MV',
  Malawi: 'MW',
  Mexico: 'MX',
  Malaysia: 'MY',
  Mozambique: 'MZ',
  Namibia: 'NA',
  'New Caledonia': 'NC',
  Niger: 'NE',
  'Norfolk Island': 'NF',
  Nigeria: 'NG',
  Vanuatu: 'VU',
  Nicaragua: 'NI',
  Netherlands: 'NL',
  Norway: 'NO',
  Nepal: 'NP',
  Nauru: 'NR',
  Niue: 'NU',
  'New Zealand': 'NZ',
  Oman: 'OM',
  Panama: 'PA',
  Peru: 'PE',
  'French Polynesia': 'PF',
  'Papua New Guinea': 'PG',
  Philippines: 'PH',
  Pakistan: 'PK',
  Poland: 'PL',
  'St. Pierre & Miquelon': 'PM',
  'Pitcairn Islands': 'PN',
  'Puerto Rico': 'PR',
  'Palestinian Territories': 'PS',
  Portugal: 'PT',
  Palau: 'PW',
  Paraguay: 'PY',
  Qatar: 'QA',
  'Outlying Oceania': 'QO',
  'Réunion': 'RE',
  Zimbabwe: 'ZW',
  Romania: 'RO',
  Russia: 'SU',
  Rwanda: 'RW',
  'Saudi Arabia': 'SA',
  'Solomon Islands': 'SB',
  Seychelles: 'SC',
  Sudan: 'SD',
  Sweden: 'SE',
  Singapore: 'SG',
  'St. Helena': 'SH',
  Slovenia: 'SI',
  'Svalbard & Jan Mayen': 'SJ',
  Slovakia: 'SK',
  'Sierra Leone': 'SL',
  'San Marino': 'SM',
  Senegal: 'SN',
  Somalia: 'SO',
  Suriname: 'SR',
  'South Sudan': 'SS',
  'São Tomé & Príncipe': 'ST',
  'El Salvador': 'SV',
  'Sint Maarten': 'SX',
  Syria: 'SY',
  Eswatini: 'SZ',
  'Tristan da Cunha': 'TA',
  'Turks & Caicos Islands': 'TC',
  Chad: 'TD',
  'French Southern Territories': 'TF',
  Togo: 'TG',
  Thailand: 'TH',
  Tajikistan: 'TJ',
  Tokelau: 'TK',
  'Timor-Leste': 'TP',
  Turkmenistan: 'TM',
  Tunisia: 'TN',
  Tonga: 'TO',
  Turkey: 'TR',
  'Trinidad & Tobago': 'TT',
  Tuvalu: 'TV',
  Taiwan: 'TW',
  Tanzania: 'TZ',
  Ukraine: 'UA',
  Uganda: 'UG',
  'U.S. Outlying Islands': 'UM',
  'United Nations': 'UN',
  'United States': 'US',
  Uruguay: 'UY',
  Uzbekistan: 'UZ',
  'Vatican City': 'VA',
  'St. Vincent & Grenadines': 'VC',
  Vietnam: 'VN',
  Venezuela: 'VE',
  'British Virgin Islands': 'VG',
  'U.S. Virgin Islands': 'VI',
  'Wallis & Futuna': 'WF',
  Samoa: 'WS',
  'Pseudo-Accents': 'XA',
  'Pseudo-Bidi': 'XB',
  Kosovo: 'XK',
  Yemen: 'YE',
  Mayotte: 'YT',
  'South Africa': 'ZA',
  Zambia: 'ZM',
  'Unknown Region': 'ZZ'
};
exports.COUNTRY_NAMES_TO_CODES = COUNTRY_NAMES_TO_CODES;

},{}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareFormValuesForStorage = exports.inferCountryCodeFromElement = exports.getUnifiedExpiryDate = exports.getMMAndYYYYFromString = exports.getCountryName = exports.getCountryDisplayName = exports.formatFullName = exports.formatCCYear = void 0;

var _matching = require("./matching.js");

var _countryNames = require("./countryNames.js");

var _templateObject, _templateObject2;

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

// Matches strings like mm/yy, mm-yyyy, mm-aa, 12 / 2024
const DATE_SEPARATOR_REGEX = /\b((.)\2{1,3}|\d+)(?<separator>\s?[/\s.\-_—–]\s?)((.)\5{1,3}|\d+)\b/i; // Matches 4 non-digit repeated characters (YYYY or AAAA) or 4 digits (2022)

const FOUR_DIGIT_YEAR_REGEX = /(\D)\1{3}|\d{4}/i;
/**
 * Format the cc year to best adapt to the input requirements (YY vs YYYY)
 * @param {HTMLInputElement} input
 * @param {string} year
 * @param {import("./Form").Form} form
 * @returns {string}
 */

const formatCCYear = (input, year, form) => {
  const selector = form.matching.cssSelector('FORM_INPUTS_SELECTOR');
  if (input.maxLength === 4 || (0, _matching.checkPlaceholderAndLabels)(input, FOUR_DIGIT_YEAR_REGEX, form.form, selector)) return year;
  return "".concat(Number(year) - 2000);
};
/**
 * Get a unified expiry date with separator
 * @param {HTMLInputElement} input
 * @param {string} month
 * @param {string} year
 * @param {import("./Form").Form} form
 * @returns {string}
 */


exports.formatCCYear = formatCCYear;

const getUnifiedExpiryDate = (input, month, year, form) => {
  var _matchInPlaceholderAn, _matchInPlaceholderAn2;

  const formattedYear = formatCCYear(input, year, form);
  const paddedMonth = "".concat(month).padStart(2, '0');
  const cssSelector = form.matching.cssSelector('FORM_INPUTS_SELECTOR');
  const separator = ((_matchInPlaceholderAn = (0, _matching.matchInPlaceholderAndLabels)(input, DATE_SEPARATOR_REGEX, form.form, cssSelector)) === null || _matchInPlaceholderAn === void 0 ? void 0 : (_matchInPlaceholderAn2 = _matchInPlaceholderAn.groups) === null || _matchInPlaceholderAn2 === void 0 ? void 0 : _matchInPlaceholderAn2.separator) || '/';
  return "".concat(paddedMonth).concat(separator).concat(formattedYear);
};

exports.getUnifiedExpiryDate = getUnifiedExpiryDate;

const formatFullName = _ref => {
  let {
    firstName = '',
    middleName = '',
    lastName = ''
  } = _ref;
  return "".concat(firstName, " ").concat(middleName ? middleName + ' ' : '').concat(lastName).trim();
};
/**
 * Tries to look up a human-readable country name from the country code
 * @param {string} locale
 * @param {string} addressCountryCode
 * @return {string} - Returns the country code if we can't find a name
 */


exports.formatFullName = formatFullName;

const getCountryDisplayName = (locale, addressCountryCode) => {
  try {
    const regionNames = new Intl.DisplayNames([locale], {
      type: 'region'
    }); // Adding this ts-ignore to prevent having to change this implementation.
    // @ts-ignore

    return regionNames.of(addressCountryCode);
  } catch (e) {
    return _countryNames.COUNTRY_CODES_TO_NAMES[addressCountryCode] || addressCountryCode;
  }
};
/**
 * Tries to infer the element locale or returns 'en'
 * @param {HTMLInputElement | HTMLSelectElement} el
 * @return {string | 'en'}
 */


exports.getCountryDisplayName = getCountryDisplayName;

const inferElementLocale = el => {
  var _el$form;

  return el.lang || ((_el$form = el.form) === null || _el$form === void 0 ? void 0 : _el$form.lang) || document.body.lang || document.documentElement.lang || 'en';
};
/**
 * Tries to format the country code into a localised country name
 * @param {HTMLInputElement | HTMLSelectElement} el
 * @param {{addressCountryCode?: string}} options
 */


const getCountryName = function (el) {
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const {
    addressCountryCode
  } = options;
  if (!addressCountryCode) return ''; // Try to infer the field language or fallback to en

  const elLocale = inferElementLocale(el);
  const localisedCountryName = getCountryDisplayName(elLocale, addressCountryCode); // If it's a select el we try to find a suitable match to autofill

  if (el.nodeName === 'SELECT') {
    const englishCountryName = getCountryDisplayName('en', addressCountryCode); // This regex matches both the localised and English country names

    const countryNameRegex = new RegExp(String.raw(_templateObject || (_templateObject = _taggedTemplateLiteral(["", "|", ""])), localisedCountryName.replace(/ /g, '.?'), englishCountryName.replace(/ /g, '.?')), 'i');
    const countryCodeRegex = new RegExp(String.raw(_templateObject2 || (_templateObject2 = _taggedTemplateLiteral(["\b", "\b"], ["\\b", "\\b"])), addressCountryCode), 'i'); // We check the country code first because it's more accurate

    if (el instanceof HTMLSelectElement) {
      for (const option of el.options) {
        if (countryCodeRegex.test(option.value)) {
          return option.value;
        }
      }

      for (const option of el.options) {
        if (countryNameRegex.test(option.value) || countryNameRegex.test(option.innerText)) return option.value;
      }
    }
  }

  return localisedCountryName;
};
/**
 * Try to get a map of localised country names to code, or falls back to the English map
 * @param {HTMLInputElement | HTMLSelectElement} el
 */


exports.getCountryName = getCountryName;

const getLocalisedCountryNamesToCodes = el => {
  if (typeof Intl.DisplayNames !== 'function') return _countryNames.COUNTRY_NAMES_TO_CODES; // Try to infer the field language or fallback to en

  const elLocale = inferElementLocale(el);
  return Object.fromEntries(Object.entries(_countryNames.COUNTRY_CODES_TO_NAMES).map(_ref2 => {
    let [code] = _ref2;
    return [getCountryDisplayName(elLocale, code), code];
  }));
};
/**
 * Try to infer a country code from an element we identified as identities.addressCountryCode
 * @param {HTMLInputElement | HTMLSelectElement} el
 * @return {string}
 */


const inferCountryCodeFromElement = el => {
  if (_countryNames.COUNTRY_CODES_TO_NAMES[el.value]) return el.value;
  if (_countryNames.COUNTRY_NAMES_TO_CODES[el.value]) return _countryNames.COUNTRY_NAMES_TO_CODES[el.value];
  const localisedCountryNamesToCodes = getLocalisedCountryNamesToCodes(el);
  if (localisedCountryNamesToCodes[el.value]) return localisedCountryNamesToCodes[el.value];

  if (el instanceof HTMLSelectElement) {
    var _el$selectedOptions$;

    const selectedText = (_el$selectedOptions$ = el.selectedOptions[0]) === null || _el$selectedOptions$ === void 0 ? void 0 : _el$selectedOptions$.text;
    if (_countryNames.COUNTRY_CODES_TO_NAMES[selectedText]) return selectedText;
    if (_countryNames.COUNTRY_NAMES_TO_CODES[selectedText]) return localisedCountryNamesToCodes[selectedText];
    if (localisedCountryNamesToCodes[selectedText]) return localisedCountryNamesToCodes[selectedText];
  }

  return '';
};
/**
 * Gets separate expiration month and year from a single string
 * @param {string} expiration
 * @return {{expirationYear: string, expirationMonth: string}}
 */


exports.inferCountryCodeFromElement = inferCountryCodeFromElement;

const getMMAndYYYYFromString = expiration => {
  const values = expiration.match(/(\d+)/g) || [];
  return values === null || values === void 0 ? void 0 : values.reduce((output, current) => {
    if (Number(current) > 12) {
      output.expirationYear = current.padStart(4, '20');
    } else {
      output.expirationMonth = current.padStart(2, '0');
    }

    return output;
  }, {
    expirationYear: '',
    expirationMonth: ''
  });
};
/**
 * @param {InternalDataStorageObject} credentials
 * @return {boolean}
 */


exports.getMMAndYYYYFromString = getMMAndYYYYFromString;

const shouldStoreCredentials = _ref3 => {
  let {
    credentials
  } = _ref3;
  return Boolean(credentials.password);
};
/**
 * @param {InternalDataStorageObject} credentials
 * @return {boolean}
 */


const shouldStoreIdentities = _ref4 => {
  let {
    identities
  } = _ref4;
  return Boolean((identities.firstName || identities.fullName) && identities.addressStreet && identities.addressCity);
};
/**
 * @param {InternalDataStorageObject} credentials
 * @return {boolean}
 */


const shouldStoreCreditCards = _ref5 => {
  let {
    creditCards
  } = _ref5;
  if (!creditCards.cardNumber) return false;
  if (creditCards.cardSecurityCode) return true; // Some forms (Amazon) don't have the cvv, so we still save if there's the expiration

  if (creditCards.expiration) return true; // Expiration can also be two separate values

  return Boolean(creditCards.expirationYear && creditCards.expirationMonth);
};
/**
 * Formats form data into an object to send to the device for storage
 * If values are insufficient for a complete entry, they are discarded
 * @param {InternalDataStorageObject} formValues
 * @return {DataStorageObject}
 */


const prepareFormValuesForStorage = formValues => {
  var _identities, _identities2;

  /** @type {Partial<InternalDataStorageObject>} */
  let {
    credentials,
    identities,
    creditCards
  } = formValues; // If we have an identity name but not a card name, copy it over there

  if (!creditCards.cardName && ((_identities = identities) !== null && _identities !== void 0 && _identities.fullName || (_identities2 = identities) !== null && _identities2 !== void 0 && _identities2.firstName)) {
    var _identities3;

    creditCards.cardName = ((_identities3 = identities) === null || _identities3 === void 0 ? void 0 : _identities3.fullName) || formatFullName(identities);
  }
  /** Fixes for credentials **/
  // Don't store if there isn't enough data


  if (shouldStoreCredentials(formValues)) {
    // If we don't have a username to match a password, let's see if the email is available
    if (credentials.password && !credentials.username && identities.emailAddress) {
      credentials.username = identities.emailAddress;
    }
  } else {
    credentials = undefined;
  }
  /** Fixes for identities **/
  // Don't store if there isn't enough data


  if (shouldStoreIdentities(formValues)) {
    if (identities.fullName) {
      // when forms have both first/last and fullName we keep the individual values and drop the fullName
      if (!(identities.firstName && identities.lastName)) {
        // If the fullname can be easily split into two, we'll store it as first and last
        const nameParts = identities.fullName.trim().split(/\s+/);

        if (nameParts.length === 2) {
          identities.firstName = nameParts[0];
          identities.lastName = nameParts[1];
        } else {
          // If we can't split it, just store it as first name
          identities.firstName = identities.fullName;
        }
      }

      delete identities.fullName;
    }
  } else {
    identities = undefined;
  }
  /** Fixes for credit cards **/
  // Don't store if there isn't enough data


  if (shouldStoreCreditCards(formValues)) {
    var _creditCards$expirati;

    if (creditCards.expiration) {
      const {
        expirationMonth,
        expirationYear
      } = getMMAndYYYYFromString(creditCards.expiration);
      creditCards.expirationMonth = expirationMonth;
      creditCards.expirationYear = expirationYear;
      delete creditCards.expiration;
    }

    creditCards.expirationYear = (_creditCards$expirati = creditCards.expirationYear) === null || _creditCards$expirati === void 0 ? void 0 : _creditCards$expirati.padStart(4, '20');

    if (creditCards.cardNumber) {
      creditCards.cardNumber = creditCards.cardNumber.replace(/\D/g, '');
    }
  } else {
    creditCards = undefined;
  }

  return {
    credentials,
    identities,
    creditCards
  };
};

exports.prepareFormValuesForStorage = prepareFormValuesForStorage;

},{"./countryNames.js":34,"./matching.js":41}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIconStylesBase = exports.getIconStylesAutofilled = void 0;

var _inputTypeConfig = require("./inputTypeConfig.js");

/**
 * Returns the css-ready base64 encoding of the icon for the given input
 * @param {HTMLInputElement} input
 * @param {import("./Form").Form} form
 * @param {'base' | 'filled'} type
 * @return {string}
 */
const getIcon = function (input, form) {
  let type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'base';
  const config = (0, _inputTypeConfig.getInputConfig)(input);

  if (type === 'base') {
    return config.getIconBase(input, form);
  }

  if (type === 'filled') {
    return config.getIconFilled(input, form);
  }

  return '';
};
/**
 * Returns an object with styles to be applied inline
 * @param {HTMLInputElement} input
 * @param {String} icon
 * @return {Object<string, string>}
 */


const getBasicStyles = (input, icon) => ({
  // Height must be > 0 to account for fields initially hidden
  'background-size': "auto ".concat(input.offsetHeight <= 30 && input.offsetHeight > 0 ? '100%' : '26px'),
  'background-position': 'center right',
  'background-repeat': 'no-repeat',
  'background-origin': 'content-box',
  'background-image': "url(".concat(icon, ")"),
  'transition': 'background 0s'
});
/**
 * Get inline styles for the injected icon, base state
 * @param {HTMLInputElement} input
 * @param {import("./Form").Form} form
 * @return {Object<string, string>}
 */


const getIconStylesBase = (input, form) => {
  const icon = getIcon(input, form);
  if (!icon) return {};
  return getBasicStyles(input, icon);
};
/**
 * Get inline styles for the injected icon, autofilled state
 * @param {HTMLInputElement} input
 * @param {import("./Form").Form} form
 * @return {Object<string, string>}
 */


exports.getIconStylesBase = getIconStylesBase;

const getIconStylesAutofilled = (input, form) => {
  const icon = getIcon(input, form, 'filled');
  const iconStyle = icon ? getBasicStyles(input, icon) : {};
  return { ...iconStyle,
    'background-color': '#F8F498',
    'color': '#333333'
  };
};

exports.getIconStylesAutofilled = getIconStylesAutofilled;

},{"./inputTypeConfig.js":37}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isFieldDecorated = exports.getInputConfigFromType = exports.getInputConfig = exports.canBeInteractedWith = void 0;

var _logoSvg = require("./logo-svg.js");

var ddgPasswordIcons = _interopRequireWildcard(require("../UI/img/ddgPasswordIcon.js"));

var _matching = require("./matching.js");

var _Credentials = require("../InputTypes/Credentials.js");

var _CreditCard = require("../InputTypes/CreditCard.js");

var _Identity = require("../InputTypes/Identity.js");

var _constants = require("../constants.js");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * Get the icon for the identities (currently only Dax for emails)
 * @param {HTMLInputElement} input
 * @param {import("./Form").Form} form
 * @return {string}
 */
const getIdentitiesIcon = (input, _ref) => {
  let {
    device
  } = _ref;
  if (!canBeInteractedWith(input)) return ''; // In Firefox web_accessible_resources could leak a unique user identifier, so we avoid it here

  const {
    isDDGApp,
    isFirefox
  } = device.globalConfig;
  const subtype = (0, _matching.getInputSubtype)(input);

  if (subtype === 'emailAddress' && device.isDeviceSignedIn()) {
    var _window$chrome;

    if (isDDGApp || isFirefox) {
      return _logoSvg.daxBase64;
    } else if (typeof ((_window$chrome = window.chrome) === null || _window$chrome === void 0 ? void 0 : _window$chrome.runtime) !== 'undefined') {
      return chrome.runtime.getURL('img/logo-small.svg');
    }
  }

  return '';
};
/**
 * Checks whether a field is readonly or disabled
 * @param {HTMLInputElement} input
 * @return {boolean}
 */


const canBeInteractedWith = input => !input.readOnly && !input.disabled;
/**
 * Checks if the input can be decorated and we have the needed data
 * @param {HTMLInputElement} input
 * @param {import("../DeviceInterface/InterfacePrototype").default} device
 * @returns {Promise<boolean>}
 */


exports.canBeInteractedWith = canBeInteractedWith;

const canBeAutofilled = async (input, device) => {
  if (!canBeInteractedWith(input)) return false;
  const mainType = (0, _matching.getInputMainType)(input);
  const subtype = (0, _matching.getInputSubtype)(input);
  const canAutofill = await device.settings.canAutofillType(mainType, subtype);
  return Boolean(canAutofill);
};
/**
 * A map of config objects. These help by centralising here some complexity
 * @type {InputTypeConfig}
 */


const inputTypeConfig = {
  /** @type {CredentialsInputTypeConfig} */
  credentials: {
    type: 'credentials',
    getIconBase: (input, _ref2) => {
      let {
        device
      } = _ref2;
      if (!canBeInteractedWith(input)) return '';

      if (device.settings.featureToggles.inlineIcon_credentials) {
        return ddgPasswordIcons.ddgPasswordIconBase;
      }

      return '';
    },
    getIconFilled: (_input, _ref3) => {
      let {
        device
      } = _ref3;

      if (device.settings.featureToggles.inlineIcon_credentials) {
        return ddgPasswordIcons.ddgPasswordIconFilled;
      }

      return '';
    },
    shouldDecorate: async (input, _ref4) => {
      let {
        isLogin,
        device
      } = _ref4;

      // if we are on a 'login' page, check if we have data to autofill the field
      if (isLogin) {
        return canBeAutofilled(input, device);
      } // at this point, it's not a 'login' form, so we could offer to provide a password


      if (device.settings.featureToggles.password_generation) {
        const subtype = (0, _matching.getInputSubtype)(input);

        if (subtype === 'password') {
          return canBeInteractedWith(input);
        }
      }

      return false;
    },
    dataType: 'Credentials',
    tooltipItem: data => (0, _Credentials.createCredentialsTooltipItem)(data)
  },

  /** @type {CreditCardsInputTypeConfig} */
  creditCards: {
    type: 'creditCards',
    getIconBase: () => '',
    getIconFilled: () => '',
    shouldDecorate: async (input, _ref5) => {
      let {
        device
      } = _ref5;
      return canBeAutofilled(input, device);
    },
    dataType: 'CreditCards',
    tooltipItem: data => new _CreditCard.CreditCardTooltipItem(data)
  },

  /** @type {IdentitiesInputTypeConfig} */
  identities: {
    type: 'identities',
    getIconBase: getIdentitiesIcon,
    getIconFilled: getIdentitiesIcon,
    shouldDecorate: async (input, _ref6) => {
      let {
        device
      } = _ref6;
      return canBeAutofilled(input, device);
    },
    dataType: 'Identities',
    tooltipItem: data => new _Identity.IdentityTooltipItem(data)
  },

  /** @type {UnknownInputTypeConfig} */
  unknown: {
    type: 'unknown',
    getIconBase: () => '',
    getIconFilled: () => '',
    shouldDecorate: async () => false,
    dataType: '',
    tooltipItem: _data => {
      throw new Error('unreachable');
    }
  }
};
/**
 * Retrieves configs from an input el
 * @param {HTMLInputElement} input
 * @returns {InputTypeConfigs}
 */

const getInputConfig = input => {
  const inputType = (0, _matching.getInputType)(input);
  return getInputConfigFromType(inputType);
};
/**
 * Retrieves configs from an input type
 * @param {import('./matching').SupportedTypes | string} inputType
 * @returns {InputTypeConfigs}
 */


exports.getInputConfig = getInputConfig;

const getInputConfigFromType = inputType => {
  const inputMainType = (0, _matching.getMainTypeFromType)(inputType);
  return inputTypeConfig[inputMainType];
};
/**
 * Given an input field checks wheter it was previously decorated
 * @param {HTMLInputElement} input
 * @returns {Boolean}
 */


exports.getInputConfigFromType = getInputConfigFromType;

const isFieldDecorated = input => {
  return input.hasAttribute(_constants.constants.ATTR_INPUT_TYPE);
};

exports.isFieldDecorated = isFieldDecorated;

},{"../InputTypes/Credentials.js":44,"../InputTypes/CreditCard.js":45,"../InputTypes/Identity.js":46,"../UI/img/ddgPasswordIcon.js":57,"../constants.js":62,"./logo-svg.js":39,"./matching.js":41}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractElementStrings = void 0;

var _matching = require("./matching.js");

const EXCLUDED_TAGS = ['SCRIPT', 'NOSCRIPT', 'OPTION', 'STYLE'];
/**
 * Extract all strings of an element's children to an array.
 * "element.textContent" is a string which is merged of all children nodes,
 * which can cause issues with things like script tags etc.
 *
 * @param  {HTMLElement} element
 *         A DOM element to be extracted.
 * @returns {string[]}
 *          All strings in an element.
 */

const extractElementStrings = element => {
  const strings = [];

  const _extractElementStrings = el => {
    if (EXCLUDED_TAGS.includes(el.tagName)) {
      return;
    } // only take the string when it's an explicit text node


    if (el.nodeType === el.TEXT_NODE || !el.childNodes.length) {
      let trimmedText = (0, _matching.removeExcessWhitespace)(el.textContent);

      if (trimmedText) {
        strings.push(trimmedText);
      }

      return;
    }

    for (let node of el.childNodes) {
      let nodeType = node.nodeType;

      if (nodeType !== node.ELEMENT_NODE && nodeType !== node.TEXT_NODE) {
        continue;
      }

      _extractElementStrings(node);
    }
  };

  _extractElementStrings(element);

  return strings;
};

exports.extractElementStrings = extractElementStrings;

},{"./matching.js":41}],39:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.daxBase64 = void 0;
const daxBase64 = 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgNDQgNDQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PGxpbmVhckdyYWRpZW50IGlkPSJhIj48c3RvcCBvZmZzZXQ9Ii4wMSIgc3RvcC1jb2xvcj0iIzYxNzZiOSIvPjxzdG9wIG9mZnNldD0iLjY5IiBzdG9wLWNvbG9yPSIjMzk0YTlmIi8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9ImIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTMuOTI5NyIgeDI9IjE3LjA3MiIgeGxpbms6aHJlZj0iI2EiIHkxPSIxNi4zOTgiIHkyPSIxNi4zOTgiLz48bGluZWFyR3JhZGllbnQgaWQ9ImMiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMjMuODExNSIgeDI9IjI2LjY3NTIiIHhsaW5rOmhyZWY9IiNhIiB5MT0iMTQuOTY3OSIgeTI9IjE0Ljk2NzkiLz48bWFzayBpZD0iZCIgaGVpZ2h0PSI0MCIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiB4PSIyIiB5PSIyIj48cGF0aCBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Im0yMi4wMDAzIDQxLjA2NjljMTAuNTMwMiAwIDE5LjA2NjYtOC41MzY0IDE5LjA2NjYtMTkuMDY2NiAwLTEwLjUzMDMtOC41MzY0LTE5LjA2NjcxLTE5LjA2NjYtMTkuMDY2NzEtMTAuNTMwMyAwLTE5LjA2NjcxIDguNTM2NDEtMTkuMDY2NzEgMTkuMDY2NzEgMCAxMC41MzAyIDguNTM2NDEgMTkuMDY2NiAxOS4wNjY3MSAxOS4wNjY2eiIgZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9tYXNrPjxwYXRoIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0ibTIyIDQ0YzEyLjE1MDMgMCAyMi05Ljg0OTcgMjItMjIgMC0xMi4xNTAyNi05Ljg0OTctMjItMjItMjItMTIuMTUwMjYgMC0yMiA5Ljg0OTc0LTIyIDIyIDAgMTIuMTUwMyA5Ljg0OTc0IDIyIDIyIDIyeiIgZmlsbD0iI2RlNTgzMyIgZmlsbC1ydWxlPSJldmVub2RkIi8+PGcgbWFzaz0idXJsKCNkKSI+PHBhdGggY2xpcC1ydWxlPSJldmVub2RkIiBkPSJtMjYuMDgxMyA0MS42Mzg2Yy0uOTIwMy0xLjc4OTMtMS44MDAzLTMuNDM1Ni0yLjM0NjYtNC41MjQ2LTEuNDUyLTIuOTA3Ny0yLjkxMTQtNy4wMDctMi4yNDc3LTkuNjUwNy4xMjEtLjQ4MDMtMS4zNjc3LTE3Ljc4Njk5LTIuNDItMTguMzQ0MzItMS4xNjk3LS42MjMzMy0zLjcxMDctMS40NDQ2Ny01LjAyNy0xLjY2NDY3LS45MTY3LS4xNDY2Ni0xLjEyNTcuMTEtMS41MTA3LjE2ODY3LjM2My4wMzY2NyAyLjA5Ljg4NzMzIDIuNDIzNy45MzUtLjMzMzcuMjI3MzMtMS4zMi0uMDA3MzMtMS45NTA3LjI3MTMzLS4zMTkuMTQ2NjctLjU1NzMuNjg5MzQtLjU1Ljk0NiAxLjc5NjctLjE4MzMzIDQuNjA1NC0uMDAzNjYgNi4yNy43MzMyOS0xLjMyMzYuMTUwNC0zLjMzMy4zMTktNC4xOTgzLjc3MzctMi41MDggMS4zMi0zLjYxNTMgNC40MTEtMi45NTUzIDguMTE0My42NTYzIDMuNjk2IDMuNTY0IDE3LjE3ODQgNC40OTE2IDIxLjY4MS45MjQgNC40OTkgMTEuNTUzNyAzLjU1NjcgMTAuMDE3NC41NjF6IiBmaWxsPSIjZDVkN2Q4IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48cGF0aCBkPSJtMjIuMjg2NSAyNi44NDM5Yy0uNjYgMi42NDM2Ljc5MiA2LjczOTMgMi4yNDc2IDkuNjUwNi40ODkxLjk3MjcgMS4yNDM4IDIuMzkyMSAyLjA1NTggMy45NjM3LTEuODk0LjQ2OTMtNi40ODk1IDEuMTI2NC05LjcxOTEgMC0uOTI0LTQuNDkxNy0zLjgzMTctMTcuOTc3Ny00LjQ5NTMtMjEuNjgxLS42Ni0zLjcwMzMgMC02LjM0NyAyLjUxNTMtNy42NjcuODYxNy0uNDU0NyAyLjA5MzctLjc4NDcgMy40MTM3LS45MzEzLTEuNjY0Ny0uNzQwNy0zLjYzNzQtMS4wMjY3LTUuNDQxNC0uODQzMzYtLjAwNzMtLjc2MjY3IDEuMzM4NC0uNzE4NjcgMS44NDQ0LTEuMDYzMzQtLjMzMzctLjA0NzY2LTEuMTYyNC0uNzk1NjYtMS41MjktLjgzMjMzIDIuMjg4My0uMzkyNDQgNC42NDIzLS4wMjEzOCA2LjY5OSAxLjA1NiAxLjA0ODYuNTYxIDEuNzg5MyAxLjE2MjMzIDIuMjQ3NiAxLjc5MzAzIDEuMTk1NC4yMjczIDIuMjUxNC42NiAyLjk0MDcgMS4zNDkzIDIuMTE5MyAyLjExNTcgNC4wMTEzIDYuOTUyIDMuMjE5MyA5LjczMTMtLjIyMzYuNzctLjczMzMgMS4zMzEtMS4zNzEzIDEuNzk2Ny0xLjIzOTMuOTAyLTEuMDE5My0xLjA0NS00LjEwMy45NzE3LS4zOTk3LjI2MDMtLjM5OTcgMi4yMjU2LS41MjQzIDIuNzA2eiIgZmlsbD0iI2ZmZiIvPjwvZz48ZyBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PHBhdGggZD0ibTE2LjY3MjQgMjAuMzU0Yy43Njc1IDAgMS4zODk2LS42MjIxIDEuMzg5Ni0xLjM4OTZzLS42MjIxLTEuMzg5Ny0xLjM4OTYtMS4zODk3LTEuMzg5Ny42MjIyLTEuMzg5NyAxLjM4OTcuNjIyMiAxLjM4OTYgMS4zODk3IDEuMzg5NnoiIGZpbGw9IiMyZDRmOGUiLz48cGF0aCBkPSJtMTcuMjkyNCAxOC44NjE3Yy4xOTg1IDAgLjM1OTQtLjE2MDguMzU5NC0uMzU5M3MtLjE2MDktLjM1OTMtLjM1OTQtLjM1OTNjLS4xOTg0IDAtLjM1OTMuMTYwOC0uMzU5My4zNTkzcy4xNjA5LjM1OTMuMzU5My4zNTkzeiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Im0yNS45NTY4IDE5LjMzMTFjLjY1ODEgMCAxLjE5MTctLjUzMzUgMS4xOTE3LTEuMTkxNyAwLS42NTgxLS41MzM2LTEuMTkxNi0xLjE5MTctMS4xOTE2cy0xLjE5MTcuNTMzNS0xLjE5MTcgMS4xOTE2YzAgLjY1ODIuNTMzNiAxLjE5MTcgMS4xOTE3IDEuMTkxN3oiIGZpbGw9IiMyZDRmOGUiLz48cGF0aCBkPSJtMjYuNDg4MiAxOC4wNTExYy4xNzAxIDAgLjMwOC0uMTM3OS4zMDgtLjMwOHMtLjEzNzktLjMwOC0uMzA4LS4zMDgtLjMwOC4xMzc5LS4zMDguMzA4LjEzNzkuMzA4LjMwOC4zMDh6IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0ibTE3LjA3MiAxNC45NDJzLTEuMDQ4Ni0uNDc2Ni0yLjA2NDMuMTY1Yy0xLjAxNTcuNjM4LS45NzkgMS4yOTA3LS45NzkgMS4yOTA3cy0uNTM5LTEuMjAyNy44OTgzLTEuNzkzYzEuNDQxLS41ODY3IDIuMTQ1LjMzNzMgMi4xNDUuMzM3M3oiIGZpbGw9InVybCgjYikiLz48cGF0aCBkPSJtMjYuNjc1MiAxNC44NDY3cy0uNzUxNy0uNDI5LTEuMzM4My0uNDIxN2MtMS4xOTkuMDE0Ny0xLjUyNTQuNTQyNy0xLjUyNTQuNTQyN3MuMjAxNy0xLjI2MTQgMS43MzQ0LTEuMDA4NGMuNDk5Ny4wOTE0LjkyMjMuNDIzNCAxLjEyOTMuODg3NHoiIGZpbGw9InVybCgjYykiLz48cGF0aCBkPSJtMjAuOTI1OCAyNC4zMjFjLjEzOTMtLjg0MzMgMi4zMS0yLjQzMSAzLjg1LTIuNTMgMS41NC0uMDk1MyAyLjAxNjctLjA3MzMgMy4zLS4zODEzIDEuMjg3LS4zMDQzIDQuNTk4LTEuMTI5MyA1LjUxMS0xLjU1NDcuOTE2Ny0uNDIxNiA0LjgwMzMuMjA5IDIuMDY0MyAxLjczOC0xLjE4NDMuNjYzNy00LjM3OCAxLjg4MS02LjY2MjMgMi41NjMtMi4yODA3LjY4Mi0zLjY2My0uNjUyNi00LjQyMi40Njk0LS42MDEzLjg5MS0uMTIxIDIuMTEyIDIuNjAzMyAyLjM2NSAzLjY4MTQuMzQxIDcuMjA4Ny0xLjY1NzQgNy41OTc0LS41OTQuMzg4NiAxLjA2MzMtMy4xNjA3IDIuMzgzMy01LjMyNCAyLjQyNzMtMi4xNjM0LjA0MDMtNi41MTk0LTEuNDMtNy4xNzItMS44ODQ3LS42NTY0LS40NTEtMS41MjU0LTEuNTE0My0xLjM0NTctMi42MTh6IiBmaWxsPSIjZmRkMjBhIi8+PHBhdGggZD0ibTI4Ljg4MjUgMzEuODM4NmMtLjc3NzMtLjE3MjQtNC4zMTIgMi41MDA2LTQuMzEyIDIuNTAwNmguMDAzN2wtLjE2NSAyLjA1MzRzNC4wNDA2IDEuNjUzNiA0LjczIDEuMzk3Yy42ODkzLS4yNjQuNTE3LTUuNzc1LS4yNTY3LTUuOTUxem0tMTEuNTQ2MyAxLjAzNGMuMDg0My0xLjExODQgNS4yNTQzIDEuNjQyNiA1LjI1NDMgMS42NDI2bC4wMDM3LS4wMDM2LjI1NjYgMi4xNTZzLTQuMzA4MyAyLjU4MTMtNC45MTMzIDIuMjM2NmMtLjYwMTMtLjM0NDYtLjY4OTMtNC45MDk2LS42MDEzLTYuMDMxNnoiIGZpbGw9IiM2NWJjNDYiLz48cGF0aCBkPSJtMjEuMzQgMzQuODA0OWMwIDEuODA3Ny0uMjYwNCAyLjU4NS41MTMzIDIuNzU3NC43NzczLjE3MjMgMi4yNDAzIDAgMi43NjEtLjM0NDcuNTEzMy0uMzQ0Ny4wODQzLTIuNjY5My0uMDg4LTMuMTAycy0zLjE5LS4wODgtMy4xOS42ODkzeiIgZmlsbD0iIzQzYTI0NCIvPjxwYXRoIGQ9Im0yMS42NzAxIDM0LjQwNTFjMCAxLjgwNzYtLjI2MDQgMi41ODEzLjUxMzMgMi43NTM2Ljc3MzcuMTc2IDIuMjM2NyAwIDIuNzU3My0uMzQ0Ni41MTctLjM0NDcuMDg4LTIuNjY5NC0uMDg0My0zLjEwMi0uMTcyMy0uNDMyNy0zLjE5LS4wODQ0LTMuMTkuNjg5M3oiIGZpbGw9IiM2NWJjNDYiLz48cGF0aCBkPSJtMjIuMDAwMiA0MC40NDgxYzEwLjE4ODUgMCAxOC40NDc5LTguMjU5NCAxOC40NDc5LTE4LjQ0NzlzLTguMjU5NC0xOC40NDc5NS0xOC40NDc5LTE4LjQ0Nzk1LTE4LjQ0Nzk1IDguMjU5NDUtMTguNDQ3OTUgMTguNDQ3OTUgOC4yNTk0NSAxOC40NDc5IDE4LjQ0Nzk1IDE4LjQ0Nzl6bTAgMS43MTg3YzExLjEzNzcgMCAyMC4xNjY2LTkuMDI4OSAyMC4xNjY2LTIwLjE2NjYgMC0xMS4xMzc4LTkuMDI4OS0yMC4xNjY3LTIwLjE2NjYtMjAuMTY2Ny0xMS4xMzc4IDAtMjAuMTY2NyA5LjAyODktMjAuMTY2NyAyMC4xNjY3IDAgMTEuMTM3NyA5LjAyODkgMjAuMTY2NiAyMC4xNjY3IDIwLjE2NjZ6IiBmaWxsPSIjZmZmIi8+PC9nPjwvc3ZnPg==';
exports.daxBase64 = daxBase64;

},{}],40:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.matchingConfiguration = void 0;

var css = _interopRequireWildcard(require("./selectors-css.js"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * This is here to mimic what Remote Configuration might look like
 * later on.
 *
 * @type {MatchingConfiguration}
 */
const matchingConfiguration = {
  /** @type {MatcherConfiguration} */
  matchers: {
    fields: {
      email: {
        type: 'email',
        strategies: {
          cssSelector: 'email',
          ddgMatcher: 'email',
          vendorRegex: 'email'
        }
      },
      password: {
        type: 'password',
        strategies: {
          cssSelector: 'password',
          ddgMatcher: 'password'
        }
      },
      username: {
        type: 'username',
        strategies: {
          cssSelector: 'username',
          ddgMatcher: 'username'
        }
      },
      firstName: {
        type: 'firstName',
        strategies: {
          cssSelector: 'firstName',
          ddgMatcher: 'firstName',
          vendorRegex: 'given-name'
        }
      },
      middleName: {
        type: 'middleName',
        strategies: {
          cssSelector: 'middleName',
          ddgMatcher: 'middleName',
          vendorRegex: 'additional-name'
        }
      },
      lastName: {
        type: 'lastName',
        strategies: {
          cssSelector: 'lastName',
          ddgMatcher: 'lastName',
          vendorRegex: 'family-name'
        }
      },
      fullName: {
        type: 'fullName',
        strategies: {
          cssSelector: 'fullName',
          ddgMatcher: 'fullName',
          vendorRegex: 'name'
        }
      },
      phone: {
        type: 'phone',
        strategies: {
          cssSelector: 'phone',
          ddgMatcher: 'phone',
          vendorRegex: 'tel'
        }
      },
      addressStreet: {
        type: 'addressStreet',
        strategies: {
          cssSelector: 'addressStreet',
          ddgMatcher: 'addressStreet',
          vendorRegex: 'address-line1'
        }
      },
      addressStreet2: {
        type: 'addressStreet2',
        strategies: {
          cssSelector: 'addressStreet2',
          ddgMatcher: 'addressStreet2',
          vendorRegex: 'address-line2'
        }
      },
      addressCity: {
        type: 'addressCity',
        strategies: {
          cssSelector: 'addressCity',
          ddgMatcher: 'addressCity',
          vendorRegex: 'address-level2'
        }
      },
      addressProvince: {
        type: 'addressProvince',
        strategies: {
          cssSelector: 'addressProvince',
          ddgMatcher: 'addressProvince',
          vendorRegex: 'address-level1'
        }
      },
      addressPostalCode: {
        type: 'addressPostalCode',
        strategies: {
          cssSelector: 'addressPostalCode',
          ddgMatcher: 'addressPostalCode',
          vendorRegex: 'postal-code'
        }
      },
      addressCountryCode: {
        type: 'addressCountryCode',
        strategies: {
          cssSelector: 'addressCountryCode',
          ddgMatcher: 'addressCountryCode',
          vendorRegex: 'country'
        }
      },
      birthdayDay: {
        type: 'birthdayDay',
        strategies: {
          cssSelector: 'birthdayDay',
          ddgMatcher: 'birthdayDay'
        }
      },
      birthdayMonth: {
        type: 'birthdayMonth',
        strategies: {
          cssSelector: 'birthdayMonth',
          ddgMatcher: 'birthdayMonth'
        }
      },
      birthdayYear: {
        type: 'birthdayYear',
        strategies: {
          cssSelector: 'birthdayYear',
          ddgMatcher: 'birthdayYear'
        }
      },
      cardName: {
        type: 'cardName',
        strategies: {
          cssSelector: 'cardName',
          ddgMatcher: 'cardName',
          vendorRegex: 'cc-name'
        }
      },
      cardNumber: {
        type: 'cardNumber',
        strategies: {
          cssSelector: 'cardNumber',
          ddgMatcher: 'cardNumber',
          vendorRegex: 'cc-number'
        }
      },
      cardSecurityCode: {
        type: 'cardSecurityCode',
        strategies: {
          cssSelector: 'cardSecurityCode',
          ddgMatcher: 'cardSecurityCode'
        }
      },
      expirationMonth: {
        type: 'expirationMonth',
        strategies: {
          cssSelector: 'expirationMonth',
          ddgMatcher: 'expirationMonth',
          vendorRegex: 'cc-exp-month'
        }
      },
      expirationYear: {
        type: 'expirationYear',
        strategies: {
          cssSelector: 'expirationYear',
          ddgMatcher: 'expirationYear',
          vendorRegex: 'cc-exp-year'
        }
      },
      expiration: {
        type: 'expiration',
        strategies: {
          cssSelector: 'expiration',
          ddgMatcher: 'expiration',
          vendorRegex: 'cc-exp'
        }
      }
    },
    lists: {
      email: ['email'],
      password: ['password'],
      username: ['username'],
      cc: ['cardName', 'cardNumber', 'cardSecurityCode', 'expirationMonth', 'expirationYear', 'expiration'],
      id: ['firstName', 'middleName', 'lastName', 'fullName', 'phone', 'addressStreet', 'addressStreet2', 'addressCity', 'addressProvince', 'addressPostalCode', 'addressCountryCode', 'birthdayDay', 'birthdayMonth', 'birthdayYear']
    }
  },
  strategies: {
    /** @type {CssSelectorConfiguration} */
    cssSelector: {
      selectors: {
        // Generic
        FORM_INPUTS_SELECTOR: css.__secret_do_not_use.FORM_INPUTS_SELECTOR,
        SUBMIT_BUTTON_SELECTOR: css.__secret_do_not_use.SUBMIT_BUTTON_SELECTOR,
        GENERIC_TEXT_FIELD: css.__secret_do_not_use.GENERIC_TEXT_FIELD,
        // user
        email: css.__secret_do_not_use.email,
        password: css.__secret_do_not_use.password,
        username: css.__secret_do_not_use.username,
        // CC
        cardName: css.__secret_do_not_use.cardName,
        cardNumber: css.__secret_do_not_use.cardNumber,
        cardSecurityCode: css.__secret_do_not_use.cardSecurityCode,
        expirationMonth: css.__secret_do_not_use.expirationMonth,
        expirationYear: css.__secret_do_not_use.expirationYear,
        expiration: css.__secret_do_not_use.expiration,
        // Identities
        firstName: css.__secret_do_not_use.firstName,
        middleName: css.__secret_do_not_use.middleName,
        lastName: css.__secret_do_not_use.lastName,
        fullName: css.__secret_do_not_use.fullName,
        phone: css.__secret_do_not_use.phone,
        addressStreet: css.__secret_do_not_use.addressStreet1,
        addressStreet2: css.__secret_do_not_use.addressStreet2,
        addressCity: css.__secret_do_not_use.addressCity,
        addressProvince: css.__secret_do_not_use.addressProvince,
        addressPostalCode: css.__secret_do_not_use.addressPostalCode,
        addressCountryCode: css.__secret_do_not_use.addressCountryCode,
        birthdayDay: css.__secret_do_not_use.birthdayDay,
        birthdayMonth: css.__secret_do_not_use.birthdayMonth,
        birthdayYear: css.__secret_do_not_use.birthdayYear
      }
    },

    /** @type {DDGMatcherConfiguration} */
    ddgMatcher: {
      matchers: {
        email: {
          match: '.mail\\b',
          skip: 'phone|name|reservation number',
          forceUnknown: 'search|filter|subject|title|\btab\b'
        },
        password: {
          match: 'password',
          forceUnknown: 'captcha|mfa|2fa|two factor'
        },
        username: {
          match: '(user|account|apple|login|net)((.)?(name|id|login).?)?(.?(or|/).+)?$|benutzername',
          forceUnknown: 'search|policy'
        },
        // CC
        cardName: {
          match: '(card.*name|name.*card)|(card.*holder|holder.*card)|(card.*owner|owner.*card)'
        },
        cardNumber: {
          match: 'card.*number|number.*card',
          forceUnknown: 'plus'
        },
        cardSecurityCode: {
          match: 'security.?code|card.?verif|cvv|csc|cvc'
        },
        expirationMonth: {
          match: '(card|\\bcc\\b)?.?(exp(iry|iration)?)?.?(month|\\bmm\\b(?![.\\s/-]yy))',
          skip: 'mm[/\\s.\\-_—–]'
        },
        expirationYear: {
          match: '(card|\\bcc\\b)?.?(exp(iry|iration)?)?.?(year|yy)',
          skip: 'mm[/\\s.\\-_—–]'
        },
        expiration: {
          match: '(\\bmm\\b|\\b\\d\\d\\b)[/\\s.\\-_—–](\\byy|\\bjj|\\baa|\\b\\d\\d)|\\bexp|\\bvalid(idity| through| until)',
          skip: 'invalid'
        },
        // Identities
        firstName: {
          match: '(first|given|fore).?name',
          skip: 'last'
        },
        middleName: {
          match: '(middle|additional).?name'
        },
        lastName: {
          match: '(last|family|sur)[^i]?name',
          skip: 'first'
        },
        fullName: {
          match: '^(full.?|whole\\s|first.*last\\s|real\\s|contact.?)?name\\b',
          forceUnknown: 'company|org|item'
        },
        phone: {
          match: 'phone',
          skip: 'code|pass|country',
          forceUnknown: 'ext|type'
        },
        addressStreet: {
          match: 'address',
          forceUnknown: '\\bip\\b|duck|web|url',
          skip: 'address.*(2|two|3|three)|email|log.?in|sign.?in'
        },
        addressStreet2: {
          match: 'address.*(2|two)|apartment|\\bapt\\b|\\bflat\\b|\\bline.*(2|two)',
          forceUnknown: '\\bip\\b|duck',
          skip: 'email|log.?in|sign.?in'
        },
        addressCity: {
          match: 'city|town',
          forceUnknown: 'vatican'
        },
        addressProvince: {
          match: 'state|province|region|county',
          forceUnknown: 'united',
          skip: 'country'
        },
        addressPostalCode: {
          match: '\\bzip\\b|postal\b|post.?code'
        },
        addressCountryCode: {
          match: 'country'
        },
        birthdayDay: {
          match: '(birth.*day|day.*birth)',
          skip: 'month|year'
        },
        birthdayMonth: {
          match: '(birth.*month|month.*birth)',
          skip: 'year'
        },
        birthdayYear: {
          match: '(birth.*year|year.*birth)'
        }
      }
    },

    /**
     * @type {VendorRegexConfiguration}
     */
    vendorRegex: {
      rules: {
        email: null,
        tel: null,
        organization: null,
        'street-address': null,
        'address-line1': null,
        'address-line2': null,
        'address-line3': null,
        'address-level2': null,
        'address-level1': null,
        'postal-code': null,
        country: null,
        'cc-name': null,
        name: null,
        'given-name': null,
        'additional-name': null,
        'family-name': null,
        'cc-number': null,
        'cc-exp-month': null,
        'cc-exp-year': null,
        'cc-exp': null,
        'cc-type': null
      },
      ruleSets: [//= ========================================================================
      // Firefox-specific rules
      {
        'address-line1': 'addrline1|address_1',
        'address-line2': 'addrline2|address_2',
        'address-line3': 'addrline3|address_3',
        'address-level1': 'land',
        // de-DE
        'additional-name': 'apellido.?materno|lastlastname',
        'cc-name': 'accountholdername' + '|titulaire',
        // fr-FR
        'cc-number': '(cc|kk)nr',
        // de-DE
        'cc-exp-month': '(cc|kk)month',
        // de-DE
        'cc-exp-year': '(cc|kk)year',
        // de-DE
        'cc-type': 'type' + '|kartenmarke' // de-DE

      }, //= ========================================================================
      // These are the rules used by Bitwarden [0], converted into RegExp form.
      // [0] https://github.com/bitwarden/browser/blob/c2b8802201fac5e292d55d5caf3f1f78088d823c/src/services/autofill.service.ts#L436
      {
        email: '(^e-?mail$)|(^email-?address$)',
        tel: '(^phone$)' + '|(^mobile$)' + '|(^mobile-?phone$)' + '|(^tel$)' + '|(^telephone$)' + '|(^phone-?number$)',
        organization: '(^company$)' + '|(^company-?name$)' + '|(^organization$)' + '|(^organization-?name$)',
        'street-address': '(^address$)' + '|(^street-?address$)' + '|(^addr$)' + '|(^street$)' + '|(^mailing-?addr(ess)?$)' + // Modified to not grab lines, below
        '|(^billing-?addr(ess)?$)' + // Modified to not grab lines, below
        '|(^mail-?addr(ess)?$)' + // Modified to not grab lines, below
        '|(^bill-?addr(ess)?$)',
        // Modified to not grab lines, below
        'address-line1': '(^address-?1$)' + '|(^address-?line-?1$)' + '|(^addr-?1$)' + '|(^street-?1$)',
        'address-line2': '(^address-?2$)' + '|(^address-?line-?2$)' + '|(^addr-?2$)' + '|(^street-?2$)',
        'address-line3': '(^address-?3$)' + '|(^address-?line-?3$)' + '|(^addr-?3$)' + '|(^street-?3$)',
        'address-level2': '(^city$)' + '|(^town$)' + '|(^address-?level-?2$)' + '|(^address-?city$)' + '|(^address-?town$)',
        'address-level1': '(^state$)' + '|(^province$)' + '|(^provence$)' + '|(^address-?level-?1$)' + '|(^address-?state$)' + '|(^address-?province$)',
        'postal-code': '(^postal$)' + '|(^zip$)' + '|(^zip2$)' + '|(^zip-?code$)' + '|(^postal-?code$)' + '|(^post-?code$)' + '|(^address-?zip$)' + '|(^address-?postal$)' + '|(^address-?code$)' + '|(^address-?postal-?code$)' + '|(^address-?zip-?code$)',
        country: '(^country$)' + '|(^country-?code$)' + '|(^country-?name$)' + '|(^address-?country$)' + '|(^address-?country-?name$)' + '|(^address-?country-?code$)',
        name: '(^name$)|full-?name|your-?name',
        'given-name': '(^f-?name$)' + '|(^first-?name$)' + '|(^given-?name$)' + '|(^first-?n$)',
        'additional-name': '(^m-?name$)' + '|(^middle-?name$)' + '|(^additional-?name$)' + '|(^middle-?initial$)' + '|(^middle-?n$)' + '|(^middle-?i$)',
        'family-name': '(^l-?name$)' + '|(^last-?name$)' + '|(^s-?name$)' + '|(^surname$)' + '|(^family-?name$)' + '|(^family-?n$)' + '|(^last-?n$)',
        'cc-name': 'cc-?name' + '|card-?name' + '|cardholder-?name' + '|cardholder' + // "|(^name$)" + // Removed to avoid overwriting "name", above.
        '|(^nom$)',
        'cc-number': 'cc-?number' + '|cc-?num' + '|card-?number' + '|card-?num' + '|(^number$)' + '|(^cc$)' + '|cc-?no' + '|card-?no' + '|(^credit-?card$)' + '|numero-?carte' + '|(^carte$)' + '|(^carte-?credit$)' + '|num-?carte' + '|cb-?num',
        'cc-exp': '(^cc-?exp$)' + '|(^card-?exp$)' + '|(^cc-?expiration$)' + '|(^card-?expiration$)' + '|(^cc-?ex$)' + '|(^card-?ex$)' + '|(^card-?expire$)' + '|(^card-?expiry$)' + '|(^validite$)' + '|(^expiration$)' + '|(^expiry$)' + '|mm-?yy' + '|mm-?yyyy' + '|yy-?mm' + '|yyyy-?mm' + '|expiration-?date' + '|payment-?card-?expiration' + '|(^payment-?cc-?date$)',
        'cc-exp-month': '(^exp-?month$)' + '|(^cc-?exp-?month$)' + '|(^cc-?month$)' + '|(^card-?month$)' + '|(^cc-?mo$)' + '|(^card-?mo$)' + '|(^exp-?mo$)' + '|(^card-?exp-?mo$)' + '|(^cc-?exp-?mo$)' + '|(^card-?expiration-?month$)' + '|(^expiration-?month$)' + '|(^cc-?mm$)' + '|(^cc-?m$)' + '|(^card-?mm$)' + '|(^card-?m$)' + '|(^card-?exp-?mm$)' + '|(^cc-?exp-?mm$)' + '|(^exp-?mm$)' + '|(^exp-?m$)' + '|(^expire-?month$)' + '|(^expire-?mo$)' + '|(^expiry-?month$)' + '|(^expiry-?mo$)' + '|(^card-?expire-?month$)' + '|(^card-?expire-?mo$)' + '|(^card-?expiry-?month$)' + '|(^card-?expiry-?mo$)' + '|(^mois-?validite$)' + '|(^mois-?expiration$)' + '|(^m-?validite$)' + '|(^m-?expiration$)' + '|(^expiry-?date-?field-?month$)' + '|(^expiration-?date-?month$)' + '|(^expiration-?date-?mm$)' + '|(^exp-?mon$)' + '|(^validity-?mo$)' + '|(^exp-?date-?mo$)' + '|(^cb-?date-?mois$)' + '|(^date-?m$)',
        'cc-exp-year': '(^exp-?year$)' + '|(^cc-?exp-?year$)' + '|(^cc-?year$)' + '|(^card-?year$)' + '|(^cc-?yr$)' + '|(^card-?yr$)' + '|(^exp-?yr$)' + '|(^card-?exp-?yr$)' + '|(^cc-?exp-?yr$)' + '|(^card-?expiration-?year$)' + '|(^expiration-?year$)' + '|(^cc-?yy$)' + '|(^cc-?y$)' + '|(^card-?yy$)' + '|(^card-?y$)' + '|(^card-?exp-?yy$)' + '|(^cc-?exp-?yy$)' + '|(^exp-?yy$)' + '|(^exp-?y$)' + '|(^cc-?yyyy$)' + '|(^card-?yyyy$)' + '|(^card-?exp-?yyyy$)' + '|(^cc-?exp-?yyyy$)' + '|(^expire-?year$)' + '|(^expire-?yr$)' + '|(^expiry-?year$)' + '|(^expiry-?yr$)' + '|(^card-?expire-?year$)' + '|(^card-?expire-?yr$)' + '|(^card-?expiry-?year$)' + '|(^card-?expiry-?yr$)' + '|(^an-?validite$)' + '|(^an-?expiration$)' + '|(^annee-?validite$)' + '|(^annee-?expiration$)' + '|(^expiry-?date-?field-?year$)' + '|(^expiration-?date-?year$)' + '|(^cb-?date-?ann$)' + '|(^expiration-?date-?yy$)' + '|(^expiration-?date-?yyyy$)' + '|(^validity-?year$)' + '|(^exp-?date-?year$)' + '|(^date-?y$)',
        'cc-type': '(^cc-?type$)' + '|(^card-?type$)' + '|(^card-?brand$)' + '|(^cc-?brand$)' + '|(^cb-?type$)'
      }, //= ========================================================================
      // These rules are from Chromium source codes [1]. Most of them
      // converted to JS format have the same meaning with the original ones
      // except the first line of "address-level1".
      // [1] https://source.chromium.org/chromium/chromium/src/+/master:components/autofill/core/common/autofill_regex_constants.cc
      {
        // ==== Email ====
        email: 'e.?mail' + '|courriel' + // fr
        '|correo.*electr(o|ó)nico' + // es-ES
        '|メールアドレス' + // ja-JP
        '|Электронной.?Почты' + // ru
        '|邮件|邮箱' + // zh-CN
        '|電郵地址' + // zh-TW
        '|ഇ-മെയില്‍|ഇലക്ട്രോണിക്.?' + 'മെയിൽ' + // ml
        '|ایمیل|پست.*الکترونیک' + // fa
        '|ईमेल|इलॅक्ट्रॉनिक.?मेल' + // hi
        '|(\\b|_)eposta(\\b|_)' + // tr
        '|(?:이메일|전자.?우편|[Ee]-?mail)(.?주소)?',
        // ko-KR
        // ==== Telephone ====
        tel: 'phone|mobile|contact.?number' + '|telefonnummer' + // de-DE
        '|telefono|teléfono' + // es
        '|telfixe' + // fr-FR
        '|電話' + // ja-JP
        '|telefone|telemovel' + // pt-BR, pt-PT
        '|телефон' + // ru
        '|मोबाइल' + // hi for mobile
        '|(\\b|_|\\*)telefon(\\b|_|\\*)' + // tr
        '|电话' + // zh-CN
        '|മൊബൈല്‍' + // ml for mobile
        '|(?:전화|핸드폰|휴대폰|휴대전화)(?:.?번호)?',
        // ko-KR
        // ==== Address Fields ====
        organization: 'company|business|organization|organisation' + // '|(?<!con)firma' + // de-DE // // todo: not supported in safari
        '|empresa' + // es
        '|societe|société' + // fr-FR
        '|ragione.?sociale' + // it-IT
        '|会社' + // ja-JP
        '|название.?компании' + // ru
        '|单位|公司' + // zh-CN
        '|شرکت' + // fa
        '|회사|직장',
        // ko-KR
        'street-address': 'streetaddress|street-address',
        'address-line1': '^address$|address[_-]?line[_-]?(1|one)|address1|addr1|street' + '|(?:shipping|billing)address$' + '|strasse|straße|hausnummer|housenumber' + // de-DE
        '|house.?name' + // en-GB
        '|direccion|dirección' + // es
        '|adresse' + // fr-FR
        '|indirizzo' + // it-IT
        '|^住所$|住所1' + // ja-JP
        // '|morada|((?<!identificação do )endereço)' + // pt-BR, pt-PT // todo: not supported in safari
        '|Адрес' + // ru
        '|地址' + // zh-CN
        '|(\\b|_)adres(?! (başlığı(nız)?|tarifi))(\\b|_)' + // tr
        '|^주소.?$|주소.?1',
        // ko-KR
        'address-line2': 'address[_-]?line(2|two)|address2|addr2|street|suite|unit(?!e)' + // Firefox adds `(?!e)` to unit to skip `United State`
        '|adresszusatz|ergänzende.?angaben' + // de-DE
        '|direccion2|colonia|adicional' + // es
        '|addresssuppl|complementnom|appartement' + // fr-FR
        '|indirizzo2' + // it-IT
        '|住所2' + // ja-JP
        '|complemento|addrcomplement' + // pt-BR, pt-PT
        '|Улица' + // ru
        '|地址2' + // zh-CN
        '|주소.?2',
        // ko-KR
        'address-line3': 'address[_-]?line(3|three)|address3|addr3|street|suite|unit(?!e)' + // Firefox adds `(?!e)` to unit to skip `United State`
        '|adresszusatz|ergänzende.?angaben' + // de-DE
        '|direccion3|colonia|adicional' + // es
        '|addresssuppl|complementnom|appartement' + // fr-FR
        '|indirizzo3' + // it-IT
        '|住所3' + // ja-JP
        '|complemento|addrcomplement' + // pt-BR, pt-PT
        '|Улица' + // ru
        '|地址3' + // zh-CN
        '|주소.?3',
        // ko-KR
        'address-level2': 'city|town' + '|\\bort\\b|stadt' + // de-DE
        '|suburb' + // en-AU
        '|ciudad|provincia|localidad|poblacion' + // es
        '|ville|commune' + // fr-FR
        '|localit(a|à)|citt(a|à)' + // it-IT
        '|市区町村' + // ja-JP
        '|cidade' + // pt-BR, pt-PT
        '|Город' + // ru
        '|市' + // zh-CN
        '|分區' + // zh-TW
        '|شهر' + // fa
        '|शहर' + // hi for city
        '|ग्राम|गाँव' + // hi for village
        '|നഗരം|ഗ്രാമം' + // ml for town|village
        '|((\\b|_|\\*)([İii̇]l[cç]e(miz|niz)?)(\\b|_|\\*))' + // tr
        '|^시[^도·・]|시[·・]?군[·・]?구',
        // ko-KR
        'address-level1': // '(?<!(united|hist|history).?)state|county|region|province' + // todo: not supported in safari
        'county|region|province' + '|county|principality' + // en-UK
        '|都道府県' + // ja-JP
        '|estado|provincia' + // pt-BR, pt-PT
        '|область' + // ru
        '|省' + // zh-CN
        '|地區' + // zh-TW
        '|സംസ്ഥാനം' + // ml
        '|استان' + // fa
        '|राज्य' + // hi
        '|((\\b|_|\\*)(eyalet|[şs]ehir|[İii̇]l(imiz)?|kent)(\\b|_|\\*))' + // tr
        '|^시[·・]?도',
        // ko-KR
        'postal-code': 'zip|postal|post.*code|pcode' + '|pin.?code' + // en-IN
        '|postleitzahl' + // de-DE
        '|\\bcp\\b' + // es
        '|\\bcdp\\b' + // fr-FR
        '|\\bcap\\b' + // it-IT
        '|郵便番号' + // ja-JP
        '|codigo|codpos|\\bcep\\b' + // pt-BR, pt-PT
        '|Почтовый.?Индекс' + // ru
        '|पिन.?कोड' + // hi
        '|പിന്‍കോഡ്' + // ml
        '|邮政编码|邮编' + // zh-CN
        '|郵遞區號' + // zh-TW
        '|(\\b|_)posta kodu(\\b|_)' + // tr
        '|우편.?번호',
        // ko-KR
        country: 'country|countries' + '|país|pais' + // es
        '|(\\b|_)land(\\b|_)(?!.*(mark.*))' + // de-DE landmark is a type in india.
        // '|(?<!(入|出))国' + // ja-JP // todo: not supported in safari
        '|国家' + // zh-CN
        '|국가|나라' + // ko-KR
        '|(\\b|_)(ülke|ulce|ulke)(\\b|_)' + // tr
        '|کشور',
        // fa
        // ==== Name Fields ====
        'cc-name': 'card.?(?:holder|owner)|name.*(\\b)?on(\\b)?.*card' + '|(?:card|cc).?name|cc.?full.?name' + '|karteninhaber' + // de-DE
        '|nombre.*tarjeta' + // es
        '|nom.*carte' + // fr-FR
        '|nome.*cart' + // it-IT
        '|名前' + // ja-JP
        '|Имя.*карты' + // ru
        '|信用卡开户名|开户名|持卡人姓名' + // zh-CN
        '|持卡人姓名',
        // zh-TW
        name: '^name|full.?name|your.?name|customer.?name|bill.?name|ship.?name' + '|name.*first.*last|firstandlastname' + '|nombre.*y.*apellidos' + // es
        '|^nom(?!bre)' + // fr-FR
        '|お名前|氏名' + // ja-JP
        '|^nome' + // pt-BR, pt-PT
        '|نام.*نام.*خانوادگی' + // fa
        '|姓名' + // zh-CN
        '|(\\b|_|\\*)ad[ı]? soyad[ı]?(\\b|_|\\*)' + // tr
        '|성명',
        // ko-KR
        'given-name': 'first.*name|initials|fname|first$|given.*name' + '|vorname' + // de-DE
        '|nombre' + // es
        '|forename|prénom|prenom' + // fr-FR
        '|名' + // ja-JP
        '|nome' + // pt-BR, pt-PT
        '|Имя' + // ru
        '|نام' + // fa
        '|이름' + // ko-KR
        '|പേര്' + // ml
        '|(\\b|_|\\*)(isim|ad|ad(i|ı|iniz|ınız)?)(\\b|_|\\*)' + // tr
        '|नाम',
        // hi
        'additional-name': 'middle.*name|mname|middle$|middle.*initial|m\\.i\\.|mi$|\\bmi\\b',
        'family-name': 'last.*name|lname|surname|last$|secondname|family.*name' + '|nachname' + // de-DE
        '|apellidos?' + // es
        '|famille|^nom(?!bre)' + // fr-FR
        '|cognome' + // it-IT
        '|姓' + // ja-JP
        '|apelidos|surename|sobrenome' + // pt-BR, pt-PT
        '|Фамилия' + // ru
        '|نام.*خانوادگی' + // fa
        '|उपनाम' + // hi
        '|മറുപേര്' + // ml
        '|(\\b|_|\\*)(soyisim|soyad(i|ı|iniz|ınız)?)(\\b|_|\\*)' + // tr
        '|\\b성(?:[^명]|\\b)',
        // ko-KR
        // ==== Credit Card Fields ====
        // Note: `cc-name` expression has been moved up, above `name`, in
        // order to handle specialization through ordering.
        'cc-number': '(add)?(?:card|cc|acct).?(?:number|#|no|num|field)' + // '|(?<!telefon|haus|person|fødsels)nummer' + // de-DE, sv-SE, no // todo: not supported in safari
        '|カード番号' + // ja-JP
        '|Номер.*карты' + // ru
        '|信用卡号|信用卡号码' + // zh-CN
        '|信用卡卡號' + // zh-TW
        '|카드' + // ko-KR
        // es/pt/fr
        '|(numero|número|numéro)(?!.*(document|fono|phone|réservation))',
        'cc-exp-month': // 'expir|exp.*mo|exp.*date|ccmonth|cardmonth|addmonth' + // todo: Decide if we need any of this
        'gueltig|gültig|monat' + // de-DE
        '|fecha' + // es
        '|date.*exp' + // fr-FR
        '|scadenza' + // it-IT
        '|有効期限' + // ja-JP
        '|validade' + // pt-BR, pt-PT
        '|Срок действия карты' + // ru
        '|月',
        // zh-CN
        'cc-exp-year': // 'exp|^/|(add)?year' + // todo: Decide if we need any of this
        'ablaufdatum|gueltig|gültig|jahr' + // de-DE
        '|fecha' + // es
        '|scadenza' + // it-IT
        '|有効期限' + // ja-JP
        '|validade' + // pt-BR, pt-PT
        '|Срок действия карты' + // ru
        '|年|有效期',
        // zh-CN
        'cc-exp': 'expir|exp.*date|^expfield$' + '|gueltig|gültig' + // de-DE
        '|fecha' + // es
        '|date.*exp' + // fr-FR
        '|scadenza' + // it-IT
        '|有効期限' + // ja-JP
        '|validade' + // pt-BR, pt-PT
        '|Срок действия карты' // ru

      }]
    }
  }
};
exports.matchingConfiguration = matchingConfiguration;

},{"./selectors-css.js":42}],41:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkPlaceholderAndLabels = exports.Matching = void 0;
exports.createMatching = createMatching;
exports.getInputMainType = exports.getExplicitLabelsText = void 0;
exports.getInputSubtype = getInputSubtype;
exports.getInputType = getInputType;
exports.getMainTypeFromType = getMainTypeFromType;
exports.getRelatedText = void 0;
exports.getSubtypeFromType = getSubtypeFromType;
exports.safeRegex = exports.removeExcessWhitespace = exports.matchInPlaceholderAndLabels = void 0;

var _vendorRegex = require("./vendor-regex.js");

var _constants = require("../constants.js");

var _labelUtil = require("./label-util.js");

var _selectorsCss = require("./selectors-css.js");

var _matchingConfiguration = require("./matching-configuration.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get"); return _classApplyDescriptorGet(receiver, descriptor); }

function _classApplyDescriptorGet(receiver, descriptor) { if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set"); _classApplyDescriptorSet(receiver, descriptor, value); return value; }

function _classExtractFieldDescriptor(receiver, privateMap, action) { if (!privateMap.has(receiver)) { throw new TypeError("attempted to " + action + " private field on non-instance"); } return privateMap.get(receiver); }

function _classApplyDescriptorSet(receiver, descriptor, value) { if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } }

const {
  TEXT_LENGTH_CUTOFF,
  ATTR_INPUT_TYPE
} = _constants.constants;
/**
 * An abstraction around the concept of classifying input fields.
 *
 * The only state this class keeps is derived from the passed-in MatchingConfiguration.
 */

var _config = /*#__PURE__*/new WeakMap();

var _cssSelectors = /*#__PURE__*/new WeakMap();

var _ddgMatchers = /*#__PURE__*/new WeakMap();

var _vendorRegExpCache = /*#__PURE__*/new WeakMap();

var _matcherLists = /*#__PURE__*/new WeakMap();

var _defaultStrategyOrder = /*#__PURE__*/new WeakMap();

class Matching {
  /** @type {MatchingConfiguration} */

  /** @type {CssSelectorConfiguration['selectors']} */

  /** @type {Record<string, DDGMatcher>} */

  /**
   * This acts as an internal cache for the larger vendorRegexes
   * @type {{RULES: Record<keyof VendorRegexRules, RegExp|undefined>}}
   */

  /** @type {MatcherLists} */

  /** @type {Array<StrategyNames>} */

  /** @type {Record<MatchableStrings, string>} */

  /**
   * @param {MatchingConfiguration} config
   */
  constructor(config) {
    _classPrivateFieldInitSpec(this, _config, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _cssSelectors, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _ddgMatchers, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _vendorRegExpCache, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _matcherLists, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _defaultStrategyOrder, {
      writable: true,
      value: ['cssSelector', 'ddgMatcher', 'vendorRegex']
    });

    _defineProperty(this, "activeElementStrings", {
      nameAttr: '',
      labelText: '',
      placeholderAttr: '',
      relatedText: '',
      id: ''
    });

    _defineProperty(this, "_elementStringCache", new WeakMap());

    _classPrivateFieldSet(this, _config, config);

    const {
      rules,
      ruleSets
    } = _classPrivateFieldGet(this, _config).strategies.vendorRegex;

    _classPrivateFieldSet(this, _vendorRegExpCache, (0, _vendorRegex.createCacheableVendorRegexes)(rules, ruleSets));

    _classPrivateFieldSet(this, _cssSelectors, _classPrivateFieldGet(this, _config).strategies.cssSelector.selectors);

    _classPrivateFieldSet(this, _ddgMatchers, _classPrivateFieldGet(this, _config).strategies.ddgMatcher.matchers);

    _classPrivateFieldSet(this, _matcherLists, {
      cc: [],
      id: [],
      password: [],
      username: [],
      email: []
    });
    /**
     * Convert the raw config data into actual references.
     *
     * For example this takes `email: ["email"]` and creates
     *
     * `email: [{type: "email", strategies: {cssSelector: "email", ... etc}]`
     */


    for (let [listName, matcherNames] of Object.entries(_classPrivateFieldGet(this, _config).matchers.lists)) {
      for (let fieldName of matcherNames) {
        if (!_classPrivateFieldGet(this, _matcherLists)[listName]) {
          _classPrivateFieldGet(this, _matcherLists)[listName] = [];
        }

        _classPrivateFieldGet(this, _matcherLists)[listName].push(_classPrivateFieldGet(this, _config).matchers.fields[fieldName]);
      }
    }
  }
  /**
   * @param {HTMLInputElement|HTMLSelectElement} input
   * @param {HTMLElement} formEl
   */


  setActiveElementStrings(input, formEl) {
    this.activeElementStrings = this.getElementStrings(input, formEl);
  }
  /**
   * Try to access a 'vendor regex' by name
   * @param {string} regexName
   * @returns {RegExp | undefined}
   */


  vendorRegex(regexName) {
    const match = _classPrivateFieldGet(this, _vendorRegExpCache).RULES[regexName];

    if (!match) {
      console.warn('Vendor Regex not found for', regexName);
      return undefined;
    }

    return match;
  }
  /**
   * Try to access a 'css selector' by name from configuration
   * @param {keyof RequiredCssSelectors | string} selectorName
   * @returns {string};
   */


  cssSelector(selectorName) {
    const match = _classPrivateFieldGet(this, _cssSelectors)[selectorName];

    if (!match) {
      console.warn('CSS selector not found for %s, using a default value', selectorName);
      return '';
    }

    if (Array.isArray(match)) {
      return match.join(',');
    }

    return match;
  }
  /**
   * Try to access a 'ddg matcher' by name from configuration
   * @param {keyof RequiredCssSelectors | string} matcherName
   * @returns {DDGMatcher | undefined}
   */


  ddgMatcher(matcherName) {
    const match = _classPrivateFieldGet(this, _ddgMatchers)[matcherName];

    if (!match) {
      console.warn('DDG matcher not found for', matcherName);
      return undefined;
    }

    return match;
  }
  /**
   * Try to access a list of matchers by name - these are the ones collected in the constructor
   * @param {keyof MatcherLists} listName
   * @return {Matcher[]}
   */


  matcherList(listName) {
    const matcherList = _classPrivateFieldGet(this, _matcherLists)[listName];

    if (!matcherList) {
      console.warn('MatcherList not found for ', listName);
      return [];
    }

    return matcherList;
  }
  /**
   * Convert a list of matchers into a single CSS selector.
   *
   * This will consider all matchers in the list and if it
   * contains a CSS Selector it will be added to the final output
   *
   * @param {keyof MatcherLists} listName
   * @returns {string | undefined}
   */


  joinCssSelectors(listName) {
    const matcherList = this.matcherList(listName);

    if (!matcherList) {
      console.warn('Matcher list not found for', listName);
      return undefined;
    }
    /**
     * @type {string[]}
     */


    const selectors = [];

    for (let matcher of matcherList) {
      if (matcher.strategies.cssSelector) {
        const css = this.cssSelector(matcher.strategies.cssSelector);

        if (css) {
          selectors.push(css);
        }
      }
    }

    return selectors.join(', ');
  }
  /**
   * Tries to infer the input type for an input
   *
   * @param {HTMLInputElement|HTMLSelectElement} input
   * @param {HTMLElement} formEl
   * @param {{isLogin?: boolean}} [opts]
   * @returns {SupportedTypes}
   */


  inferInputType(input, formEl) {
    let opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    const presetType = getInputType(input);

    if (presetType !== 'unknown') {
      return presetType;
    }

    this.setActiveElementStrings(input, formEl); // // For CC forms we run aggressive matches, so we want to make sure we only
    // // run them on actual CC forms to avoid false positives and expensive loops

    if (this.isCCForm(formEl)) {
      const subtype = this.subtypeFromMatchers('cc', input);

      if (subtype && isValidCreditCardSubtype(subtype)) {
        return "creditCards.".concat(subtype);
      }
    }

    if (input instanceof HTMLInputElement) {
      if (this.subtypeFromMatchers('password', input)) {
        return 'credentials.password';
      }

      if (this.subtypeFromMatchers('email', input)) {
        return opts.isLogin ? 'credentials.username' : 'identities.emailAddress';
      }

      if (this.subtypeFromMatchers('username', input)) {
        return 'credentials.username';
      }
    }

    const idSubtype = this.subtypeFromMatchers('id', input);

    if (idSubtype && isValidIdentitiesSubtype(idSubtype)) {
      return "identities.".concat(idSubtype);
    }

    return 'unknown';
  }
  /**
   * Sets the input type as a data attribute to the element and returns it
   * @param {HTMLInputElement} input
   * @param {HTMLElement} formEl
   * @param {{isLogin?: boolean}} [opts]
   * @returns {SupportedSubTypes | string}
   */


  setInputType(input, formEl) {
    let opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    const type = this.inferInputType(input, formEl, opts);
    input.setAttribute(ATTR_INPUT_TYPE, type);
    return type;
  }
  /**
   * Tries to infer input subtype, with checks in decreasing order of reliability
   * @param {keyof MatcherLists} listName
   * @param {HTMLInputElement|HTMLSelectElement} el
   * @return {MatcherTypeNames|undefined}
   */


  subtypeFromMatchers(listName, el) {
    const matchers = this.matcherList(listName);
    /**
     * Loop through each strategy in order
     */

    for (let strategyName of _classPrivateFieldGet(this, _defaultStrategyOrder)) {
      var _result4;

      let result;
      /**
       * Now loop through each matcher in the list.
       */

      for (let matcher of matchers) {
        var _result, _result2, _result3;

        /**
         * for each `strategyName` (such as cssSelector), check
         * if the current matcher implements it.
         */
        const lookup = matcher.strategies[strategyName];
        /**
         * Sometimes a matcher may not implement the current strategy,
         * so we skip it
         */

        if (!lookup) continue;
        /**
         * Now perform the matching
         */

        if (strategyName === 'cssSelector') {
          result = this.execCssSelector(lookup, el);
        }

        if (strategyName === 'ddgMatcher') {
          result = this.execDDGMatcher(lookup);
        }

        if (strategyName === 'vendorRegex') {
          result = this.execVendorRegex(lookup);
        }
        /**
         * If there's a match, return the matcher type.
         *
         * So, for example if 'username' had a `cssSelector` implemented, and
         * it matched the current element, then we'd return 'username'
         */


        if ((_result = result) !== null && _result !== void 0 && _result.matched) {
          return matcher.type;
        }
        /**
         * If a matcher wants to prevent all future matching on this element,
         * it would return { matched: false, proceed: false }
         */


        if (!((_result2 = result) !== null && _result2 !== void 0 && _result2.matched) && ((_result3 = result) === null || _result3 === void 0 ? void 0 : _result3.proceed) === false) {
          // If we get here, do not allow subsequent strategies to continue
          return undefined;
        }
      }

      if ((_result4 = result) !== null && _result4 !== void 0 && _result4.skip) break;
    }

    return undefined;
  }
  /**
   * CSS selector matching just leverages the `.matches` method on elements
   *
   * @param {string} lookup
   * @param {HTMLInputElement|HTMLSelectElement} el
   * @returns {MatchingResult}
   */


  execCssSelector(lookup, el) {
    const selector = this.cssSelector(lookup);
    return {
      matched: el.matches(selector)
    };
  }
  /**
   * A DDG Matcher can have a `match` regex along with a `not` regex. This is done
   * to allow it to be driven by configuration as it avoids needing to invoke custom functions.
   *
   * todo: maxDigits was added as an edge-case when converting this over to be declarative, but I'm
   * unsure if it's actually needed. It's not urgent, but we should consider removing it if that's the case
   *
   * @param {string} lookup
   * @returns {MatchingResult}
   */


  execDDGMatcher(lookup) {
    const ddgMatcher = this.ddgMatcher(lookup);

    if (!ddgMatcher || !ddgMatcher.match) {
      return {
        matched: false
      };
    }

    let matchRexExp = safeRegex(ddgMatcher.match || '');

    if (!matchRexExp) {
      return {
        matched: false
      };
    }

    let requiredScore = ['match', 'forceUnknown', 'maxDigits'].filter(ddgMatcherProp => ddgMatcherProp in ddgMatcher).length;
    /** @type {MatchableStrings[]} */

    const matchableStrings = ddgMatcher.matchableStrings || ['labelText', 'placeholderAttr', 'relatedText'];

    for (let stringName of matchableStrings) {
      let elementString = this.activeElementStrings[stringName];
      if (!elementString) continue;
      elementString = elementString.toLowerCase(); // Scoring to ensure all DDG tests are valid

      let score = 0; // If a negated regex was provided, ensure it does not match
      // If it DOES match - then we need to prevent any future strategies from continuing

      if (ddgMatcher.forceUnknown) {
        let notRegex = safeRegex(ddgMatcher.forceUnknown);

        if (!notRegex) {
          return {
            matched: false
          };
        }

        if (notRegex.test(elementString)) {
          return {
            matched: false,
            proceed: false
          };
        } else {
          // All good here, increment the score
          score++;
        }
      }

      if (ddgMatcher.skip) {
        let skipRegex = safeRegex(ddgMatcher.skip);

        if (!skipRegex) {
          return {
            matched: false
          };
        }

        if (skipRegex.test(elementString)) {
          return {
            matched: false,
            skip: true
          };
        }
      } // if the `match` regex fails, moves onto the next string


      if (!matchRexExp.test(elementString)) {
        continue;
      } // Otherwise, increment the score


      score++; // If a 'maxDigits' rule was provided, validate it

      if (ddgMatcher.maxDigits) {
        const digitLength = elementString.replace(/[^0-9]/g, '').length;

        if (digitLength > ddgMatcher.maxDigits) {
          return {
            matched: false
          };
        } else {
          score++;
        }
      }

      if (score === requiredScore) {
        return {
          matched: true
        };
      }
    }

    return {
      matched: false
    };
  }
  /**
   * If we get here, a firefox/vendor regex was given and we can execute it on the element
   * strings
   * @param {string} lookup
   * @return {MatchingResult}
   */


  execVendorRegex(lookup) {
    const regex = this.vendorRegex(lookup);

    if (!regex) {
      return {
        matched: false
      };
    }
    /** @type {MatchableStrings[]} */


    const stringsToMatch = ['placeholderAttr', 'nameAttr', 'labelText', 'id', 'relatedText'];

    for (let stringName of stringsToMatch) {
      let elementString = this.activeElementStrings[stringName];
      if (!elementString) continue;
      elementString = elementString.toLowerCase();

      if (regex.test(elementString)) {
        return {
          matched: true
        };
      }
    }

    return {
      matched: false
    };
  }
  /**
   * Yield strings in the order in which they should be checked against.
   *
   * Note: some strategies may not want to accept all strings, which is
   * where `matchableStrings` helps. It defaults to when you see below but can
   * be overridden.
   *
   * For example, `nameAttr` is first, since this has the highest chance of matching
   * and then the rest are in decreasing order of value vs cost
   *
   * A generator function is used here to prevent any potentially expensive
   * lookups occurring if they are rare. For example if 90% of all matching never needs
   * to look at the output from `relatedText`, then the cost of computing it will be avoided.
   *
   * @param {HTMLInputElement|HTMLSelectElement} el
   * @param {HTMLElement} form
   * @returns {Record<MatchableStrings, string>}
   */


  getElementStrings(el, form) {
    if (this._elementStringCache.has(el)) {
      return this._elementStringCache.get(el);
    }

    const explicitLabelsText = getExplicitLabelsText(el);
    /** @type {Record<MatchableStrings, string>} */

    const next = {
      nameAttr: el.name,
      labelText: explicitLabelsText,
      placeholderAttr: el.placeholder || '',
      id: el.id,
      relatedText: explicitLabelsText ? '' : getRelatedText(el, form, this.cssSelector('FORM_INPUTS_SELECTOR'))
    };

    this._elementStringCache.set(el, next);

    return next;
  }

  clear() {
    this._elementStringCache = new WeakMap();
  }
  /**
   * @param {HTMLInputElement|HTMLSelectElement} input
   * @param {HTMLElement} form
   * @returns {Matching}
   */


  forInput(input, form) {
    this.setActiveElementStrings(input, form);
    return this;
  }
  /**
   * Tries to infer if it's a credit card form
   * @param {HTMLElement} formEl
   * @returns {boolean}
   */


  isCCForm(formEl) {
    var _formEl$textContent;

    const ccFieldSelector = this.joinCssSelectors('cc');

    if (!ccFieldSelector) {
      return false;
    }

    const hasCCSelectorChild = formEl.querySelector(ccFieldSelector); // If the form contains one of the specific selectors, we have high confidence

    if (hasCCSelectorChild) return true; // Read form attributes to find a signal

    const hasCCAttribute = [...formEl.attributes].some(_ref => {
      let {
        name,
        value
      } = _ref;
      return /(credit|payment).?card/i.test("".concat(name, "=").concat(value));
    });
    if (hasCCAttribute) return true; // Match form textContent against common cc fields (includes hidden labels)

    const textMatches = (_formEl$textContent = formEl.textContent) === null || _formEl$textContent === void 0 ? void 0 : _formEl$textContent.match(/(credit|payment).?card(.?number)?|ccv|security.?code|cvv|cvc|csc/ig); // We check for more than one to minimise false positives

    return Boolean(textMatches && textMatches.length > 1);
  }
  /**
   * @type {MatchingConfiguration}
   */


}
/**
 *  @returns {SupportedTypes}
 */


exports.Matching = Matching;

_defineProperty(Matching, "emptyConfig", {
  matchers: {
    lists: {},
    fields: {}
  },
  strategies: {
    'vendorRegex': {
      rules: {},
      ruleSets: []
    },
    'ddgMatcher': {
      matchers: {}
    },
    'cssSelector': {
      selectors: {
        FORM_INPUTS_SELECTOR: _selectorsCss.FORM_INPUTS_SELECTOR
      }
    }
  }
});

function getInputType(input) {
  const attr = input === null || input === void 0 ? void 0 : input.getAttribute(ATTR_INPUT_TYPE);

  if (isValidSupportedType(attr)) {
    return attr;
  }

  return 'unknown';
}
/**
 * Retrieves the main type
 * @param {SupportedTypes | string} type
 * @returns {SupportedMainTypes}
 */


function getMainTypeFromType(type) {
  const mainType = type.split('.')[0];

  switch (mainType) {
    case 'credentials':
    case 'creditCards':
    case 'identities':
      return mainType;
  }

  return 'unknown';
}
/**
 * Retrieves the input main type
 * @param {HTMLInputElement} input
 * @returns {SupportedMainTypes}
 */


const getInputMainType = input => getMainTypeFromType(getInputType(input));
/** @typedef {supportedIdentitiesSubtypes[number]} SupportedIdentitiesSubTypes */


exports.getInputMainType = getInputMainType;
const supportedIdentitiesSubtypes =
/** @type {const} */
['emailAddress', 'firstName', 'middleName', 'lastName', 'fullName', 'phone', 'addressStreet', 'addressStreet2', 'addressCity', 'addressProvince', 'addressPostalCode', 'addressCountryCode', 'birthdayDay', 'birthdayMonth', 'birthdayYear'];
/**
 * @param {SupportedTypes | any} supportedType
 * @returns {supportedType is SupportedIdentitiesSubTypes}
 */

function isValidIdentitiesSubtype(supportedType) {
  return supportedIdentitiesSubtypes.includes(supportedType);
}
/** @typedef {supportedCreditCardSubtypes[number]} SupportedCreditCardSubTypes */


const supportedCreditCardSubtypes =
/** @type {const} */
['cardName', 'cardNumber', 'cardSecurityCode', 'expirationMonth', 'expirationYear', 'expiration'];
/**
 * @param {SupportedTypes | any} supportedType
 * @returns {supportedType is SupportedCreditCardSubTypes}
 */

function isValidCreditCardSubtype(supportedType) {
  return supportedCreditCardSubtypes.includes(supportedType);
}
/** @typedef {supportedCredentialsSubtypes[number]} SupportedCredentialsSubTypes */


const supportedCredentialsSubtypes =
/** @type {const} */
['password', 'username'];
/**
 * @param {SupportedTypes | any} supportedType
 * @returns {supportedType is SupportedCredentialsSubTypes}
 */

function isValidCredentialsSubtype(supportedType) {
  return supportedCredentialsSubtypes.includes(supportedType);
}
/** @typedef {SupportedIdentitiesSubTypes | SupportedCreditCardSubTypes | SupportedCredentialsSubTypes} SupportedSubTypes */

/** @typedef {`identities.${SupportedIdentitiesSubTypes}` | `creditCards.${SupportedCreditCardSubTypes}` | `credentials.${SupportedCredentialsSubTypes}` | 'unknown'} SupportedTypes */


const supportedTypes = [...supportedIdentitiesSubtypes.map(type => "identities.".concat(type)), ...supportedCreditCardSubtypes.map(type => "creditCards.".concat(type)), ...supportedCredentialsSubtypes.map(type => "credentials.".concat(type))];
/**
 * Retrieves the subtype
 * @param {SupportedTypes | string} type
 * @returns {SupportedSubTypes | 'unknown'}
 */

function getSubtypeFromType(type) {
  const subType = type === null || type === void 0 ? void 0 : type.split('.')[1];
  const validType = isValidSubtype(subType);
  return validType ? subType : 'unknown';
}
/**
 * @param {SupportedSubTypes | any} supportedSubType
 * @returns {supportedSubType is SupportedSubTypes}
 */


function isValidSubtype(supportedSubType) {
  return isValidIdentitiesSubtype(supportedSubType) || isValidCreditCardSubtype(supportedSubType) || isValidCredentialsSubtype(supportedSubType);
}
/**
 * @param {SupportedTypes | any} supportedType
 * @returns {supportedType is SupportedTypes}
 */


function isValidSupportedType(supportedType) {
  return supportedTypes.includes(supportedType);
}
/**
 * Retrieves the input subtype
 * @param {HTMLInputElement|Element} input
 * @returns {SupportedSubTypes | 'unknown'}
 */


function getInputSubtype(input) {
  const type = getInputType(input);
  return getSubtypeFromType(type);
}
/**
 * Remove whitespace of more than 2 in a row and trim the string
 * @param {string | null} string
 * @return {string}
 */


const removeExcessWhitespace = function () {
  let string = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return (string || '').replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
};
/**
 * Get text from all explicit labels
 * @param {HTMLInputElement|HTMLSelectElement} el
 * @return {string}
 */


exports.removeExcessWhitespace = removeExcessWhitespace;

const getExplicitLabelsText = el => {
  const labelTextCandidates = [];

  for (let label of el.labels || []) {
    labelTextCandidates.push(...(0, _labelUtil.extractElementStrings)(label));
  }

  if (el.hasAttribute('aria-label')) {
    labelTextCandidates.push(removeExcessWhitespace(el.getAttribute('aria-label')));
  } // Try to access another element if it was marked as the label for this input/select


  const ariaLabelAttr = removeExcessWhitespace(el.getAttribute('aria-labelled') || el.getAttribute('aria-labelledby'));

  if (ariaLabelAttr) {
    const labelledByElement = document.getElementById(ariaLabelAttr);

    if (labelledByElement) {
      labelTextCandidates.push(...(0, _labelUtil.extractElementStrings)(labelledByElement));
    }
  } // Labels with long text are likely to be noisy and lead to false positives


  const filteredLabels = labelTextCandidates.filter(string => string.length < 65);

  if (filteredLabels.length > 0) {
    return filteredLabels.join(' ');
  }

  return '';
};
/**
 * Get all text close to the input (useful when no labels are defined)
 * @param {HTMLInputElement|HTMLSelectElement} el
 * @param {HTMLElement} form
 * @param {string} cssSelector
 * @return {string}
 */


exports.getExplicitLabelsText = getExplicitLabelsText;

const getRelatedText = (el, form, cssSelector) => {
  let scope = getLargestMeaningfulContainer(el, form, cssSelector); // If we didn't find a container, try looking for an adjacent label

  if (scope === el) {
    if (el.previousElementSibling instanceof HTMLLabelElement) {
      scope = el.previousElementSibling;
    }
  } // If there is still no meaningful container return empty string


  if (scope === el || scope.nodeName === 'SELECT') return ''; // If the container has a select element, remove its contents to avoid noise

  const text = removeExcessWhitespace((0, _labelUtil.extractElementStrings)(scope).join(' ')); // If the text is longer than n chars it's too noisy and likely to yield false positives, so return ''

  if (text.length < TEXT_LENGTH_CUTOFF) return text;
  return '';
};
/**
 * Find a container for the input field that won't contain other inputs (useful to get elements related to the field)
 * @param {HTMLElement} el
 * @param {HTMLElement} form
 * @param {string} cssSelector
 * @return {HTMLElement}
 */


exports.getRelatedText = getRelatedText;

const getLargestMeaningfulContainer = (el, form, cssSelector) => {
  /* TODO: there could be more than one select el for the same label, in that case we should
      change how we compute the container */
  const parentElement = el.parentElement;
  if (!parentElement || el === form) return el;
  const inputsInParentsScope = parentElement.querySelectorAll(cssSelector); // To avoid noise, ensure that our input is the only in scope

  if (inputsInParentsScope.length === 1) {
    return getLargestMeaningfulContainer(parentElement, form, cssSelector);
  }

  return el;
};
/**
 * Find a regex match for a given input
 * @param {HTMLInputElement} input
 * @param {RegExp} regex
 * @param {HTMLElement} form
 * @param {string} cssSelector
 * @returns {RegExpMatchArray|null}
 */


const matchInPlaceholderAndLabels = (input, regex, form, cssSelector) => {
  var _input$placeholder;

  return ((_input$placeholder = input.placeholder) === null || _input$placeholder === void 0 ? void 0 : _input$placeholder.match(regex)) || getExplicitLabelsText(input).match(regex) || getRelatedText(input, form, cssSelector).match(regex);
};
/**
 * Check if a given input matches a regex
 * @param {HTMLInputElement} input
 * @param {RegExp} regex
 * @param {HTMLElement} form
 * @param {string} cssSelector
 * @returns {boolean}
 */


exports.matchInPlaceholderAndLabels = matchInPlaceholderAndLabels;

const checkPlaceholderAndLabels = (input, regex, form, cssSelector) => {
  return !!matchInPlaceholderAndLabels(input, regex, form, cssSelector);
};
/**
 * Creating Regex instances can throw, so we add this to be
 * @param {string} string
 * @returns {RegExp | undefined} string
 */


exports.checkPlaceholderAndLabels = checkPlaceholderAndLabels;

const safeRegex = string => {
  try {
    // This is lower-cased here because giving a `i` on a regex flag is a performance problem in some cases
    const input = String(string).toLowerCase().normalize('NFKC');
    return new RegExp(input, 'u');
  } catch (e) {
    console.warn('Could not generate regex from string input', string);
    return undefined;
  }
};
/**
 * Factory for instances of Matching
 *
 * @return {Matching}
 */


exports.safeRegex = safeRegex;

function createMatching() {
  return new Matching(_matchingConfiguration.matchingConfiguration);
}

},{"../constants.js":62,"./label-util.js":38,"./matching-configuration.js":40,"./selectors-css.js":42,"./vendor-regex.js":43}],42:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.__secret_do_not_use = exports.SUBMIT_BUTTON_SELECTOR = exports.FORM_INPUTS_SELECTOR = void 0;
const FORM_INPUTS_SELECTOR = "\ninput:not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]):not([type=search]):not([name^=fake i]):not([data-description^=dummy i]),\nselect";
exports.FORM_INPUTS_SELECTOR = FORM_INPUTS_SELECTOR;
const SUBMIT_BUTTON_SELECTOR = "\ninput[type=submit],\ninput[type=button],\nbutton:not([role=switch]):not([role=link]),\n[role=button],\na[href=\"#\"][id*=button i],\na[href=\"#\"][id*=btn i]";
exports.SUBMIT_BUTTON_SELECTOR = SUBMIT_BUTTON_SELECTOR;
const email = "\ninput:not([type])[name*=email i]:not([placeholder*=search i]):not([placeholder*=filter i]):not([placeholder*=subject i]),\ninput[type=\"\"][name*=email i]:not([placeholder*=search i]):not([placeholder*=filter i]):not([placeholder*=subject i]),\ninput[type=text][name*=email i]:not([placeholder*=search i]):not([placeholder*=filter i]):not([placeholder*=subject i]):not([name*=title i]):not([name*=tab i]),\ninput:not([type])[placeholder*=email i]:not([placeholder*=search i]):not([placeholder*=filter i]):not([placeholder*=subject i]),\ninput[type=text][placeholder*=email i]:not([placeholder*=search i]):not([placeholder*=filter i]):not([placeholder*=subject i]),\ninput[type=\"\"][placeholder*=email i]:not([placeholder*=search i]):not([placeholder*=filter i]):not([placeholder*=subject i]),\ninput:not([type])[placeholder*=email i]:not([placeholder*=search i]):not([placeholder*=filter i]):not([placeholder*=subject i]),\ninput[type=email],\ninput[type=text][aria-label*=email i]:not([aria-label*=search i]),\ninput:not([type])[aria-label*=email i]:not([aria-label*=search i]),\ninput[type=text][placeholder*=email i]:not([placeholder*=search i]):not([placeholder*=filter i]):not([placeholder*=subject i]),\ninput[name=username][type=email],\ninput[autocomplete=email]"; // We've seen non-standard types like 'user'. This selector should get them, too

const GENERIC_TEXT_FIELD = "\ninput:not([type=button]):not([type=checkbox]):not([type=color]):not([type=date]):not([type=datetime-local]):not([type=datetime]):not([type=file]):not([type=hidden]):not([type=month]):not([type=number]):not([type=radio]):not([type=range]):not([type=reset]):not([type=search]):not([type=submit]):not([type=time]):not([type=url]):not([type=week])";
const password = "input[type=password]:not([autocomplete*=cc]):not([autocomplete=one-time-code]):not([name*=answer i]):not([name*=mfa i]):not([name*=tin i])";
const cardName = "\ninput[autocomplete=\"cc-name\"],\ninput[autocomplete=\"ccname\"],\ninput[name=\"ccname\"],\ninput[name=\"cc-name\"],\ninput[name=\"ppw-accountHolderName\"],\ninput[id*=cardname i],\ninput[id*=card-name i],\ninput[id*=card_name i]";
const cardNumber = "\ninput[autocomplete=\"cc-number\"],\ninput[autocomplete=\"ccnumber\"],\ninput[autocomplete=\"cardnumber\"],\ninput[autocomplete=\"card-number\"],\ninput[name=\"ccnumber\"],\ninput[name=\"cc-number\"],\ninput[name*=card i][name*=number i],\ninput[id*=cardnumber i],\ninput[id*=card-number i],\ninput[id*=card_number i]";
const cardSecurityCode = "\ninput[autocomplete=\"cc-csc\"],\ninput[autocomplete=\"csc\"],\ninput[autocomplete=\"cc-cvc\"],\ninput[autocomplete=\"cvc\"],\ninput[name=\"cvc\"],\ninput[name=\"cc-cvc\"],\ninput[name=\"cc-csc\"],\ninput[name=\"csc\"],\ninput[name*=security i][name*=code i]";
const expirationMonth = "\n[autocomplete=\"cc-exp-month\"],\n[name=\"ccmonth\"],\n[name=\"ppw-expirationDate_month\"],\n[name=cardExpiryMonth],\n[name*=ExpDate_Month i],\n[name*=expiration i][name*=month i],\n[id*=expiration i][id*=month i]";
const expirationYear = "\n[autocomplete=\"cc-exp-year\"],\n[name=\"ccyear\"],\n[name=\"ppw-expirationDate_year\"],\n[name=cardExpiryYear],\n[name*=ExpDate_Year i],\n[name*=expiration i][name*=year i],\n[id*=expiration i][id*=year i]";
const expiration = "\n[autocomplete=\"cc-exp\"],\n[name=\"cc-exp\"],\n[name=\"exp-date\"],\n[name=\"expirationDate\"],\ninput[id*=expiration i]";
const firstName = "\n[name*=fname i], [autocomplete*=given-name i],\n[name*=firstname i], [autocomplete*=firstname i],\n[name*=first-name i], [autocomplete*=first-name i],\n[name*=first_name i], [autocomplete*=first_name i],\n[name*=givenname i], [autocomplete*=givenname i],\n[name*=given-name i],\n[name*=given_name i], [autocomplete*=given_name i],\n[name*=forename i], [autocomplete*=forename i]";
const middleName = "\n[name*=mname i], [autocomplete*=additional-name i],\n[name*=middlename i], [autocomplete*=middlename i],\n[name*=middle-name i], [autocomplete*=middle-name i],\n[name*=middle_name i], [autocomplete*=middle_name i],\n[name*=additionalname i], [autocomplete*=additionalname i],\n[name*=additional-name i],\n[name*=additional_name i], [autocomplete*=additional_name i]";
const lastName = "\n[name=lname], [autocomplete*=family-name i],\n[name*=lastname i], [autocomplete*=lastname i],\n[name*=last-name i], [autocomplete*=last-name i],\n[name*=last_name i], [autocomplete*=last_name i],\n[name*=familyname i], [autocomplete*=familyname i],\n[name*=family-name i],\n[name*=family_name i], [autocomplete*=family_name i],\n[name*=surname i], [autocomplete*=surname i]";
const fullName = "\n[name=name], [autocomplete=name],\n[name*=fullname i], [autocomplete*=fullname i],\n[name*=full-name i], [autocomplete*=full-name i],\n[name*=full_name i], [autocomplete*=full_name i],\n[name*=your-name i], [autocomplete*=your-name i]";
const phone = "\n[name*=phone i]:not([name*=extension i]):not([name*=type i]):not([name*=country i]), [name*=mobile i]:not([name*=type i]), [autocomplete=tel], [placeholder*=\"phone number\" i]";
const addressStreet1 = "\n[name=address], [autocomplete=street-address], [autocomplete=address-line1],\n[name=street],\n[name=ppw-line1], [name*=addressLine1 i]";
const addressStreet2 = "\n[name=address], [autocomplete=address-line2],\n[name=ppw-line2], [name*=addressLine2 i]";
const addressCity = "\n[name=city], [autocomplete=address-level2],\n[name=ppw-city], [name*=addressCity i]";
const addressProvince = "\n[name=province], [name=state], [autocomplete=address-level1]";
const addressPostalCode = "\n[name=zip], [name=zip2], [name=postal], [autocomplete=postal-code], [autocomplete=zip-code],\n[name*=postalCode i], [name*=zipcode i]";
const addressCountryCode = ["[name=country], [autocomplete=country],\n     [name*=countryCode i], [name*=country-code i],\n     [name*=countryName i], [name*=country-name i]", "select.idms-address-country" // Fix for Apple signup
];
const birthdayDay = "\n[name=bday-day],\n[name=birthday_day], [name=birthday-day],\n[name=date_of_birth_day], [name=date-of-birth-day],\n[name^=birthdate_d], [name^=birthdate-d],\n[aria-label=\"birthday\" i][placeholder=\"day\" i]";
const birthdayMonth = "\n[name=bday-month],\n[name=birthday_month], [name=birthday-month],\n[name=date_of_birth_month], [name=date-of-birth-month],\n[name^=birthdate_m], [name^=birthdate-m],\nselect[name=\"mm\"]";
const birthdayYear = "\n[name=bday-year],\n[name=birthday_year], [name=birthday-year],\n[name=date_of_birth_year], [name=date-of-birth-year],\n[name^=birthdate_y], [name^=birthdate-y],\n[aria-label=\"birthday\" i][placeholder=\"year\" i]";
const username = ["".concat(GENERIC_TEXT_FIELD, "[autocomplete^=user]"), "input[name=username i]", // fix for `aa.com`
"input[name=\"loginId\" i]", // fix for https://online.mbank.pl/pl/Login
"input[name=\"userID\" i]", "input[id=\"login-id\" i]", "input[name=accountname i]", "input[autocomplete=username]", "input[name*=accountid i]", "input[name=\"j_username\" i]", "input[id=\"username\" i]"]; // todo: these are still used directly right now, mostly in scanForInputs
// todo: ensure these can be set via configuration

// Exported here for now, to be moved to configuration later
// eslint-disable-next-line camelcase
const __secret_do_not_use = {
  GENERIC_TEXT_FIELD,
  SUBMIT_BUTTON_SELECTOR,
  FORM_INPUTS_SELECTOR,
  email: email,
  password,
  username,
  cardName,
  cardNumber,
  cardSecurityCode,
  expirationMonth,
  expirationYear,
  expiration,
  firstName,
  middleName,
  lastName,
  fullName,
  phone,
  addressStreet1,
  addressStreet2,
  addressCity,
  addressProvince,
  addressPostalCode,
  addressCountryCode,
  birthdayDay,
  birthdayMonth,
  birthdayYear
};
exports.__secret_do_not_use = __secret_do_not_use;

},{}],43:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createCacheableVendorRegexes = createCacheableVendorRegexes;

/**
 * Given some ruleSets, create an efficient
 * lookup system for accessing cached regexes by name.
 *
 * @param {VendorRegexConfiguration["rules"]} rules
 * @param {VendorRegexConfiguration["ruleSets"]} ruleSets
 * @return {{RULES: Record<keyof VendorRegexRules, RegExp | undefined>}}
 */
function createCacheableVendorRegexes(rules, ruleSets) {
  const vendorRegExp = {
    RULES: rules,
    RULE_SETS: ruleSets,

    _getRule(name) {
      let rules = [];
      this.RULE_SETS.forEach(set => {
        if (set[name]) {
          var _set$name;

          // Add the rule.
          // We make the regex lower case so that we can match it against the
          // lower-cased field name and get a rough equivalent of a case-insensitive
          // match. This avoids a performance cliff with the "iu" flag on regular
          // expressions.
          rules.push("(".concat((_set$name = set[name]) === null || _set$name === void 0 ? void 0 : _set$name.toLowerCase(), ")").normalize('NFKC'));
        }
      });
      const value = new RegExp(rules.join('|'), 'u');
      Object.defineProperty(this.RULES, name, {
        get: undefined
      });
      Object.defineProperty(this.RULES, name, {
        value
      });
      return value;
    },

    init() {
      Object.keys(this.RULES).forEach(field => Object.defineProperty(this.RULES, field, {
        get() {
          return vendorRegExp._getRule(field);
        }

      }));
    }

  };
  vendorRegExp.init(); // @ts-ignore

  return vendorRegExp;
}

},{}],44:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PROVIDER_LOCKED = exports.AUTOGENERATED_KEY = void 0;
exports.appendGeneratedId = appendGeneratedId;
exports.createCredentialsTooltipItem = createCredentialsTooltipItem;
exports.fromPassword = fromPassword;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get"); return _classApplyDescriptorGet(receiver, descriptor); }

function _classApplyDescriptorGet(receiver, descriptor) { if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set"); _classApplyDescriptorSet(receiver, descriptor, value); return value; }

function _classExtractFieldDescriptor(receiver, privateMap, action) { if (!privateMap.has(receiver)) { throw new TypeError("attempted to " + action + " private field on non-instance"); } return privateMap.get(receiver); }

function _classApplyDescriptorSet(receiver, descriptor, value) { if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } }

const AUTOGENERATED_KEY = 'autogenerated';
exports.AUTOGENERATED_KEY = AUTOGENERATED_KEY;
const PROVIDER_LOCKED = 'provider_locked';
/**
 * @implements {TooltipItemRenderer}
 */

exports.PROVIDER_LOCKED = PROVIDER_LOCKED;

var _data = /*#__PURE__*/new WeakMap();

class CredentialsTooltipItem {
  /** @type {CredentialsObject} */

  /** @param {CredentialsObject} data */
  constructor(data) {
    _classPrivateFieldInitSpec(this, _data, {
      writable: true,
      value: void 0
    });

    _defineProperty(this, "id", () => String(_classPrivateFieldGet(this, _data).id));

    _defineProperty(this, "labelMedium", _subtype => _classPrivateFieldGet(this, _data).username);

    _defineProperty(this, "labelSmall", _subtype => '•••••••••••••••');

    _defineProperty(this, "credentialsProvider", () => _classPrivateFieldGet(this, _data).credentialsProvider);

    _classPrivateFieldSet(this, _data, data);
  }

}
/**
 * @implements {TooltipItemRenderer}
 */


var _data2 = /*#__PURE__*/new WeakMap();

class AutoGeneratedCredential {
  /** @type {CredentialsObject} */

  /** @param {CredentialsObject} data */
  constructor(data) {
    _classPrivateFieldInitSpec(this, _data2, {
      writable: true,
      value: void 0
    });

    _defineProperty(this, "id", () => String(_classPrivateFieldGet(this, _data2).id));

    _defineProperty(this, "label", _subtype => _classPrivateFieldGet(this, _data2).password);

    _defineProperty(this, "labelMedium", _subtype => 'Generated password');

    _defineProperty(this, "labelSmall", _subtype => 'Login information will be saved for this website');

    _classPrivateFieldSet(this, _data2, data);
  }

}
/**
 * Generate a stand-in 'CredentialsObject' from a
 * given (generated) password.
 *
 * @param {string} password
 * @returns {CredentialsObject}
 */


function fromPassword(password) {
  return {
    [AUTOGENERATED_KEY]: true,
    password: password,
    username: ''
  };
}
/**
 * @implements TooltipItemRenderer
 */


var _data3 = /*#__PURE__*/new WeakMap();

class ProviderLockedItem {
  /** @type {CredentialsObject} */

  /** @param {CredentialsObject} data */
  constructor(data) {
    _classPrivateFieldInitSpec(this, _data3, {
      writable: true,
      value: void 0
    });

    _defineProperty(this, "id", () => String(_classPrivateFieldGet(this, _data3).id));

    _defineProperty(this, "labelMedium", _subtype => 'Bitwarden is locked');

    _defineProperty(this, "labelSmall", _subtype => 'Unlock your vault to access credentials or generate passwords');

    _defineProperty(this, "credentialsProvider", () => _classPrivateFieldGet(this, _data3).credentialsProvider);

    _classPrivateFieldSet(this, _data3, data);
  }

}
/**
 * If the locally generated/stored password ends up being the same
 * as submitted in a subsequent form submission - then we mark the
 * credentials as 'autogenerated' so that the native layer can decide
 * how to process it
 *
 * @type {PreRequest<DataStorageObject, string|null>}
 */


function appendGeneratedId(data, generatedPassword) {
  var _data$credentials;

  if (generatedPassword && ((_data$credentials = data.credentials) === null || _data$credentials === void 0 ? void 0 : _data$credentials.password) === generatedPassword) {
    return { ...data,
      credentials: { ...data.credentials,
        [AUTOGENERATED_KEY]: true
      }
    };
  }

  return data;
}
/**
 * Factory for creating a TooltipItemRenderer
 *
 * @param {CredentialsObject} data
 * @returns {TooltipItemRenderer}
 */


function createCredentialsTooltipItem(data) {
  if (data.id === PROVIDER_LOCKED) {
    return new ProviderLockedItem(data);
  }

  if (AUTOGENERATED_KEY in data && data.password) {
    return new AutoGeneratedCredential(data);
  }

  return new CredentialsTooltipItem(data);
}

},{}],45:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CreditCardTooltipItem = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get"); return _classApplyDescriptorGet(receiver, descriptor); }

function _classApplyDescriptorGet(receiver, descriptor) { if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set"); _classApplyDescriptorSet(receiver, descriptor, value); return value; }

function _classExtractFieldDescriptor(receiver, privateMap, action) { if (!privateMap.has(receiver)) { throw new TypeError("attempted to " + action + " private field on non-instance"); } return privateMap.get(receiver); }

function _classApplyDescriptorSet(receiver, descriptor, value) { if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } }

var _data = /*#__PURE__*/new WeakMap();

/**
 * @implements {TooltipItemRenderer}
 */
class CreditCardTooltipItem {
  /** @type {CreditCardObject} */

  /** @param {CreditCardObject} data */
  constructor(data) {
    _classPrivateFieldInitSpec(this, _data, {
      writable: true,
      value: void 0
    });

    _defineProperty(this, "id", () => String(_classPrivateFieldGet(this, _data).id));

    _defineProperty(this, "labelMedium", _ => _classPrivateFieldGet(this, _data).title);

    _defineProperty(this, "labelSmall", _ => _classPrivateFieldGet(this, _data).displayNumber);

    _classPrivateFieldSet(this, _data, data);
  }

}

exports.CreditCardTooltipItem = CreditCardTooltipItem;

},{}],46:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IdentityTooltipItem = void 0;

var _formatters = require("../Form/formatters.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get"); return _classApplyDescriptorGet(receiver, descriptor); }

function _classApplyDescriptorGet(receiver, descriptor) { if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set"); _classApplyDescriptorSet(receiver, descriptor, value); return value; }

function _classExtractFieldDescriptor(receiver, privateMap, action) { if (!privateMap.has(receiver)) { throw new TypeError("attempted to " + action + " private field on non-instance"); } return privateMap.get(receiver); }

function _classApplyDescriptorSet(receiver, descriptor, value) { if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } }

var _data = /*#__PURE__*/new WeakMap();

/**
 * @implements {TooltipItemRenderer}
 */
class IdentityTooltipItem {
  /** @type {IdentityObject} */

  /** @param {IdentityObject} data */
  constructor(data) {
    _classPrivateFieldInitSpec(this, _data, {
      writable: true,
      value: void 0
    });

    _defineProperty(this, "id", () => String(_classPrivateFieldGet(this, _data).id));

    _defineProperty(this, "labelMedium", subtype => {
      if (subtype === 'addressCountryCode') {
        return (0, _formatters.getCountryDisplayName)('en', _classPrivateFieldGet(this, _data).addressCountryCode || '');
      }

      if (_classPrivateFieldGet(this, _data).id === 'privateAddress') {
        return 'Generate Private Duck Address';
      }

      return _classPrivateFieldGet(this, _data)[subtype];
    });

    _defineProperty(this, "labelSmall", _ => {
      return _classPrivateFieldGet(this, _data).title;
    });

    _classPrivateFieldSet(this, _data, data);
  }

  label(subtype) {
    if (_classPrivateFieldGet(this, _data).id === 'privateAddress') {
      return _classPrivateFieldGet(this, _data)[subtype];
    }

    return null;
  }

}

exports.IdentityTooltipItem = IdentityTooltipItem;

},{"../Form/formatters.js":35}],47:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PasswordGenerator = void 0;

var _index = require("../packages/password/index.js");

var _rules = _interopRequireDefault(require("../packages/password/rules.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set"); _classApplyDescriptorSet(receiver, descriptor, value); return value; }

function _classApplyDescriptorSet(receiver, descriptor, value) { if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get"); return _classApplyDescriptorGet(receiver, descriptor); }

function _classExtractFieldDescriptor(receiver, privateMap, action) { if (!privateMap.has(receiver)) { throw new TypeError("attempted to " + action + " private field on non-instance"); } return privateMap.get(receiver); }

function _classApplyDescriptorGet(receiver, descriptor) { if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

var _previous = /*#__PURE__*/new WeakMap();

/**
 * Create a password once and reuse it.
 */
class PasswordGenerator {
  constructor() {
    _classPrivateFieldInitSpec(this, _previous, {
      writable: true,
      value: null
    });
  }

  /** @returns {boolean} */
  get generated() {
    return _classPrivateFieldGet(this, _previous) !== null;
  }
  /** @returns {string|null} */


  get password() {
    return _classPrivateFieldGet(this, _previous);
  }
  /** @param {import('../packages/password').GenerateOptions} [params] */


  generate() {
    let params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (_classPrivateFieldGet(this, _previous)) {
      return _classPrivateFieldGet(this, _previous);
    }

    _classPrivateFieldSet(this, _previous, (0, _index.generate)({ ...params,
      rules: _rules.default
    }));

    return _classPrivateFieldGet(this, _previous);
  }

}

exports.PasswordGenerator = PasswordGenerator;

},{"../packages/password/index.js":17,"../packages/password/rules.json":21}],48:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createScanner = createScanner;

var _Form = require("./Form/Form.js");

var _autofillUtils = require("./autofill-utils.js");

var _selectorsCss = require("./Form/selectors-css.js");

var _matching = require("./Form/matching.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @typedef {{
 *     forms: Map<HTMLElement, import("./Form/Form").Form>;
 *     init(): ()=> void;
 *     enqueue(elements: (HTMLElement|Document)[]): void;
 *     findEligibleInputs(context): Scanner;
 * }} Scanner
 *
 * @typedef {{
 *     initialDelay: number,
 *     bufferSize: number,
 *     debounceTimePeriod: number,
 * }} ScannerOptions
 */

/** @type {ScannerOptions} */
const defaultScannerOptions = {
  // This buffer size is very large because it's an unexpected edge-case that
  // a DOM will be continually modified over and over without ever stopping. If we do see 1000 unique
  // new elements in the buffer however then this will prevent the algorithm from never ending.
  bufferSize: 50,
  // wait for a 500ms window of event silence before performing the scan
  debounceTimePeriod: 500,
  // how long to wait when performing the initial scan
  initialDelay: 0
};
/**
 * This allows:
 *   1) synchronous DOM scanning + mutations - via `createScanner(device).findEligibleInputs(document)`
 *   2) or, as above + a debounced mutation observer to re-run the scan after the given time
 */

class DefaultScanner {
  /** @type Map<HTMLElement, Form> */

  /** @type {any|undefined} the timer to reset */

  /** @type {Set<HTMLElement|Document>} stored changed elements until they can be processed */

  /** @type {ScannerOptions} */

  /** @type {HTMLInputElement | null} */

  /** @type {boolean} A flag to indicate the whole page will be re-scanned */

  /**
   * @param {import("./DeviceInterface/InterfacePrototype").default} device
   * @param {ScannerOptions} options
   */
  constructor(device, options) {
    _defineProperty(this, "forms", new Map());

    _defineProperty(this, "debounceTimer", void 0);

    _defineProperty(this, "changedElements", new Set());

    _defineProperty(this, "options", void 0);

    _defineProperty(this, "activeInput", null);

    _defineProperty(this, "rescanAll", false);

    _defineProperty(this, "mutObs", new MutationObserver(mutationList => {
      /** @type {HTMLElement[]} */
      if (this.rescanAll) {
        // quick version if buffer full
        this.enqueue([]);
        return;
      }

      const outgoing = [];

      for (const mutationRecord of mutationList) {
        if (mutationRecord.type === 'childList') {
          for (let addedNode of mutationRecord.addedNodes) {
            if (!(addedNode instanceof HTMLElement)) continue;
            if (addedNode.nodeName === 'DDG-AUTOFILL') continue;
            outgoing.push(addedNode);
          }
        }
      }

      this.enqueue(outgoing);
    }));

    this.device = device;
    this.matching = (0, _matching.createMatching)();
    this.options = options;
    /** @type {number} A timestamp of the  */

    this.initTimeStamp = Date.now();
  }
  /**
   * Determine whether we should fire the credentials autoprompt. This is needed because some sites are blank
   * on page load and load scripts asynchronously, so our initial scan didn't set the autoprompt correctly
   * @returns {boolean}
   */


  get shouldAutoprompt() {
    return Date.now() - this.initTimeStamp <= 1500;
  }
  /**
   * Call this to scan once and then watch for changes.
   *
   * Call the returned function to remove listeners.
   * @returns {() => void}
   */


  init() {
    const delay = this.options.initialDelay; // if the delay is zero, (chrome/firefox etc) then use `requestIdleCallback`

    if (delay === 0) {
      window.requestIdleCallback(() => this.scanAndObserve());
    } else {
      // otherwise, use the delay time to defer the initial scan
      setTimeout(() => this.scanAndObserve(), delay);
    }

    return () => {
      // remove Dax, listeners, timers, and observers
      clearTimeout(this.debounceTimer);
      this.mutObs.disconnect();
      this.forms.forEach(form => {
        form.resetAllInputs();
        form.removeAllDecorations();
      });
      this.forms.clear();

      if (this.device.globalConfig.isDDGDomain) {
        (0, _autofillUtils.notifyWebApp)({
          deviceSignedIn: {
            value: false
          }
        });
      }
    };
  }
  /**
   * Scan the page and begin observing changes
   */


  scanAndObserve() {
    var _window$performance, _window$performance$m, _window$performance2, _window$performance2$;

    (_window$performance = window.performance) === null || _window$performance === void 0 ? void 0 : (_window$performance$m = _window$performance.mark) === null || _window$performance$m === void 0 ? void 0 : _window$performance$m.call(_window$performance, 'scanner:init:start');
    this.findEligibleInputs(document);
    (_window$performance2 = window.performance) === null || _window$performance2 === void 0 ? void 0 : (_window$performance2$ = _window$performance2.mark) === null || _window$performance2$ === void 0 ? void 0 : _window$performance2$.call(_window$performance2, 'scanner:init:end');
    this.mutObs.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
  /**
   * @param context
   */


  findEligibleInputs(context) {
    var _context$matches;

    if ('matches' in context && (_context$matches = context.matches) !== null && _context$matches !== void 0 && _context$matches.call(context, _selectorsCss.FORM_INPUTS_SELECTOR)) {
      this.addInput(context);
    } else {
      context.querySelectorAll(_selectorsCss.FORM_INPUTS_SELECTOR).forEach(input => this.addInput(input));
    }

    return this;
  }
  /**
   * @param {HTMLElement|HTMLInputElement|HTMLSelectElement} input
   * @returns {HTMLFormElement|HTMLElement}
   */


  getParentForm(input) {
    if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
      if (input.form) return input.form;
    }

    let element = input; // traverse the DOM to search for related inputs

    while (element.parentElement && element.parentElement !== document.body) {
      var _element$parentElemen;

      // If parent includes a form return the current element to avoid overlapping forms
      if ((_element$parentElemen = element.parentElement) !== null && _element$parentElemen !== void 0 && _element$parentElemen.querySelector('form')) {
        return element;
      }

      element = element.parentElement; // todo: These selectors should be configurable

      const inputs = element.querySelectorAll(_selectorsCss.FORM_INPUTS_SELECTOR);
      const buttons = element.querySelectorAll(_selectorsCss.SUBMIT_BUTTON_SELECTOR); // If we find a button or another input, we assume that's our form

      if (inputs.length > 1 || buttons.length) {
        // found related input, return common ancestor
        return element;
      }
    }

    return input;
  }
  /**
   * @param {HTMLInputElement|HTMLSelectElement} input
   */


  addInput(input) {
    const parentForm = this.getParentForm(input); // Note that el.contains returns true for el itself

    const previouslyFoundParent = [...this.forms.keys()].find(form => form.contains(parentForm));

    if (previouslyFoundParent) {
      if (parentForm instanceof HTMLFormElement && parentForm !== previouslyFoundParent) {
        // If we had a prior parent but this is an explicit form, the previous was a false positive
        this.forms.delete(previouslyFoundParent);
      } else {
        var _this$forms$get;

        // If we've already met the form or a descendant, add the input
        (_this$forms$get = this.forms.get(previouslyFoundParent)) === null || _this$forms$get === void 0 ? void 0 : _this$forms$get.addInput(input);
      }
    } else {
      // if this form is an ancestor of an existing form, remove that before adding this
      const childForm = [...this.forms.keys()].find(form => parentForm.contains(form));

      if (childForm) {
        var _this$forms$get2;

        (_this$forms$get2 = this.forms.get(childForm)) === null || _this$forms$get2 === void 0 ? void 0 : _this$forms$get2.destroy();
        this.forms.delete(childForm);
      }

      this.forms.set(parentForm, new _Form.Form(parentForm, input, this.device, this.matching, this.shouldAutoprompt));
    }
  }
  /**
   * enqueue elements to be re-scanned after the given
   * amount of time has elapsed.
   *
   * @param {(HTMLElement|Document)[]} htmlElements
   */


  enqueue(htmlElements) {
    // if the buffer limit is reached, stop trying to track elements and process body instead.
    if (this.changedElements.size >= this.options.bufferSize) {
      this.rescanAll = true;
      this.changedElements.clear();
    } else if (!this.rescanAll) {
      // otherwise keep adding each element to the queue
      for (let element of htmlElements) {
        this.changedElements.add(element);
      }
    }

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.processChangedElements();
      this.changedElements.clear();
      this.rescanAll = false;
    }, this.options.debounceTimePeriod);
  }
  /**
   * re-scan the changed elements, but only if they
   * are still present in the DOM
   */


  processChangedElements() {
    if (this.rescanAll) {
      this.findEligibleInputs(document);
      return;
    }

    for (let element of this.changedElements) {
      if (element.isConnected) {
        this.findEligibleInputs(element);
      }
    }
  }
  /**
   * Watch for changes in the DOM, and enqueue elements to be scanned
   * @type {MutationObserver}
   */


}
/**
 * @param {import("./DeviceInterface/InterfacePrototype").default} device
 * @param {Partial<ScannerOptions>} [scannerOptions]
 * @returns {Scanner}
 */


function createScanner(device, scannerOptions) {
  return new DefaultScanner(device, { ...defaultScannerOptions,
    ...scannerOptions
  });
}

},{"./Form/Form.js":32,"./Form/matching.js":41,"./Form/selectors-css.js":42,"./autofill-utils.js":59}],49:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Settings = void 0;

var _index = require("../packages/device-api/index.js");

var _deviceApiCalls = require("./deviceApiCalls/__generated__/deviceApiCalls.js");

var _validatorsZod = require("./deviceApiCalls/__generated__/validators.zod.js");

var _autofillUtils = require("./autofill-utils.js");

var _appleUtils = require("@duckduckgo/content-scope-scripts/src/apple-utils");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Some Type helpers to prevent duplication
 * @typedef {import("./deviceApiCalls/__generated__/validators-ts").AutofillFeatureToggles} AutofillFeatureToggles
 * @typedef {import("./deviceApiCalls/__generated__/validators-ts").AvailableInputTypes} AvailableInputTypes
 * @typedef {import("./deviceApiCalls/__generated__/validators-ts").RuntimeConfiguration} RuntimeConfiguration
 * @typedef {import("../packages/device-api").DeviceApi} DeviceApi
 */

/**
 * The Settings class encapsulates the concept of 1) feature toggles + 2) available input types.
 *
 * 1) Feature toggles are boolean flags that can represent a device's capabilities. That may be user-toggled
 * or not, we don't make that distinction.
 *
 * 2) Available Input Types are indicators to whether the given platform can provide data for a given type.
 * For example, a user might have credentials saved for https://example.com, so when the page loads, but **before**
 * we can decorate any fields, we determine this first.
 */
class Settings {
  /** @type {GlobalConfig} */

  /** @type {DeviceApi} */

  /** @type {AutofillFeatureToggles | null} */

  /** @type {AvailableInputTypes | null} */

  /** @type {RuntimeConfiguration | null | undefined} */

  /** @type {boolean | null} */

  /**
   * @param {GlobalConfig} config
   * @param {DeviceApi} deviceApi
   */
  constructor(config, deviceApi) {
    _defineProperty(this, "globalConfig", void 0);

    _defineProperty(this, "deviceApi", void 0);

    _defineProperty(this, "_featureToggles", null);

    _defineProperty(this, "_availableInputTypes", null);

    _defineProperty(this, "_runtimeConfiguration", null);

    _defineProperty(this, "_enabled", null);

    this.deviceApi = deviceApi;
    this.globalConfig = config;
  }
  /**
   * Feature toggles are delivered as part of the Runtime Configuration - a flexible design that
   * allows data per user + remote config to be accessed together.
   *
   * Once we access the Runtime Configuration, we then extract the autofill-specific settings via
   * `runtimeConfig.userPreferences.features.autofill.settings` and validate that separately.
   *
   * The 2-step validation occurs because RuntimeConfiguration will be coming from a shared library
   * and does not know about the shape of Autofill specific settings.
   *
   * @returns {Promise<AutofillFeatureToggles>}
   */


  async getFeatureToggles() {
    try {
      var _runtimeConfig$userPr, _runtimeConfig$userPr2, _runtimeConfig$userPr3;

      const runtimeConfig = await this._getRuntimeConfiguration();
      const autofillSettings = (0, _index.validate)((_runtimeConfig$userPr = runtimeConfig.userPreferences) === null || _runtimeConfig$userPr === void 0 ? void 0 : (_runtimeConfig$userPr2 = _runtimeConfig$userPr.features) === null || _runtimeConfig$userPr2 === void 0 ? void 0 : (_runtimeConfig$userPr3 = _runtimeConfig$userPr2.autofill) === null || _runtimeConfig$userPr3 === void 0 ? void 0 : _runtimeConfig$userPr3.settings, _validatorsZod.autofillSettingsSchema);
      return autofillSettings.featureToggles;
    } catch (e) {
      // these are the fallbacks for when a platform hasn't implemented the calls above.
      if (this.globalConfig.isDDGTestMode) {
        console.log('isDDGTestMode: getFeatureToggles: ❌', e);
      }

      return Settings.defaults.featureToggles;
    }
  }
  /**
   * If the platform in question is happy to derive it's 'enabled' state from the RuntimeConfiguration,
   * then they should use this. Currently only Windows supports this, but we aim to move all platforms to
   * support this going forward.
   * @returns {Promise<boolean|null>}
   */


  async getEnabled() {
    try {
      const runtimeConfig = await this._getRuntimeConfiguration();
      const enabled = (0, _autofillUtils.autofillEnabled)(runtimeConfig, _appleUtils.processConfig);
      return enabled;
    } catch (e) {
      // these are the fallbacks for when a platform hasn't implemented the calls above. (like on android)
      if (this.globalConfig.isDDGTestMode) {
        console.log('isDDGTestMode: getFeatureToggles: ❌', e);
      }

      return null;
    }
  }
  /**
   * Get runtime configuration, but only once.
   *
   * Some platforms may be reading this directly from inlined variables, whilst others
   * may make a DeviceApiCall.
   *
   * Currently, it's only read once - but we should be open to the idea that we may need
   * this to be called multiple times in the future.
   *
   * @returns {Promise<RuntimeConfiguration>}
   * @throws
   * @private
   */


  async _getRuntimeConfiguration() {
    if (this._runtimeConfiguration) return this._runtimeConfiguration;
    const runtimeConfig = await this.deviceApi.request(new _deviceApiCalls.GetRuntimeConfigurationCall(null));
    this._runtimeConfiguration = runtimeConfig;
    return this._runtimeConfiguration;
  }
  /**
   * Available Input Types are boolean indicators to represent which input types the
   * current **user** has data available for.
   *
   * @returns {Promise<AvailableInputTypes>}
   */


  async getAvailableInputTypes() {
    try {
      return await this.deviceApi.request(new _deviceApiCalls.GetAvailableInputTypesCall(null));
    } catch (e) {
      if (this.globalConfig.isDDGTestMode) {
        console.log('isDDGTestMode: getAvailableInputTypes: ❌', e);
      }

      return Settings.defaults.availableInputTypes;
    }
  }
  /**
   * To 'refresh' settings means to re-call APIs to determine new state. This may
   * only occur once per page, but it must be done before any page scanning/decorating can happen
   *
   * @returns {Promise<{
   *      availableInputTypes: AvailableInputTypes,
   *      featureToggles: AutofillFeatureToggles,
   *      enabled: boolean | null
   * }>}
   */


  async refresh() {
    this.setEnabled(await this.getEnabled());
    this.setFeatureToggles(await this.getFeatureToggles());
    this.setAvailableInputTypes(await this.getAvailableInputTypes()); // If 'this.enabled' is a boolean it means we were able to set it correctly and therefor respect its value

    if (typeof this.enabled === 'boolean') {
      if (!this.enabled) {
        return Settings.defaults;
      }
    }

    return {
      featureToggles: this.featureToggles,
      availableInputTypes: this.availableInputTypes,
      enabled: this.enabled
    };
  }
  /**
   * Checks if a mainType/subtype pair can be autofilled with the data we have
   * @param {SupportedMainTypes} mainType
   * @param {string} subtype
   * @returns {Promise<boolean>}
   */


  async canAutofillType(mainType, subtype) {
    var _this$availableInputT, _this$availableInputT6;

    if (mainType === 'unknown') return false;

    if (!this.featureToggles["inputType_".concat(mainType)] && subtype !== 'emailAddress') {
      return false;
    } // If it's an email field and Email Protection is enabled, return true regardless of other options


    if (subtype === 'emailAddress' && this.featureToggles.emailProtection && this.availableInputTypes.email) {
      return true;
    }

    if (((_this$availableInputT = this.availableInputTypes) === null || _this$availableInputT === void 0 ? void 0 : _this$availableInputT[mainType]) === undefined) {
      const availableInputTypesFromRemote = await this.getAvailableInputTypes();
      this.setAvailableInputTypes(availableInputTypesFromRemote);
    }

    if (subtype === 'fullName') {
      var _this$availableInputT2, _this$availableInputT3;

      return Boolean(((_this$availableInputT2 = this.availableInputTypes.identities) === null || _this$availableInputT2 === void 0 ? void 0 : _this$availableInputT2.firstName) || ((_this$availableInputT3 = this.availableInputTypes.identities) === null || _this$availableInputT3 === void 0 ? void 0 : _this$availableInputT3.lastName));
    }

    if (subtype === 'expiration') {
      var _this$availableInputT4, _this$availableInputT5;

      return Boolean(((_this$availableInputT4 = this.availableInputTypes.creditCards) === null || _this$availableInputT4 === void 0 ? void 0 : _this$availableInputT4.expirationMonth) || ((_this$availableInputT5 = this.availableInputTypes.creditCards) === null || _this$availableInputT5 === void 0 ? void 0 : _this$availableInputT5.expirationYear));
    }

    return Boolean((_this$availableInputT6 = this.availableInputTypes[mainType]) === null || _this$availableInputT6 === void 0 ? void 0 : _this$availableInputT6[subtype]);
  }
  /** @returns {AutofillFeatureToggles} */


  get featureToggles() {
    if (this._featureToggles === null) throw new Error('feature toggles accessed before being set');
    return this._featureToggles;
  }
  /** @param {AutofillFeatureToggles} input */


  setFeatureToggles(input) {
    this._featureToggles = input;
  }
  /** @returns {AvailableInputTypes} */


  get availableInputTypes() {
    if (this._availableInputTypes === null) throw new Error('available input types accessed before being set');
    return this._availableInputTypes;
  }
  /** @param {AvailableInputTypes} value */


  setAvailableInputTypes(value) {
    this._availableInputTypes = { ...this._availableInputTypes,
      ...value
    };
  }

  static default(globalConfig, deviceApi) {
    const settings = new Settings(globalConfig, deviceApi);
    settings.setFeatureToggles(Settings.defaults.featureToggles);
    settings.setAvailableInputTypes(Settings.defaults.availableInputTypes);
    return settings;
  }
  /** @returns {boolean|null} */


  get enabled() {
    return this._enabled;
  }
  /**
   * @param {boolean|null} enabled
   */


  setEnabled(enabled) {
    this._enabled = enabled;
  }

}

exports.Settings = Settings;

_defineProperty(Settings, "defaults", {
  /** @type {AutofillFeatureToggles} */
  featureToggles: {
    credentials_saving: false,
    password_generation: false,
    emailProtection: false,
    inputType_identities: false,
    inputType_credentials: false,
    inputType_creditCards: false,
    inlineIcon_credentials: false
  },

  /** @type {AvailableInputTypes} */
  availableInputTypes: {
    credentials: {
      username: false,
      password: false
    },
    identities: {
      firstName: false,
      middleName: false,
      lastName: false,
      birthdayDay: false,
      birthdayMonth: false,
      birthdayYear: false,
      addressStreet: false,
      addressStreet2: false,
      addressCity: false,
      addressProvince: false,
      addressPostalCode: false,
      addressCountryCode: false,
      phone: false,
      emailAddress: false
    },
    creditCards: {
      cardName: false,
      cardSecurityCode: false,
      expirationMonth: false,
      expirationYear: false,
      cardNumber: false
    },
    email: false
  },

  /** @type {boolean | null} */
  enabled: null
});

},{"../packages/device-api/index.js":14,"./autofill-utils.js":59,"./deviceApiCalls/__generated__/deviceApiCalls.js":63,"./deviceApiCalls/__generated__/validators.zod.js":64,"@duckduckgo/content-scope-scripts/src/apple-utils":1}],50:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _autofillUtils = require("../autofill-utils.js");

var _HTMLTooltip = _interopRequireDefault(require("./HTMLTooltip.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class DataHTMLTooltip extends _HTMLTooltip.default {
  /**
   * @param {InputTypeConfigs} config
   * @param {TooltipItemRenderer[]} items
   * @param {{onSelect(id:string): void}} callbacks
   */
  render(config, items, callbacks) {
    const {
      wrapperClass,
      css
    } = this.options;
    let hasAddedSeparator = false; // Only show an hr above the first duck address button, but it can be either personal or private

    const shouldShowSeparator = dataId => {
      const shouldShow = ['personalAddress', 'privateAddress'].includes(dataId) && !hasAddedSeparator;
      if (shouldShow) hasAddedSeparator = true;
      return shouldShow;
    };

    const topClass = wrapperClass || '';
    const dataTypeClass = "tooltip__button--data--".concat(config.type);
    this.shadow.innerHTML = "\n".concat(css, "\n<div class=\"wrapper wrapper--data ").concat(topClass, "\">\n    <div class=\"tooltip tooltip--data\" hidden>\n        ").concat(items.map(item => {
      var _item$credentialsProv, _item$labelSmall, _item$label;

      const credentialsProvider = (_item$credentialsProv = item.credentialsProvider) === null || _item$credentialsProv === void 0 ? void 0 : _item$credentialsProv.call(item);
      const providerIconClass = credentialsProvider ? "tooltip__button--data--".concat(credentialsProvider) : ''; // these 2 are optional

      const labelSmall = (_item$labelSmall = item.labelSmall) === null || _item$labelSmall === void 0 ? void 0 : _item$labelSmall.call(item, this.subtype);
      const label = (_item$label = item.label) === null || _item$label === void 0 ? void 0 : _item$label.call(item, this.subtype);
      return "\n            ".concat(shouldShowSeparator(item.id()) ? '<hr />' : '', "\n            <button id=\"").concat(item.id(), "\" class=\"tooltip__button tooltip__button--data ").concat(dataTypeClass, " ").concat(providerIconClass, " js-autofill-button\" >\n                <span class=\"tooltip__button__text-container\">\n                    <span class=\"label label--medium\">").concat((0, _autofillUtils.escapeXML)(item.labelMedium(this.subtype)), "</span>\n                    ").concat(label ? "<span class=\"label\">".concat((0, _autofillUtils.escapeXML)(label), "</span>") : '', "\n                    ").concat(labelSmall ? "<span class=\"label label--small\">".concat((0, _autofillUtils.escapeXML)(labelSmall), "</span>") : '', "\n                </span>\n            </button>\n        ");
    }).join(''), "\n    </div>\n</div>");
    this.wrapper = this.shadow.querySelector('.wrapper');
    this.tooltip = this.shadow.querySelector('.tooltip');
    this.autofillButtons = this.shadow.querySelectorAll('.js-autofill-button');
    this.autofillButtons.forEach(btn => {
      this.registerClickableButton(btn, () => {
        callbacks.onSelect(btn.id);
      });
    });
    this.init();
    return this;
  }

}

var _default = DataHTMLTooltip;
exports.default = _default;

},{"../autofill-utils.js":59,"./HTMLTooltip.js":52}],51:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _autofillUtils = require("../autofill-utils.js");

var _HTMLTooltip = _interopRequireDefault(require("./HTMLTooltip.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class EmailHTMLTooltip extends _HTMLTooltip.default {
  /**
   * @param {import("../DeviceInterface/InterfacePrototype").default} device
   */
  render(device) {
    this.device = device;
    this.addresses = device.getLocalAddresses();
    this.shadow.innerHTML = "\n".concat(this.options.css, "\n<div class=\"wrapper wrapper--email\">\n    <div class=\"tooltip tooltip--email\" hidden>\n        <button class=\"tooltip__button tooltip__button--email js-use-personal\">\n            <span class=\"tooltip__button--email__primary-text\">\n                Use <span class=\"js-address\">").concat((0, _autofillUtils.formatDuckAddress)((0, _autofillUtils.escapeXML)(this.addresses.personalAddress)), "</span>\n            </span>\n            <span class=\"tooltip__button--email__secondary-text\">Blocks email trackers</span>\n        </button>\n        <button class=\"tooltip__button tooltip__button--email js-use-private\">\n            <span class=\"tooltip__button--email__primary-text\">Generate a Private Duck Address</span>\n            <span class=\"tooltip__button--email__secondary-text\">Blocks email trackers and hides your address</span>\n        </button>\n    </div>\n</div>");
    this.wrapper = this.shadow.querySelector('.wrapper');
    this.tooltip = this.shadow.querySelector('.tooltip');
    this.usePersonalButton = this.shadow.querySelector('.js-use-personal');
    this.usePrivateButton = this.shadow.querySelector('.js-use-private');
    this.addressEl = this.shadow.querySelector('.js-address');

    this.updateAddresses = addresses => {
      if (addresses && this.addressEl) {
        this.addresses = addresses;
        this.addressEl.textContent = (0, _autofillUtils.formatDuckAddress)(addresses.personalAddress);
      }
    };

    this.registerClickableButton(this.usePersonalButton, () => {
      this.fillForm('personalAddress');
    });
    this.registerClickableButton(this.usePrivateButton, () => {
      this.fillForm('privateAddress');
    }); // Get the alias from the extension

    this.device.getAddresses().then(this.updateAddresses);
    this.init();
    return this;
  }
  /**
   * @param {'personalAddress' | 'privateAddress'} id
   */


  async fillForm(id) {
    var _this$device;

    const address = this.addresses[id];
    const formattedAddress = (0, _autofillUtils.formatDuckAddress)(address);
    (_this$device = this.device) === null || _this$device === void 0 ? void 0 : _this$device.selectedDetail({
      email: formattedAddress,
      id
    }, 'email');
  }

}

var _default = EmailHTMLTooltip;
exports.default = _default;

},{"../autofill-utils.js":59,"./HTMLTooltip.js":52}],52:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultOptions = exports.default = exports.HTMLTooltip = void 0;

var _autofillUtils = require("../autofill-utils.js");

var _matching = require("../Form/matching.js");

var _styles = require("./styles/styles.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @typedef {object} HTMLTooltipOptions
 * @property {boolean} testMode
 * @property {string | null} [wrapperClass]
 * @property {(top: number, left: number) => string} [tooltipPositionClass]
 * @property {(details: {height: number, width: number}) => void} [setSize] - if this is set, it will be called initially once + every times the size changes
 * @property {() => void} remove
 * @property {string} css
 * @property {boolean} checkVisibility
 */

/** @type {import('./HTMLTooltip.js').HTMLTooltipOptions} */
const defaultOptions = {
  wrapperClass: '',
  tooltipPositionClass: (top, left) => ".wrapper {transform: translate(".concat(left, "px, ").concat(top, "px);}"),
  css: "<style>".concat(_styles.CSS_STYLES, "</style>"),
  setSize: undefined,
  remove: () => {
    /** noop */
  },
  testMode: false,
  checkVisibility: true
};
exports.defaultOptions = defaultOptions;

class HTMLTooltip {
  /** @type {HTMLTooltipOptions} */

  /**
   * @param config
   * @param inputType
   * @param getPosition
   * @param {HTMLTooltipOptions} options
   */
  constructor(config, inputType, getPosition, options) {
    _defineProperty(this, "options", void 0);

    _defineProperty(this, "resObs", new ResizeObserver(entries => entries.forEach(() => this.checkPosition())));

    _defineProperty(this, "mutObs", new MutationObserver(mutationList => {
      for (const mutationRecord of mutationList) {
        if (mutationRecord.type === 'childList') {
          // Only check added nodes
          mutationRecord.addedNodes.forEach(el => {
            if (el.nodeName === 'DDG-AUTOFILL') return;
            this.ensureIsLastInDOM();
          });
        }
      }

      this.checkPosition();
    }));

    _defineProperty(this, "clickableButtons", new Map());

    this.options = options;
    this.shadow = document.createElement('ddg-autofill').attachShadow({
      mode: options.testMode ? 'open' : 'closed'
    });
    this.host = this.shadow.host;
    this.config = config;
    this.subtype = (0, _matching.getSubtypeFromType)(inputType);
    this.tooltip = null;
    this.getPosition = getPosition;
    const forcedVisibilityStyles = {
      'display': 'block',
      'visibility': 'visible',
      'opacity': '1'
    }; // @ts-ignore how to narrow this.host to HTMLElement?

    (0, _autofillUtils.addInlineStyles)(this.host, forcedVisibilityStyles);
    this.count = 0;
  }

  append() {
    document.body.appendChild(this.host);
  }

  remove() {
    window.removeEventListener('scroll', this, {
      capture: true
    });
    this.resObs.disconnect();
    this.mutObs.disconnect();
    this.lift();
  }

  lift() {
    this.left = null;
    this.top = null;
    document.body.removeChild(this.host);
  }

  handleEvent(event) {
    switch (event.type) {
      case 'scroll':
        this.checkPosition();
        break;
    }
  }

  focus(x, y) {
    var _this$shadow$elementF, _this$shadow$elementF2;

    const focusableElements = 'button';
    const currentFocusClassName = 'currentFocus';
    const currentFocused = this.shadow.querySelectorAll(".".concat(currentFocusClassName));
    [...currentFocused].forEach(el => {
      el.classList.remove(currentFocusClassName);
    });
    (_this$shadow$elementF = this.shadow.elementFromPoint(x, y)) === null || _this$shadow$elementF === void 0 ? void 0 : (_this$shadow$elementF2 = _this$shadow$elementF.closest(focusableElements)) === null || _this$shadow$elementF2 === void 0 ? void 0 : _this$shadow$elementF2.classList.add(currentFocusClassName);
  }

  checkPosition() {
    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
    }

    this.animationFrame = window.requestAnimationFrame(() => {
      const {
        left,
        bottom
      } = this.getPosition();

      if (left !== this.left || bottom !== this.top) {
        this.updatePosition({
          left,
          top: bottom
        });
      }

      this.animationFrame = null;
    });
  }

  updatePosition(_ref) {
    var _this$options$tooltip, _this$options;

    let {
      left,
      top
    } = _ref;
    const shadow = this.shadow; // If the stylesheet is not loaded wait for load (Chrome bug)

    if (!shadow.styleSheets.length) {
      var _this$stylesheet;

      (_this$stylesheet = this.stylesheet) === null || _this$stylesheet === void 0 ? void 0 : _this$stylesheet.addEventListener('load', () => this.checkPosition());
      return;
    }

    this.left = left;
    this.top = top;

    if (this.transformRuleIndex && shadow.styleSheets[0].rules[this.transformRuleIndex]) {
      // If we have already set the rule, remove it…
      shadow.styleSheets[0].deleteRule(this.transformRuleIndex);
    } else {
      // …otherwise, set the index as the very last rule
      this.transformRuleIndex = shadow.styleSheets[0].rules.length;
    }

    let cssRule = (_this$options$tooltip = (_this$options = this.options).tooltipPositionClass) === null || _this$options$tooltip === void 0 ? void 0 : _this$options$tooltip.call(_this$options, top, left);

    if (typeof cssRule === 'string') {
      shadow.styleSheets[0].insertRule(cssRule, this.transformRuleIndex);
    }
  }

  ensureIsLastInDOM() {
    this.count = this.count || 0; // If DDG el is not the last in the doc, move it there

    if (document.body.lastElementChild !== this.host) {
      // Try up to 15 times to avoid infinite loop in case someone is doing the same
      if (this.count < 15) {
        this.lift();
        this.append();
        this.checkPosition();
        this.count++;
      } else {
        // Remove the tooltip from the form to cleanup listeners and observers
        this.options.remove();
        console.info("DDG autofill bailing out");
      }
    }
  }

  setActiveButton(e) {
    this.activeButton = e.target;
  }

  unsetActiveButton() {
    this.activeButton = null;
  }

  registerClickableButton(btn, handler) {
    this.clickableButtons.set(btn, handler); // Needed because clicks within the shadow dom don't provide this info to the outside

    btn.addEventListener('mouseenter', e => this.setActiveButton(e));
    btn.addEventListener('mouseleave', () => this.unsetActiveButton());
  }

  dispatchClick() {
    const handler = this.clickableButtons.get(this.activeButton);

    if (handler) {
      (0, _autofillUtils.safeExecute)(this.activeButton, handler, {
        checkVisibility: this.options.checkVisibility
      });
    }
  }

  setupSizeListener() {
    // Listen to layout and paint changes to register the size
    const observer = new PerformanceObserver(() => {
      this.setSize();
    });
    observer.observe({
      entryTypes: ['layout-shift', 'paint']
    });
  }

  setSize() {
    var _this$options$setSize, _this$options2;

    const innerNode = this.shadow.querySelector('.wrapper--data'); // Shouldn't be possible

    if (!innerNode) return;
    const details = {
      height: innerNode.clientHeight,
      width: innerNode.clientWidth
    };
    (_this$options$setSize = (_this$options2 = this.options).setSize) === null || _this$options$setSize === void 0 ? void 0 : _this$options$setSize.call(_this$options2, details);
  }

  init() {
    var _this$stylesheet2;

    this.animationFrame = null;
    this.top = 0;
    this.left = 0;
    this.transformRuleIndex = null;
    this.stylesheet = this.shadow.querySelector('link, style'); // Un-hide once the style is loaded, to avoid flashing unstyled content

    (_this$stylesheet2 = this.stylesheet) === null || _this$stylesheet2 === void 0 ? void 0 : _this$stylesheet2.addEventListener('load', () => this.tooltip.removeAttribute('hidden'));
    this.append();
    this.resObs.observe(document.body);
    this.mutObs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
    window.addEventListener('scroll', this, {
      capture: true
    });
    this.setSize();

    if (typeof this.options.setSize === 'function') {
      this.setupSizeListener();
    }
  }

}

exports.HTMLTooltip = HTMLTooltip;
var _default = HTMLTooltip;
exports.default = _default;

},{"../Form/matching.js":41,"../autofill-utils.js":59,"./styles/styles.js":58}],53:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HTMLTooltipUIController = void 0;

var _inputTypeConfig = require("../../Form/inputTypeConfig.js");

var _DataHTMLTooltip = _interopRequireDefault(require("../DataHTMLTooltip.js"));

var _EmailHTMLTooltip = _interopRequireDefault(require("../EmailHTMLTooltip.js"));

var _HTMLTooltip = require("../HTMLTooltip.js");

var _UIController = require("./UIController.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @typedef HTMLTooltipControllerOptions
 * @property {"modern" | "legacy"} tooltipKind - A choice between the newer Autofill UI vs the older one used in the extension
 * @property {import("../../DeviceInterface/InterfacePrototype").default} device - The device interface that's currently running
 * regardless of whether this Controller has an open tooltip, or not
 */

/**
 * This encapsulates all the logic relating to showing/hiding the HTML Tooltip
 *
 * Note: This could be displayed in the current webpage (for example, in the extension)
 * or within a webview overlay (like on macOS & upcoming in windows)
 */
class HTMLTooltipUIController extends _UIController.UIController {
  /** @type {import("../HTMLTooltip.js").HTMLTooltip | null} */

  /** @type {HTMLTooltipControllerOptions} */

  /** @type {import('../HTMLTooltip.js').HTMLTooltipOptions} */

  /**
   * @param {HTMLTooltipControllerOptions} options
   * @param {Partial<import('../HTMLTooltip.js').HTMLTooltipOptions>} htmlTooltipOptions
   */
  constructor(options) {
    let htmlTooltipOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _HTMLTooltip.defaultOptions;
    super();

    _defineProperty(this, "_activeTooltip", null);

    _defineProperty(this, "_options", void 0);

    _defineProperty(this, "_htmlTooltipOptions", void 0);

    this._options = options;
    this._htmlTooltipOptions = Object.assign({}, _HTMLTooltip.defaultOptions, htmlTooltipOptions);
    window.addEventListener('pointerdown', this, true);
  }
  /**
   * @param {import('./UIController').AttachArgs} args
   */


  attach(args) {
    if (this.getActiveTooltip()) {
      return;
    }

    const {
      topContextData,
      getPosition,
      input,
      form
    } = args;
    const tooltip = this.createTooltip(getPosition, topContextData);
    this.setActiveTooltip(tooltip);
    form.showingTooltip(input);
  }
  /**
   * Actually create the HTML Tooltip
   * @param {PosFn} getPosition
   * @param {TopContextData} topContextData
   * @return {import("../HTMLTooltip").HTMLTooltip}
   */


  createTooltip(getPosition, topContextData) {
    this._attachListeners();

    const config = (0, _inputTypeConfig.getInputConfigFromType)(topContextData.inputType);
    this._activeInputType = topContextData.inputType;
    /**
     * @type {import('../HTMLTooltip').HTMLTooltipOptions}
     */

    const tooltipOptions = { ...this._htmlTooltipOptions,
      remove: () => this.removeTooltip()
    };

    if (this._options.tooltipKind === 'legacy') {
      return new _EmailHTMLTooltip.default(config, topContextData.inputType, getPosition, tooltipOptions).render(this._options.device);
    } // collect the data for each item to display


    const data = this._dataForAutofill(config, topContextData.inputType, topContextData); // convert the data into tool tip item renderers


    const asRenderers = data.map(d => config.tooltipItem(d)); // construct the autofill

    return new _DataHTMLTooltip.default(config, topContextData.inputType, getPosition, tooltipOptions).render(config, asRenderers, {
      onSelect: id => {
        this._onSelect(config, data, id);
      }
    });
  }

  updateItems(data) {
    if (!this._activeInputType) return;
    const config = (0, _inputTypeConfig.getInputConfigFromType)(this._activeInputType); // convert the data into tool tip item renderers

    const asRenderers = data.map(d => config.tooltipItem(d));
    const activeTooltip = this.getActiveTooltip();

    if (activeTooltip instanceof _DataHTMLTooltip.default) {
      activeTooltip === null || activeTooltip === void 0 ? void 0 : activeTooltip.render(config, asRenderers, {
        onSelect: id => {
          this._onSelect(config, data, id);
        }
      });
    } // TODO: can we remove this timeout once implemented with real APIs?
    // The timeout is needed because clientHeight and clientWidth were returning 0


    setTimeout(() => {
      var _this$getActiveToolti;

      (_this$getActiveToolti = this.getActiveTooltip()) === null || _this$getActiveToolti === void 0 ? void 0 : _this$getActiveToolti.setSize();
    }, 10);
  }

  _attachListeners() {
    window.addEventListener('input', this);
    window.addEventListener('keydown', this, true);
  }

  _removeListeners() {
    window.removeEventListener('input', this);
    window.removeEventListener('keydown', this, true);
  }

  handleEvent(event) {
    switch (event.type) {
      case 'keydown':
        if (['Escape', 'Tab', 'Enter'].includes(event.code)) {
          if (event.code === 'Escape') {
            event.preventDefault();
            event.stopImmediatePropagation();
          }

          this.removeTooltip();
        }

        break;

      case 'input':
        this.removeTooltip();
        break;

      case 'pointerdown':
        {
          this._pointerDownListener(event);

          break;
        }
    }
  } // Global listener for event delegation


  _pointerDownListener(e) {
    if (!e.isTrusted) return; // @ts-ignore

    if (e.target.nodeName === 'DDG-AUTOFILL') {
      e.preventDefault();
      e.stopImmediatePropagation();
      const activeTooltip = this.getActiveTooltip();

      if (!activeTooltip) {
        console.warn('Could not get activeTooltip');
      } else {
        activeTooltip.dispatchClick();
      }
    } else {
      this.removeTooltip().catch(e => {
        console.error('error removing tooltip', e);
      });
    }
  }

  async removeTooltip(_via) {
    this._htmlTooltipOptions.remove();

    if (this._activeTooltip) {
      this._removeListeners();

      this._activeTooltip.remove();

      this._activeTooltip = null;
    }
  }
  /**
   * @returns {import("../HTMLTooltip.js").HTMLTooltip|null}
   */


  getActiveTooltip() {
    return this._activeTooltip;
  }
  /**
   * @param {import("../HTMLTooltip.js").HTMLTooltip} value
   */


  setActiveTooltip(value) {
    this._activeTooltip = value;
  }
  /**
   * Collect the data that's needed to populate the Autofill UI.
   *
   * Note: ideally we'd pass this data instead, so that we didn't have a circular dependency
   *
   * @param {InputTypeConfigs} config - This is the selected `InputTypeConfig` based on the type of field
   * @param {import('../../Form/matching').SupportedTypes} inputType - The input type for the current field
   * @param {TopContextData} topContextData
   */


  _dataForAutofill(config, inputType, topContextData) {
    return this._options.device.dataForAutofill(config, inputType, topContextData);
  }
  /**
   * When a field is selected, call the `onSelect` method from the device.
   *
   * Note: ideally we'd pass this data instead, so that we didn't have a circular dependency
   *
   * @param {InputTypeConfigs} config
   * @param {(CreditCardObject | IdentityObject | CredentialsObject)[]} data
   * @param {CreditCardObject['id']|IdentityObject['id']|CredentialsObject['id']} id
   */


  _onSelect(config, data, id) {
    return this._options.device.onSelect(config, data, id);
  }

  isActive() {
    return Boolean(this.getActiveTooltip());
  }

}

exports.HTMLTooltipUIController = HTMLTooltipUIController;

},{"../../Form/inputTypeConfig.js":37,"../DataHTMLTooltip.js":50,"../EmailHTMLTooltip.js":51,"../HTMLTooltip.js":52,"./UIController.js":56}],54:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NativeUIController = void 0;

var _UIController = require("./UIController.js");

var _matching = require("../../Form/matching.js");

var _deviceApiCalls = require("../../deviceApiCalls/__generated__/deviceApiCalls.js");

/**
 * `NativeController` should be used in situations where you DO NOT
 * want any Autofill-controlled user interface.
 *
 * Examples are with iOS/Android, where 'attaching' only means
 * messaging a native layer to show a native tooltip.
 *
 * @example
 *
 * ```javascript
 * const controller = new NativeController();
 * controller.attach(...);
 * ```
 */
class NativeUIController extends _UIController.UIController {
  /**
   * @param {import('./UIController').AttachArgs} args
   */
  attach(args) {
    const {
      form,
      input,
      device,
      trigger
    } = args;
    const inputType = (0, _matching.getInputType)(input);
    const mainType = (0, _matching.getMainTypeFromType)(inputType);
    const subType = (0, _matching.getSubtypeFromType)(inputType);

    if (mainType === 'unknown') {
      throw new Error('unreachable, should not be here if (mainType === "unknown")');
    }

    if (trigger === 'autoprompt') {
      window.scrollTo({
        behavior: 'smooth',
        top: form.form.getBoundingClientRect().top - document.body.getBoundingClientRect().top - 50
      });
    }
    /** @type {import('../../deviceApiCalls/__generated__/validators-ts').GetAutofillDataRequest} */


    const payload = {
      inputType,
      mainType,
      subType,
      trigger
    };
    device.deviceApi.request(new _deviceApiCalls.GetAutofillDataCall(payload)).then(resp => {
      switch (resp.action) {
        case 'fill':
          {
            if (mainType in resp) {
              form.autofillData(resp[mainType], mainType);
            } else {
              throw new Error("action: \"fill\" cannot occur because \"".concat(mainType, "\" was missing"));
            }

            break;
          }

        case 'focus':
          {
            var _form$activeInput;

            (_form$activeInput = form.activeInput) === null || _form$activeInput === void 0 ? void 0 : _form$activeInput.focus();
            break;
          }

        default:
          {
            if (args.device.isTestMode()) {
              console.warn('response not handled', resp);
            }
          }
      }
    }).catch(e => {
      console.error('NativeTooltip::device.getAutofillData(payload)');
      console.error(e);
    });
  }

}

exports.NativeUIController = NativeUIController;

},{"../../Form/matching.js":41,"../../deviceApiCalls/__generated__/deviceApiCalls.js":63,"./UIController.js":56}],55:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OverlayUIController = void 0;

var _UIController = require("./UIController.js");

var _matching = require("../../Form/matching.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get"); return _classApplyDescriptorGet(receiver, descriptor); }

function _classApplyDescriptorGet(receiver, descriptor) { if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set"); _classApplyDescriptorSet(receiver, descriptor, value); return value; }

function _classExtractFieldDescriptor(receiver, privateMap, action) { if (!privateMap.has(receiver)) { throw new TypeError("attempted to " + action + " private field on non-instance"); } return privateMap.get(receiver); }

function _classApplyDescriptorSet(receiver, descriptor, value) { if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } }

var _state = /*#__PURE__*/new WeakMap();

/**
 * @typedef {import('../../deviceApiCalls/__generated__/validators-ts').GetAutofillDataRequest} GetAutofillDataRequest
 * @typedef {import('../../deviceApiCalls/__generated__/validators-ts').TriggerContext} TriggerContext
 *
 * @typedef OverlayControllerOptions
 * @property {() => Promise<void>} remove - A callback that will be fired when the tooltip should be removed
 * @property {(details: GetAutofillDataRequest) => Promise<void>} show - A callback that will be fired when the tooltip should be shown
 */

/**
 * Use this `OverlayController` when you want to control an overlay, but don't have
 * your own UI to display.
 *
 * For example, on macOS this `OverlayController` would run in the main webpage
 * and would then signal to its native side when the overlay should show/close
 *
 * @example `show` and `remove` can be implemented to match your native side's messaging needs
 *
 * ```javascript
 * const controller = new OverlayController({
 *     remove: async () => this.closeAutofillParent(),
 *     show: async (details) => this.show(details),
 *     onPointerDown: (e) => this.onPointerDown(e)
 * })
 *
 * controller.attach(...)
 * ```
 */
class OverlayUIController extends _UIController.UIController {
  /** @type {"idle" | "parentShown"} */

  /** @type {import('../HTMLTooltip.js').HTMLTooltip | null} */

  /**
   * @type {OverlayControllerOptions}
   */

  /**
   * @param {OverlayControllerOptions} options
   */
  constructor(options) {
    super();

    _classPrivateFieldInitSpec(this, _state, {
      writable: true,
      value: 'idle'
    });

    _defineProperty(this, "_activeTooltip", null);

    _defineProperty(this, "_options", void 0);

    this._options = options; // We always register this 'pointerdown' event, regardless of
    // whether we have a tooltip currently open or not. This is to ensure
    // we can clear out any existing state before opening a new one.

    window.addEventListener('pointerdown', this, true);
  }
  /**
   * @param {import('./UIController').AttachArgs} args
   */


  attach(args) {
    const {
      getPosition,
      topContextData,
      click,
      input
    } = args; // Do not attach the tooltip if the input is not in the DOM

    if (!input.parentNode) return; // If the input is removed from the DOM while the tooltip is attached, remove it

    this._mutObs = new MutationObserver(mutationList => {
      for (const mutationRecord of mutationList) {
        mutationRecord.removedNodes.forEach(el => {
          if (el.contains(input)) {
            this.removeTooltip('mutation observer');
          }
        });
      }
    });

    this._mutObs.observe(document.body, {
      childList: true,
      subtree: true
    });

    let delay = 0;

    if (!click && !this.elementIsInViewport(getPosition())) {
      input.scrollIntoView(true);
      delay = 500;
    }

    setTimeout(() => {
      this.showTopTooltip(click, getPosition(), topContextData).catch(e => {
        console.error('error from showTopTooltip', e);
      });
    }, delay);
  }
  /**
   * @param {{ x: number; y: number; height: number; width: number; }} inputDimensions
   * @returns {boolean}
   */


  elementIsInViewport(inputDimensions) {
    if (inputDimensions.x < 0 || inputDimensions.y < 0 || inputDimensions.x + inputDimensions.width > document.documentElement.clientWidth || inputDimensions.y + inputDimensions.height > document.documentElement.clientHeight) {
      return false;
    }

    const viewport = document.documentElement;

    if (inputDimensions.x + inputDimensions.width > viewport.clientWidth || inputDimensions.y + inputDimensions.height > viewport.clientHeight) {
      return false;
    }

    return true;
  }
  /**
   * @param {{ x: number; y: number; } | null} click
   * @param {{ x: number; y: number; height: number; width: number; }} inputDimensions
   * @param {TopContextData} data
   */


  async showTopTooltip(click, inputDimensions, data) {
    let diffX = inputDimensions.x;
    let diffY = inputDimensions.y;

    if (click) {
      diffX -= click.x;
      diffY -= click.y;
    } else if (!this.elementIsInViewport(inputDimensions)) {
      // If the focus event is outside the viewport ignore, we've already tried to scroll to it
      return;
    }

    if (!data.inputType) {
      throw new Error('No input type found');
    }

    const mainType = (0, _matching.getMainTypeFromType)(data.inputType);
    const subType = (0, _matching.getSubtypeFromType)(data.inputType);

    if (mainType === 'unknown') {
      throw new Error('unreachable, should not be here if (mainType === "unknown")');
    }
    /** @type {GetAutofillDataRequest} */


    const details = {
      inputType: data.inputType,
      mainType,
      subType,
      serializedInputContext: JSON.stringify(data),
      triggerContext: {
        wasFromClick: Boolean(click),
        inputTop: Math.floor(diffY),
        inputLeft: Math.floor(diffX),
        inputHeight: Math.floor(inputDimensions.height),
        inputWidth: Math.floor(inputDimensions.width)
      }
    };

    try {
      await this._options.show(details);

      _classPrivateFieldSet(this, _state, 'parentShown');

      this._attachListeners();
    } catch (e) {
      console.error('could not show parent', e);
    }
  }

  _attachListeners() {
    window.addEventListener('scroll', this);
    window.addEventListener('keydown', this, true);
    window.addEventListener('input', this);
  }

  _removeListeners() {
    window.removeEventListener('scroll', this);
    window.removeEventListener('keydown', this, true);
    window.removeEventListener('input', this);
  }

  handleEvent(event) {
    switch (event.type) {
      case 'scroll':
        {
          this.removeTooltip(event.type);
          break;
        }

      case 'keydown':
        {
          if (['Escape', 'Tab', 'Enter'].includes(event.code)) {
            if (event.code === 'Escape') {
              event.preventDefault();
              event.stopImmediatePropagation();
            }

            this.removeTooltip(event.type);
          }

          break;
        }

      case 'input':
        {
          this.removeTooltip(event.type);
          break;
        }

      case 'pointerdown':
        {
          this.removeTooltip(event.type);
          break;
        }
    }
  }
  /**
   * @param {string} trigger
   * @returns {Promise<void>}
   */


  async removeTooltip(trigger) {
    var _this$_mutObs;

    // for none pointer events, check to see if the tooltip is open before trying to close it
    if (trigger !== 'pointerdown') {
      if (_classPrivateFieldGet(this, _state) !== 'parentShown') {
        return;
      }
    }

    this._options.remove().catch(e => console.error('Could not close parent', e));

    _classPrivateFieldSet(this, _state, 'idle');

    this._removeListeners();

    (_this$_mutObs = this._mutObs) === null || _this$_mutObs === void 0 ? void 0 : _this$_mutObs.disconnect();
  }

}

exports.OverlayUIController = OverlayUIController;

},{"../../Form/matching.js":41,"./UIController.js":56}],56:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UIController = void 0;

/**
 * @typedef AttachArgs The argument required to 'attach' a tooltip
 * @property {import("../../Form/Form").Form} form the Form that triggered this 'attach' call
 * @property {HTMLInputElement} input the input field that triggered this 'attach' call
 * @property {() => { x: number; y: number; height: number; width: number; }} getPosition A function that provides positioning information
 * @property {{x: number, y: number}|null} click The click positioning
 * @property {TopContextData} topContextData
 * @property {import("../../DeviceInterface/InterfacePrototype").default} device
 * @property {'userInitiated' | 'autoprompt'} trigger
 */

/**
 * This is the base interface that `UIControllers` should extend/implement
 */
class UIController {
  /**
   * Implement this method to control what happen when Autofill
   * has enough information to 'attach' a tooltip.
   *
   * @param {AttachArgs} _args
   * @returns {void}
   */
  attach(_args) {
    throw new Error('must implement attach');
  }
  /**
   * Implement this if your tooltip can be created from positioning
   * + topContextData.
   *
   * For example, in an 'overlay' on macOS/Windows this is needed since
   * there's no page information to call 'attach' above.
   *
   * @param {PosFn} _pos
   * @param {TopContextData} _topContextData
   * @returns {any | null}
   */


  createTooltip(_pos, _topContextData) {}
  /**
   * @param {string} _via
   */


  removeTooltip(_via) {}
  /**
   * Set the currently open HTMLTooltip instance
   *
   * @param {import("../HTMLTooltip.js").HTMLTooltip} _tooltip
   */


  setActiveTooltip(_tooltip) {}
  /**
   * Get the currently open HTMLTooltip instance, if one exists
   *
   * @returns {import("../HTMLTooltip.js").HTMLTooltip | null}
   */


  getActiveTooltip() {
    return null;
  }
  /**
   * Indicate whether the controller deems itself 'active'
   *
   * @returns {boolean}
   */


  isActive() {
    return false;
  }
  /**
   * Updates the items in the tooltip based on new data. Currently only supporting credentials.
   * @param {CredentialsObject[]} _data
   */


  updateItems(_data) {}

}

exports.UIController = UIController;

},{}],57:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ddgPasswordIconFocused = exports.ddgPasswordIconFilled = exports.ddgPasswordIconBaseWhite = exports.ddgPasswordIconBase = exports.ddgIdentityIconBase = exports.ddgCcIconFilled = exports.ddgCcIconBase = void 0;
const ddgPasswordIconBase = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+ZGRnLXBhc3N3b3JkLWljb24tYmFzZTwvdGl0bGU+CiAgICA8ZyBpZD0iZGRnLXBhc3N3b3JkLWljb24tYmFzZSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9IlVuaW9uIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0LjAwMDAwMCwgNC4wMDAwMDApIiBmaWxsPSIjMDAwMDAwIj4KICAgICAgICAgICAgPHBhdGggZD0iTTExLjMzMzMsMi42NjY2NyBDMTAuMjI4OCwyLjY2NjY3IDkuMzMzMzMsMy41NjIxIDkuMzMzMzMsNC42NjY2NyBDOS4zMzMzMyw1Ljc3MTI0IDEwLjIyODgsNi42NjY2NyAxMS4zMzMzLDYuNjY2NjcgQzEyLjQzNzksNi42NjY2NyAxMy4zMzMzLDUuNzcxMjQgMTMuMzMzMyw0LjY2NjY3IEMxMy4zMzMzLDMuNTYyMSAxMi40Mzc5LDIuNjY2NjcgMTEuMzMzMywyLjY2NjY3IFogTTEwLjY2NjcsNC42NjY2NyBDMTAuNjY2Nyw0LjI5ODQ4IDEwLjk2NTEsNCAxMS4zMzMzLDQgQzExLjcwMTUsNCAxMiw0LjI5ODQ4IDEyLDQuNjY2NjcgQzEyLDUuMDM0ODYgMTEuNzAxNSw1LjMzMzMzIDExLjMzMzMsNS4zMzMzMyBDMTAuOTY1MSw1LjMzMzMzIDEwLjY2NjcsNS4wMzQ4NiAxMC42NjY3LDQuNjY2NjcgWiIgaWQ9IlNoYXBlIj48L3BhdGg+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMC42NjY3LDAgQzcuNzIxMTUsMCA1LjMzMzMzLDIuMzg3ODEgNS4zMzMzMyw1LjMzMzMzIEM1LjMzMzMzLDUuNzYxMTkgNS4zODM4NSw2LjE3Nzk4IDUuNDc5NDUsNi41Nzc3NSBMMC4xOTUyNjIsMTEuODYxOSBDMC4wNzAyMzc5LDExLjk4NyAwLDEyLjE1NjUgMCwxMi4zMzMzIEwwLDE1LjMzMzMgQzAsMTUuNzAxNSAwLjI5ODQ3NywxNiAwLjY2NjY2NywxNiBMMy4zMzMzMywxNiBDNC4wNjk3MSwxNiA0LjY2NjY3LDE1LjQwMyA0LjY2NjY3LDE0LjY2NjcgTDQuNjY2NjcsMTQgTDUuMzMzMzMsMTQgQzYuMDY5NzEsMTQgNi42NjY2NywxMy40MDMgNi42NjY2NywxMi42NjY3IEw2LjY2NjY3LDExLjMzMzMgTDgsMTEuMzMzMyBDOC4xNzY4MSwxMS4zMzMzIDguMzQ2MzgsMTEuMjYzMSA4LjQ3MTQxLDExLjEzODEgTDkuMTU5MDYsMTAuNDUwNCBDOS42Mzc3MiwxMC41OTEyIDEwLjE0MzksMTAuNjY2NyAxMC42NjY3LDEwLjY2NjcgQzEzLjYxMjIsMTAuNjY2NyAxNiw4LjI3ODg1IDE2LDUuMzMzMzMgQzE2LDIuMzg3ODEgMTMuNjEyMiwwIDEwLjY2NjcsMCBaIE02LjY2NjY3LDUuMzMzMzMgQzYuNjY2NjcsMy4xMjQxOSA4LjQ1NzUzLDEuMzMzMzMgMTAuNjY2NywxLjMzMzMzIEMxMi44NzU4LDEuMzMzMzMgMTQuNjY2NywzLjEyNDE5IDE0LjY2NjcsNS4zMzMzMyBDMTQuNjY2Nyw3LjU0MjQ3IDEyLjg3NTgsOS4zMzMzMyAxMC42NjY3LDkuMzMzMzMgQzEwLjE1NTgsOS4zMzMzMyA5LjY2ODg2LDkuMjM3OSA5LjIyMTUyLDkuMDY0NSBDOC45NzUyOCw4Ljk2OTA1IDguNjk1OTEsOS4wMjc5NSA4LjUwOTE2LDkuMjE0NjkgTDcuNzIzODYsMTAgTDYsMTAgQzUuNjMxODEsMTAgNS4zMzMzMywxMC4yOTg1IDUuMzMzMzMsMTAuNjY2NyBMNS4zMzMzMywxMi42NjY3IEw0LDEyLjY2NjcgQzMuNjMxODEsMTIuNjY2NyAzLjMzMzMzLDEyLjk2NTEgMy4zMzMzMywxMy4zMzMzIEwzLjMzMzMzLDE0LjY2NjcgTDEuMzMzMzMsMTQuNjY2NyBMMS4zMzMzMywxMi42MDk1IEw2LjY5Nzg3LDcuMjQ0OTQgQzYuODc1MDIsNy4wNjc3OSA2LjkzNzksNi44MDYyOSA2Ljg2MDY1LDYuNTY3OTggQzYuNzM0ODksNi4xNzk5NyA2LjY2NjY3LDUuNzY1MjcgNi42NjY2Nyw1LjMzMzMzIFoiIGlkPSJTaGFwZSI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+';
exports.ddgPasswordIconBase = ddgPasswordIconBase;
const ddgPasswordIconBaseWhite = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+ZGRnLXBhc3N3b3JkLWljb24tYmFzZS13aGl0ZTwvdGl0bGU+CiAgICA8ZyBpZD0iZGRnLXBhc3N3b3JkLWljb24tYmFzZS13aGl0ZSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9IlVuaW9uIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0LjAwMDAwMCwgNC4wMDAwMDApIiBmaWxsPSIjRkZGRkZGIj4KICAgICAgICAgICAgPHBhdGggZD0iTTExLjMzMzMsMi42NjY2NyBDMTAuMjI4OCwyLjY2NjY3IDkuMzMzMzMsMy41NjIxIDkuMzMzMzMsNC42NjY2NyBDOS4zMzMzMyw1Ljc3MTI0IDEwLjIyODgsNi42NjY2NyAxMS4zMzMzLDYuNjY2NjcgQzEyLjQzNzksNi42NjY2NyAxMy4zMzMzLDUuNzcxMjQgMTMuMzMzMyw0LjY2NjY3IEMxMy4zMzMzLDMuNTYyMSAxMi40Mzc5LDIuNjY2NjcgMTEuMzMzMywyLjY2NjY3IFogTTEwLjY2NjcsNC42NjY2NyBDMTAuNjY2Nyw0LjI5ODQ4IDEwLjk2NTEsNCAxMS4zMzMzLDQgQzExLjcwMTUsNCAxMiw0LjI5ODQ4IDEyLDQuNjY2NjcgQzEyLDUuMDM0ODYgMTEuNzAxNSw1LjMzMzMzIDExLjMzMzMsNS4zMzMzMyBDMTAuOTY1MSw1LjMzMzMzIDEwLjY2NjcsNS4wMzQ4NiAxMC42NjY3LDQuNjY2NjcgWiIgaWQ9IlNoYXBlIj48L3BhdGg+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMC42NjY3LDAgQzcuNzIxMTUsMCA1LjMzMzMzLDIuMzg3ODEgNS4zMzMzMyw1LjMzMzMzIEM1LjMzMzMzLDUuNzYxMTkgNS4zODM4NSw2LjE3Nzk4IDUuNDc5NDUsNi41Nzc3NSBMMC4xOTUyNjIsMTEuODYxOSBDMC4wNzAyMzc5LDExLjk4NyAwLDEyLjE1NjUgMCwxMi4zMzMzIEwwLDE1LjMzMzMgQzAsMTUuNzAxNSAwLjI5ODQ3NywxNiAwLjY2NjY2NywxNiBMMy4zMzMzMywxNiBDNC4wNjk3MSwxNiA0LjY2NjY3LDE1LjQwMyA0LjY2NjY3LDE0LjY2NjcgTDQuNjY2NjcsMTQgTDUuMzMzMzMsMTQgQzYuMDY5NzEsMTQgNi42NjY2NywxMy40MDMgNi42NjY2NywxMi42NjY3IEw2LjY2NjY3LDExLjMzMzMgTDgsMTEuMzMzMyBDOC4xNzY4MSwxMS4zMzMzIDguMzQ2MzgsMTEuMjYzMSA4LjQ3MTQxLDExLjEzODEgTDkuMTU5MDYsMTAuNDUwNCBDOS42Mzc3MiwxMC41OTEyIDEwLjE0MzksMTAuNjY2NyAxMC42NjY3LDEwLjY2NjcgQzEzLjYxMjIsMTAuNjY2NyAxNiw4LjI3ODg1IDE2LDUuMzMzMzMgQzE2LDIuMzg3ODEgMTMuNjEyMiwwIDEwLjY2NjcsMCBaIE02LjY2NjY3LDUuMzMzMzMgQzYuNjY2NjcsMy4xMjQxOSA4LjQ1NzUzLDEuMzMzMzMgMTAuNjY2NywxLjMzMzMzIEMxMi44NzU4LDEuMzMzMzMgMTQuNjY2NywzLjEyNDE5IDE0LjY2NjcsNS4zMzMzMyBDMTQuNjY2Nyw3LjU0MjQ3IDEyLjg3NTgsOS4zMzMzMyAxMC42NjY3LDkuMzMzMzMgQzEwLjE1NTgsOS4zMzMzMyA5LjY2ODg2LDkuMjM3OSA5LjIyMTUyLDkuMDY0NSBDOC45NzUyOCw4Ljk2OTA1IDguNjk1OTEsOS4wMjc5NSA4LjUwOTE2LDkuMjE0NjkgTDcuNzIzODYsMTAgTDYsMTAgQzUuNjMxODEsMTAgNS4zMzMzMywxMC4yOTg1IDUuMzMzMzMsMTAuNjY2NyBMNS4zMzMzMywxMi42NjY3IEw0LDEyLjY2NjcgQzMuNjMxODEsMTIuNjY2NyAzLjMzMzMzLDEyLjk2NTEgMy4zMzMzMywxMy4zMzMzIEwzLjMzMzMzLDE0LjY2NjcgTDEuMzMzMzMsMTQuNjY2NyBMMS4zMzMzMywxMi42MDk1IEw2LjY5Nzg3LDcuMjQ0OTQgQzYuODc1MDIsNy4wNjc3OSA2LjkzNzksNi44MDYyOSA2Ljg2MDY1LDYuNTY3OTggQzYuNzM0ODksNi4xNzk5NyA2LjY2NjY3LDUuNzY1MjcgNi42NjY2Nyw1LjMzMzMzIFoiIGlkPSJTaGFwZSI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+';
exports.ddgPasswordIconBaseWhite = ddgPasswordIconBaseWhite;
const ddgPasswordIconFilled = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+ZGRnLXBhc3N3b3JkLWljb24tZmlsbGVkPC90aXRsZT4KICAgIDxnIGlkPSJkZGctcGFzc3dvcmQtaWNvbi1maWxsZWQiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJTaGFwZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNC4wMDAwMDAsIDQuMDAwMDAwKSIgZmlsbD0iIzc2NDMxMCI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMS4yNSwyLjc1IEMxMC4xNDU0LDIuNzUgOS4yNSwzLjY0NTQzIDkuMjUsNC43NSBDOS4yNSw1Ljg1NDU3IDEwLjE0NTQsNi43NSAxMS4yNSw2Ljc1IEMxMi4zNTQ2LDYuNzUgMTMuMjUsNS44NTQ1NyAxMy4yNSw0Ljc1IEMxMy4yNSwzLjY0NTQzIDEyLjM1NDYsMi43NSAxMS4yNSwyLjc1IFogTTEwLjc1LDQuNzUgQzEwLjc1LDQuNDczODYgMTAuOTczOSw0LjI1IDExLjI1LDQuMjUgQzExLjUyNjEsNC4yNSAxMS43NSw0LjQ3Mzg2IDExLjc1LDQuNzUgQzExLjc1LDUuMDI2MTQgMTEuNTI2MSw1LjI1IDExLjI1LDUuMjUgQzEwLjk3MzksNS4yNSAxMC43NSw1LjAyNjE0IDEwLjc1LDQuNzUgWiI+PC9wYXRoPgogICAgICAgICAgICA8cGF0aCBkPSJNMTAuNjI1LDAgQzcuNjU2NDcsMCA1LjI1LDIuNDA2NDcgNS4yNSw1LjM3NSBDNS4yNSw1Ljc4MDk4IDUuMjk1MTQsNi4xNzcxNCA1LjM4MDg4LDYuNTU4NDYgTDAuMjE5NjcsMTEuNzE5NyBDMC4wNzkwMTc2LDExLjg2MDMgMCwxMi4wNTExIDAsMTIuMjUgTDAsMTUuMjUgQzAsMTUuNjY0MiAwLjMzNTc4NiwxNiAwLjc1LDE2IEwzLjc0NjYxLDE2IEM0LjMwMDc2LDE2IDQuNzUsMTUuNTUwOCA0Ljc1LDE0Ljk5NjYgTDQuNzUsMTQgTDUuNzQ2NjEsMTQgQzYuMzAwNzYsMTQgNi43NSwxMy41NTA4IDYuNzUsMTIuOTk2NiBMNi43NSwxMS41IEw4LDExLjUgQzguMTk4OTEsMTEuNSA4LjM4OTY4LDExLjQyMSA4LjUzMDMzLDExLjI4MDMgTDkuMjQwNzgsMTAuNTY5OSBDOS42ODMwNCwxMC42ODc1IDEwLjE0NzIsMTAuNzUgMTAuNjI1LDEwLjc1IEMxMy41OTM1LDEwLjc1IDE2LDguMzQzNTMgMTYsNS4zNzUgQzE2LDIuNDA2NDcgMTMuNTkzNSwwIDEwLjYyNSwwIFogTTYuNzUsNS4zNzUgQzYuNzUsMy4yMzQ5IDguNDg0OSwxLjUgMTAuNjI1LDEuNSBDMTIuNzY1MSwxLjUgMTQuNSwzLjIzNDkgMTQuNSw1LjM3NSBDMTQuNSw3LjUxNTEgMTIuNzY1MSw5LjI1IDEwLjYyNSw5LjI1IEMxMC4xNTQ1LDkuMjUgOS43MDUyOCw5LjE2NjUgOS4yOTAxMSw5LjAxNDE2IEM5LjAxNTgxLDguOTEzNSA4LjcwODAzLDguOTgxMzEgOC41MDE0Miw5LjE4NzkyIEw3LjY4OTM0LDEwIEw2LDEwIEM1LjU4NTc5LDEwIDUuMjUsMTAuMzM1OCA1LjI1LDEwLjc1IEw1LjI1LDEyLjUgTDQsMTIuNSBDMy41ODU3OSwxMi41IDMuMjUsMTIuODM1OCAzLjI1LDEzLjI1IEwzLjI1LDE0LjUgTDEuNSwxNC41IEwxLjUsMTIuNTYwNyBMNi43NDgyNiw3LjMxMjQgQzYuOTQ2NjYsNy4xMTQgNy4wMTc3Myw2LjgyMTQ1IDYuOTMyNDUsNi41NTQxMyBDNi44MTQxNSw2LjE4MzI3IDYuNzUsNS43ODczNSA2Ljc1LDUuMzc1IFoiPjwvcGF0aD4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==';
exports.ddgPasswordIconFilled = ddgPasswordIconFilled;
const ddgPasswordIconFocused = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+ZGRnLXBhc3N3b3JkLWljb24tZm9jdXNlZDwvdGl0bGU+CiAgICA8ZyBpZD0iZGRnLXBhc3N3b3JkLWljb24tZm9jdXNlZCIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9Ikljb24tQ29udGFpbmVyIiBmaWxsPSIjMDAwMDAwIj4KICAgICAgICAgICAgPHJlY3QgaWQ9IlJlY3RhbmdsZSIgZmlsbC1vcGFjaXR5PSIwLjEiIGZpbGwtcnVsZT0ibm9uemVybyIgeD0iMCIgeT0iMCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iMTIiPjwvcmVjdD4KICAgICAgICAgICAgPGcgaWQ9Ikdyb3VwIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0LjAwMDAwMCwgNC4wMDAwMDApIiBmaWxsLW9wYWNpdHk9IjAuOSI+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEuMjUsMi43NSBDMTAuMTQ1NCwyLjc1IDkuMjUsMy42NDU0MyA5LjI1LDQuNzUgQzkuMjUsNS44NTQ1NyAxMC4xNDU0LDYuNzUgMTEuMjUsNi43NSBDMTIuMzU0Niw2Ljc1IDEzLjI1LDUuODU0NTcgMTMuMjUsNC43NSBDMTMuMjUsMy42NDU0MyAxMi4zNTQ2LDIuNzUgMTEuMjUsMi43NSBaIE0xMC43NSw0Ljc1IEMxMC43NSw0LjQ3Mzg2IDEwLjk3MzksNC4yNSAxMS4yNSw0LjI1IEMxMS41MjYxLDQuMjUgMTEuNzUsNC40NzM4NiAxMS43NSw0Ljc1IEMxMS43NSw1LjAyNjE0IDExLjUyNjEsNS4yNSAxMS4yNSw1LjI1IEMxMC45NzM5LDUuMjUgMTAuNzUsNS4wMjYxNCAxMC43NSw0Ljc1IFoiIGlkPSJTaGFwZSI+PC9wYXRoPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTEwLjYyNSwwIEM3LjY1NjUsMCA1LjI1LDIuNDA2NDcgNS4yNSw1LjM3NSBDNS4yNSw1Ljc4MDk4IDUuMjk1MTQsNi4xNzcxIDUuMzgwODgsNi41NTg1IEwwLjIxOTY3LDExLjcxOTcgQzAuMDc5MDIsMTEuODYwMyAwLDEyLjA1MTEgMCwxMi4yNSBMMCwxNS4yNSBDMCwxNS42NjQyIDAuMzM1NzksMTYgMC43NSwxNiBMMy43NDY2MSwxNiBDNC4zMDA3NiwxNiA0Ljc1LDE1LjU1MDggNC43NSwxNC45OTY2IEw0Ljc1LDE0IEw1Ljc0NjYxLDE0IEM2LjMwMDgsMTQgNi43NSwxMy41NTA4IDYuNzUsMTIuOTk2NiBMNi43NSwxMS41IEw4LDExLjUgQzguMTk4OSwxMS41IDguMzg5NywxMS40MjEgOC41MzAzLDExLjI4MDMgTDkuMjQwOCwxMC41Njk5IEM5LjY4MywxMC42ODc1IDEwLjE0NzIsMTAuNzUgMTAuNjI1LDEwLjc1IEMxMy41OTM1LDEwLjc1IDE2LDguMzQzNSAxNiw1LjM3NSBDMTYsMi40MDY0NyAxMy41OTM1LDAgMTAuNjI1LDAgWiBNNi43NSw1LjM3NSBDNi43NSwzLjIzNDkgOC40ODQ5LDEuNSAxMC42MjUsMS41IEMxMi43NjUxLDEuNSAxNC41LDMuMjM0OSAxNC41LDUuMzc1IEMxNC41LDcuNTE1MSAxMi43NjUxLDkuMjUgMTAuNjI1LDkuMjUgQzEwLjE1NDUsOS4yNSA5LjcwNTMsOS4xNjY1IDkuMjkwMSw5LjAxNDIgQzkuMDE1OCw4LjkxMzUgOC43MDgsOC45ODEzIDguNTAxNCw5LjE4NzkgTDcuNjg5MywxMCBMNiwxMCBDNS41ODU3OSwxMCA1LjI1LDEwLjMzNTggNS4yNSwxMC43NSBMNS4yNSwxMi41IEw0LDEyLjUgQzMuNTg1NzksMTIuNSAzLjI1LDEyLjgzNTggMy4yNSwxMy4yNSBMMy4yNSwxNC41IEwxLjUsMTQuNSBMMS41LDEyLjU2MDcgTDYuNzQ4Myw3LjMxMjQgQzYuOTQ2Nyw3LjExNCA3LjAxNzcsNi44MjE0IDYuOTMyNSw2LjU1NDEgQzYuODE0MSw2LjE4MzMgNi43NSw1Ljc4NzM1IDYuNzUsNS4zNzUgWiIgaWQ9IlNoYXBlIj48L3BhdGg+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==';
exports.ddgPasswordIconFocused = ddgPasswordIconFocused;
const ddgCcIconBase = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSI+CiAgICA8cGF0aCBkPSJNNSA5Yy0uNTUyIDAtMSAuNDQ4LTEgMXYyYzAgLjU1Mi40NDggMSAxIDFoM2MuNTUyIDAgMS0uNDQ4IDEtMXYtMmMwLS41NTItLjQ0OC0xLTEtMUg1eiIgZmlsbD0iIzAwMCIvPgogICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xIDZjMC0yLjIxIDEuNzktNCA0LTRoMTRjMi4yMSAwIDQgMS43OSA0IDR2MTJjMCAyLjIxLTEuNzkgNC00IDRINWMtMi4yMSAwLTQtMS43OS00LTRWNnptNC0yYy0xLjEwNSAwLTIgLjg5NS0yIDJ2OWgxOFY2YzAtMS4xMDUtLjg5NS0yLTItMkg1em0wIDE2Yy0xLjEwNSAwLTItLjg5NS0yLTJoMThjMCAxLjEwNS0uODk1IDItMiAySDV6IiBmaWxsPSIjMDAwIi8+Cjwvc3ZnPgo=';
exports.ddgCcIconBase = ddgCcIconBase;
const ddgCcIconFilled = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSI+CiAgICA8cGF0aCBkPSJNNSA5Yy0uNTUyIDAtMSAuNDQ4LTEgMXYyYzAgLjU1Mi40NDggMSAxIDFoM2MuNTUyIDAgMS0uNDQ4IDEtMXYtMmMwLS41NTItLjQ0OC0xLTEtMUg1eiIgZmlsbD0iIzc2NDMxMCIvPgogICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xIDZjMC0yLjIxIDEuNzktNCA0LTRoMTRjMi4yMSAwIDQgMS43OSA0IDR2MTJjMCAyLjIxLTEuNzkgNC00IDRINWMtMi4yMSAwLTQtMS43OS00LTRWNnptNC0yYy0xLjEwNSAwLTIgLjg5NS0yIDJ2OWgxOFY2YzAtMS4xMDUtLjg5NS0yLTItMkg1em0wIDE2Yy0xLjEwNSAwLTItLjg5NS0yLTJoMThjMCAxLjEwNS0uODk1IDItMiAySDV6IiBmaWxsPSIjNzY0MzEwIi8+Cjwvc3ZnPgo=';
exports.ddgCcIconFilled = ddgCcIconFilled;
const ddgIdentityIconBase = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSI+CiAgICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEyIDIxYzIuMTQzIDAgNC4xMTEtLjc1IDUuNjU3LTItLjYyNi0uNTA2LTEuMzE4LS45MjctMi4wNi0xLjI1LTEuMS0uNDgtMi4yODUtLjczNS0zLjQ4Ni0uNzUtMS4yLS4wMTQtMi4zOTIuMjExLTMuNTA0LjY2NC0uODE3LjMzMy0xLjU4Ljc4My0yLjI2NCAxLjMzNiAxLjU0NiAxLjI1IDMuNTE0IDIgNS42NTcgMnptNC4zOTctNS4wODNjLjk2Ny40MjIgMS44NjYuOTggMi42NzIgMS42NTVDMjAuMjc5IDE2LjAzOSAyMSAxNC4xMDQgMjEgMTJjMC00Ljk3LTQuMDMtOS05LTlzLTkgNC4wMy05IDljMCAyLjEwNC43MjIgNC4wNCAxLjkzMiA1LjU3Mi44NzQtLjczNCAxLjg2LTEuMzI4IDIuOTIxLTEuNzYgMS4zNi0uNTU0IDIuODE2LS44MyA0LjI4My0uODExIDEuNDY3LjAxOCAyLjkxNi4zMyA0LjI2LjkxNnpNMTIgMjNjNi4wNzUgMCAxMS00LjkyNSAxMS0xMVMxOC4wNzUgMSAxMiAxIDEgNS45MjUgMSAxMnM0LjkyNSAxMSAxMSAxMXptMy0xM2MwIDEuNjU3LTEuMzQzIDMtMyAzcy0zLTEuMzQzLTMtMyAxLjM0My0zIDMtMyAzIDEuMzQzIDMgM3ptMiAwYzAgMi43NjEtMi4yMzkgNS01IDVzLTUtMi4yMzktNS01IDIuMjM5LTUgNS01IDUgMi4yMzkgNSA1eiIgZmlsbD0iIzAwMCIvPgo8L3N2Zz4KPHBhdGggeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEyIDIxYzIuMTQzIDAgNC4xMTEtLjc1IDUuNjU3LTItLjYyNi0uNTA2LTEuMzE4LS45MjctMi4wNi0xLjI1LTEuMS0uNDgtMi4yODUtLjczNS0zLjQ4Ni0uNzUtMS4yLS4wMTQtMi4zOTIuMjExLTMuNTA0LjY2NC0uODE3LjMzMy0xLjU4Ljc4My0yLjI2NCAxLjMzNiAxLjU0NiAxLjI1IDMuNTE0IDIgNS42NTcgMnptNC4zOTctNS4wODNjLjk2Ny40MjIgMS44NjYuOTggMi42NzIgMS42NTVDMjAuMjc5IDE2LjAzOSAyMSAxNC4xMDQgMjEgMTJjMC00Ljk3LTQuMDMtOS05LTlzLTkgNC4wMy05IDljMCAyLjEwNC43MjIgNC4wNCAxLjkzMiA1LjU3Mi44NzQtLjczNCAxLjg2LTEuMzI4IDIuOTIxLTEuNzYgMS4zNi0uNTU0IDIuODE2LS44MyA0LjI4My0uODExIDEuNDY3LjAxOCAyLjkxNi4zMyA0LjI2LjkxNnpNMTIgMjNjNi4wNzUgMCAxMS00LjkyNSAxMS0xMVMxOC4wNzUgMSAxMiAxIDEgNS45MjUgMSAxMnM0LjkyNSAxMSAxMSAxMXptMy0xM2MwIDEuNjU3LTEuMzQzIDMtMyAzcy0zLTEuMzQzLTMtMyAxLjM0My0zIDMtMyAzIDEuMzQzIDMgM3ptMiAwYzAgMi43NjEtMi4yMzkgNS01IDVzLTUtMi4yMzktNS01IDIuMjM5LTUgNS01IDUgMi4yMzkgNSA1eiIgZmlsbD0iIzAwMCIvPgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJub25lIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMiAyMWMyLjE0MyAwIDQuMTExLS43NSA1LjY1Ny0yLS42MjYtLjUwNi0xLjMxOC0uOTI3LTIuMDYtMS4yNS0xLjEtLjQ4LTIuMjg1LS43MzUtMy40ODYtLjc1LTEuMi0uMDE0LTIuMzkyLjIxMS0zLjUwNC42NjQtLjgxNy4zMzMtMS41OC43ODMtMi4yNjQgMS4zMzYgMS41NDYgMS4yNSAzLjUxNCAyIDUuNjU3IDJ6bTQuMzk3LTUuMDgzYy45NjcuNDIyIDEuODY2Ljk4IDIuNjcyIDEuNjU1QzIwLjI3OSAxNi4wMzkgMjEgMTQuMTA0IDIxIDEyYzAtNC45Ny00LjAzLTktOS05cy05IDQuMDMtOSA5YzAgMi4xMDQuNzIyIDQuMDQgMS45MzIgNS41NzIuODc0LS43MzQgMS44Ni0xLjMyOCAyLjkyMS0xLjc2IDEuMzYtLjU1NCAyLjgxNi0uODMgNC4yODMtLjgxMSAxLjQ2Ny4wMTggMi45MTYuMzMgNC4yNi45MTZ6TTEyIDIzYzYuMDc1IDAgMTEtNC45MjUgMTEtMTFTMTguMDc1IDEgMTIgMSAxIDUuOTI1IDEgMTJzNC45MjUgMTEgMTEgMTF6bTMtMTNjMCAxLjY1Ny0xLjM0MyAzLTMgM3MtMy0xLjM0My0zLTMgMS4zNDMtMyAzLTMgMyAxLjM0MyAzIDN6bTIgMGMwIDIuNzYxLTIuMjM5IDUtNSA1cy01LTIuMjM5LTUtNSAyLjIzOS01IDUtNSA1IDIuMjM5IDUgNXoiIGZpbGw9IiMwMDAiLz4KPC9zdmc+Cg==";
exports.ddgIdentityIconBase = ddgIdentityIconBase;

},{}],58:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CSS_STYLES = void 0;
const CSS_STYLES = ":root {\n    color-scheme: light dark;\n}\n\n.wrapper *, .wrapper *::before, .wrapper *::after {\n    box-sizing: border-box;\n}\n.wrapper {\n    position: fixed;\n    top: 0;\n    left: 0;\n    padding: 0;\n    font-family: 'DDG_ProximaNova', 'Proxima Nova', -apple-system,\n    BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',\n    'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;\n    -webkit-font-smoothing: antialiased;\n    /* move it offscreen to avoid flashing */\n    transform: translate(-1000px);\n    z-index: 2147483647;\n}\n:not(.top-autofill).wrapper--data {\n    font-family: 'SF Pro Text', -apple-system,\n    BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',\n    'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;\n}\n:not(.top-autofill) .tooltip {\n    position: absolute;\n    width: 300px;\n    max-width: calc(100vw - 25px);\n    z-index: 2147483647;\n}\n.tooltip--data, #topAutofill {\n    background-color: rgba(242, 240, 240, 1);\n    -webkit-backdrop-filter: blur(40px);\n    backdrop-filter: blur(40px);\n}\n@media (prefers-color-scheme: dark) {\n    .tooltip--data, #topAutofill {\n        background: rgb(100, 98, 102, .9);\n    }\n}\n.tooltip--data {\n    padding: 6px;\n    font-size: 13px;\n    line-height: 14px;\n    width: 315px;\n}\n:not(.top-autofill) .tooltip--data {\n    top: 100%;\n    left: 100%;\n    border: 0.5px solid rgba(255, 255, 255, 0.2);\n    border-radius: 6px;\n    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.32);\n}\n@media (prefers-color-scheme: dark) {\n    :not(.top-autofill) .tooltip--data {\n        border: 1px solid rgba(255, 255, 255, 0.2);\n    }\n}\n:not(.top-autofill) .tooltip--email {\n    top: calc(100% + 6px);\n    right: calc(100% - 46px);\n    padding: 8px;\n    border: 1px solid #D0D0D0;\n    border-radius: 10px;\n    background-color: #FFFFFF;\n    font-size: 14px;\n    line-height: 1.3;\n    color: #333333;\n    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);\n}\n.tooltip--email::before,\n.tooltip--email::after {\n    content: \"\";\n    width: 0;\n    height: 0;\n    border-left: 10px solid transparent;\n    border-right: 10px solid transparent;\n    display: block;\n    border-bottom: 8px solid #D0D0D0;\n    position: absolute;\n    right: 20px;\n}\n.tooltip--email::before {\n    border-bottom-color: #D0D0D0;\n    top: -9px;\n}\n.tooltip--email::after {\n    border-bottom-color: #FFFFFF;\n    top: -8px;\n}\n\n/* Buttons */\n.tooltip__button {\n    display: flex;\n    width: 100%;\n    padding: 8px 0px;\n    font-family: inherit;\n    color: inherit;\n    background: transparent;\n    border: none;\n    border-radius: 6px;\n}\n.tooltip__button.currentFocus,\n.tooltip__button:hover {\n    background-color: rgba(0, 121, 242, 0.9);\n    color: #FFFFFF;\n}\n\n/* Data autofill tooltip specific */\n.tooltip__button--data {\n    position: relative;\n    min-height: 48px;\n    flex-direction: row;\n    justify-content: flex-start;\n    font-size: inherit;\n    font-weight: 500;\n    line-height: 16px;\n    text-align: left;\n}\n.tooltip__button--data:first-child {\n    margin-top: 0;\n}\n.tooltip__button--data:last-child {\n    margin-bottom: 0;\n}\n.tooltip__button--data::before {\n    content: '';\n    flex-shrink: 0;\n    display: block;\n    width: 32px;\n    height: 32px;\n    margin: 0 8px;\n    background-size: 24px 24px;\n    background-repeat: no-repeat;\n    background-position: center 4px;\n}\n#provider_locked::after {\n    position: absolute;\n    content: '';\n    flex-shrink: 0;\n    display: block;\n    width: 32px;\n    height: 32px;\n    margin: 0 8px;\n    background-size: 11px 13px;\n    background-repeat: no-repeat;\n    background-position: right bottom;\n}\n.tooltip__button--data.currentFocus:not(.tooltip__button--data--bitwarden)::before,\n.tooltip__button--data:not(.tooltip__button--data--bitwarden):hover::before {\n    filter: invert(100%);\n}\n@media (prefers-color-scheme: dark) {\n    .tooltip__button--data:not(.tooltip__button--data--bitwarden)::before,\n    .tooltip__button--data:not(.tooltip__button--data--bitwarden)::before {\n        filter: invert(100%);\n        opacity: .9;\n    }\n}\n.tooltip__button__text-container {\n    margin: auto 0;\n}\n.label {\n    display: block;\n    font-weight: 400;\n    letter-spacing: -0.25px;\n    color: rgba(0,0,0,.8);\n    line-height: 13px;\n}\n.label + .label {\n    margin-top: 5px;\n}\n.label.label--medium {\n    letter-spacing: -0.08px;\n    color: rgba(0,0,0,.9)\n}\n.label.label--small {\n    font-size: 11px;\n    font-weight: 400;\n    letter-spacing: 0.06px;\n    color: rgba(0,0,0,0.6);\n}\n@media (prefers-color-scheme: dark) {\n    .tooltip--data .label {\n        color: #ffffff;\n    }\n    .tooltip--data .label--medium {\n        color: #ffffff;\n    }\n    .tooltip--data .label--small {\n        color: #cdcdcd;\n    }\n}\n.tooltip__button.currentFocus .label,\n.tooltip__button:hover .label,\n.tooltip__button.currentFocus .label,\n.tooltip__button:hover .label {\n    color: #FFFFFF;\n}\n\n/* Icons */\n.tooltip__button--data--credentials::before {\n    /* TODO: use dynamically from src/UI/img/ddgPasswordIcon.js */\n    background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik05LjYzNiA4LjY4MkM5LjYzNiA1LjU0NCAxMi4xOCAzIDE1LjMxOCAzIDE4LjQ1NiAzIDIxIDUuNTQ0IDIxIDguNjgyYzAgMy4xMzgtMi41NDQgNS42ODItNS42ODIgNS42ODItLjY5MiAwLTEuMzUzLS4xMjQtMS45NjQtLjM0OS0uMzcyLS4xMzctLjc5LS4wNDEtMS4wNjYuMjQ1bC0uNzEzLjc0SDEwYy0uNTUyIDAtMSAuNDQ4LTEgMXYySDdjLS41NTIgMC0xIC40NDgtMSAxdjJIM3YtMi44ODFsNi42NjgtNi42NjhjLjI2NS0uMjY2LjM2LS42NTguMjQ0LTEuMDE1LS4xNzktLjU1MS0uMjc2LTEuMTQtLjI3Ni0xLjc1NHpNMTUuMzE4IDFjLTQuMjQyIDAtNy42ODIgMy40NC03LjY4MiA3LjY4MiAwIC42MDcuMDcxIDEuMi4yMDUgMS43NjdsLTYuNTQ4IDYuNTQ4Yy0uMTg4LjE4OC0uMjkzLjQ0Mi0uMjkzLjcwOFYyMmMwIC4yNjUuMTA1LjUyLjI5My43MDcuMTg3LjE4OC40NDIuMjkzLjcwNy4yOTNoNGMxLjEwNSAwIDItLjg5NSAyLTJ2LTFoMWMxLjEwNSAwIDItLjg5NSAyLTJ2LTFoMWMuMjcyIDAgLjUzMi0uMTEuNzItLjMwNmwuNTc3LS42Yy42NDUuMTc2IDEuMzIzLjI3IDIuMDIxLjI3IDQuMjQzIDAgNy42ODItMy40NCA3LjY4Mi03LjY4MkMyMyA0LjQzOSAxOS41NiAxIDE1LjMxOCAxek0xNSA4YzAtLjU1Mi40NDgtMSAxLTFzMSAuNDQ4IDEgMS0uNDQ4IDEtMSAxLTEtLjQ0OC0xLTF6bTEtM2MtMS42NTcgMC0zIDEuMzQzLTMgM3MxLjM0MyAzIDMgMyAzLTEuMzQzIDMtMy0xLjM0My0zLTMtM3oiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iLjkiLz4KPC9zdmc+');\n}\n.tooltip__button--data--creditCards::before {\n    background-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSI+CiAgICA8cGF0aCBkPSJNNSA5Yy0uNTUyIDAtMSAuNDQ4LTEgMXYyYzAgLjU1Mi40NDggMSAxIDFoM2MuNTUyIDAgMS0uNDQ4IDEtMXYtMmMwLS41NTItLjQ0OC0xLTEtMUg1eiIgZmlsbD0iIzAwMCIvPgogICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xIDZjMC0yLjIxIDEuNzktNCA0LTRoMTRjMi4yMSAwIDQgMS43OSA0IDR2MTJjMCAyLjIxLTEuNzkgNC00IDRINWMtMi4yMSAwLTQtMS43OS00LTRWNnptNC0yYy0xLjEwNSAwLTIgLjg5NS0yIDJ2OWgxOFY2YzAtMS4xMDUtLjg5NS0yLTItMkg1em0wIDE2Yy0xLjEwNSAwLTItLjg5NS0yLTJoMThjMCAxLjEwNS0uODk1IDItMiAySDV6IiBmaWxsPSIjMDAwIi8+Cjwvc3ZnPgo=');\n}\n.tooltip__button--data--identities::before {\n    background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSI+CiAgICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEyIDIxYzIuMTQzIDAgNC4xMTEtLjc1IDUuNjU3LTItLjYyNi0uNTA2LTEuMzE4LS45MjctMi4wNi0xLjI1LTEuMS0uNDgtMi4yODUtLjczNS0zLjQ4Ni0uNzUtMS4yLS4wMTQtMi4zOTIuMjExLTMuNTA0LjY2NC0uODE3LjMzMy0xLjU4Ljc4My0yLjI2NCAxLjMzNiAxLjU0NiAxLjI1IDMuNTE0IDIgNS42NTcgMnptNC4zOTctNS4wODNjLjk2Ny40MjIgMS44NjYuOTggMi42NzIgMS42NTVDMjAuMjc5IDE2LjAzOSAyMSAxNC4xMDQgMjEgMTJjMC00Ljk3LTQuMDMtOS05LTlzLTkgNC4wMy05IDljMCAyLjEwNC43MjIgNC4wNCAxLjkzMiA1LjU3Mi44NzQtLjczNCAxLjg2LTEuMzI4IDIuOTIxLTEuNzYgMS4zNi0uNTU0IDIuODE2LS44MyA0LjI4My0uODExIDEuNDY3LjAxOCAyLjkxNi4zMyA0LjI2LjkxNnpNMTIgMjNjNi4wNzUgMCAxMS00LjkyNSAxMS0xMVMxOC4wNzUgMSAxMiAxIDEgNS45MjUgMSAxMnM0LjkyNSAxMSAxMSAxMXptMy0xM2MwIDEuNjU3LTEuMzQzIDMtMyAzcy0zLTEuMzQzLTMtMyAxLjM0My0zIDMtMyAzIDEuMzQzIDMgM3ptMiAwYzAgMi43NjEtMi4yMzkgNS01IDVzLTUtMi4yMzktNS01IDIuMjM5LTUgNS01IDUgMi4yMzkgNSA1eiIgZmlsbD0iIzAwMCIvPgo8L3N2Zz4=');\n}\n.tooltip__button--data--credentials.tooltip__button--data--bitwarden::before {\n    background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iOCIgZmlsbD0iIzE3NUREQyIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE4LjU2OTYgNS40MzM1NUMxOC41MDg0IDUuMzc0NDIgMTguNDM0NyA1LjMyNzYzIDE4LjM1MzEgNS4yOTYxMUMxOC4yNzE1IDUuMjY0NiAxOC4xODM3IDUuMjQ5MDQgMTguMDk1MyA1LjI1MDQxSDUuOTIxOTFDNS44MzMyNiA1LjI0NzI5IDUuNzQ0OTMgNS4yNjIwNSA1LjY2MzA0IDUuMjkzNjdDNS41ODExNSA1LjMyNTI5IDUuNTA3NjUgNS4zNzMwMiA1LjQ0NzYyIDUuNDMzNTVDNS4zMjE3IDUuNTUwMTMgNS4yNTA2NSA1LjcwODE1IDUuMjUgNS44NzMxVjEzLjM4MjFDNS4yNTMzNiAxMy45NTM1IDUuMzc0MDggMTQuNTE5MSA1LjYwNTcyIDE1LjA0ODdDNS44MTkzMSAxNS41NzI4IDYuMTEyMDcgMTYuMDY2MSA2LjQ3NTI0IDE2LjUxMzlDNi44NDIgMTYuOTY4MyA3LjI1OTI5IDE3LjM4NTcgNy43MjAyNSAxNy43NTkzQzguMTQwNTMgMTguMTI1NiA4LjU4OTcxIDE4LjQ2MjMgOS4wNjQwNyAxOC43NjY2QzkuNDU5MzEgMTkuMDIzIDkuOTEzODMgMTkuMjc5NCAxMC4zNDg2IDE5LjUxNzVDMTAuNzgzNCAxOS43NTU2IDExLjA5OTYgMTkuOTIwNCAxMS4yNzc0IDE5Ljk5MzdDMTEuNDU1MyAyMC4wNjY5IDExLjYxMzQgMjAuMTQwMiAxMS43MTIyIDIwLjE5NTFDMTEuNzk5MiAyMC4yMzEzIDExLjg5MzUgMjAuMjUgMTEuOTg4OCAyMC4yNUMxMi4wODQyIDIwLjI1IDEyLjE3ODUgMjAuMjMxMyAxMi4yNjU1IDIwLjE5NTFDMTIuNDIxMiAyMC4xMzYzIDEyLjU3MjkgMjAuMDY5IDEyLjcyIDE5Ljk5MzdDMTIuNzcxMSAxOS45Njc0IDEyLjgzMzUgMTkuOTM2NiAxMi45MDY5IDE5LjkwMDRDMTMuMDg5MSAxOS44MTA1IDEzLjMzODggMTkuNjg3MiAxMy42NDg5IDE5LjUxNzVDMTQuMDgzNiAxOS4yNzk0IDE0LjUxODQgMTkuMDIzIDE0LjkzMzQgMTguNzY2NkMxNS40MDQgMTguNDU3NyAxNS44NTI4IDE4LjEyMTIgMTYuMjc3MiAxNy43NTkzQzE2LjczMzEgMTcuMzgwOSAxNy4xNDk5IDE2Ljk2NCAxNy41MjIyIDE2LjUxMzlDMTcuODc4IDE2LjA2MTcgMTguMTcwMiAxNS41NjkzIDE4LjM5MTcgMTUuMDQ4N0MxOC42MjM0IDE0LjUxOTEgMTguNzQ0MSAxMy45NTM1IDE4Ljc0NzQgMTMuMzgyMVY1Ljg3MzFDMTguNzU1NyA1Ljc5MjE0IDE4Ljc0MzkgNS43MTA1IDE4LjcxMzEgNS42MzQzNUMxOC42ODIzIDUuNTU4MiAxOC42MzMyIDUuNDg5NTQgMTguNTY5NiA1LjQzMzU1Wk0xNy4wMDg0IDEzLjQ1NTNDMTcuMDA4NCAxNi4xODQyIDEyLjAwODYgMTguNTI4NSAxMi4wMDg2IDE4LjUyODVWNi44NjIwOUgxNy4wMDg0VjEzLjQ1NTNaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K');\n}\n#provider_locked:after {\n    background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTEiIGhlaWdodD0iMTMiIHZpZXdCb3g9IjAgMCAxMSAxMyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEgNy42MDA1N1Y3LjYwMjVWOS41MjI1QzEgMTAuMDgwMSAxLjIyMTUxIDEwLjYxNDkgMS42MTU4MSAxMS4wMDkyQzIuMDEwMSAxMS40MDM1IDIuNTQ0ODggMTEuNjI1IDMuMTAyNSAxMS42MjVINy4yNzI1QzcuNTQ4NjEgMTEuNjI1IDcuODIyMDEgMTEuNTcwNiA4LjA3NzA5IDExLjQ2NUM4LjMzMjE4IDExLjM1OTMgOC41NjM5NiAxMS4yMDQ0IDguNzU5MTkgMTEuMDA5MkM4Ljk1NDQzIDEwLjgxNCA5LjEwOTMgMTAuNTgyMiA5LjIxNDk2IDEwLjMyNzFDOS4zMjA2MiAxMC4wNzIgOS4zNzUgOS43OTg2MSA5LjM3NSA5LjUyMjVMOS4zNzUgNy42MDI1TDkuMzc1IDcuNjAwNTdDOS4zNzQxNSA3LjE2MTMxIDkuMjM1NzQgNi43MzMzNSA4Ljk3OTIyIDYuMzc2NzhDOC44NzY4MyA2LjIzNDQ2IDguNzU3NjggNi4xMDYzNyA4LjYyNSA1Ljk5NDg5VjUuMTg3NUM4LjYyNSA0LjI3NTgyIDguMjYyODQgMy40MDE0OCA3LjYxODE4IDIuNzU2ODJDNi45NzM1MiAyLjExMjE2IDYuMDk5MTggMS43NSA1LjE4NzUgMS43NUM0LjI3NTgyIDEuNzUgMy40MDE0OCAyLjExMjE2IDIuNzU2ODIgMi43NTY4MkMyLjExMjE2IDMuNDAxNDggMS43NSA0LjI3NTgyIDEuNzUgNS4xODc1VjUuOTk0ODlDMS42MTczMiA2LjEwNjM3IDEuNDk4MTcgNi4yMzQ0NiAxLjM5NTc4IDYuMzc2NzhDMS4xMzkyNiA2LjczMzM1IDEuMDAwODUgNy4xNjEzMSAxIDcuNjAwNTdaTTQuOTY4NyA0Ljk2ODdDNS4wMjY5NCA0LjkxMDQ3IDUuMTA1MzIgNC44NzY5OSA1LjE4NzUgNC44NzUwN0M1LjI2OTY4IDQuODc2OTkgNS4zNDgwNiA0LjkxMDQ3IDUuNDA2MyA0Ljk2ODdDNS40NjU0MiA1LjAyNzgzIDUuNDk5MDQgNS4xMDc3NCA1LjUgNS4xOTEzVjUuNUg0Ljg3NVY1LjE5MTNDNC44NzU5NiA1LjEwNzc0IDQuOTA5NTggNS4wMjc4MyA0Ljk2ODcgNC45Njg3WiIgZmlsbD0iIzIyMjIyMiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=');\n}\n\nhr {\n    display: block;\n    margin: 5px 10px;\n    border: none; /* reset the border */\n    border-top: 1px solid rgba(0,0,0,.1);\n}\n\nhr:first-child {\n    display: none;\n}\n\n@media (prefers-color-scheme: dark) {\n    hr {\n        border-top: 1px solid rgba(255,255,255,.2);\n    }\n}\n\n#privateAddress {\n    align-items: flex-start;\n}\n#personalAddress::before,\n#privateAddress::before,\n#personalAddress.currentFocus::before,\n#personalAddress:hover::before,\n#privateAddress.currentFocus::before,\n#privateAddress:hover::before {\n    filter: none;\n    background-image: url('data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgNDQgNDQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PGxpbmVhckdyYWRpZW50IGlkPSJhIj48c3RvcCBvZmZzZXQ9Ii4wMSIgc3RvcC1jb2xvcj0iIzYxNzZiOSIvPjxzdG9wIG9mZnNldD0iLjY5IiBzdG9wLWNvbG9yPSIjMzk0YTlmIi8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9ImIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTMuOTI5NyIgeDI9IjE3LjA3MiIgeGxpbms6aHJlZj0iI2EiIHkxPSIxNi4zOTgiIHkyPSIxNi4zOTgiLz48bGluZWFyR3JhZGllbnQgaWQ9ImMiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMjMuODExNSIgeDI9IjI2LjY3NTIiIHhsaW5rOmhyZWY9IiNhIiB5MT0iMTQuOTY3OSIgeTI9IjE0Ljk2NzkiLz48bWFzayBpZD0iZCIgaGVpZ2h0PSI0MCIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiB4PSIyIiB5PSIyIj48cGF0aCBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Im0yMi4wMDAzIDQxLjA2NjljMTAuNTMwMiAwIDE5LjA2NjYtOC41MzY0IDE5LjA2NjYtMTkuMDY2NiAwLTEwLjUzMDMtOC41MzY0LTE5LjA2NjcxLTE5LjA2NjYtMTkuMDY2NzEtMTAuNTMwMyAwLTE5LjA2NjcxIDguNTM2NDEtMTkuMDY2NzEgMTkuMDY2NzEgMCAxMC41MzAyIDguNTM2NDEgMTkuMDY2NiAxOS4wNjY3MSAxOS4wNjY2eiIgZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9tYXNrPjxwYXRoIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0ibTIyIDQ0YzEyLjE1MDMgMCAyMi05Ljg0OTcgMjItMjIgMC0xMi4xNTAyNi05Ljg0OTctMjItMjItMjItMTIuMTUwMjYgMC0yMiA5Ljg0OTc0LTIyIDIyIDAgMTIuMTUwMyA5Ljg0OTc0IDIyIDIyIDIyeiIgZmlsbD0iI2RlNTgzMyIgZmlsbC1ydWxlPSJldmVub2RkIi8+PGcgbWFzaz0idXJsKCNkKSI+PHBhdGggY2xpcC1ydWxlPSJldmVub2RkIiBkPSJtMjYuMDgxMyA0MS42Mzg2Yy0uOTIwMy0xLjc4OTMtMS44MDAzLTMuNDM1Ni0yLjM0NjYtNC41MjQ2LTEuNDUyLTIuOTA3Ny0yLjkxMTQtNy4wMDctMi4yNDc3LTkuNjUwNy4xMjEtLjQ4MDMtMS4zNjc3LTE3Ljc4Njk5LTIuNDItMTguMzQ0MzItMS4xNjk3LS42MjMzMy0zLjcxMDctMS40NDQ2Ny01LjAyNy0xLjY2NDY3LS45MTY3LS4xNDY2Ni0xLjEyNTcuMTEtMS41MTA3LjE2ODY3LjM2My4wMzY2NyAyLjA5Ljg4NzMzIDIuNDIzNy45MzUtLjMzMzcuMjI3MzMtMS4zMi0uMDA3MzMtMS45NTA3LjI3MTMzLS4zMTkuMTQ2NjctLjU1NzMuNjg5MzQtLjU1Ljk0NiAxLjc5NjctLjE4MzMzIDQuNjA1NC0uMDAzNjYgNi4yNy43MzMyOS0xLjMyMzYuMTUwNC0zLjMzMy4zMTktNC4xOTgzLjc3MzctMi41MDggMS4zMi0zLjYxNTMgNC40MTEtMi45NTUzIDguMTE0My42NTYzIDMuNjk2IDMuNTY0IDE3LjE3ODQgNC40OTE2IDIxLjY4MS45MjQgNC40OTkgMTEuNTUzNyAzLjU1NjcgMTAuMDE3NC41NjF6IiBmaWxsPSIjZDVkN2Q4IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48cGF0aCBkPSJtMjIuMjg2NSAyNi44NDM5Yy0uNjYgMi42NDM2Ljc5MiA2LjczOTMgMi4yNDc2IDkuNjUwNi40ODkxLjk3MjcgMS4yNDM4IDIuMzkyMSAyLjA1NTggMy45NjM3LTEuODk0LjQ2OTMtNi40ODk1IDEuMTI2NC05LjcxOTEgMC0uOTI0LTQuNDkxNy0zLjgzMTctMTcuOTc3Ny00LjQ5NTMtMjEuNjgxLS42Ni0zLjcwMzMgMC02LjM0NyAyLjUxNTMtNy42NjcuODYxNy0uNDU0NyAyLjA5MzctLjc4NDcgMy40MTM3LS45MzEzLTEuNjY0Ny0uNzQwNy0zLjYzNzQtMS4wMjY3LTUuNDQxNC0uODQzMzYtLjAwNzMtLjc2MjY3IDEuMzM4NC0uNzE4NjcgMS44NDQ0LTEuMDYzMzQtLjMzMzctLjA0NzY2LTEuMTYyNC0uNzk1NjYtMS41MjktLjgzMjMzIDIuMjg4My0uMzkyNDQgNC42NDIzLS4wMjEzOCA2LjY5OSAxLjA1NiAxLjA0ODYuNTYxIDEuNzg5MyAxLjE2MjMzIDIuMjQ3NiAxLjc5MzAzIDEuMTk1NC4yMjczIDIuMjUxNC42NiAyLjk0MDcgMS4zNDkzIDIuMTE5MyAyLjExNTcgNC4wMTEzIDYuOTUyIDMuMjE5MyA5LjczMTMtLjIyMzYuNzctLjczMzMgMS4zMzEtMS4zNzEzIDEuNzk2Ny0xLjIzOTMuOTAyLTEuMDE5My0xLjA0NS00LjEwMy45NzE3LS4zOTk3LjI2MDMtLjM5OTcgMi4yMjU2LS41MjQzIDIuNzA2eiIgZmlsbD0iI2ZmZiIvPjwvZz48ZyBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PHBhdGggZD0ibTE2LjY3MjQgMjAuMzU0Yy43Njc1IDAgMS4zODk2LS42MjIxIDEuMzg5Ni0xLjM4OTZzLS42MjIxLTEuMzg5Ny0xLjM4OTYtMS4zODk3LTEuMzg5Ny42MjIyLTEuMzg5NyAxLjM4OTcuNjIyMiAxLjM4OTYgMS4zODk3IDEuMzg5NnoiIGZpbGw9IiMyZDRmOGUiLz48cGF0aCBkPSJtMTcuMjkyNCAxOC44NjE3Yy4xOTg1IDAgLjM1OTQtLjE2MDguMzU5NC0uMzU5M3MtLjE2MDktLjM1OTMtLjM1OTQtLjM1OTNjLS4xOTg0IDAtLjM1OTMuMTYwOC0uMzU5My4zNTkzcy4xNjA5LjM1OTMuMzU5My4zNTkzeiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Im0yNS45NTY4IDE5LjMzMTFjLjY1ODEgMCAxLjE5MTctLjUzMzUgMS4xOTE3LTEuMTkxNyAwLS42NTgxLS41MzM2LTEuMTkxNi0xLjE5MTctMS4xOTE2cy0xLjE5MTcuNTMzNS0xLjE5MTcgMS4xOTE2YzAgLjY1ODIuNTMzNiAxLjE5MTcgMS4xOTE3IDEuMTkxN3oiIGZpbGw9IiMyZDRmOGUiLz48cGF0aCBkPSJtMjYuNDg4MiAxOC4wNTExYy4xNzAxIDAgLjMwOC0uMTM3OS4zMDgtLjMwOHMtLjEzNzktLjMwOC0uMzA4LS4zMDgtLjMwOC4xMzc5LS4zMDguMzA4LjEzNzkuMzA4LjMwOC4zMDh6IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0ibTE3LjA3MiAxNC45NDJzLTEuMDQ4Ni0uNDc2Ni0yLjA2NDMuMTY1Yy0xLjAxNTcuNjM4LS45NzkgMS4yOTA3LS45NzkgMS4yOTA3cy0uNTM5LTEuMjAyNy44OTgzLTEuNzkzYzEuNDQxLS41ODY3IDIuMTQ1LjMzNzMgMi4xNDUuMzM3M3oiIGZpbGw9InVybCgjYikiLz48cGF0aCBkPSJtMjYuNjc1MiAxNC44NDY3cy0uNzUxNy0uNDI5LTEuMzM4My0uNDIxN2MtMS4xOTkuMDE0Ny0xLjUyNTQuNTQyNy0xLjUyNTQuNTQyN3MuMjAxNy0xLjI2MTQgMS43MzQ0LTEuMDA4NGMuNDk5Ny4wOTE0LjkyMjMuNDIzNCAxLjEyOTMuODg3NHoiIGZpbGw9InVybCgjYykiLz48cGF0aCBkPSJtMjAuOTI1OCAyNC4zMjFjLjEzOTMtLjg0MzMgMi4zMS0yLjQzMSAzLjg1LTIuNTMgMS41NC0uMDk1MyAyLjAxNjctLjA3MzMgMy4zLS4zODEzIDEuMjg3LS4zMDQzIDQuNTk4LTEuMTI5MyA1LjUxMS0xLjU1NDcuOTE2Ny0uNDIxNiA0LjgwMzMuMjA5IDIuMDY0MyAxLjczOC0xLjE4NDMuNjYzNy00LjM3OCAxLjg4MS02LjY2MjMgMi41NjMtMi4yODA3LjY4Mi0zLjY2My0uNjUyNi00LjQyMi40Njk0LS42MDEzLjg5MS0uMTIxIDIuMTEyIDIuNjAzMyAyLjM2NSAzLjY4MTQuMzQxIDcuMjA4Ny0xLjY1NzQgNy41OTc0LS41OTQuMzg4NiAxLjA2MzMtMy4xNjA3IDIuMzgzMy01LjMyNCAyLjQyNzMtMi4xNjM0LjA0MDMtNi41MTk0LTEuNDMtNy4xNzItMS44ODQ3LS42NTY0LS40NTEtMS41MjU0LTEuNTE0My0xLjM0NTctMi42MTh6IiBmaWxsPSIjZmRkMjBhIi8+PHBhdGggZD0ibTI4Ljg4MjUgMzEuODM4NmMtLjc3NzMtLjE3MjQtNC4zMTIgMi41MDA2LTQuMzEyIDIuNTAwNmguMDAzN2wtLjE2NSAyLjA1MzRzNC4wNDA2IDEuNjUzNiA0LjczIDEuMzk3Yy42ODkzLS4yNjQuNTE3LTUuNzc1LS4yNTY3LTUuOTUxem0tMTEuNTQ2MyAxLjAzNGMuMDg0My0xLjExODQgNS4yNTQzIDEuNjQyNiA1LjI1NDMgMS42NDI2bC4wMDM3LS4wMDM2LjI1NjYgMi4xNTZzLTQuMzA4MyAyLjU4MTMtNC45MTMzIDIuMjM2NmMtLjYwMTMtLjM0NDYtLjY4OTMtNC45MDk2LS42MDEzLTYuMDMxNnoiIGZpbGw9IiM2NWJjNDYiLz48cGF0aCBkPSJtMjEuMzQgMzQuODA0OWMwIDEuODA3Ny0uMjYwNCAyLjU4NS41MTMzIDIuNzU3NC43NzczLjE3MjMgMi4yNDAzIDAgMi43NjEtLjM0NDcuNTEzMy0uMzQ0Ny4wODQzLTIuNjY5My0uMDg4LTMuMTAycy0zLjE5LS4wODgtMy4xOS42ODkzeiIgZmlsbD0iIzQzYTI0NCIvPjxwYXRoIGQ9Im0yMS42NzAxIDM0LjQwNTFjMCAxLjgwNzYtLjI2MDQgMi41ODEzLjUxMzMgMi43NTM2Ljc3MzcuMTc2IDIuMjM2NyAwIDIuNzU3My0uMzQ0Ni41MTctLjM0NDcuMDg4LTIuNjY5NC0uMDg0My0zLjEwMi0uMTcyMy0uNDMyNy0zLjE5LS4wODQ0LTMuMTkuNjg5M3oiIGZpbGw9IiM2NWJjNDYiLz48cGF0aCBkPSJtMjIuMDAwMiA0MC40NDgxYzEwLjE4ODUgMCAxOC40NDc5LTguMjU5NCAxOC40NDc5LTE4LjQ0NzlzLTguMjU5NC0xOC40NDc5NS0xOC40NDc5LTE4LjQ0Nzk1LTE4LjQ0Nzk1IDguMjU5NDUtMTguNDQ3OTUgMTguNDQ3OTUgOC4yNTk0NSAxOC40NDc5IDE4LjQ0Nzk1IDE4LjQ0Nzl6bTAgMS43MTg3YzExLjEzNzcgMCAyMC4xNjY2LTkuMDI4OSAyMC4xNjY2LTIwLjE2NjYgMC0xMS4xMzc4LTkuMDI4OS0yMC4xNjY3LTIwLjE2NjYtMjAuMTY2Ny0xMS4xMzc4IDAtMjAuMTY2NyA5LjAyODktMjAuMTY2NyAyMC4xNjY3IDAgMTEuMTM3NyA5LjAyODkgMjAuMTY2NiAyMC4xNjY3IDIwLjE2NjZ6IiBmaWxsPSIjZmZmIi8+PC9nPjwvc3ZnPg==');\n}\n\n/* Email tooltip specific */\n.tooltip__button--email {\n    flex-direction: column;\n    justify-content: center;\n    align-items: flex-start;\n    font-size: 14px;\n    padding: 4px 8px;\n}\n.tooltip__button--email__primary-text {\n    font-weight: bold;\n}\n.tooltip__button--email__secondary-text {\n    font-size: 12px;\n}\n";
exports.CSS_STYLES = CSS_STYLES;

},{}],59:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buttonMatchesFormType = exports.autofillEnabled = exports.addInlineStyles = exports.SIGN_IN_MSG = exports.ADDRESS_DOMAIN = void 0;
exports.escapeXML = escapeXML;
exports.setValue = exports.sendAndWaitForAnswer = exports.safeExecute = exports.removeInlineStyles = exports.notifyWebApp = exports.isVisible = exports.isLikelyASubmitButton = exports.isEventWithinDax = exports.isAutofillEnabledFromProcessedConfig = exports.getText = exports.getDaxBoundingBox = exports.formatDuckAddress = void 0;

var _matching = require("./Form/matching.js");

const SIGN_IN_MSG = {
  signMeIn: true
}; // Send a message to the web app (only on DDG domains)

exports.SIGN_IN_MSG = SIGN_IN_MSG;

const notifyWebApp = message => {
  window.postMessage(message, window.origin);
};
/**
 * Sends a message and returns a Promise that resolves with the response
 * @param {{} | Function} msgOrFn - a fn to call or an object to send via postMessage
 * @param {String} expectedResponse - the name of the response
 * @returns {Promise<*>}
 */


exports.notifyWebApp = notifyWebApp;

const sendAndWaitForAnswer = (msgOrFn, expectedResponse) => {
  if (typeof msgOrFn === 'function') {
    msgOrFn();
  } else {
    window.postMessage(msgOrFn, window.origin);
  }

  return new Promise(resolve => {
    const handler = e => {
      if (e.origin !== window.origin) return;
      if (!e.data || e.data && !(e.data[expectedResponse] || e.data.type === expectedResponse)) return;
      resolve(e.data);
      window.removeEventListener('message', handler);
    };

    window.addEventListener('message', handler);
  });
};
/**
 * @param {Pick<GlobalConfig, 'contentScope' | 'userUnprotectedDomains' | 'userPreferences'>} globalConfig
 * @param [processConfig]
 * @return {boolean}
 */


exports.sendAndWaitForAnswer = sendAndWaitForAnswer;

const autofillEnabled = (globalConfig, processConfig) => {
  if (!globalConfig.contentScope) {
    // Return enabled for platforms that haven't implemented the config yet
    return true;
  }

  const {
    contentScope,
    userUnprotectedDomains,
    userPreferences
  } = globalConfig; // Check config on Apple platforms

  const processedConfig = processConfig(contentScope, userUnprotectedDomains, userPreferences);
  return isAutofillEnabledFromProcessedConfig(processedConfig);
};

exports.autofillEnabled = autofillEnabled;

const isAutofillEnabledFromProcessedConfig = processedConfig => {
  const site = processedConfig.site;

  if (site.isBroken || !site.enabledFeatures.includes('autofill')) {
    return false;
  }

  return true;
}; // Access the original setter (needed to bypass React's implementation on mobile)
// @ts-ignore


exports.isAutofillEnabledFromProcessedConfig = isAutofillEnabledFromProcessedConfig;
const originalSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
/**
 * Ensures the value is set properly and dispatches events to simulate real user action
 * @param {HTMLInputElement} el
 * @param {string} val
 * @param {GlobalConfig} [config]
 * @return {boolean}
 */

const setValueForInput = (el, val, config) => {
  // Avoid keyboard flashing on Android
  if (!(config !== null && config !== void 0 && config.isAndroid)) {
    el.focus();
  } // todo(Shane): Not sending a 'key' property on these events can cause exceptions on 3rd party listeners that expect it


  el.dispatchEvent(new Event('keydown', {
    bubbles: true
  }));
  originalSet === null || originalSet === void 0 ? void 0 : originalSet.call(el, val);
  const events = [new Event('input', {
    bubbles: true
  }), // todo(Shane): Not sending a 'key' property on these events can cause exceptions on 3rd party listeners that expect it
  new Event('keyup', {
    bubbles: true
  }), new Event('change', {
    bubbles: true
  })];
  events.forEach(ev => el.dispatchEvent(ev)); // We call this again to make sure all forms are happy

  originalSet === null || originalSet === void 0 ? void 0 : originalSet.call(el, val);
  events.forEach(ev => el.dispatchEvent(ev));
  el.blur();
  return true;
};
/**
 * Fires events on a select element to simulate user interaction
 * @param {HTMLSelectElement} el
 */


const fireEventsOnSelect = el => {
  /** @type {Event[]} */
  const events = [new Event('mousedown', {
    bubbles: true
  }), new Event('mouseup', {
    bubbles: true
  }), new Event('click', {
    bubbles: true
  }), new Event('change', {
    bubbles: true
  })]; // Events fire on the select el, not option

  events.forEach(ev => el.dispatchEvent(ev));
  events.forEach(ev => el.dispatchEvent(ev));
  el.blur();
};
/**
 * Selects an option of a select element
 * We assume Select is only used for dates, i.e. in the credit card
 * @param {HTMLSelectElement} el
 * @param {string} val
 * @return {boolean}
 */


const setValueForSelect = (el, val) => {
  const subtype = (0, _matching.getInputSubtype)(el);
  const isMonth = subtype.includes('Month');
  const isZeroBasedNumber = isMonth && el.options[0].value === '0' && el.options.length === 12; // Loop first through all values because they tend to be more precise

  for (const option of el.options) {
    // If values for months are zero-based (Jan === 0), add one to match our data type
    let value = option.value;

    if (isZeroBasedNumber) {
      value = "".concat(Number(value) + 1);
    } // TODO: try to match localised month names
    // TODO: implement alternative versions of values (abbreviations for States/Provinces or variations like USA, US, United States, etc.)


    if (value === String(val)) {
      if (option.selected) return false;
      option.selected = true;
      fireEventsOnSelect(el);
      return true;
    }
  }

  for (const option of el.options) {
    if (option.innerText === String(val)) {
      if (option.selected) return false;
      option.selected = true;
      fireEventsOnSelect(el);
      return true;
    }
  } // If we didn't find a matching option return false


  return false;
};
/**
 * Sets or selects a value to a form element
 * @param {HTMLInputElement | HTMLSelectElement} el
 * @param {string} val
 * @param {GlobalConfig} [config]
 * @return {boolean}
 */


const setValue = (el, val, config) => {
  if (el instanceof HTMLInputElement) return setValueForInput(el, val, config);
  if (el instanceof HTMLSelectElement) return setValueForSelect(el, val);
  return false;
};
/**
 * Use IntersectionObserver v2 to make sure the element is visible when clicked
 * https://developers.google.com/web/updates/2019/02/intersectionobserver-v2
 */


exports.setValue = setValue;

const safeExecute = function (el, fn) {
  let opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const {
    checkVisibility = true
  } = opts;
  const intObs = new IntersectionObserver(changes => {
    for (const change of changes) {
      // Feature detection
      if (typeof change.isVisible === 'undefined') {
        // The browser doesn't support Intersection Observer v2, falling back to v1 behavior.
        change.isVisible = true;
      }

      if (change.isIntersecting) {
        /**
         * If 'checkVisibility' is 'false' (like on Windows), then we always execute the function
         * During testing it was found that windows does not `change.isVisible` properly.
         */
        if (!checkVisibility || change.isVisible) {
          fn();
        }
      }
    }

    intObs.disconnect();
  }, {
    trackVisibility: true,
    delay: 100
  });
  intObs.observe(el);
};
/**
 * Checks that an element is potentially viewable (even if off-screen)
 * @param {HTMLElement} el
 * @return {boolean}
 */


exports.safeExecute = safeExecute;

const isVisible = el => {
  const computedStyle = window.getComputedStyle(el);
  const opacity = parseFloat(computedStyle.getPropertyValue('opacity') || '1');
  const visibility = computedStyle.getPropertyValue('visibility');
  return el.clientWidth !== 0 && el.clientHeight !== 0 && opacity > 0 && visibility !== 'hidden';
};
/**
 * Gets the bounding box of the icon
 * @param {HTMLInputElement} input
 * @returns {{top: number, left: number, bottom: number, width: number, x: number, y: number, right: number, height: number}}
 */


exports.isVisible = isVisible;

const getDaxBoundingBox = input => {
  const {
    right: inputRight,
    top: inputTop,
    height: inputHeight
  } = input.getBoundingClientRect();
  const inputRightPadding = parseInt(getComputedStyle(input).paddingRight);
  const width = 30;
  const height = 30;
  const top = inputTop + (inputHeight - height) / 2;
  const right = inputRight - inputRightPadding;
  const left = right - width;
  const bottom = top + height;
  return {
    bottom,
    height,
    left,
    right,
    top,
    width,
    x: left,
    y: top
  };
};
/**
 * Check if a mouse event is within the icon
 * @param {MouseEvent} e
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */


exports.getDaxBoundingBox = getDaxBoundingBox;

const isEventWithinDax = (e, input) => {
  const {
    left,
    right,
    top,
    bottom
  } = getDaxBoundingBox(input);
  const withinX = e.clientX >= left && e.clientX <= right;
  const withinY = e.clientY >= top && e.clientY <= bottom;
  return withinX && withinY;
};
/**
 * Adds inline styles from a prop:value object
 * @param {HTMLElement} el
 * @param {Object<string, string>} styles
 */


exports.isEventWithinDax = isEventWithinDax;

const addInlineStyles = (el, styles) => Object.entries(styles).forEach(_ref => {
  let [property, val] = _ref;
  return el.style.setProperty(property, val, 'important');
});
/**
 * Removes inline styles from a prop:value object
 * @param {HTMLElement} el
 * @param {Object<string, string>} styles
 */


exports.addInlineStyles = addInlineStyles;

const removeInlineStyles = (el, styles) => Object.keys(styles).forEach(property => el.style.removeProperty(property));

exports.removeInlineStyles = removeInlineStyles;
const ADDRESS_DOMAIN = '@duck.com';
/**
 * Given a username, returns the full email address
 * @param {string} address
 * @returns {string}
 */

exports.ADDRESS_DOMAIN = ADDRESS_DOMAIN;

const formatDuckAddress = address => address + ADDRESS_DOMAIN;
/**
 * Escapes any occurrences of &, ", <, > or / with XML entities.
 * @param {string} str The string to escape.
 * @return {string} The escaped string.
 */


exports.formatDuckAddress = formatDuckAddress;

function escapeXML(str) {
  const replacements = {
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
    '<': '&lt;',
    '>': '&gt;',
    '/': '&#x2F;'
  };
  return String(str).replace(/[&"'<>/]/g, m => replacements[m]);
}

const SUBMIT_BUTTON_REGEX = /submit|send|confirm|save|continue|next|sign|log.?([io])n|buy|purchase|check.?out|subscribe|donate/i;
const SUBMIT_BUTTON_UNLIKELY_REGEX = /facebook|twitter|google|apple|cancel|password|show|toggle|reveal|hide|print/i;
/**
 * Determines if an element is likely to be a submit button
 * @param {HTMLElement} el A button, input, anchor or other element with role=button
 * @return {boolean}
 */

const isLikelyASubmitButton = el => {
  const text = el.textContent || '';
  const ariaLabel = el.getAttribute('aria-label') || '';
  const title = el.title || '';
  const value = el instanceof HTMLInputElement ? el.value || '' : '';
  const contentExcludingLabel = text + ' ' + title + ' ' + value;
  return (el.getAttribute('type') === 'submit' || // is explicitly set as "submit"
  /primary|submit/i.test(el.className) || // has high-signal submit classes
  SUBMIT_BUTTON_REGEX.test(contentExcludingLabel) || // has high-signal text
  el.offsetHeight * el.offsetWidth >= 10000 && !/secondary/i.test(el.className) // it's a large element 250x40px
  ) && el.offsetHeight * el.offsetWidth >= 2000 && // it's not a very small button like inline links and such
  !SUBMIT_BUTTON_UNLIKELY_REGEX.test(contentExcludingLabel + ' ' + ariaLabel);
};
/**
 * Check that a button matches the form type - login buttons on a login form, signup buttons on a signup form
 * @param {HTMLElement} el
 * @param {import('./Form/Form').Form} formObj
 */


exports.isLikelyASubmitButton = isLikelyASubmitButton;

const buttonMatchesFormType = (el, formObj) => {
  if (formObj.isLogin) {
    return !/sign.?up|register|join/i.test(el.textContent || '');
  } else if (formObj.isSignup) {
    return !/(log|sign).?([io])n/i.test(el.textContent || '');
  } else {
    return true;
  }
};
/**
 * Get the text of an element
 * @param {Element} el
 * @returns {string}
 */


exports.buttonMatchesFormType = buttonMatchesFormType;

const getText = el => {
  // for buttons, we don't care about descendants, just get the whole text as is
  // this is important in order to give proper attribution of the text to the button
  if (el instanceof HTMLButtonElement) return (0, _matching.removeExcessWhitespace)(el.textContent);
  if (el instanceof HTMLInputElement && ['submit', 'button'].includes(el.type)) return el.value;
  return (0, _matching.removeExcessWhitespace)(Array.from(el.childNodes).reduce((text, child) => child instanceof Text ? text + ' ' + child.textContent : text, ''));
};

exports.getText = getText;

},{"./Form/matching.js":41}],60:[function(require,module,exports){
"use strict";

require("./requestIdleCallback.js");

var _DeviceInterface = require("./DeviceInterface.js");

// Polyfills/shims
(() => {
  if (!window.isSecureContext) return false;

  try {
    const startupAutofill = () => {
      if (document.visibilityState === 'visible') {
        const deviceInterface = (0, _DeviceInterface.createDevice)();
        deviceInterface.init();
      } else {
        document.addEventListener('visibilitychange', startupAutofill, {
          once: true
        });
      }
    };

    startupAutofill();
  } catch (e) {
    console.error(e); // Noop, we errored
  }
})();

},{"./DeviceInterface.js":22,"./requestIdleCallback.js":71}],61:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DDG_DOMAIN_REGEX = void 0;
exports.createGlobalConfig = createGlobalConfig;
const DDG_DOMAIN_REGEX = new RegExp(/^https:\/\/(([a-z0-9-_]+?)\.)?duckduckgo\.com\/email/);
/**
 * This is a centralised place to contain all string/variable replacements
 *
 * @param {Partial<GlobalConfig>} [overrides]
 * @returns {GlobalConfig}
 */

exports.DDG_DOMAIN_REGEX = DDG_DOMAIN_REGEX;

function createGlobalConfig(overrides) {
  let isApp = false;
  let isTopFrame = false;
  let supportsTopFrame = false; // Do not remove -- Apple devices change this when they support modern webkit messaging

  let hasModernWebkitAPI = false; // INJECT isApp HERE
  // INJECT isTopFrame HERE
  // INJECT supportsTopFrame HERE
  // INJECT hasModernWebkitAPI HERE

  let isWindows = false; // INJECT isWindows HERE
  // This will be used when 'hasModernWebkitAPI' is false

  /** @type {string[]} */

  let webkitMessageHandlerNames = []; // INJECT webkitMessageHandlerNames HERE

  let isDDGTestMode = false; isDDGTestMode = true;

  let contentScope = null;
  let userUnprotectedDomains = null;
  /** @type {Record<string, any> | null} */

  let userPreferences = null; // INJECT contentScope HERE
  // INJECT userUnprotectedDomains HERE
  // INJECT userPreferences HERE

  /** @type {Record<string, any> | null} */

  let availableInputTypes = null; // INJECT availableInputTypes HERE
  // The native layer will inject a randomised secret here and use it to verify the origin

  let secret = 'PLACEHOLDER_SECRET';
  /**
   * The user agent check will not be needed here once `android` supports `userPreferences?.platform.name`
   */
  // @ts-ignore

  const isAndroid = (userPreferences === null || userPreferences === void 0 ? void 0 : userPreferences.platform.name) === 'android' || /Android.*DuckDuckGo\/\d/i.test(window.navigator.userAgent); // @ts-ignore

  const isDDGApp = ['ios', 'android', 'macos', 'windows'].includes(userPreferences === null || userPreferences === void 0 ? void 0 : userPreferences.platform.name) || isAndroid; // @ts-ignore

  const isMobileApp = ['ios', 'android'].includes(userPreferences === null || userPreferences === void 0 ? void 0 : userPreferences.platform.name) || isAndroid;
  const isFirefox = navigator.userAgent.includes('Firefox');
  const isDDGDomain = Boolean(window.location.href.match(DDG_DOMAIN_REGEX));
  const config = {
    isApp,
    isDDGApp,
    isAndroid,
    isFirefox,
    isMobileApp,
    isTopFrame,
    isWindows,
    secret,
    supportsTopFrame,
    hasModernWebkitAPI,
    contentScope,
    userUnprotectedDomains,
    userPreferences,
    isDDGTestMode,
    isDDGDomain,
    availableInputTypes,
    webkitMessageHandlerNames,
    ...overrides
  };
  return config;
}

},{}],62:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.constants = void 0;
const constants = {
  ATTR_INPUT_TYPE: 'data-ddg-inputType',
  ATTR_AUTOFILL: 'data-ddg-autofill',
  TEXT_LENGTH_CUTOFF: 50
};
exports.constants = constants;

},{}],63:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StoreFormDataCall = exports.SetSizeCall = exports.SendJSPixelCall = exports.SelectedDetailCall = exports.GetRuntimeConfigurationCall = exports.GetAvailableInputTypesCall = exports.GetAutofillInitDataCall = exports.GetAutofillDataCall = exports.GetAutofillCredentialsCall = exports.CloseAutofillParentCall = exports.CheckCredentialsProviderStatusCall = exports.AskToUnlockProviderCall = void 0;

var _validatorsZod = require("./validators.zod.js");

var _deviceApi = require("../../../packages/device-api");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @extends {DeviceApiCall<getAutofillDataRequestSchema, getAutofillDataResponseSchema>} 
 */
class GetAutofillDataCall extends _deviceApi.DeviceApiCall {
  constructor() {
    super(...arguments);

    _defineProperty(this, "method", "getAutofillData");

    _defineProperty(this, "id", "getAutofillDataResponse");

    _defineProperty(this, "paramsValidator", _validatorsZod.getAutofillDataRequestSchema);

    _defineProperty(this, "resultValidator", _validatorsZod.getAutofillDataResponseSchema);
  }

}
/**
 * @extends {DeviceApiCall<any, getRuntimeConfigurationResponseSchema>} 
 */


exports.GetAutofillDataCall = GetAutofillDataCall;

class GetRuntimeConfigurationCall extends _deviceApi.DeviceApiCall {
  constructor() {
    super(...arguments);

    _defineProperty(this, "method", "getRuntimeConfiguration");

    _defineProperty(this, "id", "getRuntimeConfigurationResponse");

    _defineProperty(this, "resultValidator", _validatorsZod.getRuntimeConfigurationResponseSchema);
  }

}
/**
 * @extends {DeviceApiCall<storeFormDataSchema, any>} 
 */


exports.GetRuntimeConfigurationCall = GetRuntimeConfigurationCall;

class StoreFormDataCall extends _deviceApi.DeviceApiCall {
  constructor() {
    super(...arguments);

    _defineProperty(this, "method", "storeFormData");

    _defineProperty(this, "paramsValidator", _validatorsZod.storeFormDataSchema);
  }

}
/**
 * @extends {DeviceApiCall<any, getAvailableInputTypesResultSchema>} 
 */


exports.StoreFormDataCall = StoreFormDataCall;

class GetAvailableInputTypesCall extends _deviceApi.DeviceApiCall {
  constructor() {
    super(...arguments);

    _defineProperty(this, "method", "getAvailableInputTypes");

    _defineProperty(this, "id", "getAvailableInputTypesResponse");

    _defineProperty(this, "resultValidator", _validatorsZod.getAvailableInputTypesResultSchema);
  }

}
/**
 * @extends {DeviceApiCall<any, getAutofillInitDataResponseSchema>} 
 */


exports.GetAvailableInputTypesCall = GetAvailableInputTypesCall;

class GetAutofillInitDataCall extends _deviceApi.DeviceApiCall {
  constructor() {
    super(...arguments);

    _defineProperty(this, "method", "getAutofillInitData");

    _defineProperty(this, "id", "getAutofillInitDataResponse");

    _defineProperty(this, "resultValidator", _validatorsZod.getAutofillInitDataResponseSchema);
  }

}
/**
 * @extends {DeviceApiCall<getAutofillCredentialsParamsSchema, getAutofillCredentialsResultSchema>} 
 */


exports.GetAutofillInitDataCall = GetAutofillInitDataCall;

class GetAutofillCredentialsCall extends _deviceApi.DeviceApiCall {
  constructor() {
    super(...arguments);

    _defineProperty(this, "method", "getAutofillCredentials");

    _defineProperty(this, "id", "getAutofillCredentialsResponse");

    _defineProperty(this, "paramsValidator", _validatorsZod.getAutofillCredentialsParamsSchema);

    _defineProperty(this, "resultValidator", _validatorsZod.getAutofillCredentialsResultSchema);
  }

}
/**
 * @extends {DeviceApiCall<setSizeParamsSchema, any>} 
 */


exports.GetAutofillCredentialsCall = GetAutofillCredentialsCall;

class SetSizeCall extends _deviceApi.DeviceApiCall {
  constructor() {
    super(...arguments);

    _defineProperty(this, "method", "setSize");

    _defineProperty(this, "paramsValidator", _validatorsZod.setSizeParamsSchema);
  }

}
/**
 * @extends {DeviceApiCall<selectedDetailParamsSchema, any>} 
 */


exports.SetSizeCall = SetSizeCall;

class SelectedDetailCall extends _deviceApi.DeviceApiCall {
  constructor() {
    super(...arguments);

    _defineProperty(this, "method", "selectedDetail");

    _defineProperty(this, "paramsValidator", _validatorsZod.selectedDetailParamsSchema);
  }

}
/**
 * @extends {DeviceApiCall<any, any>} 
 */


exports.SelectedDetailCall = SelectedDetailCall;

class CloseAutofillParentCall extends _deviceApi.DeviceApiCall {
  constructor() {
    super(...arguments);

    _defineProperty(this, "method", "closeAutofillParent");
  }

}
/**
 * @extends {DeviceApiCall<any, askToUnlockProviderResultSchema>} 
 */


exports.CloseAutofillParentCall = CloseAutofillParentCall;

class AskToUnlockProviderCall extends _deviceApi.DeviceApiCall {
  constructor() {
    super(...arguments);

    _defineProperty(this, "method", "askToUnlockProvider");

    _defineProperty(this, "id", "askToUnlockProviderResponse");

    _defineProperty(this, "resultValidator", _validatorsZod.askToUnlockProviderResultSchema);
  }

}
/**
 * @extends {DeviceApiCall<any, checkCredentialsProviderStatusResultSchema>} 
 */


exports.AskToUnlockProviderCall = AskToUnlockProviderCall;

class CheckCredentialsProviderStatusCall extends _deviceApi.DeviceApiCall {
  constructor() {
    super(...arguments);

    _defineProperty(this, "method", "checkCredentialsProviderStatus");

    _defineProperty(this, "id", "checkCredentialsProviderStatusResponse");

    _defineProperty(this, "resultValidator", _validatorsZod.checkCredentialsProviderStatusResultSchema);
  }

}
/**
 * @extends {DeviceApiCall<sendJSPixelParamsSchema, any>} 
 */


exports.CheckCredentialsProviderStatusCall = CheckCredentialsProviderStatusCall;

class SendJSPixelCall extends _deviceApi.DeviceApiCall {
  constructor() {
    super(...arguments);

    _defineProperty(this, "method", "sendJSPixel");

    _defineProperty(this, "paramsValidator", _validatorsZod.sendJSPixelParamsSchema);
  }

}

exports.SendJSPixelCall = SendJSPixelCall;

},{"../../../packages/device-api":14,"./validators.zod.js":64}],64:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.userPreferencesSchema = exports.triggerContextSchema = exports.storeFormDataSchema = exports.setSizeParamsSchema = exports.sendJSPixelParamsSchema = exports.selectedDetailParamsSchema = exports.runtimeConfigurationSchema = exports.providerStatusUpdatedSchema = exports.outgoingCredentialsSchema = exports.getRuntimeConfigurationResponseSchema = exports.getAvailableInputTypesResultSchema = exports.getAutofillInitDataResponseSchema = exports.getAutofillDataResponseSchema = exports.getAutofillDataRequestSchema = exports.getAutofillCredentialsResultSchema = exports.getAutofillCredentialsParamsSchema = exports.getAliasResultSchema = exports.getAliasParamsSchema = exports.genericErrorSchema = exports.credentialsSchema = exports.contentScopeSchema = exports.contentScopeFeaturesSchema = exports.contentScopeFeaturesItemSettingsSchema = exports.checkCredentialsProviderStatusResultSchema = exports.availableInputTypesSchema = exports.autofillSettingsSchema = exports.autofillFeatureTogglesSchema = exports.askToUnlockProviderResultSchema = void 0;

var _zod = require("zod");

/* DO NOT EDIT, this file was generated by scripts/api-call-generator.js */
// Generated by ts-to-zod
const credentialsSchema = _zod.z.object({
  id: _zod.z.string().optional(),
  username: _zod.z.string(),
  password: _zod.z.string(),
  credentialsProvider: _zod.z.union([_zod.z.literal("duckduckgo"), _zod.z.literal("bitwarden")]).optional(),
  providerStatus: _zod.z.union([_zod.z.literal("locked"), _zod.z.literal("unlocked")]).optional()
});

exports.credentialsSchema = credentialsSchema;

const availableInputTypesSchema = _zod.z.object({
  credentials: _zod.z.object({
    username: _zod.z.boolean().optional(),
    password: _zod.z.boolean().optional()
  }).optional(),
  identities: _zod.z.object({
    firstName: _zod.z.boolean().optional(),
    middleName: _zod.z.boolean().optional(),
    lastName: _zod.z.boolean().optional(),
    birthdayDay: _zod.z.boolean().optional(),
    birthdayMonth: _zod.z.boolean().optional(),
    birthdayYear: _zod.z.boolean().optional(),
    addressStreet: _zod.z.boolean().optional(),
    addressStreet2: _zod.z.boolean().optional(),
    addressCity: _zod.z.boolean().optional(),
    addressProvince: _zod.z.boolean().optional(),
    addressPostalCode: _zod.z.boolean().optional(),
    addressCountryCode: _zod.z.boolean().optional(),
    phone: _zod.z.boolean().optional(),
    emailAddress: _zod.z.boolean().optional()
  }).optional(),
  creditCards: _zod.z.object({
    cardName: _zod.z.boolean().optional(),
    cardSecurityCode: _zod.z.boolean().optional(),
    expirationMonth: _zod.z.boolean().optional(),
    expirationYear: _zod.z.boolean().optional(),
    cardNumber: _zod.z.boolean().optional()
  }).optional(),
  email: _zod.z.boolean().optional(),
  credentialsProviderStatus: _zod.z.union([_zod.z.literal("locked"), _zod.z.literal("unlocked")]).optional()
});

exports.availableInputTypesSchema = availableInputTypesSchema;

const genericErrorSchema = _zod.z.object({
  message: _zod.z.string()
});

exports.genericErrorSchema = genericErrorSchema;

const autofillFeatureTogglesSchema = _zod.z.object({
  inputType_credentials: _zod.z.boolean().optional(),
  inputType_identities: _zod.z.boolean().optional(),
  inputType_creditCards: _zod.z.boolean().optional(),
  emailProtection: _zod.z.boolean().optional(),
  password_generation: _zod.z.boolean().optional(),
  credentials_saving: _zod.z.boolean().optional(),
  inlineIcon_credentials: _zod.z.boolean().optional(),
  third_party_credentials_provider: _zod.z.boolean().optional()
});

exports.autofillFeatureTogglesSchema = autofillFeatureTogglesSchema;

const providerStatusUpdatedSchema = _zod.z.object({
  status: _zod.z.union([_zod.z.literal("locked"), _zod.z.literal("unlocked")]),
  credentials: _zod.z.array(credentialsSchema),
  availableInputTypes: availableInputTypesSchema
});

exports.providerStatusUpdatedSchema = providerStatusUpdatedSchema;

const getAliasParamsSchema = _zod.z.object({
  requiresUserPermission: _zod.z.boolean(),
  shouldConsumeAliasIfProvided: _zod.z.boolean()
});

exports.getAliasParamsSchema = getAliasParamsSchema;

const getAliasResultSchema = _zod.z.object({
  success: _zod.z.object({
    alias: _zod.z.string()
  })
});

exports.getAliasResultSchema = getAliasResultSchema;

const getAutofillCredentialsParamsSchema = _zod.z.object({
  id: _zod.z.string()
});

exports.getAutofillCredentialsParamsSchema = getAutofillCredentialsParamsSchema;

const getAutofillCredentialsResultSchema = _zod.z.object({
  type: _zod.z.literal("getAutofillCredentialsResponse").optional(),
  success: _zod.z.object({
    id: _zod.z.string().optional(),
    autogenerated: _zod.z.boolean().optional(),
    username: _zod.z.string(),
    password: _zod.z.string().optional()
  }).optional(),
  error: genericErrorSchema.optional()
});

exports.getAutofillCredentialsResultSchema = getAutofillCredentialsResultSchema;

const triggerContextSchema = _zod.z.object({
  inputTop: _zod.z.number(),
  inputLeft: _zod.z.number(),
  inputHeight: _zod.z.number(),
  inputWidth: _zod.z.number(),
  wasFromClick: _zod.z.boolean()
});

exports.triggerContextSchema = triggerContextSchema;

const getAutofillDataResponseSchema = _zod.z.object({
  type: _zod.z.literal("getAutofillDataResponse").optional(),
  success: _zod.z.object({
    credentials: credentialsSchema.optional(),
    action: _zod.z.union([_zod.z.literal("fill"), _zod.z.literal("focus"), _zod.z.literal("none")])
  }).optional(),
  error: genericErrorSchema.optional()
});

exports.getAutofillDataResponseSchema = getAutofillDataResponseSchema;

const getAutofillInitDataResponseSchema = _zod.z.object({
  type: _zod.z.literal("getAutofillInitDataResponse").optional(),
  success: _zod.z.object({
    credentials: _zod.z.array(credentialsSchema),
    identities: _zod.z.array(_zod.z.record(_zod.z.unknown())),
    creditCards: _zod.z.array(_zod.z.record(_zod.z.unknown())),
    serializedInputContext: _zod.z.string()
  }).optional(),
  error: genericErrorSchema.optional()
});

exports.getAutofillInitDataResponseSchema = getAutofillInitDataResponseSchema;

const getAvailableInputTypesResultSchema = _zod.z.object({
  type: _zod.z.literal("getAvailableInputTypesResponse").optional(),
  success: availableInputTypesSchema,
  error: genericErrorSchema.optional()
});

exports.getAvailableInputTypesResultSchema = getAvailableInputTypesResultSchema;

const contentScopeFeaturesItemSettingsSchema = _zod.z.record(_zod.z.unknown());

exports.contentScopeFeaturesItemSettingsSchema = contentScopeFeaturesItemSettingsSchema;

const userPreferencesSchema = _zod.z.object({
  globalPrivacyControlValue: _zod.z.boolean().optional(),
  sessionKey: _zod.z.string().optional(),
  debug: _zod.z.boolean(),
  platform: _zod.z.object({
    name: _zod.z.union([_zod.z.literal("ios"), _zod.z.literal("macos"), _zod.z.literal("windows"), _zod.z.literal("extension"), _zod.z.literal("android"), _zod.z.literal("unknown")])
  }),
  features: _zod.z.record(_zod.z.object({
    settings: _zod.z.record(_zod.z.unknown())
  }))
});

exports.userPreferencesSchema = userPreferencesSchema;

const contentScopeFeaturesSchema = _zod.z.record(_zod.z.object({
  exceptions: _zod.z.array(_zod.z.unknown()),
  state: _zod.z.union([_zod.z.literal("enabled"), _zod.z.literal("disabled")]),
  settings: contentScopeFeaturesItemSettingsSchema.optional()
}));

exports.contentScopeFeaturesSchema = contentScopeFeaturesSchema;

const selectedDetailParamsSchema = _zod.z.object({
  data: _zod.z.record(_zod.z.unknown()),
  configType: _zod.z.string()
});

exports.selectedDetailParamsSchema = selectedDetailParamsSchema;

const sendJSPixelParamsSchema = _zod.z.object({
  pixelName: _zod.z.literal("autofill_identity")
});

exports.sendJSPixelParamsSchema = sendJSPixelParamsSchema;

const setSizeParamsSchema = _zod.z.object({
  height: _zod.z.number(),
  width: _zod.z.number()
});

exports.setSizeParamsSchema = setSizeParamsSchema;

const outgoingCredentialsSchema = _zod.z.object({
  username: _zod.z.string().optional(),
  password: _zod.z.string().optional()
});

exports.outgoingCredentialsSchema = outgoingCredentialsSchema;

const askToUnlockProviderResultSchema = _zod.z.object({
  type: _zod.z.literal("askToUnlockProviderResponse").optional(),
  success: providerStatusUpdatedSchema,
  error: genericErrorSchema.optional()
});

exports.askToUnlockProviderResultSchema = askToUnlockProviderResultSchema;

const autofillSettingsSchema = _zod.z.object({
  featureToggles: autofillFeatureTogglesSchema
});

exports.autofillSettingsSchema = autofillSettingsSchema;

const checkCredentialsProviderStatusResultSchema = _zod.z.object({
  type: _zod.z.literal("checkCredentialsProviderStatusResponse").optional(),
  success: providerStatusUpdatedSchema,
  error: genericErrorSchema.optional()
});

exports.checkCredentialsProviderStatusResultSchema = checkCredentialsProviderStatusResultSchema;

const getAutofillDataRequestSchema = _zod.z.object({
  inputType: _zod.z.string(),
  mainType: _zod.z.union([_zod.z.literal("credentials"), _zod.z.literal("identities"), _zod.z.literal("creditCards")]),
  subType: _zod.z.string(),
  trigger: _zod.z.union([_zod.z.literal("userInitiated"), _zod.z.literal("autoprompt")]).optional(),
  serializedInputContext: _zod.z.string().optional(),
  triggerContext: triggerContextSchema.optional()
});

exports.getAutofillDataRequestSchema = getAutofillDataRequestSchema;

const contentScopeSchema = _zod.z.object({
  features: contentScopeFeaturesSchema,
  unprotectedTemporary: _zod.z.array(_zod.z.unknown())
});

exports.contentScopeSchema = contentScopeSchema;

const runtimeConfigurationSchema = _zod.z.object({
  contentScope: contentScopeSchema,
  userUnprotectedDomains: _zod.z.array(_zod.z.string()),
  userPreferences: userPreferencesSchema
});

exports.runtimeConfigurationSchema = runtimeConfigurationSchema;

const storeFormDataSchema = _zod.z.object({
  credentials: outgoingCredentialsSchema.optional()
});

exports.storeFormDataSchema = storeFormDataSchema;

const getRuntimeConfigurationResponseSchema = _zod.z.object({
  type: _zod.z.literal("getRuntimeConfigurationResponse").optional(),
  success: runtimeConfigurationSchema.optional(),
  error: genericErrorSchema.optional()
});

exports.getRuntimeConfigurationResponseSchema = getRuntimeConfigurationResponseSchema;

},{"zod":12}],65:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GetAlias = void 0;

var _index = require("../../packages/device-api/index.js");

var _validatorsZod = require("./__generated__/validators.zod.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @extends {DeviceApiCall<getAliasParamsSchema, getAliasResultSchema>}
 */
class GetAlias extends _index.DeviceApiCall {
  constructor() {
    super(...arguments);

    _defineProperty(this, "method", 'emailHandlerGetAlias');

    _defineProperty(this, "id", 'n/a');

    _defineProperty(this, "paramsValidator", _validatorsZod.getAliasParamsSchema);

    _defineProperty(this, "resultValidator", _validatorsZod.getAliasResultSchema);
  }

  preResultValidation(response) {
    // convert to the correct format, because this is a legacy API
    return {
      success: response
    };
  }

}

exports.GetAlias = GetAlias;

},{"../../packages/device-api/index.js":14,"./__generated__/validators.zod.js":64}],66:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AndroidTransport = void 0;

var _index = require("../../../packages/device-api/index.js");

var _deviceApiCalls = require("../__generated__/deviceApiCalls.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class AndroidTransport extends _index.DeviceApiTransport {
  /** @type {GlobalConfig} */

  /** @param {GlobalConfig} globalConfig */
  constructor(globalConfig) {
    super();

    _defineProperty(this, "config", void 0);

    this.config = globalConfig;

    if (this.config.isDDGTestMode) {
      var _window$BrowserAutofi, _window$BrowserAutofi2;

      if (typeof ((_window$BrowserAutofi = window.BrowserAutofill) === null || _window$BrowserAutofi === void 0 ? void 0 : _window$BrowserAutofi.getAutofillData) !== 'function') {
        console.warn('window.BrowserAutofill.getAutofillData missing');
      }

      if (typeof ((_window$BrowserAutofi2 = window.BrowserAutofill) === null || _window$BrowserAutofi2 === void 0 ? void 0 : _window$BrowserAutofi2.storeFormData) !== 'function') {
        console.warn('window.BrowserAutofill.storeFormData missing');
      }
    }
  }
  /**
   * @param {import("../../../packages/device-api").DeviceApiCall} deviceApiCall
   * @returns {Promise<any>}
   */


  async send(deviceApiCall) {
    if (deviceApiCall instanceof _deviceApiCalls.GetRuntimeConfigurationCall) {
      return androidSpecificRuntimeConfiguration(this.config);
    }

    if (deviceApiCall instanceof _deviceApiCalls.GetAvailableInputTypesCall) {
      return androidSpecificAvailableInputTypes(this.config);
    }

    if (deviceApiCall instanceof _deviceApiCalls.GetAutofillDataCall) {
      window.BrowserAutofill.getAutofillData(JSON.stringify(deviceApiCall.params));
      return waitForResponse(deviceApiCall.id, this.config);
    }

    if (deviceApiCall instanceof _deviceApiCalls.StoreFormDataCall) {
      return window.BrowserAutofill.storeFormData(JSON.stringify(deviceApiCall.params));
    }

    throw new Error('android: not implemented: ' + deviceApiCall.method);
  }

}
/**
 * @param {string} expectedResponse - the name/id of the response
 * @param {GlobalConfig} config
 * @returns {Promise<*>}
 */


exports.AndroidTransport = AndroidTransport;

function waitForResponse(expectedResponse, config) {
  return new Promise(resolve => {
    const handler = e => {
      if (!config.isDDGTestMode) {
        if (e.origin !== '') {
          return;
        }
      }

      if (!e.data) {
        return;
      }

      if (typeof e.data !== 'string') {
        if (config.isDDGTestMode) {
          console.log('❌ event.data was not a string. Expected a string so that it can be JSON parsed');
        }

        return;
      }

      try {
        let data = JSON.parse(e.data);

        if (data.type === expectedResponse) {
          window.removeEventListener('message', handler);
          return resolve(data);
        }

        if (config.isDDGTestMode) {
          console.log("\u274C event.data.type was '".concat(data.type, "', which didnt match '").concat(expectedResponse, "'"), JSON.stringify(data));
        }
      } catch (e) {
        window.removeEventListener('message', handler);

        if (config.isDDGTestMode) {
          console.log('❌ Could not JSON.parse the response');
        }
      }
    };

    window.addEventListener('message', handler);
  });
}
/**
 * @param {GlobalConfig} globalConfig
 * @returns {{success: import('../__generated__/validators-ts').RuntimeConfiguration}}
 */


function androidSpecificRuntimeConfiguration(globalConfig) {
  if (!globalConfig.userPreferences) {
    throw new Error('globalConfig.userPreferences not supported yet on Android');
  }

  return {
    success: {
      // @ts-ignore
      contentScope: globalConfig.contentScope,
      // @ts-ignore
      userPreferences: globalConfig.userPreferences,
      // @ts-ignore
      userUnprotectedDomains: globalConfig.userUnprotectedDomains,
      // @ts-ignore
      availableInputTypes: globalConfig.availableInputTypes
    }
  };
}
/**
 * @param {GlobalConfig} globalConfig
 * @returns {{success: import('../__generated__/validators-ts').AvailableInputTypes}}
 */


function androidSpecificAvailableInputTypes(globalConfig) {
  if (!globalConfig.availableInputTypes) {
    throw new Error('globalConfig.availableInputTypes not supported yet on Android');
  }

  return {
    success: globalConfig.availableInputTypes
  };
}

},{"../../../packages/device-api/index.js":14,"../__generated__/deviceApiCalls.js":63}],67:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AppleTransport = void 0;

var _contentScopeUtils = require("@duckduckgo/content-scope-utils");

var _index = require("../../../packages/device-api/index.js");

var _deviceApiCalls = require("../__generated__/deviceApiCalls.js");

class AppleTransport extends _index.DeviceApiTransport {
  /** @param {GlobalConfig} globalConfig */
  constructor(globalConfig) {
    super();
    this.config = globalConfig;
    const webkitConfig = new _contentScopeUtils.WebkitMessagingConfig({
      hasModernWebkitAPI: this.config.hasModernWebkitAPI,
      webkitMessageHandlerNames: this.config.webkitMessageHandlerNames,
      secret: this.config.secret
    });
    this.messaging = new _contentScopeUtils.Messaging(webkitConfig);
  }

  async send(deviceApiCall) {
    try {
      // if the call has an `id`, it means that it expects a response
      if (deviceApiCall.id) {
        return await this.messaging.request(deviceApiCall.method, deviceApiCall.params || undefined);
      } else {
        return this.messaging.notify(deviceApiCall.method, deviceApiCall.params || undefined);
      }
    } catch (e) {
      if (e instanceof _contentScopeUtils.MissingHandler) {
        if (this.config.isDDGTestMode) {
          console.log('MissingWebkitHandler error for:', deviceApiCall.method);
        }

        if (deviceApiCall instanceof _deviceApiCalls.GetRuntimeConfigurationCall) {
          return deviceApiCall.result(appleSpecificRuntimeConfiguration(this.config));
        }

        throw new Error('unimplemented handler: ' + deviceApiCall.method);
      } else {
        throw e;
      }
    }
  }

}
/**
 * @param {GlobalConfig} globalConfig
 * @returns {ReturnType<GetRuntimeConfigurationCall['result']>}
 */


exports.AppleTransport = AppleTransport;

function appleSpecificRuntimeConfiguration(globalConfig) {
  return {
    success: {
      // @ts-ignore
      contentScope: globalConfig.contentScope,
      // @ts-ignore
      userPreferences: globalConfig.userPreferences,
      // @ts-ignore
      userUnprotectedDomains: globalConfig.userUnprotectedDomains,
      // @ts-ignore
      availableInputTypes: globalConfig.availableInputTypes
    }
  };
}

},{"../../../packages/device-api/index.js":14,"../__generated__/deviceApiCalls.js":63,"@duckduckgo/content-scope-utils":2}],68:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExtensionTransport = void 0;

var _index = require("../../../packages/device-api/index.js");

var _deviceApiCalls = require("../__generated__/deviceApiCalls.js");

var _autofillUtils = require("../../autofill-utils.js");

var _Settings = require("../../Settings.js");

class ExtensionTransport extends _index.DeviceApiTransport {
  /** @param {GlobalConfig} globalConfig */
  constructor(globalConfig) {
    super();
    this.config = globalConfig;
  }

  async send(deviceApiCall) {
    if (deviceApiCall instanceof _deviceApiCalls.GetRuntimeConfigurationCall) {
      return deviceApiCall.result(await extensionSpecificRuntimeConfiguration(this.config));
    }

    if (deviceApiCall instanceof _deviceApiCalls.GetAvailableInputTypesCall) {
      return deviceApiCall.result(await extensionSpecificGetAvailableInputTypes());
    }

    throw new Error('not implemented yet for ' + deviceApiCall.method);
  }

}
/**
 * @param {GlobalConfig} globalConfig
 * @returns {Promise<ReturnType<GetRuntimeConfigurationCall['result']>>}
 */


exports.ExtensionTransport = ExtensionTransport;

async function extensionSpecificRuntimeConfiguration(globalConfig) {
  const contentScope = await getContentScopeConfig();
  const emailProtectionEnabled = (0, _autofillUtils.isAutofillEnabledFromProcessedConfig)(contentScope);
  return {
    success: {
      // @ts-ignore
      contentScope: contentScope,
      // @ts-ignore
      userPreferences: {
        features: {
          autofill: {
            settings: {
              featureToggles: { ..._Settings.Settings.defaults.featureToggles,
                emailProtection: emailProtectionEnabled
              }
            }
          }
        }
      },
      // @ts-ignore
      userUnprotectedDomains: globalConfig === null || globalConfig === void 0 ? void 0 : globalConfig.userUnprotectedDomains
    }
  };
}

async function extensionSpecificGetAvailableInputTypes() {
  const contentScope = await getContentScopeConfig();
  const emailProtectionEnabled = (0, _autofillUtils.isAutofillEnabledFromProcessedConfig)(contentScope);
  return {
    success: { ..._Settings.Settings.defaults.availableInputTypes,
      email: emailProtectionEnabled
    }
  };
}

async function getContentScopeConfig() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({
      registeredTempAutofillContentScript: true,
      documentUrl: window.location.href
    }, response => {
      if (response && 'site' in response) {
        resolve(response);
      }
    });
  });
}

},{"../../../packages/device-api/index.js":14,"../../Settings.js":49,"../../autofill-utils.js":59,"../__generated__/deviceApiCalls.js":63}],69:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createTransport = createTransport;

var _appleTransport = require("./apple.transport.js");

var _androidTransport = require("./android.transport.js");

var _extensionTransport = require("./extension.transport.js");

var _windowsTransport = require("./windows.transport.js");

/**
 * @param {GlobalConfig} globalConfig
 * @returns {import("../../../packages/device-api").DeviceApiTransport}
 */
function createTransport(globalConfig) {
  var _globalConfig$userPre, _globalConfig$userPre2, _globalConfig$userPre3, _globalConfig$userPre4;

  if (typeof ((_globalConfig$userPre = globalConfig.userPreferences) === null || _globalConfig$userPre === void 0 ? void 0 : (_globalConfig$userPre2 = _globalConfig$userPre.platform) === null || _globalConfig$userPre2 === void 0 ? void 0 : _globalConfig$userPre2.name) === 'string') {
    switch ((_globalConfig$userPre3 = globalConfig.userPreferences) === null || _globalConfig$userPre3 === void 0 ? void 0 : (_globalConfig$userPre4 = _globalConfig$userPre3.platform) === null || _globalConfig$userPre4 === void 0 ? void 0 : _globalConfig$userPre4.name) {
      case 'ios':
      case 'macos':
        return new _appleTransport.AppleTransport(globalConfig);

      case 'android':
        return new _androidTransport.AndroidTransport(globalConfig);

      default:
        throw new Error('selectSender unimplemented!');
    }
  }

  if (globalConfig.isWindows) {
    return new _windowsTransport.WindowsTransport();
  } // fallback for when `globalConfig.userPreferences.platform.name` is absent


  if (globalConfig.isDDGApp) {
    if (globalConfig.isAndroid) {
      return new _androidTransport.AndroidTransport(globalConfig);
    }

    throw new Error('unreachable, createTransport');
  } // falls back to extension... is this still the best way to determine this?


  return new _extensionTransport.ExtensionTransport(globalConfig);
}

},{"./android.transport.js":66,"./apple.transport.js":67,"./extension.transport.js":68,"./windows.transport.js":70}],70:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WindowsTransport = void 0;

var _index = require("../../../packages/device-api/index.js");

/**
 * @typedef {import('../../../packages/device-api/lib/device-api').CallOptions} CallOptions
 * @typedef {import("../../../packages/device-api").DeviceApiCall} DeviceApiCall
 */
class WindowsTransport extends _index.DeviceApiTransport {
  async send(deviceApiCall, options) {
    if (deviceApiCall.id) {
      return windowsTransport(deviceApiCall, options).withResponse(deviceApiCall.id);
    }

    return windowsTransport(deviceApiCall, options);
  }

}
/**
 * @param {DeviceApiCall} deviceApiCall
 * @param {CallOptions} [options]
 */


exports.WindowsTransport = WindowsTransport;

function windowsTransport(deviceApiCall, options) {
  windowsInteropPostMessage({
    Feature: 'Autofill',
    Name: deviceApiCall.method,
    Data: deviceApiCall.params
  });
  return {
    /**
     * Sends a message and returns a Promise that resolves with the response
     * @param responseId
     * @returns {Promise<*>}
     */
    withResponse(responseId) {
      return waitForWindowsResponse(responseId, options);
    }

  };
}
/**
 * @param {string} responseId
 * @param {CallOptions} [options]
 * @returns {Promise<any>}
 */


function waitForWindowsResponse(responseId, options) {
  return new Promise((resolve, reject) => {
    var _options$signal, _options$signal2;

    // if already aborted, reject immediately
    if (options !== null && options !== void 0 && (_options$signal = options.signal) !== null && _options$signal !== void 0 && _options$signal.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }

    let teardown; // The event handler

    const handler = event => {
      // console.log(`📩 windows, ${window.location.href}`, [event.origin, JSON.stringify(event.data)])
      if (!event.data) {
        console.warn('data absent from message');
        return;
      }

      if (event.data.type === responseId) {
        teardown();
        resolve(event.data);
      }
    }; // what to do if this promise is aborted


    const abortHandler = () => {
      teardown();
      reject(new DOMException('Aborted', 'AbortError'));
    }; // setup


    windowsInteropAddEventListener('message', handler);
    options === null || options === void 0 ? void 0 : (_options$signal2 = options.signal) === null || _options$signal2 === void 0 ? void 0 : _options$signal2.addEventListener('abort', abortHandler);

    teardown = () => {
      var _options$signal3;

      windowsInteropRemoveEventListener('message', handler);
      options === null || options === void 0 ? void 0 : (_options$signal3 = options.signal) === null || _options$signal3 === void 0 ? void 0 : _options$signal3.removeEventListener('abort', abortHandler);
    };
  });
}

},{"../../../packages/device-api/index.js":14}],71:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*!
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

/*
 * @see https://developers.google.com/web/updates/2015/08/using-requestidlecallback
 */
// @ts-ignore
window.requestIdleCallback = window.requestIdleCallback || function (cb) {
  return setTimeout(function () {
    const start = Date.now(); // eslint-disable-next-line standard/no-callback-literal

    cb({
      didTimeout: false,
      timeRemaining: function () {
        return Math.max(0, 50 - (Date.now() - start));
      }
    });
  }, 1);
};

window.cancelIdleCallback = window.cancelIdleCallback || function (id) {
  clearTimeout(id);
};

var _default = {};
exports.default = _default;

},{}]},{},[60]);
