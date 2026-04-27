#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'app', 'public', 'js', 'main.js');
const FROM = "showToast('User added successfully')";
const TO   = "showToast('User created successfully')";

const src = fs.readFileSync(FILE, 'utf8');

if (!src.includes(FROM)) {
  console.log('Nothing to change — already broken or source has changed.');
  process.exit(0);
}

fs.writeFileSync(FILE, src.replace(FROM, TO));

console.log('Break applied.');
console.log('');
console.log('  What changed:');
console.log("    app/public/js/main.js — toast text 'User added successfully' → 'User created successfully'");
console.log('');
console.log('  Why it breaks:');
console.log("    expectToast('User added') uses toContainText — 'User created successfully' no longer matches.");
console.log('    The modal closes and data saves correctly, so API tests stay green.');
console.log('    Only E2E tests that assert the toast wording will fail.');
console.log('');
console.log('  @critical tests that will fail:');
console.log('    Dashboard  — adds a new user and shows success toast');
console.log('    Edit User  — saving a valid edit updates the row in the table');
console.log('');
console.log('  To fix:  npm run demo:fix');
