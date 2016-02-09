# ThinMint v0.0.8

* [Views / Templates](#views-templates)
* [Layout](#views-templates)
* [Panel](#panel)
* [Routes](#routes)
* [Controlers](#controllers)
* [Models](#request-models)
* [Logging](#logging)

<a name="views-templates"></a>
## Views / Templates
Views are broken up into two pieces: **Layouts** and **Panels**

In the Loyalty project, these templates respectively live in the following directories:

```
/tmpl/any/account/loyalty/layout/
/tmpl/any/account/loyalty/panel/
```
<a name="layout"></a>
## Layout
Layout pages contain mustache includes for each of the individual panels for that page.  Each Layout is also tied to its own Controller that is responsible for getting the Layout, instantiating the panels on that page, and calling the appropriate Models in order to get the necessary data to the Panels.

This is an example of an index.mustache Layout for the Loyalty project:

```html
<div id="loyalty__page__index">
  {{> /account/loyalty/panel/example}}
  {{> /account/loyalty/panel/points}}
  {{> /account/loyalty/panel/offers}}
  {{> /account/loyalty/panel/benefits}}
  {{> /account/loyalty/panel/how_to_earn}}
</div>
```

<a name="panel"></a>
## Panel
Panels are independent of one another and can exist on one or many pages.  Each page may be comprised of multiple panels.  If a panel will only ever exist once on page, then an [id] attribute should be used on the main element.

```html
<section id="loyalty__panel__points">
  <div class="loyalty__panel__points__status">
    <span>{{rb.language.loyalty_panel_points_my_status}}</span>
    <span>{{rb.language.loyalty_panel_points_tier}} {{loyalty_account.loyalty_level_current.level}}</span>
  </div>

  <div class="loyalty__panel__points__title">{{rb.language.loyalty_panel_points_my_points}}</div>

  <div class="loyalty__panel__points__available">
    <div class="loyalty__panel__points__available-inner">
      <strong class="loyalty__panel__points__available-title">{{rb.language.loyalty_panel_points_points_available}}</strong>
      <div class="loyalty__panel__points__available-amount">{{loyalty_account.loyalty_level_current.points.available}}</div>
    </div>

    <a href="#history" class="loyalty__panel__points__history-link">{{rb.language.loyalty_panel_points_points_history}}</a>
  </div>

  <div class="loyalty__panel__points__pending">
    <div class="loyalty__panel__points__pending-inner">
      <em class="loyalty__panel__points__pending-title">{{rb.language.loyalty_panel_points_points_pending}}</em>
      <div class="loyalty__panel__points__pending-amount">{{loyalty_account.loyalty_level_current.points.pending}}</div>
    </div>

    <span class="loyalty__panel__points__pending-annotation">
      {{rb.language.loyalty_panel_points_points_pending_disclaimer}}
    </span>
  </div>
</section>
```

### Appears more than once

If necessary, a Panel can exist on the same page more than once.  Use the `[class]` and `[data-id]` attributes on the main element:

```html
<section class="loyalty__panel__join" data-id="loyalty__panel__join">
 …
</section>
```

For panels that have both `[class]` and `[data-id]` attributes and are missing the `[id]` attribute, the Panel base class will automatically assign a zero-based index `[id]` attribute to each of the Panels in the order in which they display.  For example, if our Layout includes two of the `loyalty_panel_join` elements, this is how the `[id]` attributes will be assigned:

```html
<section class="loyalty__panel__join" data-id="loyalty__panel__join" id="loyalty__panel__join--0">
 …
</section>

<section id="loyalty__panel__points">
 …
</section>

<section id="loyalty__panel__how-to-earn">
 …
</section>

<section class="loyalty__panel__join" data-id="loyalty__panel__join" id="loyalty__panel__join--1">
 …
</section>
```

### Base Panel

The Panel constructor accepts two arguments, `(jQuery) $el` and `(object) options`

#### Properties

* `$el` jQuery DOM element pointer passed into the constructor.
* `options` Object containing options that pertain to the panel.
* `dom` Object that contains pointers to the DOM nodes that interest this panel.
* `template` String that points to the mustache template location for this panel.
* `templateData` Object that contains all of the data that is necessary to render the panel.

#### Methods

* `getDom` Use this method to fetch and store your DOM nodes for this panel.
* `bindDomEvents` Contains definition for event binding for DOM nodes.  Need to capture click, submit, focus or other events?  This is the method where those event binds should live.
* `render` Contains instructions on how to render this panel.  The base panel does everything from fetching the `template`, passing `templateData` into the rendering engine, calling `postRender`, `getDom`, and finally `bindDomEvents` in that order.
* `postRender` This method allows you to manipulate the DOM for the panel prior to calling `getDom` and `bindDomEvents`.

### Panel Mixins
These allow you to have functionality in one place that applies to many panels for code reusability and ease-of-maintenance.  Writing a mixin is fairly straightforward, just be sure to include any references to parent/super methods if overriding and call those parent methods when necessary.

Below is an example of a `LoyaltyUser` mixin.  It provides functionality to Panels that are interested in knowing whether or not the current user is a member of the loyalty program.  It defines a listener within the constructor that is interested in the `RPC_LOYALTY_USER` event.  When this event happens, it calls the `setLoyaltyAccount` method.  That method properly adds the loyalty account information to the `templateData` property object that is part of all Panel classes.  Our mixin now has the loyalty account data and would like to render the view.

Within our render method in the `LoyaltyUser` mixin, we add a check to make sure loyalty account data is available before spending resources to render the view.  It then calls the parent render method and while continuing up the chain, each render method implementation can demand that certain data is present before continuing.  This prevents us from rendering the panel without having all of the necessary data.

The postRender method in this mixin checks if this particular user is part of the loyalty program.  If they are, then it adds an `is-member` class to the parent element, else nothing happens.

```javascript
ThinMint.Mixin.LoyaltyUser = function() {
  var _super = {};
  _super.init = this.init;
  _super.render = this.render;
  _super.postRender = this.postRender;

  this.setLoyaltyAccount = function(event, err, data, response) {
    this.templateData.loyalty_account = data;

    this.render();
  };

  this.render = function() {
    // Can control the rendering flow here. Not necessary
    // to render this panel if we do not have sufficient data.
    if( typeof this.templateData.loyalty_account === 'undefined' ) {
      this.console.error('ThinMint.Mixin.LoyaltyUser.render', 'TemplateData LoyaltyAccount is required before rendering.');
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
```

### Panel Example (Transaction History)

```javascript
ThinMint.Panel.Transactions = function($el, options) {
  // Call parent constructor.
  ThinMint.Panel.apply(this, arguments);
  ThinMint.Mixin.User.call(this);
  ThinMint.Mixin.LoyaltyUser.call(this);
  ThinMint.Mixin.Paginate.call(this);

  this.console.info('ThinMint.Panel.Transactions', 'Constructor called.', arguments);

  this.template = '/account/loyalty/panel/transactions';
  this.templateData = {};
  this.transactionDateFormat = 'mm/dd/yy';

  this.getDom();
  this.bindDomEvents();

  ThinMint.Page.Panel.on(ThinMint.Event.RPC_LOYALTY_TRANSACTION, jQuery.proxy( this.setTransactions, this ) );
};
ThinMint.Panel.Transactions.prototype = Object.create(ThinMint.Panel.prototype);
ThinMint.Panel.Transactions.prototype.parent = ThinMint.Panel.prototype;

ThinMint.Panel.Transactions.prototype.getDom = function() {
  // Define DOM pointers.

  this.dom.$pageNext = jQuery('.loyalty__panel__transactions__list__paginate__page-next', this.el);
  this.dom.$pagePrevious = jQuery('.loyalty__panel__transactions__list__paginate__page-previous', this.el);
};

ThinMint.Panel.Transactions.prototype.bindDomEvents = function() {
  // Bind Events.

  this.dom.$pageNext.on('click', jQuery.proxy( this.pageNext, this ) );
  this.dom.$pagePrevious.on('click', jQuery.proxy( this.pagePrevious, this ) );
};

// Force clean-up when instance has been removed from the page.
ThinMint.Panel.Transactions.prototype._destruct = function() {
};

ThinMint.Panel.Transactions.prototype.init = function() {
  // Call parent init method.
  this.parent.init.apply(this, arguments);

  this.console.info('ThinMint.Panel.Transactions.init', 'Init called.', arguments);
};

ThinMint.Panel.Transactions.prototype.onPage = function() {
  this.console.log( this.getPage() );
};

ThinMint.Panel.Transactions.prototype.setTransactions = function(event, err, data, response) {
  var that = this;
  if(err) {
    this.console.error('ThinMint.Panel.Transactions', 'Problem with the transactions response', err);
    return;
  }

  var transactions = [];
  jQuery.each(data.loyalty_transactions, function(index, transaction) {
    if('transaction' === transaction.type) {
      transaction.loyalty_points_spent = false;
      transaction.loyalty_points_earned = false;
      transaction.date_pretty = dateFormat(transaction.date, that.transactionDateFormat);

      if('Purchase' === transaction.transaction_type) {
        // Points have been spent.
        transaction.loyalty_points_spent = true;
      } else {
        // Points have been earned.
        transaction.loyalty_points_earned = true;
      }
    }

    transactions.push(transaction);
  });

  this.templateData.transactions = transactions;

  // Render the Transaction panel.
  this.render();
};
```

### How to Extend Transaction History

```javascript
ThinMint.Panel.TransactionsChild = function($el, options) {
  // Call parent constructor.
  ThinMint.Panel.Transactions.apply(this, arguments);

  this.console.info('ThinMint.Panel.TransactionsChild', 'Constructor called.', arguments);

  this.transactionDateFormat = 'dddd, mmmm d, yyyy';
};
ThinMint.Panel.TransactionsChild.prototype = Object.create(ThinMint.Panel.Transactions.prototype);

ThinMint.Panel.TransactionsChild.prototype.init = function() {
  // Call parent init method.
  ThinMint.Panel.Transactions.prototype.init.apply(this, arguments);

  this.console.info('ThinMint.Panel.TransactionsChild.init', 'Init called.', arguments);
};

ThinMint.Panel.TransactionsChild.prototype.setTransactions = function(event, err, data, response) {
  // Alternate handling of the transaction data.
  this.templateData.transactions = data.loyalty_transactions;

  // Render the Transaction panel.
  this.render();
};
```

<a name="routes"></a>
## Routes
Our Routes are loaded when the DOM is ready.  Routes are defined using regular expressions in javascript.  You can match variables that may exist in the path and have them passed via the event that is triggered.  In the example below, the following routes will trigger the History Page event:

```
/history
/history/page/2
/history/page/50
```

The Router.config mode property can be set to `history` in order to use HTML5 history.pushstate. In order to use this mode, you will have to notify the sysadmins to create a rewrite rule to point all routes to the main page that is served by Perl.

```javascript
jQuery(function() {

// mode: 'hash' => onhashchange
// mode: 'history' => html5 pushstate
Router.config({ mode: 'hash' });
//Router.navigate();

// HISTORY --
Router.add(/^history(?:\/page\/(\d+?))?$/, function() {

  ThinMint.Page.Panel.trigger(ThinMint.Event.PAGE_HISTORY, arguments);

// REWARDS --
}).add(/^rewards$/, function() {

  ThinMint.Page.Panel.trigger(ThinMint.Event.PAGE_REWARDS, arguments);

// POINTS --
}).add(/^points$/, function() {

  ThinMint.Page.Panel.trigger(ThinMint.Event.PAGE_POINTS, arguments);

// ABOUT --
}).add(/^about$/, function() {

  ThinMint.Page.Panel.trigger(ThinMint.Event.PAGE_ABOUT, arguments);

// FAQ --
}).add(/^faq$/, function() {

  ThinMint.Page.Panel.trigger(ThinMint.Event.PAGE_FAQ, arguments);

// INDEX (HOME) --
}).add(function() {

  ThinMint.Page.Panel.trigger(ThinMint.Event.PAGE_INDEX, arguments);

}).check().listen();

}); // jQuery dom:ready
```

<a name="controllers"></a>
## Controllers
Controllers listen for a Page event to happen.  These events are triggered by the Router.  They are responsible for fetching and rendering the layout to the page, instantiating the Panels that exist on that page, and getting the data required by those panels.  Once all of those tasks are finished, the Layout can then be shown to the user.

```javascript
ThinMint.Page.Panel.on(ThinMint.Event.PAGE_INDEX, function(event) {
  var $layout = ThinMint.Page.getContainer().hide();

  // Render the index layout.
  var template = ThinMint.Util.Mustache.getTemplate('/account/loyalty/layout/index');
  var output = ThinMint.Util.Mustache.render(template);
  $layout.html(output);

  // Instantiate the Panels.
  new ThinMint.Panel.Offers( jQuery('#loyalty__panel__offers') );
  new ThinMint.Panel.Benefits( jQuery('#loyalty__panel__benefits') );
  new ThinMint.Panel.HowToEarn( jQuery('#loyalty__panel__how-to-earn') );
  new ThinMint.Panel.Points( jQuery('#loyalty__panel__points') );

  // Support for adding more than one of the same panel:
  jQuery('.loyalty__panel__join').each(function() {
    new ThinMint.Panel.Join( jQuery(this) );
  });

  // Get the necessary data for the page.
  var rpcQueue = new RequestQueue();
  rpcQueue.add(
    RequestMethod.get('User')
  ).add(
    RequestMethod.get('Loyalty.User')
  ).add(
    RequestMethod.get('Offers.Query')
  );

  rpcQueue.run(function() {
    rpcQueue = null;
    $layout.show();
  });
});
```

### Want to fetch a Drupal Node as well?

```javascript
  // Get the necessary data for the page.
  var rpcQueue = new ThinMint.RpcQueue();
  rpcQueue.add(
    ThinMint.RequestMethod.get('User')
  ).add(
    ThinMint.RequestMethod.get('Loyalty.User')
  );

  // Fetch the Drupal nodes.
  var requestQueue = new ThinMint.RequestQueue();
  requestQueue.add(
    rpcQueue
  ).add(
    ThinMint.RequestMethod.get('Drupal.FAQ')
  );

  requestQueue.run(function() {
    requestQueue = null;
    rpcQueue = null;

    $layout.show();
  });
```

<a name="request-models"></a>
## JSON-RPC Queue
** Needs to be updated **
Located in `thinmint/lib/request.js`, this file has the definitions for a Base Request class, Request Manager via RequestMethod, and a Request Queue via RequestQueue.  The Model definitions currently live in `thinmint/model/*.js`

### Add an RPC request to the request manager
```javascript
ThinMint.RequestMethod.add('Loyalty.User', new ThinMint.RpcRequest({
  eventName: ThinMint.Event.RPC_LOYALTY_USER,
  method: 'loyalty.user.get'
}));
```

### Add a Drupal request to fetch a Drupal node
```javascript
// Path: /elc_api/endeca_content_result/{node}
ThinMint.RequestMethod.add('Drupal.FAQ', new ThinMint.DrupalRequest({
  eventName: ThinMint.Event.DRUPAL_FAQ,
  node: ThinMint.DRUPAL.FAQ
}));
```

### Alternatively, you can fetch JSON from Drupal
```javascript
// Path: /elc_api/{method}/{args}.join('/')
// e.g. /elc_api/elc_nodeblock/{node_id}
ThinMint.RequestMethod.add('Drupal.TranslationSet', new ThinMint.DrupalRequest({
  eventName: ThinMint.Event.DRUPAL_TRANSLATION_SET,
  method: 'elc_nodeblock',
  args: [node_id]
}));
```

<a name="logging"></a>
## Logging
Include these definitions in `your_app_constants.js` on `dom:ready`. Here are a few examples to illustrate how you can tune the logging for various aspects of your application.  By design, the children classes for `ThinMint.Request` and `ThinMint.Panel` inherit the `Logger` class.  To override, you must instantiate a new `Logger` for the children if you would like to change their logging behaviors.

##### Disable logging entirely
```
ThinMint.Logger.off()
```

##### Only log errors
```
ThinMint.Logger.off().on('error');
```

##### Disable info and warn for everything
```
ThinMint.Logger.off('info', 'warn');
```

##### Disable info for Request and children; disable logging for DrupalRequest entirely
```
ThinMint.Request.prototype.console.off('info');
ThinMint.DrupalRequest.prototype.console = ( new ThinMint.Logger() ).off();
```

##### Disable all logging for the Transaction History panel
```
ThinMint.Panel.Transactions.prototype.console = ( new ThinMint.Logger() ).off();
```

##### Disable all logging except for the Transaction History panel
```
ThinMint.Logger.off();
ThinMint.Panel.Transactions.prototype.console = ( new ThinMint.Logger() ).on()

// In case you would also like to see logs from Request
ThinMint.Request.prototype.console.on('log', 'info');
```

# Include Order

```
# Libraries

thinmint/base.js
thinmint/panel.js
thinmint/lib/queue.js
thinmint/lib/router.js
thinmint/lib/request.js
thinmint/lib/rpc_request.js
thinmint/lib/drupal_request.js

# Mixins

thinmint/mixin.js

# Models

// thinmint/model/example.js

# Panels

// thinmint_panel_example.js

# Your Libraries

*your_app_constants.js*
*your_app_libs.js*

# Your Mixins

*your_app_mixins.js*

# Your Models

*your_app_models.js*

# Your Panels

*your_app_panels.js*

# Your Controllers

*your_app_controllers.js*

# Router (must be last)

*your_app_routes.js*
````
