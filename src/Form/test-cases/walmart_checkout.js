//combination of address and credit card form popups on walmart checkout
module.exports = `
<form id="add-edit-address-form" novalidate="" class=""><span class="gray f7 pb1">*Required fields</span>
    <div class="flex mb2">
        <div class="w_D1 mr0" name="firstName"><label class="w_Fw w_Fy" for="react-aria-18"><span class="w_Fx">First name*</span></label>
            <div class="w_D4"><input id="react-aria-18" type="text" autocomplete="given-name" maxlength="25" name="firstName" required="" aria-required="true" class="w_D7" value="" data-manual-scoring="firstName"></div>
        </div>
    </div>
    <div class="flex mb2">
        <div class="w_D1 mr0" name="lastName"><label class="w_Fw w_Fy" for="react-aria-19"><span class="w_Fx">Last name*</span></label>
            <div class="w_D4"><input id="react-aria-19" type="text" autocomplete="family-name" maxlength="25" name="lastName" required="" aria-required="true" class="w_D7" value="" data-manual-scoring="lastName"></div>
        </div>
    </div>
    <div class="flex mb2">
        <div class="w-100">
            <div class="css-2b097c-container">
                <div class="w_D1 mr0"><label class="w_Fw w_Fy" for="addressLineOne"><span class="w_Fx">Street address*</span></label>
                    <div class="w_D4"><input id="addressLineOne" type="text" autocomplete="new-password" required="" name="addressLineOne" class="w_D7" value="" data-manual-scoring="addressStreet"></div>
                </div>
            </div>
        </div>
    </div>
    <div class="flex mb2">
        <div class="w_D1 mr0" name="addressLineTwo"><label class="w_Fw w_Fy" for="react-aria-20"><span class="w_Fx">Apt, suite, etc. (optional)</span></label>
            <div class="w_D4"><input id="react-aria-20" type="text" autocomplete="address-line2" maxlength="50" name="addressLineTwo" class="w_D7" value="" data-manual-scoring="addressStreet2"></div>
        </div>
    </div>
    <div class="flex mb2">
        <div class="w_D1 mr0" name="city"><label class="w_Fw" for="react-aria-21"><span class="w_Fx">City*</span></label>
            <div class="w_D4"><input id="react-aria-21" type="text" autocomplete="address-level2" maxlength="30" name="city" required="" aria-required="true" class="w_D7" value="Birmingham" data-manual-scoring="addressCity"></div>
        </div>
    </div>
    <div class="flex flex-row justify-between mb2">
        <div class="flex w-50">
            <div class="w_B1 mr2 mr3-m" name="state"><label class="w_Fw" for="react-aria-22"><span class="w_Fx">State*</span></label><select id="react-aria-22" autocomplete="address-level1" name="state" required="" aria-required="true" class="w_B2" data-manual-scoring="addressProvince"><option value="">State</option><option value="AL">AL</option><option value="AK">AK</option><option value="AZ">AZ</option><option value="AR">AR</option><option value="CA">CA</option><option value="CO">CO</option><option value="CT">CT</option><option value="DC">DC</option><option value="DE">DE</option><option value="FL">FL</option><option value="GA">GA</option><option value="HI">HI</option><option value="ID">ID</option><option value="IL">IL</option><option value="IN">IN</option><option value="IA">IA</option><option value="KS">KS</option><option value="KY">KY</option><option value="LA">LA</option><option value="ME">ME</option><option value="MD">MD</option><option value="MA">MA</option><option value="MI">MI</option><option value="MN">MN</option><option value="MS">MS</option><option value="MO">MO</option><option value="MT">MT</option><option value="NE">NE</option><option value="NV">NV</option><option value="NH">NH</option><option value="NJ">NJ</option><option value="NM">NM</option><option value="NY">NY</option><option value="NC">NC</option><option value="ND">ND</option><option value="OH">OH</option><option value="OK">OK</option><option value="OR">OR</option><option value="PA">PA</option><option value="RI">RI</option><option value="SC">SC</option><option value="SD">SD</option><option value="TN">TN</option><option value="TX">TX</option><option value="UT">UT</option><option value="VT">VT</option><option value="VA">VA</option><option value="WA">WA</option><option value="WV">WV</option><option value="WI">WI</option><option value="WY">WY</option><option value="AA">AA</option><option value="AP">AP</option><option value="AE">AE</option><option value="AS">AS</option><option value="GU">GU</option><option value="MP">MP</option><option value="PW">PW</option><option value="PR">PR</option><option value="VI">VI</option></select><svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" class="w_B4" aria-hidden="true" role="presentation" style="font-size: 1.5rem; vertical-align: -0.25em;"><path d="M8 10l3.5-4h-7z" fill-rule="evenodd"></path></svg></div>
        </div>
        <div class="flex w-50">
            <div class="w_D1 ml2 pr2"><label class="w_Fw" for="react-aria-23"><span class="w_Fx">Zip code*</span></label>
                <div class="w_D4"><input id="react-aria-23" type="text" autocomplete="postal-code" inputmode="numeric" maxlength="5" name="postalCode" required="" aria-required="true" class="w_D7" value="35223" data-manual-scoring="addressPostalCode"></div>
            </div>
        </div>
    </div>
    <div class="flex flex-row mb2">
        <div class="w-100">
            <div class="w_D1 mr3-m"><label class="w_Fw w_Fy" for="react-aria-24"><span class="w_Fx">Phone number*</span></label>
                <div class="w_D4"><input id="react-aria-24" type="tel" autocomplete="tel" maxlength="14" name="phone" required="" aria-required="true" class="w_D7" value="" data-manual-scoring="phone"></div>
            </div><span class="w_DT w_DV w_DY">We'll contact you in case anything comes up with your order.</span></div>
    </div>
    <div class="mt3">
        <div class="w_Aj w_Ao mb2" id="alert" role="alert"><span class="w_Ak"><svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" role="presentation" style="font-size: 1rem; vertical-align: -0.175em;"><path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm0 1a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm-1 9.5a.5.5 0 0 1-.09-.992L7 10.5h.499v-3H7a.5.5 0 0 1-.492-.41L6.5 7a.5.5 0 0 1 .41-.492L7 6.5h1.5l-.001 4H9a.5.5 0 0 1 .09.992L9 11.5H7zm.879-7.121a.621.621 0 1 1 0 1.242.621.621 0 0 1 0-1.242z" fill-rule="evenodd"></path></svg></span><span class="w_Am"><span class="w_Al"><span>If you leave before placing your order, we'll store your information for 72 hours, in case you want to complete your order later.</span></span>
            </span>
        </div>
    </div>
</form>

<form id="add-creditcard-form" style="padding-bottom: 144px;"><span class="w_DW gray mb2 w_DY w_Db">* Required field</span>
    <div class="flex flex-column w-100"><span class="fw7 f5 pv1 dn-s">Card information</span>
        <div class="flex cf mv3">
            <div class="w-50">
                <div class="w_D8 pr2" name="firstName"><label class="w_Fj" for="react-aria-8"><span class="w_Fk">First name *</span></label>
                    <div class="w_EB"><input id="react-aria-8" autocomplete="cc-given-name" class="w_EE w-100" maxlength="25" name="firstName" value="" data-manual-scoring="unknown"></div>
                </div>
            </div>
            <div class="w-50">
                <div class="w_D8 pl2" name="lastName"><label class="w_Fj" for="react-aria-9"><span class="w_Fk">Last name *</span></label>
                    <div class="w_EB"><input id="react-aria-9" autocomplete="cc-family-name" class="w_EE w-100" maxlength="25" name="lastName" value="" data-manual-scoring="unknown"></div>
                </div>
            </div>
        </div>
        <div class="fl mb3">
            <div class="w_D8"><label class="w_Fj w_Fl w_D9" for="cc-number"><span class="w_Fk">Card number *</span></label>
                <div class="w_EB"><span aria-hidden="true" class="w_EG w_EF"><i class="ld ld-CreditCard" style="font-size: 1.5rem; vertical-align: -0.25em;"></i></span><input id="cc-number" autocomplete="cc-number" inputmode="numeric" class="w_EE" value="" data-manual-scoring="cardNumber"></div>
            </div>
        </div>
        <div class="flex flex-wrap w-100 mb3">
            <div class="w-50 w-100">
                <div class="flex mb3">
                    <div class="pr2 w-50" data-testid="selectMMContainer">
                        <div class="w_DN"><label class="w_Fj" for="react-aria-4"><span class="w_Fk">MM *</span></label><select id="react-aria-4" autocomplete="cc-exp-month" class="w_DO" data-manual-scoring="expirationMonth"><option value="">MM</option><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option></select><svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" class="w_DQ" aria-hidden="true" role="presentation" style="font-size: 1.5rem; vertical-align: -0.25em;"><path d="M8 10l3.5-4h-7z" fill-rule="evenodd"></path></svg></div>
                    </div>
                    <div class="pl2 w-50" data-testid="selectYYContainer">
                        <div class="w_DN"><label class="w_Fj" for="react-aria-5"><span class="w_Fk">YY *</span></label><select id="react-aria-5" autocomplete="cc-exp-year" class="w_DO" data-manual-scoring="expirationYear"><option value="">YY</option><option value="2022">22</option><option value="2023">23</option><option value="2024">24</option><option value="2025">25</option><option value="2026">26</option><option value="2027">27</option><option value="2028">28</option><option value="2029">29</option><option value="2030">30</option><option value="2031">31</option><option value="2032">32</option><option value="2033">33</option><option value="2034">34</option><option value="2035">35</option><option value="2036">36</option><option value="2037">37</option><option value="2038">38</option><option value="2039">39</option><option value="2040">40</option><option value="2041">41</option></select><svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" class="w_DQ" aria-hidden="true" role="presentation" style="font-size: 1.5rem; vertical-align: -0.25em;"><path d="M8 10l3.5-4h-7z" fill-rule="evenodd"></path></svg></div>
                    </div>
                </div>
            </div>
            <div class="w-50">
                <div class="w_D8 mb3 pr2" name="cvv"><label class="w_Fj w_Fl" for="react-aria-6"><span class="w_Fk">CVV *</span></label>
                    <div class="w_EB"><input id="react-aria-6" type="password" autocomplete="cc-csc" maxlength="3" name="cvv" inputmode="numeric" class="w_EE" value=""><span class="w_EG w_EH"><button class="bg-transparent bn lh-solid pa0 sans-serif tc underline inline-button black pointer f6" type="button" aria-label="Learn more about CVV"><i class="ld ld-InfoCircle" style="font-size: 1rem; vertical-align: -0.175em;"></i></button></span></div>
                </div>
            </div>
            <div class="w-100">
                <div class="w_D8 mv1 w-100"><label class="w_Fj" for="react-aria-7"><span class="w_Fk">Phone number*</span></label>
                    <div class="w_EB"><input id="react-aria-7" type="tel" autocomplete="tel-national" maxlength="14" class="w_EE" value=""></div>
                </div>
            </div>
        </div>
    </div>
    <div class="w-100">
        <div class="flex justify-between"><span class="fw7 f5 pv1">Billing address</span><button class="w_4 w_8 w_AA pa0" type="button">Add new address</button></div><label class="w_Fz w_F0 mv3" for="ld_checkbox_0"><input class="w_F2" id="ld_checkbox_0" type="checkbox" checked=""><i class="w_F3 w_F4"></i>Same as delivery address</label>
        <div class="fw7 f6 mb3"></div>
    </div>
    <div class="flex justify-end pt5"></div>
</form>
`