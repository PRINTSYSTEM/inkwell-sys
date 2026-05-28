const fs = require('fs');
const content = fs.readFileSync('w:/DevPool/PrintSytem/inkwell-sys/src/generated/openapi.zod.ts', 'utf8');

const regex = /const\s+InventoryTransactionResponse\s*=\s*[\s\S]+?\}\)\.partial\(\);/g;
const match = content.match(regex);
if (match) {
  console.log("MATCH:", match[0]);
} else {
  console.log("NOT FOUND, let's search for just the word");
  const index = content.indexOf('InventoryTransactionResponse =');
  if (index !== -1) {
    console.log("FOUND AT INDEX:", index);
    console.log(content.substring(index, index + 1000));
  } else {
    console.log("Word NOT FOUND at all");
  }
}
