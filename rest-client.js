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

function _resolveUri(entity, method, odata) {
	if(entity.uri){
		if(typeof(entity.uri) === "string") {
			return Object.assign({}, entity);
		} else {
			var found = false,
				ro;

			entity.uri.forEach(function(uri){
				if(!found && uri.method === method) {
					if(odata) {
						var temp = uri.uri.split("/"),
							score = Object.keys(odata).length,
							match = true;

						for(var i = 0; i < temp.length; i++){
							var t = temp[i];
							if(t.substring(0,1) === ":"){
								if(odata[t.substring(1)]){
									score--;
								} else {
									match = false;
									break;
								}
							}
						}

						if(match && score === 0){
							ro = Object.assign({}, entity);
							ro.uri = uri.uri;
							found = true;
						}
					} else {
						ro = Object.assign({}, entity);
						ro.uri = uri.uri;
						found = true;
					}
				}
			});

			if(ro){
				return ro;
			} else {
				throw "No valid uri found. Check parameters and try again.";
			}
		}
	} else {
		return Object.assign({}, entity);
	}
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
			url += "(guid'" + pk + "')";
			break;
		default:
			url += (odata || "");
		}
	} else {
		if (odata) {
			if(typeof(odata) === "object"){
				for(var prop in odata){
					url = url.replace(":" + prop, odata[prop]);
				}
			} else {
				if (Number.isNaN(Number(odata)) && odata.indexOf("$") === 0) {
					url += "?" + odata;
				} else {
					url += "/" + odata;
				}
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

		// we took out the Transfer Encoding chunked because it was causing socket hangups
		// and we could not understand why
		// if (l > 4000) {
		// 	headers['Transfer-Encoding'] = 'chunked';
		// } else {
			headers['Content-Length'] = l;
		// }
	}

}

function _request(nsName, rest, entity, data, odata, method, jwt) {
	return new Promise(function (resolve, reject) {
		//console.log("NOINFOPATHDEBUG", process.env.NOINFOPATHDEBUG);
		function _doRequest() {
			var uri = _resolveUri(entity, method, odata),
				url = _resolveUrl(nsName, rest, uri, data, method, odata),
				options = {
					followAllRedirects: true,
					rejectUnauthorized: process.env.NOINFOPATHDEBUG !== "1",
					url: url,
					host: rest.host,
					port: rest.port,
					method: method,
					headers: {
						"Content-Type": "application/json",
						"Authorization": "Bearer " + (jwt || _accessToken.access_token)
					}
				},
				resp = "",
				req,
				payload;
				//server = [443, 8443].indexOf(options.port) > -1 ? https : http;

			if(data){
				if(method === "POST") data.CreatedBy = _accessToken.user_id;

				data.ModifiedBy = _accessToken.user_id;

				payload = JSON.stringify(data);
			}

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
			_generateJWT(process.hsl.appConfig.rest)
				.then(_doRequest)
				.catch(reject);
		}



	});
}

function _requestRaw(rest, url, payload, method, jwt) {
	return new Promise(function (resolve, reject) {
		function _doRequest() {
			var
				options = {
					followAllRedirects: true,
					rejectUnauthorized: !!!process.env.NOINFOPATHDEBUG,
					url: url,
					host: rest.host,
					port: rest.port,
					method: method,
					headers: {
						"Content-Type": "application/json",
						"Authorization": "Bearer " + (jwt || _accessToken.access_token)
					}
				};

			request(options, function (err, res, body) {
				if (err) {
					reject(err);
				} else {
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
							if (body) {
								if (typeof (body) === "object") {
									resolve(body);
								} else {
									if (body.indexOf("<") === 0) {
										reject(body); //Received unexpected HTML response
									} else {
										var tmp;

										try {
											tmp = !!body ? JSON.parse(body) : [];
											resolve(tmp);
										} catch (err) {
											reject(body);
										}
									}
								}
							} else {
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

		if (_accessToken) {
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

function _create(nsName, rest, entity, data, jwt) {

	return _request(nsName, rest, entity, _scrubData(data), null, "POST", jwt);
}

function _read(nsName, rest, entity, odata, jwt) {
	return _request(nsName, rest, entity, null, odata, "GET", jwt);
}

function _update(nsName, rest, entity, data, odata, jwt) {
	return _request(nsName, rest, entity, _scrubData(data), odata, "PUT", jwt);
}

function _destroy(nsName, rest, entity, data, jwt) {
	return _request(nsName, rest, entity, data, null, "DELETE", jwt);
}

function _updateAccessToken(newToken) {
	if(typeof(newToken) === "string") {
		_accessToken = {access_token: newToken};
	} else {
		_accessToken = newToken;
	}
}

module.exports = function(cfg, token) {
	config = cfg;
	_accessToken = token;

	return {
		create: _create,
		read: _read,
		update: _update,
		destroy: _destroy,
		request: _requestRaw,
		requestEntity: _request,
		updateAccessToken: _updateAccessToken
	};

};




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
