let gatewaySettings = {};
let modal;

function _drawForm() {
  const { postfix } = gatewaySettings;
  const { merchantId, sign, currency, customTheme } = gatewaySettings.connection;

  let body = document.getElementsByTagName('body').item(0);
  let div  = document.createElement('div');

  div.innerHTML = `
    <div class="multiple_card_tokenization__modal_overlay multiple_card_tokenization__modal_overlay__pci_proxy" style="display: none;" id="modal_${postfix}">
      <div class="multiple_card_tokenization__modal_window">
        <div class="multiple_card_tokenization__demo-frame">
          <button id="close-form-${postfix}"></button>
          <iframe width="350"
                  height="440"
                  frameborder="0"
                  border="0"
                  src="https://pilot.datatrans.biz/upp/jsp/upStart.jsp?merchantId=${merchantId}&sign=${sign}&refno=pci-proxy-inline&amount=0&currency=${currency}&uppAliasOnly=yes">
        <div>
      </div>
    </div>
  `;

  body.appendChild(div);
  modal = document.getElementById(`modal_${postfix}`);
  document.getElementById(`close-form-${postfix}`).addEventListener('click', hideForm);
}

function windowEventHandler(event) {
  // Make sure to check for event.origin here
  if (event.origin === 'https://app.thebookingfactory.com' && event.data) {
    var status = event.data.type;
    var result = event.data.result;
    if (gatewaySettings.onTokenize && typeof(gatewaySettings.onTokenize) === 'function') {
      gatewaySettings.onTokenize(event.data.aliasCC, event.data.maskedCC);
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
