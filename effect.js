// SPDX-License-Identifier: GPL-2.0-or-later
// Squircle mask for an icon actor. The superellipse matches
// insideSquircle() in policy.js and the Hermes Local icon (n = 5).

import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';
import GObject from 'gi://GObject';

import {squircleExponent, squircleInset} from './policy.js';

const DECLARATIONS = `
uniform float exponent;
uniform float inset;
`;

// Distance form of the superellipse. Inset so the sides bow instead of
// reading as a circular corner on a full-bleed icon.
const POST = `
vec2 p = abs(cogl_tex_coord_in[0].xy - vec2(0.5)) * 2.0 / max(1.0 - inset, 0.5);
float n = max(exponent, 2.0);
float d = pow(pow(max(p.x, 0.0001), n) + pow(max(p.y, 0.0001), n), 1.0 / n);
float aa = max(fwidth(d), 0.012);
cogl_color_out *= 1.0 - smoothstep(1.0 - aa, 1.0 + aa, d);
`;

export const EFFECT_NAME = 'rounded-webapp-icons';

export const RoundedCornerEffect = GObject.registerClass({
    Properties: {
        'radius': GObject.ParamSpec.float(
            'radius', null, null,
            GObject.ParamFlags.READWRITE,
            0, 0.5, 0.22),
    },
}, class RoundedCornerEffect extends Clutter.ShaderEffect {
    _init(params = {}) {
        const radius = params.radius ?? 0.22;
        delete params.radius;
        this._radius = undefined;
        super._init(params);
        this.radius = radius;
    }

    vfunc_get_static_snippet() {
        return Cogl.Snippet.new(Cogl.SnippetHook.FRAGMENT, DECLARATIONS, POST);
    }

    get radius() {
        return this._radius;
    }

    set radius(value) {
        if (this._radius === value)
            return;
        this._radius = value;
        this.set_uniform_float('exponent', 1, [squircleExponent(value)]);
        this.set_uniform_float('inset', 1, [squircleInset(value)]);
        this.notify('radius');
    }
});
