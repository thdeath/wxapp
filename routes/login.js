const express = require('express');
const router = express.Router();
const https = require('https');
const queryString = require('querystring');
const bodyParser = require('body-parser');
const DB = require('../dao/db');
const Model = require('../dao/model');
const DB_CONNECTION = DB.connection;
const mongoose = DB.mongoose;
const UserModel = Model.UserModel;

const APPID = 'wx3e1d175a787899bd';
const SECRET = '65c96753bb7b0bf6499c2df882b2c55a';
const HOST = 'api.weixin.qq.com';
const PATH = '/sns/jscode2session?';


const DATA = {
		appid : APPID,
		secret : SECRET,
		js_code : '',
		grant_type : 'authorization_code',
};
const OPTION = {
		host : HOST,
		path : '',
		method : 'GET',
};
const sessions = {};

router.use(bodyParser.json());
router.all('*',(req, res, next) => {
	//console.log(req);
	let sessionId = req.headers.sessionid;
	if(sessionId){
		console.log(sessions[sessionId]);
		next();
	}else{
		console.log('no sessionid');
		
		let code = req.query.code;
		console.log(code );
		let otherRes = res;
		DATA.js_code = code;
		OPTION.path = PATH + queryString.stringify(DATA);
		let wxReq = https.request(OPTION, (res) => {
			if(res.statusCode == 200){
				let json = '';
				res.on('data' , (data) => {
					json+=data;
				});
				res.on('end' , () => {
					console.log(json);
					json =JSON.parse(json);
					let openId = json.openid;
					sessions[openId] = openId;
					console.log(openId);
					otherRes.type('application/json');
					otherRes.json({
						data : {'sessionId' : openId},
					});
					
					otherRes.status(200);
					
				});

			}
		});
		wxReq.end();
		//res.status(200);
		//res.type('application/json');
		
	}
})
.get('/login',(req, res, next) => {			
let code = req.query.code;
	DATA.js_code = code;
	OPTION.path = PATH + queryString.stringify(DATA);
	let wxReq = https.request(OPTION, (res) => {
	// console.log('request wxopenid');
	if(res.statusCode == 200){
		console.log(Object.keys(res));
		// console.log(res.bady);
		let json = '';

		res.on('data',(data) => {
			json+=data;
		});

		res.on('end',() => {
			json = JSON.parse(json);
			console.log(json);

			//user集合模式
			// let userSchema = new mongoose.Schema({
			// 	openId : {type: String},
			// });
			// let UserModel = mongoose.model('user',userSchema);

			UserModel.find({openId:json.openid}, (err,results) => {
				if(results.length == 0){
					  let user = new UserModel();
					  user.openId = json.openid;
					  user.save((err) => {
					  	console.log('save an user success!');
					  });
				}
			});

			// let sessionSchema = new mongoose.Schema({
			// 	sessionId : {type:String},
			// 	time: {type: Date , default: Date.now}
			// 	validTime : {type: Number, default: 7200}
			// }); 
			// let SessionModel = mongoose.model('session',sessionSchema);
			// SessionModel.find((err, sessions) => {
			// 	console.log(sessions);
			// });			
			// let instance = new SessionModel();
			// instance.sessionId = json.openid + json.session_key;
			// instance.save((err) => {
			// 	console.log(err);
			// });
		});
	}
	});
	wxReq.end();
	console.log(queryString.stringify(DATA));
	//wxReq.write(queryString.stringify(data));
	res.status(200).send('ok');
	next();
})


.post('publish', (req, res, next) => {
	
});


module.exports = router;