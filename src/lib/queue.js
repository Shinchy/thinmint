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

    if(typeof(that.onStart) === "function") {
      that.onStart();
    }

    if(that.async == true) {
      if(that.list.length > 0) {
        that.index = 0;
        // If we're doing it in parallel, then call all of the functions.
        for(i = 0; i < that.list.length; i++) {
          var currFunction = that.list[i];
          if(typeof(currFunction) === "function") {
            currFunction(that);
          }
        }
      } else {
        that.next();
      }
    } else {
      // Do it in a series.
      that.next();
    }
  };

  that.end = function(err) {
    if(typeof(that.onEnd) === "function") {
      that.onEnd(err);
    }

    that.finished = true;
  };

  that.next = function() {
    if(that.aborted) {
      return;
    }

    if(++that.index == that.list.length) {
      return that.end();
    }

    if(that.async == false) {
      var currFunction = that.list[that.index];
      if(currFunction) {
        if(that.async === false) {
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
