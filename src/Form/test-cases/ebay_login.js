// https://signin.ebay.com/ws/eBayISAPI.dll?SignIn&ru=https%3A%2F%2Fwww.ebay.com%2F
module.exports = `
<form id="signin-form" name="signin-form" autocomplete="on" action="https://www.ebay.com/signin/s" method="post">
    <div>
        <div>
            <div class="floating-label"><label for="userid" class="floating-label__label floating-label__label--animate floating-label__label--inline">Email or username</label>
                <div class="textbox"><input id="userid" class="textbox__control textbox__control--fluid" type="text" value="" name="userid" maxlength="64" autocomplete="username" data-manual-scoring="username"></div>
            </div><br><button id="signin-continue-btn" name="signin-continue-btn" class="btn btn--fluid btn--large btn--primary" data-ebayui="" type="button">Continue</button></div>
    </div>
    <div class="hide">
        <div class="password-box-wrapper">
            <div class="floating-label"><label for="pass" class="floating-label__label floating-label__label--inline">Password</label>
                <div class="textbox"><input id="pass" class="textbox__control textbox__control--fluid" type="password" value="" name="pass" autocomplete="current-password" aria-label="Password for null" data-manual-scoring="password"></div>
            </div>
        </div><br><button id="sgnBt" name="sgnBt" type="submit" class="btn btn--fluid btn--large btn--primary" data-ebayui="" disabled="">Sign in</button></div>
    <div class="social-signin-wrapper">
        <div class="separator">
            <div class="separator-line animate"></div>
            <div id="social-signin-wrapper-separator" class="separator-content animate"><mark>or</mark></div>
        </div>
        <div class="social-signin-buttons-reg">
            <div><button id="signin_fb_btn" class="scl-btn scl-btn--f btn btn--primary btn--large btn--fluid" type="button" onclick="openSocialFacebookFPRButtonClick(&quot;https://www.ebay.com/signin/fb/init?ru=https%3A%2F%2Fwww.ebay.com%2F&amp;sclSignin=1&quot;)" onkeypress="openSocialFacebookFPRLoginKeyPress(&quot;https://www.ebay.com/signin/fb/init?ru=https%3A%2F%2Fwww.ebay.com%2F&amp;sclSignin=1&quot; , event)">Continue with Facebook</button></div>
            <div><button id="signin_ggl_btn" class="scl-btn scl-btn--g btn btn--primary btn--large btn--fluid" type="button" onclick="openSocialGoogleButtonClick(&quot;https://www.ebay.com/signin/ggl/init?ru=https%3A%2F%2Fwww.ebay.com%2F&amp;sclSignin=1&quot;)" onkeypress="openSocialGoogleLoginKeyPress(&quot;https://www.ebay.com/signin/ggl/init?ru=https%3A%2F%2Fwww.ebay.com%2F&amp;sclSignin=1&quot; , event)">Continue with Google</button></div>
            <div><button id="signin_appl_btn" class="scl-btn scl-btn--a btn btn--primary btn--large btn--fluid" type="button" onclick="openSocialAppleButtonClick(&quot;https://www.ebay.com/signin/apple?ru=https%3A%2F%2Fwww.ebay.com%2F&amp;sclSignin=1&quot;)" onkeypress="openSocialAppleLoginKeyPress(&quot;https://www.ebay.com/signin/apple?ru=https%3A%2F%2Fwww.ebay.com%2F&amp;sclSignin=1&quot; , event)"><svg aria-hidden="true" class="scl-logo-apple" width="16px" height="17px"><use xlink:href="#apple-icon-black-square"></use></svg>Continue with Apple</button></div>
        </div>
    </div>
    <div class="roaming-auth"></div>
    <div class="kmsi-container"><input type="hidden" checked="" name="kmsi-unchecked" value="1"><label class="checkbox-label" id="kmsi-checkbox-lbl"><span class="checkbox custom"><input class="checkbox__control" type="checkbox" id="kmsi-checkbox" name="kmsi" aria-describedby="ssip1 ssip2" checked="" value="1"><span class="checkbox__icon" hidden=""><svg class="checkbox__unchecked" focusable="false" aria-hidden="true"><use xlink:href="#icon-checkbox-unchecked"></use></svg><svg class="checkbox__checked" focusable="false" aria-hidden="true"><use xlink:href="#icon-checkbox-checked"></use></svg></span></span>Stay signed in</label><label id="ssip1">Using a public or shared device?</label><label id="ssip2">Uncheck to protect your account.<br><a href="" aria-label="Learn more about stay signed in." aria-expanded="false" id="kmsi-learn-more-link">Learn more</a></label></div><input type="hidden" name="i1" id="i1" value=""><input type="hidden" name="pageType" id="pageType" value="-1"><input type="hidden" name="returnUrl" id="returnUrl" value="https://www.ebay.com/"><input type="hidden" name="srt" id="srt" value=""><input type="hidden" name="fypReset" id="fypReset"><input type="hidden" name="ICurl" id="ICurl" value=""><input type="hidden" name="src" id="src" value=""><input type="hidden" name="AppName" id="AppName" value=""><input type="hidden" name="srcAppId" id="srcAppId"><input type="hidden" name="errmsg" id="errmsg" value=""><input type="hidden" name="rtmData" id="rtmData" value="PS=T.0"><input type="hidden" name="rqid" id="rqid" value=""><input type="hidden" name="" id="" value=""><input type="hidden" name="recgUser" id="recgUser"><input type="hidden" name="hbi" id="hbi" value="0"></form>
    `