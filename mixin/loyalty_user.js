ThinMint.Mixin.LoyaltyUser = function() {
  var _super = {};
  _super.init = this.init;
  _super.render = this.render;
  _super.postRender = this.postRender;

  this.setLoyaltyAccount = function(event, err, data, response) {
    this.templateData.loyalty_account = data;

    // XXX: Fake loyalty data.
    try {
      this.templateData.loyalty_account.user.is_loyalty_member = 1;
    } catch(e) {
    }

    this.render();
  };

//  this.init = function() {
//    _super.init.apply(this, arguments);
//  };

  this.render = function() {
    if( typeof this.templateData.loyalty_account === 'undefined' ) {
      console.error('ThinMint.Mixin.LoyaltyUser.render', 'TemplateData LoyaltyAccount is required before rendering.');
      return;
    }

    _super.render.apply(this, arguments);
  };

  this.postRender = function() {
    _super.postRender.apply(this, arguments);

    // Attach account or guest data to this panel.
    if( jQuery.isPlainObject(this.templateData.loyalty_account) ) {
      if( this.templateData.loyalty_account.user.is_loyalty_member ) {
        this.$el.addClass('is-member');
      }
    }
  };

  // Define our listener.
  ThinMint.Page.Panel.on(ThinMint.Event.RPC_LOYALTY_USER, jQuery.proxy( this.setLoyaltyAccount, this ) );

  return this;

};
