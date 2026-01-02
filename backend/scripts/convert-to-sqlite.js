// Script to update all model files from MySQL to SQLite
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../models');
const modelFiles = [
  'Admin.js', 'Car.js', 'Company.js', 'Driver.js',  
  'Route.js', 'Stop.js', 'Ticket.js', 'Trip.js'
];

function convertModelToSQLite(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add queryOne import if query is imported
  if (content.includes("const { query } = require('../config/database');")) {
    content = content.replace(
      "const { query } = require('../config/database');",
      "const { query, queryOne } = require('../config/database');"
    );
  }
  
  // Replace await query with synchronous query for INSERT/UPDATE/DELETE
  content = content.replace(/await query\(/g, 'query(');
  
  // Replace result.insertId with result.lastInsertRowid
  content = content.replace(/result\.insertId/g, 'result.lastInsertRowid');
  
  // Replace results[0] patterns with queryOne for SELECT queries
  content = content.replace(/const results = await query\(([\s\S]*?)\);\s*return results\[0\]/g, 
    'return queryOne($1)');
  
  // Replace NOW() with datetime('now')
  content = content.replace(/NOW\(\)/g, "datetime('now')");
  
  // Replace CURDATE() with date('now')
  content = content.replace(/CURDATE\(\)/g, "date('now')");
  
  // Replace MySQL DATE_FORMAT with strftime
  content = content.replace(/DATE_FORMAT\(([\w.]+),\s*'%Y-%m-%d'\)/g, "date($1)");
  
  // Fix Promise.all patterns for count queries
  content = content.replace(/const \[(\w+), countResult\] = await Promise\.all\(\[\s*query\(([\s\S]*?)\),\s*query\(([\s\S]*?)\)\s*\]\);/g,
    'const $1 = query($2);\n    const countResult = queryOne($3);');
  
  // Replace countResult[0].total with countResult.total
  content = content.replace(/countResult\[0\]\.total/g, 'countResult.total');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Updated ${path.basename(filePath)}`);
}

console.log('Converting model files to SQLite...\n');

modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  if (fs.existsSync(filePath)) {
    try {
      convertModelToSQLite(filePath);
    } catch (error) {
      console.error(`✗ Error updating ${file}:`, error.message);
    }
  } else {
    console.log(`⚠ File not found: ${file}`);
  }
});

console.log('\nConversion complete!');
