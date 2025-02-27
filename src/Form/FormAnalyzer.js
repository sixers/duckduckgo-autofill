import { removeExcessWhitespace, Matching } from './matching.js'
import { constants } from '../constants.js'
import { matchingConfiguration } from './matching-configuration.js'
import { getText, isLikelyASubmitButton } from '../autofill-utils.js'

const negativeRegex = new RegExp(/sign(ing)?.?in(?!g)|log.?in|unsubscri|(forgot(ten)?|reset) (your )?password|password (forgotten|lost)/i)
const positiveRegex = new RegExp(
    /sign(ing)?.?up|join|\bregist(er|ration)|newsletter|\bsubscri(be|ption)|contact|create|start|enroll|settings|preferences|profile|update|checkout|guest|purchase|buy|order|schedule|estimate|request|new.?customer|(confirm|retype|repeat|reset) password|password confirm?/i
)
const conservativePositiveRegex = new RegExp(/sign.?up|join|register|enroll|newsletter|subscri(be|ption)|settings|preferences|profile|update/i)
const strictPositiveRegex = new RegExp(/sign.?up|join|register|enroll|settings|preferences|profile|update/i)

class FormAnalyzer {
    /** @type HTMLElement */
    form;
    /** @type Matching */
    matching;
    /**
     * @param {HTMLElement} form
     * @param {HTMLInputElement|HTMLSelectElement} input
     * @param {Matching} [matching]
     */
    constructor (form, input, matching) {
        this.form = form
        this.matching = matching || new Matching(matchingConfiguration)
        this.autofillSignal = 0
        this.signals = []

        // Avoid autofill on our signup page
        if (window.location.href.match(/^https:\/\/(.+\.)?duckduckgo\.com\/email\/choose-address/i)) {
            return this
        }

        this.evaluateElAttributes(input, 3, true)
        form ? this.evaluateForm() : this.evaluatePage()
        return this
    }

    get isLogin () {
        return this.autofillSignal < 0
    }

    get isSignup () {
        return this.autofillSignal >= 0
    }

    increaseSignalBy (strength, signal) {
        this.autofillSignal += strength
        this.signals.push(`${signal}: +${strength}`)
        return this
    }

    decreaseSignalBy (strength, signal) {
        this.autofillSignal -= strength
        this.signals.push(`${signal}: -${strength}`)
        return this
    }

    /**
     *
     * @param {object} p
     * @param {string} p.string - The string to check
     * @param {number} p.strength - Strength of the signal
     * @param {string} [p.signalType] - For debugging purposes, we give a name to the signal
     * @param {boolean} [p.shouldFlip] - Flips the signals, i.e. when a link points outside. See below
     * @param {boolean} [p.shouldCheckUnifiedForm] - Should check for login/signup forms
     * @param {boolean} [p.shouldBeConservative] - Should use the conservative signup regex
     * @returns {FormAnalyzer}
     */
    updateSignal ({
        string,
        strength,
        signalType = 'generic',
        shouldFlip = false,
        shouldCheckUnifiedForm = false,
        shouldBeConservative = false
    }) {
        const matchesNegative = string === 'current-password' || negativeRegex.test(string)

        // Check explicitly for unified login/signup forms. They should always be negative, so we increase signal
        if (shouldCheckUnifiedForm && matchesNegative && strictPositiveRegex.test(string)) {
            this.decreaseSignalBy(strength + 2, `Unified detected ${signalType}`)
            return this
        }

        const positiveRegexToUse = shouldBeConservative ? conservativePositiveRegex : positiveRegex
        const matchesPositive = string === 'new-password' || positiveRegexToUse.test(string)

        // In some cases a login match means the login is somewhere else, i.e. when a link points outside
        if (shouldFlip) {
            if (matchesNegative) this.increaseSignalBy(strength, signalType)
            if (matchesPositive) this.decreaseSignalBy(strength, signalType)
        } else {
            if (matchesNegative) this.decreaseSignalBy(strength, signalType)
            if (matchesPositive) this.increaseSignalBy(strength, signalType)
        }
        return this
    }

    evaluateElAttributes (el, signalStrength = 3, isInput = false) {
        Array.from(el.attributes).forEach(attr => {
            if (attr.name === 'style') return

            const attributeString = `${attr.name}=${attr.value}`
            this.updateSignal({
                string: attributeString,
                strength: signalStrength,
                signalType: `${el.name} attr: ${attributeString}`,
                shouldCheckUnifiedForm: isInput
            })
        })
    }

    evaluatePageTitle () {
        const pageTitle = document.title
        this.updateSignal({string: pageTitle, strength: 2, signalType: `page title: ${pageTitle}`})
    }

    evaluatePageHeadings () {
        const headings = document.querySelectorAll('h1, h2, h3, [class*="title"], [id*="title"]')
        if (headings) {
            headings.forEach(({textContent}) => {
                textContent = removeExcessWhitespace(textContent || '')
                this.updateSignal({
                    string: textContent,
                    strength: 0.5,
                    signalType: `heading: ${textContent}`,
                    shouldCheckUnifiedForm: true,
                    shouldBeConservative: true
                })
            })
        }
    }

    evaluatePage () {
        this.evaluatePageTitle()
        this.evaluatePageHeadings()
        // Check for submit buttons
        const buttons = document.querySelectorAll(`
                button[type=submit],
                button:not([type]),
                [role=button]
            `)
        buttons.forEach(button => {
            // if the button has a form, it's not related to our input, because our input has no form here
            if (button instanceof HTMLButtonElement) {
                if (!button.form && !button.closest('form')) {
                    this.evaluateElement(button)
                    this.evaluateElAttributes(button, 0.5)
                }
            }
        })
    }

    evaluateElement (el) {
        const string = getText(el)

        if (el.matches(this.matching.cssSelector('password'))) {
            // These are explicit signals by the web author, so we weigh them heavily
            this.updateSignal({
                string: el.getAttribute('autocomplete') || '',
                strength: 10,
                signalType: `explicit: ${el.getAttribute('autocomplete')}`
            })
        }

        // check button contents
        if (el.matches(this.matching.cssSelector('SUBMIT_BUTTON_SELECTOR'))) {
            // If we're confident this is a submit button, it's a stronger signal
            const strength = isLikelyASubmitButton(el) ? 20 : 2
            this.updateSignal({string, strength, signalType: `submit: ${string}`})
        }
        // if an external link matches one of the regexes, we assume the match is not pertinent to the current form
        if (
            (el instanceof HTMLAnchorElement && el.href && el.getAttribute('href') !== '#') ||
            (el.getAttribute('role') || '').toUpperCase() === 'LINK' ||
            el.matches('button[class*=secondary]')
        ) {
            // Unless it's a forgotten password link, we don't flip those links
            let shouldFlip = true
            if (/(forgot(ten)?|reset) (your )?password|password forgotten/i.test(string)) {
                shouldFlip = false
            }
            this.updateSignal({string, strength: 1, signalType: `external link: ${string}`, shouldFlip})
        } else {
            // any other case
            // only consider the el if it's a small text to avoid noisy disclaimers
            if (removeExcessWhitespace(el.textContent)?.length < constants.TEXT_LENGTH_CUTOFF) {
                this.updateSignal({string, strength: 1, signalType: `generic: ${string}`, shouldCheckUnifiedForm: true})
            }
        }
    }

    evaluateForm () {
        // Check page title
        this.evaluatePageTitle()

        // Check form attributes
        this.evaluateElAttributes(this.form)

        // Check form contents (skip select and option because they contain too much noise)
        this.form.querySelectorAll('*:not(select):not(option):not(script)').forEach(el => {
            // Check if element is not hidden. Note that we can't use offsetHeight
            // nor intersectionObserver, because the element could be outside the
            // viewport or its parent hidden
            const displayValue = window.getComputedStyle(el, null).getPropertyValue('display')
            if (displayValue !== 'none') this.evaluateElement(el)
        })

        // A form with many fields is unlikely to be a login form
        const relevantFields = this.form.querySelectorAll(this.matching.cssSelector('GENERIC_TEXT_FIELD'))
        if (relevantFields.length > 4) {
            this.increaseSignalBy(relevantFields.length * 1.5, 'many fields: it is probably not a login')
        }

        // If we can't decide at this point, try reading page headings
        if (this.autofillSignal === 0) {
            this.evaluatePageHeadings()
        }
        return this
    }
}

export default FormAnalyzer
