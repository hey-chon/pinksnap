const fs = require('fs');
const Jimp = require('jimp');

async function processImage(file) {
    try {
        const image = await Jimp.read(file);
        const w = image.bitmap.width;
        const h = image.bitmap.height;
        console.log(`\nFile: ${file} (${w} x ${h})`);
        
        // Find white/transparent regions by scanning for bounding boxes
        // Since the user said "strips empty SHOTS", the slots are either transparent or white.
        // We will scan rows and columns for pixels that are very light (R>240, G>240, B>240)
        
        const isWhite = (idx, data) => data[idx] > 230 && data[idx+1] > 230 && data[idx+2] > 230;
        
        let inHole = false;
        let startY = 0;
        const slots = [];
        
        // Simple heuristic: just look at the middle column
        const midX = Math.floor(w / 2);
        for (let y = 0; y < h; y++) {
            const idx = (y * w + midX) * 4;
            const white = isWhite(idx, image.bitmap.data);
            
            if (white && !inHole) {
                inHole = true;
                startY = y;
            } else if (!white && inHole) {
                inHole = false;
                if (y - startY > 50) {
                    // found a hole vertically, now find its width
                    let startX = midX;
                    let endX = midX;
                    const midY = Math.floor((startY + y) / 2);
                    while(startX > 0 && isWhite((midY * w + startX - 1) * 4, image.bitmap.data)) startX--;
                    while(endX < w - 1 && isWhite((midY * w + endX + 1) * 4, image.bitmap.data)) endX++;
                    
                    slots.push({x: startX, y: startY, w: endX - startX, h: y - startY});
                }
            }
        }
        
        slots.forEach((s, i) => console.log(`  Slot ${i}: x=${s.x}, y=${s.y}, w=${s.w}, h=${s.h}`));
        
    } catch (e) {
        console.error(e);
    }
}

async function main() {
    const d = 'public/templates';
    const files = fs.readdirSync(d).filter(f => f.endsWith('.JPG') || f.endsWith('.jpg'));
    for (let f of files) {
        await processImage(d + '/' + f);
    }
}

main();
