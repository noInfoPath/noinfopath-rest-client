var restClientInit = require("./rest-client");

/*
	{
		config: {
			namespace: {},  //NoInfoPath inspired dbSchema configurations.
			rest: {}, //NoInfoPath inspired RESTAPI Endpoint Configuration.
			creds: {} //Auth0 Service Credentials. cid, cs, aud
		}
	}
*/

function _configure(cfg) {
	config = Object.assign({}, cfg);

	var restClient = restClientInit(config),
		inf = {};



	//console.log(config);

	for (var ns in config.namespaces) {
		var namespace = config.namespaces[ns],
			nsInf = inf[ns] = {};

		for (var s in namespace.schema) {

			var schema = namespace.schema[s];

			if(schema.nsPrefix === ns) {
				nsInf[s] = {
					create: restClient.create.bind(null, ns, namespace.rest, schema),
					read: restClient.read.bind(null, ns, namespace.rest, schema),
					update: restClient.update.bind(null, ns, namespace.rest, schema),
					destroy: restClient.destroy.bind(null, ns, namespace.rest, schema)
				};
			}
		}
	}

	inf.request = restClient.request.bind(null, config.rest);

	return inf;
}

module.exports = function (cfg, accessToken) {
	_accessToken = accessToken;
	return _configure(cfg);
};
