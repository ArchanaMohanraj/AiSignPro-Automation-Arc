const { test, expect } = require('@playwright/test');

const { LoginPage } = require('../pages/LoginPage');
const { CustomerPage } = require('../pages/CustomerPage');
const { AssignAgreementPage } = require('../pages/AssignAgreementPage');

const testData = require('../test-data/customerData.json');

const fs = require('fs');
const path = require('path');

test.setTimeout(300000);

// Generate unique customer details for every execution.
function generateUniqueCustomer() {
    const timestamp = Date.now().toString();

    return {
        name: `QA Customer ${timestamp.slice(-6)}`,
        phone: `9${timestamp.slice(-9)}`,
        email: `qa${timestamp}@mailinator.com`
    };
}

// Generate unique details while retaining an existing duplicate value.
function generateUniquePhone() {
    return `9${Date.now().toString().slice(-9)}`;
}

function generateUniqueEmail() {
    return `qa${Date.now()}@mailinator.com`;
}

// Handle login validation popup.
// Do not assert that the permanent Mobile number label disappears.
async function handleLoginPopup(page) {
    const okButton = page.getByRole('button', {
        name: 'OK',
        exact: true
    });

    await expect(okButton).toBeVisible({
        timeout: 15000
    });

    await okButton.click();

    // Verify that the popup is closed.
    await expect(okButton).toBeHidden({
        timeout: 10000
    });

    console.log('Validation popup closed successfully.');
}

test('AiSignPro - TC01 to TC16 - Complete Customer Agreement Flow', async ({ page }) => {

    const loginPage = new LoginPage(page);
    const customerPage = new CustomerPage(page);
    const agreementPage = new AssignAgreementPage(page);

    const customer = generateUniqueCustomer();

    const duplicateCustomer = testData.duplicateCustomer;
    const validPhone = testData.login.phone;
    const validOtp = testData.login.otp;

    const evidenceDirectory = path.join(
        process.cwd(),
        'evidence'
    );

    fs.mkdirSync(evidenceDirectory, {
        recursive: true
    });

    // =====================================================
    // TC01 - VERIFY LOGIN WITH INVALID MOBILE NUMBER
    // =====================================================

    await test.step('TC01 - Verify login with invalid mobile number', async () => {

        console.log('\nTC01 - Invalid mobile number');

        await loginPage.navigate();

        await loginPage.enterPhoneNumber('9000000000');

        await loginPage.clickSignIn();

        await handleLoginPopup(page);

        console.log('PASSED: Invalid mobile number validation.');
    });

    // =====================================================
    // TC02 - VERIFY LOGIN WITH INVALID OTP
    // =====================================================

    await test.step('TC02 - Verify login with invalid OTP', async () => {

        console.log('\nTC02 - Invalid OTP');

        await loginPage.navigate();

        await loginPage.enterPhoneNumber(validPhone);

        await loginPage.clickSignIn();

        console.log('Complete CAPTCHA manually in the browser.');

        await loginPage.waitForOtpScreen();

        await loginPage.enterOtp('000000');

        await loginPage.verifyOtp();

        await handleLoginPopup(page);

        console.log('PASSED: Invalid OTP validation.');
    });

    // =====================================================
    // TC03 - LOGIN WITH VALID CREDENTIALS
    // =====================================================

    await test.step('TC03 - Login with valid credentials', async () => {

        console.log('\nTC03 - Valid login');

        await loginPage.navigate();

        await loginPage.enterPhoneNumber(validPhone);

        await loginPage.clickSignIn();

        console.log('Complete CAPTCHA manually in the browser.');

        await loginPage.waitForOtpScreen();

        await loginPage.enterOtp(validOtp);

        await loginPage.verifyOtp();

        await expect(page).toHaveURL(
            /customers|dashboard/i,
            {
                timeout: 60000
            }
        );

        console.log('PASSED: Login successful.');
    });

    // =====================================================
    // TC04 - NAVIGATE TO CUSTOMERS
    // =====================================================

    await test.step('TC04 - Navigate to Customers', async () => {

        console.log('\nTC04 - Navigate to Customers');

        await customerPage.navigateToCustomers();

        await customerPage.verifyCustomerListPage();

        console.log('PASSED: Customers page opened.');
    });

    // =====================================================
    // TC05 - DUPLICATE PHONE VALIDATION
    // =====================================================

    await test.step('TC05 - Verify duplicate phone validation', async () => {

        console.log('\nTC05 - Duplicate phone validation');

        const duplicatePhoneData = {
            name: `QA Duplicate Phone ${Date.now()}`,
            phone: duplicateCustomer.phone,
            email: generateUniqueEmail()
        };

        await customerPage.verifyDuplicateCustomer(
            duplicatePhoneData,
            'Duplicate Phone'
        );

        console.log('PASSED: Duplicate phone validation.');
    });

    // =====================================================
    // TC06 - DUPLICATE EMAIL VALIDATION
    // =====================================================

    await test.step('TC06 - Verify duplicate email validation', async () => {

        console.log('\nTC06 - Duplicate email validation');

        const duplicateEmailData = {
            name: `QA Duplicate Email ${Date.now()}`,
            phone: generateUniquePhone(),
            email: duplicateCustomer.email
        };

        await customerPage.verifyDuplicateCustomer(
            duplicateEmailData,
            'Duplicate Email'
        );

        console.log('PASSED: Duplicate email validation.');
    });

    // =====================================================
    // TC07 - DUPLICATE PHONE AND EMAIL VALIDATION
    // =====================================================

    await test.step('TC07 - Verify duplicate phone and email validation', async () => {

        console.log('\nTC07 - Duplicate phone and email validation');

        const duplicateBothData = {
            name: `QA Duplicate Both ${Date.now()}`,
            phone: duplicateCustomer.phone,
            email: duplicateCustomer.email
        };

        await customerPage.verifyDuplicateCustomer(
            duplicateBothData,
            'Duplicate Phone and Email'
        );

        console.log('PASSED: Duplicate phone and email validation.');
    });

    // =====================================================
    // TC08 - CREATE NEW CUSTOMER
    // =====================================================

    await test.step('TC08 - Create new customer', async () => {

        console.log('\nTC08 - Create new customer');

        await customerPage.createCustomer(customer);

        console.log('PASSED: New customer creation flow completed.');
    });

    // =====================================================
    // TC09 - ASSIGN DOCUMENT AND SEND AGREEMENT EMAIL
    // =====================================================

    await test.step('TC09 - Assign document and send agreement email', async () => {

        console.log('\nTC09 - Assign document and send agreement email');

        await agreementPage.assignDocument();

        console.log('PASSED: Agreement send flow completed.');
    });

    // =====================================================
    // TC10 - VERIFY CUSTOMER DETAILS IN GRID
    // =====================================================

    await test.step('TC10 - Verify customer details in grid', async () => {

        console.log('\nTC10 - Verify customer details in grid');

        await agreementPage.verifyCustomer(customer);

        console.log('PASSED: Customer details verified in grid.');
    });
    // =====================================================
    // TC11 - EXPAND CUSTOMER ROW
    // =====================================================

    await test.step('TC11 - Expand customer row', async () => {

        console.log('\nTC11 - Expand customer row');

        const customerName = page.getByText(
            customer.name,
            { exact: false }
        ).first();

        await expect(customerName).toBeVisible();

        const customerRow = customerName.locator(
            'xpath=ancestor::tr[1]'
        );

        // The first caret is the expand icon in the first column.
        const expandArrow = customerRow.locator(
            'td:first-child i.client-expand-caret'
        );

        await expect(expandArrow).toBeVisible();

        await expandArrow.click();

        await page.waitForTimeout(2000);

        await page.screenshot({
            path: 'evidence/TC11-expanded-customer-row.png',
            fullPage: true
        });

        console.log('PASSED: Customer row expanded.');
    });

    // =====================================================
    // TC12 - VERIFY PREVIEW OPENS AND CLOSES
    // =====================================================

    await test.step('TC12 - Verify preview opens and closes', async () => {

        console.log('\nTC12 - Verify preview opens and closes');

        const expandedRow = page.locator('tr.client-detail-row');

        const viewButton = expandedRow.locator(
            'button[ngbtooltip="View documents"]'
        );

        await expect(viewButton).toBeVisible({ timeout: 15000 });
        await viewButton.click();

        const previewOverlay = page.locator('.signed-doc-overlay');
        const previewBody = page.locator('.signed-doc-body');

        await expect(previewOverlay).toBeVisible({ timeout: 15000 });

        // Wait until the loading message disappears.
        await expect(
            previewBody.getByText('Loading document...', { exact: false })
        ).toHaveCount(0, { timeout: 60000 });

        // Close preview so TC13 can access the Download documents button.
        const closePreviewButton = previewOverlay.locator(
            '.signed-doc-header button.btn-light'
        );

        await expect(closePreviewButton).toBeVisible();
        await closePreviewButton.click();

        await expect(previewOverlay).toBeHidden({
            timeout: 15000
        });

        console.log('PASSED: Preview opened and closed.');
    });
    // =====================================================
    // TC13 - VERIFY DOWNLOAD DOCUMENTS POPUP
    // =====================================================

    await test.step('TC13 - Verify download documents popup', async () => {

        console.log('\nTC13 - Verify download documents popup');

        const expandedRow = page.locator('tr.client-detail-row');

        await expect(expandedRow).toBeVisible({
            timeout: 15000
        });

        const downloadButton = expandedRow.locator(
            'button[ngbtooltip="Download documents"]'
        );

        await expect(downloadButton).toBeVisible({
            timeout: 15000
        });

        await downloadButton.click();

        // Verify popup content.
        const selectAll = page.getByText('Select all', {
            exact: true
        });

        await expect(selectAll).toBeVisible({
            timeout: 15000
        });

        // Verify document A is listed.
        await expect(
            page.getByText('A', { exact: true }).last()
        ).toBeVisible({
            timeout: 15000
        });

        // Verify Cancel button.
        const cancelButton = page.getByRole('button', {
            name: 'Cancel',
            exact: true
        });

        await expect(cancelButton).toBeVisible();

        // Verify Download button.
        const downloadFileButton = page.getByRole('button', {
            name: /Download 1 file/i
        });

        await expect(downloadFileButton).toBeVisible();

        console.log('PASSED: Download documents popup verified.');
    });

    // =====================================================
    // TC14 - DOWNLOAD AGREEMENT PDF
    // =====================================================

    await test.step('TC14 - Download agreement PDF', async () => {

        console.log('\nTC14 - Download agreement PDF');

        const downloadButton = page.getByRole('button', {
            name: /download/i
        }).last();

        await expect(downloadButton).toBeVisible({
            timeout: 15000
        });

        const downloadPromise = page.waitForEvent(
            'download',
            {
                timeout: 60000
            }
        );

        await downloadButton.click();

        const download = await downloadPromise;

        const suggestedName = download.suggestedFilename();

        const downloadPath = path.join(
            evidenceDirectory,
            suggestedName
        );

        await download.saveAs(downloadPath);

        expect(fs.existsSync(downloadPath)).toBe(true);

        const fileStats = fs.statSync(downloadPath);

        expect(fileStats.size).toBeGreaterThan(0);

        expect(suggestedName.toLowerCase()).toContain('.pdf');

        console.log(`PASSED: Agreement PDF downloaded (${suggestedName}, ${fileStats.size} bytes).`);
    });

    // =====================================================
    // TC15 - VERIFY SIGNATURE IN DOWNLOADED AGREEMENT
    // =====================================================

    await test.step('TC15 - Verify signature persistence in downloaded agreement', async () => {

        console.log('\nTC15 - Verify downloaded agreement');

        const pdfFiles = fs.readdirSync(evidenceDirectory)
            .filter(file => file.toLowerCase().endsWith('.pdf'));

        expect(
            pdfFiles.length,
            'Downloaded PDF was not found in evidence folder.'
        ).toBeGreaterThan(0);

        const latestPdf = pdfFiles
            .map(file => ({
                name: file,
                path: path.join(evidenceDirectory, file),
                modified: fs.statSync(
                    path.join(evidenceDirectory, file)
                ).mtimeMs
            }))
            .sort((a, b) => b.modified - a.modified)[0];

        const pdfStats = fs.statSync(latestPdf.path);

        expect(pdfStats.size).toBeGreaterThan(0);

        const pdfBuffer = fs.readFileSync(latestPdf.path);

        const pdfHeader = pdfBuffer
            .subarray(0, 5)
            .toString('ascii');

        expect(pdfHeader).toBe('%PDF-');

        console.log('PASSED: PDF header verified (visual signature check not automated).');
    });

    // =====================================================
    // TC16 - LOGOUT FROM AISIGNPRO
    // =====================================================

    await test.step('TC16 - Logout from AiSignPro', async () => {

        console.log('\nTC16 - Logout from AiSignPro');

        await agreementPage.logout();

        await expect(page.locator('#phone')).toBeVisible({
            timeout: 30000
        });

        console.log('PASSED: Logout successful.');
    });

    console.log('\n========================================');
    console.log('TC01 TO TC16 EXECUTION COMPLETED');
    console.log('========================================');
});