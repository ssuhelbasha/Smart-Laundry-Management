const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');
s = s.replace(/The above content does NOT show the entire file contents.*\n?"?\}?/g, '');
s = s.replace(/\\n"\}\s*/g, '');
s = s.replace(/\\n/g, '\n');
fs.writeFileSync('server.js', s);
