ThinMint.Mixin.User = function() {
  var _super = {};
  _super.init = this.init;
  _super.render = this.render;
  _super.postRender = this.postRender;

  this.setAccount = function(event, err, data, response) {
    this.templateData.account = data;
    // XXX: Fake account sign-in.
    this.templateData.account.signed_in = true;
    this.render();
  };

  this.render = function() {
    if( typeof this.templateData.account === 'undefined' ) {
      console.error('ThinMint.Mixin.LoyaltyUser.render', 'TemplateData LoyaltyAccount is required before rendering.');
      return;
    }

    _super.render.apply(this, arguments);
  };

  this.postRender = function() {
    _super.postRender.apply(this, arguments);

    // Attach account or guest data to this panel.
    if( jQuery.isPlainObject(this.templateData.account) ) {
      if( this.templateData.account.signed_in ) {
        this.$el.addClass('is-user');
      } else {
        this.$el.addClass('is-guest');
      }
    }
  };

  // Define our listener.
  ThinMint.Page.Panel.on(ThinMint.Event.RPC_USER, jQuery.proxy( this.setAccount, this ) );

  return this;

};
