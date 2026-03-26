const fs = require('fs');
const content = fs.readFileSync('test_output.txt', 'utf16le');
console.log(content);
