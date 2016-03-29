ThinMint.DrupalRequest = function(options) {
  ThinMint.Request.apply(this, arguments);

  if(Object.prototype.toString.call( this.options.args ) !== '[object Array]') {
    this.options.args = [];
  }

  this.isCacheEnabled = true;

  if(typeof this.options.node !== 'undefined') {
    if(typeof this.options.node !== 'string') {
      this.console.error('ThinMint.DrupalRequest', 'Options.node must be a string', arguments);
      return;
    }

    this.options.method = 'endeca_content_result';
    this.options.dataType = 'html';
    this.options.args.push(this.options.node);
  }

  if(typeof this.options.method !== 'string') {
    this.console.error('ThinMint.DrupalRequest', 'Options.method must be a string', arguments);
    return;
  }

  this.options.url += this.options.method;
  this.options.url += '/' + this.options.args.join('/');
};
ThinMint.DrupalRequest.prototype = Object.create(ThinMint.Request.prototype);
ThinMint.DrupalRequest.prototype.parent = ThinMint.Request.prototype;

ThinMint.DrupalRequest.prototype.options = jQuery.extend(true, {},
  ThinMint.Request.prototype.options, {
    url: '/elc_api/'
  }
);

ThinMint.DrupalRequest.prototype.EVENT_NAME = '.content.drupal';

ThinMint.DrupalRequest.prototype.handleResponse = function(err, data, response, callback, options) {
  this.parent.handleResponse.apply(this, arguments);

  if(typeof this.options.node === 'string') {
    ThinMint.Page.Panel.trigger( this.options.node + this.EVENT_NAME, [ err, data ] );
  }
};
