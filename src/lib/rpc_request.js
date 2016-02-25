ThinMint.RpcRequest = function(options) {
  this.options = {
    url: '/rpc/jsonrpc.tmpl',
    data: { JSONRPC: '' },
    method: null,
    params: [],
    eventName: false,
    save: {
      eventName: false,
      method: null,
      httpMethod: 'POST'
    },
    destroy: {
      eventName: false,
      method: null,
      httpMethod: 'POST'
    }
  };

  ThinMint.Request.apply(this, arguments);

  if(this.options.method) {
    this.setMethod( this.options.method );
  }
  if(this.options.params) {
    this.setParams( this.options.params );
  }
};
ThinMint.RpcRequest.prototype = Object.create(ThinMint.Request.prototype);
ThinMint.RpcRequest.prototype.parent = ThinMint.Request.prototype;

ThinMint.RpcRequest.prototype.setMethod = function(method) {
  if( typeof method !== 'string' ) {
    this.console.error('ThinMint.RpcRequest.setMethod', 'Method must be a string.', arguments);
    return this;
  }

  this.method = method;
  return this;
};
ThinMint.RpcRequest.prototype.setParams = function(params) {
  if( jQuery.isArray(params) === false ) {
    this.console.error('ThinMint.RpcRequest.setParams', 'Params must be an array.', arguments);
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

  if(typeof data === 'function') {
    callback = data;
    data = {};
  }
  callback = ThinMint.Util.callback( callback );

  settings = this._constructRequest('save', data);
  this._dispatch( settings, callback, { eventName: this.options.save.eventName } );
};

ThinMint.RpcRequest.prototype._constructRequest = function(method, data) {
  var query = this.getQuery();
  var settings = {};
  var querystring = { dbgmethod: this.options[method].method };

  query.id = 1;
  query.method = this.options[method].method;
  query.params[0] = jQuery.extend(true, {}, query.params[0], data);

  settings.url = this.options.url;
  settings.url += (settings.url.indexOf('?') > -1 ? '&' : '?') + jQuery.param(querystring);
  settings.type = this.options[method].httpMethod;
  settings.data = {};
  settings.data.JSONRPC = JSON.stringify( [query] );

  return settings;
};

ThinMint.RpcRequest.prototype.destroy = function(data, callback) {
  var settings = {};

  if(typeof data === 'function') {
    callback = data;
    data = {};
  }
  callback = ThinMint.Util.callback( callback );

  settings = this._constructRequest('destroy', data);
  this._dispatch( settings, callback, { eventName: this.options.destroy.eventName } );
};

ThinMint.RpcRequest.prototype.fetch = function(callback) {
  var query = this.getQuery();
  query.id = 1;

  this.options.data.dbgmethod = query.method;
  this.options.data.JSONRPC = JSON.stringify( [query] );

  this.parent.fetch.apply(this, arguments);
};
ThinMint.RpcRequest.prototype.handleResponse = function(err, data, response, callback, options) {
  if( jQuery.isArray(data) ) {
    data = data[0];
  }

  // XXX: This should go in the RpcRequest method to be handled before calling the parent method.
  // XXX: This method will fire the appropriate events.
  if( typeof data.error !== 'undefined' ) {
    // Oh no.
    this.console.error('ThinMint.Request.handleResponse', data.error.code, data.error.message, data.error.data.messages);
    err = data.error;
  }

  this.parent.handleResponse.call(this, err, data.result.value, response, callback, options);
};

// ---

ThinMint.RpcQueue = function() {
  this.id = 1;
  this.methods = [];
  this.handled = [];
  this._RequestInstance = {};
};
ThinMint.RpcQueue.prototype.console = new ThinMint.Logger();
ThinMint.RpcQueue.prototype.add = function(_Request) {
  if( (_Request instanceof ThinMint.RpcRequest) === false) {
    this.console.error('ThinMint.RpcQueue.add', '_Request must be a ThinMint.RpcRequest Object.', arguments);
    return;
  }

  var method = _Request.getQuery();
  method.id = this.id++;
  this.console.info('ThinMint.RpcQueue.add', method);

  this.methods.push( method );
  this._RequestInstance[ method.id ] = _Request;

  return this;
};
ThinMint.RpcQueue.prototype.getRequestInstance = function(id) {
  return this._RequestInstance[ id ];
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
  return (this.handled.indexOf(id) > -1);
};
ThinMint.RpcQueue.prototype.clearHandled = function() {
  this.handled = [];
  return this;
};
ThinMint.RpcQueue.prototype.verifyResponse = function(response) {
  var that = this;
  // If the response comes back, but doesn't match the number of requests
  // that we batched, log an error and fire error responses
  // for each of the other requests.
  if(jQuery.isArray(response) && that.getMethodsLength() != response.length) {
    this.console.error('ThinMint.RpcQueue.run', 'Response mismatch.  Expected ' + that.getMethodsLength() + ' and received ' + response.length);

    jQuery.each(that.getMethods(), function(index, method) {
      if(that.isHandled(method.id)) {
        return;
      }

      var _Request = that.getRequestInstance( method.id );
      _Request.handleResponse( "Response missing from RpcQueue", { result: {} } );
    });
  }
};
ThinMint.RpcQueue.prototype.run = function(callback) {
  this.console.warn('ThinMint.RpcQueue.run', 'The run method is deprecated. Use fetch instead.');
  this.fetch.apply(this, arguments);
};
ThinMint.RpcQueue.prototype.fetch = function(callback) {
  var that = this;
  var data = {};
  var benchmarkStart = +(new Date());

  callback = ThinMint.Util.callback( callback );

  data.JSONRPC = JSON.stringify( this.getMethods() );
  this.console.info('ThinMint.RpcQueue.run', 'Requesting data for:', this.getMethods());

  jQuery.ajax({
    type: 'POST',
    url: '/rpc/jsonrpc.tmpl',
    data: data,
    success: function(response) {
      that.clearHandled();
      callback(null);

      // Map the responses back to their respective Request instances.
      jQuery.each(response, function(index, _response) {
        var _Request = that.getRequestInstance( _response.id );
        _Request.handleResponse( null, _response );
        that.addHandled( _response.id );
      });

      that.verifyResponse(response);

      that.console.debug('ThinMint.RpcQueue.run', 'Finished in: ' + (+(new Date())-benchmarkStart) + 'ms', that.getMethods());
    },
    error: function() {
      that.console.error('ThinMint.RpcQueue.run', 'Request failed', arguments);
      callback('Request failed');
    }
  });
};
