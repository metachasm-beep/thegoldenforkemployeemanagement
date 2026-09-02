const fs = require('fs');
let code = fs.readFileSync('src/app/components/DashboardLayout.tsx', 'utf8');

const regex = /\/\/ Feature 5: Auto-logout after 15 minutes of inactivity[\s\S]*?return \(\) => {[\s\S]*?clearTimeout\(timeout\);[\s\S]*?};\s*\}, \[\]\);/g;

// Instead of regex, I will just do string replacement
code = code.replace(`
    // Feature 5: Auto-logout after 15 minutes of inactivity
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        signOut();
      }, 15 * 60 * 1000); // 15 mins
    };
    
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('click', resetTimer);
    
    resetTimer();
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('click', resetTimer);
    };`, '');

fs.writeFileSync('src/app/components/DashboardLayout.tsx', code);
