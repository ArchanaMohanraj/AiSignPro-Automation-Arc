
const { expect } = require('@playwright/test');

class CustomerPage {
    constructor(page) {
        this.page = page;

        this.mobileInput = page.getByPlaceholder('Enter mobile number');
        this.contactNameInput = page.getByPlaceholder('Enter contact name');
        this.emailInput = page.getByPlaceholder('Enter email ID');

        this.addCustomerButton = page.getByRole('button', {
            name: /Add Customer/i
        }).first();

        this.assignDocumentsButton = page.locator('button')
            .filter({
                hasText: /Assign Documents|Assign Agreements/i
            }).first();

        this.okButton = page.getByRole('button', {
            name: 'OK',
            exact: true
        });

        this.cancelButton = page.getByRole('button', {
            name: /^Cancel$/i
        }).last();

        this.duplicateMessage = page.getByText(
            /already exists|already registered|duplicate|already in use|already taken|each customer needs their own number|use a different email address/i
        ).first();

        this.customerSuccessMessage = page.getByText(
            /customer.*created successfully|successfully.*created/i
        ).first();
    }

    async navigateToCustomers() {
        console.log('TC04: Navigating to Customers...');

        await this.page.goto('/customers', {
            waitUntil: 'domcontentloaded'
        });

        await expect(
            this.page.getByText('Customers List', {
                exact: true
            })
        ).toBeVisible({
            timeout: 30000
        });

        console.log('Customers page opened.');
    }

    async openAddCustomer() {
        console.log('Opening Add Customer form...');

        await expect(this.addCustomerButton).toBeVisible({
            timeout: 15000
        });

        await this.addCustomerButton.click();

        await expect(this.mobileInput).toBeVisible({
            timeout: 20000
        });

        console.log('Add Customer form opened.');
    }

    async fillCustomerDetails(customer) {
        console.log('Entering customer details...');

        await this.mobileInput.fill(customer.phone);
        await this.contactNameInput.fill(customer.name);
        await this.emailInput.fill(customer.email);

        const enteredPhone = (
            await this.mobileInput.inputValue()
        ).replace(/\D/g, '');

        const expectedPhone = customer.phone.replace(/\D/g, '');

        expect(enteredPhone).toBe(expectedPhone);

        await expect(this.contactNameInput).toHaveValue(customer.name);
        await expect(this.emailInput).toHaveValue(customer.email);

        console.log('Customer details filled and verified.');
    }

    async clickAssignDocuments() {
        await expect(this.assignDocumentsButton).toBeVisible({
            timeout: 15000
        });

        await expect(this.assignDocumentsButton).toBeEnabled();
        await this.assignDocumentsButton.click();

        console.log('Assign Documents clicked.');
    }

    async handleDuplicatePopup() {
        console.log('Checking duplicate customer validation...');

        await expect(this.duplicateMessage).toBeVisible({
            timeout: 15000
        });

        const message = await this.duplicateMessage.innerText();
        console.log('Duplicate validation message:', message);

        await expect(this.okButton).toBeVisible({
            timeout: 10000
        });

        await this.okButton.click();

        await expect(this.duplicateMessage).toBeHidden({
            timeout: 10000
        });

        console.log('Duplicate popup closed.');
    }

    async closeAddCustomerForm() {
        console.log('Checking whether Add Customer form is open...');

        const formIsOpen = await this.mobileInput
            .isVisible()
            .catch(() => false);

        if (formIsOpen) {
            await expect(this.cancelButton).toBeVisible({
                timeout: 10000
            });

            await this.cancelButton.click();

            await expect(this.mobileInput).toBeHidden({
                timeout: 15000
            });

            console.log('Add Customer form closed.');
        } else {
            console.log('Add Customer form is already closed.');
        }
    }

    async verifyCustomerListPage() {
        await expect(
            this.page.getByText('Customers List', {
                exact: true
            })
        ).toBeVisible({
            timeout: 15000
        });

        console.log('Customers list page verified.');
    }

    async handleCustomerSuccessPopup() {
        console.log('Waiting for customer success popup...');

        await expect(this.customerSuccessMessage).toBeVisible({
            timeout: 20000
        });

        console.log('Customer created successfully.');

        await expect(this.okButton).toBeVisible();
        await this.okButton.click();

        console.log('Customer success popup closed.');
    }

    async waitForAssignAgreementsPage() {
        console.log('Waiting for Assign Agreements page...');

        await expect(this.page).toHaveURL(
            /assign-agreement/i,
            {
                timeout: 30000
            }
        );

        await expect(
            this.page.getByText('Assign Documents', {
                exact: true
            }).first()
        ).toBeVisible({
            timeout: 20000
        });

        console.log('Assign Agreements page opened.');
    }

    async createCustomer(customer) {
        await this.openAddCustomer();
        await this.fillCustomerDetails(customer);
        await this.clickAssignDocuments();
        await this.handleCustomerSuccessPopup();
        await this.waitForAssignAgreementsPage();
    }

    async verifyDuplicateCustomer(customer, scenarioName) {
        console.log('');
        console.log('========================================');
        console.log('Testing:', scenarioName);
        console.log('========================================');

        await this.openAddCustomer();
        await this.fillCustomerDetails(customer);
        await this.clickAssignDocuments();
        await this.handleDuplicatePopup();
        await this.closeAddCustomerForm();
        await this.verifyCustomerListPage();

        console.log('Duplicate customer was not allowed to proceed.');
        console.log('PASSED: Duplicate validation -', scenarioName);
        console.log('========================================');
    }
}

module.exports = { CustomerPage };
