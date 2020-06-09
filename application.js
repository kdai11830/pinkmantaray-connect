// includes
var path = require('path')
var express = require('express');
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var url = require('url');
var qs = require('qs');
var util = require('util');
var http = require('http');

// declare application and connect to db
var app = new express();
const port = 3000;

// var server = http.createServer(app);
var server = app.listen(port, function() {
	console.log(new Date().toISOString() + ": server started on port " + port)
})
var io = require('socket.io').listen(server);

// server.listen(port);


const saltRounds = 10;

app.set('view engine', 'ejs'); 

// establish mysql connection and promisify
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'Jkmrhi11830!',
	database : 'pinkmantaray_connect',
	multipleStatements: 'true'
});

/*var pool = mysql.createPool({
	connectionLimit : 10,
	host     : 'localhost',
	user     : 'root',
	password : 'Jkmrhi11830!',
	database : 'pinkmantaray_connect',
})*/

// const query = util.promisify(connection.query).bind(connection);

// set session
var sess = {
	secret: ['2HtUJd4731oZrpg', 'eaOJ6zlsWwUPP78', 'vbMBElHHGhkM0NF'],
	/*genid: function(req) {
		return genuuid() //use UUIDs for session IDs
	},*/
	name: 'session-name',
	resave: true,
	saveUninitialized: true
};

var sessionMiddleware = session(sess);

io.use(function(socket, next) {
	sessionMiddleware(socket.request, socket.request.res || {}, next);
})

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}

app.use(sessionMiddleware);
app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.use(express.static(__dirname));


/*****************************************************************************
******************************************************************************
*****************************************************************************/


/** LOGIN AUTHENTICATION MIDDLEWARE **/
function restrict(req, res, next) {
	if (req.session.loggedin) {
		next();
	} else {
		res.redirect('/welcome');
	}
}


/** HOME PAGE **/
app.get('/', restrict, function(req, res) {

	// double sql query
	var sql = `SELECT id, name, pronouns, email, instagram FROM user_info 
		RIGHT JOIN connections ON connections.connection_id = user_info.id 
		WHERE connections.user_id = ? AND connections.pending = 0; `

	connection.query(sql, req.session.user_id, function(err, results, fields) {
		if (err) {
			console.log(err);
			res.redirect('/login');
			return;
		}
		console.log(req.session.user_id);
		console.log(results);
		res.render('index', {"results": results});
		return;
	});

});


/** WELCOME PAGE **/
app.get('/welcome', function(req, res) {
	req.session.destroy();
	res.render('welcome');
})

/** LOGIN PAGE **/
app.get('/login', function(req, res) {
	// clear current session
	req.session.destroy();
	res.render('login/index');
});


/** SIGN UP PAGE **/
app.get('/signup', function(req, res) {
	res.render('signup/index');
});

/** CONNECT PAGE **/
app.get('/connect', restrict, function(req, res) {
	var sql = `SELECT MIN(year) AS youngest 
		FROM user_info; 
		SELECT MAX(year) AS oldest 
		FROM user_info;`
	connection.query(sql, function(error, results, fields) {
		if (error) throw error;
		console.log(results);
		res.render('connect/index', {"results": results});
		return;
	})
	
});


/** LOGOUT FUNCTIONALITY **/
app.get('/logout', function(req, res) {
	req.session.destroy();
	res.redirect('/welcome');
})


/** LOGIN AUTHENTICATION **/
app.post('/auth', function(req, res) {
	var username = req.body.uname;
	var enteredPassword = req.body.pwd;
	console.log(enteredPassword);

	// user filled out both fields
	if (username && enteredPassword) {
		connection.query('SELECT * FROM user_info WHERE username = ?', username, function(error, results, fields) {
			console.log(results);
			if (results.length > 0) {

				// user exists, should only be one
				var hash = results[0].password;
				// console.log(results);

				req.session.user_id = results[0].id;
				console.log(results[0].id);
				console.log(req.session.user_id);

				// compare passwords
				bcrypt.compare(enteredPassword, hash).then((result) => {
					console.log(result);
					if (result) {

						// redirect if correct information entered
						console.log("SUCCESS");
						// req.session.id = results[0].id;

						req.session.loggedin = true;
						req.session.username = username;
						res.redirect('/');
						return;
					} else {

						// bad password
						console.log("FAILED");
						res.send('Incorrect username and/or password!');
						// res.redirect('/login');
						return;
					}
				}).catch((err)=>console.error(err));

			} else {
				// bad username
				res.send('Incorrect username and/or password!');
				return;
			}			
			// res.end();
		});
	} else {
		res.send('Please enter username and password!');
		res.redirect('/login');
		return;
	}
});


/** NEW USER INFORMATION SUBMISSION AUTHENTICATION **/
app.post('/new-user-auth', function(req, res) {
	// gather data from form
	// required data

	req.session.username = req.body.username;
	var enteredPassword = req.body.pwd;
	var confirmPassword = req.body.confirm;

	// background information
	var name = req.body.entry_name;
	var pronouns = req.body.entry_pronouns;
	var language = req.body.entry_language; // THIS WILL BE CHECKBOXES MOST LIKELY
	var email = req.body.entry_email;
	var year = req.body.entry_year;
	var instagram = req.body.entry_instagram;
	var country = req.body.entry_country;
	var state = req.body.entry_state;

	// optional data
	var gender = [];
	if (req.body.entry_gender) {
		gender = req.body.entry_gender;
	}	
	var sexuality = [];
	if (req.body.entry_sexuality) {
		sexuality = req.body.entry_sexuality;
	}
	var race_ethnicity = [];
	if (req.body.entry_race) {
		race_ethnicity = req.body.entry_race;
	}
	var religion = [];
	if (req.body.entry_religion) {
		religion = req.body.entry_religion;
	}
	var interests = [];
	if (req.body.entry_interests) {
		interests = req.body.entry_interests;
	}

	// insert information into database
	var sql = `INSERT INTO user_info 
		(
			username, password, name, pronouns, email, year, instagram, country, state, language
		)
		VALUES
		(
			?, ?, ?, ?, ?, ?, ?, ?, ?, ?
		)`;
	// perform first sql insertion into user_info
	// THIS WORKS BUT TRY TO GET ASYNC TO WORK IF POSSIBLE
	// TO PREVENT CALLBACK HELL
	// hash password
	bcrypt.genSalt(saltRounds, function(err, salt) {
		if (err) {
			throw err;
		} else {
			bcrypt.hash(enteredPassword, salt, function(err, hash) {
				if (err) {
					throw err;

				} else {
					var insertVals = [req.session.username, hash, name, pronouns, email, year, instagram, country, state, language];
					console.log(insertVals);

					connection.query(sql, insertVals, function(err, result, fields) {
						if (err) {
							console.log(err);
							req.session.destroy();
							res.redirect('/signup');
							return;

						} else {
							req.session.loggedin = true;
							console.log('inserted ID: ' + result.insertId);

							//result should be last inserted id
							// begin nested query
							var nestedSql = '';
							var nestedAdd = [];
							req.session.user_id = result.insertId;
							var sID = result.insertId.toString();

							// ADD LANGUAGE THING HERE ONCE IM NOT TOO LAZY TO MAKE THEM CHECKBOXES
							if (gender.length > 0) {
								nestedSql += 'INSERT INTO user_gender (user_id, gender) VALUES ';
								for (var i = 0; i < gender.length - 1; i++) {
									nestedSql += '(?, ?), ';
									nestedAdd.push(sID);
									nestedAdd.push(gender[i]);
								}
								nestedSql += '(?, ?); '
								nestedAdd.push(sID);
								nestedAdd.push(gender[gender.length - 1]);
							}
							if (sexuality.length > 0) {
								nestedSql += 'INSERT INTO user_sexuality (user_id, sexuality) VALUES ';
								for (var i = 0; i < sexuality.length - 1; i++) {
									nestedSql += '(?, ?), ';
									nestedAdd.push(sID);
									nestedAdd.push(sexuality[i]);
								}
								nestedSql += '(?, ?); '
								nestedAdd.push(sID);
								nestedAdd.push(sexuality[sexuality.length - 1]);
							}
							if (race_ethnicity.length > 0) {
								nestedSql += 'INSERT INTO user_race_ethnicity (user_id, race_ethnicity) VALUES ';
								for (var i = 0; i < race_ethnicity.length - 1; i++) {
									nestedSql += '(?, ?), ';
									nestedAdd.push(sID);
									nestedAdd.push(race_ethnicity[i]);
								}
								nestedSql += '(?, ?); '
								nestedAdd.push(sID);
								nestedAdd.push(race_ethnicity[race_ethnicity.length - 1]);
							}
							if (religion.length > 0) {
								nestedSql += 'INSERT INTO user_religion (user_id, religion) VALUES ';
								for (var i = 0; i < religion.length - 1; i++) {
									nestedSql += '(?, ?), ';
									nestedAdd.push(sID);
									nestedAdd.push(religion[i]);
								}
								nestedSql += '(?, ?); '
								nestedAdd.push(sID);
								nestedAdd.push(religion[religion.length - 1]);
							}
							if (interests.length > 0) {
								nestedSql += `INSERT INTO user_interests (user_id, interest) VALUES `;
								for (var i = 0; i < interests.length - 1; i++) {
									nestedSql += '(?, ?), ';
									nestedAdd.push(sID);
									nestedAdd.push(interests[i]);
								}
								nestedSql += '(?, ?);'
								nestedAdd.push(sID);
								nestedAdd.push(interests[interests.length - 1]);
							}

							connection.query(nestedSql, nestedAdd, function(err, nestResult, fields) {
								if (err) {
									console.log(err);
								} else {
									// console.log(nestResult);
									res.redirect('/');
									return
								}
							});
						}
						
					});
				}
			});
		}
	});
});


/** SOCKET.IO LISTEN AND EMIT FUNCTIONS **/
io.sockets.on('connection', function(socket) {
	console.log('socket connected...');

	socket.on('search', function(vals) {
		console.log(vals);

		// create initial query to find user ID
		var sql = `SELECT info.id FROM user_info info
			LEFT JOIN user_gender gender ON
			gender.user_id = info.id
			LEFT JOIN user_sexuality sexuality ON
			sexuality.user_id = info.id
			LEFT JOIN user_race_ethnicity race ON
			race.user_id = info.id
			LEFT JOIN user_religion religion ON
			religion.user_id = info.id
			LEFT JOIN user_interests interests ON
			interests.user_id = info.id 
			LEFT JOIN connections conn ON
			conn.user_id = info.id WHERE 
			(info.id != ?) AND (conn.connection_id != ?) AND `;

		var insertVals = [socket.request.session.user_id, socket.request.session.user_id];
		if (vals["location"] != '') {
			sql += '(info.country = ?) OR ';
			insertVals.push(vals["location"]);
		}
		if (vals["ageRange"][0] != null && vals["ageRange"][1] != null) {
			sql += '(info.year BETWEEN ? AND ?) OR ';
			insertVals.push(vals["ageRange"][0]);
			insertVals.push(vals["ageRange"][1]);
		}
		if (vals["gender"].length > 0) {
			sql += '(gender.gender IN (';
			for (var i = 0; i < vals["gender"].length; i++) {
				sql += '?,';
				insertVals.push(vals["gender"][i]);
			}
			sql = sql.substring(0, sql.length-1);
			sql += ')) OR ';
		}
		if (vals["sexuality"].length > 0) {
			sql += '(sexuality.sexuality IN (';
			for (var i = 0; i < vals["sexuality"].length; i++) {
				sql += '?,';
				insertVals.push(vals["sexuality"][i]);
			}
			sql = sql.substring(0, sql.length-1);
			sql += ')) OR ';
		}
		if (vals["race"].length > 0) {
			sql += '(race.race_ethnicity IN (';
			for (var i = 0; i < vals["race"].length; i++) {
				sql += '?,';
				insertVals.push(vals["race"][i]);
			}
			sql = sql.substring(0, sql.length-1);
			sql += ')) OR ';
		}
		if (vals["religion"].length > 0) {
			sql += '(religion.religion IN (';
			for (var i = 0; i < vals["religion"].length; i++) {
				sql += '?,';
				insertVals.push(vals["religion"][i]);
			}
			sql = sql.substring(0, sql.length-1);
			sql += ')) OR ';
		}
		if (vals["interests"].length > 0) {
			sql += '(interests.interest IN (';
			for (var i = 0; i < vals["interests"].length; i++) {
				sql += '?,';
				insertVals.push(vals["interests"][i]);
			}
			sql = sql.substring(0, sql.length-1);
			sql += ')) OR ';
		}

		// remove tailing OR
		if (insertVals.length > 0) {
			sql = sql.substring(0, sql.length - 3);
		// remove tailing AND
		} else {
			sql = sql.substring(0, sql.length - 4);
		}
		sql += 'GROUP BY info.id;';

		console.log(sql);
		console.log(insertVals);

		// query database
		connection.query(sql, insertVals, function(error, results, fields) {
			if (error) throw error;

			console.log(results);

			if (results.length > 0) {

				var ids = results[0]; // TEST TO SEE IF THIS IS RIGHT
				var insertIds = '(';

				for (var i = 0; i < ids.length; i++) {
					insertIds += ids[i] + ',';
				}
				insertIds = insertIds.substring(0, insertIds.length - 1);
				insertIds += '); ';
				
				// info sql
				var sqlTemp = `SELECT id, name, pronouns, country, year FROM user_info
					WHERE user_info.id IN `;
				sqlTemp += insertIds;

				// gender sql
				sqlTemp += `SELECT user_id gender FROM user_gender
					WHERE user_id IN `;
				sqlTemp += insertIds;

				// sexuality sql
				sqlTemp += `SELECT user_id, sexuality FROM user_sexuality
					WHERE user_id IN `;
				sqlTemp += insertIds;

				// race sql
				sqlTemp += `SELECT user_id, race_ethnicity FROM user_race_ethnicity
					WHERE user_id IN `;
				sqlTemp += insertIds;

				// religion sql
				sqlTemp += `SELECT user_id, religion FROM user_religion
					WHERE user_id IN `;
				sqlTemp += insertIds;

				// interests sql
				sqlTemp += `SELECT user_id, interest FROM user_interests
					WHERE user_id IN `;
				sqlTemp += insertIds;

				// pass on results to inner query
				connection.query(sqlTemp, function(error, results, fields) {
					console.log(results);
					// TODO: PREPROCESS THIS INFO A BIT TO MAKE IT EASIER TO READ INTO EJS
					/* structure of results:
						0: name, pronouns, country, year
						1: gender
						2: sexuality
						3: race_ethnicity
						4: religion
						5: interest
					*/
					// goal: organize by id, nested array
					var orgVals = [];
					for (var i = 0; i < results[0]; i++) {
						var tempVals = [
							results[0][i].id, 
							results[0][i].name, 
							results[0][i].pronouns,
							results[0][i].country,
							results[0][i].year
						];

						// gender
						var genderStr = [];
						for (var j = 0; j < results[1].length; j++) {
							if (results[1][j].user_id === results[0][j]) {
								genderStr.push(results[1][j].gender);
							}
						}
						tempVals.push(genderStr);

						// sexuality
						var sexualityStr = [];
						for (var j = 0; j < results[2].length; j++) {
							if (results[2][j].user_id === results[0][i]) {
								genderStr.push(results[2][j].sexuality);
							}
						}
						tempVals.push(sexualityStr);

						// race_ethnicity
						var race_ethnicityStr = [];
						for (var j = 0; j < results[3].length; j++) {
							if (results[3][j].user_id === results[0][j]) {
								race_ethnicityStr.push(results[3][j].race_ethnicity);
							}
						}
						tempVals.push(race_ethnicityStr);

						// religion
						var religionStr = [];
						for (var j = 0; j < results[4].length; j++) {
							if (results[4][j].user_id === results[0][j]) {
								religionStr.push(results[4][j].religion);
							}
						}
						tempVals.push(religionStr);

						// interests
						var interestsStr = [];
						for (var j = 0; j < results[5].length; j++) {
							if (results[5][j].user_id === results[0][j]) {
								interestsStr.push(results[5][j].interest);
							}
						}
						tempVals.push(interestsStr);

						// add profile array to organized values
						orgVals.push(tempVals);
					}

					socket.emit('searchResults', {"data": orgVals});

				});
			} else {
				socket.emit('searchResults', {"data": []});
			}
		});
	});
});