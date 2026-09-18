const fs = require('fs');
const jpeg = require('jpeg-js');

function processImage(file) {
    try {
        const jpegData = fs.readFileSync(file);
        const rawImageData = jpeg.decode(jpegData, {useTArray: true}); // return as Uint8Array
        const w = rawImageData.width;
        const h = rawImageData.height;
        const data = rawImageData.data;
        
        console.log(`\nFile: ${file} (${w} x ${h})`);
        
        const isWhite = (idx) => data[idx] > 240 && data[idx+1] > 240 && data[idx+2] > 240;
        
        let inHole = false;
        let startY = 0;
        const slots = [];
        
        const midX = Math.floor(w / 2);
        for (let y = 0; y < h; y++) {
            const idx = (y * w + midX) * 4;
            const white = isWhite(idx);
            
            if (white && !inHole) {
                inHole = true;
                startY = y;
            } else if (!white && inHole) {
                inHole = false;
                if (y - startY > 50) {
                    let startX = midX;
                    let endX = midX;
                    const midY = Math.floor((startY + y) / 2);
                    while(startX > 0 && isWhite((midY * w + startX - 1) * 4)) startX--;
                    while(endX < w - 1 && isWhite((midY * w + endX + 1) * 4)) endX++;
                    
                    slots.push({x: startX, y: startY, w: endX - startX, h: y - startY, r: 0});
                }
            }
        }
        
        console.log(JSON.stringify(slots));
    } catch (e) {
        console.error("Error on " + file, e.message);
    }
}

const d = 'public/templates';
const files = fs.readdirSync(d).filter(f => f.endsWith('.JPG') || f.endsWith('.jpg'));
for (let f of files) {
    processImage(d + '/' + f);
}
