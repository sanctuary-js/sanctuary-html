DOCTEST = node_modules/.bin/doctest --nodejs '--harmony' --module commonjs --prefix .
JSCS = node_modules/.bin/jscs
JSHINT = node_modules/.bin/jshint
NPM = npm
TRANSCRIBE = node_modules/.bin/transcribe
XYZ = node_modules/.bin/xyz --repo git@github.com:sanctuary-js/sanctuary-html.git --script scripts/prepublish


.PHONY: all
all: LICENSE README.md

.PHONY: LICENSE
LICENSE:
	cp -- '$@' '$@.orig'
	sed 's/Copyright (c) .* Sanctuary/Copyright (c) $(shell git log --date=format:%Y --pretty=format:%ad | sort -r | head -n 1) Sanctuary/' '$@.orig' >'$@'
	rm -- '$@.orig'

README.md: index.js
	$(TRANSCRIBE) \
	  --heading-level 4 \
	  --url 'https://github.com/sanctuary-js/sanctuary-html/blob/v$(VERSION)/{filename}#L{line}' \
	  -- $^ \
	| sed 's/<h4 name="\(.*\)#\(.*\)">\(.*\)\1#\2/<h4 name="\1.prototype.\2">\3\1#\2/' >'$@'


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


.PHONY: release-major release-minor release-patch
release-major release-minor release-patch:
	@$(XYZ) --increment $(@:release-%=%)


.PHONY: setup
setup:
	$(NPM) install


.PHONY: test
test:
	$(DOCTEST) -- index.js
