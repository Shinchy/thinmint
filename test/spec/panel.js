QUnit.module('ThinMint.Panel');
// Test Panel and Mixin

mustache = mustache || {};
mustache.___panel___test = '<div class="panel__test"><time>{{datetime}}</time></div>';

QUnit.test( 'create new panel, event trigger/capture, rendering with mustache', function( assert ) {
  var queue = ThinMint.Queue();
  var done = assert.async();
  var dateTimeEvent = 'datetime';
  var $panelTest = jQuery('<div id="panel__test"></div>');
  $panelTest.appendTo('body');

  ThinMint.Panel.Test = function($el, options) {
    // Call parent constructor.
    ThinMint.Panel.apply(this, arguments);
    //ThinMint.Mixin.User.call(this);
    //ThinMint.Mixin.LoyaltyUser.call(this);

    console.info('ThinMint.Panel.Test', 'Constructor called.', arguments);

    this.template = '/panel/test';
    this.templateData = {};

    this.getDom();
    this.bindDomEvents();

    ThinMint.Page.Panel.on(dateTimeEvent, jQuery.proxy( this.setDateTime, this ) );
  };
  ThinMint.Panel.Test.prototype = Object.create(ThinMint.Panel.prototype);
  ThinMint.Panel.Test.prototype.parent = ThinMint.Panel.prototype;

  ThinMint.Panel.Test.prototype.getDom = function() {
    // Define DOM pointers.

    this.dom.$time = jQuery('time', this.$el);
  };

  ThinMint.Panel.Test.prototype.bindDomEvents = function() {
    // Bind Events.

  };

  ThinMint.Panel.Test.prototype.setDateTime = function(event, err, data, response) {
    assert.ok(data.date instanceof Date, 'is the date passed to setDateTime an instance of Date');

    this.templateData.datetime = data.date;
    this.render();
  };

  ThinMint.Panel.Test.prototype.render = function() {
    if( typeof this.templateData.datetime === 'undefined' ) {
      console.error('ThinMint.Panel.Test.render', 'TemplateData datetime is required before rendering.');
      return;
    }

    this.parent.render.apply(this, arguments);
    //ThinMint.Panel.prototype.render.apply(this, arguments);
  };

  //

  ThinMint.Panel.TestChild = function($el, options) {
    ThinMint.Panel.Test.apply(this, arguments);
  };
  ThinMint.Panel.TestChild.prototype = Object.create(ThinMint.Panel.Test.prototype);

  ThinMint.Panel.TestChild.prototype.setDateTime = function(event, err, data, response) {
    assert.ok( this.parent === ThinMint.Panel.prototype, 'is ThinMint.Panel.TestChild.parent equal to ThinMint.Panel.prototype');
    ThinMint.Panel.Test.prototype.setDateTime.apply(this, arguments);
  };

  //

  new ThinMint.Panel.TestChild( jQuery('#panel__test') );

  var allPanels = ThinMint.Page.Panel.all();
  assert.notStrictEqual(
    typeof allPanels.panel__test,
    'undefined',
    'is allPanels.panel__test not undefined'
  );
  assert.ok(
    allPanels.panel__test instanceof ThinMint.Panel,
    'is allPanels.panel__test an instance of ThinMint.Panel'
  );
  assert.ok(
    allPanels.panel__test instanceof ThinMint.Panel.Test,
    'is allPanels.panel__test an instance of ThinMint.Panel.Test'
  );

  ThinMint.Page.Panel.trigger(dateTimeEvent, [ null, { date: new Date() } ]);

  assert.strictEqual(
    allPanels.panel__test.templateData.datetime.toString(),
    allPanels.panel__test.dom.$time.text(),
    'do the datetime values match'
  );
  assert.ok(
    allPanels.panel__test.templateData.datetime instanceof Date,
    'is allPanels.panel__test.templateData.datetime an instance of date'
  );

  allPanels.panel__test.$el.remove();
  done();
});
