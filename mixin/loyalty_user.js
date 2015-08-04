ThinMint.Mixin.LoyaltyUser = function() {
  var _super = {};
  _super.init = this.init;
  _super.render = this.render;
  _super.postRender = this.postRender;

  this.setLoyaltyAccount = function(event, err, data, response) {
    this.templateData.loyalty_account = data;

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
    try {
      if( this.templateData.loyalty_account.user_state.signed_in
       && this.templateData.loyalty_account.user.is_loyalty_member ) {
        this.$el.addClass('is-member');
      }
    } catch(e) {
    }
  };

  // Define our listener.
  ThinMint.Page.Panel.on(ThinMint.Event.RPC_LOYALTY_USER, jQuery.proxy( this.setLoyaltyAccount, this ) );

  return this;

};
