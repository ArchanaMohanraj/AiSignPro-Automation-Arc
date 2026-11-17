const { expect } = require('@playwright/test');

class LoginPage {
    constructor(page) {
        this.page = page;

        this.phoneInput = page.locator('#phone');

        this.termsCheckbox = page.locator(
            'input[type="checkbox"]'
        ).first();

        this.loginButton = page.getByRole('button', {
            name: /Sign in/i
        });

        this.otpInputs = page.locator('input[name^="otp"]');

        this.verifyButton = page.getByRole('button', {
            name: 'Verify',
            exact: true
        });
    }

    async navigate() {
        console.log('Opening AiSignPro...');

        await this.page.goto('/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        await this.phoneInput.waitFor({
            state: 'visible',
            timeout: 30000
        });

        console.log('AiSignPro website opened successfully.');
    }

    async enterPhoneNumber(phone) {
        await this.phoneInput.fill(phone);
        await this.termsCheckbox.check();
    }

    async clickSignIn() {
        await this.loginButton.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await expect(this.loginButton).toBeEnabled();

        await this.loginButton.click();
    }

    async waitForOtpScreen() {
        console.log('Please complete CAPTCHA manually.');

        await this.otpInputs.first().waitFor({
            state: 'visible',
            timeout: 120000
        });

        console.log('OTP screen displayed successfully.');
    }

    async enterOtp(otp) {
        const otpDigits = otp.toString().split('');

        for (let i = 0; i < otpDigits.length; i++) {
            await this.otpInputs.nth(i).fill(otpDigits[i]);
        }
    }

    async verifyOtp() {
        await this.verifyButton.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await this.verifyButton.click();

        console.log('OTP verification submitted.');
    }

    async login(phone, otp) {
        await this.enterPhoneNumber(phone);
        await this.clickSignIn();
        await this.waitForOtpScreen();
        await this.enterOtp(otp);
        await this.verifyOtp();

        console.log('Login flow completed.');
    }
}

module.exports = { LoginPage };