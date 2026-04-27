#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'app', 'public', 'js', 'main.js');
const FROM = "showToast('User created successfully')";
const TO   = "showToast('User added successfully')";

const src = fs.readFileSync(FILE, 'utf8');

if (!src.includes(FROM)) {
  console.log('Nothing to revert — already fixed or source has changed.');
  process.exit(0);
}

fs.writeFileSync(FILE, src.replace(FROM, TO));

console.log('Fix applied.');
console.log('');
console.log("  app/public/js/main.js — toast text restored to 'User added successfully'");
console.log('');
console.log('  All @critical and @regression tests should now pass.');
console.log('  Run:  npx playwright test --grep @critical');
