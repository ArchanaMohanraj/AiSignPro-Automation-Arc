const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

class AssignAgreementPage {
    constructor(page) {
        this.page = page;

        this.documentRow = page.getByText('A', {
            exact: true
        }).last();

        this.signatureField = page.getByText('Signature', {
            exact: true
        });

        this.documentDropZone = page.locator(
            'div.fpe-doc-area.fpe-place-zone'
        ).first();

        this.sendMailButton = page.locator('button')
            .filter({ hasText: /Send Mail/i })
            .first();

        this.sendAnywayButton = page.getByRole('button', {
            name: 'Send anyway',
            exact: true
        });

        this.continueToSendMailButton = page.getByRole('button', {
            name: /Continue to Send Mail/i
        }).last();

        this.continueButton = page.getByRole('button', {
            name: 'Continue',
            exact: true
        });

        this.emailSentMessage = page.getByText(
            /agreement email sent|email sent successfully|successfully sent/i
        );

        this.sendApiResponses = [];
        this.sendApiResponseHandler = null;
        this.signatureReference = null;
    }

    async selectDocument() {
        console.log('TC09: Selecting document...');

        await expect(this.documentRow).toBeVisible({
            timeout: 20000
        });

        const row = this.documentRow.locator('xpath=..');

        const checkbox = row.locator(
            'input[type="checkbox"]'
        );

        if (await checkbox.count()) {
            if (!(await checkbox.isChecked())) {
                await checkbox.check();
            }
        } else {
            await this.documentRow.click();
        }

        console.log('Document selected.');
    }

    async placeSignature() {
        console.log('Placing signature field...');

        await this.signatureField.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await this.documentDropZone.waitFor({
            state: 'visible',
            timeout: 15000
        });

        const signatureDraggable = this.signatureField.locator('..');

        const documentBox =
            await this.documentDropZone.boundingBox();

        if (!documentBox) {
            throw new Error('Document drop zone not found.');
        }

        await signatureDraggable.dragTo(
            this.documentDropZone,
            {
                targetPosition: {
                    x: Math.min(300, documentBox.width - 20),
                    y: Math.min(150, documentBox.height - 20)
                },
                timeout: 30000
            }
        );

        console.log('Signature drag-and-drop completed.');

        await this.page.waitForTimeout(2000);

        const evidenceDirectory = path.join(
            process.cwd(),
            'evidence'
        );

        fs.mkdirSync(evidenceDirectory, {
            recursive: true
        });

        const overlayCount = await this.documentDropZone.locator(
            '.fpe-field-overlay'
        ).count();

        if (overlayCount === 0) {
            await this.page.screenshot({
                path: path.join(
                    evidenceDirectory,
                    'signature-placement-diagnostic.png'
                ),
                fullPage: true
            });

            throw new Error(
                'Signature placement could not be verified. ' +
                'See evidence/signature-placement-diagnostic.png.'
            );
        }

        const signatureOverlay = this.documentDropZone.locator(
            '.fpe-field-overlay'
        ).first();

        await expect(signatureOverlay).toBeVisible();

        const signatureReference =
            await this.documentDropZone.evaluate(zone => {
                const canvas = zone.querySelector('canvas');

                const signature = zone.querySelector(
                    '.fpe-field-overlay'
                );

                if (!canvas || !signature) {
                    throw new Error(
                        'Signature or document canvas not found.'
                    );
                }

                const canvasRect = canvas.getBoundingClientRect();
                const signatureRect =
                    signature.getBoundingClientRect();

                return {
                    x: signatureRect.left - canvasRect.left,
                    y: signatureRect.top - canvasRect.top,

                    width: signatureRect.width,
                    height: signatureRect.height,

                    pageWidth: canvasRect.width,
                    pageHeight: canvasRect.height,

                    xPercent:
                        (signatureRect.left - canvasRect.left) /
                        canvasRect.width * 100,

                    yPercent:
                        (signatureRect.top - canvasRect.top) /
                        canvasRect.height * 100,

                    widthPercent:
                        signatureRect.width /
                        canvasRect.width * 100,

                    heightPercent:
                        signatureRect.height /
                        canvasRect.height * 100
                };
            });

        this.signatureReference = signatureReference;

        console.log(
            'Signature position (% of page): x=' +
            signatureReference.xPercent.toFixed(1) +
            ', y=' +
            signatureReference.yPercent.toFixed(1)
        );

        await this.page.screenshot({
            path: path.join(
                evidenceDirectory,
                'signature-original-placement.png'
            ),
            fullPage: true
        });

        console.log('Signature placement verified.');
    }

    async clickSendMail() {
        console.log('Waiting for Send Mail button...');

        await expect(
            this.page.getByText('Assign Documents', {
                exact: true
            }).first()
        ).toBeVisible({
            timeout: 20000
        });

        await expect(this.sendMailButton).toBeVisible({
            timeout: 20000
        });

        await expect(this.sendMailButton).toBeEnabled();

        await this.sendMailButton.click();

        console.log('Send Mail clicked.');
    }

    async handleSendAnyway() {
        console.log('Waiting for Send anyway popup...');

        await expect(this.sendAnywayButton).toBeVisible({
            timeout: 15000
        });

        await this.sendAnywayButton.click();

        console.log('Send anyway clicked.');
    }

    async continuePreview() {
        console.log('Waiting for Preview modal...');

        await expect(
            this.page.getByText(/Preview/i).first()
        ).toBeVisible({
            timeout: 30000
        });

        console.log('Preview modal opened.');

        await expect(
            this.continueToSendMailButton
        ).toBeVisible({
            timeout: 30000
        });

        await expect(
            this.continueToSendMailButton
        ).toBeEnabled();

        await this.continueToSendMailButton.scrollIntoViewIfNeeded();
        await this.continueToSendMailButton.click();

        console.log('Continue to Send Mail clicked.');

        await this.page.waitForTimeout(1500);
    }

    async confirmSendingOptions() {
        console.log('Waiting for Sending Options popup...');

        await expect(this.continueButton).toBeVisible({
            timeout: 20000
        });

        this.sendApiResponses = [];

        this.sendApiResponseHandler = response => {
            const request = response.request();

            if (request.method() !== 'POST') {
                return;
            }

            this.sendApiResponses.push({
                url: response.url(),
                method: request.method(),
                status: response.status(),
                ok: response.ok()
            });
        };

        this.page.on('response', this.sendApiResponseHandler);

        try {
            await this.continueButton.click();
            console.log('Continue clicked.');
        } catch (error) {
            this.page.off('response', this.sendApiResponseHandler);
            this.sendApiResponseHandler = null;
            throw error;
        }
    }

    async verifyEmailSent() {
        console.log('Waiting for email sending to complete...');

        try {
            await expect(this.emailSentMessage).toBeVisible({
                timeout: 60000
            });

            console.log(
                'Application email-sent confirmation displayed.'
            );
        } finally {
            if (this.sendApiResponseHandler) {
                this.page.off(
                    'response',
                    this.sendApiResponseHandler
                );

                this.sendApiResponseHandler = null;
            }
        }

        const possibleEmailResponses =
            this.sendApiResponses.filter(item =>
                /send|mail|email|assign/i.test(item.url)
            );

        possibleEmailResponses.forEach(item => {
            console.log(
                'API ' + item.method + ' ' + item.status + ' - ' + item.url
            );
        });

        if (possibleEmailResponses.length === 0) {
            console.log(
                'No email-related POST endpoint could be identified.'
            );
        }

        console.log(
            'NOTE: This confirms the application-level send flow only. ' +
            'Actual recipient inbox delivery is not verified because Mailinator is inaccessible.'
        );
    }

    async waitForCustomersPage() {
        console.log('Waiting for Customers page...');

        await expect(this.page).toHaveURL(
            /\/customers\/?$/,
            {
                timeout: 60000
            }
        );

        await expect(
            this.page.getByText('Customers List', {
                exact: true
            })
        ).toBeVisible({
            timeout: 30000
        });

        console.log('Redirected to Customers page.');
    }

    async verifyCustomer(customer) {
        console.log('====================================');
        console.log('TC10: VERIFYING CUSTOMER IN GRID');
        console.log('====================================');

        if (
            !customer ||
            !customer.email ||
            !customer.phone ||
            !customer.name
        ) {
            throw new Error('Customer test data is missing.');
        }

        await expect(this.page).toHaveURL(/\/customers\/?$/, {
            timeout: 30000
        });

        await expect(
            this.page.getByText('Customers List', {
                exact: true
            })
        ).toBeVisible();

        console.log('Customers page opened.');

        const namePrefix = customer.name.substring(0, 10);
        const emailPrefix = customer.email.substring(0, 10);

        const expectedPhone = customer.phone
            .replace(/\D/g, '')
            .slice(-10);

        console.log(
            'Searching using customer name:',
            namePrefix
        );

        const nameLocator = this.page.getByText(
            namePrefix,
            { exact: false }
        ).first();

        await expect(nameLocator).toBeVisible({
            timeout: 30000
        });

        console.log('Customer name found in grid.');

        const record = await nameLocator.evaluate(
            (element, data) => {
                let current = element;

                while (
                    current &&
                    current !== document.body
                ) {
                    const text = (
                        current.innerText || ''
                    ).replace(/\s+/g, ' ').trim();

                    const lower = text.toLowerCase();
                    const digits = text.replace(/\D/g, '');

                    const hasName = lower.includes(
                        data.namePrefix.toLowerCase()
                    );

                    const hasEmail = lower.includes(
                        data.emailPrefix.toLowerCase()
                    );

                    const hasPhone = digits.includes(
                        data.expectedPhone
                    );

                    const hasSent = /\bSent\b/i.test(text);

                    if (hasName && hasPhone && hasSent) {
                        return {
                            text,
                            hasEmail,
                            tag: current.tagName,
                            className:
                                current.className?.toString() || ''
                        };
                    }

                    current = current.parentElement;
                }

                return null;
            },
            {
                namePrefix,
                emailPrefix,
                expectedPhone
            }
        );

        expect(
            record,
            'Customer record with name, phone and Sent status not found.'
        ).not.toBeNull();

        console.log('CUSTOMER GRID RECORD:');
        console.log(record.text);

        expect(record.text).toMatch(/\bNA\b/i);
        console.log('PASS: Company Name verified - NA.');

        expect(record.text.toLowerCase()).toContain(
            namePrefix.toLowerCase()
        );
        console.log('PASS: Contact Name verified.');

        expect(record.hasEmail).toBe(true);
        console.log('PASS: Email ID prefix verified -', emailPrefix);

        const displayedDigits = record.text.replace(/\D/g, '');

        expect(displayedDigits).toContain(expectedPhone);
        console.log('PASS: Mobile Number verified.');

        expect(record.text).toMatch(/\bSent\b/i);
        console.log('PASS: Document Status verified - Sent.');

        const activityMatch = record.text.match(
            /\d{1,2}\/\d{1,2}\/\d{4},?\s+\d{1,2}:\d{2}\s*(AM|PM)/i
        );

        expect(
            activityMatch,
            'Last Activity not displayed.'
        ).not.toBeNull();

        console.log(
            'PASS: Last Activity verified -',
            activityMatch[0]
        );

        console.log('');
        console.log('====================================');
        console.log('ALL CUSTOMER GRID VERIFICATIONS PASSED');
        console.log('====================================');
    }

    async logout() {
        console.log('====================================');
        console.log('TC16: SIGNING OUT FROM AISIGNPRO');
        console.log('====================================');

        const profileMenu = this.page.locator(
            'button[aria-label="Account menu"]'
        );

        await expect(profileMenu).toBeVisible({
            timeout: 15000
        });

        await profileMenu.click();

        console.log('Profile menu clicked.');

        await this.page.waitForTimeout(1000);

        const logoutButton = this.page
            .locator('button, a, [role="menuitem"]')
            .filter({
                hasText: /log\s*out|sign\s*out|logout|signout/i
            })
            .last();

        if (await logoutButton.count() === 0) {
            throw new Error('Logout option not identified.');
        }

        await expect(logoutButton).toBeVisible({
            timeout: 10000
        });

        await logoutButton.click();

        console.log('Logout option clicked.');

        await expect(
            this.page.locator('#phone')
        ).toBeVisible({
            timeout: 30000
        });

        console.log('Logout successful.');
        console.log('Returned to AiSignPro login page.');
    }

    async assignDocument() {
        console.log('');
        console.log('TC09: ASSIGN AGREEMENT');

        await this.selectDocument();
        await this.placeSignature();
        await this.clickSendMail();
        await this.handleSendAnyway();
        await this.continuePreview();
        await this.confirmSendingOptions();
        await this.verifyEmailSent();
        await this.waitForCustomersPage();
    }
}

module.exports = { AssignAgreementPage };