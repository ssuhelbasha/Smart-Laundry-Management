'use strict';
/**
 * Page Object: LoginPage
 * Smart Laundry Web Selenium Framework
 */
class LoginPage {
  constructor(driver) {
    this.driver = driver;
  }

  get emailInput() { return this.driver.findElement({ css: 'input[type="email"], input[name="email"], input[placeholder*="email" i]' }); }
  get passwordInput() { return this.driver.findElement({ css: 'input[type="password"], input[name="password"], input[placeholder*="password" i]' }); }
  get loginButton() { return this.driver.findElement({ css: 'button[type="submit"], button:has-text("Login"), .btn-login' }); }
  get errorMessage() { return this.driver.findElement({ css: '.error-message, .alert-danger, [role="alert"]' }); }
  get registerLink() { return this.driver.findElement({ css: 'button:has-text("Register"), a[href*="register"]' }); }
  get forgotPasswordLink() { return this.driver.findElement({ css: 'button:has-text("Forgot"), a[href*="forgot"]' }); }

  async open(baseUrl) {
    await this.driver.get(baseUrl);
  }

  async login(email, password) {
    const emailEl = await this.emailInput;
    await emailEl.clear();
    await emailEl.sendKeys(email);

    const passEl = await this.passwordInput;
    await passEl.clear();
    await passEl.sendKeys(password);

    const btn = await this.loginButton;
    await btn.click();
  }

  async getError() {
    try {
      const err = await this.errorMessage;
      return await err.getText();
    } catch {
      return null;
    }
  }
}

module.exports = LoginPage;
