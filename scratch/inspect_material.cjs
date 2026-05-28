const fs = require('fs');
const content = fs.readFileSync('w:/DevPool/PrintSytem/inkwell-sys/src/generated/openapi.zod.ts', 'utf8');

const index = content.indexOf('MaterialResponse =');
if (index !== -1) {
  console.log(content.substring(index, index + 1200));
} else {
  console.log("MaterialResponse not found");
}
