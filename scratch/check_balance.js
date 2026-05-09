import fs from 'fs';

const content = fs.readFileSync('w:/DevPool/PrintSytem/inkwell-sys/src/components/proofing/DieExportDialog.tsx', 'utf8');

function checkBalance(text) {
  let curly = 0;
  let square = 0;
  let paren = 0;
  let lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let char of line) {
      if (char === '{') curly++;
      if (char === '}') curly--;
      if (char === '[') square++;
      if (char === ']') square--;
      if (char === '(') paren++;
      if (char === ')') paren--;
    }
    if (curly < 0 || square < 0 || paren < 0) {
      console.log(`Unbalanced at line ${i + 1}: curly=${curly}, square=${square}, paren=${paren}`);
      // Reset to avoid cascade
      if (curly < 0) curly = 0;
      if (square < 0) square = 0;
      if (paren < 0) paren = 0;
    }
  }
  console.log(`Final balance: curly=${curly}, square=${square}, paren=${paren}`);
}

checkBalance(content);
