const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(srcDir);

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Regex to match the debug label div block and optional comment
    const regex = /\{\/\* File Label for Debugging \*\/\}?\s*<div className="absolute[^"]*font-mono pointer-events-none[^"]*">[\s\S]*?<\/div>/g;
    
    if (regex.test(content)) {
      console.log(`Cleaning up: ${file}`);
      const newContent = content.replace(regex, '');
      fs.writeFileSync(file, newContent, 'utf8');
    }
  }
});
