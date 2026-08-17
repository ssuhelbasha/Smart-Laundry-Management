'use strict';
/**
 * DriverManager – Manages Appium WebdriverIO sessions
 * Smart Laundry Management – Appium E2E Framework
 */
const { remote } = require('webdriverio');
const AppiumConfig = require('../config/wdio.conf');
const Logger = require('../utils/logger');

let driverInstance = null;
const logger = new Logger('DriverManager');

class DriverManager {
  /**
   * Initialize and return Appium driver session
   */
  static async getDriver() {
    if (driverInstance) return driverInstance;
    
    const caps = AppiumConfig.config.capabilities[0];
    
    logger.info(`Connecting to Appium at ${AppiumConfig.config.hostname}:${AppiumConfig.config.port}`);
    logger.info(`Device: ${caps['appium:deviceName']} | Platform: ${caps['appium:platformVersion']}`);
    
    try {
      driverInstance = await remote({
        hostname: AppiumConfig.config.hostname,
        port: AppiumConfig.config.port,
        path: AppiumConfig.config.path || '/wd/hub',
        capabilities: caps,
        connectionRetryTimeout: 120000,
        connectionRetryCount: 3,
        logLevel: 'warn',
      });
      
      logger.info('✅ Appium driver session created successfully');
      return driverInstance;
    } catch (err) {
      logger.error(`❌ Failed to create Appium session: ${err.message}`);
      throw err;
    }
  }

  /**
   * Quit the driver session
   */
  static async quitDriver() {
    if (driverInstance) {
      try {
        await driverInstance.deleteSession();
        logger.info('Driver session terminated');
      } catch (e) {
        logger.warn(`Session termination warning: ${e.message}`);
      } finally {
        driverInstance = null;
      }
    }
  }

  /**
   * Take a screenshot and save to reports directory
   */
  static async takeScreenshot(driver, name) {
    const fs = require('fs');
    const dir = 'reports/screenshots';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `${dir}/${name}_${timestamp}.png`;
    
    try {
      await driver.saveScreenshot(filePath);
      logger.info(`Screenshot saved: ${filePath}`);
      return filePath;
    } catch (e) {
      logger.warn(`Screenshot failed: ${e.message}`);
      return null;
    }
  }

  /**
   * Wait for element with retry logic
   */
  static async waitForElement(driver, selector, timeout = 10000) {
    const element = await driver.$(selector);
    await element.waitForDisplayed({ timeout });
    return element;
  }

  /**
   * Restart the app
   */
  static async restartApp(driver) {
    await driver.closeApp();
    await driver.launchApp();
    await driver.pause(2000);
  }
}

module.exports = DriverManager;
