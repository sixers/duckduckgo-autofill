import { constants } from './mocks.js'
import { expect } from '@playwright/test'
import {mockedCalls} from './harness.js'

/**
 * A wrapper around interactions for `integration-test/pages/signup.html`
 *
 * @param {import("playwright").Page} page
 * @param {ServerWrapper} server
 */
export function signupPage (page, server) {
    const decoratedFirstInputSelector = '#email' + constants.fields.email.selectors.identity
    const decoratedSecondInputSelector = '#email-2' + constants.fields.email.selectors.identity
    const emailStyleAttr = () => page.locator('#email').first().getAttribute('style')
    const passwordStyleAttr = () => page.locator('#password' + constants.fields.password.selectors.credential).getAttribute('style')
    return {
        async navigate () {
            await page.goto(server.urlForPath(constants.pages['signup']))
        },
        async selectGeneratedPassword () {
            const input = page.locator('#password')
            await input.click()

            const passwordBtn = page.locator('button:has-text("Generated password")')
            await expect(passwordBtn).toContainText('Login information will be saved for this website')

            const passwordButtonText = await passwordBtn.innerText()
            const [, generatedPassword] = passwordButtonText.split('\n')

            if (!generatedPassword.trim()) {
                throw new Error('unreachable - password must not be empty')
            }

            await passwordBtn.click({ force: true })
            return expect(input).toHaveValue(generatedPassword)
        },
        /**
         * @param {string} name
         * @return {Promise<void>}
         */
        async selectFirstName (name) {
            const input = page.locator('#firstname')
            await input.click()
            const button = await page.waitForSelector(`button:has-text("${name}")`)
            await button.click({ force: true })
        },
        async assertEmailValue (emailAddress) {
            const {selectors} = constants.fields.email
            const email = page.locator(selectors.identity)
            await expect(email).toHaveValue(emailAddress)
        },
        /**
         * @param {import('../../src/deviceApiCalls/__generated__/validators-ts').SendJSPixelParams[pixelName]} pixelName
         */
        async assertPixelFired (pixelName) {
            const calls = await mockedCalls(page, ['sendJSPixel'])
            expect(calls.length).toBeGreaterThanOrEqual(1)
            const [, sent] = calls[0]
            expect(sent.pixelName).toEqual(pixelName)
        },
        async addNewForm () {
            const btn = page.locator('text=Add new form')
            await btn.click()
        },
        async selectSecondEmailField (selector) {
            const input = page.locator(decoratedSecondInputSelector)
            await input.click()
            const button = page.locator(`button:has-text("${selector}")`)
            await button.click({ force: true })
        },
        /**
         * @param {Omit<CredentialsObject, "id">} credentials
         * @returns {Promise<void>}
         */
        async enterCredentials (credentials) {
            const {identity} = constants.fields.email.selectors
            const {credential} = constants.fields.password.selectors
            await page.fill(identity, credentials.username)
            await page.fill('#password' + credential, credentials.password || '')
            await page.fill('#password-2' + credential, credentials.password || '')

            /** NOTE: The next two lines are here to dismiss the auto-generated password prompt */
            await page.waitForTimeout(200)
            await page.keyboard.press('Tab')

            await page.locator(`button:has-text("Sign up")`).click()
        },
        /**
         * @param {Omit<CredentialsObject, "id">} credentials
         * @param {Platform} platform
         * @returns {Promise<void>}
         */
        async assertWasPromptedToSave (credentials, platform) {
            const calls = await page.evaluate('window.__playwright.mocks.calls')
            const mockNames = {
                ios: 'pmHandlerStoreData',
                macos: 'pmHandlerStoreData',
                android: 'storeFormData'
            }
            const mockCalls = calls.find(([name]) => name === mockNames[platform])
            let [, sent] = mockCalls
            if (platform === 'android') {
                expect(typeof sent).toBe('string')
                sent = JSON.parse(sent)
            }
            expect(sent.credentials).toEqual(credentials)
        },
        /**
         * @param {Omit<CredentialsObject, "id">} credentials
         * @returns {Promise<void>}
         */
        async assertWasPromptedToSaveWindows (credentials) {
            const calls = await mockedCalls(page, ['storeFormData'])
            expect(calls.length).toBeGreaterThanOrEqual(1)
            const [, sent] = calls[0]
            expect(sent.Data.credentials).toEqual(credentials)
        },
        /**
         * @returns {Promise<void>}
         */
        async assertWasNotPromptedToSaveWindows () {
            const calls = await mockedCalls(page, ['storeFormData'], false)

            expect(calls.length).toBe(0)
        },
        async assertSecondEmailValue (emailAddress) {
            const input = page.locator(decoratedSecondInputSelector)
            await expect(input).toHaveValue(emailAddress)
        },
        async assertFirstEmailEmpty () {
            const input = page.locator(decoratedFirstInputSelector)
            await expect(input).toHaveValue('')
        },
        async assertEmailHasNoDaxIcon () {
            expect(await emailStyleAttr()).toBeNull()
        },
        async assertPasswordHasNoIcon () {
            expect(await passwordStyleAttr()).toBeNull()
        }
    }
}

/**
 * A wrapper around interactions for `integration-test/pages/login.html`
 *
 * @param {import("playwright").Page} page
 * @param {ServerWrapper} server
 * @param {{overlay?: boolean, clickLabel?: boolean}} [opts]
 */
export function loginPage (page, server, opts = {}) {
    const { overlay = false, clickLabel = false } = opts
    return {
        async navigate () {
            await page.goto(server.urlForPath(constants.pages['login']))
        },
        async clickIntoUsernameInput () {
            const usernameField = page.locator('#email').first()
            // click the input field (not within Dax icon)
            await usernameField.click()
        },
        async clickIntoPasswordInput () {
            const passwordField = page.locator('#password').first()
            // click the input field (not within Dax icon)
            await passwordField.click()
        },
        async fieldsDoNotContainIcons () {
            const styles1 = await page.locator('#email').getAttribute('style')
            const styles2 = await page.locator('#password').getAttribute('style')
            expect(styles1 || '').not.toContain('data:image/svg+xml;base64,')
            expect(styles2 || '').not.toContain('data:image/svg+xml;base64,')
        },
        async fieldsContainIcons () {
            // don't make assertions until the element is both found + has a none-empty 'style' attribute
            await page.waitForFunction(() => Boolean(document.querySelector('#email')?.getAttribute('style')))
            const styles1 = await page.locator('#email').getAttribute('style')
            const styles2 = await page.locator('#password').getAttribute('style')
            expect(styles1).toContain('data:image/svg+xml;base64,')
            expect(styles2).toContain('data:image/svg+xml;base64,')
        },
        async onlyPasswordFieldHasIcon () {
            const styles1 = await page.locator('#email').getAttribute('style')
            const styles2 = await page.locator('#password').getAttribute('style')
            expect(styles1 || '').not.toContain('data:image/svg+xml;base64,')
            expect(styles2 || '').toContain('data:image/svg+xml;base64,')
        },
        /**
         * @param {string} username
         * @return {Promise<void>}
         */
        async assertTooltipNotOpen (username) {
            await expect(page.locator(`button:has-text("${username}")`)).not.toBeVisible()
        },
        /**
         * @param {string} username
         * @return {Promise<void>}
         */
        async selectFirstCredential (username) {
            if (clickLabel) {
                const label = page.locator('label[for="email"]')
                await label.click()
            } else {
                const email = page.locator('#email')
                await email.click()
            }

            if (!overlay) {
                const button = await page.waitForSelector(`button:has-text("${username}")`)
                await button.click()
            }
        },
        /**
         * @param {string} username
         * @param {string} password
         * @return {Promise<void>}
         */
        async assertBitwardenTooltipWorking (username, password) {
            await this.clickIntoUsernameInput()
            const button = await page.waitForSelector('.tooltip__button--data--bitwarden')
            expect(button).toBeDefined()
            await button.click()
            await this.assertFirstCredential(username, password)
        },
        async assertBitwardenLockedWorking () {
            await this.clickIntoUsernameInput()
            const button = await page.waitForSelector('button:has-text("Bitwarden is locked")')
            expect(button).toBeDefined()
            await button.click()
            const updatedButton = await page.waitForSelector(`button:has-text("${constants.fields.email.personalAddress}")`)
            expect(updatedButton).toBeDefined()
            await updatedButton.click()
            const autofillCalls = await mockedCalls(page, ['pmHandlerGetAutofillCredentials'], true)
            expect(autofillCalls).toHaveLength(1)
        },
        /**
         * @param {string} username
         * @return {Promise<void>}
         */
        async assertUsernameFilled (username) {
            const emailField = page.locator('#email')
            await expect(emailField).toHaveValue(username)
        },
        /**
         * @param {string} password
         * @return {Promise<void>}
         */
        async assertPasswordFilled (password) {
            const passwordField = page.locator('#password')
            await expect(passwordField).toHaveValue(password)
        },
        /**
         * @param {string} username
         * @param {string} password
         * @return {Promise<void>}
         */
        async assertFirstCredential (username, password) {
            await this.assertUsernameFilled(username)
            await this.assertPasswordFilled((password))
        },
        async assertPasswordEmpty () {
            const passwordField = page.locator('#password')
            await expect(passwordField).toHaveValue('')
        },
        /**
         * @param {Platform} platform
         * @returns {Promise<void>}
         */
        async promptWasShown (platform = 'android') {
            const calls = await mockedCalls(page, ['getAutofillData'])
            expect(calls.length).toBeGreaterThan(0)
            const [, sent] = calls[0]
            let params
            if (platform === 'android') {
                expect(typeof sent).toBe('string')
                params = JSON.parse(sent)
            } else {
                params = sent
            }

            expect(params.inputType).toBe('credentials.username')
        },
        async promptWasNotShown () {
            const calls = await page.evaluate('window.__playwright.mocks.calls')
            const mockCalls = calls.filter(([name]) => name === 'getAutofillData')
            expect(mockCalls.length).toBe(0)
        },
        /**
         * Note: Checks like this are not ideal, but they exist here to prevent
         * false positives.
         * @returns {Promise<void>}
         */
        async assertParentOpened () {
            const credsCalls = await mockedCalls(page, ['getSelectedCredentials'], true)
            const hasSucceeded = credsCalls.some((call) => call[2]?.some(({type}) => type === 'ok'))
            expect(hasSucceeded).toBe(true)
        },
        /** @param {{password: string}} data */
        async submitPasswordOnlyForm (data) {
            await page.type('#password-3', data.password)
            await page.click('#login-3 button[type="submit"]')
        },
        /** @param {string} username */
        async submitUsernameOnlyForm (username) {
            await page.type('#email-2', username)
            await page.click('#login-2 button[type="submit"]')
        },
        /** @param {{password: string, username: string}} data */
        async submitLoginForm (data) {
            await page.type('#password', data.password)
            await page.type('#email', data.username)
            await page.click('#login button[type="submit"]')
        },
        /** @param {Platform} platform */
        async shouldNotPromptToSave (platform = 'ios') {
            let mockCalls = []
            if (['ios', 'macos'].includes(platform)) {
                mockCalls = await mockedCalls(page, ['pmHandlerStoreData'], false)
            }
            if (platform === 'android') {
                mockCalls = await mockedCalls(page, ['storeFormData'], false)
            }

            expect(mockCalls.length).toBe(0)
        },
        /**
         * This is used mostly to avoid false negatives when we check for something _not_ happening.
         * Basically, you check that a specific call hasn't happened but the rest of the script ran just fine.
         * @returns {Promise<void>}
         */
        async assertAnyMockCallOccurred () {
            const calls = await page.evaluate('window.__playwright.mocks.calls')
            expect(calls.length).toBeGreaterThan(0)
        },
        /** @param {string} mockCallName */
        async assertMockCallOccurred (mockCallName) {
            const calls = await page.evaluate('window.__playwright.mocks.calls')
            const mockCall = calls.find(([name]) => name === mockCallName)
            expect(mockCall).toBeDefined()
        },
        /**
         * @param {string} mockCallName
         * @param {number} times
         */
        async assertMockCallOccurredTimes (mockCallName, times) {
            const calls = await page.evaluate('window.__playwright.mocks.calls')
            const mockCalls = calls.filter(([name]) => name === mockCallName)
            expect(mockCalls).toHaveLength(times)
        },
        /**
         * @param {Partial<import('../../src/deviceApiCalls/__generated__/validators-ts').AutofillFeatureToggles>} expected
         */
        async assertTogglesWereMocked (expected) {
            const calls = await page.evaluate('window.__playwright.mocks.calls')
            const mockCalls = calls.find(([name]) => name === 'getRuntimeConfiguration')
            const [, , resp] = mockCalls
            const actual = resp.userPreferences.features.autofill.settings.featureToggles
            for (let [key, value] of Object.entries(expected)) {
                expect(actual[key]).toBe(value)
            }
        },
        /**
         * @param {Record<string, any>} data
         * @param {Platform} [platform]
         */
        async assertWasPromptedToSave (data, platform = 'ios') {
            const calls = await page.evaluate('window.__playwright.mocks.calls')
            // todo(Shane): is it too apple specific?
            const mockNames = {
                ios: 'pmHandlerStoreData',
                macos: 'pmHandlerStoreData',
                android: 'storeFormData'
            }
            const mockCalls = calls.filter(([name]) => name === mockNames[platform])
            expect(mockCalls).toHaveLength(1)
            const [, sent] = mockCalls[0]
            const expected = {
                credentials: data
            }
            if (platform === 'ios' || platform === 'macos') {
                expected.messageHandling = {secret: 'PLACEHOLDER_SECRET'}
                return expect(sent).toEqual(expected)
            }
            if (platform === 'android') {
                expect(JSON.parse(sent)).toEqual(expected)
            }
        },
        /**
         * This is here to capture EXISTING functionality of `macOS` in production and prevent
         * accidental changes to how `showAutofillParent` messages are sent
         * @returns {Promise<void>}
         */
        async assertClickAndFocusMessages () {
            const calls = await mockedCalls(page, ['showAutofillParent'])
            expect(calls.length).toBe(2)

            // each call is captured as a tuple like this: [name, params, response], which is why
            // we use `call1[1]` and `call1[2]` - we're accessing the params sent in the request
            const [call1, call2] = calls
            expect(call1[1].wasFromClick).toBe(true)
            expect(call2[1].wasFromClick).toBe(false)
        },
        async assertFormSubmitted () {
            const submittedMsg = await page.locator('h1:has-text("Submitted!")')
            await expect(submittedMsg).toBeVisible()
        },
        async assertFormNotSubmittedAutomatically () {
            const submitButton = await page.locator('button:has-text("Log in")')
            await expect(submitButton).toBeVisible()
            await submitButton.click()
            await this.assertFormSubmitted()
        },
        async assertNoAttributesWereAdded () {
            const attrCount = page.locator('[data-ddg-inputtype]')
            const count = await attrCount.count()
            expect(count).toBe(0)
        },
        async assertNoPixelFired () {
            const mockCalls = await mockedCalls(page, ['sendJSPixel'], false)
            expect(mockCalls).toHaveLength(0)
        }
    }
}

/**
 * A wrapper around interactions for `integration-test/pages/login.html`
 *
 * @param {import("playwright").Page} page
 * @param {ServerWrapper} server
 * @param {{overlay?: boolean, clickLabel?: boolean}} [opts]
 */
export function loginPageWithText (page, server, opts) {
    const originalLoginPage = loginPage(page, server, opts)
    return {
        ...originalLoginPage,
        async navigate () {
            await page.goto(server.urlForPath(constants.pages['loginWithText']))
        }
    }
}

/**
 * A wrapper around interactions for `integration-test/pages/login-poor-form.html`
 *
 * @param {import("playwright").Page} page
 * @param {ServerWrapper} server
 * @param {{overlay?: boolean, clickLabel?: boolean}} [opts]
 */
export function loginPageWithPoorForm (page, server, opts) {
    const originalLoginPage = loginPage(page, server, opts)
    return {
        ...originalLoginPage,
        async navigate () {
            await page.goto(server.urlForPath(constants.pages['loginWithPoorForm']))
        }
    }
}

/**
 * A wrapper around interactions for `integration-test/pages/login-in-modal.html`
 *
 * @param {import("playwright").Page} page
 * @param {ServerWrapper} server
 * @param {{overlay?: boolean, clickLabel?: boolean}} [opts]
 */
export function loginPageWithFormInModal (page, server, opts) {
    const originalLoginPage = loginPage(page, server, opts)
    return {
        ...originalLoginPage,
        async navigate () {
            await page.goto(server.urlForPath(constants.pages['loginWithFormInModal']))
        },
        async openDialog () {
            const button = await page.waitForSelector(`button:has-text("Click here to Login")`)
            await button.click({ force: true })
            await this.assertDialogOpen()
        },
        async assertDialogClose () {
            const form = await page.locator('#login')
            await expect(form).toBeHidden()
        },
        async assertDialogOpen () {
            const form = await page.locator('#login')
            await expect(form).toBeVisible()
        },
        async hitEscapeKey () {
            await page.press('#login', 'Escape')
        },
        async clickOutsideTheDialog () {
            await page.click('#random-text')
        }
    }
}

/**
 * A wrapper around interactions for `integration-test/pages/login-covered.html`
 *
 * @param {import("playwright").Page} page
 * @param {ServerWrapper} server
 * @param {{overlay?: boolean, clickLabel?: boolean}} [opts]
 */
export function loginPageCovered (page, server, opts) {
    const originalLoginPage = loginPage(page, server, opts)
    return {
        ...originalLoginPage,
        async navigate () {
            await page.goto(server.urlForPath(constants.pages['loginCovered']))
        },
        async closeCookieDialog () {
            await page.click('button:has-text("Accept all cookies")')
        }
    }
}

/**
 * A wrapper around interactions for `integration-test/pages/login-multistep.html`
 *
 * @param {import("playwright").Page} page
 * @param {ServerWrapper} server
 * @param {{overlay?: boolean, clickLabel?: boolean}} [opts]
 */
export function loginPageMultistep (page, server, opts) {
    const originalLoginPage = loginPage(page, server, opts)
    return {
        ...originalLoginPage,
        async navigate () {
            await page.goto(server.urlForPath(constants.pages['loginMultistep']))
        },
        async clickContinue () {
            await page.click('button:has-text("Continue")')
        }
    }
}

/**
 * A wrapper around interactions for `integration-test/pages/email-autofill.html`
 *
 * @param {import("playwright").Page} page
 * @param {ServerWrapper} server
 */
export function emailAutofillPage (page, server) {
    const {selectors} = constants.fields.email
    return {
        async navigate () {
            await page.goto(server.urlForPath(constants.pages['email-autofill']))
        },
        async clickIntoInput () {
            const input = page.locator(selectors.identity)
            // click the input field (not within Dax icon)
            await input.click()
        },
        async clickDirectlyOnDax () {
            const input = page.locator(selectors.identity)
            const box = await input.boundingBox()
            if (!box) throw new Error('unreachable')
            await input.click({position: {x: box.width - (box.height / 2), y: box.height / 2}})
        },
        async assertEmailValue (emailAddress) {
            const email = page.locator(selectors.identity)
            await expect(email).toHaveValue(emailAddress)
        }

    }
}

/**
 * @param {import("playwright").Page} page
 * @param {ServerWrapper} server
 */
export function overlayPage (page, server) {
    return {
        async navigate () {
            await page.goto(server.urlForPath(constants.pages['overlay']))
        },
        /**
         * @param {string} text
         * @returns {Promise<void>}
         */
        async clickButtonWithText (text) {
            const button = await page.waitForSelector(`button:has-text("${text}")`)
            await button.click({ force: true })
        },
        /**
         * When we're in an overlay, 'closeAutofillParent' should not be called.
         * @params {string} callName
         */
        async doesNotCloseParentAfterCall (callName) {
            const callNameCalls = await mockedCalls(page, [callName], true)
            expect(callNameCalls.length).toBeGreaterThanOrEqual(1)
            const closeAutofillParentCalls = await mockedCalls(page, ['closeAutofillParent'], false)
            expect(closeAutofillParentCalls.length).toBe(0)
        },
        /**
         * When we're in an overlay, 'closeAutofillParent' should not be called.
         */
        async assertSelectedDetail () {
            return page.waitForFunction(() => {
                const calls = window.__playwright.mocks.calls
                return calls.some(call => call[0] === 'selectedDetail')
            })
        }
    }
}

/**
 * A wrapper around interactions for `integration-test/pages/signup.html`
 *
 * @param {import("playwright").Page} page
 * @param {ServerWrapper} server
 */
export function loginAndSignup (page, server) {
    // style lookup helpers
    const usernameStyleAttr = () => page.locator(constants.fields.username.selectors.credential).getAttribute('style')
    const emailStyleAttr = () => page.locator(constants.fields.email.selectors.identity).getAttribute('style')
    const firstPasswordStyleAttr = () => page.locator('#login-password' + constants.fields.password.selectors.credential).getAttribute('style')

    return {
        async navigate () {
            await page.goto(server.urlForPath(constants.pages['login+setup']))
        },
        async assertIdentitiesWereNotDecorated () {
            const style = await emailStyleAttr()
            expect(style).toBeNull()
        },
        async assertUsernameAndPasswordWereDecoratedWithIcon () {
            expect(await usernameStyleAttr()).toContain('data:image/svg+xml;base64,')
            expect(await firstPasswordStyleAttr()).toContain('data:image/svg+xml;base64,')
        },
        async assertNoDecorations () {
            const usernameAttr = await usernameStyleAttr()
            expect(usernameAttr).toBeNull()

            expect(await firstPasswordStyleAttr()).toBeNull()
        }
    }
}
