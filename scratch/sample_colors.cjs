const fs = require('fs');
const jpeg = require('jpeg-js');

function sampleMiddle(file) {
    try {
        const jpegData = fs.readFileSync(file);
        const rawImageData = jpeg.decode(jpegData, {useTArray: true});
        const w = rawImageData.width;
        const h = rawImageData.height;
        const data = rawImageData.data;
        
        console.log(`\n--- ${file} ---`);
        const cx = Math.floor(w / 2);
        
        // Let's sample a few y points
        const yPoints = [
            Math.floor(h * 0.2),
            Math.floor(h * 0.4),
            Math.floor(h * 0.6),
            Math.floor(h * 0.8)
        ];
        
        for (let y of yPoints) {
            const idx = (y * w + cx) * 4;
            const r = data[idx];
            const g = data[idx+1];
            const b = data[idx+2];
            console.log(`Center point (y=${y}): R=${r} G=${g} B=${b}`);
        }
        
    } catch (e) {
        console.error("Error on " + file, e.message);
    }
}

const d = 'public/templates';
const files = ['retro-tv.jpg', 'the-1975.jpg', 'love-stamp.jpg', 'newspaper.jpg', 'director-cut.jpg'];
for (let f of files) {
    sampleMiddle(d + '/' + f);
}
