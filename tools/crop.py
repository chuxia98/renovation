#!/usr/bin/env python3
"""Crop regions from the floor plan with a 50px grid overlay (stdlib only)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from analyze import decode_png, write_png

def main():
    src, x0, y0, x1, y1, out, scale = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), sys.argv[6], int(sys.argv[7]) if len(sys.argv) > 7 else 1
    w, h, gray = decode_png(src)
    cw, ch = x1-x0, y1-y0
    W, H = cw*scale, ch*scale
    rgb = bytearray(W*H*3)
    for yy in range(H):
        sy = y0 + yy//scale
        for xx in range(W):
            sx = x0 + xx//scale
            g = gray[sy*w+sx]
            v = 235 if g > 200 else g
            i = (yy*W+xx)*3
            rgb[i] = rgb[i+1] = rgb[i+2] = v
    # grid every 50 source px
    for gx in range(x0 - x0 % 50, x1+1, 50):
        if gx < x0: continue
        for yy in range(H):
            xx = (gx-x0)*scale
            if 0 <= xx < W:
                i = (yy*W+xx)*3
                major = gx % 100 == 0
                rgb[i], rgb[i+1], rgb[i+2] = ((255,120,120) if major else (255,200,200))
    for gy in range(y0 - y0 % 50, y1+1, 50):
        if gy < y0: continue
        for xx in range(W):
            yy = (gy-y0)*scale
            if 0 <= yy < H:
                i = (yy*W+xx)*3
                major = gy % 100 == 0
                rgb[i], rgb[i+1], rgb[i+2] = ((120,120,255) if major else (200,200,255))
    write_png(out, W, H, rgb)
    print(out, W, H, 'origin', x0, y0)

if __name__ == '__main__':
    main()
