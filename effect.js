// SPDX-License-Identifier: GPL-2.0-or-later
// Rounded corner mask for an icon actor. The signed distance matches
// insideRoundedRect() in policy.js. GNOME Shell 49+ uses a Cogl snippet
// rather than the old shader-source virtual.

import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';
import GObject from 'gi://GObject';

const DECLARATIONS = `
uniform float radius;
`;

// Post runs after the icon has been sampled into cogl_color_out.
// Multiply the whole premultiplied color so the antialiased edge
// does not leave a bright fringe.
const POST = `
vec2 p = abs(cogl_tex_coord_in[0].xy - vec2(0.5));
float r = clamp(radius, 0.0, 0.5);
vec2 q = p - (vec2(0.5) - vec2(r));
float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
float aa = max(fwidth(dist), 0.001);
cogl_color_out *= 1.0 - smoothstep(-aa, aa, dist);
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
        this.set_uniform_float('radius', 1, [value]);
        this.notify('radius');
    }
});
