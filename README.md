# Weather REST API with ExpressJS



```sh
# set up skeleton files with 
npx express-generator

# to run locally
DEBUG=weather-expressjs:* npm start
```

## TODO :
- copy sample VC result and write VC parser 
- make call to VC
- read region / location data from yaml
- endpoints 
    - /regions /regions/:regionId
    - /locations /locations/:locationId
    - /regions/:regionId/locations
- forecast endpoint
    - /forecasts/regions/:all
    - /forecasts/regions/:regionId
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

