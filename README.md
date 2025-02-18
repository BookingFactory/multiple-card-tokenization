### Runinng the App

#### Requirement 

`node -v` >= v16.18.0

`npm -v`  >= 8.19.2

`npm install`

#### In dev enviroment:

Command for starting the app:
`npm run dev`

#### Building the app in dev enviroment: 

First run: 

`npm run prebuild` This will remove the multipleCardTokenization.min.js from `dist/production/multipleCardTokenization.min.js`. Please make sure after running this command to check that the diorectory `dist/production/` doesn't exists or it's empty.

Than run: 

```
npm run build 
npm run dev
```

This will serve builded app on `http://0.0.0.0:3008/dist/multipleCardTokenization.min.js` and for the Public Booking Widget on `http://0.0.0.0:3008/dist/production/multipleCardTokenization.min.js`

###Local testing config

__APP config__
* Target local backend API
```diff
diff --git a/src/config.js b/src/config.js
index 3a8db1e..68ead13 100644
--- a/src/config.js
+++ b/src/config.js
@@ -1,3 +1,4 @@
-export const API_ENDPOINT = process.env.NODE_ENV === 'production'
-  ? (window.API_ENDPOINT || "https://app.thebookingfactory.com") + '/api/public'
-  : 'https://app.thebookingfactory.com/api/public';
+// export const API_ENDPOINT = process.env.NODE_ENV === 'production'
+//   ? (window.API_ENDPOINT || "https://app.thebookingfactory.com") + '/api/public'
+//   : 'https://app.thebookingfactory.com/api/public';
+export const API_ENDPOINT = "http://localhost:3000/api/public"
```

__Valitor Pay__
* Target local backend API
```diff
diff --git a/src/providers/valitor_pay.js b/src/providers/valitor_pay.js
index b1bdff5..a2c2490 100644
--- a/src/providers/valitor_pay.js
+++ b/src/providers/valitor_pay.js
@@ -2,7 +2,7 @@ let gatewaySettings = {};
 let modal;
 
 // for local testing DOMAIN = "http://localhost:3000";
-const DOMAIN = process.env.ENV_DOMAIN ? process.env.ENV_DOMAIN : "https://app.thebookingfactory.com";
+const DOMAIN = "http://localhost:3000";
```

__Stripe SCA__

* Target local backend API
```
diff --git a/src/online_providers/stripe_sca.js b/src/online_providers/stripe_sca.js
index 37bdb11..ac99949 100644
--- a/src/online_providers/stripe_sca.js
+++ b/src/online_providers/stripe_sca.js
@@ -1,8 +1,8 @@
 let gatewaySettings = {};
 
 // for local testing 
-// const DOMAIN = "http://localhost:3000";
-const DOMAIN = process.env.ENV_DOMAIN ? process.env.ENV_DOMAIN : "https://app.thebookingfactory.com";
+const DOMAIN = "http://localhost:3000";
+//const DOMAIN = process.env.ENV_DOMAIN ? process.env.ENV_DOMAIN : "https://app.thebookingfactory.com";

```

* Start stripe webhook
```
 cd tbf_compose
 make run backedn
 docker exec -it backend
 stripe listen --events payment_intent.succeeded,payment_intent.payment_failed,setup_intent.setup_failed,setup_intent.succeeded --forward-to localhost000/api/v1/stripe_webhook
```