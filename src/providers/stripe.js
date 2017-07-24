let libraryPaths = [
  'https://js.stripe.com/v3/'
];
let form, submit, closeBTN, numberField, expDateField;
let hostedFieldsInstance = null;
let loadingInterval = null;
let gatewaySettings = {};
let isReady = false;
let modal;
let stripe;
let elements;
let card;
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
          <legend class="multiple_card_tokenization__form-legend">
            Card Details
            ${close_button}
          </legend>
          <form action="/" method="post" id="stripe_card_form_${postfix}">
            <div class="form-row">
              <div class="multiple_card_tokenization__field-container">
                <label class="multiple_card_tokenization__hosted-fields--label" for="cardholder-name_${postfix}">Cardholder Name</label>
                <input type="text" id="cardholder-name_${postfix}" class="multiple_card_tokenization__hosted-field" placeholder="CARDHOLDER NAME" />
              </div>
              <div class="multiple_card_tokenization__field-container">
                <label class="multiple_card_tokenization__hosted-fields--label">Card Data and Postal Code</label>
                <div id="card-element"></div>
                <div id="card-errors" role="alert"></div>
              </div>
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

  form = document.querySelector(`#stripe_card_form_${postfix}`);
  if (gatewaySettings.showSubmitButton === undefined || !gatewaySettings.showSubmitButton === false) {
    submit = document.querySelector(`#submit_${postfix}`);
    closeBTN = document.querySelector(`#close-form-${postfix}`);
    closeBTN.addEventListener('click', hideForm.bind(this), false);
  }
  form.addEventListener('submit', onSubmit.bind(this), false);
  stripe = Stripe(token);
  elements = stripe.elements();

  var style = {
    base: {
      marginTop: '5px',
      fontSize: '14px',
      lineHeight: '24px'
    }
  };

  card = elements.create('card', {style: style});
  card.mount('#card-element');
  card.addEventListener('change', function(event) {
    var displayError = document.getElementById('card-errors');
    if (event.error) {
      displayError.textContent = event.error.message;
    } else {
      displayError.textContent = '';
    }
  });
}

function onSubmit(event) {
  const { postfix, connection } = gatewaySettings;
  event.preventDefault();

  stripe.createSource(card,{ usage: 'reusable' }).then(function(result) {
    if (result.error) {
      let message = result.error.message;
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
        gatewaySettings.onTokenize(result.source.id, result.source.card.last4);
      }
      hideForm();
    }
  });
}

function showForm (customer_information) {
  gatewaySettings.customer_data = customer_information;
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
