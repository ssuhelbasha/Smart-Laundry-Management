'use strict';
/**
 * Logger Utility
 * Smart Laundry Management – Appium E2E Framework
 */
const fs = require('fs');
const path = require('path');

class Logger {
  constructor(context = 'General') {
    this.context = context;
    this.logDir = 'reports/logs';
    this.logFile = path.join(this.logDir, 'test-execution.log');
    
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  _write(level, message) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level.padEnd(5)}] [${this.context}] ${message}`;
    console.log(line);
    try {
      fs.appendFileSync(this.logFile, line + '\n');
    } catch (e) { /* ignore write errors */ }
  }

  info(msg)  { this._write('INFO', msg); }
  warn(msg)  { this._write('WARN', msg); }
  error(msg) { this._write('ERROR', msg); }
  debug(msg) { this._write('DEBUG', msg); }
  pass(msg)  { this._write('PASS', `✅ ${msg}`); }
  fail(msg)  { this._write('FAIL', `❌ ${msg}`); }
  skip(msg)  { this._write('SKIP', `⏭️ ${msg}`); }
}

module.exports = Logger;
