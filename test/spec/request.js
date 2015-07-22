QUnit.module('ThinMint.Request');

QUnit.test( 'RpcQueue, RpcRequest, DrupalRequest and RequestQueue', function( assert ) {
  assert.expect(5);
  var done1 = assert.async();
  var done2 = assert.async();
  var done3 = assert.async();
  var done4 = assert.async();
  var done5 = assert.async();

  ThinMint.Event.DRUPAL_FETCH = 'somerandomevent';
  ThinMint.RequestMethod.add('Drupal.Fetch', new ThinMint.DrupalRequest({
    eventName: ThinMint.Event.DRUPAL_FETCH,
    node: '1'
  }));

  // Get the necessary data for the page.
  var rpcQueue = new ThinMint.RpcQueue();
  rpcQueue.add(
    ThinMint.RequestMethod.get('User')
  ).add(
    ThinMint.RequestMethod.get('Loyalty.User')
  ).add(
    ThinMint.RequestMethod.get('Offers.Query')
  );

  // Fetch the Drupal nodes.
  var requestQueue = new ThinMint.RequestQueue();
  requestQueue.add(
    rpcQueue
  ).add(
    ThinMint.RequestMethod.get('Drupal.Fetch')
  );

  // Bind our events.
  ThinMint.Page.Panel.on(ThinMint.Event.DRUPAL_FETCH, function(event, err, data) {
    assert.ok( ( err == null && typeof data === 'string' ), 'is the drupal fetch event captured');
    done1();
  });
  ThinMint.Page.Panel.on(ThinMint.Event.RPC_USER, function(event, err, data) {
    assert.ok( ( err == null && jQuery.isPlainObject(data) ), 'is the rpc user event captured');
    done2();
  });
  ThinMint.Page.Panel.on(ThinMint.Event.RPC_LOYALTY_USER, function(event, err, data) {
    assert.ok( ( err == null && jQuery.isPlainObject(data) ), 'is the rpc loyalty user event captured');
    done3();
  });
  ThinMint.Page.Panel.on(ThinMint.Event.RPC_OFFERS_QUERY, function(event, err, data) {
    assert.ok( ( err == null && jQuery.isPlainObject(data) ), 'is the rpc offers query event captured');
    done4();
  });

  requestQueue.run(function() {
    rpcQueue = null;
    assert.ok(true, 'request queue is finished');
    done5();
  });
});
