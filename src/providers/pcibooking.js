let gatewaySettings = {};
let modal;
const DOMAIN = "https://app.thebookingfactory.com";

function _drawForm() {
  const { postfix } = gatewaySettings;

  let body = document.getElementsByTagName('body').item(0);
  let div  = document.createElement('div');

  div.innerHTML = `
    <div class="multiple_card_tokenization__modal_overlay multiple_card_tokenization__modal_overlay__pci_proxy" style="display: none;" id="modal_${postfix}">
      <div class="multiple_card_tokenization__modal_window">
        <div class="multiple_card_tokenization__demo-frame">
        <div>
      </div>
    </div>
  `;

  body.appendChild(div);
  modal = document.getElementById(`modal_${postfix}`);
}

function windowEventHandler(event) {
  // Make sure to check for event.origin here
  if (event.origin === DOMAIN && event.data) {
    var status = event.data.success;
    var token = event.data.token;
    if (gatewaySettings.onTokenize && typeof(gatewaySettings.onTokenize) === 'function' && status === true) {
      gatewaySettings.onTokenize(token, 'bla-bla');
      hideForm();
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
  let modal_inner = modal.getElementsByClassName('multiple_card_tokenization__demo-frame')[0];

  modal_inner.innerHTML = `<iframe width="100%"
          height="100%"
          frameborder="0"
          border="0"
          src="${DOMAIN}/api/public/v1/credit_card_form">`;

  modal.style.display = 'block';
}

function hideForm () {
  modal.style.display = 'none';
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
}
