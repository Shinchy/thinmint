var mustache = mustache || {};
var rb = rb || {};

jQuery.isElement = function(e) {
  try {
    return !( ! e.length || 1 != e.get(0).nodeType )
  } catch(t) {
    return !1
  }
};

// ---

var ThinMint = {};
ThinMint.Event = {
  RPC_USER: 'user.rpc.loyalty',
  RPC_LOYALTY_USER: 'loyalty_user.rpc.loyalty',
  RPC_LOYALTY_TRANSACTION: 'loyalty_transaction.rpc.loyalty',
  RPC_OFFERS_QUERY: 'offers_query.rpc.loyalty'
};

ThinMint.Util = {};
ThinMint.Util.callback = function(callback) {
  return (typeof callback === 'function') ? callback : function() {};
};
ThinMint.Util.Mustache = {};
ThinMint.Util.Mustache.getTemplate = function(path) {
  if (!path || typeof path === 'object') {
    return null;
  };

  var templateKey = path.replace(/\//g, '___');
  var template = mustache[templateKey];

  if (template) {
    return template;
  } else {
    console.error('ThinMint.Util.Mustache.getTemplate', 'Mustache template missing: ', path);
    try {
      if(generic.cookie('magic_mustache_unroll') == 1) {
        console.error('If experiencing issues, please disable mustache unroll: /shared/debug_magic_js.tmpl?magic_mustache_unroll=0');
      }
    } catch(e) {
    }
    return '';
  }
};

ThinMint.Util.Mustache.render = function(template, data) {
  data = jQuery.isPlainObject(data) ? data : {};
  data.rb = rb;

  return Mustache.render(template, data, ThinMint.Util.Mustache.getTemplate);
};

// ---

ThinMint.Page = {};
ThinMint.Page.getContainer = function() {
  return jQuery('#loyalty__content');
};
ThinMint.Page.Panel = (function() {
  var allPanels = {};
  var messageBus = jQuery({});
  var that = {};

  that.add = function(id, panel) {
    if(typeof id !== 'string') {
      console.error('ThinMint.Page.Panel.add', 'ID must be a string.', arguments);
      return;
    }

    if( (panel instanceof ThinMint.Panel) === false ) {
      console.error('ThinMint.Page.Panel.add', 'Panel must be an instance of ThinMint.Panel', arguments);
      return;
    }

    if( typeof allPanels[id] !== 'undefined') {
      console.info('ThinMint.Page.Panel.add', 'ID already exists ... overwriting', arguments);
      allPanels[id]._destruct();
      allPanels[id] = null;
      delete allPanels[id];
    }

    allPanels[id] = panel;

    return that;
  };

  that.get = function(id) {
    if( typeof allPanels[id] === 'undefined' ) {
      console.info('ThinMint.Page.Panel.get', 'Could not find ID.', arguments);
    }

    return allPanels[id];
  };

  that.all = function() {
    // Returning a non-cloned version means that its namespace can be modified.
    // This may or may not be necessary.
    return allPanels;
  };

  /**
   * Usage:
   * ThinMint.Page.Panel.trigger( 'loyalty.eventName', [ 'Param1', 'Param2' ] );
   */
  that.trigger = function() {
    if( typeof arguments[0] !== 'string' ) {
      console.error('ThinMint.Page.Panel.trigger', 'Event Name must be a string.', arguments);
      return;
    }

    return messageBus.trigger.apply(messageBus, arguments);
  };

  /**
   * Part of the event emitter. Use this to listen for new events.
   */
  that.on = function() {
    if( typeof arguments[0] !== 'string'
    &&  jQuery.isPlainObject(arguments[0]) === false ) {
      console.error('ThinMint.Page.Panel.on', 'Event Name must be a string.', arguments);
      return;
    }

    messageBus.on.apply(messageBus, arguments);
  };

  /**
   * Part of the event emitter. Use this to stop listening for new events.
   */
  that.off = function() {
    if( typeof arguments[0] !== 'string'
    &&  jQuery.isPlainObject(arguments[0]) === false ) {
      console.error('ThinMint.Page.Panel.off', 'Event Name must be a string.', arguments);
      return;
    }

    messageBus.off.apply(messageBus, arguments);
  };

  return that;
})();

// ---

