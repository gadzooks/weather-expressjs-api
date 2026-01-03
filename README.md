# Weather REST API with ExpressJS

## To run
```sh
yarn # to install package
yarn run start # to run locally
```

## Run locally


```sh
# Comment out this line in index.ts
# app.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));

yarn run start # to run locally

```

## Deploy to AWS Lambda via ClaudiaJS : 
```sh
# we are using node version 24 right now
nvm use 24.12.0

# install claudia
npm install claudia -g

# this will run - claudia update 
npm run update

```

- https://medium.com/@zahreva/typescript-with-claudia-js-dc4d16acc948
- https://claudiajs.com/tutorials/serverless-express.html

```sh
claudia generate-serverless-express-proxy --express-module dist/index --profile claudia

# create API gateway and lambda function 
claudia create --handler lambda.handler --deploy-proxy-api --region us-west-1 --profile claudia --runtime nodejs20.x

```


```sh
# set up skeleton files with 
npx express-generator

# to run locally
echo VC_API_KEY='set-my-visual-crossing-key' >> .env
npm run serve
```

## Blogs : 
- https://overreacted.io/
- https://kentcdodds.com/blog?q=react


## TODO :
- cacheing
- using cookies (customize views)
- cleaner error handling 
  - https://blog.logrocket.com/async-await-in-typescript/
  - https://www.toptal.com/express-js/routes-js-promises-error-handling
- morgan module
- REST endpoints 
    - /regions /regions/:regionId
    - /locations /locations/:locationId
    - /regions/:regionId/locations
    - tests
- REST forecast endpoint
    - /forecasts/regions/:all
    - /forecasts/regions/:regionId
    - tests
- use interfaces for API call
```javascript
interface StringValidator {
  isAcceptable(s: string): boolean;
}
let lettersRegexp = /^[A-Za-z]+$/;
let numberRegexp = /^[0-9]+$/;
class LettersOnlyValidator implements StringValidator {
  isAcceptable(s: string) {
    return lettersRegexp.test(s);
  }
}
class ZipCodeValidator implements StringValidator {
  isAcceptable(s: string) {
    return s.length === 5 && numberRegexp.test(s);
  }
}
```
- DOTENV : https://www.npmjs.com/package/dotenv

## TODO - later
- compbine react and express and deploy via : https://nx.dev/getting-started/intro


## Look into these articles : 
- boiler plate code - https://javascript.plainenglish.io/skeleton-for-node-js-apps-written-in-typescript-444fa1695b30
- https://github.com/santoshshinde2012/node-boilerplate
- advanced test setup : https://javascript.plainenglish.io/beginners-guide-to-testing-jest-with-node-typescript-1f46a1b87dad
- monorepo plus deployment tool : https://nx.dev/getting-started/intro
- async / awai - https://zellwk.com/blog/async-await-in-loops/

