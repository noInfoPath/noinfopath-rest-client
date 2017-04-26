# NoInfoPath RESTAPI Client

## Overview

This module allows for easy configuration and execution of CRUD (Create, Read, Update and Delete) functions
against an ODATA V4 compliant RESTAPI.  It support communicating with multiple REST servers via a
simple JSON configuration schema.  All communications between the client and the servers are via standard
JWT bearer tokens.

### References

- [JWT](http://jwt.io)
- [ODATA](http://www.odata.org/)

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
## Configuration

```json
{
	"debug": {
		"auth0": {
			"secret": "SHHHHH",
			"audience": "MyPeople"
		},
		"namespaces": {
			"foo": {
				"schema": {
					"bar": {
						"entityName": "bar",
						"primaryKey": "id"
					}
				},
				"rest": {
					"protocol": "https://",
					"host": "restapi.my-company.com",
					"port": 443,
					"apiPrefix": "/foo/"
				}
			}
		}
	}
}
```
