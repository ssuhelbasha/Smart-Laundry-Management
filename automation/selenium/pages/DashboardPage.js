'use strict';
/**
 * Page Object: DashboardPage
 * Smart Laundry Web Selenium Framework
 */
class DashboardPage {
  constructor(driver) {
    this.driver = driver;
  }

  get userWelcome() { return this.driver.findElement({ css: '.welcome-text, h1, h2' }); }
  get logoutButton() { return this.driver.findElement({ css: 'button:has-text("Logout"), .btn-logout' }); }
  get walletBalance() { return this.driver.findElement({ css: '.wallet-balance, [data-testid="wallet-balance"]' }); }
  get placeOrderBtn() { return this.driver.findElement({ css: '.btn-place-order, button:has-text("Place Order")' }); }
  get ordersTable() { return this.driver.findElement({ css: 'table, .orders-list' }); }

  async logout() {
    const btn = await this.logoutButton;
    await btn.click();
  }

  async getBalanceText() {
    try {
      const el = await this.walletBalance;
      return await el.getText();
    } catch {
      return '0.00';
    }
  }
}

module.exports = DashboardPage;
