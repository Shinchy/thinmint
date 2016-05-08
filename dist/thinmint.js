/**
 * @license
 * ThinMint 0.0.11 <https://github.com/cloudily/thinmint>
 * Available under MIT license <https://raw.githubusercontent.com/cloudily/thinmint/master/LICENSE>
 */
var mustache = mustache || {};

var rb = rb || {};

jQuery.isElement = function(e) {
  try {
    return !(!e.length || 1 != e.get(0).nodeType);
  } catch (t) {
    return !1;
  }
};

jQuery.fn.serializeObject = function() {
  var obj = {};
  jQuery.each(this.serializeArray(), function(i, o) {
    var n = o.name, v = o.value;
    obj[n] = obj[n] === undefined ? v : jQuery.isArray(obj[n]) ? obj[n].concat(v) : [ obj[n], v ];
  });
  return obj;
};

var ThinMint = {};

ThinMint.VERSION = "0.0.11";

ThinMint.Event = {};

ThinMint.Logger = function() {
  this.on = function() {
    this._toggle.apply(this, arguments);
    return this;
  };
  this.off = function() {
    Array.prototype.unshift.call(arguments, true);
    this._toggle.apply(this, arguments);
    return this;
  };
};

ThinMint.Logger.methods = [ "assert", "clear", "count", "debug", "dir", "dirxml", "error", "group", "groupCollapsed", "groupEnd", "info", "log", "markTimeline", "profile", "profileEnd", "table", "time", "timeEnd", "timeStamp", "timelineEnd", "trace", "warn" ];

ThinMint.Logger.map = function(method) {
  if (!console || typeof console !== "object" || typeof console[method] !== "function") {
    return function() {};
  }
  return function() {
    console[method].apply(console, arguments);
  };
};

(ThinMint.Logger.mapper = function() {
  for (var i = 0, l = ThinMint.Logger.methods.length; i < l; i++) {
    ThinMint.Logger.prototype[ThinMint.Logger.methods[i]] = ThinMint.Logger.map(ThinMint.Logger.methods[i]);
  }
})();

ThinMint.Logger.on = function() {
  ThinMint.Logger.prototype._toggle.apply(ThinMint.Logger.prototype, arguments);
  return this;
};

ThinMint.Logger.off = function() {
  Array.prototype.unshift.call(arguments, true);
  ThinMint.Logger.prototype._toggle.apply(ThinMint.Logger.prototype, arguments);
  return this;
};

ThinMint.Logger.prototype._toggle = function() {
  var noop = false, parent = typeof Object.getPrototypeOf === "function" ? Object.getPrototypeOf(this) : this.__proto__;
  if (typeof arguments[0] === "boolean") {
    noop = Array.prototype.shift.apply(arguments);
  }
  var methods = arguments;
  if (methods.length === 0) {
    methods = ThinMint.Logger.methods;
  }
  for (var i = 0, l = methods.length; i < l; i++) {
    if (typeof methods[i] !== "string" || ThinMint.Logger.methods.indexOf(methods[i]) === -1) {
      continue;
    }
    this[methods[i]] = noop === true ? function() {} : ThinMint.Logger.map(methods[i]);
  }
};

ThinMint.Util = {};

ThinMint.Util.callback = function(callback) {
  return typeof callback === "function" ? callback : function() {};
};

ThinMint.Util.Mustache = {};

ThinMint.Util.Mustache.console = new ThinMint.Logger();

ThinMint.Util.Mustache.getTemplate = function(path) {
  if (!path || typeof path === "object") {
    return null;
  }
  var templateKey = path.replace(/\//g, "___");
  var template = mustache[templateKey];
  if (template) {
    return template;
  }
  var rbSets = [ "language", "error_messages" ];
  var i = 0;
  var rbSetsLength = rbSets.length;
  for (;i < rbSetsLength; i++) {
    var _bundle = rbSets[i];
    var _language = rb[_bundle];
    if (jQuery.isPlainObject(_language) === false) {
      continue;
    }
    if (path.indexOf("rb." + _bundle + ".") === 0) {
      var languageKey = path.substr(4 + _bundle.length);
      if (typeof _language[languageKey] === "string") {
        return _language[languageKey];
      }
    }
  }
  this.console.error("ThinMint.Util.Mustache.getTemplate", "Mustache template missing: ", path);
  try {
    if (generic.cookie("magic_mustache_unroll") == 1) {
      this.console.error("If experiencing issues, please disable mustache unroll: /shared/debug_magic_js.tmpl?magic_mustache_unroll=0");
    }
  } catch (e) {}
  return path;
};

ThinMint.Util.Mustache.render = function(template, data) {
  var response;
  data = jQuery.isPlainObject(data) ? data : {};
  data.rb = rb;
  try {
    response = Mustache.render(template, data, ThinMint.Util.Mustache.getTemplate);
  } catch (e) {
    this.console.error(template, data, e);
    response = template + "\n" + e.toString();
  }
  return response;
};

ThinMint.Page = {};

ThinMint.Page.Panel = function() {
  var allPanels = {};
  var messageBus = jQuery({});
  var that = {};
  that.console = new ThinMint.Logger();
  that.add = function(id, panel) {
    if (typeof id !== "string") {
      that.console.error("ThinMint.Page.Panel.add", "ID must be a string.", arguments);
      return;
    }
    if (panel instanceof ThinMint.Panel === false) {
      that.console.error("ThinMint.Page.Panel.add", "Panel must be an instance of ThinMint.Panel", arguments);
      return;
    }
    if (typeof allPanels[id] !== "undefined") {
      that.console.info("ThinMint.Page.Panel.add", "ID already exists ... overwriting", arguments);
      allPanels[id]._destruct();
      allPanels[id] = null;
      delete allPanels[id];
    }
    allPanels[id] = panel;
    return that;
  };
  that.get = function(id) {
    if (typeof allPanels[id] === "undefined") {
      that.console.info("ThinMint.Page.Panel.get", "Could not find ID.", arguments);
    }
    return allPanels[id];
  };
  that.all = function() {
    return allPanels;
  };
  that.clear = function() {
    var panels = that.all();
    for (var key in panels) {
      if (panels.hasOwnProperty(key) === false) {
        continue;
      }
      try {
        panels[key]._destruct();
      } catch (e) {}
      delete panels[key];
    }
  };
  that.trigger = function() {
    if (typeof arguments[0] !== "string") {
      that.console.error("ThinMint.Page.Panel.trigger", "Event Name must be a string.", arguments);
      return;
    }
    return messageBus.trigger.apply(messageBus, arguments);
  };
  that.on = function() {
    if (typeof arguments[0] !== "string" && jQuery.isPlainObject(arguments[0]) === false) {
      that.console.error("ThinMint.Page.Panel.on", "Event Name must be a string.", arguments);
      return;
    }
    messageBus.on.apply(messageBus, arguments);
  };
  that.one = function() {
    if (typeof arguments[0] !== "string" && jQuery.isPlainObject(arguments[0]) === false) {
      that.console.error("ThinMint.Page.Panel.on", "Event Name must be a string.", arguments);
      return;
    }
    messageBus.one.apply(messageBus, arguments);
  };
  that.off = function() {
    if (typeof arguments[0] !== "string" && jQuery.isPlainObject(arguments[0]) === false) {
      that.console.error("ThinMint.Page.Panel.off", "Event Name must be a string.", arguments);
      return;
    }
    messageBus.off.apply(messageBus, arguments);
  };
  return that;
}();

ThinMint = ThinMint || {};

ThinMint.Queue = function() {
  var that = {};
  that.list = [];
  that.index = 1;
  that.aborted = false;
  that.finished = false;
  that.async = true;
  that.add = function(sequenceFunction) {
    that.list.push(sequenceFunction);
  };
  that.start = function() {
    var i = 0;
    that.index = -1;
    that.aborted = false;
    if (typeof that.onStart === "function") {
      that.onStart();
    }
    if (that.async == true) {
      if (that.list.length > 0) {
        that.index = 0;
        for (i = 0; i < that.list.length; i++) {
          var currFunction = that.list[i];
          if (typeof currFunction === "function") {
            currFunction(that);
          }
        }
      } else {
        that.next();
      }
    } else {
      that.next();
    }
  };
  that.end = function(err) {
    if (typeof that.onEnd === "function") {
      that.onEnd(err);
    }
    that.finished = true;
  };
  that.next = function() {
    if (that.aborted) {
      return;
    }
    if (++that.index == that.list.length) {
      return that.end();
    }
    if (that.async == false) {
      var currFunction = that.list[that.index];
      if (currFunction) {
        if (that.async === false) {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(that);
          currFunction.apply(currFunction, args);
        } else {
          currFunction(that);
        }
      }
    }
  };
  that.abort = function() {
    that.index = -1;
    that.aborted = true;
  };
  return that;
};

ThinMint = ThinMint || {};

ThinMint.Storage = function(store) {
  var that = {}, namespace = "", getDate, expiresSuffix = ".expires", expiresKey;
  getDate = function() {
    return +new Date();
  };
  expiresKey = function(key) {
    return key + expiresSuffix;
  };
  if (store == false) {
    store = function() {};
    store.prototype.data = {};
    store.prototype.length = 0;
    store.prototype.updateLength = function() {
      var that = this;
      that.length = 0;
      jQuery.each(that.data, function() {
        ++that.length;
      });
    };
    store.prototype.key = function(index) {
      var i = 0, match;
      jQuery.each(this.data, function(key) {
        if (i++ == index) {
          match = key;
          return false;
        }
      });
      return match;
    };
    store.prototype.setItem = function(key, value) {
      this.data[key] = 1;
      this[key] = value;
      this.updateLength();
    };
    store.prototype.getItem = function(key) {
      return this[key];
    };
    store.prototype.removeItem = function(key) {
      delete this[key];
      delete this.data[key];
      this.updateLength();
    };
    store.prototype.clear = function() {
      var that = this;
      jQuery.each(this.data, function(index) {
        delete that[index];
      });
      this.data = {};
      this.length = 0;
    };
    store = new store();
  }
  that.all = function() {
    var i, key, value, l = store.length, data = {};
    for (i = 0; i < l; i++) {
      key = store.key(i);
      data[key] = that.get(key);
    }
    return data;
  };
  that.set = function(key, value, expiresMs) {
    key = namespace + key;
    if (typeof store[key] === "function") {
      return console.error(key + " is function.");
    }
    try {
      var data = store.setItem(key, JSON.stringify(value));
      if (typeof expiresMs !== "undefined") {
        store.setItem(expiresKey(key), getDate() + expiresMs);
      }
      return data;
    } catch (e) {
      that.gc();
    }
  };
  that.get = function(key) {
    key = namespace + key;
    var expires = store.getItem(expiresKey(key));
    if (expires && getDate() > expires) {
      that.destroy(key);
      that.destroy(expiresKey(key));
    }
    return JSON.parse(store.getItem(key));
  };
  that.destroy = function(key) {
    key = namespace + key;
    return store.removeItem(key);
  };
  that.clear = function() {
    return store.clear();
  };
  that.toString = function() {
    return JSON.stringify(that.all());
  };
  that.namespace = function(ns) {
    namespace = ns;
  };
  that.increment = function(key, count) {
    if (typeof count !== "number") {
      count = 1;
    }
    var result = that.get(key);
    if (!result) {
      return;
    }
    return that.set(key, +result + count);
  };
  that.getNamespace = function(ns) {
    var key = getDate();
    var result = that.get(ns);
    if (result) {
      return result;
    }
    that.set(ns, key);
    return key;
  };
  that.setWithNamespace = function(ns, key, val, expiresMs) {
    var ns = that.getNamespace(ns);
    return that.set(ns + "." + key, val, expiresMs);
  };
  that.getWithNamespace = function(ns, key) {
    var ns = that.getNamespace(ns);
    return that.get(ns + "." + key);
  };
  that.clearNamespace = function(ns) {
    return that.increment(ns);
  };
  that.gc = function() {
    var i, key, value, expiresLength = expiresSuffix.length, place, l = store.length;
    for (i = 0; i < l; i++) {
      key = store.key(i);
      if (key) {
        place = key.lastIndexOf(expiresSuffix);
        if (place > -1 && key.length - expiresLength === place) {
          that.get(key.substr(0, place));
        }
      }
    }
  };
  return that;
}(typeof localStorage !== "undefined" && localStorage);

ThinMint = ThinMint || {};

ThinMint.Router = function(location, undefined) {
  var _routes = [];
  var _mode = null;
  var _root = "/";
  var _host = null;
  var that = {};
  that.add = function(re, handler) {
    if (typeof re == "function") {
      handler = re;
      re = "";
    }
    _routes.push({
      re: re,
      handler: handler
    });
    return that;
  };
  that.remove = function(param) {
    for (var i = 0, r; i < _routes.length, r = _routes[i]; i++) {
      if (r.handler === param || r.re === param) {
        _routes.splice(i, 1);
        return that;
      }
    }
    return that;
  };
  that.flush = function() {
    _routes = [];
    _mode = null;
    _root = "/";
    return that;
  };
  that.clearSlashes = function(path) {
    return path.toString().replace(/\/$/, "").replace(/^\//, "");
  };
  that.config = function(options) {
    _mode = options && options.mode && options.mode == "history" && !!history.pushState ? "history" : "hash";
    _root = options && options.root ? "/" + that.clearSlashes(options.root) + "/" : "/";
    return that;
  };
  that.getFragment = function() {
    var fragment = "";
    if (_mode === "history") {
      if (!location) {
        return "";
      }
      fragment = that.clearSlashes(decodeURI(location.pathname + location.search));
      fragment = fragment.replace(/\?(.*)$/, "");
      fragment = _root != "/" ? fragment.replace(_root, "") : fragment;
    } else {
      if (!window) {
        return "";
      }
      var match = location.href.match(/#(.*)$/);
      fragment = match ? match[1] : "";
    }
    return that.clearSlashes(fragment);
  };
  that.listen = function(loopInterval) {
    var current = that.getFragment();
    var fn = function() {
      if (current !== that.getFragment()) {
        current = that.getFragment();
        that.check(current);
      }
    };
    clearInterval(that.interval);
    that.interval = setInterval(fn, loopInterval || 50);
    return that;
  };
  that.check = function(f) {
    var fragment = f || that.getFragment();
    for (var i = 0; i < _routes.length; i++) {
      var match = fragment.match(_routes[i].re);
      if (match) {
        match.shift();
        _routes[i].handler.apply(_host || {}, match);
        return that;
      }
    }
    return that;
  };
  that.navigate = function(path) {
    path = path ? path : "";
    if (_mode === "history") {
      history.pushState(null, null, _root + that.clearSlashes(path));
    } else {
      location.href.match(/#(.*)$/);
      location.href = location.href.replace(/#(.*)$/, "") + "#" + path;
    }
    return that;
  };
  return that;
}(window.location);

ThinMint = ThinMint || {};

ThinMint.Request = function(options) {
  this.options = jQuery.extend(true, {}, this.options, options);
  this._data = {};
  this.isCacheEnabled = false;
  this.cacheNamespace = "ThinMint.Request";
  this.cacheTTL = 72e5;
  if (this.options.eventName) {
    this.setEventName(this.options.eventName);
  }
  if (this.options.console) {
    this.setConsole(this.options.console);
  }
};

ThinMint.Request.prototype.options = {};

ThinMint.Request.prototype.console = new ThinMint.Logger();

ThinMint.Request.prototype.setConsole = function(console) {
  if (console instanceof ThinMint.Logger === false) {
    this.console.error("ThinMint.Request.setConsole", "Console must be an instance of ThinMint.Logger", arguments);
    return;
  }
  this.console = console;
};

ThinMint.Request.prototype.getEventName = function() {
  return this.eventName;
};

ThinMint.Request.prototype.setEventName = function(eventName) {
  if (typeof eventName !== "string") {
    this.console.error("ThinMint.Request.setEventName", "EventName must be a string.", arguments);
    return;
  }
  this.eventName = eventName;
};

ThinMint.Request.prototype._time = function() {
  this.console.time(this.getEventName());
};

ThinMint.Request.prototype._timeEnd = function() {
  this.console.timeEnd(this.getEventName());
};

ThinMint.Request.prototype.set = function(key, value) {
  if (typeof key === "string") {
    this._data[key] = value;
  } else {
    if (jQuery.isPlainObject(key)) {
      this._data = jQuery.extend(true, {}, this._data, key);
    }
  }
};

ThinMint.Request.prototype.get = function(key) {
  return this._data[key];
};

ThinMint.Request.prototype.save = function(data, callback) {
  var settings = {};
  if (typeof data === "function") {
    callback = data;
    data = {};
  }
  callback = ThinMint.Util.callback(callback);
  settings.url = this.options.url;
  settings.data = jQuery.extend(true, {}, this._data, data);
  this._dispatch(settings, callback);
};

ThinMint.Request.prototype.destroy = function(data, callback) {
  var error = null;
  if (typeof data === "function") {
    callback = data;
    data = {};
  }
  callback = ThinMint.Util.callback(callback);
  callback(error);
};

ThinMint.Request.prototype.run = function(callback) {
  this.console.warn("ThinMint.Request.run", "The run method is deprecated. Use fetch instead.");
  this.fetch.apply(this, arguments);
};

ThinMint.Request.prototype.fetch = function(callback) {
  var that = this;
  callback = ThinMint.Util.callback(callback);
  this._dispatch(this.options, callback);
};

ThinMint.Request.prototype._dispatch = function(url, settings, callback, options) {
  var that = this;
  var cache = false;
  this._time();
  if (jQuery.isPlainObject(callback)) {
    options = callback;
    callback = null;
  }
  if (typeof settings === "function") {
    callback = settings;
    settings = null;
  }
  if (jQuery.isPlainObject(url)) {
    settings = url;
    url = null;
  }
  callback = ThinMint.Util.callback(callback);
  settings = jQuery.isPlainObject(settings) ? settings : {};
  if (typeof url === "string") {
    settings.url = url;
  }
  cache = this.getCache(settings);
  if (cache !== null) {
    this.console.info("ThinMint.Request._dispatch", "Returning cached contents.", settings);
    that.handleResponse.call(that, null, cache, null, callback, options);
    return;
  }
  jQuery.ajax(settings).done(function(data, textStatus, jqXHR) {
    that.setCache(settings, data);
    that.handleResponse.call(that, null, data, jqXHR, callback, options);
  }).fail(function(jqXHR, textStatus, errorThrown) {
    var response = jqXHR.responseText;
    try {
      response = JSON.parse(response);
    } catch (e) {}
    that.handleResponse.call(that, errorThrown, response, jqXHR, callback, options);
  });
};

ThinMint.Request.prototype.getCacheKey = function(settings) {
  if (this.isCacheEnabled !== true) {
    return false;
  }
  settings = jQuery.isPlainObject(settings) ? settings : {};
  var httpMethod = jQuery.trim(settings.type || settings.method || "get").toLowerCase();
  var url = jQuery.trim(settings.url);
  var data = JSON.stringify(settings.data);
  var cacheKey = httpMethod + "." + url + "." + data;
  if (httpMethod !== "get") {
    cacheKey = false;
  }
  return cacheKey;
};

ThinMint.Request.prototype.getCache = function(settings) {
  var cacheKey = this.getCacheKey(settings);
  if (cacheKey === false) {
    return null;
  }
  var cacheValue = ThinMint.Storage.getWithNamespace(this.cacheNamespace, cacheKey);
  return cacheValue;
};

ThinMint.Request.prototype.setCache = function(settings, response) {
  var cacheKey = this.getCacheKey(settings);
  if (cacheKey === false) {
    return false;
  }
  return ThinMint.Storage.setWithNamespace(this.cacheNamespace, cacheKey, response, this.cacheTTL);
};

ThinMint.Request.prototype.handleResponse = function(err, data, response, callback, options) {
  options = jQuery.isPlainObject(options) ? options : {};
  var _event = typeof options.eventName !== "undefined" ? options.eventName : this.getEventName();
  callback = ThinMint.Util.callback(callback);
  this.console.groupCollapsed("ThinMint.Request.handleResponse", _event);
  this.console.info(data);
  this.console.groupEnd();
  if (typeof _event === "string") {
    ThinMint.Page.Panel.trigger(_event, [ err, data, response ]);
  } else {
    this.console.warn("ThinMint.Request.handleResponse", "Method does not have an eventName to be triggered.", _event, response);
  }
  this._timeEnd();
  callback(err, data);
};

ThinMint.RequestMethod = function() {
  var that = {};
  var _methods = {};
  that.console = new ThinMint.Logger();
  that.add = function(methodName, _Request) {
    if (_Request instanceof ThinMint.Request === false) {
      that.console.error("ThinMint.RequestMethod.add", "_Request must be a ThinMint.Request Object.", arguments);
      return;
    }
    if (typeof _methods[methodName] !== "undefined") {
      that.console.info("ThinMint.RequestMethod.add", "Method Name (" + methodName + ") already exists. Overwriting...", arguments);
    }
    _methods[methodName] = _Request;
    return that;
  };
  that.get = function(methodName) {
    if (typeof _methods[methodName] !== "undefined") {
      return _methods[methodName];
    }
    that.console.warn("ThinMint.RequestMethod.get", "Method Name (" + methodName + ") does not exist.", arguments);
    return null;
  };
  return that;
}();

ThinMint.RequestQueue = function() {
  this.requests = [];
};

ThinMint.RequestQueue.prototype.console = new ThinMint.Logger();

ThinMint.RequestQueue.prototype.add = function(_Request) {
  if (_Request instanceof ThinMint.Request === false && _Request instanceof ThinMint.RpcQueue === false) {
    this.console.error("RequestQueue.add", "_Request must be an instance of ThinMint.Request.", arguments);
    return;
  }
  this.requests.push(_Request);
  return this;
};

ThinMint.RequestQueue.prototype.run = function(callback) {
  var queue = ThinMint.Queue();
  callback = ThinMint.Util.callback(callback);
  jQuery.each(this.requests, function(index, request) {
    queue.add(function(seq) {
      request.fetch(seq.next);
    });
  });
  queue.onEnd = callback;
  queue.start();
};

ThinMint.RpcRequest = function(options) {
  this.options = jQuery.extend(true, {}, this.options, {
    data: {
      JSONRPC: ""
    },
    method: null,
    params: [],
    eventName: false,
    save: {
      eventName: false,
      method: null,
      httpMethod: "POST"
    },
    destroy: {
      eventName: false,
      method: null,
      httpMethod: "POST"
    }
  });
  ThinMint.Request.apply(this, arguments);
  if (this.options.method) {
    this.setMethod(this.options.method);
  }
  if (this.options.params) {
    this.setParams(this.options.params);
  }
};

ThinMint.RpcRequest.prototype = Object.create(ThinMint.Request.prototype);

ThinMint.RpcRequest.prototype.parent = ThinMint.Request.prototype;

ThinMint.RpcRequest.prototype.options = jQuery.extend(true, {}, ThinMint.Request.prototype.options, {
  url: "/rpc/jsonrpc.tmpl"
});

ThinMint.RpcRequest.prototype.setMethod = function(method) {
  if (typeof method !== "string") {
    this.console.error("ThinMint.RpcRequest.setMethod", "Method must be a string.", arguments);
    return this;
  }
  this.method = method;
  return this;
};

ThinMint.RpcRequest.prototype.setParams = function(params) {
  if (jQuery.isArray(params) === false) {
    this.console.error("ThinMint.RpcRequest.setParams", "Params must be an array.", arguments);
    return this;
  }
  this.params = params;
  return this;
};

ThinMint.RpcRequest.prototype.getMethod = function() {
  return this.method;
};

ThinMint.RpcRequest.prototype.getParams = function() {
  return this.params;
};

ThinMint.RpcRequest.prototype.getQuery = function() {
  var query = {};
  query.method = this.getMethod();
  query.params = this.getParams();
  return query;
};

ThinMint.RpcRequest.prototype.save = function(data, callback) {
  var settings = {};
  if (typeof data === "function") {
    callback = data;
    data = {};
  }
  callback = ThinMint.Util.callback(callback);
  settings = this._constructRequest("save", data);
  this._dispatch(settings, callback, {
    eventName: this.options.save.eventName
  });
};

ThinMint.RpcRequest.prototype._constructRequest = function(method, data) {
  var query = this.getQuery();
  var settings = {};
  var querystring = {
    dbgmethod: this.options[method].method
  };
  query.id = 1;
  query.method = this.options[method].method;
  query.params[0] = jQuery.extend(true, {}, query.params[0], data);
  settings.url = this.options.url;
  settings.url += (settings.url.indexOf("?") > -1 ? "&" : "?") + jQuery.param(querystring);
  settings.type = this.options[method].httpMethod;
  settings.data = {};
  settings.data.JSONRPC = JSON.stringify([ query ]);
  return settings;
};

ThinMint.RpcRequest.prototype.destroy = function(data, callback) {
  var settings = {};
  if (typeof data === "function") {
    callback = data;
    data = {};
  }
  callback = ThinMint.Util.callback(callback);
  settings = this._constructRequest("destroy", data);
  this._dispatch(settings, callback, {
    eventName: this.options.destroy.eventName
  });
};

ThinMint.RpcRequest.prototype.fetch = function(callback) {
  var query = this.getQuery();
  query.id = 1;
  this.options.data.dbgmethod = query.method;
  this.options.data.JSONRPC = JSON.stringify([ query ]);
  this.parent.fetch.apply(this, arguments);
};

ThinMint.RpcRequest.prototype.handleResponse = function(err, data, response, callback, options) {
  if (jQuery.isArray(data)) {
    data = data[0];
  }
  if (typeof data.error !== "undefined") {
    this.console.error("ThinMint.Request.handleResponse", data.error.code, data.error.message, data.error.data.messages);
    err = data.error;
  }
  this.parent.handleResponse.call(this, err, data.result.value, response, callback, options);
};

ThinMint.RpcQueue = function() {
  this.id = 1;
  this.methods = [];
  this.handled = [];
  this._RequestInstance = {};
};

ThinMint.RpcQueue.prototype.console = new ThinMint.Logger();

ThinMint.RpcQueue.prototype.options = jQuery.extend(true, {}, ThinMint.RpcRequest.prototype.options, {
  type: "POST"
});

ThinMint.RpcQueue.prototype.add = function(_Request) {
  if (_Request instanceof ThinMint.RpcRequest === false) {
    this.console.error("ThinMint.RpcQueue.add", "_Request must be a ThinMint.RpcRequest Object.", arguments);
    return;
  }
  var method = _Request.getQuery();
  method.id = this.id++;
  this.console.info("ThinMint.RpcQueue.add", method);
  this.methods.push(method);
  this._RequestInstance[method.id] = _Request;
  return this;
};

ThinMint.RpcQueue.prototype.getRequestInstance = function(id) {
  return this._RequestInstance[id];
};

ThinMint.RpcQueue.prototype.clear = function() {
  this.id = 1;
  this.methods = [];
  this.handled = [];
  this._RequestInstance = {};
  return this;
};

ThinMint.RpcQueue.prototype.getMethods = function() {
  return this.methods;
};

ThinMint.RpcQueue.prototype.getMethodsLength = function() {
  return this.methods.length;
};

ThinMint.RpcQueue.prototype.getHandled = function() {
  return this.handled;
};

ThinMint.RpcQueue.prototype.addHandled = function(id) {
  this.handled.push(id);
  return this;
};

ThinMint.RpcQueue.prototype.isHandled = function(id) {
  return this.handled.indexOf(id) > -1;
};

ThinMint.RpcQueue.prototype.clearHandled = function() {
  this.handled = [];
  return this;
};

ThinMint.RpcQueue.prototype.verifyResponse = function(response) {
  var that = this;
  if (jQuery.isArray(response) && that.getMethodsLength() != response.length) {
    this.console.error("ThinMint.RpcQueue.run", "Response mismatch.  Expected " + that.getMethodsLength() + " and received " + response.length);
    jQuery.each(that.getMethods(), function(index, method) {
      if (that.isHandled(method.id)) {
        return;
      }
      var _Request = that.getRequestInstance(method.id);
      _Request.handleResponse("Response missing from RpcQueue", {
        result: {}
      });
    });
  }
};

ThinMint.RpcQueue.prototype.run = function(callback) {
  this.console.warn("ThinMint.RpcQueue.run", "The run method is deprecated. Use fetch instead.");
  this.fetch.apply(this, arguments);
};

ThinMint.RpcQueue.prototype.fetch = function(callback) {
  var that = this;
  var data = {};
  var benchmarkStart = +new Date();
  callback = ThinMint.Util.callback(callback);
  data.JSONRPC = JSON.stringify(this.getMethods());
  this.console.info("ThinMint.RpcQueue.run", "Requesting data for:", this.getMethods());
  var settings = jQuery.extend(true, {}, this.options, {
    data: data,
    success: function(response) {
      that.clearHandled();
      callback(null);
      jQuery.each(response, function(index, _response) {
        var _Request = that.getRequestInstance(_response.id);
        _Request.handleResponse(null, _response);
        that.addHandled(_response.id);
      });
      that.verifyResponse(response);
      that.console.debug("ThinMint.RpcQueue.run", "Finished in: " + (+new Date() - benchmarkStart) + "ms", that.getMethods());
    },
    error: function() {
      that.console.error("ThinMint.RpcQueue.run", "Request failed", arguments);
      callback("Request failed");
    }
  });
  jQuery.ajax(settings);
};

ThinMint.DrupalRequest = function(options) {
  ThinMint.Request.apply(this, arguments);
  if (Object.prototype.toString.call(this.options.args) !== "[object Array]") {
    this.options.args = [];
  }
  this.isCacheEnabled = true;
  if (typeof this.options.node !== "undefined") {
    if (typeof this.options.node !== "string") {
      this.console.error("ThinMint.DrupalRequest", "Options.node must be a string", arguments);
      return;
    }
    this.options.method = "endeca_content_result";
    this.options.dataType = "html";
    this.options.args.push(this.options.node);
  }
  if (typeof this.options.method !== "string") {
    this.console.error("ThinMint.DrupalRequest", "Options.method must be a string", arguments);
    return;
  }
  this.options.url += this.options.method;
  this.options.url += "/" + this.options.args.join("/");
};

ThinMint.DrupalRequest.prototype = Object.create(ThinMint.Request.prototype);

ThinMint.DrupalRequest.prototype.parent = ThinMint.Request.prototype;

ThinMint.DrupalRequest.prototype.options = jQuery.extend(true, {}, ThinMint.Request.prototype.options, {
  url: "/elc_api/"
});

ThinMint.DrupalRequest.prototype.EVENT_NAME = ".content.drupal";

ThinMint.DrupalRequest.prototype.handleResponse = function(err, data, response, callback, options) {
  this.parent.handleResponse.apply(this, arguments);
  if (typeof this.options.node === "string") {
    ThinMint.Page.Panel.trigger(this.options.node + this.EVENT_NAME, [ err, data ]);
  }
};

ThinMint.Panel = function($el, options) {
  var undefined;
  if (jQuery.isElement($el) === false) {
    this.console.error("ThinMint.Panel", "Must be a valid DOM element.", arguments);
    return;
  }
  if ($el.length !== 1) {
    this.console.error("ThinMint.Panel", "Only one element may exist per instance. If more than one of the same type of panel needs to exist on the page, use the [data-id] and [class] attributes in place of [id]. In the Controller, iterate over each panel DOM node and instantiate a new panel for each.", arguments);
    return;
  }
  if (typeof options === "undefined") {
    options = {};
  }
  if (jQuery.isPlainObject(options) === false) {
    this.console.error("ThinMint.Panel", "Options must be a plain object.", arguments);
    return;
  }
  ThinMint.Mixin.EventEmitter.call(this);
  this.options = options;
  if (typeof this.options.id !== "string" && $el.attr("id") === undefined) {
    var _id = $el.data("id");
    if (typeof _id === "string") {
      this.index = $el.index('[data-id="' + _id + '"]');
      this.options.id = _id + "--" + this.index;
    }
  }
  ThinMint.Page.Panel.add(this.options.id || $el.attr("id"), this);
  this.$el = $el;
  this.dom = {};
  this.template = null;
  this.templateData = {};
  this.init();
};

ThinMint.Panel.prototype.console = new ThinMint.Logger();

ThinMint.Panel.prototype.init = function() {
  this.console.info("ThinMint.Panel.init", "Base init called.", arguments);
};

ThinMint.Panel.prototype._destruct = function() {};

ThinMint.Panel.prototype.getDom = function() {};

ThinMint.Panel.prototype.bindDomEvents = function() {};

ThinMint.Panel.prototype.bindModelEvents = function() {};

ThinMint.Panel.prototype.render = function(data) {
  data = data || this.templateData;
  if (jQuery.isPlainObject(data) === false) {
    this.console.error("ThinMint.Panel.render", "TemplateData is required before rendering.");
    return;
  }
  var path = this.template;
  var template = ThinMint.Util.Mustache.getTemplate(path);
  if (template) {
    var output = ThinMint.Util.Mustache.render(template, data);
    var $newElement = jQuery(output);
    this.$el.replaceWith($newElement);
    this.$el = $newElement;
    if (typeof this.index === "number") {
      this.$el.addClass("index-" + this.index);
    }
    this.getDom();
    this.bindDomEvents();
    this.postRender();
  }
};

ThinMint.Panel.prototype.postRender = function() {};

ThinMint.Mixin = {};

ThinMint.Mixin.EventEmitter = function() {
  var _super = {};
  _super._destruct = ThinMint.Util.callback(this._destruct);
  this._events = [];
  this._destruct = function() {
    _super._destruct.apply(this, arguments);
    var that = this;
    jQuery.each(this._events, function(index, event) {
      that.off.apply(that, event);
    });
  };
  this._addEvent = function() {
    if (typeof arguments[0] !== "string" && jQuery.isPlainObject(arguments[0]) === false) {
      return;
    }
    var event = Array.prototype.slice.call(arguments);
    if (typeof event[0] === "string") {
      if (event.length == 4) {
        event.splice(2, 1);
      } else {
        if (event.length == 3 && typeof event[1] !== "function" && typeof event[1] !== "string") {
          event.splice(1, 1);
        }
      }
    } else {
      if (event.length == 3) {
        event.splice(2, 1);
      }
    }
    this._events.push(event);
  };
  this.on = function() {
    this._addEvent.apply(this, arguments);
    ThinMint.Page.Panel.on.apply(ThinMint.Page.Panel, arguments);
  };
  this.one = function() {
    this._addEvent.apply(this, arguments);
    ThinMint.Page.Panel.one.apply(ThinMint.Page.Panel, arguments);
  };
  this.off = function() {
    ThinMint.Page.Panel.off.apply(ThinMint.Page.Panel, arguments);
  };
  return this;
};

ThinMint.Mixin.Paginate = function() {
  var _super = {};
  _super.init = ThinMint.Util.callback(this.init);
  _super.getPage = ThinMint.Util.callback(this.getPage);
  _super.setPage = ThinMint.Util.callback(this.setPage);
  _super.getPages = ThinMint.Util.callback(this.getPages);
  _super.setPages = ThinMint.Util.callback(this.setPages);
  _super.pageNext = ThinMint.Util.callback(this.pageNext);
  _super.pagePrevious = ThinMint.Util.callback(this.pagePrevious);
  _super.pageTo = ThinMint.Util.callback(this.pageTo);
  _super.onPage = ThinMint.Util.callback(this.onPage);
  this.pageFirst = 1;
  this.page = 1;
  this.pages = 1;
  this.getPage = function() {
    return this.page;
  };
  this.setPage = function(page) {
    this.page = Number(page);
    return this;
  };
  this.getPages = function() {
    return this.pages;
  };
  this.setPages = function(pages) {
    this.pages = Number(pages);
    return this;
  };
  this.pageNext = function() {
    if (this.page >= this.pages) {
      this.console.warn("ThinMint.Mixin.Paginate", "Already at the max page.");
      return;
    }
    ++this.page;
    return this.onPage();
  };
  this.pagePrevious = function() {
    if (this.page <= this.pageFirst) {
      this.console.warn("ThinMint.Mixin.Paginate", "Already at the first page.");
      return;
    }
    --this.page;
    return this.onPage();
  };
  this.pageTo = function(page) {
    page = parseInt(page);
    if (page >= this.pages || page <= this.pageFirst) {
      this.console.warn("ThinMint.Mixin.Paginate", "Cannot go outside of the allowed pages.");
      return;
    }
    this.page = page;
    return this.onPage();
  };
  this.onPage = function() {
    _super.onPage.apply(this, arguments);
  };
  return this;
};