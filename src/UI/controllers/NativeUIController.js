import {UIController} from './UIController.js'
import {getInputType, getMainTypeFromType, getSubtypeFromType} from '../../Form/matching.js'
import {GetAutofillDataCall} from '../../deviceApiCalls/__generated__/deviceApiCalls.js'

/**
 * `NativeController` should be used in situations where you DO NOT
 * want any Autofill-controlled user interface.
 *
 * Examples are with iOS/Android, where 'attaching' only means
 * messaging a native layer to show a native tooltip.
 *
 * @example
 *
 * ```javascript
 * const controller = new NativeController();
 * controller.attach(...);
 * ```
 */
export class NativeUIController extends UIController {
    /**
     * @param {import('./UIController').AttachArgs} args
     */
    attach (args) {
        const {form, input, device, trigger} = args
        const inputType = getInputType(input)
        const mainType = getMainTypeFromType(inputType)
        const subType = getSubtypeFromType(inputType)

        if (mainType === 'unknown') {
            throw new Error('unreachable, should not be here if (mainType === "unknown")')
        }

        if (trigger === 'autoprompt') {
            window.scrollTo({
                behavior: 'smooth',
                top: form.form.getBoundingClientRect().top - document.body.getBoundingClientRect().top - 50
            })
        }

        /** @type {import('../../deviceApiCalls/__generated__/validators-ts').GetAutofillDataRequest} */
        const payload = {
            inputType,
            mainType,
            subType,
            trigger
        }

        device.deviceApi.request(new GetAutofillDataCall(payload))
            .then(resp => {
                switch (resp.action) {
                case 'fill': {
                    if (mainType in resp) {
                        form.autofillData(resp[mainType], mainType)
                    } else {
                        throw new Error(`action: "fill" cannot occur because "${mainType}" was missing`)
                    }
                    break
                }
                case 'focus': {
                    form.activeInput?.focus()
                    break
                }
                default: {
                    if (args.device.isTestMode()) {
                        console.warn('response not handled', resp)
                    }
                }
                }
            })
            .catch(e => {
                console.error('NativeTooltip::device.getAutofillData(payload)')
                console.error(e)
            })
    }
}
