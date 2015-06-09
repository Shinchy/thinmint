ThinMint.RpcRequest = function(options) {
  this.options = {
    method: null,
    params: [],
    eventName: false
  };

  ThinMint.Request.apply(this, arguments);

  if(this.options.method) {
    this.setMethod( this.options.method );
  }
  if(this.options.params) {
    this.setParams( this.options.params );
  }


};
ThinMint.RpcRequest.prototype = Object.create(ThinMint.Request.prototype);//new ThinMint.Panel();
ThinMint.RpcRequest.prototype.parent = ThinMint.Request.prototype;

ThinMint.RpcRequest.prototype.setMethod = function(method) {
  if( typeof method !== 'string' ) {
    console.error('ThinMint.RpcRequest.setMethod', 'Method must be a string.', arguments);
    return;
  }

  this.method = method;
};
ThinMint.RpcRequest.prototype.setParams = function(params) {
  if( jQuery.isArray(params) === false ) {
    console.error('ThinMint.RpcRequest.setParams', 'Params must be an array.', arguments);
    return;
  }

  this.params = params;
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
ThinMint.RpcRequest.prototype.handleResponse = function(err, res) {
  // XXX: This should go in the RpcRequest method to be handled before calling the parent method.
  // XXX: This method will fire the appropriate events.
  if( typeof res.error !== 'undefined' ) {
    // Oh no.
    console.error('ThinMint.Request.handleResponse', res.error.code, res.error.message, res.error.data.messages);
    err = res.error;
  }

  // An Emitter can be passed in as a configuration option in the future.
  // For now, use the ThinMint.Page.Panel
//  if(typeof _event === 'string') {
//    // XXX: Add a post-process method before triggering the event.
//
//    ThinMint.Page.Panel.trigger( _event, [ err, res.result.value, res ] );
//  } else {
//    console.warn('ThinMint.Request.handleResponse', 'Method does not have an eventName to be triggered.', _event, res);
//  }

  this.parent.handleResponse.call(this, err, res.result.value, res);
};

// ---

ThinMint.RpcQueue = function() {
  this.id = 1;
  this.methods = [];
  this._RequestInstance = {};
};
ThinMint.RpcQueue.prototype.add = function(_Request) {
  if( (_Request instanceof ThinMint.RpcRequest) === false) {
    console.error('ThinMint.RpcQueue.add', '_Request must be a ThinMint.RpcRequest Object.', arguments);
    return;
  }

  var method = _Request.getQuery();
  method.id = this.id++;
  console.info('ThinMint.RpcQueue.add', method);

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
  this._RequestInstance = {};
};
ThinMint.RpcQueue.prototype.run = function(callback) {
  var that = this;
  var data = {};
  var benchmarkStart = +(new Date());

  callback = ThinMint.Util.callback( callback );

  data.JSONRPC = JSON.stringify( this.methods );
  console.info('ThinMint.RpcQueue.run', 'Requesting data for:', this.methods);

  jQuery.ajax({
    type: 'POST',
    url: '/rpc/jsonrpc.tmpl',
    data: data,
    success: function(response) {
      callback(null);

      // Map the responses back to their respective Request instances.
      jQuery.each(response, function(index, _response) {
        var _Request = that.getRequestInstance( _response.id );
        _Request.handleResponse( null, _response );
      });

      console.debug('ThinMint.RpcQueue.run', 'Finished in: ' + (+(new Date())-benchmarkStart) + 'ms', that.methods);
    },
    error: function() {
      console.error('ThinMint.RpcQueue.run', 'Request failed', arguments);
      callback('Request failed');
    }
  });
};
