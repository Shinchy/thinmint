#!/bin/bash

DIST="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SRC="$DIST/../src"
cd "$DIST/../"

uglifyjs --comments --beautify "indent-level=2,bracketize=true" --lint --output "dist/thinmint.js" \
  src/base.js \
  src/lib/queue.js \
  src/lib/storage.js \
  src/lib/router.js \
  src/lib/request.js \
  src/lib/rpc_request.js \
  src/lib/drupal_request.js \
  src/panel/panel.js \
  src/mixin/mixin.js \
  src/mixin/eventemitter.js

uglifyjs --comments --compress "sequences=true,properties=true,conditionals=true,comparisons=true,booleans=true,loops=true,hoist_funs=true,if_return=true,join_vars=true,cascade=true" --output "dist/thinmint.min.js" "dist/thinmint.js"
