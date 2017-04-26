var platform = "debug",
	config = require("../config")[platform],
	restClient = require("../rest-client")(config),
	assert = require("assert"),
	sopSamples = require("./fixtures/sop-request.js"),
	okResponse;

describe("Testing restClient", function(){
	this.retries(4);

	it("should have been instanciated.", function(){
		assert(restClient);
	});

	it("should have an `sop` property", function(){
		assert(restClient.sop);
	});

	it("`sop` should have a `requests` property", function(){
		assert(restClient.sop.requests);
	});

	describe("Testing read method", function(){
		it("`requests` should have a `read` method", function(){
			assert(typeof(restClient.sop.requests.read) === "function");
		});

		it("Read called with no parameters should return atleast one record.", function(done){
			restClient.sop.requests.read()
				.then(function(resp){
					assert(resp.length > 0);
					done();
				})
				.catch(function(err){
					done(err);
				});

		});

		it("Read called with ODATA $filter=message_id eq '15b7d636501733c9' should match sopSamples.odataFilter fixure.", function(done){
			restClient.sop.requests.read("$filter=message_id eq '15b7d636501733c9'")
				.then(function(resp){
					assert(resp.length === 1);
					assert.deepEqual(resp[0], sopSamples.odataFilterSelectExpected);
					done();
				})
				.catch(function(err){
					done(err);
				});
		});

		it("Read called with ODATA $select=id,message_from_email should match sopSamples.odataFilterSelect fixure.", function(done){
			restClient.sop.requests.read("$filter=message_id eq '15b7d636501733c9'&$select=id,message_from_email")
				.then(function(resp){
					assert(resp.length === 1);
					assert.deepEqual(resp[0], sopSamples.odataFilterSelect);
					done();
				})
				.catch(function(err){
					done(err);
				});
		});

	});

	describe("Testing create method", function(){

		it("`requests` should have a `create` method", function(){
			assert(typeof(restClient.sop.requests.create) === "function");
		});

		it("Created should save test record without errors", function(done){
			sopSamples.createTest.message_id = sopSamples.createTest.message_id +  Math.trunc(Math.random() * 100);
			restClient.sop.requests.create(sopSamples.createTest)
				.then(function(resp){
					okResponse = resp;
					done();
				})
				.catch(function(err){
					done(err);
				});


		});

		it("should be able to retrieve the inserted item by id.", function(done){
			restClient.sop.requests.read(okResponse.insertId)
				.then(function(resp){
					assert(resp);
					done();
				})
				.catch(function(err){
					done(err);
				});
		});

	});

	describe("Testing update method", function(){
		it("`requests` should have a `update` method", function(){
			assert(typeof(restClient.sop.requests.update) === "function");
		});

		it("Update should modify test record without errors", function(done){
			sopSamples.updateTest.id = okResponse.insertId;
			sopSamples.updateTest.message_id = sopSamples.createTest.message_id;
			restClient.sop.requests.update(sopSamples.updateTest)
				.then(function(resp){
					if(resp.code) {
						done(resp);
					} else {
						done();
					}
				})
				.catch(function(err){
					done(err);
				});
		});

		it("should be able to retrieve the updated item by id, and should match updateTest.", function(done){
			sopSamples.updateTestExpected.id = okResponse.insertId;
			sopSamples.updateTestExpected.message_id = sopSamples.createTest.message_id;
			restClient.sop.requests.read(okResponse.insertId)
				.then(function(resp){
					assert.deepEqual(resp, sopSamples.updateTestExpected);
					//console.log(resp);
					done();
				})
				.catch(function(err){
					done(err);
				});
		});

	});

	describe("Testing destroy method", function(){
		it("`requests` should have a `destroy` method", function(){
			assert(typeof(restClient.sop.requests.destroy) === "function");
		});

		it("destroy should delete test record without errors", function(done){
			restClient.sop.requests.destroy(sopSamples.updateTest)
				.then(function(resp){
					if(resp && resp.status && resp.status !== 200) {
						done(resp);
					} else {
						done();
					}
				})
				.catch(function(err){
					done(err);
				});
		});

		it("should not be able to retrieve the destroyed item by id.", function(done){
			restClient.sop.requests.read(okResponse.insertId)
				.then(function(resp){
					if(resp && resp.status && resp.status !== 404) {
						done(resp);
					} else {
						done();
					}
				})
				.catch(function(err){
					done(err);
				});
		});

	});
});
