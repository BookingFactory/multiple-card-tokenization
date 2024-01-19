import * as Sentry from "@sentry/browser";
import { BrowserTracing } from "@sentry/tracing";

import braintree_service from './providers/braintree';
import pci_proxy_service from './providers/pci_proxy';
import stripe_service from './providers/stripe';
import stripe_sca_service from './providers/stripe_sca';
import omise_service from './providers/omise';
import worldpay_service from './providers/worldpay';
import pcibooking_service from './providers/pcibooking';
import payment_express_service from './providers/payment_express';
import valitor_service from './providers/valitor';
import valitor_pay_service from './providers/valitor_pay';
import borgun_service from './providers/borgun';

import stripeScaGateway from './online_providers/stripe_sca';

const SERVICES = {
  braintree_service,
  pci_proxy_service,
  stripe_service,
  stripe_sca_service,
  omise_service,
  worldpay_service,
  pcibooking_service,
  payment_express_service,
  valitor_service,
  valitor_pay_service,
  borgun_service
};

const ONLINE_GATEWAYS = {
  stripe_sca: stripeScaGateway
};

export function init(service, settings) {
  Sentry.init({
    dsn: "https://db118ba1d28a4ab08c1e2b9ab1332892@o100049.ingest.sentry.io/6725921",
    release: '0.2.0',
    integrations: [new BrowserTracing()],
    tracesSampleRate: 1.0,
  });
  console.log('TBF:MultipleCardTokenization v 0.2.0 runned');
  
  try {
    return new SERVICES[`${service}_service`](settings);
  } catch (error) {
    console.log(error);
    console.log('Unsupported payment service');

    return false;
  }
}

export function initStripeScaGateway(gateway, settings) {
  return new Promise((resolve, reject) => {
    const paymentGateway = ONLINE_GATEWAYS[gateway];

    if (!paymentGateway) {
      reject(new Error("Unsupported payment gateway"));
    }

    resolve(new paymentGateway(settings));
  });
}
