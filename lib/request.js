ThinMint = ThinMint || {};

ThinMint.Request = function(options) {
  this.options = jQuery.extend(true, {}, this.options, options);
  this._data = {};
  this.isCacheEnabled = false;
  this.cacheNamespace = 'ThinMint.Request';
  this.cacheTTL = 7200000;

  if(this.options.eventName) {
    this.setEventName( this.options.eventName );
  }

  if(this.options.console) {
    this.setConsole( this.options.console );
  }
};
ThinMint.Request.prototype.options = {};
ThinMint.Request.prototype.console = new ThinMint.Logger();

ThinMint.Request.prototype.setConsole = function(console) {
  if( (console instanceof ThinMint.Logger) === false) {
    this.console.error('ThinMint.Request.setConsole', 'Console must be an instance of ThinMint.Logger', arguments);
    return;
  }

  this.console = console;
};
ThinMint.Request.prototype.getEventName = function() {
  return this.eventName;
};
ThinMint.Request.prototype.setEventName = function(eventName) {
  if( typeof eventName !== 'string' ) {
    this.console.error('ThinMint.Request.setEventName', 'EventName must be a string.', arguments);
    return;
  }

  this.eventName = eventName;
};

ThinMint.Request.prototype._time = function() {
  this.console.time( this.getEventName() );
};
ThinMint.Request.prototype._timeEnd = function() {
  this.console.timeEnd( this.getEventName() );
};

ThinMint.Request.prototype.set = function(key, value) {
  if( typeof key === 'string') {
    this._data[key] = value;
  } else if( jQuery.isPlainObject(key) ) {
    this._data = jQuery.extend(true, {}, this._data, key);
  }
};
ThinMint.Request.prototype.get = function(key) {
  return this._data[key];
};

ThinMint.Request.prototype.save = function(data, callback) {
  var settings = {};

  if(typeof data === 'function') {
    callback = data;
    data = {};
  }
  callback = ThinMint.Util.callback( callback );

  settings.url = this.options.url;
  settings.data = jQuery.extend(true, {}, this._data, data);

  this._dispatch( settings, callback );
};

ThinMint.Request.prototype.destroy = function(data, callback) {
  var error = null;

  if(typeof data === 'function') {
    callback = data;
    data = {};
  }
  callback = ThinMint.Util.callback( callback );

  callback( error );
};

ThinMint.Request.prototype.run = function(callback) {
  this.console.warn('ThinMint.Request.run', 'The run method is deprecated. Use fetch instead.');
  this.fetch.apply(this, arguments);
};

ThinMint.Request.prototype.fetch = function(callback) {
  var that = this;

  callback = ThinMint.Util.callback( callback );
  this._dispatch( this.options, callback );
};

ThinMint.Request.prototype._dispatch = function(url, settings, callback, options) {
  var that = this;
  var cache = false;
  this._time();

  if( jQuery.isPlainObject(callback) ) {
    options = callback;
    callback = null;
  }

  if( typeof settings === 'function' ) {
    callback = settings;
    settings = null;
  }

  if( jQuery.isPlainObject(url) ) {
    settings = url;
    url = null;
  }

  callback = ThinMint.Util.callback( callback );
  settings = jQuery.isPlainObject(settings) ? settings : {};

  if( typeof url === 'string' ) {
    settings.url = url;
  }

  cache = this.getCache(settings);
  if( cache !== null ) {
    this.console.info('ThinMint.Request._dispatch', 'Returning cached contents.', settings);
    that.handleResponse.call(that, null, cache, null, callback, options);
    return;
  }

  jQuery.ajax( settings ).done(function(data, textStatus, jqXHR) {
    that.setCache(settings, data);
    that.handleResponse.call(that, null, data, jqXHR, callback, options);
  }).fail(function(jqXHR, textStatus, errorThrown) {
    var response = jqXHR.responseText;
    try {
      response = JSON.parse(response);
    } catch(e) {
    }
    that.handleResponse.call(that, errorThrown, response, jqXHR, callback, options);
  });
};

ThinMint.Request.prototype.getCacheKey = function(settings) {
  if( this.isCacheEnabled !== true ) {
    return false;
  }

  settings = jQuery.isPlainObject(settings) ? settings : {};
  var httpMethod = jQuery.trim(settings.type || settings.method || 'get').toLowerCase();
  var url = jQuery.trim(settings.url);
  var data = JSON.stringify(settings.data);
  var cacheKey = httpMethod + '.' + url + '.' + data;

  if(httpMethod !== 'get') {
    cacheKey = false;
  }

  return cacheKey;
};

ThinMint.Request.prototype.getCache = function(settings) {
  var cacheKey = this.getCacheKey(settings);
  if(cacheKey === false) {
    return null;
  }

  var cacheValue = ThinMint.Storage.getWithNamespace(this.cacheNamespace, cacheKey);

  return cacheValue;
};

ThinMint.Request.prototype.setCache = function(settings, response) {
  var cacheKey = this.getCacheKey(settings);

  if(cacheKey === false) {
    return false;
  }

  return ThinMint.Storage.setWithNamespace(this.cacheNamespace, cacheKey, response, this.cacheTTL);
};

ThinMint.Request.prototype.handleResponse = function(err, data, response, callback, options) {
  options = jQuery.isPlainObject(options) ? options : {};
  var _event = (typeof options.eventName !== 'undefined') ? options.eventName : this.getEventName();
  callback = ThinMint.Util.callback( callback );

  this.console.groupCollapsed('ThinMint.Request.handleResponse', _event);
  this.console.info(data);
  this.console.groupEnd();

  // An Emitter can be passed in as a configuration option in the future.
  // For now, use the ThinMint.Page.Panel
  if(typeof _event === 'string') {
    // XXX: Add a post-process method before triggering the event.

    ThinMint.Page.Panel.trigger( _event, [ err, data, response ] );
  } else {
    this.console.warn('ThinMint.Request.handleResponse', 'Method does not have an eventName to be triggered.', _event, response);
  }

  this._timeEnd();
  callback(err, data);
};

// ---

// Request Manager
ThinMint.RequestMethod = (function() {
  var that = {};
  var _methods = {};
  that.console = new ThinMint.Logger();

  that.add = function(methodName, _Request) {
    if( (_Request instanceof ThinMint.Request) === false ) {
      that.console.error('ThinMint.RequestMethod.add', '_Request must be a ThinMint.Request Object.', arguments);
      return;
    }

    // Do not use `get` here to avoid warnings being printed out to the console.
    if(typeof _methods[methodName] !== 'undefined') {
      that.console.info('ThinMint.RequestMethod.add', 'Method Name ('+methodName+') already exists. Overwriting...', arguments);
    }

    _methods[methodName] = _Request;
    return that;
  };

  that.get = function(methodName) {
    if(typeof _methods[methodName] !== 'undefined') {
      return _methods[methodName];
    }

    that.console.warn('ThinMint.RequestMethod.get', 'Method Name ('+methodName+') does not exist.', arguments);
    return null;
  };

  return that;
})();

// ---

ThinMint.RequestQueue = function() {
  this.requests = [];
};

ThinMint.RequestQueue.prototype.console = new ThinMint.Logger();

ThinMint.RequestQueue.prototype.add = function(_Request) {
  if( (_Request instanceof ThinMint.Request) === false
  &&  (_Request instanceof ThinMint.RpcQueue) === false) {
    this.console.error('RequestQueue.add', '_Request must be an instance of ThinMint.Request.', arguments);
    return;
  }

  this.requests.push(_Request);

  return this;
};

ThinMint.RequestQueue.prototype.run = function(callback) {
  var queue = ThinMint.Queue();
  callback = ThinMint.Util.callback( callback );

  jQuery.each(this.requests, function(index, request) {
    queue.add(function(seq) {
      request.fetch( seq.next );
    });
  });

  queue.onEnd = callback;
  queue.start();
};
