import fs from 'fs';
const swagger = JSON.parse(fs.readFileSync('w:/DevPool/PrintSytem/inkwell-sys/swagger (2).json', 'utf8'));
const pathObj = swagger.paths['/api/stock-ins'];
console.log('POST full:', JSON.stringify(pathObj?.post, null, 2));
