# ThinMint

## Views / Templates
Views are broken up into two pieces: Layouts and Panels

In the Loyalty project, these templates respectively live in the following directories:

```
/tmpl/any/account/loyalty/layout/
/tmpl/any/account/loyalty/panel/
```

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

If necessary, a Panel can exist on the same page more than once.  Use the [class] and [data-id] attributes on the main element:

```html
<section class="loyalty__panel__join" data-id="loyalty__panel__join">
 …
</section>
```

For panels that have both [class] and [data-id] attributes and are missing the [id] attribute, the Panel base class will automatically assign a zero-based index [id] attribute to each of the Panels in the order in which they display.  For example, if our Layout includes two of the "loyalty_panel_join" elements, this is how the [id] attributes will be assigned:

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

## Routes
Our Routes are loaded when the DOM is ready.  Routes are defined using regular expressions in javascript.  You can match variables that may exist in the path and have them passed via the event that is triggered.  In the example below, the following routes will trigger the History Page event:

```
/history
/history/page/2
/history/page/50
```

The Router.config mode property can be set to 'history' in order to use HTML5 history.pushstate. In order to use this mode, you will have to notify the sysadmins to create a rewrite rule to point all routes to the main page that is served by Perl.

```javascript
jQuery(function() {

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

## JSON-RPC Queue
Located in js/shared/site/thinmint/lib/request.js, this file has the definitions for a Base Request class, Request Manager via RequestMethod, and a Request Queue via RequestQueue.  The Model definitions currently live in js/shared/site/thinmint/model/*.js  MORE INFORMATION

```javascript
RequestMethod.add('Loyalty.User', new Request({
  eventName: ThinMint.Event.RPC_LOYALTY_USER,
  method: 'loyalty.user.get'
}));
```

## Base Panel


## Panel Mixins
These allow you to have functionality in one place that applies to many panels for code reusability and ease-of-maintenance.  Writing a mixin is fairly straightforward, just be sure to include any references to parent/super methods if overriding and call those parent methods when necessary.

Below is an example of a LoyaltyUser mixin.  It provides functionality to Panels that are interested in knowing whether or not the current user is a member of the loyalty program.  It defines a listener within the constructor that is interested in the RPC_LOYALTY_USER event.  When this event happens, it calls the setLoyaltyAccount method.  That method properly adds the loyalty account information to the templateData object that is part of all Panel classes.  Our mixin now has the loyalty account data and would like to render the view.

Within our render method in the LoyaltyUser mixin, we add a check to make sure loyalty account data is available before spending resources to render the view.  It then calls the parent render method and while continuing up the chain, each render method implementation can demand that certain data is present before continuing.  This prevents us from rendering the panel without having all of the necessary data.

The postRender method in this mixin checks if this particular user is part of the loyalty program.  If they are, then it adds an 'is-member' class to the parent element, else nothing happens.

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
```
