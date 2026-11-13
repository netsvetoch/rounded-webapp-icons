import {
    clampRadius,
    cornersAreOpaque,
    insideSquircle,
    isWebApp,
    shouldMask,
    squircleExponent,
} from '../policy.js';

function equal(actual, expected, name) {
    if (actual !== expected)
        throw new Error(`${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    print(`PASS ${name}`);
}

const chrome = 'chrome-ggjocahimgaohmigbfhghnlfcnjemagj-Default.desktop';
const yandex = 'chrome-bcadigmkecmhhknameopgaidphameinh-Default.desktop';
const profile = 'brave-abcdefghijklmnopabcdefghijklmnop-Profile 2.desktop';
const epiphany = 'org.gnome.Epiphany.WebApp-deadbeef.desktop';
const firefox = 'FFPWA-0123456789abcdef.desktop';

equal(isWebApp(chrome), true, 'Chrome installed web app is recognized');
equal(isWebApp(yandex), true, 'Yandex Browser web apps use the chrome- id prefix');
equal(isWebApp(profile), true, 'a non-default Chromium profile is still a web app');
equal(isWebApp(epiphany), true, 'GNOME Web apps are recognized');
equal(isWebApp(firefox), true, 'Firefox PWAsForFirefox apps are recognized');
equal(isWebApp('google-chrome-canary.desktop'), false, 'the browser itself is not a web app');
equal(isWebApp('org.gnome.Nautilus.desktop'), false, 'a native app is not a web app');
equal(isWebApp('chrome-short-Default.desktop'), false, 'a short chrome id is not a web app');
equal(isWebApp(chrome.slice(0, -8)), true, 'ids without the .desktop suffix still match');
equal(isWebApp('my-webapp.desktop', ['my-webapp.desktop']), true,
    'an extra id is treated as a web app');
equal(isWebApp('custom-notes.desktop', ['custom-']), true,
    'an extra prefix matches the start of the id');

equal(clampRadius(22), 0.22, 'the default percentage becomes a fraction of the icon');
equal(clampRadius(0), 0, 'zero radius disables the mask');
equal(clampRadius(80), 0.4, 'radius is capped below a circle so round icons are not cropped');
equal(clampRadius('nope'), 0.22, 'an invalid radius falls back to the default');

equal(cornersAreOpaque([255, 255, 255, 255]), true, 'a hard square has opaque corners');
equal(cornersAreOpaque([0, 0, 0, 0]), false, 'transparent corners are already shaped');
equal(cornersAreOpaque([255, 255, 0, 255]), false, 'one transparent corner is enough to skip');
equal(cornersAreOpaque(null), null, 'missing samples are unknown, not square');

const defaults = {onlyWebApps: true, onlyOpaque: true, extraIds: []};
equal(shouldMask(chrome, {...defaults, opaqueCorners: true}), true,
    'a square web app is masked');
equal(shouldMask('org.gnome.Nautilus.desktop', {...defaults, opaqueCorners: true}), false,
    'a square native app is left alone');
equal(shouldMask(chrome, {...defaults, opaqueCorners: false}), false,
    'a web app that is already shaped is not clipped');
equal(shouldMask(chrome, {...defaults, onlyOpaque: false, opaqueCorners: false}), true,
    'only-opaque can be turned off');
equal(shouldMask('org.gnome.Ptyxis.desktop', {
    onlyWebApps: false, onlyOpaque: true, extraIds: [], opaqueCorners: true,
}), true, 'every square icon can be masked when web-app-only is off');
equal(shouldMask(chrome, {...defaults, opaqueCorners: null}), true,
    'an unreadable web-app icon is still masked');
equal(shouldMask('org.gnome.Nautilus.desktop', {...defaults, opaqueCorners: null}), false,
    'an unreadable native icon is not masked');

const exponent = squircleExponent(0.22);
equal(Math.abs(exponent - 4.2) < 0.1, true,
    'the default setting bows the sides into a squircle');
equal(insideSquircle(0.5, 0.5, exponent), true, 'the center stays visible');
equal(insideSquircle(0, 0, exponent), false, 'a square corner is outside the mask');
equal(insideSquircle(0, 0.5, exponent), true, 'an edge midpoint stays visible');
const inset = 0.5 / Math.SQRT2;
equal(insideSquircle(0.5 - inset, 0.5 - inset, exponent), true,
    'a point on an inscribed circle is not cropped');
equal(insideSquircle(0.15, 0.15, exponent), true,
    'the squircle keeps the shoulder that a circular corner would cut');
