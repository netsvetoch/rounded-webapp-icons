import GdkPixbuf from 'gi://GdkPixbuf';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {maskIconFile, opaqueCornersOf, resolveIconPath, sampleCornerAlphas} from '../corners.js';

function equal(actual, expected, name) {
    const left = JSON.stringify(actual);
    const right = JSON.stringify(expected);
    if (left !== right)
        throw new Error(`${name}: expected ${right}, got ${left}`);
    print(`PASS ${name}`);
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

const dir = GLib.dir_make_tmp('rounded-webapp-icons-XXXXXX');
const squarePath = `${dir}/square.png`;
const shapedPath = `${dir}/shaped.png`;

const square = GdkPixbuf.Pixbuf.new(GdkPixbuf.Colorspace.RGB, false, 8, 32, 32);
square.fill(0xff0000ff);
square.savev(squarePath, 'png', [], []);
saveRgba(shapedPath, 32, 32, (x, y) => {
    const corner = (x === 0 || x === 31) && (y === 0 || y === 31);
    return corner ? [255, 0, 0, 0] : [255, 0, 0, 255];
});

equal(sampleCornerAlphas(squarePath).every(alpha => alpha === 255), true,
    'a PNG without alpha is a hard square');
equal(opaqueCornersOf(squarePath), true, 'an opaque PNG is masked');
equal(opaqueCornersOf(shapedPath), false, 'transparent corners are not masked');
equal(sampleCornerAlphas(`${dir}/missing.png`), null, 'a missing file is unknown');

const icons = `${dir}/icons`;
GLib.mkdir_with_parents(`${icons}/hicolor/128x128/apps`, 0o755);
Gio.File.new_for_path(squarePath).copy(
    Gio.File.new_for_path(`${icons}/hicolor/128x128/apps/demo.png`),
    Gio.FileCopyFlags.NONE, null, null);
equal(resolveIconPath('demo', [`${dir}/icons`]),
    `${icons}/hicolor/128x128/apps/demo.png`,
    'a themed icon name resolves to the hicolor PNG');
equal(resolveIconPath(squarePath, []), squarePath,
    'an absolute icon path is used as-is');
equal(resolveIconPath('/no/such/icon.png', []), null,
    'a missing absolute path is unknown');

const platePath = `${dir}/plate.png`;
const maskedPath = `${dir}/plate-masked.png`;
saveRgba(platePath, 64, 64, () => [0, 0, 0, 255]);
maskIconFile(platePath, maskedPath, 5);
const maskedCorners = sampleCornerAlphas(maskedPath);
equal(maskedCorners.every(alpha => alpha === 0), true,
    'a hard square plate loses its corners');
const masked = GdkPixbuf.Pixbuf.new_from_file(maskedPath);
const mid = masked.get_pixels()[32 * masked.get_rowstride() + 32 * 4 + 3];
equal(mid, 255, 'the center of a masked plate stays opaque');
