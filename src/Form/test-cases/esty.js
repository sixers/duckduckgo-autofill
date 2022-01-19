module.exports = `
<form method="POST" class="add-new-form" id="cc-panel--paymentstep">
    <div>
        <div class="wt-alert wt-alert--error-01 wt-alert--inline wt-display-none" data-selector="add-new-cc-error">
</div>

        <div data-cc-name="">
    <div class="wt-validation wt-pt-xs-2 wt-pb-xs-4">
        <label for="cc-name--paymentstep" class="wt-label">
            <span class="wt-label__required">
                Name on card
            </span>
        </label>
        <input type="text" name="card[name]" id="cc-name--paymentstep" data-id="cc-name--paymentstep" value="" class="wt-input" data-manual-scoring="cardName">
        <div aria-describedby="-errors" class="wt-validation__message wt-validation__message--is-hidden" data-error="invalid-cc-name--paymentstep">
            You must enter a valid name.
        </div>
    </div>
</div>
<div id="new-cc-number-group" data-id="new-cc-number-group" data-cc-number="">
    <div class="wt-validation wt-pb-xs-4">
        <label class="wt-label" for="cc-num--paymentstep" required="true">
            <span class="wt-label__required" data-required-text="Required">
            Card number
        </span></label>
        <div class="wt-input__prepend-wrapper wt-input__append-wrapper">
            <div class="wt-input__prepend">
                <span class="etsy-icon wt-icon--larger" data-cc-icon="default-card"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3,10v8a1,1,0,0,0,1,1H20a1,1,0,0,0,1-1V10H3Z"></path><path d="M21,8V6a1,1,0,0,0-1-1H4A1,1,0,0,0,3,6V8H21Z"></path></svg></span>
                <span class="inline-svg wt-rounded-01 wt-nudge-t-3 wt-b-xs wt-pt-xs-1 wt-pl-xs-1 wt-pr-xs-1 wt-display-none cc-background-color display-none" data-cc-icon="visa"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="18" viewBox="0 0 54 18" version="1.1" aria-hidden="true" focusable="false">
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <path d="M20.4888889,0.322218392 L13.4222222,17.7675946 L8.8,17.7675946 L5.33333333,3.82049964 C5.11111111,2.94592933 4.93333333,2.66974923 4.31111111,2.3015091 C2.94183443,1.61896514 1.49263492,1.1238228 0,0.828548573 L0.0888888889,0.322218392 L7.51111111,0.322218392 C8.51437428,0.32690813 9.36403311,1.08954942 9.51111111,2.11738903 L11.3333333,12.1979626 L15.8666667,0.322218392 L20.4888889,0.322218392 Z M38.5777778,12.0598726 C38.5777778,7.45687094 32.4444444,7.18069084 32.4888889,5.15537012 C32.4888889,4.51094989 33.0666667,3.86652966 34.3555556,3.68240959 C35.8342967,3.5394088 37.3230136,3.80962598 38.6666667,4.46491987 L39.4222222,0.782518556 C38.1172974,0.263564533 36.7311549,-0.00170820448 35.3333333,8.27692349e-06 C31.0222222,8.27692349e-06 28,2.39356913 27.9555556,5.75376033 C27.9111111,8.28541123 30.1333333,9.66631173 31.7777778,10.494852 C33.4222222,11.3233923 34.0444444,11.9217825 34.0444444,12.6582628 C34.0444444,13.8090132 32.6666667,14.3613734 31.4222222,14.3613734 C29.8583806,14.4061465 28.3105619,14.0252266 26.9333333,13.256653 L26.1333333,17.0771444 C27.6723314,17.7168939 29.3197317,18.029953 30.9777778,17.9977447 C35.5555556,18.0437747 38.5333333,15.6962439 38.5777778,12.0598726 L38.5777778,12.0598726 Z M49.9555556,17.7675946 L54,17.7675946 L50.4888889,0.322218392 L46.7555556,0.322218392 C45.9362429,0.312052784 45.1949487,0.823879561 44.8888889,1.61105885 L38.3111111,17.7675946 L42.8888889,17.7675946 L43.7777778,15.1438837 L49.3777778,15.1438837 L49.9555556,17.7675946 Z M45.0666667,11.5995724 L47.3777778,5.06331008 L48.7111111,11.5995724 L45.0666667,11.5995724 Z M26.7111111,0.322218392 L23.1111111,17.7675946 L18.7555556,17.7675946 L22.3555556,0.322218392 L26.7111111,0.322218392 Z" fill="#1A1F71" fill-rule="nonzero"></path>
    </g>
</svg></span>
                <span class="inline-svg wt-rounded-01 wt-nudge-t-3 wt-b-xs wt-pt-xs-1 wt-pl-xs-1 wt-pr-xs-1 wt-b-xs wt-display-none cc-background-color display-none" data-cc-icon="mastercard"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 131.39 86.9" width="24" height="18" aria-hidden="true" focusable="false">
    <defs>
        <style>.a{opacity:0;}.b{fill:#fff;}.c{fill:#ff5f00;}.d{fill:#eb001b;}.e{fill:#f79e1b;}</style>
    </defs>
    <title>Mastercard</title>
    <g class="a">
        <rect class="b" width="131.39" height="86.9"></rect>
    </g>
    <rect class="c" x="48.37" y="15.14" width="34.66" height="56.61"></rect>
    <path class="d" d="M51.94,43.45a35.94,35.94,0,0,1,13.75-28.3,36,36,0,1,0,0,56.61A35.94,35.94,0,0,1,51.94,43.45Z"></path>
    <path class="e" d="M120.5,65.76V64.6H121v-.24h-1.19v.24h.47v1.16Zm2.31,0v-1.4h-.36l-.42,1-.42-1h-.36v1.4h.26V64.7l.39.91h.27l.39-.91v1.06Z"></path>
    <path class="e" d="M123.94,43.45a36,36,0,0,1-58.25,28.3,36,36,0,0,0,0-56.61,36,36,0,0,1,58.25,28.3Z"></path>
</svg></span>
                <span class="inline-svg wt-rounded-01 wt-nudge-t-3 wt-b-xs wt-pt-xs-1 wt-pl-xs-1 wt-pr-xs-1 wt-b-xs wt-display-none cc-background-color display-none" data-cc-icon="amex"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="18" viewBox="0 15 70 40" aria-hidden="true" focusable="false">
<g fill="#006FCF">
<path d="M55.6,40.3v-3.4h1.1V13.6H14V30l1.1-1.4v5.6H14v22h42.7V43.9c-0.1,0-1,0.1-1.1,0.1v-1.8V40.3L55.6,40.3z"></path>
<path fill="#FFFFFF" d="M56.7,43.9v-7h-0.4H30.2l-0.7,1l-0.7-1h-7.6v7.5h7.6l0.7-1l0.7,1H35v-1.6h-0.1c0.6,0,1.1-0.1,1.6-0.3v1.9h3.3     v-1.1l0.8,1.1H55c0.4,0,0.8-0.1,1.1-0.2C56.4,44.1,56.6,44,56.7,43.9L56.7,43.9z M51.5,34.3h3.2v-7.5h-3.4v1.2l-0.8-1.2h-3v1.5     l-0.7-1.5h-4.9c-0.2,0-0.5,0-0.7,0.1c-0.2,0-0.4,0.1-0.6,0.1c-0.1,0-0.3,0.1-0.4,0.2c-0.2,0.1-0.3,0.2-0.4,0.2v-0.3v-0.3H23.8     l-0.4,1.3l-0.4-1.3h-3.7v1.5l-0.7-1.5h-3.1L14,30.1v3.6v0.7h2.2l0.4-1.1h0.8l0.4,1.1h16.6v-1.1l0.8,1.1h4.6v-0.2v-0.3     c0.1,0.1,0.2,0.1,0.4,0.2c0.1,0.1,0.3,0.1,0.4,0.2c0.2,0.1,0.3,0.1,0.5,0.1c0.3,0,0.5,0.1,0.8,0.1h2.8l0.4-1.1h0.8l0.4,1.1h4.6     v-1.1L51.5,34.3L51.5,34.3z"></path>
<path d="M26.5,39.1v-1h-4v5h4v-1h-2.8v-1h2.8v-1h-2.8v-1H26.5L26.5,39.1z M30.7,43.1h1.5l-2-2.5l2-2.5h-1.5l-1.2,1.6     l-1.2-1.6h-1.5l2,2.5l-2,2.5h1.5l1.2-1.6L30.7,43.1L30.7,43.1z M32.4,38.1v5h1.2v-1.7h1.5c1.1,0,1.8-0.7,1.8-1.7     c0-1-0.7-1.7-1.7-1.7H32.4L32.4,38.1z M35.7,39.8c0,0.3-0.2,0.6-0.6,0.6h-1.4v-1.2h1.4C35.5,39.2,35.7,39.4,35.7,39.8L35.7,39.8z      M38.8,41.3h0.6l1.5,1.8h1.5l-1.7-1.9c0.9-0.2,1.4-0.8,1.4-1.6c0-0.9-0.7-1.6-1.7-1.6h-2.7v5h1.2V41.3L38.8,41.3z M40.2,39.1     c0.4,0,0.7,0.3,0.7,0.6c0,0.3-0.2,0.6-0.7,0.6h-1.4v-1.2H40.2L40.2,39.1z M47,39.1v-1h-4v5h4v-1h-2.8v-1h2.8v-1h-2.8v-1H47L47,39.1     z M50.3,42.1h-2.6v1h2.5c1.1,0,1.7-0.7,1.7-1.6c0-0.9-0.6-1.4-1.6-1.4h-1.2c-0.3,0-0.5-0.2-0.5-0.5c0-0.3,0.2-0.5,0.5-0.5h2.2     l0.4-1h-2.6c-1.1,0-1.7,0.7-1.7,1.6c0,0.9,0.6,1.5,1.6,1.5h1.2c0.3,0,0.5,0.2,0.5,0.5C50.8,41.9,50.6,42.1,50.3,42.1L50.3,42.1z      M55.1,42.1h-2.6v1H55c1.1,0,1.7-0.7,1.7-1.6c0-0.9-0.6-1.4-1.6-1.4H54c-0.3,0-0.5-0.2-0.5-0.5c0-0.3,0.2-0.5,0.5-0.5h2.2l0.4-1     h-2.6c-1.1,0-1.7,0.7-1.7,1.6c0,0.9,0.6,1.5,1.6,1.5h1.2c0.3,0,0.5,0.2,0.5,0.5C55.6,41.9,55.3,42.1,55.1,42.1L55.1,42.1z"></path>
<path d="M18.6,33.1h1.4l-2.1-5h-1.6l-2.2,5h1.3l0.4-1.1h2.4L18.6,33.1L18.6,33.1z M16.6,30L17,29l0.4,0.9l0.4,1.1h-1.6     L16.6,30L16.6,30z M21.4,29.7l0-1.4l1.4,4.8h1.1l1.4-4.8l0,1.3v3.4h1.2v-5h-2.1l-1,3.6l-1-3.6h-2.1v5h1.2V29.7L21.4,29.7z      M31.4,29.1v-1h-4v5h4v-1h-2.8v-1h2.8v-1h-2.8v-1H31.4L31.4,29.1z M33.5,31.3h0.6l1.5,1.8h1.5l-1.7-1.9c0.9-0.2,1.4-0.8,1.4-1.6     c0-0.9-0.7-1.6-1.7-1.6h-2.7v5h1.2V31.3L33.5,31.3z M34.9,29.1c0.4,0,0.7,0.3,0.7,0.6c0,0.3-0.2,0.6-0.7,0.6h-1.4v-1.2H34.9     L34.9,29.1z M37.4,33.1h1.2v-2.2v-2.8h-1.2v2.8V33.1L37.4,33.1z M41.7,33.1L41.7,33.1l0.6-1.1h-0.4c-0.8,0-1.3-0.5-1.3-1.4v-0.1     c0-0.8,0.4-1.4,1.3-1.4h1.3v-1.1h-1.4c-1.6,0-2.4,1-2.4,2.5v0.1C39.4,32.1,40.3,33.1,41.7,33.1L41.7,33.1z M47,33.1h1.4l-2.1-5     h-1.6l-2.2,5h1.3l0.4-1.1h2.4L47,33.1L47,33.1z M45,30l0.4-0.9l0.4,0.9l0.4,1.1h-1.6L45,30L45,30z M49.8,30.1l0-0.4l0.3,0.4l1.9,3     h1.4v-5h-1.2V31l0,0.4L52,31l-1.9-2.9h-1.5v5h1.2V30.1L49.8,30.1z"></path>
</g>
</svg></span>
                <span class="inline-svg wt-rounded-01 wt-nudge-t-3 wt-b-xs wt-pt-xs-1 wt-pl-xs-1 wt-pr-xs-1 wt-b-xs wt-display-none cc-background-color display-none" data-cc-icon="discover"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="18" viewBox="0 0 36 7" version="1.1" aria-hidden="true" focusable="false">
    <defs>
        <polygon points="0.0789893617 0.485136161 0.0789893617 6.06091518 4.59718085 6.06091518 4.59718085 0.485136161"></polygon>
    </defs>
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g>
            <g>
                <g>
                    <mask fill="white">
                        <use xlink:href="#a"></use>
                    </mask>
                    <g></g>
                    <path d="M2.87257979,4.67255804 C2.52897606,4.98283482 2.08663564,5.11562277 1.38231383,5.11562277 L1.09005319,5.11562277 L1.09005319,1.42911384 L1.38231383,1.42911384 C2.08663564,1.42911384 2.5118617,1.55532812 2.87257979,1.88006696 C3.25041223,2.21532366 3.47421543,2.73332813 3.47421543,3.26710937 C3.47421543,3.80352009 3.25041223,4.3399308 2.87257979,4.67255804 Z M1.59953457,0.485136161 L0,0.485136161 L0,6.06091518 L1.59295213,6.06091518 C2.43682181,6.06091518 3.04767287,5.85976116 3.58348404,5.41801116 C4.2193484,4.88948884 4.59718085,4.09539063 4.59718085,3.2763125 C4.59718085,1.63026786 3.36494681,0.485136161 1.59953457,0.485136161 L1.59953457,0.485136161 Z" fill="#0D1619" fill-rule="nonzero" mask="url(#b)"></path>
                </g>
            </g>
            <polygon fill="#0D1619" fill-rule="nonzero" points="5.0987633 6.06091518 6.18618351 6.06091518 6.18618351 0.485136161 5.0987633 0.485136161"></polygon>
            <path d="M8.84944149,2.62289062 C8.19646277,2.38229464 8.00425532,2.22321205 8.00425532,1.92213839 C8.00425532,1.57110491 8.34522606,1.30421429 8.81521277,1.30421429 C9.14170213,1.30421429 9.41026596,1.43831696 9.69594415,1.75385268 L10.2633511,1.01234375 C9.79468085,0.600832589 9.23385638,0.393104911 8.62300532,0.393104911 C7.6356383,0.393104911 6.88260638,1.07808036 6.88260638,1.98918973 C6.88260638,2.75962277 7.23410904,3.15141295 8.2543883,3.51822321 C8.68224734,3.66941741 8.89946809,3.76933705 9.0087367,3.83638839 C9.22595745,3.9796942 9.33522606,4.17953348 9.33522606,4.4135558 C9.33522606,4.86582366 8.97450798,5.19845089 8.4887234,5.19845089 C7.9700266,5.19845089 7.55138298,4.94076339 7.29993351,4.45562723 L6.59824468,5.13402902 C7.09982713,5.86896429 7.70277926,6.19501786 8.53216755,6.19501786 C9.66171543,6.19501786 10.456875,5.44167634 10.456875,4.36359598 C10.456875,3.47746652 10.0895745,3.07647321 8.84944149,2.62289062" fill="#0D1619" fill-rule="nonzero"></path>
            <path d="M10.7991622,3.2763125 C10.7991622,4.91578348 12.0893218,6.18581473 13.7467819,6.18581473 C14.2154521,6.18581473 14.6169814,6.09378348 15.1119814,5.85976116 L15.1119814,4.58052679 C14.6749069,5.01570312 14.290492,5.1905625 13.7968085,5.1905625 C12.7001729,5.1905625 11.9208112,4.39646429 11.9208112,3.26710937 C11.9208112,2.19823214 12.7238697,1.35417411 13.7467819,1.35417411 C14.2641622,1.35417411 14.659109,1.53823661 15.1119814,1.97998661 L15.1119814,0.700752232 C14.6340957,0.458841518 14.2404654,0.360236607 13.7717952,0.360236607 C12.122234,0.360236607 10.7991622,1.6565625 10.7991622,3.2763125" fill="#0D1619" fill-rule="nonzero"></path>
            <polyline fill="#0D1619" fill-rule="nonzero" points="23.9337766 4.23080804 22.4435106 0.485136161 21.2547207 0.485136161 23.6244016 6.20290625 24.2102394 6.20290625 26.6220479 0.485136161 25.4411569 0.485136161 23.9337766 4.23080804"></polyline>
            <polyline fill="#0D1619" fill-rule="nonzero" points="27.1157314 6.06091518 30.2055319 6.06091518 30.2055319 5.11562277 28.2044681 5.11562277 28.2044681 3.61025446 30.1291755 3.61025446 30.1291755 2.66759152 28.2044681 2.66759152 28.2044681 1.42911384 30.2055319 1.42911384 30.2055319 0.485136161 27.1157314 0.485136161 27.1157314 6.06091518"></polyline>
            <path d="M32.3290293,3.0514933 L32.0130718,3.0514933 L32.0130718,1.3620625 L32.3474601,1.3620625 C33.0267686,1.3620625 33.3953856,1.64735938 33.3953856,2.18902902 C33.3953856,2.74910491 33.0267686,3.0514933 32.3290293,3.0514933 Z M34.5144016,2.1311808 C34.5144016,1.08596875 33.7955984,0.485136161 32.5396676,0.485136161 L30.9243351,0.485136161 L30.9243351,6.06091518 L32.0130718,6.06091518 L32.0130718,3.82061161 L32.1552527,3.82061161 L33.6613165,6.06091518 L35.0001862,6.06091518 L33.2413564,3.71148884 C34.0628457,3.54451786 34.5144016,2.98444196 34.5144016,2.1311808 L34.5144016,2.1311808 Z" fill="#0D1619" fill-rule="nonzero"></path>
            <path d="M35.077859,0.967642857 L35.0554787,0.967642857 L35.0554787,0.840113839 L35.0791755,0.840113839 C35.1357846,0.840113839 35.1660638,0.861149554 35.1660638,0.903220982 C35.1660638,0.945292411 35.1344681,0.967642857 35.077859,0.967642857 Z M35.2832314,0.900591518 C35.2832314,0.803301339 35.2174069,0.749397321 35.0976064,0.749397321 L34.9396277,0.749397321 L34.9396277,1.24110714 L35.0554787,1.24110714 L35.0554787,1.05047098 L35.1937101,1.24110714 L35.3398404,1.24110714 L35.1752793,1.03863839 C35.2450532,1.02023214 35.2832314,0.968957589 35.2832314,0.900591518 L35.2832314,0.900591518 Z" fill="#1B1A18" fill-rule="nonzero"></path>
            <path d="M35.1199867,1.34628571 C34.9304122,1.34628571 34.776383,1.18983259 34.776383,0.995252232 C34.776383,0.799357143 34.9290957,0.642904018 35.1199867,0.642904018 C35.3069282,0.642904018 35.4583245,0.801986607 35.4583245,0.995252232 C35.4583245,1.18851786 35.3069282,1.34628571 35.1199867,1.34628571 Z M35.1199867,0.565334821 C34.8830186,0.565334821 34.6921277,0.755970982 34.6921277,0.9939375 C34.6921277,1.23190402 34.8830186,1.42254018 35.1199867,1.42254018 C35.3543218,1.42254018 35.5452128,1.23058929 35.5452128,0.9939375 C35.5452128,0.758600446 35.3543218,0.565334821 35.1199867,0.565334821 L35.1199867,0.565334821 Z" fill="#1B1A18" fill-rule="nonzero"></path>
            <path d="M18.500625,0.381272321 C16.8576463,0.381272321 15.5240426,1.66313616 15.5240426,3.24607366 C15.5240426,4.9289308 16.7997207,6.18581473 18.500625,6.18581473 C20.1607181,6.18581473 21.470625,4.91183929 21.470625,3.27894196 C21.470625,1.6565625 20.168617,0.381272321 18.500625,0.381272321" fill="#E6792B" fill-rule="nonzero"></path>
        </g>
    </g>
</svg></span>
            </div>
            <input type="tel" name="card[number]" id="cc-num--paymentstep" data-id="cc-num--paymentstep" value="" class="wt-input wt-pl-xs-9" aria-describedby="invalid-cc-number--paymentstep" aria-label="Credit card number" data-manual-scoring="cardNumber">
            <span class="wt-input__append">
                <span class="etsy-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17,10V7A5,5,0,0,0,7,7v3H5v8a2,2,0,0,0,2,2H17a2,2,0,0,0,2-2V10H17Zm-4,7a1,1,0,0,1-2,0V13a1,1,0,0,1,2,0v4Zm2-7H9V7a2.935,2.935,0,0,1,3-3,2.935,2.935,0,0,1,3,3v3Z"></path></svg></span>
            </span>
        </div>
        <div class="wt-validation__message wt-validation__message--is-hidden" id="invalid-cc-number--paymentstep" data-error="invalid-cc-number--paymentstep">
                Please enter a valid card number.
        </div>
    </div>
</div>
<div class="wt-display-flex-xs wt-justify-content-space-between">
    <div class="wt-flex-xs-5 wt-flex-md-none">
        <label class="wt-label wt-label__required" data-required-text="Required">
            Expiration date
        </label>
        <div class="wt-validation">
    <div class="wt-display-flex-xs wt-form-group-xs">
        <div class="wt-select">
            <label for="expiration-month-select-61bca3efb548f" class="wt-screen-reader-only">&gt;
                Credit card expiration month
            </label>
            <select id="expiration-month-select-61bca3efb548f" name="card[exp_mon]" class="wt-select__element cc-exp-mon" data-manual-scoring="expirationMonth">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
            </select>
        </div>

        <div class="wt-select">
            <label for="expiration-year-select-61bca3efb548f" class="wt-screen-reader-only">
                Credit card expiration year
            </label>
            <select id="expiration-year-select-61bca3efb548f" name="card[exp_year]" class="wt-select__element cc-exp-year" data-manual-scoring="expirationYear">
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
                <option value="2030">2030</option>
                <option value="2031">2031</option>
                <option value="2032">2032</option>
                <option value="2033">2033</option>
                <option value="2034">2034</option>
                <option value="2035">2035</option>
                <option value="2036">2036</option>
                <option value="2037">2037</option>
                <option value="2038">2038</option>
                <option value="2039">2039</option>
                <option value="2040">2040</option>
                <option value="2041">2041</option>
            </select>
        </div>
    </div>

    <div class="wt-validation__message wt-validation__message--is-hidden" data-error="invalid-cc-expiration">
        You must enter a valid expiration date
    </div>
</div>
    </div>
    <div class="wt-flex-xs-4 wt-flex-md-none wt-ml-xs-2">
        <div data-cc-ccv="">
    <div data-id="new-cc-ccv-group" class="wt-validation">
<label for="cc-ccv" class="wt-label ">
                Security code

    <span class="wt-label__required" data-required-text="Required">
    
</span></label>

        <div class="wt-display-flex-xs wt-align-items-center">
            <div class="wt-display-inline-block wt-position-relative wt-input__append-wrapper">
                <input type="tel" name="card[ccv]" id="cc-ccv--paymentstep" data-id="cc-ccv--paymentstep" value="" class="wt-input" maxlength="4" size="8" autocomplete="off" aria-describedby="invalid-cc-security-code--paymentstep" aria-label="Security code" data-manual-scoring="cardSecurityCode">
                <span class="wt-input__append">
                    <span class="etsy-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17,10V7A5,5,0,0,0,7,7v3H5v8a2,2,0,0,0,2,2H17a2,2,0,0,0,2-2V10H17Zm-4,7a1,1,0,0,1-2,0V13a1,1,0,0,1,2,0v4Zm2-7H9V7a2.935,2.935,0,0,1,3-3,2.935,2.935,0,0,1,3,3v3Z"></path></svg></span>
                </span>
            </div>
            <div class="wt-display-inline-block wt-ml-xs-1">
                <span class="wt-popover wt-popover--top" data-wt-popover="">
                    <a href="" class="wt-popover__trigger" aria-describedby="default-ccv-help-text--paymentstep" tabindex="0" onclick="return false" aria-label="Security code tooltip" data-wt-popover-trigger="">
                        <span class="etsy-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12,22A10,10,0,1,1,22,12,10.012,10.012,0,0,1,12,22ZM12,4a8,8,0,1,0,8,8A8.009,8.009,0,0,0,12,4Z"></path><circle cx="12" cy="16.5" r="1.5"></circle><path d="M13,14H11a3.043,3.043,0,0,1,1.7-2.379C13.5,11.055,14,10.674,14,10a2,2,0,1,0-4,0H8a4,4,0,1,1,8,0,4,4,0,0,1-2.152,3.259A2.751,2.751,0,0,0,13,14Z"></path></svg></span>
                    </a>
                    <span id="default-ccv-help-text--paymentstep" role="tooltip" style="margin: 0px;">
                        <span data-ccv-tooltip="default">Your security code is a three digit number on the back of your card.</span>
                        <span data-ccv-tooltip="amex" class="wt-display-none display-none" style="display: none;">Your security code is a four digit number on the front of your card.</span>
                        <span class="wt-popover__arrow" style=""></span>
                    </span>
                </span>
            </div>
        </div>
        <div class="wt-validation__message wt-validation__message--is-hidden wt-mb-xs-2" id="invalid-cc-security-code--paymentstep" data-error="invalid-cc-security-code--paymentstep">
            Please enter a valid security code.
        </div>
    </div>
</div>
    </div>
</div>

    <div class="wt-pt-xs-1 wt-mb-xs-1">
        <div class="wt-checkbox">
            <input type="checkbox" name="card[billing_address_id]" value="1043596831662" id="same-shipping-address-checkbox--paymentstep" data-id="cc-address" data-selector="cc-address" checked="checked" data-no-auto-check="true">
            <label for="same-shipping-address-checkbox--paymentstep">
                My billing address is the same as my delivery address:<br>
                <span data-selector="shipping-address" class="shipping-address wt-text-caption wt-text-gray">
                </span>
            </label>
        </div>
    </div>


    </div>
        <div data-selector-billing-address-form-inline="" class="wt-mb-xs-2">
            <h2 class="wt-pt-xs-2 wt-mb-xs-3 wt-mb-lg-4">
                Enter your billing address
            </h2>
            <div class="wt-has-validation">
                
    

                <div data-selector-address-form="" style="overflow: visible;"><div class="wt-grid wt-grid--block"></div><div class="wt-grid wt-grid--block">
    <div id="country_id9" data-field-container="country_id" class="wt-grid__item-xs-12  wt-validation">
        <label class="wt-label wt-mb-xs-0" for="country_id9-select">
            Country
            <span class="wt-label__required wt-ml-xs-1 wt-nudge-r-4" data-required-text="Required"></span>
        </label>
        <div class="wt-select">
            <select data-field="country_id" name="country_id" class="wt-select__element" id="country_id9-select" data-manual-scoring="addressCountryCode"  >

                <option value="" disabled="">
                    Select Country
                </option>

                <option label="----------" disabled=""></option>

                    <option value="61">
                        Australia
                    </option>
                    <option value="79">
                        Canada
                    </option>
                    <option value="103">
                        France
                    </option>
                    <option value="91">
                        Germany
                    </option>
                    <option value="112">
                        Greece
                    </option>
                    <option value="123">
                        Ireland
                    </option>
                    <option value="128">
                        Italy
                    </option>
                    <option value="131">
                        Japan
                    </option>
                    <option value="167">
                        New Zealand
                    </option>
                    <option value="174">
                        Poland
                    </option>
                    <option value="177">
                        Portugal
                    </option>
                    <option value="181">
                        Russia
                    </option>
                    <option value="99">
                        Spain
                    </option>
                    <option value="164">
                        The Netherlands
                    </option>
                    <option value="105">
                        United Kingdom
                    </option>
                    <option value="209">
                        United States
                    </option>

                <option label="----------" disabled=""></option>

                    <option value="55">
                        Afghanistan
                    </option>
                    <option value="57">
                        Albania
                    </option>
                    <option value="95">
                        Algeria
                    </option>
                    <option value="250">
                        American Samoa
                    </option>
                    <option value="228">
                        Andorra
                    </option>
                    <option value="56">
                        Angola
                    </option>
                    <option value="251">
                        Anguilla
                    </option>
                    <option value="252">
                        Antigua and Barbuda
                    </option>
                    <option value="59">
                        Argentina
                    </option>
                    <option value="60">
                        Armenia
                    </option>
                    <option value="253">
                        Aruba
                    </option>
                    <option value="61">
                        Australia
                    </option>
                    <option value="62">
                        Austria
                    </option>
                    <option value="63">
                        Azerbaijan
                    </option>
                    <option value="229">
                        Bahamas
                    </option>
                    <option value="232">
                        Bahrain
                    </option>
                    <option value="68">
                        Bangladesh
                    </option>
                    <option value="237">
                        Barbados
                    </option>
                    <option value="71">
                        Belarus
                    </option>
                    <option value="65">
                        Belgium
                    </option>
                    <option value="72">
                        Belize
                    </option>
                    <option value="66">
                        Benin
                    </option>
                    <option value="225">
                        Bermuda
                    </option>
                    <option value="76">
                        Bhutan
                    </option>
                    <option value="73">
                        Bolivia
                    </option>
                    <option value="70">
                        Bosnia and Herzegovina
                    </option>
                    <option value="77">
                        Botswana
                    </option>
                    <option value="254">
                        Bouvet Island
                    </option>
                    <option value="74">
                        Brazil
                    </option>
                    <option value="255">
                        British Indian Ocean Territory
                    </option>
                    <option value="231">
                        British Virgin Islands
                    </option>
                    <option value="75">
                        Brunei
                    </option>
                    <option value="69">
                        Bulgaria
                    </option>
                    <option value="67">
                        Burkina Faso
                    </option>
                    <option value="64">
                        Burundi
                    </option>
                    <option value="135">
                        Cambodia
                    </option>
                    <option value="84">
                        Cameroon
                    </option>
                    <option value="79">
                        Canada
                    </option>
                    <option value="222">
                        Cape Verde
                    </option>
                    <option value="247">
                        Cayman Islands
                    </option>
                    <option value="78">
                        Central African Republic
                    </option>
                    <option value="196">
                        Chad
                    </option>
                    <option value="81">
                        Chile
                    </option>
                    <option value="82">
                        China
                    </option>
                    <option value="257">
                        Christmas Island
                    </option>
                    <option value="258">
                        Cocos (Keeling) Islands
                    </option>
                    <option value="86">
                        Colombia
                    </option>
                    <option value="259">
                        Comoros
                    </option>
                    <option value="85">
                        Congo, Republic of
                    </option>
                    <option value="260">
                        Cook Islands
                    </option>
                    <option value="87">
                        Costa Rica
                    </option>
                    <option value="118">
                        Croatia
                    </option>
                    <option value="338">
                        Curaçao
                    </option>
                    <option value="89">
                        Cyprus
                    </option>
                    <option value="90">
                        Czech Republic
                    </option>
                    <option value="93">
                        Denmark
                    </option>
                    <option value="92">
                        Djibouti
                    </option>
                    <option value="261">
                        Dominica
                    </option>
                    <option value="94">
                        Dominican Republic
                    </option>
                    <option value="96">
                        Ecuador
                    </option>
                    <option value="97">
                        Egypt
                    </option>
                    <option value="187">
                        El Salvador
                    </option>
                    <option value="111">
                        Equatorial Guinea
                    </option>
                    <option value="98">
                        Eritrea
                    </option>
                    <option value="100">
                        Estonia
                    </option>
                    <option value="101">
                        Ethiopia
                    </option>
                    <option value="262">
                        Falkland Islands (Malvinas)
                    </option>
                    <option value="241">
                        Faroe Islands
                    </option>
                    <option value="234">
                        Fiji
                    </option>
                    <option value="102">
                        Finland
                    </option>
                    <option value="103">
                        France
                    </option>
                    <option value="115">
                        French Guiana
                    </option>
                    <option value="263">
                        French Polynesia
                    </option>
                    <option value="264">
                        French Southern Territories
                    </option>
                    <option value="104">
                        Gabon
                    </option>
                    <option value="109">
                        Gambia
                    </option>
                    <option value="106">
                        Georgia
                    </option>
                    <option value="91">
                        Germany
                    </option>
                    <option value="107">
                        Ghana
                    </option>
                    <option value="226">
                        Gibraltar
                    </option>
                    <option value="112">
                        Greece
                    </option>
                    <option value="113">
                        Greenland
                    </option>
                    <option value="245">
                        Grenada
                    </option>
                    <option value="265">
                        Guadeloupe
                    </option>
                    <option value="266">
                        Guam
                    </option>
                    <option value="114">
                        Guatemala
                    </option>
                    <option value="108">
                        Guinea
                    </option>
                    <option value="110">
                        Guinea-Bissau
                    </option>
                    <option value="116">
                        Guyana
                    </option>
                    <option value="119">
                        Haiti
                    </option>
                    <option value="267">
                        Heard Island and McDonald Islands
                    </option>
                    <option value="268">
                        Holy See (Vatican City State)
                    </option>
                    <option value="117">
                        Honduras
                    </option>
                    <option value="219">
                        Hong Kong
                    </option>
                    <option value="120">
                        Hungary
                    </option>
                    <option value="126">
                        Iceland
                    </option>
                    <option value="122">
                        India
                    </option>
                    <option value="121">
                        Indonesia
                    </option>
                    <option value="125">
                        Iraq
                    </option>
                    <option value="123">
                        Ireland
                    </option>
                    <option value="269">
                        Isle of Man
                    </option>
                    <option value="127">
                        Israel
                    </option>
                    <option value="128">
                        Italy
                    </option>
                    <option value="83">
                        Ivory Coast
                    </option>
                    <option value="129">
                        Jamaica
                    </option>
                    <option value="131">
                        Japan
                    </option>
                    <option value="130">
                        Jordan
                    </option>
                    <option value="132">
                        Kazakhstan
                    </option>
                    <option value="133">
                        Kenya
                    </option>
                    <option value="270">
                        Kiribati
                    </option>
                    <option value="271">
                        Kosovo
                    </option>
                    <option value="137">
                        Kuwait
                    </option>
                    <option value="134">
                        Kyrgyzstan
                    </option>
                    <option value="138">
                        Laos
                    </option>
                    <option value="146">
                        Latvia
                    </option>
                    <option value="139">
                        Lebanon
                    </option>
                    <option value="143">
                        Lesotho
                    </option>
                    <option value="140">
                        Liberia
                    </option>
                    <option value="141">
                        Libya
                    </option>
                    <option value="272">
                        Liechtenstein
                    </option>
                    <option value="144">
                        Lithuania
                    </option>
                    <option value="145">
                        Luxembourg
                    </option>
                    <option value="273">
                        Macao
                    </option>
                    <option value="151">
                        Macedonia
                    </option>
                    <option value="149">
                        Madagascar
                    </option>
                    <option value="158">
                        Malawi
                    </option>
                    <option value="159">
                        Malaysia
                    </option>
                    <option value="238">
                        Maldives
                    </option>
                    <option value="152">
                        Mali
                    </option>
                    <option value="227">
                        Malta
                    </option>
                    <option value="274">
                        Marshall Islands
                    </option>
                    <option value="275">
                        Martinique
                    </option>
                    <option value="157">
                        Mauritania
                    </option>
                    <option value="239">
                        Mauritius
                    </option>
                    <option value="276">
                        Mayotte
                    </option>
                    <option value="150">
                        Mexico
                    </option>
                    <option value="277">
                        Micronesia, Federated States of
                    </option>
                    <option value="148">
                        Moldova
                    </option>
                    <option value="278">
                        Monaco
                    </option>
                    <option value="154">
                        Mongolia
                    </option>
                    <option value="155">
                        Montenegro
                    </option>
                    <option value="279">
                        Montserrat
                    </option>
                    <option value="147">
                        Morocco
                    </option>
                    <option value="156">
                        Mozambique
                    </option>
                    <option value="153">
                        Myanmar (Burma)
                    </option>
                    <option value="160">
                        Namibia
                    </option>
                    <option value="280">
                        Nauru
                    </option>
                    <option value="166">
                        Nepal
                    </option>
                    <option value="243">
                        Netherlands Antilles
                    </option>
                    <option value="233">
                        New Caledonia
                    </option>
                    <option value="167">
                        New Zealand
                    </option>
                    <option value="163">
                        Nicaragua
                    </option>
                    <option value="161">
                        Niger
                    </option>
                    <option value="162">
                        Nigeria
                    </option>
                    <option value="281">
                        Niue
                    </option>
                    <option value="282">
                        Norfolk Island
                    </option>
                    <option value="283">
                        Northern Mariana Islands
                    </option>
                    <option value="165">
                        Norway
                    </option>
                    <option value="168">
                        Oman
                    </option>
                    <option value="169">
                        Pakistan
                    </option>
                    <option value="284">
                        Palau
                    </option>
                    <option value="285">
                        Palestinian Territory, Occupied
                    </option>
                    <option value="170">
                        Panama
                    </option>
                    <option value="173">
                        Papua New Guinea
                    </option>
                    <option value="178">
                        Paraguay
                    </option>
                    <option value="171">
                        Peru
                    </option>
                    <option value="172">
                        Philippines
                    </option>
                    <option value="174">
                        Poland
                    </option>
                    <option value="177">
                        Portugal
                    </option>
                    <option value="175">
                        Puerto Rico
                    </option>
                    <option value="179">
                        Qatar
                    </option>
                    <option value="304">
                        Reunion
                    </option>
                    <option value="180">
                        Romania
                    </option>
                    <option value="181">
                        Russia
                    </option>
                    <option value="182">
                        Rwanda
                    </option>
                    <option value="286">
                        Saint Helena
                    </option>
                    <option value="287">
                        Saint Kitts and Nevis
                    </option>
                    <option value="244">
                        Saint Lucia
                    </option>
                    <option value="288">
                        Saint Martin (French part)
                    </option>
                    <option value="289">
                        Saint Pierre and Miquelon
                    </option>
                    <option value="249">
                        Saint Vincent and the Grenadines
                    </option>
                    <option value="290">
                        Samoa
                    </option>
                    <option value="291">
                        San Marino
                    </option>
                    <option value="292">
                        Sao Tome and Principe
                    </option>
                    <option value="183">
                        Saudi Arabia
                    </option>
                    <option value="185">
                        Senegal
                    </option>
                    <option value="189">
                        Serbia
                    </option>
                    <option value="293">
                        Seychelles
                    </option>
                    <option value="186">
                        Sierra Leone
                    </option>
                    <option value="220">
                        Singapore
                    </option>
                    <option value="337">
                        Sint Maarten (Dutch part)
                    </option>
                    <option value="191">
                        Slovakia
                    </option>
                    <option value="192">
                        Slovenia
                    </option>
                    <option value="242">
                        Solomon Islands
                    </option>
                    <option value="188">
                        Somalia
                    </option>
                    <option value="215">
                        South Africa
                    </option>
                    <option value="294">
                        South Georgia and the South Sandwich Islands
                    </option>
                    <option value="136">
                        South Korea
                    </option>
                    <option value="339">
                        South Sudan
                    </option>
                    <option value="99">
                        Spain
                    </option>
                    <option value="142">
                        Sri Lanka
                    </option>
                    <option value="184">
                        Sudan
                    </option>
                    <option value="190">
                        Suriname
                    </option>
                    <option value="295">
                        Svalbard and Jan Mayen
                    </option>
                    <option value="194">
                        Swaziland
                    </option>
                    <option value="193">
                        Sweden
                    </option>
                    <option value="80">
                        Switzerland
                    </option>
                    <option value="204">
                        Taiwan
                    </option>
                    <option value="199">
                        Tajikistan
                    </option>
                    <option value="205">
                        Tanzania
                    </option>
                    <option value="198">
                        Thailand
                    </option>
                    <option value="164">
                        The Netherlands
                    </option>
                    <option value="296">
                        Timor-Leste
                    </option>
                    <option value="197">
                        Togo
                    </option>
                    <option value="297">
                        Tokelau
                    </option>
                    <option value="298">
                        Tonga
                    </option>
                    <option value="201">
                        Trinidad
                    </option>
                    <option value="202">
                        Tunisia
                    </option>
                    <option value="203">
                        Turkey
                    </option>
                    <option value="200">
                        Turkmenistan
                    </option>
                    <option value="299">
                        Turks and Caicos Islands
                    </option>
                    <option value="300">
                        Tuvalu
                    </option>
                    <option value="206">
                        Uganda
                    </option>
                    <option value="207">
                        Ukraine
                    </option>
                    <option value="58">
                        United Arab Emirates
                    </option>
                    <option value="105">
                        United Kingdom
                    </option>
                    <option value="209">
                        United States
                    </option>
                    <option value="302">
                        United States Minor Outlying Islands
                    </option>
                    <option value="208">
                        Uruguay
                    </option>
                    <option value="248">
                        U.S. Virgin Islands
                    </option>
                    <option value="210">
                        Uzbekistan
                    </option>
                    <option value="221">
                        Vanuatu
                    </option>
                    <option value="211">
                        Venezuela
                    </option>
                    <option value="212">
                        Vietnam
                    </option>
                    <option value="224">
                        Wallis and Futuna
                    </option>
                    <option value="213">
                        Western Sahara
                    </option>
                    <option value="214">
                        Yemen
                    </option>
                    <option value="216">
                        Zaire (Democratic Republic of Congo)
                    </option>
                    <option value="217">
                        Zambia
                    </option>
                    <option value="218">
                        Zimbabwe
                    </option>
            </select>
        </div>

            <div class="wt-validation__message">
            </div>
    </div>
</div><div class="wt-grid wt-grid--block">    <div id="name37" data-field-container="name" class="wt-grid__item-xs-12 wt-validation">
        <label class="wt-label wt-mb-xs-0 " for="name37-input">
            Full name
                    <span class="wt-label__required wt-ml-xs-1 wt-nudge-r-4" data-required-text="Required"></span>
        </label>
        <input type="text" class="wt-input " data-field="name" value="" name="name" id="name37-input" aria-describedby="name-errors" aria-invalid="true" aria-required="true" placeholder="" autocomplete="name" data-manual-scoring="fullName">
        <div class="wt-validation__message">
                <p id="name-errors">Please enter a full name.</p>
        </div>
    </div>
</div><div class="wt-grid wt-grid--block">    <div id="first_line11" data-field-container="first_line" class="wt-grid__item-xs-12 wt-validation">
        <label class="wt-label wt-mb-xs-0 " for="first_line11-input">
            Street address
                    <span class="wt-label__required wt-ml-xs-1 wt-nudge-r-4" data-required-text="Required"></span>
        </label>
        <input type="text" class="wt-input " data-field="first_line" value="" name="first_line" id="first_line11-input" aria-required="true" placeholder="" autocomplete="address-line1" data-manual-scoring="addressStreet">
        <div class="wt-validation__message">
        </div>
    </div>
</div><div class="wt-grid wt-grid--block">    <div id="second_line12" data-field-container="second_line" class="wt-grid__item-xs-12 wt-validation">
        <label class="wt-label wt-mb-xs-0 " for="second_line12-input">
            Flat/Other<span class="wt-label__optional"> (optional)</span>
        </label>
        <input type="text" class="wt-input " data-field="second_line" value="" name="second_line" id="second_line12-input" placeholder="" autocomplete="address-line2" data-manual-scoring="addressStreet2">
        <div class="wt-validation__message">
        </div>
    </div>
</div><div class="wt-grid wt-grid--block">
    <div id="zip13" data-field-container="zip" class="wt-grid__item-xs-6  wt-validation">
        <label class="wt-label wt-mb-xs-0" for="zip13-input">Postal code<span class="wt-label__optional"> (optional)</span>
        </label>
        <div class="wt-menu wt-menu--full-width wt-menu--offset-below-trigger">
            <div class="wt-menu__trigger" role="combobox" aria-expanded="false" aria-owns="zip-listbox" aria-haspopup="listbox">
                <div class="wt-width-full wt-position-relative wt-display-flex-xs wt-align-items-center">
                    <input id="zip13-input" type="text" data-field="zip" class="wt-input wt-pr-xs-7" value="" maxlength="12" name="zip" autocomplete="postal-code" aria-controls="zip-listbox" aria-autocomplete="list" data-manual-scoring="addressPostalCode">
                </div>
            </div>

            <div class="wt-validation__message">
            </div>
        </div>
    </div>
</div><div class="wt-grid wt-grid--block">    <div id="city14" data-field-container="city" class="wt-grid__item-xs-12 wt-validation">
        <label class="wt-label wt-mb-xs-0 " for="city14-input">
            City
                    <span class="wt-label__required wt-ml-xs-1 wt-nudge-r-4" data-required-text="Required"></span>
        </label>
        <input type="text" class="wt-input " data-field="city" value="" name="city" id="city14-input" aria-required="true" placeholder="" autocomplete="address-level2" data-manual-scoring="addressCity">
        <div class="wt-validation__message">
        </div>
    </div>
</div></div>
            </div>
        </div>
    <button type="submit" class="wt-btn wt-btn--filled wt-width-full" name="payment_submit">
        <span data-button-cta="">Review your order</span>
    </button>
</form>
`
