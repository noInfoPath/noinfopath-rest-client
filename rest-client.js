var moment = require("moment"),
	jwt = require('jsonwebtoken'),
	base64url = require("base64url"),
	request = require("request"),
	// http = require('http'),
	// https = require('https'),
	querystring = require('querystring'),
	config, _accessToken
//colors = require('colors/safe')
;

function _generateJWT(creds) {
	return new Promise(function (resolve, reject) {
		var request = require("request");

		var options = {
			method: 'POST',
			url: 'https://hsl-sop.auth0.com/oauth/token',
			headers: {
				'content-type': 'application/json'
			},
			body: {
				grant_type: 'client_credentials',
				client_id: creds.cid,
				client_secret: creds.cs,
				audience: creds.aud
			},
			json: true
		};

		request(options, function (error, response, body) {
			if (error) reject(new Error(error));
			_accessToken = body;
			resolve(_accessToken);
		});

	});
}

function _resolveUrl(nsName, rest, entity, data, method, odata) {
	var pk = data && typeof (data) === "object" ? data[entity.primaryKey] : data,
		url, protocol, urlPre;

	switch(Number(rest.port)) {
		case 80:
		case 8080:
			protocol = "http://";
			break;
		case 443:
		case 8443:
			protocol = "https://";
			break;

		default:
			protocol = "http://";
			break;
	}

	urlPre = protocol + rest.host + ":" + rest.port;

	if (entity.uri) {
		url = entity.uri;
	} else {
		if (rest.apiPrefix) {
			url = rest.apiPrefix + entity.entityName;
		} else {
			url = nsName ? "/" + nsName + "/" : "/";
		}
	}

	if (rest.type === "MS-ODATA2") {
		switch (method) {
		case "PUT":
		case "PATCH":
		case "DELETE":
			url += entity.entityName + "(guid'" + pk + "')";
			break;
		default:
			url += entity.entityName + (odata || "");
		}
	} else {
		if (odata) {
			if (Number.isNaN(Number(odata)) && odata.indexOf("$") === 0) {
				url += "?" + odata;
			} else {
				url += "/" + odata;
			}
		} else {
			if (["PUT", "PATCH", "DELETE"].indexOf(method) > -1) {
				url += "/" + pk;
			}
		}
	}

	//console.log("XXXX", odata, url);
	return urlPre + url.replace(/ /gi, "+");
}

function _resolveContentTransferMethod(headers, data) {
	if (data) {
		var l = Buffer.byteLength(data);

		if (l > 4000) {
			headers['Transfer-Encoding'] = 'chunked';
		} else {
			headers['Content-Length'] = l;
		}
	}

}

function _request(nsName, rest, entity, data, odata, method) {
	return new Promise(function (resolve, reject) {
		//console.log(process.env.NOINFOPATHDEBUG);
		function _doRequest() {
			var url = _resolveUrl(nsName, rest, entity, data, method, odata),
				options = {
					followAllRedirects: true,
					rejectUnauthorized: !!!process.env.NOINFOPATHDEBUG,
					url: url,
					host: rest.host,
					port: rest.port,
					method: method,
					headers: {
						"Content-Type": "application/json",
						"Authorization": "Bearer " + _accessToken.access_token
					}
				},
				resp = "",
				req,
				payload = data ? JSON.stringify(data) : undefined;
				//server = [443, 8443].indexOf(options.port) > -1 ? https : http;

			if(payload) {
				_resolveContentTransferMethod(options.headers, payload);
				options.json = true;
				options.body = JSON.parse(payload);
			}

			req = request(options, function (err, res, body) {
				if(err) {
					reject(err);
				} else {
				//console.error("XXXX", res.statusCode);
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
							break;
						default:
							if(body) {
								if(typeof(body) === "object") {
									resolve(body);
								} else {
									if (body.indexOf("<") === 0) {
										reject(body); //Received unexpected HTML response
									} else {
										var tmp;

										try {
											tmp = !!body ? JSON.parse(body) : [];
											resolve(tmp);
										} catch(err) {
											reject(body);
										}
									}
								}
							} else{
								reject({
									status: res.statusCode,
									message: "Unknown condition."
								});
							}

							break;
					}

				}
			});

		}

		if(_accessToken) {
			_doRequest();
		} else {
			_generateJWT(config.creds)
				.then(_doRequest)
				.catch(reject);
		}



	});
}

function _scrubData(data) {
	for (var p in data) {
		if (!!data && !!data[p] && !!data[p].toJSON) {
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
	var inf = {};

	config = Object.assign({}, config, cfg);

	for (var ns in config.namespaces) {
		var namespace = config.namespaces[ns],
			nsInf = inf[ns] = {};

		for (var s in namespace.schema) {
			var schema = namespace.schema[s],
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

module.exports = function (cfg, accessToken) {
	_accessToken = accessToken;
	return _configure(cfg);
};
