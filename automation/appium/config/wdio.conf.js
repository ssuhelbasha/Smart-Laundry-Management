'use strict';

const path = require('path');

const config = {
  // Appium Server
  hostname: process.env.APPIUM_HOST || 'localhost',
  port: parseInt(process.env.APPIUM_PORT || '4723'),
  path: '/wd/hub',
  
  // Test Runner
  runner: 'local',
  framework: 'mocha',
  
  // Capabilities
  capabilities: [{
    platformName: 'Android',
    'appium:deviceName': process.env.DEVICE_NAME || 'emulator-5554',
    'appium:platformVersion': process.env.PLATFORM_VERSION || '9.0',
    'appium:app': path.resolve(process.env.APK_PATH || '../../app/build/outputs/apk/debug/app-debug.apk'),
    'appium:appPackage': 'com.smartlaundry',
    'appium:appActivity': 'com.smartlaundry.MainActivity',
    'appium:automationName': 'UiAutomator2',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 90,
    'appium:androidInstallTimeout': 120000,
    'appium:adbExecTimeout': 60000,
    'appium:uiautomator2ServerInstallTimeout': 60000,
    'appium:autoGrantPermissions': true,
  }],
  
  // Timeouts
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  
  // Mocha Options
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
    retries: 2,
  },
  
  // Reporters
  reporters: [
    'spec',
    ['allure', {
      outputDir: 'reports/allure-results',
      disableWebdriverStepsReporting: false,
    }],
  ],
  
  // Hooks
  before: async function() {
    const { mkdirSync } = require('fs');
    ['reports/screenshots', 'reports/logs', 'reports/html', 'reports/excel', 'reports/json'].forEach(dir => {
      try { mkdirSync(dir, { recursive: true }); } catch(e) {}
    });
  },
  
  afterTest: async function(test, context, { error, result, duration, passed }) {
    if (!passed && this.driver) {
      const timestamp = Date.now();
      const testName = test.title.replace(/[^a-z0-9]/gi, '_');
      try {
        await this.driver.saveScreenshot(`reports/screenshots/FAIL_${testName}_${timestamp}.png`);
      } catch(e) { console.log('Screenshot failed:', e.message); }
    }
  },
};

module.exports = { config };
