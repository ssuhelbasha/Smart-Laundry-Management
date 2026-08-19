const fs = require('fs');
let file = fs.readFileSync('server.js', 'utf8');

const targetStr = `.insert([{
            user_id: userId,
            name,
            email: lowerEmail,
            password: hashPassword(password),
            phone,
            address,
            role: selectedRole,
            wallet_balance: 0.00,
            status,
            staff_photo: staff_photo || null,
            machines_photo: machines_photo || null,
            utilities_photo: utilities_photo || null,
            location_details: location_details || null
          }]);`;

const replacementStr = `.insert([{
            user_id: userId,
            name,
            email: lowerEmail,
            password: hashPassword(password),
            phone,
            address,
            role: selectedRole === 'staff' ? 'pending_staff' : selectedRole,
            wallet_balance: 0.00
          }]);`;

file = file.replace(targetStr, replacementStr);
fs.writeFileSync('server.js', file);
console.log("Patched successfully");
