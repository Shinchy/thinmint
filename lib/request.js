ThinMint = ThinMint || {};

ThinMint.Request = function(options) {
  this.options = jQuery.extend(true, {}, this.options, options);

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

ThinMint.Request.prototype.run = function(callback) {
  var that = this;

  this._time();
  callback = ThinMint.Util.callback( callback );

  jQuery.ajax( this.options ).done(function(data, textStatus, jqXHR) {
    var args = Array.prototype.slice.call(arguments);
    // Set error arg to null.
    args.unshift(null);

    that.handleResponse.apply(that, args);
    callback();
  }).fail(function(jqXHR, textStatus, errorThrown) {
    var args = Array.prototype.slice.call(arguments);
    // Set error to the errorThrown argument.
    args.unshift(errorThrown);

    that.handleResponse.apply(that, args);
    callback();
  });
};

ThinMint.Request.prototype.handleResponse = function(err, data, response) {
  var _event = this.getEventName();
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
      request.run( seq.next );
    });
  });

  queue.onEnd = callback;
  queue.start();
};
