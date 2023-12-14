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

`npm run build` 
`npm run dev`

This will serve builded app on `http://0.0.0.0:3008/dist/multipleCardTokenization.min.js` and for the Public Booking Widget on `http://0.0.0.0:3008/dist/production/multipleCardTokenization.min.js`