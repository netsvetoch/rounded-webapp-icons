.PHONY: test pack shell-test install

UUID := rounded-webapp-icons@netsvetaev.dev
ROOT := $(CURDIR)
ARCHIVE := $(ROOT)/dist/$(UUID).shell-extension.zip
SCHEMA := schemas/org.gnome.shell.extensions.rounded-webapp-icons.gschema.xml
export TMPDIR := /home/netsvetoch/.hermes/cache/scratch

test:
	gjs -m tests/policy.test.js
	gjs -m tests/corners.test.js
	glib-compile-schemas --strict schemas/

pack: test
	mkdir -p dist
	gnome-extensions pack --force --out-dir=dist \
		--schema=$(SCHEMA) \
		--extra-source=policy.js \
		--extra-source=effect.js \
		--extra-source=corners.js \
		--extra-source=LICENSE \
		.

shell-test: pack
	ROUNDED_WEBAPP_SCREENSHOT="$(ROOT)/dist/mask-test.png" \
	dbus-run-session -- gnome-shell-test-tool --headless --extension "$(ARCHIVE)" \
		"$(ROOT)/tests/shell.test.js" > dist/shell-test.log 2>&1 || { printf 'FAIL: see dist/shell-test.log\n'; exit 1; }
	python3 -c 'from pathlib import Path; print("\n".join(line for line in Path("dist/shell-test.log").read_text().splitlines() if line.startswith(("PASS ", "PIXELS "))))'

install: pack
	gnome-extensions install --force "$(ARCHIVE)"
