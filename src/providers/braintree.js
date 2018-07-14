let libraryPaths = [
  'https://js.braintreegateway.com/web/3.6.2/js/client.js',
  'https://js.braintreegateway.com/web/3.6.2/js/hosted-fields.js',
  'https://js.braintreegateway.com/web/3.6.2/js/three-d-secure.min.js'
];
let form, submit, closeBTN;
let hostedFieldsInstance = null;
let threeDSecure = null;
let loadingInterval = null;
let gatewaySettings = {};
let isReady = false;
let modal;
let threeDBankFrame = null;
let threeDModal = null;
let threeDCloseFrame = null;

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
  let close_button = showSubmitButton === false ? '' : `<a id="close-form-${postfix}" class="multiple_card_tokenization__close-button"></a>`;
  let submit_button = showSubmitButton === false ? '' : `<div class="multiple_card_tokenization__button-container"><input type="submit" class="multiple_card_tokenization__button button--small button--green" value="Save Card Details" id="submit_${postfix}"/></div>`;

  div.innerHTML = `
    <div class="multiple_card_tokenization__modal_overlay multiple_card_tokenization__modal_overlay__braintree multiple_card_tokenization__loading" style="display: none;" id="modal_${postfix}">
      <div class="multiple_card_tokenization__modal_window">
        <div class="multiple_card_tokenization__demo-frame">
          <form action="/" method="post" id="braintree_card_form_${postfix}" >
            <legend class="multiple_card_tokenization__form-legend">
              Card Details
              ${close_button}
            </legend>
            <div class="multiple_card_tokenization__field-container">
              <label class="multiple_card_tokenization__hosted-fields--label" for="card-number_${postfix}">Card Number</label>
              <div id="card-number_${postfix}" class="multiple_card_tokenization__hosted-field"></div>
            </div>

            <div class="multiple_card_tokenization__field-container">
              <label class="multiple_card_tokenization__hosted-fields--label" for="cardholder-name_${postfix}">Cardholder Name</label>
              <input id="cardholder-name_${postfix}" class="multiple_card_tokenization__hosted-field" type="text" placeholder="CARDHOLDER NAME">
            </div>

            <div class="multiple_card_tokenization__field-container multiple_card_tokenization__field-container__half-field">
              <label class="multiple_card_tokenization__hosted-fields--label" for="expiration-date_${postfix}">Exp. Date</label>
              <div id="expiration-date_${postfix}" class="multiple_card_tokenization__hosted-field"></div>
            </div>

            <div class="multiple_card_tokenization__field-container multiple_card_tokenization__field-container__half-field">
              <label class="multiple_card_tokenization__hosted-fields--label" for="cvv_${postfix}">CVV</label>
              <div id="cvv_${postfix}" class="multiple_card_tokenization__hosted-field"></div>
            </div>
            <div class="multiple_card_tokenization__field-clear"></div>

            ${submit_button}
          </form>
        <div>
      </div>
    </div>
    <div id="bt-modal_${postfix}" class="bt-modal hidden">
      <div class="bt-mask"></div>
      <div class="bt-modal-frame">
        <div class="bt-modal-header">
          <div class="header-text">Authentication</div>
        </div>
        <div class="bt-modal-body"></div>
        <div class="bt-modal-footer"><a id="text-close_${postfix}" href="#">Cancel</a></div>
      </div>
    </div>
  `;

  if (!target) {body.appendChild(div);}
  modal = document.getElementById(`modal_${postfix}`);
  threeDBankFrame = document.querySelector('.bt-modal-body');
  threeDModal = document.getElementById(`bt-modal_${postfix}`);
  threeDCloseFrame = document.getElementById(`text-close_${postfix}`);
}

function _checkLoading() {
  if (window.braintree && window.braintree.client && window.braintree.hostedFields && window.braintree.threeDSecure) {
    isReady = true;
    _initializeScripts();
    clearInterval(loadingInterval);
  }
}

function _initializeScripts() {
  const { postfix, connection, showSubmitButton } = gatewaySettings;
  const { token } = connection;

  form     = document.querySelector(`#braintree_card_form_${postfix}`);
  submit   = showSubmitButton === false ? null : document.querySelector(`#submit_${postfix}`);
  closeBTN = showSubmitButton === false ? null : document.querySelector(`#close-form-${postfix}`);

  braintree.client.create({ authorization: token }, _afterClientCreate.bind(this));
  if (closeBTN) {
    closeBTN.addEventListener('click', hideForm.bind(this), false);
  }
}

function _afterClientCreate(clientErr, clientInstance) {
  const { postfix } = gatewaySettings;
  if (clientErr) {
    console.error(clientErr);
    return;
  }

  if (gatewaySettings.connection.threeDSecureEnabled === true) {
    braintree.threeDSecure.create({
      client: clientInstance
    }, function (threeDSecureErr, threeDSecureInstance) {
      if (threeDSecureErr) { return; }
      threeDSecure = threeDSecureInstance;

      threeDCloseFrame.addEventListener('click', function () {
        threeDSecure.cancelVerifyCard(removeFrame());
      });
    });
  }

  braintree.hostedFields.create({
    client: clientInstance,
    styles: {
      ...gatewaySettings.connection.styles
    },
    fields: {
      number: {
        selector: `#card-number_${postfix}`,
        placeholder: 'XXXX XXXX XXXX XXXX'
      },
      cvv: {
        selector: `#cvv_${postfix}`,
        placeholder: 'XXX'
      },
      expirationDate: {
        selector: `#expiration-date_${postfix}`,
        placeholder: 'MM / YYYY'
      }
    }
  }, hostedFieldsCallback.bind(this));
}

function hostedFieldsCallback(hostedFieldsErr, hostedFieldsInstanceLocale) {
  if (hostedFieldsErr) {
    console.error(hostedFieldsErr);
    return;
  }

  hostedFieldsInstance = hostedFieldsInstanceLocale;
  form.addEventListener('submit', onSubmit.bind(this), false);
  if (gatewaySettings.showSubmitButton === undefined || !gatewaySettings.showSubmitButton === false) {
    submit.removeAttribute('disabled');
    closeBTN.addEventListener('click', hideForm.bind(this), false);
  }
  modal.classList.remove('multiple_card_tokenization__loading');
}

function onSubmit(event) {
  event.preventDefault();

  let fieldNames = {
    'number': 'Card Number',
    'cvv': 'CVV',
    'expirationDate': 'Expiration Date'
  }

  hostedFieldsInstance.tokenize((tokenizeErr, payload) => {
    let message = '';
    if (tokenizeErr) {
      if (tokenizeErr.code === "HOSTED_FIELDS_FIELDS_INVALID") {
        message = 'Invalid value in fields: ' + (tokenizeErr.details.invalidFieldKeys.map(function(field) {return fieldNames[field];}).join(', '));
      } else {
        message = tokenizeErr.message;
      }

      if (gatewaySettings.onError && typeof(gatewaySettings.onError) === 'function') {
        gatewaySettings.onError(message);
      } else {
        alert(message);
      }
      return;
    }

    if (threeDSecure) {
      threeDSecure.verifyCard({
        amount: gatewaySettings.connection.threeDSecureAmount || 1,
        nonce: payload.nonce,
        addFrame: addFrame,
        removeFrame: removeFrame
      }, function (err, response) {
        if (err) { console.log(err); return; }
        _completeTokenizationProcess(response);
      });
    } else {
      _completeTokenizationProcess(payload);
    }
  });
}

function _completeTokenizationProcess(payload) {
  if (gatewaySettings.onTokenize && typeof(gatewaySettings.onTokenize) === 'function') {
    gatewaySettings.onTokenize(payload.nonce, payload.details.lastTwo, document.querySelector(`#cardholder-name_${gatewaySettings.postfix}`).value);
    hideForm();
  }
}

function showForm () {
  modal.style.display = 'block';
}

function hideForm (event) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  if (gatewaySettings.showSubmitButton === undefined || !gatewaySettings.showSubmitButton === false) {
    modal.style.display = 'none';
  }
}

function tokenize () {
  onSubmit({preventDefault: function() {}});
}

function addFrame(err, iframe) {
  threeDBankFrame.appendChild(iframe);
  threeDModal.classList.remove('hidden');
}

function removeFrame() {
  var iframe = threeDBankFrame.querySelector('iframe');
  threeDModal.classList.add('hidden');
  iframe.parentNode.removeChild(iframe);
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
