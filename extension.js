// SPDX-License-Identifier: GPL-2.0-or-later

import Shell from 'gi://Shell';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {iconPathForApp, opaqueCornersOf} from './corners.js';
import {EFFECT_NAME, RoundedCornerEffect} from './effect.js';
import {clampRadius, shouldMask} from './policy.js';

export {EFFECT_NAME};

export default class RoundedWebAppIconsExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._cache = new Map();
        this._tracked = new Set();
        this._settingsChangedId = this._settings.connect('changed', () => this._retarget());

        // Shell.App.create_icon_texture is the one JS call used by the dash,
        // the app grid, search and the window switcher. Restored in disable().
        this._original = Shell.App.prototype.create_icon_texture;
        const extension = this;
        this._wrapper = function (size) {
            const actor = extension._original.call(this, size);
            if (extension._settings) {
                try {
                    extension._mask(this, actor);
                } catch (error) {
                    console.debug(`Rounded Web App Icons: ${error.message}`);
                }
            }
            return actor;
        };
        Shell.App.prototype.create_icon_texture = this._wrapper;
        this._refreshDash();
    }

    disable() {
        if (this._settingsChangedId && this._settings) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }
        this._settings = null;
        if (this._wrapper && Shell.App.prototype.create_icon_texture === this._wrapper)
            Shell.App.prototype.create_icon_texture = this._original;
        this._wrapper = null;
        this._original = null;
        this._unmaskAll();
        this._cache?.clear();
        this._cache = null;
        this._refreshDash();
    }

    _options() {
        return {
            onlyWebApps: this._settings.get_boolean('only-webapps'),
            onlyOpaque: this._settings.get_boolean('only-square'),
            extraIds: this._settings.get_strv('extra-ids'),
        };
    }

    _opaqueCorners(app) {
        const id = app.get_id?.() ?? '';
        if (this._cache.has(id))
            return this._cache.get(id);
        let opaque = null;
        try {
            const path = iconPathForApp(app);
            if (path)
                opaque = opaqueCornersOf(path);
        } catch (error) {
            console.debug(`Rounded Web App Icons: ${error.message}`);
            opaque = null;
        }
        this._cache.set(id, opaque);
        return opaque;
    }

    _mask(app, actor) {
        if (!actor?.add_effect || !this._settings)
            return;
        const radius = clampRadius(this._settings.get_int('corner-radius'));
        if (radius <= 0)
            return;
        const appId = app.get_id?.() ?? '';
        if (!shouldMask(appId, {...this._options(), opaqueCorners: this._opaqueCorners(app)}))
            return;
        if (actor.get_effect(EFFECT_NAME))
            return;

        const effect = new RoundedCornerEffect({name: EFFECT_NAME, radius});
        actor.add_effect(effect);
        this._tracked.add(actor);
        const destroyId = actor.connect('destroy', () => this._tracked.delete(actor));
        actor._roundedWebAppDestroyId = destroyId;
    }

    _unmaskAll() {
        for (const actor of [...this._tracked]) {
            try {
                if (actor._roundedWebAppDestroyId) {
                    actor.disconnect(actor._roundedWebAppDestroyId);
                    actor._roundedWebAppDestroyId = 0;
                }
                const effect = actor.get_effect(EFFECT_NAME);
                if (effect)
                    actor.remove_effect(effect);
            } catch (error) {
                console.debug(`Rounded Web App Icons: ${error.message}`);
            }
        }
        this._tracked.clear();
    }

    _retarget() {
        this._cache?.clear();
        this._unmaskAll();
        this._refreshDash();
    }

    _refreshDash() {
        const children = Main.overview?.dash?._box?.get_children?.() ?? [];
        for (const item of children) {
            try {
                item.child?.icon?.update?.();
            } catch (error) {
                console.debug(`Rounded Web App Icons: ${error.message}`);
            }
        }
    }
}

