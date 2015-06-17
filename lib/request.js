ThinMint = ThinMint || {};

ThinMint.Request = function(options) {
  this.options = jQuery.extend(true, {}, this.options, options);
  this._data = {};

  if(this.options.eventName) {
    this.setEventName( this.options.eventName );
  }
};
ThinMint.Request.prototype.options = {};
ThinMint.Request.prototype.getEventName = function() {
  return this.eventName;
};
ThinMint.Request.prototype.setEventName = function(eventName) {
  if( typeof eventName !== 'string' ) {
    console.error('ThinMint.Request.setEventName', 'EventName must be a string.', arguments);
    return;
  }

  this.eventName = eventName;
};

ThinMint.Request.prototype._time = function() {
  console.time( this.getEventName() );
};
ThinMint.Request.prototype._timeEnd = function() {
  console.timeEnd( this.getEventName() );
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

ThinMint.Request.prototype.destroy = function(callback) {
  var error = null;
  callback = ThinMint.Util.callback( callback );

  callback( error );
};

ThinMint.Request.prototype.run = function(callback) {
  console.warn('ThinMint.Request.run', 'The run method is deprecated. Use fetch instead.');
  this.fetch.apply(this, arguments);
};

ThinMint.Request.prototype.fetch = function(callback) {
  var that = this;

  callback = ThinMint.Util.callback( callback );
  this._dispatch( this.options, callback );
};

ThinMint.Request.prototype._dispatch = function(url, settings, callback, options) {
  var that = this;
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

  jQuery.ajax( settings ).done(function(data, textStatus, jqXHR) {
    that.handleResponse.call(that, null, data, jqXHR, callback, options);
  }).fail(function(jqXHR, textStatus, errorThrown) {
    that.handleResponse.call(that, errorThrown, jqXHR.responseText, jqXHR, callback, options);
  });
};

ThinMint.Request.prototype.handleResponse = function(err, data, response, callback, options) {
  options = jQuery.isPlainObject(options) ? options : {};
  var _event = (typeof options.eventName !== 'undefined') ? options.eventName : this.getEventName();
  callback = ThinMint.Util.callback( callback );
  console.info('ThinMint.Request.handleResponse', _event, data);

  // An Emitter can be passed in as a configuration option in the future.
  // For now, use the ThinMint.Page.Panel
  if(typeof _event === 'string') {
    // XXX: Add a post-process method before triggering the event.

    ThinMint.Page.Panel.trigger( _event, [ err, data, response ] );
  } else {
    console.warn('ThinMint.Request.handleResponse', 'Method does not have an eventName to be triggered.', _event, response);
  }

  this._timeEnd();
  callback(err, data);
};

// ---

// Request Manager
ThinMint.RequestMethod = (function() {
  var that = {};
  var _methods = {};

  that.add = function(methodName, _Request) {
    if( (_Request instanceof ThinMint.Request) === false ) {
      console.error('ThinMint.RequestMethod.add', '_Request must be a ThinMint.Request Object.', arguments);
      return;
    }

    if(that.get(methodName) !== null) {
      console.info('ThinMint.RequestMethod.add', 'Method Name ('+methodName+') already exists. Overwriting...', arguments);
    }

    _methods[methodName] = _Request;
    return that;
  };

  that.get = function(methodName) {
    if(typeof _methods[methodName] !== 'undefined') {
      return _methods[methodName];
    }

    console.warn('ThinMint.RequestMethod.get', 'Method Name ('+methodName+') does not exist.', arguments);
    return null;
  };

  return that;
})();

// ---

ThinMint.RequestQueue = function() {
  this.requests = [];
};

ThinMint.RequestQueue.prototype.add = function(_Request) {
  if( (_Request instanceof ThinMint.Request) === false
  &&  (_Request instanceof ThinMint.RpcQueue) === false) {
    console.error('RequestQueue.add', '_Request must be an instance of ThinMint.Request.', arguments);
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
