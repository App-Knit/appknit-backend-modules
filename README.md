![Node.js Package](https://github.com/App-Knit/appknit-backend-modules/workflows/Node.js%20Package/badge.svg?branch=latest)

# AppKnit Backend Module Bundle
This is the standalone bundled modules package for common service and utility functions that are used
across multiple projects.

# Installation
```
npm install --save appknit-backend-bundle
```

# Usage
To use this package you must first install the package using the above command.
and use the nodejs `require` or ES6 `import` to load the utility and services
from the bundle. Following is the sample code format to use the `ResponseUtility` from the appknit-backend-bundle.
```javascript
import { ResponseUtility } from 'appknit-backend-bundle';

export default ({ }) => new Promise((resolve, reject) => {
	// your code implementation

	return resolve(ResponseUtility.SUCCESS({ message: 'Saved data.' }));
});

```

The full documentation of the module could be found in [appknit-backend-bundle WIKI](https://github.com/App-Knit/appknit-backend-modules/wiki)

# Bundle Components
The bundle components are divided into services and utility.

The package is bundled with the following services:
- `EmailServices`: to send plain emails using nodemailer.
- `MultipartService`: to parse the `multipart/form-data` and bind the incoming form field images to the respective request body object.
- `LogServices`: Middleware to handle logs.
- `S3Services`: Functions related to managing data over S3 Bucket.
- `StripeServices`: Functions related to handle stripe payments.
- `TemplateMailServices`: Helping functions to send the template emails using nodemailer templates.
- `MessageService`: Service to send the SMS on phone.
- `VerifyFacebookTokenService`: Authenticate the facebook token.
- `MergingMultipartService`: Merge all of the images to a single `image` property as array of `Buffer` objects.
- `PropsInjectionService`: Injecting the properties in route middleware by injecting the desired value to a single service and hence using the same underlying functionality but on different routes that are separated just by a flag or prop injection.

The package is bundled with the following utilities:
- `HashUtility`: generate or compare the hash of plain text.
- `PropsValidationUtility`: Validates the incoming properties against the required properties. If not, This will generate a custom dynamic response message representing the properties that are required but are missing.
- `RandomCodeUtility`: utility function to generate the random numbers of any health.
- `ResponseUtility`: Contains very important response utility functions. It includes generic functions like `SUCCESS()`, `GENERIC_ERROR()` etc.
- `SchemaMapperUtility`: Checks which properties of a schema to consider and which mot.
- `TimeConversionUUtility`: Time Related conversion and handling.
- `TokenUtility`: Generate the authentication and decode it.

# Author
gaurav sharma
