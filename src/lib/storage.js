ThinMint = ThinMint || {};

ThinMint.Storage = (function(store) {
  var that = {}
    , namespace = ""
    , getDate
    , expiresSuffix = ".expires"
    , expiresKey;

  getDate = function() {
    return +(new Date());
  };

  expiresKey = function(key) {
    return key+expiresSuffix;
  };

  if(store == false) {
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
      var i = 0
        , match;

      jQuery.each(this.data, function(key) {
        if(i++ == index) {
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
    var i
      , key
      , value
      , l = store.length
      , data = {};

    for(i = 0; i < l; i++) {
      key = store.key(i);
      data[key] = that.get(key);
    }
    return data;
  };

  that.set = function(key, value, expiresMs) {
    key = namespace+key;
    if(typeof store[key] === "function") {
      return console.error(key+" is function.");
    }

    try {
      var data = store.setItem(key, JSON.stringify(value));
      if(typeof expiresMs !== "undefined") {
        store.setItem(expiresKey(key), (getDate() + expiresMs));
      }
      return data;
    } catch(e) {
      that.gc();
      //if(e == QUOTA_EXCEEDED_ERR) {
        //alert('Quota exceeded!');
      //}
    }
  };

  that.get = function(key) {
    key = namespace+key;
    var expires = store.getItem(expiresKey(key));
    if(expires && getDate() > expires) {
      that.destroy(key);
      that.destroy(expiresKey(key));
    }

    return JSON.parse(store.getItem(key));
  };

  that.destroy = function(key) {
    key = namespace+key;
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
    if(typeof count !== "number") {
      count = 1;
    }

    var result = that.get(key);

    if( ! result) {
      return;
    }

    // XXX: Should we check expires key here?
    return that.set(key, (+(result) + count));
  };

  /* Namespaces */
  that.getNamespace = function(ns) {
    var key = getDate();
    var result = that.get(ns);

    if(result) {
      return result;
    }

    that.set(ns, key);
    return key;
  };

  that.setWithNamespace = function(ns, key, val, expiresMs) {
    var ns = that.getNamespace(ns);
    return that.set(ns+"."+key, val, expiresMs);
  };

  that.getWithNamespace = function(ns, key) {
    var ns = that.getNamespace(ns);
    return that.get(ns+"."+key);
  };

  that.clearNamespace = function(ns) {
    return that.increment(ns);
  };

  that.gc = function() {
    var i
      , key
      , value
      , expiresLength = expiresSuffix.length
      , place
      , l = store.length;

    for(i = 0; i < l; i++) {
      key = store.key(i);
      if(key) {
        place = key.lastIndexOf(expiresSuffix);
        if(place > -1 && (key.length-expiresLength) === place) {
          // Get expires both the key and expiration key if invalid.
          that.get(key.substr(0, place));
        }
      }
    }
  };

  return that;
}(typeof localStorage !== "undefined" && localStorage));
