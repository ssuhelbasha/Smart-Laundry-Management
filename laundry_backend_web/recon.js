const fs = require('fs');
const raw = fs.readFileSync('recovered_server_raw.txt', 'utf8');

try {
  const obj = JSON.parse(raw);
  let content = obj.content;
  
  let lines = content.split('\n');
  let cleanLines = [];
  let started = false;
  for (let line of lines) {
    if (line.includes('1: const express')) started = true;
    if (started) {
       if (line.match(/^\d+:\s/)) {
           cleanLines.push(line.replace(/^\d+:\s*/, ''));
       } else if (line.includes('The above content does NOT show')) {
           break;
       } else {
           cleanLines.push(line);
       }
    }
  }

  // Add the reject endpoint end
  cleanLines.push('    text: `Your Smart Laundry application was rejected.\\n\\nReason: ${rejectionReason}`');
  cleanLines.push('  };');
  cleanLines.push('  sendEmail(mailOptions).catch(e => console.error("Staff rejection mail error:", e.message));');
  cleanLines.push('');
  cleanLines.push('  res.json({ success: true, message: `Staff application for ${targetUser.name} has been rejected.` });');
  cleanLines.push('});');

  // Add the extra endpoints
  const rest = fs.readFileSync('reconstruct.py', 'utf8').split('rest = """')[1].split('"""')[0];
  cleanLines.push(rest);

  fs.writeFileSync('server.js', cleanLines.join('\n'));
  console.log('SUCCESS!');
} catch (e) {
  console.log('ERROR: ' + e.message);
}
