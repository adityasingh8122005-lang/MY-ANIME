const fs = require('fs');

let adminCode = fs.readFileSync('src/pages/AdminPanelPage.jsx', 'utf8');
adminCode = adminCode.replace(/bg-\[#09090b\]/g, 'bg-void');
fs.writeFileSync('src/pages/AdminPanelPage.jsx', adminCode);

let buttonCode = fs.readFileSync('src/components/ui/Button.jsx', 'utf8');
buttonCode = buttonCode.replace(/bg-\[#8B5CF6\]/g, 'bg-primary');
buttonCode = buttonCode.replace(/bg-\[#A78BFA\]/g, 'bg-primary-hover');
buttonCode = buttonCode.replace(/bg-\[#7C3AED\]/g, 'bg-primary-dark');
buttonCode = buttonCode.replace(/from-\[#8B5CF6\]/g, 'from-primary');
buttonCode = buttonCode.replace(/to-\[#6366F1\]/g, 'to-secondary');
buttonCode = buttonCode.replace(/hover:from-\[#A78BFA\]/g, 'hover:from-primary-hover');
buttonCode = buttonCode.replace(/hover:to-\[#8B5CF6\]/g, 'hover:to-primary');
buttonCode = buttonCode.replace(/active:bg-\[#7C3AED\]/g, 'active:bg-primary-dark');
fs.writeFileSync('src/components/ui/Button.jsx', buttonCode);
