'use strict';
/**
 * Page Object: DashboardPage (Customer/Admin/Staff)
 * Smart Laundry Appium Framework
 */
class DashboardPage {
  constructor(driver) {
    this.driver = driver;
  }

  get customerDashboard()   { return this.driver.$('~customer_dashboard'); }
  get adminDashboard()      { return this.driver.$('~admin_dashboard'); }
  get staffDashboard()      { return this.driver.$('~staff_dashboard'); }
  get walletBalance()       { return this.driver.$('~wallet_balance'); }
  get logoutButton()        { return this.driver.$('~logout_button'); }
  get placeOrderButton()    { return this.driver.$('~place_order_button'); }
  get orderHistoryButton()  { return this.driver.$('~order_history_button'); }
  get topupWalletButton()   { return this.driver.$('~topup_wallet_button'); }
  get orderCount()          { return this.driver.$('~order_count'); }

  async isCustomerDashboardVisible() {
    try {
      const el = await this.customerDashboard;
      return await el.isDisplayed();
    } catch { return false; }
  }

  async isAdminDashboardVisible() {
    try {
      const el = await this.adminDashboard;
      return await el.isDisplayed();
    } catch { return false; }
  }

  async isStaffDashboardVisible() {
    try {
      const el = await this.staffDashboard;
      return await el.isDisplayed();
    } catch { return false; }
  }

  async getWalletBalance() {
    try {
      const el = await this.walletBalance;
      return await el.getText();
    } catch { return null; }
  }

  async tapLogout() {
    const el = await this.logoutButton;
    await el.click();
    await this.driver.pause(1000);
  }

  async tapPlaceOrder() {
    const el = await this.placeOrderButton;
    await el.click();
    await this.driver.pause(500);
  }
}

module.exports = DashboardPage;
