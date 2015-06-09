ThinMint.Panel.Example = function($el, options) {
  // Call parent constructor.
  ThinMint.Panel.apply(this, arguments);

  console.info('ThinMint.Panel.Example', 'Constructor called.', arguments);

  this.template = '/account/loyalty/panel/example';//mustache.___account___loyalty___panel___example;
  this.templateData = {};
  this.runner = null;

  this.getDom();

  // Bind an example listener for Account changes.
//  ThinMint.Page.Panel.on( ThinMint.Event.ACCOUNT, jQuery.proxy( this.setAccount, this ) );
};
ThinMint.Panel.Example.prototype = Object.create(ThinMint.Panel.prototype);//new ThinMint.Panel();
ThinMint.Panel.Example.prototype.parent = ThinMint.Panel.prototype;

ThinMint.Panel.Example.prototype.getDom = function() {
  this.dom.$module = jQuery('.loyalty-panel-example__module', this.$el);
  this.dom.$account = jQuery('.loyalty-panel-example__account', this.$el);
};

// Force clean-up when instance has been removed from the page.
ThinMint.Panel.Example.prototype._destruct = function() {
  this.clearModule();
};

ThinMint.Panel.Example.prototype.init = function() {
  // Call parent init method.
  this.parent.init.apply(this, arguments);

  console.info('ThinMint.Panel.Example.init', 'Init called.', arguments);
};

ThinMint.Panel.Example.prototype.render = function(data) {
  // Can do pre-rendering checks here.

  // Render the Panel.
  this.parent.render.apply(this, arguments);
};

//ThinMint.Panel.Example.prototype.setAccount = function(event, res) {
//  if(res.account) {
//    this.dom.$account.text( 'Hello ' + res.account.name + '.' ).show();
//  } else {
//    this.dom.$account.hide();
//  }
//};

ThinMint.Panel.Example.prototype.updateModule = function() {
  var that = this;

  this.runner = setInterval(function() {
    that.dom.$module.text( new Date() );
  }, 1000);
};

ThinMint.Panel.Example.prototype.clearModule = function() {
  clearInterval( this.runner );
  this.runner = null;
  this.dom.$module.empty();
};
