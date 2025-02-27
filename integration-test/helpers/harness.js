import * as fs from 'fs'
import {mkdtempSync, readFileSync} from 'fs'
import * as path from 'path'
import {join} from 'path'
import * as http from 'http'
import {tmpdir} from 'os'
import {devices} from 'playwright'
import {chromium, firefox} from '@playwright/test'
import {macosContentScopeReplacements, iosContentScopeReplacements} from './mocks.webkit.js'

const DATA_DIR_PREFIX = 'ddg-temp-'

/**
 * A simple file server, this is done manually here to enable us
 * to manipulate some requests if needed.
 * @param {string|number} [port]
 * @return {ServerWrapper}
 */
export function setupServer (port) {
    const server = http.createServer(function (req, res) {
        if (!req.url) throw new Error('unreachable')
        const url = new URL(req.url, `http://${req.headers.host}`)
        const importUrl = new URL(import.meta.url)
        const dirname = importUrl.pathname.replace(/\/[^/]*$/, '')
        let pathname = path.join(dirname, '../pages', url.pathname)

        if (url.pathname.startsWith('/src')) {
            pathname = path.join(dirname, '../../', url.pathname)
        }

        fs.readFile(pathname, (err, data) => {
            if (err) {
                res.writeHead(404)
                res.end(JSON.stringify(err))
                return
            }
            res.writeHead(200)
            res.end(data)
        })
    }).listen(port)

    const address = server.address()
    if (address === null || typeof address === 'string') throw new Error('unreachable')
    const url = new URL('http://localhost:' + address.port)

    return {
        address,
        url,
        urlForPath (path) {
            const nextUrl = new URL(path, url)
            return nextUrl.href
        },
        close () {
            server.close()
        }
    }
}

/**
 * Launch a chromium browser with the test extension pre-loaded.
 *
 * @param {typeof import("@playwright/test").test} test
 */
export function withChromeExtensionContext (test) {
    return test.extend({
        context: async ({ browserName }, use, testInfo) => {
            // ensure this test setup cannot be used by anything other than chrome
            testInfo.skip(testInfo.project.name !== 'extension')

            const tmpDirPrefix = join(tmpdir(), DATA_DIR_PREFIX)
            const dataDir = mkdtempSync(tmpDirPrefix)
            const browserTypes = { chromium, firefox }
            const launchOptions = {
                devtools: true,
                headless: false,
                viewport: {
                    width: 1920,
                    height: 1080
                },
                args: [
                    '--disable-extensions-except=integration-test/extension',
                    '--load-extension=integration-test/extension'
                ]
            }
            const context = await browserTypes[browserName].launchPersistentContext(
                dataDir,
                launchOptions
            )
            await use(context)
            await context.close()
        }
    })
}

/**
 * @param {import("playwright").Page} page
 * @param {Record<string, string | boolean>} replacements
 * @param {Platform} [platform]
 * @return {Promise<void>}
 */
function withStringReplacements (page, replacements, platform = 'macos') {
    const content = readFileSync('./dist/autofill.js', 'utf8')
    let output = content
    for (let [keyName, value] of Object.entries(replacements)) {
        let replacement = typeof value === 'boolean' || typeof value === 'string'
            ? value
            : JSON.stringify(value)
        output = output.replace(`// INJECT ${keyName} HERE`, `${keyName} = ${replacement};`)
    }

    // 'macos' + 'ios'  can execute scripts before page scripts
    if (['macos', 'ios'].includes(platform)) {
        return page.addInitScript(output)
    }

    /**
     * On Windows the `window.chrome.webview.x` API's are 'deleted' from the global scope
     * So this part is here to better simulate how our script runs on Windows, with access to the injected
     * variables like `windowsInteropPostMessage`.
     *
     * Please see:
     *   - `types.d.ts` in the root to see where we add these variables for Typescript
     *   - `src/deviceApiCalls/transports/windows.transport.js` for where these are actually used
     */
    if (platform === 'windows') {
        const script = `
            (function() {
                const windowsInteropPostMessage = window.chrome.webview.postMessage;
                const windowsInteropAddEventListener = window.chrome.webview.addEventListener;
                const windowsInteropRemoveEventListener = window.chrome.webview.removeEventListener;
                delete window.chrome.webview.postMessage;
                delete window.chrome.webview.addEventListener;
                delete window.chrome.webview.removeEventListener;
                try {
                    ${output}
                } catch (e) {
                     console.error("uncaught error from windows interop", e);
                }
            })()
            `
        return page.evaluate(script)
    }

    return page.evaluate(output)
}

/**
 * @return {ScriptBuilder}
 */
export function createAutofillScript () {
    /** @type {Partial<Replacements>} */
    const replacements = {
        isDDGTestMode: true,
        supportsTopFrame: false,
        hasModernWebkitAPI: true
    }

    /** @type {Platform} */
    let platform = 'macos'

    /** @type {ScriptBuilder} */
    const builder = {
        replace (key, value) {
            replacements[key] = value
            return this
        },
        tap (fn) {
            fn(replacements, platform)
            return this
        },
        replaceAll: function (incoming) {
            Object.assign(replacements, incoming)
            return this
        },
        platform (p) {
            platform = p
            return this
        },
        async applyTo (page) {
            if (platform === 'windows') {
                replacements['isWindows'] = true
            }
            return withStringReplacements(page, replacements, platform)
        }
    }

    return builder
}

/**
 * @param {import("playwright").Page} page
 */
export async function defaultMacosScript (page) {
    return createAutofillScript()
        .replaceAll(macosContentScopeReplacements())
        .platform('macos')
        .applyTo(page)
}

/**
 * @param {import("playwright").Page} page
 */
export async function defaultIOSScript (page) {
    return createAutofillScript()
        .replaceAll(iosContentScopeReplacements())
        .platform('ios')
        .applyTo(page)
}

/**
 * @param {import("playwright").Page} page
 * @param {Partial<import('../../src/deviceApiCalls/__generated__/validators-ts').AutofillFeatureToggles>} featureToggles
 */
export async function withIOSFeatureToggles (page, featureToggles) {
    return createAutofillScript()
        .replaceAll(iosContentScopeReplacements({
            featureToggles: featureToggles
        }))
        .platform('ios')
        .applyTo(page)
}

/**
 * Relay browser exceptions to the terminal to aid debugging.
 *
 * @param {import("playwright").Page} page
 * @param {{verbose?: boolean}} [_opts]
 */
export function forwardConsoleMessages (page, _opts = {}) {
    page.on('pageerror', (msg) => {
        console.log('🌍 ❌ [in-page error]', msg)
    })
    page.on('console', (msg) => {
        const type = msg.type()
        const icon = (() => {
            switch (type) {
            case 'warning': return '☢️'
            case 'error': return '❌️'
            default: return '🌍'
            }
        })()

        console.log(`${icon} [console.${type}]`, msg.text())
    })
}

/**
 * Launch a webkit browser with a user-agent that simulates our iOS application
 * @param {typeof import("@playwright/test").test} test
 */
export function withIOSContext (test) {
    return test.extend({
        context: async ({ browser }, use, testInfo) => {
            // ensure this test setup cannot be used by anything other than webkit browsers
            testInfo.skip(testInfo.project.name !== 'webkit')

            const context = await browser.newContext({
                ...devices['iPhone 13'],
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 DuckDuckGo/7 Safari/605.1.15'
            })

            await use(context)
            await context.close()
        }
    })
}

/**
 * Launch a webkit browser with a user-agent that simulates our iOS application
 * @param {typeof import("@playwright/test").test} test
 */
export function withAndroidContext (test) {
    return test.extend({
        context: async ({ browser }, use, testInfo) => {
            // ensure this test setup cannot be used by anything other than webkit browsers
            testInfo.skip(testInfo.project.name !== 'android')

            const context = await browser.newContext({
                ...devices.iPhone,
                userAgent: 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.88 DuckDuckGo/7 Mobile Safari/537.36'
            })

            await use(context)
            await context.close()
        }
    })
}

/**
 * Launch a chromium browser to simulates our Windows application
 *
 * Note: Autofill knows this is Windows via the isWindows string replacement
 * @param {typeof import("@playwright/test").test} test
 */
export function withWindowsContext (test) {
    return test.extend({
        context: async ({ browser }, use, testInfo) => {
            // ensure this test setup cannot be used by anything other than the Windows browser
            testInfo.skip(testInfo.project.name !== 'windows')

            const context = await browser.newContext({
                ...devices['Desktop Chrome']
            })

            await use(context)
            for (let page of context.pages()) {
                await addMocksAsAttachments(page, test)
            }
            await context.close()
        }
    })
}

/**
 * @param {import("playwright").Page} page
 * @param {string} measureName
 * @return {Promise<PerformanceEntryList>}
 */
export async function performanceEntries (page, measureName) {
    const result = await page.evaluate((measureName) => {
        window.performance?.measure?.(measureName, `${measureName}:start`, `${measureName}:end`)
        const entries = window.performance?.getEntriesByName(measureName)
        return JSON.stringify(entries)
    }, measureName)
    return JSON.parse(result)
}

export async function printPerformanceSummary (name, times) {
    const sum = times.reduce((acc, item) => acc + Number(item), 0)
    const average = sum / times.length
    console.log(name, times)
    console.log('➡️ %s average: ', name, average)
}

/**
 * @param {import("playwright").Page} page
 * @param {string[]} [names]
 * @returns {Promise<MockCall[]>}
 */
export async function mockedCalls (page, names = [], mustExist = true) {
    if (names.length > 0 && mustExist) {
        await page.waitForFunction(({names}) => {
            const calls = window.__playwright.mocks.calls
            return calls.some(([name]) => names.includes(name))
        }, {names})
    }

    if (!mustExist) {
        await page.waitForTimeout(500)
    }

    return page.evaluate(({names}) => {
        if (!Array.isArray(window.__playwright?.mocks?.calls)) {
            throw new Error('unreachable, window.__playwright.mocks.calls must be defined')
        }

        // no need to filter if no names were given, assume the caller wants all mocks
        if (names.length === 0) {
            return window.__playwright.mocks.calls
        }

        // otherwise filter on the given names
        return window.__playwright.mocks.calls
            .filter(([name]) => names.includes(name))
    }, {names})
}

/**
 * This gathers all mocked API calls and adds them as an attachment to the
 * test run.
 *
 * This means that when you run `npx playwright show-results` you can
 * access every piece of JSON that was sent and received.
 *
 * @param {import("playwright").Page} page
 * @param {typeof import("@playwright/test").test} test
 * @returns {Promise<void>}
 */
async function addMocksAsAttachments (page, test) {
    const calls = await mockedCalls(page)
    let index = 0
    for (let call of calls) {
        index += 1
        const [name, params, response] = call
        const lines = [`name: ${name}`]
        lines.push(`params: \n\n` + JSON.stringify(params, null, 2))
        lines.push(`response: \n\n` + JSON.stringify(response, null, 2))
        test.info().attachments.push({
            name: `mock ${index} ${name} params`,
            contentType: 'text/plain',
            body: Buffer.from(lines.join('\n'))
        })
    }
}
