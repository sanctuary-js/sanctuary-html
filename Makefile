DOCTEST = node_modules/.bin/doctest --nodejs '--harmony' --module commonjs --prefix .
JSCS = node_modules/.bin/jscs
JSHINT = node_modules/.bin/jshint
NPM = npm
REMARK = node_modules/.bin/remark --frail --no-stdout
TRANSCRIBE = node_modules/.bin/transcribe
XYZ = node_modules/.bin/xyz --repo git@github.com:sanctuary-js/sanctuary-html.git --script scripts/prepublish


.PHONY: all
all: LICENSE README.md

.PHONY: LICENSE
LICENSE:
	cp -- '$@' '$@.orig'
	sed 's/Copyright (c) .* Sanctuary/Copyright (c) $(shell git log --date=short --pretty=format:%ad | sort -r | head -n 1 | cut -d - -f 1) Sanctuary/' '$@.orig' >'$@'
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
	rm -f README.md
	VERSION=0.0.0 make README.md
	$(REMARK) \
	  --use remark-lint-no-undefined-references \
	  --use remark-lint-no-unused-definitions \
	  -- README.md
	git checkout README.md


.PHONY: release-major release-minor release-patch
release-major release-minor release-patch:
	@$(XYZ) --increment $(@:release-%=%)


.PHONY: setup
setup:
	$(NPM) install


.PHONY: test
test:
	$(DOCTEST) -- index.js
