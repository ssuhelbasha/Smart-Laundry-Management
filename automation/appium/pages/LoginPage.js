'use strict';
/**
 * Page Object: LoginPage
 * Smart Laundry Appium Framework
 */
class LoginPage {
  constructor(driver) {
    this.driver = driver;
  }

  // ── Selectors ────────────────────────────────────────────
  get emailField()     { return this.driver.$('~email_input'); }
  get passwordField()  { return this.driver.$('~password_input'); }
  get loginButton()    { return this.driver.$('~login_button'); }
  get errorMessage()   { return this.driver.$('~error_message'); }
  get forgotPassword() { return this.driver.$('~forgot_password_link'); }
  get registerTab()    { return this.driver.$('~register_tab'); }

  // ── Actions ───────────────────────────────────────────────
  async enterEmail(email) {
    const el = await this.emailField;
    await el.clearValue();
    await el.setValue(email);
  }

  async enterPassword(password) {
    const el = await this.passwordField;
    await el.clearValue();
    await el.setValue(password);
  }

  async tapLogin() {
    const el = await this.loginButton;
    await el.click();
    await this.driver.pause(2000);
  }

  async login(email, password) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.tapLogin();
  }

  async getErrorText() {
    try {
      const el = await this.errorMessage;
      await el.waitForDisplayed({ timeout: 5000 });
      return await el.getText();
    } catch { return null; }
  }

  async isDisplayed() {
    try {
      const el = await this.loginButton;
      return await el.isDisplayed();
    } catch { return false; }
  }
}

module.exports = LoginPage;
