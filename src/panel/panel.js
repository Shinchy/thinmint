ThinMint.Panel = function($el, options) {
  var undefined;

  if( jQuery.isElement($el) === false ) {
    this.console.error('ThinMint.Panel', 'Must be a valid DOM element.', arguments);
    return;
  }

  if( $el.length !== 1 ) {
    this.console.error('ThinMint.Panel', 'Only one element may exist per instance. If more than one of the same type of panel needs to exist on the page, use the [data-id] and [class] attributes in place of [id]. In the Controller, iterate over each panel DOM node and instantiate a new panel for each.', arguments);
    return;
  }

  if( typeof options === 'undefined' ) {
    options = {};
  }

  if(jQuery.isPlainObject(options) === false) {
    this.console.error('ThinMint.Panel', 'Options must be a plain object.', arguments);
    return;
  }

  ThinMint.Mixin.EventEmitter.call(this);

  this.options = options;

  // If options.id isn't available and there is not an ID attribute
  // available for the panel, then use the data-id attribute to create one.
  if( typeof this.options.id !== 'string' && $el.attr('id') === undefined ) {
    var _id = $el.data('id');

    if( typeof _id === 'string' ) {
      // Determine where this panel exists in relation to panels of the same type.
      this.index = $el.index('[data-id="' + _id + '"]');
      // Assign an ID to this panel, so it does not overwrite panels of the same type.
      this.options.id = _id + '--' + this.index;
    }
  }

  ThinMint.Page.Panel.add( this.options.id || $el.attr('id'), this );

  this.$el = $el;
  this.dom = {};
  this.template = null;
  this.templateData = {};
  this.init();
};

ThinMint.Panel.prototype.console = new ThinMint.Logger();

ThinMint.Panel.prototype.init = function() {
  this.console.info('ThinMint.Panel.init', 'Base init called.', arguments);
};

ThinMint.Panel.prototype._destruct = function() {
};

ThinMint.Panel.prototype.getDom = function() {
};

ThinMint.Panel.prototype.bindDomEvents = function() {
};

ThinMint.Panel.prototype.bindModelEvents = function() {
};

ThinMint.Panel.prototype.render = function(data) {
  data = data || this.templateData;

  if( jQuery.isPlainObject(data) === false ) {
    this.console.error('ThinMint.Panel.render', 'TemplateData is required before rendering.');
    return;
  }

  var path = this.template;
  var template = ThinMint.Util.Mustache.getTemplate(path);

  if(template) {
    var output = ThinMint.Util.Mustache.render(template, data);

    // Create DOM for the new template.
    var $newElement = jQuery(output);
    // Replace the existing element.
    this.$el.replaceWith($newElement);
    // Update the pointer for the new element.
    this.$el = $newElement;
    // If an index is available, it means multiple
    // panels of the same type exist. Update the DOM
    // with the index.
    if(typeof this.index === 'number') {
      this.$el.addClass( 'index-' + this.index );
    }
    // Update the DOM pointers.
    this.getDom();
    // Bind event listeners.
    this.bindDomEvents();
    // Run any post-render changes.
    this.postRender();
  };
};

ThinMint.Panel.prototype.postRender = function() {
};
