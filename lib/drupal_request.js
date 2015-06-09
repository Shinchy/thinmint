ThinMint.DrupalRequest = function(options) {
  ThinMint.Request.apply(this, arguments);

  this.options.dataType = 'html';

  if( typeof this.options.node !== 'string') {
    console.error('ThinMint.DrupalRequest', 'Options.node must be a string', arguments);
    return;
  }

  this.options.url += this.options.node;
};
ThinMint.DrupalRequest.prototype = Object.create(ThinMint.Request.prototype);
ThinMint.DrupalRequest.prototype.parent = ThinMint.Request.prototype;

ThinMint.DrupalRequest.prototype.options.url = '/elc_api/endeca_content_result/';
ThinMint.DrupalRequest.prototype.EVENT_NAME = '.content.drupal';

ThinMint.DrupalRequest.prototype.handleResponse = function(err, res) {
  this.parent.handleResponse.apply(this, arguments);

  ThinMint.Page.Panel.trigger( this.options.node + this.EVENT_NAME, [ err, res ] );
};
