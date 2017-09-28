var assert = require("assert"),
	restClientInit = require("./rest-client"), _restClient;

/*
	{
		config: {
			namespaces: {},  //NoInfoPath inspired dbSchema configurations.
			rest: {}, //NoInfoPath inspired RESTAPI Endpoint Configuration.
			creds: {} //Auth0 Service Credentials. cid, cs, aud
		}
	}
*/


function _configure(config) {
	var	inf = {};

	_restClient = restClientInit(config);


	//console.log(config);

	for (var ns in config.namespaces) {
		var namespace = config.namespaces[ns],
			nsInf = inf[ns] = {};

		for (var s in namespace.schema) {

			var schema = namespace.schema[s];

			if(schema.nsPrefix === ns) {
				nsInf[s] = {
					create: _restClient.create.bind(null, ns, namespace.rest, schema),
					read: _restClient.read.bind(null, ns, namespace.rest, schema),
					update: _restClient.update.bind(null, ns, namespace.rest, schema),
					destroy: _restClient.destroy.bind(null, ns, namespace.rest, schema)
				};
			}
		}
	}

	inf.request = _restClient.request.bind(null, config.rest);
	inf.updateAccessToken = _restClient.updateAccessToken;

	return inf;
}

module.exports = function (obj1, obj2, str1) {
	var cfg, accessToken;

	if(typeof(obj1) === "object" && typeof(obj2) === "object" && typeof(str1) === "string") {
		cfg = {
			namespaces: obj1,
			creds: obj2
		};

		accessToken = str1;
	} else if(typeof(obj1) === "object" && typeof(obj2) === "object") {
		cfg = {
			namespaces: obj1,
			creds: obj2
		};
	} else if(typeof(obj1) === "object" && typeof(str1) === "string") {
		cfg = obj1;
		accessToken = str1
	} else if(typeof(obj1) === "object") {
		cfg = obj1
	}

	_accessToken = accessToken;
	return _configure(cfg);
};
