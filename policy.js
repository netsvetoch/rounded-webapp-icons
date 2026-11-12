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

// Same signed distance as the fragment shader in effect.js.
// u and v are texture coordinates in 0..1; radius is a fraction of the side.
export function insideRoundedRect(u, v, radius) {
    const r = Math.min(0.5, Math.max(0, radius));
    const qx = Math.abs(u - 0.5) - (0.5 - r);
    const qy = Math.abs(v - 0.5) - (0.5 - r);
    const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
    const inside = Math.min(Math.max(qx, qy), 0);
    return outside + inside - r <= 1e-6;
}
