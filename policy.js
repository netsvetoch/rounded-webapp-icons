// Pure policy for which icons to round. No Shell or GTK imports:
// gjs -m tests/policy.test.js runs this outside GNOME Shell.

const CHROMIUM_WEBAPP =
    /^(?:chrome|chromium|brave|msedge|microsoft-edge|vivaldi|opera|yandex-browser)-[a-p]{32}(?:-.*)?$/;
const EPIPHANY_WEBAPP = /^org\.gnome\.Epiphany\.WebApp-.+$/;
const FIREFOX_WEBAPP = /^(?:FFPWA|firefoxpwa)-.+$/i;

const DEFAULT_RADIUS = 0.22;
const MAX_RADIUS = 0.4;

function desktopId(appId) {
    if (typeof appId !== 'string' || appId.length === 0)
        return '';
    return appId.endsWith('.desktop') ? appId.slice(0, -8) : appId;
}

export function isWebApp(appId, extraIds = []) {
    const id = desktopId(appId);
    if (CHROMIUM_WEBAPP.test(id) || EPIPHANY_WEBAPP.test(id) || FIREFOX_WEBAPP.test(id))
        return true;

    const raw = typeof appId === 'string' ? appId : '';
    for (const extra of extraIds) {
        if (typeof extra !== 'string' || extra.length === 0)
            continue;
        const extraId = desktopId(extra);
        if (raw === extra || id === extraId || raw.startsWith(extra) || id.startsWith(extra))
            return true;
    }
    return false;
}

export function clampRadius(percent) {
    const value = Number(percent);
    if (!Number.isFinite(value))
        return DEFAULT_RADIUS;
    return Math.min(MAX_RADIUS * 100, Math.max(0, value)) / 100;
}

export function cornersAreOpaque(alphas, threshold = 128) {
    if (!alphas || alphas.length < 4)
        return null;
    return alphas.slice(0, 4).every(alpha => alpha >= threshold);
}

export function shouldMask(appId, {
    onlyWebApps = true,
    onlyOpaque = true,
    extraIds = [],
    opaqueCorners = null,
} = {}) {
    const webApp = isWebApp(appId, extraIds);
    if (onlyWebApps && !webApp)
        return false;
    if (onlyOpaque && opaqueCorners === false)
        return false;
    // A native icon is masked only when we know it is a hard square.
    if (!webApp && onlyOpaque && opaqueCorners !== true)
        return false;
    return true;
}

// Same superellipse as the fragment shader in effect.js.
// Hermes Local's silhouette fits n = 5. The default radius 0.22 maps there.
export function squircleExponent(radiusFraction) {
    const t = Math.min(1, Math.max(0, radiusFraction / 0.4));
    return 8 + (2.5 - 8) * t;
}

export function insideSquircle(u, v, exponent) {
    const px = Math.abs(u - 0.5) * 2;
    const py = Math.abs(v - 0.5) * 2;
    return px ** exponent + py ** exponent <= 1 + 1e-4;
}
