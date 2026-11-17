# AiSign Pro – QA Automation (Playwright + JavaScript, POM)

Automated end-to-end test for the AiSign Pro staging site: https://cpastaging.aisignpro.com/

## Prerequisites

- Node.js 18 or higher (check with `node -v`)
- Internet access to the staging site

## How to run (3 commands)

Open a terminal inside the AiSignPro-Automation folder (the one containing package.json) and run:

```
npm install
npx playwright install chromium
npm test
```

> **Note:** The login steps (TC02 and TC03) use reCAPTCHA. When the browser opens and reaches the CAPTCHA, solve it manually. The test waits up to 2 minutes for the OTP screen, then continues automatically.

To open the HTML report afterwards:

```
npm run test:report
```

The report is generated in the `reports/` folder.

## What the test covers (TC01 – TC16)

The whole flow runs as one test with 16 steps, so the HTML report shows each step in order:

- TC01: Login with invalid mobile number
- TC02: Login with invalid OTP
- TC03: Login with valid credentials
- TC04: Navigate to Customers
- TC05: Duplicate phone validation
- TC06: Duplicate email validation
- TC07: Duplicate phone and email validation
- TC08: Create a new customer
- TC09: Assign document and send agreement email
- TC10: Verify customer details in the grid
- TC11: Expand customer row
- TC12: Verify preview opens and closes
- TC13: Verify download documents popup
- TC14: Download agreement PDF
- TC15: Verify downloaded PDF file
- TC16: Logout

A new unique customer is generated on every run, so the test can be run repeatedly.

## Project structure

- `tests/` – test spec (customer-agreement.spec.js)
- `pages/` – Page Object Model classes (LoginPage, CustomerPage, AssignAgreementPage)
- `test-data/` – customerData.json
- `evidence/` – screenshots and downloaded PDF used as bug proof
- `reports/` – generated Playwright HTML report
- `playwright.config.js` – configuration

## Bugs found

**BUG-01 – Signature position mismatch in preview**
The signature in the View Attachment preview appears at a different position from where it was placed.
Evidence: `evidence/BUG-01-preview-document.png`, `evidence/BUG-01-signature-alignment.png`

**BUG-02 – Signature missing in downloaded attachment**
The signature is missing in the downloaded PDF. The PDFs downloaded from different runs are byte-identical, which supports that the signature is not being written into the file.
Evidence: `evidence/BUG-02-downloaded-agreement.pdf`, `evidence/signature-persistence-bug.txt`

## Known limitations

- The Mailinator inbox cannot be accessed from automation, so the received mail subject and signing link are not verified.
- The CAPTCHA at login cannot be automated, so a manual step is required during TC02 and TC03.
- TC15 only checks that the downloaded PDF exists, is not empty and has a valid PDF header. The missing signature was confirmed manually (see BUG-02).
- The browser runs in headed mode, so a Chrome window opens during the test.

## Troubleshooting

- "Cannot find module @playwright/test": run `npm install` inside the project folder.
- "Executable doesn't exist": run `npx playwright install chromium`.
- "enoent package.json": open the terminal inside the AiSignPro-Automation folder, not its parent.


Note : "Built with AI assistance for debugging and code cleanup; test design, flow and bug findings are my own."
