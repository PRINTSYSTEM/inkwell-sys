const fs = require('fs');
const content = fs.readFileSync('w:/DevPool/PrintSytem/inkwell-sys/src/generated/openapi.zod.ts', 'utf8');

const index = content.indexOf('UpdateMaterialCut');
if (index !== -1) {
  console.log("Found UpdateMaterialCut at index:", index);
} else {
  console.log("UpdateMaterialCut NOT found");
}
