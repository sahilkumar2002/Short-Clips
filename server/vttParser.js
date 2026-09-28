const fs = require('fs');

function parseVtt(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const subs = [];
    let currentSub = null;
    let lastText = '';
    
    const timeRegex = /(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})\s+-->\s+(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})/;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        if (timeRegex.test(line)) {
            const match = line.match(timeRegex);
            const parseTime = (h, m, s, ms) => {
                return (parseInt(h || '0') * 3600) + (parseInt(m) * 60) + parseInt(s) + (parseInt(ms) / 1000);
            };
            const start = parseTime(match[1], match[2], match[3], match[4]);
            const end = parseTime(match[5], match[6], match[7], match[8]);
            
            currentSub = { start, end, text: '' };
            subs.push(currentSub);
        } else if (currentSub && line && !line.startsWith('NOTE') && !line.startsWith('WEBVTT') && !/^[a-z0-9-]+$/i.test(line)) {
            // Strip formatting tags like <c> or <00:00:01.000>
            let cleanText = line.replace(/<[^>]+>/g, '').trim();
            // Try to avoid rolling duplicate lines
            if (cleanText && cleanText !== lastText) {
                // If it's a completely new line, add it
                currentSub.text += (currentSub.text ? ' ' : '') + cleanText;
                lastText = cleanText;
            }
        } else if (line === '') {
            currentSub = null;
        }
    }
    
    // Clean up empty subs
    return subs.filter(s => s.text.trim().length > 0);
}

module.exports = { parseVtt };
