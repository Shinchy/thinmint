QUnit.module('ThinMint.Queue');
QUnit.test( 'async queue', function( assert ) {
  var queue = ThinMint.Queue();
  var done = assert.async();

  queue.add(function( seq ) {
    assert.ok(true, 'is first sequence of queue');
    setTimeout(seq.next, 5);
  });

  queue.add(function( seq ) {
    assert.ok(true, 'is second sequence of queue');
    setTimeout(seq.next, 1);
  });

  queue.onEnd = function() {
    assert.ok(true, 'is queue onEnd called');
    done();
    done = true;
  };

  queue.start();
  setTimeout(function() {
    if( done !== true ) {
      assert.ok(false, 'queue failed to complete');
      done();
    }
  }, 100);
});

QUnit.test( 'sync queue', function( assert ) {
  var queue = ThinMint.Queue();
  var done = assert.async();
  queue.async = false;

  queue.add(function( seq ) {
    assert.ok( queue.index === 0, 'is first sequence of queue');
    setTimeout(seq.next, 5);
  });

  queue.add(function( seq ) {
    assert.ok( queue.index === 1, 'is second sequence of queue');
    setTimeout(seq.next, 1);
  });

  queue.onEnd = function() {
    assert.ok( queue.index === 2, 'is queue onEnd called');
    done();
    done = true;
  };

  queue.start();
  setTimeout(function() {
    if( done !== true ) {
      assert.ok(false, 'queue failed to complete');
      done();
    }
  }, 100);
});

QUnit.test( 'sync queue abort', function( assert ) {
  var queue = ThinMint.Queue();
  var done = assert.async();
  queue.async = false;

  queue.add(function( seq ) {
    assert.ok( queue.index === 0, 'is first sequene of queue');
    setTimeout(function() {
      assert.ok(true, 'attempting to abort the queue');
      queue.abort();
    }, 5);
  });

  queue.add(function( seq ) {
    assert.ok( false, 'second sequence of queue should not have run');
    setTimeout(seq.next, 1);
  });

  queue.onEnd = function() {
    assert.ok( false, 'queue should not run onEnd');
  };

  queue.start();

  setTimeout(function() {
    assert.ok( (queue.index === -1 && queue.aborted === true), 'queue aborted correctly');
    done();
  }, 100);
});
