'use strict';
const fs = require('fs');
const path = require('path');

class Logger {
  constructor(context = 'General') {
    this.context = context;
    this.logDir = 'reports/logs';
    fs.mkdirSync(this.logDir, { recursive: true });
    this.logFile = path.join(this.logDir, 'selenium-execution.log');
  }
  _write(level, message) {
    const line = `[${new Date().toISOString()}] [${level.padEnd(5)}] [${this.context}] ${message}`;
    console.log(line);
    try { fs.appendFileSync(this.logFile, line + '\n'); } catch(e) {}
  }
  info(m)  { this._write('INFO',  m); }
  warn(m)  { this._write('WARN',  m); }
  error(m) { this._write('ERROR', m); }
  pass(m)  { this._write('PASS',  `✅ ${m}`); }
  fail(m)  { this._write('FAIL',  `❌ ${m}`); }
}

module.exports = Logger;
