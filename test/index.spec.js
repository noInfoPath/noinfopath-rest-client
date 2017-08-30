var platform = "debug",
	config = require("./fixtures/config"),
	restInit = require("../index"),
	assert = require("assert"),
	sopSamples = require("./fixtures/sop-request"),
	okResponse, restClient;

config.creds = sopSamples.testCreds;

describe("Testing restClient", function(){
	//this.retries(4);

	before(function(){
		restClient = restInit(config);
	});

	it("should have been instanciated.", function(){
		assert(restClient);
	});

	it("should have an `sop` property", function(){
		assert(restClient.app);
	});

	it("`sop` should have a `test` property", function(){
		assert(restClient.app.test);
	});

	describe("Testing read method", function(){
		it("`test` should have a `read` method", function(){
			assert(typeof(restClient.app.test.read) === "function");
		});

		it("Read called with no parameters should return atleast one record.", function(done){
			restClient.app.test.read()
				.then(function(resp){
					assert(resp.length > 0);
					done();
				})
				.catch(function(err){
					done(err);
				});

		});

		it("Read called with ODATA $filter=id eq 1 should match sopSamples.odataFilter fixure.", function(done){
			restClient.app.test.read("$filter=id eq 1")
				.then(function(resp){
					assert(resp.length === 1);
					done();
				})
				.catch(function(err){
					done(err);
				});
		});

		it("Read called with ODATA $select=data return on record with only the data column.", function(done){
			restClient.app.test.read("$filter=id eq 1&$select=data")
				.then(function(resp){
					assert(resp.length === 1);
					var row = resp[0];
					assert.ok(!row.id);
					assert.ok(row.data);
					done();
				})
				.catch(function(err){
					done(err);
				});
		});

	});

	describe("Testing create method", function(){

		it("`test` should have a `create` method", function(){
			assert(typeof(restClient.app.test.create) === "function");
		});

		it("Created should save test record without errors", function(done){
			//sopSamples.createTest.message_id = sopSamples.createTest.message_id +  Math.trunc(Math.random() * 100);

			restClient.app.test.create({data: "foobar: " + (new Date()).toLocaleString()})
				.then(function(resp){
					okResponse = resp;
					done();
				})
				.catch(function(err){
					done(err);
				});


		});

		it("should be able to retrieve the inserted item by id.", function(done){
			restClient.app.test.read(okResponse.id)
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
		it("`test` should have a `update` method", function(){
			assert(typeof(restClient.app.test.update) === "function");
		});

		it("Update should modify test record without errors", function(done){
			okResponse.data = "foobar: " + (new Date()).toLocaleString();
			restClient.app.test.update(okResponse)
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
			restClient.app.test.read(okResponse.id)
				.then(function(resp){
					assert.deepEqual(resp.data, okResponse.data);
					//console.log(resp);
					done();
				})
				.catch(function(err){
					done(err);
				});
		});

	});

	describe("Testing destroy method", function(){
		it("`test` should have a `destroy` method", function(){
			assert(typeof(restClient.app.test.destroy) === "function");
		});

		it("destroy should delete test record without errors", function(done){
			restClient.app.test.destroy(okResponse)
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
			restClient.app.test.read(okResponse.id)
				.then(function(resp){
					console.log(resp);
					if(resp && resp.status && resp.status !== 404) {
						done(resp);
					} else {
						done();
					}
				})
				.catch(function(err){
					if(err.status === 404) {
						done();
					} else {
						done(err);						
					}
				});
		});

	});
});
