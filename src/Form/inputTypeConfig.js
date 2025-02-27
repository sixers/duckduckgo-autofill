import { daxBase64 } from './logo-svg.js'
import * as ddgPasswordIcons from '../UI/img/ddgPasswordIcon.js'
import {getInputType, getMainTypeFromType, getInputSubtype, getInputMainType} from './matching.js'
import { createCredentialsTooltipItem } from '../InputTypes/Credentials.js'
import { CreditCardTooltipItem } from '../InputTypes/CreditCard.js'
import { IdentityTooltipItem } from '../InputTypes/Identity.js'
import {constants} from '../constants.js'

/**
 * Get the icon for the identities (currently only Dax for emails)
 * @param {HTMLInputElement} input
 * @param {import("./Form").Form} form
 * @return {string}
 */
const getIdentitiesIcon = (input, {device}) => {
    if (!canBeInteractedWith(input)) return ''

    // In Firefox web_accessible_resources could leak a unique user identifier, so we avoid it here
    const { isDDGApp, isFirefox } = device.globalConfig
    const subtype = getInputSubtype(input)

    if (subtype === 'emailAddress' && device.isDeviceSignedIn()) {
        if (isDDGApp || isFirefox) {
            return daxBase64
        } else if (typeof window.chrome?.runtime !== 'undefined') {
            return chrome.runtime.getURL('img/logo-small.svg')
        }
    }

    return ''
}

/**
 * Checks whether a field is readonly or disabled
 * @param {HTMLInputElement} input
 * @return {boolean}
 */
const canBeInteractedWith = (input) => !input.readOnly && !input.disabled

/**
 * Checks if the input can be decorated and we have the needed data
 * @param {HTMLInputElement} input
 * @param {import("../DeviceInterface/InterfacePrototype").default} device
 * @returns {Promise<boolean>}
 */
const canBeAutofilled = async (input, device) => {
    if (!canBeInteractedWith(input)) return false

    const mainType = getInputMainType(input)
    const subtype = getInputSubtype(input)
    const canAutofill = await device.settings.canAutofillType(mainType, subtype)
    return Boolean(canAutofill)
}

/**
 * A map of config objects. These help by centralising here some complexity
 * @type {InputTypeConfig}
 */
const inputTypeConfig = {
    /** @type {CredentialsInputTypeConfig} */
    credentials: {
        type: 'credentials',
        getIconBase: (input, {device}) => {
            if (!canBeInteractedWith(input)) return ''

            if (device.settings.featureToggles.inlineIcon_credentials) {
                return ddgPasswordIcons.ddgPasswordIconBase
            }
            return ''
        },
        getIconFilled: (_input, {device}) => {
            if (device.settings.featureToggles.inlineIcon_credentials) {
                return ddgPasswordIcons.ddgPasswordIconFilled
            }
            return ''
        },
        shouldDecorate: async (input, {isLogin, device}) => {
            // if we are on a 'login' page, check if we have data to autofill the field
            if (isLogin) {
                return canBeAutofilled(input, device)
            }

            // at this point, it's not a 'login' form, so we could offer to provide a password
            if (device.settings.featureToggles.password_generation) {
                const subtype = getInputSubtype(input)
                if (subtype === 'password') {
                    return canBeInteractedWith(input)
                }
            }

            return false
        },
        dataType: 'Credentials',
        tooltipItem: (data) => createCredentialsTooltipItem(data)
    },
    /** @type {CreditCardsInputTypeConfig} */
    creditCards: {
        type: 'creditCards',
        getIconBase: () => '',
        getIconFilled: () => '',
        shouldDecorate: async (input, {device}) => {
            return canBeAutofilled(input, device)
        },
        dataType: 'CreditCards',
        tooltipItem: (data) => new CreditCardTooltipItem(data)
    },
    /** @type {IdentitiesInputTypeConfig} */
    identities: {
        type: 'identities',
        getIconBase: getIdentitiesIcon,
        getIconFilled: getIdentitiesIcon,
        shouldDecorate: async (input, {device}) => {
            return canBeAutofilled(input, device)
        },
        dataType: 'Identities',
        tooltipItem: (data) => new IdentityTooltipItem(data)
    },
    /** @type {UnknownInputTypeConfig} */
    unknown: {
        type: 'unknown',
        getIconBase: () => '',
        getIconFilled: () => '',
        shouldDecorate: async () => false,
        dataType: '',
        tooltipItem: (_data) => {
            throw new Error('unreachable')
        }
    }
}

/**
 * Retrieves configs from an input el
 * @param {HTMLInputElement} input
 * @returns {InputTypeConfigs}
 */
const getInputConfig = (input) => {
    const inputType = getInputType(input)
    return getInputConfigFromType(inputType)
}

/**
 * Retrieves configs from an input type
 * @param {import('./matching').SupportedTypes | string} inputType
 * @returns {InputTypeConfigs}
 */
const getInputConfigFromType = (inputType) => {
    const inputMainType = getMainTypeFromType(inputType)
    return inputTypeConfig[inputMainType]
}

/**
 * Given an input field checks wheter it was previously decorated
 * @param {HTMLInputElement} input
 * @returns {Boolean}
 */
const isFieldDecorated = (input) => {
    return input.hasAttribute(constants.ATTR_INPUT_TYPE)
}

export {
    getInputConfig,
    getInputConfigFromType,
    canBeInteractedWith,
    isFieldDecorated
}
