let libraryPaths = [
  'https://js.stripe.com/v2/'
];
let form, submit, closeBTN, numberField, expDateField;
let hostedFieldsInstance = null;
let loadingInterval = null;
let gatewaySettings = {};
let isReady = false;
let modal;
const acceptedKeys = [48,49,50,51,52,53,54,55,56,57,8,9,13,37,38,39,40];
const controlKeys = [8,9,13,37,38,39,40];
const keyCodes = {
  48: '0',
  49: '1',
  50: '2',
  51: '3',
  52: '4',
  53: '5',
  54: '6',
  55: '7',
  56: '8',
  57: '9'
}

function _injectLibraryScripts() {
  libraryPaths.forEach((path) => {
    _injectLibraryScript(path);
  })
}

function _injectLibraryScript(path) {
  let head = document.getElementsByTagName('head').item(0);
  let script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', path);
  head.appendChild(script);
}

function _drawForm() {
  const { postfix, showSubmitButton, target } = gatewaySettings;

  let body = document.getElementsByTagName('body').item(0);
  let div  = target ? document.getElementById(target) : document.createElement('div');
  let close_button = showSubmitButton === false ? '' : `<button id="close-form-${postfix}" class="multiple_card_tokenization__close-button"></button>`;
  let submit_button = showSubmitButton === false ? '' : `<div class="multiple_card_tokenization__button-container"><input type="submit" class="multiple_card_tokenization__button button--small button--green" value="Save Card Details" id="submit_${postfix}"/></div>`;

  div.innerHTML = `
    <div class="multiple_card_tokenization__modal_overlay multiple_card_tokenization__modal_overlay__stripe" style="display: none;" id="modal_${postfix}">
      <div class="multiple_card_tokenization__modal_window">
        <div class="multiple_card_tokenization__demo-frame">
          <form action="/" method="post" id="stripe_card_form_${postfix}" >
            <legend class="multiple_card_tokenization__form-legend">
              Card Details
              ${close_button}
            </legend>
            <div class="multiple_card_tokenization__field-container">
              <label class="multiple_card_tokenization__hosted-fields--label" for="card-number_${postfix}">Card Number</label>
              <input type="text" id="card-number_${postfix}" class="multiple_card_tokenization__hosted-field" placeholder="XXXX XXXX XXXX XXXX" />
            </div>

            <div class="multiple_card_tokenization__field-container">
              <label class="multiple_card_tokenization__hosted-fields--label" for="cardholder-name_${postfix}">Cardholder Name</label>
              <input type="text" id="cardholder-name_${postfix}" class="multiple_card_tokenization__hosted-field" placeholder="CARDHOLDER NAME" />
            </div>

            <div class="multiple_card_tokenization__field-container multiple_card_tokenization__field-container__half-field">
              <label class="multiple_card_tokenization__hosted-fields--label" for="expiration-date_${postfix}">Exp. Date</label>
              <input type="text" id="expiration-date_${postfix}" class="multiple_card_tokenization__hosted-field" placeholder="MM / YY" />
            </div>

            <div class="multiple_card_tokenization__field-container multiple_card_tokenization__field-container__half-field">
              <label class="multiple_card_tokenization__hosted-fields--label" for="cvv_${postfix}">CVV</label>
              <input type="text" id="cvv_${postfix}" class="multiple_card_tokenization__hosted-field" placeholder="XXX" />
            </div>

            ${submit_button}
          </form>
        <div>
      </div>
    </div>
  `;

  if (!target) {body.appendChild(div);}

  modal = document.getElementById(`modal_${postfix}`);
}

function _checkLoading() {
  if (window.Stripe) {
    isReady = true;
    _initializeScripts();
    clearInterval(loadingInterval);
  }
}

function _initializeScripts() {
  const { postfix, connection, showSubmitButton } = gatewaySettings;
  const { token } = connection;

  form     = document.querySelector(`#stripe_card_form_${postfix}`);
  if (gatewaySettings.showSubmitButton === undefined || !gatewaySettings.showSubmitButton === false) {
    submit   = document.querySelector(`#submit_${postfix}`);
    closeBTN = document.querySelector(`#close-form-${postfix}`);
    closeBTN.addEventListener('click', hideForm.bind(this), false);
  }
  numberField = document.querySelector(`#card-number_${postfix}`);
  expDateField = document.querySelector(`#expiration-date_${postfix}`);

  form.addEventListener('submit', onSubmit.bind(this), false);
  expDateField.addEventListener('keydown', manageSlashAtExpirationDate.bind(this), false);
  numberField.addEventListener('keydown', manageCardNumber.bind(this), false);

  Stripe.setPublishableKey(token);
}

function onSubmit(event) {
  const { postfix, connection, customer_data } = gatewaySettings;

  event.preventDefault();

  Stripe.card.createToken({
    number: document.querySelector(`#card-number_${postfix}`).value,
    cvc: document.querySelector(`#cvv_${postfix}`).value,
    exp_month: document.querySelector(`#expiration-date_${postfix}`).value.split('/')[0],
    exp_year: document.querySelector(`#expiration-date_${postfix}`).value.split('/')[1],
    name: document.querySelector(`#cardholder-name_${postfix}`).value,
    address_city: customer_data.city,
    address_country: customer_data.country,
    address_line1: customer_data.address,
    address_zip: customer_data.zip_code
  }, function(status, response) {
    if (response.error) {
      let message = response.error.message;
      if (message === "Missing required param: card[exp_year].") {
        message = 'Could not find payment information';
      }
      if (gatewaySettings.onError && typeof(gatewaySettings.onError) === 'function') {
        gatewaySettings.onError(message);
      } else {
        alert(message);
      }
    } else {
      if (gatewaySettings.onTokenize && typeof(gatewaySettings.onTokenize) === 'function') {
        gatewaySettings.onTokenize(response.id, response.card.last4, document.querySelector(`#cardholder-name_${postfix}`).value);
      }

      hideForm();
    }
  });
}

function showForm () {
  modal.style.display = 'block';
}

function hideForm () {
  if (gatewaySettings.showSubmitButton === undefined || !gatewaySettings.showSubmitButton === false) {
    modal.style.display = 'none';
  }
}

function tokenize (customer_information) {
  gatewaySettings.customer_data = customer_information;
  onSubmit({preventDefault: function() {}});
}

function manageSlashAtExpirationDate (event) {
  if (acceptedKeys.indexOf(event.keyCode) == -1) {
    event.preventDefault();
  } else if (controlKeys.indexOf(event.keyCode) != -1) {
  } else {
    if (event.target.value.length == 1) {
      event.target.value = event.target.value + keyCodes[event.keyCode] + '/';
      event.preventDefault();
    }
  }
}

function manageCardNumber (event) {
  const amex_steps = [4,10];
  const steps = [4,8,12];
  const amex_length = 15;
  const length = 16;
  if (acceptedKeys.indexOf(event.keyCode) == -1) {
    event.preventDefault();
  } else if (controlKeys.indexOf(event.keyCode) != -1) {
  } else {
    let val = event.target.value.replace(/\s/ig, '');
    let used_length = event.target.value[0] == '3' ? amex_length : length;
    let used_steps = event.target.value[0] == '3' ? amex_steps : steps;

    if (used_steps.indexOf(val.length + 1) != -1) {
      event.target.value = event.target.value + keyCodes[event.keyCode] + ' ';
      event.preventDefault();
    }

    if (used_length == val.length) {
      event.preventDefault();
    }
  }
}

export default class {
  constructor(settings) {
    gatewaySettings = {
      ...settings,
      postfix: (new Date()).getTime()
    };

    _injectLibraryScripts();
    _drawForm();
    loadingInterval = setInterval(_checkLoading.bind(this), 100);
  }

  showForm = showForm
  hideForm = hideForm
  tokenize = tokenize
}
