// SPDX-License-Identifier: GPL-2.0-or-later

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {
    ExtensionPreferences,
    gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class RoundedWebAppIconsPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        const appearance = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _('Square web-app icons are clipped to a squircle, the same curve as the Hermes Local icon. Icons whose corners are already transparent are left alone.'),
        });
        page.add(appearance);

        const radius = new Adw.SpinRow({
            title: _('Squircle'),
            subtitle: _('0 turns the mask off. 22 matches the Hermes Local icon. Higher values are rounder, up to 40.'),
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 40,
                step_increment: 1,
                page_increment: 5,
            }),
        });
        appearance.add(radius);
        settings.bind('corner-radius', radius, 'value', Gio.SettingsBindFlags.DEFAULT);

        const onlySquare = new Adw.SwitchRow({
            title: _('Skip icons that are already shaped'),
            subtitle: _('Do not clip an icon when its corner pixels are already transparent.'),
        });
        appearance.add(onlySquare);
        settings.bind('only-square', onlySquare, 'active', Gio.SettingsBindFlags.DEFAULT);

        const onlyWeb = new Adw.SwitchRow({
            title: _('Only web applications'),
            subtitle: _('When off, every hard-square icon is rounded, not just installed web apps.'),
        });
        appearance.add(onlyWeb);
        settings.bind('only-webapps', onlyWeb, 'active', Gio.SettingsBindFlags.DEFAULT);

        const extra = new Adw.PreferencesGroup({
            title: _('Other applications'),
            description: _('Desktop file ids or prefixes, separated by commas. Example: webapp-YouTube.desktop, com.example.App'),
        });
        page.add(extra);

        const entry = new Adw.EntryRow({
            title: _('Extra ids'),
            text: settings.get_strv('extra-ids').join(', '),
            show_apply_button: true,
        });
        entry.connect('apply', () => {
            const ids = entry.get_text().split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);
            settings.set_strv('extra-ids', ids);
        });
        extra.add(entry);
    }
}
