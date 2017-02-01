let libraryPaths = [
  'https://cdn.worldpay.com/v1/worldpay.js'
];
let form, submit, token_button;
let loadingInterval = null;
let gatewaySettings = {};
let isReady = false;

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

  body.appendChild(div);

  div.innerHTML = `
    <form id="worldpay_card_form_${postfix}">
      <div id='paymentSection'></div>
    </form>
  `
}

function _checkLoading() {
  if (window.Worldpay) {
    isReady = true;
    _initializeScripts();
    clearInterval(loadingInterval);
  }
}

function _initializeScripts() {
  const { postfix, connection } = gatewaySettings;

  form     = document.querySelector(`#worldpay_card_form_${postfix}`);
  submit   = document.querySelector(`#submit_${postfix}`);

  form.addEventListener('submit', onSubmit.bind(this), false);

  Worldpay.useTemplateForm({
    'clientKey': connection.client_key,
    'form': `#worldpay_card_form_${postfix}`,
    'paymentSection':'paymentSection',
    'display': 'modal',
    'reusable': true,
    'callback': function(response) {
      if (response && response.token) {
        if (gatewaySettings.onTokenize && typeof(gatewaySettings.onTokenize) === 'function') {
          gatewaySettings.onTokenize(response.token, response.paymentMethod.maskedCardNumber.split(' ')[3]);
          Worldpay.closeTemplateModal();
        }
      }
    }
  });

  token_button = document.getElementById('token_container-button');
  token_button.style.display = 'none';
}

function onSubmit(event) {
  event.preventDefault();
  Worldpay.submitTemplateForm();
}

function showForm () {
  Worldpay.getTemplateToken();
}

function hideForm () {
  Worldpay.closeTemplateModal();
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
