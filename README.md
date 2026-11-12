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

The zip from `make pack` is the upload. It contains the extension sources, the GSettings schema and `LICENSE`, and does not contain tests or this README.

Before the first upload:

1. Push this repository to https://github.com/netsvetoch/rounded-webapp-icons (the `url` in `metadata.json`).
2. Upload `dist/rounded-webapp-icons@netsvetaev.dev.shell-extension.zip`.
3. Add a screenshot of the dash. `make shell-test` writes a mask close-up to `dist/mask-test.png`; the store screenshot should show the dock.
4. `shell-version` is `51` only. Do not claim older versions without running them: Shell 49+ uses `Cogl.Snippet`, older versions do not.
5. Bump the integer `version` in `metadata.json` for every upload. It must increase, even when `version-name` does not.

The extension is GPL-2.0-or-later, which extensions.gnome.org requires. `disable()` restores `Shell.App.prototype.create_icon_texture` and removes the shader.

## Development

    make test        # policy and icon-corner checks, no Shell
    make shell-test  # headless GNOME Shell 51, including a pixel check of the mask

`Shell.App.create_icon_texture` is private. The wrapper is installed only in `enable()` and removed in `disable()`.
