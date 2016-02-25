ThinMint.Mixin.EventEmitter = function() {

  var _super = {};
  _super._destruct = ThinMint.Util.callback( this._destruct );

  this._events = [];

  this._destruct = function() {
    _super._destruct.apply(this, arguments);

    var that = this;

    // How to unbind all events associated.
    jQuery.each(this._events, function(index, event) {
      that.off.apply(that, event);
    });
  };

  this._addEvent = function() {
    if( typeof arguments[0] !== 'string'
    &&  jQuery.isPlainObject(arguments[0]) === false ) {
      return;
    }

    var event = Array.prototype.slice.call(arguments);

    // Determine if the `data` param has been passed and remove
    // since it doesn't apply to the event `off` method.
    if(typeof event[0] === 'string') {
      if(event.length == 4) {
        event.splice(2, 1);
      } else if(event.length == 3
      && typeof event[1] !== 'function'
      && typeof event[1] !== 'string') {
        event.splice(1, 1);
      }
    } else if(event.length == 3) {
      event.splice(2, 1);
    }

    // XXX: Should this push the event that is being added to an array?
    // On destruct, those events could be iterated over and unbound.
    this._events.push( event );
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
