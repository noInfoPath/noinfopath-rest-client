var	moment = require("moment"),
	jwt = require('jsonwebtoken'),
	base64url = require("base64url"),
	http = require('http'),
	https = require('https'),
	querystring = require('querystring'),
	config
//colors = require('colors/safe')
;

function _generateJWT() {
	// sign with default (HMAC SHA256)
	var now = moment(),
		token = jwt.sign({
			"nameid": "1234",
			"unique_name": "foo",
			"iss": "hsl-sop",
			"aud": config.auth0.audience,
			"exp": now.add(14, "d").valueOf()
		}, base64url.decode(config.auth0.secret));
	return token;
}

function _resolveUrl(nsName, rest, entity, data, method, odata){
	var	pk = data && typeof(data) === "object" ? data[entity.primaryKey] : data,
		url;

	if(entity.endpoint) {
		url = entity.endpoint.uri;
	} else {
		if(rest.apiPrefix) {
			url = rest.apiPrefix;
		} else {
			url = nsName ? "/" + nsName + "/" : "/";
		}
	}

	if(rest.type === "MS-ODATA2") {
		switch(method) {
			case "PUT":
			case "PATCH":
			case "DELETE":
				url +=  entity.entityName + "(guid'" + pk + "')";
				break;
			default:
				url +=  entity.entityName + (odata || "");
		}
	} else{
		if(odata) {
			if(Number.isNaN(Number(odata)) && odata.indexOf("$") === 0) {
				url +=  entity.entityName +  "?" + odata;
			} else {
				url +=  entity.entityName + "/" + odata;
			}
		} else {
			if(["PUT", "PATCH", "DELETE"].indexOf(method) > -1) {
				url += entity.entityName + "/" + pk;
			} else {
				url += entity.entityName;
			}
		}
	}

	//console.log("XXXX", odata, url);
	return url.replace(/ /gi, "+");
}

function _resolveContentTransferMethod(headers, data) {
	if(data) {
		var l = Buffer.byteLength(data);

		if(l > 4000) {
			headers['Transfer-Encoding'] = 'chunked';
		} else {
			headers['Content-Length'] = l;
		}
	}

}

function _request(nsName, rest, entity, data, odata, method) {
	return new Promise(function (resolve, reject) {
		var url = _resolveUrl(nsName, rest, entity, data, method, odata),
			options = {
				host: rest.host,
				port: rest.port,
				method: method,
				path: url,
				headers: {
					"Content-Type": "application/json",
					"Authorization": "Bearer " + _generateJWT()
				}
			},
			resp = "",
			req,
			payload = JSON.stringify(data),
			server = options.port === 443 ? https : http;

		_resolveContentTransferMethod(options.headers, payload);

		req = server.request(options, function (res) {
			res.on('data', function (chunk) {
				resp = resp + chunk;
			});

			res.on('end', function () {
				switch (res.statusCode) {
				case 400:
				case 500:
					reject({
						status: res.statusCode,
						message: res.statusMessage
					});
					break;
				case 401:
					reject({
						status: res.statusCode,
						message: res.statusMessage
					});
					//reject(401);
					break;
				default:

					if (resp.indexOf("<") === 0) {
						reject(resp); //Received unexpected HTML response
					} else {
						resolve(!!resp ? JSON.parse(resp) : []);

					}
					break;
				}

			});

			res.on("error", function (err) {
				console.error(arguments);
				reject(err);
			});
		});


		req.on('error', function (err) {
			//console.error("HTTP Request Error", namespace.name, err);
			reject(err);
		});

		if (payload) {
			req.write(payload);
		}

		req.end();

	});
}

function _scrubData(data){
	for(var p in data) {
		if(!!data[p].toJSON) {
			data[p] = data[p].toJSON().replace(/T/gi, " ").replace(/Z/, "");
		}
	}

	return data;
}

function _create(nsName, rest, entity, data) {
	return _request(nsName, rest, entity, _scrubData(data), null, "POST");
}

function _read(nsName, rest, entity, odata) {
	return _request(nsName, rest, entity, null, odata, "GET");
}

function _update(nsName, rest, entity, data) {
	return _request(nsName, rest, entity, _scrubData(data), null, "PUT");
}

function _destroy(nsName, rest, entity, data) {
	return _request(nsName, rest, entity, data, null, "DELETE");
}

/*
	{
		sop: {
			requests: {
				create: ...
				read: ...
				update: ...
				destroy: ...
			}
		}
	}
*/

function _configure(cfg) {
	var inf = {}
		;

	config = cfg;

	for(var ns in config.namespaces) {
		var namespace = config.namespaces[ns],
			nsInf = inf[ns] = {};

		for(var s in namespace.schema) {
			var schema =  namespace.schema[s],
				schemaInf = nsInf[s] = {
					create: _create.bind(null, ns, namespace.rest, schema),
					read: _read.bind(null, ns, namespace.rest, schema),
					update: _update.bind(null, ns, namespace.rest, schema),
					destroy: _destroy.bind(null, ns, namespace.rest, schema)
				};
		}
	}

	return inf;
}

module.exports = function(cfg){
	return _configure(cfg);
};
