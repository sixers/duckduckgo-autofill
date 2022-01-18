// "add credit card" portion of ebay checkout
module.exports = `
<section class="module"><span class="loadable-icon-and-text"><span class="LOCK loadable-icon-and-text-icon"></span><span class="text-display"><span class="">Your payment is secure. Your card details will not be shared with sellers.</span></span>
    </span>
    <div class="credit-card-container">
        <div class="form-element card-number">
            <div class="credit-card-number" aria-live="polite">
                <div class="float-label expanded"><label for="cardNumber">Card number</label>
                    <div><input aria-required="true" data-validations="REQUIRED_FIELD" class="" autocomplete="cc-number" deviceos="OTHER" browser="Safari" data-val_required_field_params="{}" id="cardNumber" type="tel" name="cardNumber" value="" error="" style="background-color: rgb(248, 244, 152) !important; color: rgb(51, 51, 51) !important;" data-manual-scoring="cardNumber"></div>
                    <div class="card-types" aria-live="polite"><span aria-hidden="false" class="payment-logo AM_EX small" aria-label="AM_EX" role="img"></span></div>
                </div>
            </div>
        </div>
        <div class="">
            <div class="form-element">
                <div class="float-label expanded"><label for="cardExpiryDate">Expiration date</label>
                    <div><input autocomplete="cc-exp" class="" aria-describedby="cardExpiryDate-accessorylabel" deviceos="OTHER" browser="Safari" aria-required="true" data-val_month_and_year_format_params="{}" data-val_required_field_params="{}" id="cardExpiryDate" type="tel" name="cardExpiryDate" placeholder="MM / YY" data-validations="MONTH_AND_YEAR_FORMAT,REQUIRED_FIELD" value="" error="" style="background-color: rgb(248, 244, 152) !important; color: rgb(51, 51, 51) !important;" data-manual-scoring="expiration"></div>
                    <div id="cardExpiryDate-accessorylabel" class="secondary-text"></div>
                </div>
            </div>
            <div class="form-element card-cvv">
                <div class="float-label expanded"><label for="securityCode">Security code</label>
                    <div><input autocomplete="cc-csc" maxlength="4" optionaltext="Optional for debit card." pattern="[0-9]*" deviceos="OTHER" browser="Safari" id="securityCode" type="tel" name="securityCode" class="" placeholder="3 or 4 digits" data-validations="CVV_NUMBER" value="" cardnumber="" data-val_cvv_number_params="{}" error="" style="background-color: rgb(248, 244, 152) !important; color: rgb(51, 51, 51) !important;" data-value="cardSecurityCode"></div>
                    <div class="bubble"><span class="bubble-child"><span class="bubblehelp"><span class="infotip"><button tabindex="0" aria-expanded="false" aria-label="More information about security code." class="icon-btn infotip__host" type="button"><svg height="24px" width="24px" class="icon icon--information" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true"><use xlink:href="#icon-information"></use></svg></button><span class="infotip__overlay" role="tooltip" style="inset: 161.5px auto auto 791.703125px; position: fixed;"><span class="infotip__pointer infotip__pointer--top-left"></span><span class="infotip__mask"><span class="infotip__cell"><span class="infotip__content"><div class="ICON"><span class="loadable-icon-and-text"><span class="visa-cvv loadable-icon-and-text-icon" aria-hidden="true"></span></span>
                    </div>
                    <div class="ICON"><span class="loadable-icon-and-text"><span class="amex-cvv loadable-icon-and-text-icon" aria-hidden="true"></span></span>
                    </div>
                    <div class="TITLE"><span class="loadable-icon-and-text"><span class="text-display"><span class="">Visa, Mastercard, or Discover</span></span>
                        </span>
                    </div>
                    <ul>
                        <li class="DETAILS_LIST"><span class="loadable-icon-and-text"><span class="text-display"><span class="">This 3-digit number is on the back of the card next to the signature panel.</span></span>
                            </span>
                        </li>
                    </ul>
                    <div class="TITLE"><span class="loadable-icon-and-text"><span class="text-display"><span class="">American Express</span></span>
                        </span>
                    </div>
                    <ul>
                        <li class="DETAILS_LIST"><span class="loadable-icon-and-text"><span class="text-display"><span class="">This 4-digit number is on the front of the card above the credit card number.</span></span>
                            </span>
                        </li>
                    </ul>
                    </span><button aria-label="Close CVV Information Overlay" class="infotip__close" type="button"><svg height="24px" width="24px" class="icon icon--close" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true"><use xlink:href="#icon-close"></use></svg></button></span>
                    </span>
                    </span>
                    </span>
                    </span>
                    </span>
                </div>
            </div>
        </div>
    </div>
    <div class="form-element">
        <div class="float-label expanded"><label for="cardHolderFirstName">First name</label>
            <div><input autocomplete="cc-given-name" deviceos="OTHER" browser="Safari" aria-required="true" aria-describedby="cardHolderFirstName-accessorylabel" data-val_required_field_params="{}" id="cardHolderFirstName" type="text" name="cardHolderFirstName" class="" placeholder="Enter first name on card" data-validations="REQUIRED_FIELD" value="" error="" style="background-color: rgb(248, 244, 152) !important; color: rgb(51, 51, 51) !important;" data-manual-scoring="unknown"></div>
            <div id="cardHolderFirstName-accessorylabel" class="secondary-text"></div>
        </div>
    </div>
    <div class="form-element">
        <div class="float-label expanded"><label for="cardHolderLastName">Last name</label>
            <div><input autocomplete="cc-family-name" deviceos="OTHER" browser="Safari" aria-required="true" aria-describedby="cardHolderLastName-accessorylabel" data-val_required_field_params="{}" id="cardHolderLastName" type="text" name="cardHolderLastName" class="" placeholder="Enter last name on card" data-validations="REQUIRED_FIELD" value="" error="" style="background-color: rgb(248, 244, 152) !important; color: rgb(51, 51, 51) !important;" data-manual-scoring="unknown"></div>
            <div id="cardHolderLastName-accessorylabel" class="secondary-text"></div>
        </div>
    </div>
    <div class="form-element remember-card"><span class="checkbox-wrapper field"><span class="checkbox field__control"><svg style="display: none;"><symbol id="icon-checkbox-checked" viewBox="0 0 22 22"><path fill-rule="evenodd" d="M1 0h20a1 1 0 011 1v20a1 1 0 01-1 1H1a1 1 0 01-1-1V1a1 1 0 011-1zm7.3 15.71a1 1 0 001.41 0l8-8h-.01a1 1 0 00-1.41-1.41L9 13.59 5.71 10.3a1 1 0 00-1.41 1.41l4 4z"></path></symbol><symbol id="icon-checkbox-checked-small" viewBox="0 0 14 14"><path d="M13 0H1a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V1a1 1 0 00-1-1zm-2.29 5.71l-4 4a1 1 0 01-1.41 0l-2-2a1 1 0 011.41-1.42L6 7.59 9.29 4.3a1 1 0 011.41 1.41h.01z"></path></symbol><symbol id="icon-checkbox-unchecked" viewBox="0 0 21 22"><path fill-rule="evenodd" d="M.955 0h19.09c.528 0 .955.448.955 1v20c0 .552-.427 1-.955 1H.955C.427 22 0 21.552 0 21V1c0-.552.427-1 .955-1zm.954 20h17.182V2H1.909v18z"></path></symbol><symbol id="icon-checkbox-unchecked-small" viewBox="0 0 14 14"><path d="M13 14H1a1 1 0 01-1-1V1a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1zM2 12h10V2H2v10z"></path></symbol></svg><input for="rememberCard" id="rememberCard" class="checkbox__control" type="checkbox" checked=""><span class="checkbox__icon" hidden=""><svg height="24px" width="24px" class="checkbox__checked" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true"><use xlink:href="#icon-checkbox-checked"></use></svg><svg height="24px" width="24px" class="checkbox__unchecked" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true"><use xlink:href="#icon-checkbox-unchecked"></use></svg></span></span><label class="field__label field__label--end" for="rememberCard"><span class="text-display"><span class="">Remember this card for future orders</span></span></label></span>
    </div>
    </div>
</section>
`