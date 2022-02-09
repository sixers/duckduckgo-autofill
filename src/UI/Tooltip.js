const {safeExecute, addInlineStyles} = require('../autofill-utils')
const {getSubtypeFromType} = require('../Form/matching')

class Tooltip {
    constructor (config, inputType, getPosition, deviceInterface) {
        this.shadow = document.createElement('ddg-autofill').attachShadow({mode: 'closed'})
        this.host = this.shadow.host
        this.config = config
        this.subtype = getSubtypeFromType(inputType)
        this.device = deviceInterface
        this.tooltip = null
        this.getPosition = getPosition
        const forcedVisibilityStyles = {
            'display': 'block',
            'visibility': 'visible',
            'opacity': '1'
        }
        // @ts-ignore how to narrow this.host to HTMLElement?
        addInlineStyles(this.host, forcedVisibilityStyles)

        this.interface = deviceInterface
        this.count = 0
    }
    append () {
        document.body.appendChild(this.host)
    }
    remove () {
        window.removeEventListener('scroll', this, {capture: true})
        this.resObs.disconnect()
        this.mutObs.disconnect()
        this.lift()
    }
    lift () {
        this.left = null
        this.top = null
        document.body.removeChild(this.host)
    }
    handleEvent (event) {
        switch (event.type) {
        case 'scroll':
            this.checkPosition()
            break
        }
    }
    checkPosition () {
        if (this.animationFrame) {
            window.cancelAnimationFrame(this.animationFrame)
        }

        this.animationFrame = window.requestAnimationFrame(() => {
            const {left, bottom} = this.getPosition()

            if (left !== this.left || bottom !== this.top) {
                this.updatePosition({left, top: bottom})
            }

            this.animationFrame = null
        })
    }
    updatePosition ({left, top}) {
        const shadow = this.shadow
        // If the stylesheet is not loaded wait for load (Chrome bug)
        if (!shadow.styleSheets.length) {
            this.stylesheet?.addEventListener('load', () => this.checkPosition())
            return
        }

        this.left = left
        this.top = top

        if (this.transformRuleIndex && shadow.styleSheets[0].rules[this.transformRuleIndex]) {
            // If we have already set the rule, remove it…
            shadow.styleSheets[0].deleteRule(this.transformRuleIndex)
        } else {
            // …otherwise, set the index as the very last rule
            this.transformRuleIndex = shadow.styleSheets[0].rules.length
        }

        let newRule = `.wrapper {transform: translate(${left}px, ${top}px);}`
        shadow.styleSheets[0].insertRule(newRule, this.transformRuleIndex)
    }
    ensureIsLastInDOM () {
        this.count = this.count || 0
        // If DDG el is not the last in the doc, move it there
        if (document.body.lastElementChild !== this.host) {
            // Try up to 15 times to avoid infinite loop in case someone is doing the same
            if (this.count < 15) {
                this.lift()
                this.append()
                this.checkPosition()
                this.count++
            } else {
                // Remove the tooltip from the form to cleanup listeners and observers
                this.device.removeTooltip()
                console.info(`DDG autofill bailing out`)
            }
        }
    }

    resObs = new ResizeObserver(entries => entries.forEach(() => this.checkPosition()))
    mutObs = new MutationObserver((mutationList) => {
        for (const mutationRecord of mutationList) {
            if (mutationRecord.type === 'childList') {
                // Only check added nodes
                mutationRecord.addedNodes.forEach(el => {
                    if (el.nodeName === 'DDG-AUTOFILL') return

                    this.ensureIsLastInDOM()
                })
            }
        }
        this.checkPosition()
    })
    setActiveButton (e) {
        this.activeButton = e.target
    }
    unsetActiveButton () {
        this.activeButton = null
    }
    clickableButtons = new Map()
    registerClickableButton (btn, handler) {
        this.clickableButtons.set(btn, handler)
        // Needed because clicks within the shadow dom don't provide this info to the outside
        btn.addEventListener('mouseenter', (e) => this.setActiveButton(e))
        btn.addEventListener('mouseleave', () => this.unsetActiveButton())
    }
    dispatchClick () {
        const handler = this.clickableButtons.get(this.activeButton)
        if (handler) {
            safeExecute(this.activeButton, handler)
        }
    }
    init () {
        this.animationFrame = null
        this.top = 0
        this.left = 0
        this.transformRuleIndex = null

        this.stylesheet = this.shadow.querySelector('link, style')
        // Un-hide once the style is loaded, to avoid flashing unstyled content
        this.stylesheet?.addEventListener('load', () =>
            this.tooltip.removeAttribute('hidden'))

        this.append()
        this.resObs.observe(document.body)
        this.mutObs.observe(document.body, {childList: true, subtree: true, attributes: true})
        window.addEventListener('scroll', this, {capture: true})
    }
}

module.exports = Tooltip
