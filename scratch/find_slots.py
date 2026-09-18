import cv2
import numpy as np
import os
import glob

def find_slots(img_path):
    img = cv2.imread(img_path)
    if img is None:
        return
    h, w = img.shape[:2]
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Threshold to find white or very light gray regions
    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    slots = []
    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        # Filter out very small or very large contours
        if cw > 100 and ch > 100 and cw < w * 0.9 and ch < h * 0.9:
            slots.append({"x": x, "y": y, "w": cw, "h": ch})
            
    # Sort slots by y coordinate
    slots.sort(key=lambda s: s['y'])
    
    print(f"File: {os.path.basename(img_path)} (w={w}, h={h})")
    for i, s in enumerate(slots):
        print(f"  Slot {i}: x={s['x']}, y={s['y']}, w={s['w']}, h={s['h']}")

files = glob.glob('public/templates/*.jpg') + glob.glob('public/templates/*.JPG')
for f in files:
    find_slots(f)
