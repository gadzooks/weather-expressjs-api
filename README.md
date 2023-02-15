# Weather REST API with ExpressJS

## caching 
done via express-cache-middleware

## JWT auth
- using jsonwebtoken

### Steps to set up : 
- https://jwt.io/ go here and specify the payload and secret_key that you want to use
- client will use the generated token and pass it as part of Authorization token as 'Bearer <TOKEN_GENERATED_ABOVE>
- specify JWT_TOKEN_SECRET that was used above as env variable for expressjs
- via middleware decode the token and verify that client has access to that path

- you can decode a JWT token here https://www.jstoolset.com/jwt to see how it looks

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

