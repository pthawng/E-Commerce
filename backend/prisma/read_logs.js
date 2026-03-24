const fs = require('fs');
const path = require('path');

function readAndPrint(filename) {
  const filePath = path.join(__dirname, '..', filename);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf16le');
    console.log(`--- ${filename} ---`);
    console.log(content);
  } else {
    console.log(`${filename} not found`);
  }
}

readAndPrint('db_check.log');
readAndPrint('seed.log');
