# Rounded Web App Icons

Скругляет квадратные иконки установленных веб-приложений в доке, сетке приложений и переключателе окон. Файлы иконок не меняются. Уже скруглённые иконки не обрезаются. Проверено на GNOME Shell 51.1.

Rounds hard-square web-app icons in the GNOME Shell dash, app grid, search and window switcher. Icons whose corners are already transparent are left alone, so Chrome, Telegram and an already-shaped PWA are not cropped.

The mask is a shader on the icon actor. Icon files on disk are not modified, so a browser update cannot undo it.

Tested on GNOME Shell 51.1 / Wayland.

## What is recognized

Installed web apps from:

- Chrome, Chromium, Brave, Edge, Vivaldi, Opera and Yandex Browser (`chrome-<id>-Default.desktop` and the other Chromium prefixes)
- GNOME Web (`org.gnome.Epiphany.WebApp-…`)
- Firefox via PWAsForFirefox (`FFPWA-…`)

Other desktop-file ids or prefixes can be added in preferences.

## Preferences

- Corner radius, 0–40 percent of the icon size. 22 is the default. 0 turns the mask off. The cap is 40 so a circular icon is not cropped.
- Skip icons that are already shaped. On by default.
- Only web applications. Turn this off to round every hard-square icon.
- Extra application ids, comma-separated.

## Install

    make pack
    gnome-extensions install --force dist/rounded-webapp-icons@netsvetaev.dev.shell-extension.zip

On Wayland, GNOME Shell discovers a newly installed extension at the next login. Log out and back in, then enable it. Do not restart the compositor.

## Publishing on extensions.gnome.org

Pushing a tag publishes a new version. The workflow uses the same API as `gnome-extensions upload` in GNOME 51. Review is still manual: the version is not public until a reviewer accepts it.

One-time setup. The account is the extensions.gnome.org account, not the GitHub account. Uploading accepts the terms at https://extensions.gnome.org/upload/.

    gh secret set EGO_USERNAME --repo netsvetoch/rounded-webapp-icons
    gh secret set EGO_PASSWORD --repo netsvetoch/rounded-webapp-icons

Each release:

1. Raise the integer `version` in `metadata.json`. extensions.gnome.org rejects a version that is not higher than the last upload.
2. Set `version-name` to the same number the tag will use, without the leading `v`.
3. Commit, then push the tag:

    git tag v1.0.0
    git push origin v1.0.0

The tag must be `v` plus `version-name`. The workflow tests, builds the zip, uploads it, and attaches the zip to a GitHub release. Re-run a failed upload from the Actions tab with the same tag; do not reuse a `version` integer.

`shell-version` is `51` only. Do not claim older versions without running them.

The extension is GPL-2.0-or-later, which extensions.gnome.org requires. `disable()` restores `Shell.App.prototype.create_icon_texture` and removes the shader.

## Development

    make test        # policy and icon-corner checks, no Shell
    make shell-test  # headless GNOME Shell 51, including a pixel check of the mask

`Shell.App.create_icon_texture` is private. The wrapper is installed only in `enable()` and removed in `disable()`.
