DOCTEST = node_modules/.bin/doctest --nodejs '--harmony' --module commonjs --prefix .
JSCS = node_modules/.bin/jscs
JSHINT = node_modules/.bin/jshint
NPM = npm


.PHONY: lint
lint:
	$(JSHINT) -- index.js test/index.js
	$(JSCS) -- index.js test/index.js
	@echo 'Checking for missing link definitions...'
	grep -o '\[[^]]*\]\[[^]]*\]' index.js \
	| sort -u \
	| sed -e 's:\[\(.*\)\]\[\]:\1:' \
	      -e 's:\[.*\]\[\(.*\)\]:\1:' \
	      -e '/0-9/d' \
	| xargs -I '{}' sh -c "grep '^//[.] \[{}\]: ' index.js"


.PHONY: setup
setup:
	$(NPM) install


.PHONY: test
test:
	$(DOCTEST) -- index.js
