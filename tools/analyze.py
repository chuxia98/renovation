#!/usr/bin/env python3
"""Extract thick axis-aligned wall strokes from the floor-plan PNG (stdlib only)."""
import struct, zlib, sys, json, os

def decode_png(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    pos = 8
    idat = b''
    w = h = bit = ctype = interlace = None
    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos+4])[0]
        typ = data[pos+4:pos+8]
        chunk = data[pos+8:pos+8+length]
        pos += 12 + length
        if typ == b'IHDR':
            w, h, bit, ctype, comp, filt, interlace = struct.unpack('>IIBBBBB', chunk)
        elif typ == b'IDAT':
            idat += chunk
        elif typ == b'IEND':
            break
    raw = zlib.decompress(idat)
    channels = {0:1, 2:3, 3:1, 4:2, 6:4}[ctype]
    bpp = max(1, channels * bit // 8)
    stride = (w * channels * bit + 7) // 8
    assert interlace == 0
    out = bytearray(stride * h)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]; p += 1
        line = bytearray(raw[p:p+stride]); p += stride
        if f == 1:
            for i in range(bpp, stride):
                line[i] = (line[i] + line[i-bpp]) & 0xFF
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif f == 3:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif f == 4:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i-bpp] if i >= bpp else 0
                pa, pb, pc = abs(b-c), abs(a-c), abs(a+b-2*c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 0xFF
        out[y*stride:(y+1)*stride] = line
        prev = line
    gray = bytearray(w * h)
    for y in range(h):
        base = y*w
        row = out[y*stride:(y+1)*stride]
        for x in range(w):
            if ctype in (0, 4):
                g = row[x*channels]
            elif ctype in (2, 6):
                g = (row[x*channels]*30 + row[x*channels+1]*59 + row[x*channels+2]*11) // 100
            else:
                g = 0
            gray[base+x] = g
    return w, h, gray

def hrun_lengths(gray, w, h, thresh, min_len):
    """Horizontal black-run length for every pixel in runs >= min_len (else 0)."""
    out = [0]*(w*h)
    for y in range(h):
        base = y*w
        x = 0
        while x < w:
            if gray[base+x] < thresh:
                x0 = x
                while x < w and gray[base+x] < thresh:
                    x += 1
                L = x - x0
                if L >= min_len:
                    for i in range(x0, x):
                        out[base+i] = L
            else:
                x += 1
    return out

def vrun_lengths(gray, w, h, thresh, min_len):
    out = [0]*(w*h)
    for x in range(w):
        y = 0
        while y < h:
            if gray[y*w+x] < thresh:
                y0 = y
                while y < h and gray[y*w+x] < thresh:
                    y += 1
                L = y - y0
                if L >= min_len:
                    for i in range(y0, y):
                        out[i*w+x] = L
            else:
                y += 1
    return out

def intervals(flag_row, n):
    res = []
    x = 0
    while x < n:
        if flag_row[x]:
            x0 = x
            while x < n and flag_row[x]:
                x += 1
            res.append((x0, x-1))
        else:
            x += 1
    return res

def merge_rows(rows_flags, n, min_len):
    """rows_flags: list of per-row boolean lists. Merge overlapping intervals across rows."""
    segs = []
    active = []  # [x0, x1, y_start, y_last]
    for y, flags in enumerate(rows_flags):
        iv = [p for p in intervals(flags, n) if p[1]-p[0]+1 >= min_len]
        new_active = []
        used = [False]*len(iv)
        for a in active:
            matched = None
            for i, p in enumerate(iv):
                if used[i]:
                    continue
                overlap = min(a[1], p[1]) - max(a[0], p[0]) + 1
                if overlap >= 0.5*min(a[1]-a[0]+1, p[1]-p[0]+1):
                    matched = i
                    break
            if matched is None:
                segs.append(tuple(a))
            else:
                used[matched] = True
                p = iv[matched]
                new_active.append([min(a[0], p[0]), max(a[1], p[1]), a[2], y])
        for i, p in enumerate(iv):
            if not used[i]:
                new_active.append([p[0], p[1], y, y])
        active = new_active
    for a in active:
        segs.append(tuple(a))
    return segs

def write_png(path, w, h, rgb):
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        raw.extend(rgb[y*w*3:(y+1)*w*3])
    def chunk(typ, data):
        c = struct.pack('>I', len(data)) + typ + data
        return c + struct.pack('>I', zlib.crc32(typ + data) & 0xFFFFFFFF)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 6))
    png += chunk(b'IEND', b'')
    open(path, 'wb').write(png)

def main():
    src = sys.argv[1]
    w, h, gray = decode_png(src)
    thresh = 128
    hr = hrun_lengths(gray, w, h, thresh, 12)
    vr = vrun_lengths(gray, w, h, thresh, 12)
    # horizontal wall pixels: long horizontally AND thick vertically
    wallh = [[hr[y*w+x] >= 40 and vr[y*w+x] >= 6 for x in range(w)] for y in range(h)]
    wallv = [[vr[y*w+x] >= 40 and hr[y*w+x] >= 6 for x in range(w)] for y in range(h)]
    hsegs = merge_rows(wallh, w, 40)
    # transpose for vertical
    wallv_t = [[wallv[y][x] for y in range(h)] for x in range(w)]
    vsegs_t = merge_rows(wallv_t, h, 40)
    out = []
    for x0, x1, y0, y1 in hsegs:
        th, ln = y1-y0+1, x1-x0+1
        if th < 5 or th > 80 or ln < 40:
            continue
        out.append(dict(o='h', cx=(x0+x1)/2, cy=(y0+y1)/2, x0=x0, x1=x1, y0=y0, y1=y1, thick=th, length=ln))
    for y0, y1, x0, x1 in vsegs_t:
        th, ln = x1-x0+1, y1-y0+1
        if th < 5 or th > 80 or ln < 40:
            continue
        out.append(dict(o='v', cx=(x0+x1)/2, cy=(y0+y1)/2, x0=x0, x1=x1, y0=y0, y1=y1, thick=th, length=ln))
    out.sort(key=lambda b: (b['o'], b['cy'], b['cx']))
    for b in out:
        print('{o} cx={cx:7.1f} cy={cy:7.1f} x0={x0:4d} x1={x1:4d} y0={y0:4d} y1={y1:4d} thick={thick:3d} len={length:4d}'.format(**b))
    json.dump(out, open(os.path.join(os.path.dirname(src), 'walls_raw.json'), 'w'), indent=1)
    # debug image: white bg, original gray faint, walls colored
    rgb = bytearray(w*h*3)
    for y in range(h):
        for x in range(w):
            g = gray[y*w+x]
            v = 230 if g > 200 else g
            i = (y*w+x)*3
            rgb[i] = rgb[i+1] = rgb[i+2] = v
    for b in out:
        col = (220, 40, 40) if b['o'] == 'h' else (40, 90, 220)
        for y in range(b['y0'], b['y1']+1):
            for x in range(b['x0'], b['x1']+1):
                i = (y*w+x)*3
                rgb[i], rgb[i+1], rgb[i+2] = col
    write_png(os.path.join(os.path.dirname(src), 'walls_debug.png'), w, h, rgb)
    print('segments:', len(out))

if __name__ == '__main__':
    main()
