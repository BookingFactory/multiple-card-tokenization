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
  const { postfix } = gatewaySettings;

  let body = document.getElementsByTagName('body').item(0);
  let div  = document.createElement('div');

  div.innerHTML = `
    <div class="multiple_card_tokenization__modal_overlay multiple_card_tokenization__modal_overlay__braintree" style="display: none;" id="modal_${postfix}">
      <div class="multiple_card_tokenization__modal_window">
        <div class="multiple_card_tokenization__demo-frame">
          <form action="/" method="post" id="braintree_card_form_${postfix}" >
            <legend class="multiple_card_tokenization__form-legend">
              Card Details
              <button id="close-form-${postfix}" class="multiple_card_tokenization__close-button"></button>
            </legend>
            <div class="multiple_card_tokenization__field-container">
              <label class="multiple_card_tokenization__hosted-fields--label" for="card-number_${postfix}">Card Number</label>
              <div id="card-number_${postfix}" class="multiple_card_tokenization__hosted-field"></div>
            </div>

            <div class="multiple_card_tokenization__field-container multiple_card_tokenization__field-container__half-field">
              <label class="multiple_card_tokenization__hosted-fields--label" for="expiration-date_${postfix}">Expiration Date</label>
              <div id="expiration-date_${postfix}" class="multiple_card_tokenization__hosted-field"></div>
            </div>

            <div class="multiple_card_tokenization__field-container multiple_card_tokenization__field-container__half-field">
              <label class="multiple_card_tokenization__hosted-fields--label" for="cvv_${postfix}">CVV</label>
              <div id="cvv_${postfix}" class="multiple_card_tokenization__hosted-field"></div>
            </div>

            <div class="multiple_card_tokenization__button-container">
            <input type="submit" class="multiple_card_tokenization__button button--small button--green" value="Save Card Details" id="submit_${postfix}"/>
            </div>
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

  body.appendChild(div);
  modal = document.getElementById(`modal_${postfix}`);
  threeDBankFrame = document.querySelector('.bt-modal-body');
  threeDModal = document.getElementById(`bt-modal_${postfix}`);
  threeDCloseFrame = document.getElementById(`text-close_${postfix}`);
}

function _checkLoading() {
  if (window.braintree && window.braintree.hostedFields && window.braintree.threeDSecure) {
    isReady = true;
    _initializeScripts();
    clearInterval(loadingInterval);
  }
}

function _initializeScripts() {
  const { postfix, connection } = gatewaySettings;
  const { token } = connection;

  form     = document.querySelector(`#braintree_card_form_${postfix}`);
  submit   = document.querySelector(`#submit_${postfix}`);
  closeBTN = document.querySelector(`#close-form-${postfix}`);

  braintree.client.create({ authorization: token }, _afterClientCreate.bind(this));
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
        placeholder: '4111 1111 1111 1111'
      },
      cvv: {
        selector: `#cvv_${postfix}`,
        placeholder: '123'
      },
      expirationDate: {
        selector: `#expiration-date_${postfix}`,
        placeholder: '10 / 2019'
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
  submit.removeAttribute('disabled');
  form.addEventListener('submit', onSubmit.bind(this), false);
  closeBTN.addEventListener('click', hideForm.bind(this), false);
}

function onSubmit(event) {
  event.preventDefault();

  hostedFieldsInstance.tokenize((tokenizeErr, payload) => {
    if (tokenizeErr) {
      console.error(tokenizeErr);
      return;
    }

    if (threeDSecure) {
      threeDSecure.verifyCard({
        amount: gatewaySettings.connection.threeDSecureAmount || 1,
        nonce: payload.nonce,
        addFrame: addFrame,
        removeFrame: removeFrame
      }, function (err, response) {
        if (err) { return; }
        _completeTokenizationProcess(payload);
      });
    } else {
      _completeTokenizationProcess(payload);
    }
  });
}

function _completeTokenizationProcess(payload) {
  if (gatewaySettings.onTokenize && typeof(gatewaySettings.onTokenize) === 'function') {
    gatewaySettings.onTokenize(payload.nonce, payload.description);
    hideForm();
  }
}

function showForm () {
  modal.style.display = 'block';
}

function hideForm () {
  modal.style.display = 'none';
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
}
