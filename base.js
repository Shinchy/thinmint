/**
 * @license
 * ThinMint 0.0.2 <https://github.com/cloudily/thinmint>
 * Available under MIT license <https://raw.githubusercontent.com/cloudily/thinmint/master/LICENSE>
 */

var mustache = mustache || {};
var rb = rb || {};

jQuery.isElement = function(e) {
  try {
    return !( ! e.length || 1 != e.get(0).nodeType )
  } catch(t) {
    return !1
  }
};

jQuery.fn.serializeObject = function() {
  var obj = {};

  jQuery.each(this.serializeArray(), function(i, o) {
  var n = o.name,
    v = o.value;

  obj[n] = obj[n] === undefined ? v
    : jQuery.isArray( obj[n] ) ? obj[n].concat( v )
    : [ obj[n], v ];
  });

  return obj;
};

// ---

var ThinMint = {};
ThinMint.VERSION = '0.0.2';
ThinMint.Event = {
  MODEL_EXAMPLE: 'example.model.request'
};

ThinMint.Util = {};
ThinMint.Util.callback = function(callback) {
  return (typeof callback === 'function') ? callback : function() {};
};
ThinMint.Util.Mustache = {};
ThinMint.Util.Mustache.getTemplate = function(path) {
  if ( ! path || typeof path === 'object' ) {
    return null;
  };

  var templateKey = path.replace(/\//g, '___');
  var template = mustache[templateKey];

  if(template) {
    return template;
  }

  // Check to see if the path is an RB key in language.
  var rbSets = ['language', 'error_messages'];
  var i = 0;
  var rbSetsLength = rbSets.length;
  for(; i < rbSetsLength; i++) {
    var _bundle = rbSets[i];
    var _language = rb[ _bundle ];
    if( jQuery.isPlainObject( _language ) === false) {
      continue;
    }

    // Check if the path starts with 'rb.bundle_name.'
    if( path.indexOf('rb.' + _bundle + '.') === 0 ) {
      var languageKey = path.substr( 4 + _bundle.length );

      // Verify that the key exists and is a string.
      if( typeof _language[ languageKey ] === 'string' ) {
        return _language[ languageKey ];
      }
    }
  }

  console.error('ThinMint.Util.Mustache.getTemplate', 'Mustache template missing: ', path);

  try {
    if(generic.cookie('magic_mustache_unroll') == 1) {
      console.error('If experiencing issues, please disable mustache unroll: /shared/debug_magic_js.tmpl?magic_mustache_unroll=0');
    }
  } catch(e) {
  }

  return path;
};

ThinMint.Util.Mustache.render = function(template, data) {
  var response;
  data = jQuery.isPlainObject(data) ? data : {};
  data.rb = rb;

  try {
    response = Mustache.render(template, data, ThinMint.Util.Mustache.getTemplate);
  } catch(e) {
    console.error(template, data, e);
    response = template + '\n' + e.toString();
  }

  return response;
};

// ---

ThinMint.Page = {};
ThinMint.Page.getContainer = function() {
  // XXX: This needs to be moved.
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
   * Part of the event emitter. Use this to listen for a new event.
   */
  that.one = function() {
    if( typeof arguments[0] !== 'string'
    &&  jQuery.isPlainObject(arguments[0]) === false ) {
      console.error('ThinMint.Page.Panel.on', 'Event Name must be a string.', arguments);
      return;
    }

    messageBus.one.apply(messageBus, arguments);
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

