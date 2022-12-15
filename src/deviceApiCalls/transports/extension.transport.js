import {DeviceApiTransport} from '../../../packages/device-api/index.js'
import {
    GetAvailableInputTypesCall,
    GetRuntimeConfigurationCall,
    SendJSPixelCall
} from '../__generated__/deviceApiCalls.js'
import {isAutofillEnabledFromProcessedConfig} from '../../autofill-utils.js'
import {Settings} from '../../Settings.js'

export class ExtensionTransport extends DeviceApiTransport {
    /** @param {GlobalConfig} globalConfig */
    constructor (globalConfig) {
        super()
        this.config = globalConfig
    }

    async send (deviceApiCall) {
        console.log({deviceApiCall})
        if (deviceApiCall instanceof GetRuntimeConfigurationCall) {
            return deviceApiCall.result(await extensionSpecificRuntimeConfiguration(this.config))
        }

        if (deviceApiCall instanceof GetAvailableInputTypesCall) {
            return deviceApiCall.result(await extensionSpecificGetAvailableInputTypes())
        }

        if (deviceApiCall instanceof SendJSPixelCall) {
            return deviceApiCall.result(await extensionSpecificSendPixel(deviceApiCall.params.pixelName))
        }

        throw new Error('not implemented yet for ' + deviceApiCall.method)
    }
}

/**
 * @param {GlobalConfig} globalConfig
 * @returns {Promise<ReturnType<GetRuntimeConfigurationCall['result']>>}
 */
async function extensionSpecificRuntimeConfiguration (globalConfig) {
    const contentScope = await getContentScopeConfig()
    const emailProtectionEnabled = isAutofillEnabledFromProcessedConfig(contentScope)

    return {
        success: {
            // @ts-ignore
            contentScope: contentScope,
            // @ts-ignore
            userPreferences: {features: {autofill: {settings: {featureToggles: {
                ...Settings.defaults.featureToggles,
                emailProtection: emailProtectionEnabled
            }}}}},
            // @ts-ignore
            userUnprotectedDomains: globalConfig?.userUnprotectedDomains
        }
    }
}

async function extensionSpecificGetAvailableInputTypes () {
    const contentScope = await getContentScopeConfig()
    const emailProtectionEnabled = isAutofillEnabledFromProcessedConfig(contentScope)

    return {
        success: {
            ...Settings.defaults.availableInputTypes,
            email: emailProtectionEnabled
        }
    }
}

async function getContentScopeConfig () {
    return new Promise(resolve => {
        chrome.runtime.sendMessage(
            {
                registeredTempAutofillContentScript: true,
                documentUrl: window.location.href
            },
            (response) => {
                if (response && 'site' in response) {
                    resolve(response)
                }
            }
        )
    })
}
/**
 * @param {import('../__generated__/validators-ts').SendJSPixelParams['pixelName']} pixelName
 */
async function extensionSpecificSendPixel (pixelName) {
    return new Promise(resolve => {
        chrome.runtime.sendMessage(
            {
                firePixel: true,
                pixelName
            },
            () => {
                resolve(true)
            }
        )
    })
}
