QUnit.module('ThinMint.Storage');
QUnit.test( 'set, get, destroy, and expires', function( assert ) {
  var storage = ThinMint.Storage;
  var key = 'unit_test_key';
  var value = true;
  var valueObj = { a: 1 };
  var done = assert.async();

  storage.set(key, value);
  assert.strictEqual( storage.get(key), value, 'is `'+key+'` set to the correct value');

  storage.destroy(key);
  assert.strictEqual( storage.get(key), null, 'is `'+key+'` unset');

  storage.set(key, valueObj);
  var keyObj = storage.get(key);
  assert.deepEqual( valueObj, keyObj, 'is `'+key+'` is set to an object and matches the original');
  storage.destroy(key);

  storage.set(key, value, 5);

  assert.strictEqual( storage.get(key), value, 'is `'+key+'` with expire time set to the correct value');

  setTimeout(function() {
    assert.strictEqual( storage.get(key), null, 'has `'+key+'` expired');

    storage.gc();
    done();
  }, 6);
});

QUnit.test( 'setWithNamespace, getNamespace, getWithNamespace, clearNamespace, and expires', function( assert ) {
  var storage = ThinMint.Storage;
  var namespace = 'unit_test';
  var key = 'key';
  var value = true;
  var key2 ='key2';
  var value2 = 1;
  var valueObj = { a: 1 };
  var done = assert.async();

  storage.setWithNamespace(namespace, key, value);
  storage.setWithNamespace(namespace, key2, value2);
  assert.strictEqual( storage.getWithNamespace(namespace, key), value, 'is `'+key+'` set to the correct value');
  assert.strictEqual( storage.getWithNamespace(namespace, key2), value2, 'is `'+key2+'` set to the correct value');

  var nsVal = storage.getNamespace(namespace);
  assert.strictEqual( typeof nsVal, 'number', 'namespace value is a unix timestamp ('+(new Date(nsVal))+')');

  storage.clearNamespace(namespace);
  assert.strictEqual( storage.getWithNamespace(namespace, key), null, 'is `'+key+'` unset');
  assert.strictEqual( storage.getWithNamespace(namespace, key2), null, 'is `'+key2+'` unset');

  storage.setWithNamespace(namespace, key, valueObj, 5);
  var keyObj = storage.getWithNamespace(namespace, key);
  assert.deepEqual( valueObj, keyObj, 'is `'+key+'` with expire time set to an object and matches the original');

  setTimeout(function() {
    assert.strictEqual( storage.getWithNamespace(namespace, key), null, 'has `'+key+'` expired');
    storage.clearNamespace(namespace);

    storage.gc();
    done();
  }, 6);
});
