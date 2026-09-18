const fs = require('fs');
const jpeg = require('jpeg-js');

function findHoles(file, threshold) {
    try {
        const jpegData = fs.readFileSync(file);
        const rawImageData = jpeg.decode(jpegData, {useTArray: true});
        const w = rawImageData.width;
        const h = rawImageData.height;
        const data = rawImageData.data;
        
        console.log(`\n--- ${file} ---`);
        const isWhite = (idx) => data[idx] > threshold && data[idx+1] > threshold && data[idx+2] > threshold;
        
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
                if (y - startY > 30) {
                    let startX = midX;
                    let endX = midX;
                    const midY = Math.floor((startY + y) / 2);
                    while(startX > 0 && isWhite((midY * w + startX - 1) * 4)) startX--;
                    while(endX < w - 1 && isWhite((midY * w + endX + 1) * 4)) endX++;
                    
                    slots.push({x: startX, y: startY, w: endX - startX, h: y - startY, r: 8});
                }
            }
        }
        
        console.log("Found slots:");
        console.log(JSON.stringify(slots, null, 2));
    } catch (e) {
        console.error("Error on " + file, e.message);
    }
}

const d = 'public/templates';
findHoles(d + '/retro-tv.jpg', 145);
findHoles(d + '/the-1975.jpg', 195);
findHoles(d + '/love-stamp.jpg', 210);
findHoles(d + '/newspaper.jpg', 180);
findHoles(d + '/director-cut.jpg', 230);
