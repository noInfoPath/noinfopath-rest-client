module.exports = {
	odataFilter: {
		"id": 1,
		"message_from_email": "jeff@imginconline.com",
		"message_id": "15b7d636501733c9",
		"message_date": new Date("2017-04-17 23:28:32"),
		"message_body": "https://storage.googleapis.com/hsl-sop-bucket/requests/15b7d636501733c9/request.html",
		"message_subject": "Idalid Escamilla v. Taqueria La Victoria, Maria Garcia, and Carmen Berenice Munoz (5774.001)",
		"status": "new",
		"message_from_name": "Jeffrey Gochin"
	},
	odataFilterSelectExpected: {
		"id": 1,
		"message_from_email": "jeff@imginconline.com",
		"message_id": "15b7d636501733c9",
		"message_date": "2017-04-17T19:28:32.000Z",
		"message_body": "https://storage.googleapis.com/hsl-sop-bucket/requests/15b7d636501733c9/request.html",
		"message_subject": "Idalid Escamilla v. Taqueria La Victoria, Maria Garcia, and Carmen Berenice Munoz (5774.001)",
		"status": "new",
		"message_from_name": "Jeffrey Gochin"
	},
	odataFilterSelect: {
		"id": 1,
		"message_from_email": "jeff@imginconline.com"
	},
	createTest: {
		"message_from_email": "jeff@imginconline.com",
		"message_id": "test1234",
		"message_date": new Date("2017-04-17 23:28:32"),
		"message_body": "https://storage.googleapis.com/hsl-sop-bucket/requests/15b7d636501733c9/request.html",
		"message_subject": "Idalid Escamilla v. Taqueria La Victoria, Maria Garcia, and Carmen Berenice Munoz (5774.001)",
		"status": "new",
		"message_from_name": "Jeffrey Gochin"
	},
	updateTest: {
		"message_from_email": "jeff@imginconline.com",
		"message_id": "test1234",
		"message_date": new Date("2017-04-17 23:28:32"),
		"message_body": "https://storage.googleapis.com/hsl-sop-bucket/requests/15b7d636501733c9/request.html",
		"message_subject": "Idalid Escamilla v. Taqueria La Victoria, Maria Garcia, and Carmen Berenice Munoz (5774.001)",
		"status": "old",
		"message_from_name": "Jeffrey Gochin"
	},
	updateTestExpected: {
		"id": 113,
		"message_from_email": "jeff@imginconline.com",
		"message_id": "test123418",
		"message_date": "2017-04-18T03:28:32.000Z",
		"message_body": "https://storage.googleapis.com/hsl-sop-bucket/requests/15b7d636501733c9/request.html",
		"message_subject": "Idalid Escamilla v. Taqueria La Victoria, Maria Garcia, and Carmen Berenice Munoz (5774.001)",
		"status": "old",
		"message_from_name": "Jeffrey Gochin"
	}
};
