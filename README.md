# NoInfoPath RESTAPI Client

## Installation

```
npm install noinfopath-rest-client --save
```

## Usage

```js
var platform = "debug",
	config = require("../config")[platform],
	restClient = require("../rest-client")(config),
	assert = require("assert"),
	sopSamples = require("./fixtures/sop-request.js"),
	okResponse;

describe("Testing restClient", function(){
	it("Read called with no parameters should return at least one record.", function(done){
		restClient.sop.requests.read()
			.then(function(resp){
				assert(resp.length > 0);
				done();
			})
			.catch(function(err){
				done(err);
			});

	});

});

```
