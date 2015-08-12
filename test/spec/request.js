QUnit.module('ThinMint.Request');

QUnit.test( 'RpcQueue, RpcRequest, DrupalRequest and RequestQueue', function( assert ) {
  assert.expect(4);
  var done1 = assert.async();
  var done2 = assert.async();
  var done3 = assert.async();
  var done4 = assert.async();

  jQuery.extend(true, ThinMint.Event, {
    DRUPAL_FETCH: 'drupal.request.content',
    DRUPAL_TRANSLATION_SET: 'drupal_translation.request.content',
    REQUEST_GITHUB: 'github.request.content'
  });

  ThinMint.RequestMethod.add('GitHub', new ThinMint.Request({
    eventName: ThinMint.Event.REQUEST_GITHUB,
    url: 'https://api.github.com',
    dataType: 'json'
  }));

  ThinMint.RequestMethod.add('Drupal.Fetch', new ThinMint.DrupalRequest({
    eventName: ThinMint.Event.DRUPAL_FETCH,
    node: '1'
  }));

  ThinMint.RequestMethod.add('Drupal.TranslationSet', new ThinMint.DrupalRequest({
    eventName: ThinMint.Event.DRUPAL_TRANSLATION_SET,
    method: 'elc_nodeblock',
    args: [1]
  }));

  // Fetch the Drupal nodes.
  var requestQueue = new ThinMint.RequestQueue();
  requestQueue.add(
    //rpcQueue
    ThinMint.RequestMethod.get('GitHub')
  ).add(
    ThinMint.RequestMethod.get('Drupal.Fetch')
  ).add(
    ThinMint.RequestMethod.get('Drupal.TranslationSet')
  );

  // Bind our events.
  ThinMint.Page.Panel.on(ThinMint.Event.REQUEST_GITHUB, function(event, err, data) {
    assert.ok( ( err == null && jQuery.isPlainObject(data) ), 'is the github event captured');
    done1();
  });
  ThinMint.Page.Panel.on(ThinMint.Event.DRUPAL_FETCH, function(event, err, data) {
    assert.ok( ( err == null && typeof data === 'string' ), 'is the drupal fetch event captured');
    done2();
  });
  ThinMint.Page.Panel.on(ThinMint.Event.DRUPAL_TRANSLATION_SET, function(event, err, data) {
    assert.ok( ( err == null && typeof data === 'string' ), 'is the drupal fetch event captured');
    done3();
  });

  requestQueue.run(function() {
    requestQueue = null;
    assert.ok(true, 'request queue is finished');
    done4();
  });
});
