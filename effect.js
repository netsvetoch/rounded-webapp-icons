// SPDX-License-Identifier: GPL-2.0-or-later
// Squircle mask for an icon actor. The superellipse matches
// insideSquircle() in policy.js and the Hermes Local icon (n = 5).

import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';
import GObject from 'gi://GObject';

import {squircleExponent} from './policy.js';

const DECLARATIONS = `
uniform float exponent;
`;

// Post runs after the icon has been sampled into cogl_color_out.
// Superellipse n=5 matches the Hermes Local icon. Multiply the whole
// premultiplied color so the antialiased edge does not leave a fringe.
const POST = `
vec2 p = abs(cogl_tex_coord_in[0].xy - vec2(0.5)) * 2.0;
float field = pow(max(p.x, 0.0), exponent) + pow(max(p.y, 0.0), exponent);
float aa = max(fwidth(field), 0.002);
cogl_color_out *= 1.0 - smoothstep(1.0, 1.0 + aa, field);
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
        this.notify('radius');
    }
});
