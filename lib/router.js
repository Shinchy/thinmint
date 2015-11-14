ThinMint = ThinMint || {};

ThinMint.Router = (function(location, undefined) {
  var _routes = [];
  var _mode = null;
  var _root = '/';
  var _host = null;

  var that = {};

  that.add = function(re, handler) {
    if(typeof re == 'function') {
      handler = re;
      re = '';
    }

    _routes.push({
      re: re,
      handler: handler
    });

    return that;
  };

  that.remove = function(param) {
    for(var i = 0, r; i < _routes.length, r = _routes[i]; i++) {
      if(r.handler === param || r.re === param) {
        _routes.splice(i, 1);
        return that;
      }
    }

    return that;
  };

  that.flush = function() {
    _routes = [];
    _mode = null;
    _root = '/';
    return that;
  };

  that.clearSlashes = function(path) {
    return path.toString().replace(/\/$/, '').replace(/^\//, '');
  };

  that.config = function(options) {
    _mode = (options && options.mode && options.mode == 'history' && !!(history.pushState)) ? 'history' : 'hash';
    _root = (options && options.root) ? '/' + that.clearSlashes(options.root) + '/' : '/';
    return that;
  };

  that.getFragment = function() {
    var fragment = '';
    if(_mode === 'history') {
      if( ! location) {
        return '';
      }

      fragment = that.clearSlashes(decodeURI(location.pathname + location.search));
      fragment = fragment.replace(/\?(.*)$/, '');
      fragment = (_root != '/') ? fragment.replace(_root, '') : fragment;
    } else {
      if( ! window) {
        return '';
      }

      var match = location.href.match(/#(.*)$/);
      fragment = match ? match[1] : '';
    }

    return that.clearSlashes(fragment);
  };

  that.listen = function(loopInterval) {
    var current = that.getFragment();
    var fn = function() {
      if(current !== that.getFragment()) {
        current = that.getFragment();
        that.check(current);
      }
    }

    clearInterval(that.interval);
    that.interval = setInterval(fn, loopInterval || 50);
    return that;
  };

  that.check = function(f) {
    var fragment = f || that.getFragment();
    for(var i = 0; i < _routes.length; i++) {
      var match = fragment.match(_routes[i].re);

      if(match) {
        match.shift();
        _routes[i].handler.apply(_host || {}, match);
        return that;
      }
    }

    return that;
  };

  that.navigate = function(path) {
    path = path ? path : '';
    if(_mode === 'history') {
      history.pushState(null, null, _root + that.clearSlashes(path));
    } else {
      location.href.match(/#(.*)$/);
      location.href = location.href.replace(/#(.*)$/, '') + '#' + path;
    }

    return that;
  };

  return that;
})(window.location);
