import GdkPixbuf from 'gi://GdkPixbuf';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {sleep} from 'resource:///org/gnome/shell/ui/scripting.js';

const UUID = 'rounded-webapp-icons@netsvetaev.dev';
const EFFECT = 'rounded-webapp-icons';

export const METRICS = {};

function assert(condition, message) {
    if (!condition)
        throw new Error(message);
    print(`PASS ${message}`);
}

function saveRgba(path, width, height, paint) {
    const bytes = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const [r, g, b, a] = paint(x, y);
            const offset = (y * width + x) * 4;
            bytes[offset] = r;
            bytes[offset + 1] = g;
            bytes[offset + 2] = b;
            bytes[offset + 3] = a;
        }
    }
    const pixbuf = GdkPixbuf.Pixbuf.new_from_bytes(
        GLib.Bytes.new(bytes), GdkPixbuf.Colorspace.RGB, true, 8,
        width, height, width * 4);
    pixbuf.savev(path, 'png', [], []);
}

function pixel(pixbuf, x, y) {
    const pixels = pixbuf.get_pixels();
    const channels = pixbuf.get_n_channels();
    const offset = y * pixbuf.get_rowstride() + x * channels;
    return [pixels[offset], pixels[offset + 1], pixels[offset + 2], pixels[offset + 3] ?? 255];
}

export async function run() {
    for (let attempt = 0; attempt < 50 &&
        !Main.extensionManager.lookup(UUID)?.stateObj; attempt++)
        await sleep(100);
    const loaded = Main.extensionManager.lookup(UUID);
    assert(loaded?.stateObj,
        `packaged extension loaded: ${JSON.stringify({
            state: loaded?.state, error: loaded?.error, errors: loaded?.errors,
        })}`);

    const extension = loaded.stateObj;
    assert(Shell.App.prototype.create_icon_texture === extension._wrapper,
        'Shell.App.create_icon_texture is wrapped while enabled');

    for (let iteration = 0; iteration < 3; iteration++) {
        extension.disable();
        assert(Shell.App.prototype.create_icon_texture !== extension._wrapper &&
            extension._settings === null,
            'disable restores icon creation and drops settings');
        extension.enable();
        assert(Shell.App.prototype.create_icon_texture === extension._wrapper,
            'enable wraps icon creation again');
    }

    const infos = Shell.AppSystem.get_default().get_installed();
    const nativeInfo = infos.find(info => !info.get_id().includes('chrome-'));
    assert(nativeInfo, 'the test session has a native application');
    const native = Shell.AppSystem.get_default().lookup_app(nativeInfo.get_id());
    assert(native?.create_icon_texture, `${nativeInfo.get_id()} resolves to a Shell.App`);
    let maskCalls = 0;
    const mask = extension._mask.bind(extension);
    extension._mask = function (...args) {
        maskCalls += 1;
        return mask(...args);
    };
    const nativeIcon = native.create_icon_texture(32);
    extension._mask = mask;
    assert(maskCalls === 1, 'create_icon_texture goes through the extension');
    assert(!nativeIcon.get_effect(EFFECT),
        `${native.get_id()} is not masked`);

    const dir = GLib.dir_make_tmp('rounded-webapp-icons-XXXXXX');
    const squarePath = `${dir}/square.png`;
    const shapedPath = `${dir}/shaped.png`;
    saveRgba(squarePath, 64, 64, () => [255, 0, 0, 255]);
    saveRgba(shapedPath, 64, 64, (x, y) => {
        const corner = x < 8 && y < 8;
        return corner ? [255, 0, 0, 0] : [0, 180, 0, 255];
    });

    const squareApp = {
        get_id: () => 'chrome-abcdefghijklmnopabcdefghijklmnop-Default.desktop',
        get_app_info: () => ({
            get_icon: () => Gio.FileIcon.new(Gio.File.new_for_path(squarePath)),
        }),
    };
    const shapedApp = {
        get_id: () => 'chrome-bbcdefghijklmnopabcdefghijklmnop-Default.desktop',
        get_app_info: () => ({
            get_icon: () => Gio.FileIcon.new(Gio.File.new_for_path(shapedPath)),
        }),
    };
    const squareIcon = new St.Icon({
        gicon: squareApp.get_app_info().get_icon(),
        icon_size: 64,
    });
    const shapedIcon = new St.Icon({
        gicon: shapedApp.get_app_info().get_icon(),
        icon_size: 64,
    });
    extension._mask(squareApp, squareIcon);
    extension._mask(shapedApp, shapedIcon);
    assert(squareIcon.get_effect(EFFECT), 'a square web app receives the mask');
    assert(!shapedIcon.get_effect(EFFECT), 'a shaped web app is not clipped');

    const {RoundedCornerEffect} = await import(`file://${extension.path}/effect.js`);
    const stageIcon = new St.Icon({
        gicon: Gio.FileIcon.new(Gio.File.new_for_path(squarePath)),
        icon_size: 64,
        width: 64,
        height: 64,
    });
    stageIcon.add_effect(new RoundedCornerEffect({name: EFFECT, radius: 0.28}));
    const bin = new St.Widget({
        style: 'background-color: rgb(0, 0, 255);',
        width: 64,
        height: 64,
        x: 24,
        y: 24,
    });
    bin.add_child(stageIcon);
    Main.overview.hide();
    Main.layoutManager.uiGroup.add_child(bin);
    await sleep(400);

    const shot = GLib.getenv('ROUNDED_WEBAPP_SCREENSHOT');
    const screenshot = new Shell.Screenshot();
    const stream = Gio.File.new_for_path(shot).replace(null, false,
        Gio.FileCreateFlags.NONE, null);
    await screenshot.screenshot_area(24, 24, 64, 64, stream);
    stream.close(null);

    const pixbuf = GdkPixbuf.Pixbuf.new_from_file(shot);
    const center = pixel(pixbuf, Math.floor(pixbuf.get_width() / 2), Math.floor(pixbuf.get_height() / 2));
    const corner = pixel(pixbuf, 1, 1);
    print(`PIXELS center=${center} corner=${corner} size=${pixbuf.get_width()}x${pixbuf.get_height()}`);
    assert(center[0] > 180 && center[2] < 80,
        `the icon center stays red (${center})`);
    assert(corner[0] < 80,
        `the icon corner is clipped (${corner})`);

    bin.destroy();
    extension.disable();
    assert(Shell.App.prototype.create_icon_texture !== extension._wrapper,
        'the session is left with icon creation restored');
}
