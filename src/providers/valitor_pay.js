let gatewaySettings = {};
let modal;

// for local testing DOMAIN = "http://localhost:3000";
const DOMAIN = process.env.ENV_DOMAIN ? process.env.ENV_DOMAIN : "https://app.thebookingfactory.com";

function _drawForm() {
  const { postfix, target } = gatewaySettings;

  let body = document.getElementsByTagName('body').item(0);
  let div  = target ? document.getElementById(target) : document.createElement('div');

  div.innerHTML = `
    <div class="multiple_card_tokenization__modal_overlay multiple_card_tokenization__modal_overlay__pcibooking" style="display: none;" id="modal_${postfix}">
      <div class="multiple_card_tokenization__modal_window multiple_card_tokenization__modal_window__valitor">
        <div class="multiple_card_tokenization__demo-frame">
        <div>
      </div>
    </div>
  `;

  if (!target) {body.appendChild(div);}
  modal = document.getElementById(`modal_${postfix}`);
}

function windowEventHandler(event) {
  var isThreeDSecure = event && event.data && event.data.hasOwnProperty('three_d_secure_data');

  if (!isThreeDSecure) {
    if (event.data == 'valid' || (event.data && event.data.valid == true)) {
      document.getElementById('pcibooking_frame').contentWindow.postMessage('submit', "*");
      return;
    }
    if (event.data == 'invalid' || (event.data && event.data.valid == false)) {
      return gatewaySettings.onError('Payment information is invalid, please check details and try again.');
    }
  }

  if (event.data) {
    var status = event.data.success;
    var message = event.data.message;

    if (isThreeDSecure) {
      // handle valitor_pay 3DS event
      const threeDSecureData = event.data.three_d_secure_data;
      
      if (status === true) {
        if (gatewaySettings.onThreeDSecureSuccess && typeof(gatewaySettings.onThreeDSecureSuccess) === 'function') {
          gatewaySettings.onThreeDSecureSuccess(threeDSecureData);
        }
      } else {
        if (gatewaySettings.onThreeDSecureFail && typeof(gatewaySettings.onThreeDSecureFail) === 'function') {
          gatewaySettings.onThreeDSecureFail(event.data);
        }
      }

    } else {
      // handle channex event
      var card = event.data.card;
      var token = card ? card.card_token : event.data.token;
  
      if (gatewaySettings.onTokenize && typeof(gatewaySettings.onTokenize) === 'function' && status === true) {
        console.log(
          token,
          'is stored at PCI storage',
          window.decodeURI(event.data.cardHolderName),
          {
            last_4: card ? card.card_number : event.data.cardNumber,
            card_type: card ? card.card_type : event.data.cardType,
            expiration_month: card ? card.expiration_month : event.data.expiration.slice(0,2),
            expiration_year: card ? card.expiration_year : event.data.expiration.slice(2,6)
          }
        )
        gatewaySettings.onTokenize(
          token,
          'is stored at PCI storage',
          card ? card.cardholder_name : window.decodeURI(event.data.cardHolderName),
          {
            last_4: card ? card.card_number : event.data.cardNumber,
            card_type: card ? card.card_type : event.data.cardType,
            expiration_month: card ? card.expiration_month : event.data.expiration.slice(0,2),
            expiration_year: card ? card.expiration_year : event.data.expiration.slice(2,6)
          }
        );
        hideForm();
      }
  
      if (status !== true) {
        if (gatewaySettings.onError && typeof(gatewaySettings.onError) === 'function' && message) {
          gatewaySettings.onError(message);
        }
        if (message) {
          alert(message);
        }  
      }
    }
  }
}

function _initializeScripts() {
  if (window.addEventListener) {
    window.addEventListener('message', windowEventHandler);
  } else if (window.attachEvent) {
    window.attachEvent('message', windowEventHandler);
  }
}

function showForm () {
  const { postfix } = gatewaySettings;
  const tokenize = this.tokenize;
  let showSubmitButton = gatewaySettings.showSubmitButton === undefined ? true : false;
  let modal_inner = modal.getElementsByClassName('multiple_card_tokenization__demo-frame')[0];
  let closeBTN, submitBTN;
  let close_button = showSubmitButton === false ? '' : `<button id="close-form-${postfix}" class="multiple_card_tokenization__close-button"></button>`;
  let submit_button = showSubmitButton === false ? '' : `<div class="multiple_card_tokenization__button-container"><input type="submit" class="multiple_card_tokenization__button button--small button--green" value="Save Card Details" id="submit_${postfix}"/></div>`;

  modal_inner.innerHTML = `
    ${close_button}
    <iframe width="100%"
      height="100%"
      frameborder="0"
      border="0"
      id="pcibooking_frame"
      src="${DOMAIN}/api/public/v1/credit_card_form"></iframe>
    ${submit_button}`;  

  modal.style.display = 'block';
  if (showSubmitButton) {
    closeBTN = document.querySelector(`#close-form-${postfix}`);
    closeBTN.addEventListener('click', hideForm.bind(this), false);
    submitBTN = document.querySelector(`#submit_${postfix}`);
    submitBTN.addEventListener('click', function(event) {event.preventDefault(); tokenize();}, false);
  }
}

function tokenize () {
  document.getElementById('pcibooking_frame').contentWindow.postMessage('validate', "*");
}

function hideForm () {
  if (gatewaySettings.showSubmitButton === undefined || gatewaySettings.showSubmitButton === true) {
    modal.style.display = 'none';
  }
}

function showThreeDForm (token, id, state_token) {
  const formHolder = document.getElementById('3dsForm');
  formHolder.style.height = '600px';
  formHolder.style.paddingBottom = '10px';
  formHolder.innerHTML = `
  <iframe width="100%"
    height="100%"
    frameborder="0"
    border="0"
    id="three_d_secure_form"
    src="${DOMAIN}/api/public/v1/three_d_secure_form?token=${token}&hotel_id=${id}&state_token=${state_token}">
    </iframe>`;
}     

export default class {
  constructor(settings) {
    gatewaySettings = {
      ...settings,
      postfix: (new Date()).getTime()
    };

    _drawForm();
    _initializeScripts();
  }

  showForm = showForm
  hideForm = hideForm
  tokenize = tokenize
  showThreeDForm = showThreeDForm
}
