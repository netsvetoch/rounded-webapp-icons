// SPDX-License-Identifier: GPL-2.0-or-later
// Locate an app icon file and sample its corner alpha. GdkPixbuf is not
// Gdk/GTK, so it is safe to use in the Shell process.

import GdkPixbuf from 'gi://GdkPixbuf';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {cornersAreOpaque} from './policy.js';

const SIZES = ['512x512', '256x256', '128x128', '64x64', '48x48', '32x32'];

export function iconSearchDirs() {
    const dirs = [
        `${GLib.get_user_data_dir()}/icons`,
        `${GLib.get_home_dir()}/.local/share/icons`,
    ];
    for (const data of GLib.get_system_data_dirs())
        dirs.push(`${data}/icons`);
    dirs.push('/usr/share/icons');
    return dirs;
}

export function resolveIconPath(iconValue, searchDirs = iconSearchDirs()) {
    if (typeof iconValue !== 'string' || iconValue.length === 0)
        return null;
    if (iconValue.startsWith('/'))
        return Gio.File.new_for_path(iconValue).query_exists(null) ? iconValue : null;

    for (const dir of searchDirs) {
        for (const size of SIZES) {
            const png = `${dir}/hicolor/${size}/apps/${iconValue}.png`;
            if (Gio.File.new_for_path(png).query_exists(null))
                return png;
        }
        const svg = `${dir}/hicolor/scalable/apps/${iconValue}.svg`;
        if (Gio.File.new_for_path(svg).query_exists(null))
            return svg;
    }
    return null;
}

export function iconNameFromInfo(info) {
    if (!info)
        return null;
    const icon = info.get_icon?.();
    if (icon instanceof Gio.FileIcon)
        return icon.get_file().get_path();
    if (icon instanceof Gio.ThemedIcon) {
        const names = icon.get_names();
        return names.length > 0 ? names[0] : null;
    }
    try {
        return info.get_string('Icon');
    } catch {
        return null;
    }
}

export function iconPathForApp(app, searchDirs = iconSearchDirs()) {
    const info = app?.get_app_info?.() ?? app?.app_info ?? null;
    return resolveIconPath(iconNameFromInfo(info), searchDirs);
}

export function sampleCornerAlphas(path, size = 48) {
    let pixbuf;
    try {
        pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(path, size, size, true);
    } catch {
        return null;
    }
    if (!pixbuf)
        return null;
    if (!pixbuf.get_has_alpha())
        return [255, 255, 255, 255];

    const pixels = pixbuf.get_pixels();
    const channels = pixbuf.get_n_channels();
    const rowstride = pixbuf.get_rowstride();
    const width = pixbuf.get_width();
    const height = pixbuf.get_height();
    const points = [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1],
    ];
    return points.map(([x, y]) => pixels[y * rowstride + x * channels + channels - 1]);
}

export function opaqueCornersOf(path) {
    return cornersAreOpaque(sampleCornerAlphas(path));
}
