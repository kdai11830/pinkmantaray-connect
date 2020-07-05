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

var server = app.listen(port, function() {
	console.log(new Date().toISOString() + ": server started on port " + port)
})
var io = require('socket.io').listen(server);


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
});

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
app.use(express.static(__dirname + "/stylesheets"));


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

/** ADMIN AUTHENTICATION MIDDLEWARE **/
function adminRestrict(req, res, next) {
	if (req.session.loggedin && req.session.username == 'kdai') {
		next();
	} else {
		// TODO: idk maybe like just don't do anything or reload page?
	}
}

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


/** HOME PAGE **/
app.get('/', restrict, function(req, res) {

	// double sql query
	var sql = `SELECT user_info.id, name, pronouns, email, instagram FROM user_info 
		RIGHT JOIN connections ON connections.connection_id = user_info.id 
		WHERE connections.user_id = ? AND connections.pending = 0 AND user_info.reported != 1; `

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
	});
});


/** NOTIFICATIONS PAGE **/
app.get('/notifications', restrict, function(req, res) {
	var sql = `SELECT info.id, info.pronouns, info.country, info.year,
		gender.gender, sexuality.sexuality, race.race_ethnicity, religion.religion, interests.interest
		FROM user_info info
		LEFT JOIN user_gender gender ON gender.user_id = info.id
		LEFT JOIN user_sexuality sexuality ON sexuality.user_id = info.id
		LEFT JOIN user_race_ethnicity race ON race.user_id = info.id
		LEFT JOIN user_religion religion ON religion.user_id = info.id
		LEFT JOIN user_interests interests ON interests.user_id = info.id
		LEFT JOIN connections conn ON conn.user_id = info.id
		WHERE (conn.connection_id = ?) AND (conn.pending = 1) AND (info.reported != 1);
		SELECT info.id, info.pronouns, info.country, info.year,
		gender.gender, sexuality.sexuality, race.race_ethnicity, religion.religion, interests.interest
		FROM user_info info
		LEFT JOIN user_gender gender ON gender.user_id = info.id
		LEFT JOIN user_sexuality sexuality ON sexuality.user_id = info.id
		LEFT JOIN user_race_ethnicity race ON race.user_id = info.id
		LEFT JOIN user_religion religion ON religion.user_id = info.id
		LEFT JOIN user_interests interests ON interests.user_id = info.id
		LEFT JOIN connections conn ON conn.user_id = info.id
		WHERE (info.id IN 
		(SELECT conn.connection_id FROM connections conn WHERE conn.user_id = ?)) 
		AND (conn.pending = 1) AND (info.reported != 1);`;

	var insertIds = [req.session.user_id, req.session.user_id];
	connection.query(sql, insertIds, function(error, results, fields) {
		if (error) throw error;
		console.log(results);

		// preprocess results to group info together, list of dict of dicts
		var send = [];
		for (var i = 0; i < results.length; i++) {
			var infoVals = {};
			for (var j = 0; j < results[i].length; j++) {
				var curId = results[i][j].id;
				// if user already exists in dict
				if (!(curId in infoVals)) {
					infoVals[curId] = {};
					infoVals[curId]["id"] = results[i][j].id;
					infoVals[curId]["pronouns"] = results[i][j].pronouns;
					infoVals[curId]["country"] = results[i][j].country;
					infoVals[curId]["year"] = results[i][j].year;
					infoVals[curId]["gender"] = [results[i][j].gender];
					infoVals[curId]["sexuality"] = [results[i][j].sexuality];
					infoVals[curId]["race_ethnicity"] = [results[i][j].race_ethnicity];
					infoVals[curId]["religion"] = [results[i][j].religion];
					infoVals[curId]["interest"] = [results[i][j].interest];
				// else add to existing entry
				} else {
					if (!(infoVals[curId]["gender"].includes(results[i][j].gender)))
						infoVals[curId]["gender"].push(results[i][j].gender);
					if (!(infoVals[curId]["sexuality"].includes(results[i][j].sexuality)))
						infoVals[curId]["sexuality"].push(results[i][j].sexuality);
					if (!(infoVals[curId]["race_ethnicity"].includes(results[i][j].race_ethnicity)))
						infoVals[curId]["race_ethnicity"].push(results[i][j].race_ethnicity);
					if (!(infoVals[curId]["religion"].includes(results[i][j].religion)))
						infoVals[curId]["religion"].push(results[i][j].religion);
					if (!(infoVals[curId]["interest"].includes(results[i][j].interest)))
						infoVals[curId]["interest"].push(results[i][j].interest);
				}
			}
			send.push(infoVals);
		}

		console.log(send);

		res.render("notifications/index", {"invitations": send[0], "pending": send[1]});
		return;
	});
});


/** PAGES FOR INDIVIDUAL PROFILES **/
app.get('/profile', restrict, function(req, res) {
	// get id from query parameters
	var username = ""
	if ("username" in req.query) {
		username = req.query.username;
	} else {
		username = req.session.username;
	}

	// only allow edit if it is your own profile
	var edit = ("edit" in req.query);
	if (edit && (username !== req.session.username)) {
		edit = false
	}

	var sql = `SELECT info.id, info.username, info.name, info.pronouns, info.year, info.country, info.instagram, info.email,
		language.language, gender.gender, sexuality.sexuality, race.race_ethnicity, religion.religion, interests.interest
		FROM user_info info
		LEFT JOIN user_language language ON language.user_id = info.id
		LEFT JOIN user_gender gender ON gender.user_id = info.id
		LEFT JOIN user_sexuality sexuality ON sexuality.user_id = info.id
		LEFT JOIN user_race_ethnicity race ON race.user_id = info.id
		LEFT JOIN user_religion religion ON religion.user_id = info.id
		LEFT JOIN user_interests interests ON interests.user_id = info.id
		WHERE info.username = ?`;

	connection.query(sql, username, function(error, results, fields) {
		if (error) throw error;
		console.log(results);

		// if profile doesn't exist, send blank info
		if (results.length == 0) {
			res.render('accounts/index', {"data": {}});
			return;
		}

		var infoVals = {};
		for (var i = 0; i < results.length; i++) {
			// if user already exists in dict
			infoVals["id"] = results[i].id;
			infoVals["name"] = results[i].name
			infoVals["username"] = results[i].username;
			infoVals["pronouns"] = results[i].pronouns;
			infoVals["country"] = results[i].country;
			infoVals["year"] = results[i].year;
			infoVals["instagram"] = results[i].instagram;
			infoVals["email"] = results[i].email;

			if (("gender" in infoVals) && !(infoVals["gender"].includes(results[i].gender)))
				infoVals["gender"].push(results[i].gender);
			else if (!("gender" in infoVals))
				infoVals["gender"] = [results[i].gender];

			if (("sexuality" in infoVals) && !(infoVals["sexuality"].includes(results[i].sexuality)))
				infoVals["sexuality"].push(results[i].sexuality);
			else if (!("sexuality" in infoVals))
				infoVals["sexuality"] = [results[i].sexuality];

			if (("race_ethnicity" in infoVals) && !(infoVals["race_ethnicity"].includes(results[i].race_ethnicity)))
				infoVals["race_ethnicity"].push(results[i].race_ethnicity);
			else if (!("race_ethnicity" in infoVals))
				infoVals["race_ethnicity"] = [results[i].race_ethnicity];

			if (("religion" in infoVals) && !(infoVals["religion"].includes(results[i].religion)))
				infoVals["religion"].push(results[i].religion);
			else if (!("religion" in infoVals))
				infoVals["religion"] = [results[i].religion];

			if (("interest" in infoVals) && !(infoVals["interest"].includes(results[i].interest)))
				infoVals["interest"].push(results[i].interest);
			else if (!("interest" in infoVals))
				infoVals["interest"] = [results[i].interest];

			if (("language" in infoVals) && !(infoVals["language"].includes(results[i].language)))
				infoVals["language"].push(results[i].language);
			else if (!("language" in infoVals))
				infoVals["language"] = [results[i].language];
		}

		if (username == req.session.username) {
			infoVals["myProfile"] = true;
		} else {
			infoVals["myProfile"] = false;
		}

		// edit mode
		if (edit) {
			res.render('account/edit', {"data": infoVals});
			return;
		// view mode (default)
		} else {
			res.render('account/index', {"data": infoVals});
			return;
		}		
	});
});


/** REPORT PAGE **/
app.get('/report', restrict, function(req, res) {
	var userId = req.query.id;
	console.log(userId);
	var sql = `SELECT info.name FROM user_info info
		WHERE info.id = ?`;

	connection.query(sql, userId, function(error, results, fields) {
		if (error) throw error;
		console.log(results);

		var vals = {"id": userId, "name": results[0].name};
		console.log(vals);

		res.render('account/report', {"data": vals});
		return;
	});	
});


/** REPORTED SUCCESS OR FAILURE **/
app.get('/reported', restrict, function(req, res) {
	var success = (req.query.success == 'true');
	res.render('account/reported', {"success": success});
	return;
});


/** PRIVACY AND SECURITY SETTINGS PAGE **/
app.get('/settings', restrict, function(req, res) {
	var userId = req.session.user_id;
	var sql = `SELECT `
	res.render('account/settings');
});



/** LOGOUT FUNCTIONALITY **/
app.get('/logout', function(req, res) {
	req.session.destroy();
	res.redirect('/welcome');
});


/** REPORT UPDATES **/
app.post('/reported', restrict, function(req, res) {
	var reportedId = req.body.id;
	var reason = req.body.reason;

	console.log(req.body);

	var sql = `UPDATE user_info info SET
		info.reported = 1 WHERE info.id = ?;
		INSERT INTO report_logs (user_id, reported_id, reason)
		VALUES (?, ?, ?);`;
	var insertVals = [reportedId, req.session.user_id, reportedId, reason];
	console.log(insertVals);

	connection.query(sql, insertVals, function(error, results, fields) {
		if (error) console.log(error);
		console.log(results);
		var success = false;
		if (results[0].affectedRows === 1) {
			success = true;
		}
		res.redirect('/reported?success='+success);
		return;
	})
});


/** PROFILE EDIT UPDATES **/
app.post('/edited', restrict, function(req, res) {
	var sID = req.session.user_id;
	var insertVals = [req.body.option_name, req.body.option_year, req.body.option_pronouns, 
		req.body.option_instagram, req.body.option_email, req.body.option_location, sID];

	var language = [];
	if (req.body.option_language) { 
		language = req.body.option_language;
	}
	var gender = [];
	if (req.body.option_gender) {
		gender = req.body.option_gender;
	}	
	var sexuality = [];
	if (req.body.option_sexuality) {
		sexuality = req.body.option_sexuality;
	}
	var race_ethnicity = [];
	if (req.body.option_race) {
		race_ethnicity = req.body.option_race;
	}
	var religion = [];
	if (req.body.option_religion) {
		religion = req.body.option_religion;
	}
	var interests = [];
	if (req.body.option_interest) {
		interests = req.body.option_interest;
	}

	console.log(insertVals);

	var sql = `UPDATE user_info
		SET name = ?, year = ?, pronouns = ?, instagram = ?, email = ?, country = ?
		WHERE id = ?;
		DELETE FROM user_language WHERE user_id = ?;
		DELETE FROM user_gender WHERE user_id = ?;
		DELETE FROM user_sexuality WHERE user_id = ?;
		DELETE FROM user_race_ethnicity WHERE user_id = ?;
		DELETE FROM user_religion WHERE user_id = ?;
		DELETE FROM user_interests WHERE user_id = ?; `;

	for (var i = 0; i < 6; i++) {
		insertVals.push(sID);
	}

	if (language.length > 0) {
		sql += 'INSERT INTO user_language (user_id, language) VALUES ';
		for (var i = 0; i < language.length - 1; i++) {
			sql += '(?, ?), ';
			insertVals.push(sID);
			insertVals.push(language[i]);
		}
		sql += '(?, ?); '
		insertVals.push(sID);
		insertVals.push(language[language.length - 1]);
	}
	if (gender.length > 0) {
		sql += 'INSERT INTO user_gender (user_id, gender) VALUES ';
		for (var i = 0; i < gender.length - 1; i++) {
			sql += '(?, ?), ';
			insertVals.push(sID);
			insertVals.push(gender[i]);
		}
		sql += '(?, ?); '
		insertVals.push(sID);
		insertVals.push(gender[gender.length - 1]);
	}
	if (sexuality.length > 0) {
		sql += 'INSERT INTO user_sexuality (user_id, sexuality) VALUES ';
		for (var i = 0; i < sexuality.length - 1; i++) {
			sql += '(?, ?), ';
			insertVals.push(sID);
			insertVals.push(sexuality[i]);
		}
		sql += '(?, ?); '
		insertVals.push(sID);
		insertVals.push(sexuality[sexuality.length - 1]);
	}
	if (race_ethnicity.length > 0) {
		sql += 'INSERT INTO user_race_ethnicity (user_id, race_ethnicity) VALUES ';
		for (var i = 0; i < race_ethnicity.length - 1; i++) {
			sql += '(?, ?), ';
			insertVals.push(sID);
			insertVals.push(race_ethnicity[i]);
		}
		sql += '(?, ?); '
		insertVals.push(sID);
		insertVals.push(race_ethnicity[race_ethnicity.length - 1]);
	}
	if (religion.length > 0) {
		sql += 'INSERT INTO user_religion (user_id, religion) VALUES ';
		for (var i = 0; i < religion.length - 1; i++) {
			sql += '(?, ?), ';
			insertVals.push(sID);
			insertVals.push(religion[i]);
		}
		sql += '(?, ?); '
		insertVals.push(sID);
		insertVals.push(religion[religion.length - 1]);
	}
	if (interests.length > 0) {
		sql += `INSERT INTO user_interests (user_id, interest) VALUES `;
		for (var i = 0; i < interests.length - 1; i++) {
			sql += '(?, ?), ';
			insertVals.push(sID);
			insertVals.push(interests[i]);
		}
		sql += '(?, ?);'
		insertVals.push(sID);
		insertVals.push(interests[interests.length - 1]);
	}

	connection.query(sql, insertVals, function(err, results, fields) {
		if (err) throw err;
		console.log(results);
		res.redirect("/profile");
	});
});


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
	// var language = req.body.entry_language; // THIS WILL BE CHECKBOXES MOST LIKELY
	var email = req.body.entry_email;
	var year = req.body.entry_year;
	var instagram = req.body.entry_instagram;
	var country = req.body.entry_country;
	var state = req.body.entry_state;
	var looking_for = req.body.entry_friend_resource;

	// optional data
	var language = [];
	if (req.body.entry_language) {
		language = req.body.entry_language;
	}
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
			username, password, name, pronouns, email, year, instagram, country, state, looking_for
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
					var insertVals = [req.session.username, hash, name, pronouns, email, year, instagram, country, state, looking_for];
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
							if (language.length > 0) {
								nestedSql += 'INSERT INTO user_language (user_id, language) VALUES ';
								for (var i = 0; i < language.length - 1; i++) {
									nestedSql += '(?, ?), ';
									nestedAdd.push(sID);
									nestedAdd.push(language[i]);
								}
								nestedSql += '(?, ?); '
								nestedAdd.push(sID);
								nestedAdd.push(language[language.length - 1]);
							}
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
			LEFT JOIN user_language language ON
			language.user_id = info.id
			LEFT JOIN connections conn ON
			conn.user_id = info.id WHERE 
			(info.id != ?) AND (((conn.connection_id != ?) AND (conn.user_id != ?))
			OR ((info.id NOT IN (SELECT conn.connection_id FROM connections conn)) AND (info.id NOT IN (SELECT conn.user_id FROM connections conn)))) 
			AND (info.reported != 1) AND `;

		var insertVals = [socket.request.session.user_id, socket.request.session.user_id, socket.request.session.user_id];
		if (vals["location"] != '') {
			sql += '(info.country = ?) AND ';
			insertVals.push(vals["location"]);
		}
		if (vals["ageRange"][0] != null && vals["ageRange"][1] != null) {
			sql += '(info.year BETWEEN ? AND ?) AND ';
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
			sql += ')) AND ';
		}
		if (vals["sexuality"].length > 0) {
			sql += '(sexuality.sexuality IN (';
			for (var i = 0; i < vals["sexuality"].length; i++) {
				sql += '?,';
				insertVals.push(vals["sexuality"][i]);
			}
			sql = sql.substring(0, sql.length-1);
			sql += ')) AND ';
		}
		if (vals["race"].length > 0) {
			sql += '(race.race_ethnicity IN (';
			for (var i = 0; i < vals["race"].length; i++) {
				sql += '?,';
				insertVals.push(vals["race"][i]);
			}
			sql = sql.substring(0, sql.length-1);
			sql += ')) AND ';
		}
		if (vals["religion"].length > 0) {
			sql += '(religion.religion IN (';
			for (var i = 0; i < vals["religion"].length; i++) {
				sql += '?,';
				insertVals.push(vals["religion"][i]);
			}
			sql = sql.substring(0, sql.length-1);
			sql += ')) AND ';
		}
		if (vals["interests"].length > 0) {
			sql += '(interests.interest IN (';
			for (var i = 0; i < vals["interests"].length; i++) {
				sql += '?,';
				insertVals.push(vals["interests"][i]);
			}
			sql = sql.substring(0, sql.length-1);
			sql += ')) AND ';
		}
		if (vals["language"].length > 0) {
			sql += '(language.language IN (';
			for (var i = 0; i < vals["language"].length; i++) {
				sql += '?,';
				insertVals.push(vals["language"][i]);
			}
			sql = sql.substring(0, sql.length-1);
			sql += ')) AND ';
		}

		// remove tailing AND
		sql = sql.substring(0, sql.length - 4);
		sql += 'GROUP BY info.id;';

		console.log(sql);
		console.log(insertVals);

		// query database
		connection.query(sql, insertVals, function(error, results, fields) {
			if (error) throw error;

			console.log(results);

			if (results.length > 0) {

				// TEST TO SEE IF THIS IS RIGHT
				var insertIds = '(';

				for (var i = 0; i < results.length; i++) {
					insertIds += results[i].id + ',';
				}
				insertIds = insertIds.substring(0, insertIds.length - 1);
				insertIds += '); ';
				
				// info sql
				var sqlTemp = `SELECT id, name, pronouns, country, year FROM user_info
					WHERE user_info.id IN `;
				sqlTemp += insertIds;

				// gender sql
				sqlTemp += `SELECT user_id, gender FROM user_gender
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

				// language sql
				sqlTemp += `SELECT user_id, language FROM user_language
					WHERE user_id IN `;
				sqlTemp += insertIds;

				console.log(sqlTemp);

				// pass on results to inner query
				connection.query(sqlTemp, function(error, results, fields) {
					console.log(results);
					// TODO: PREPROCESS THIS INFO A BIT TO MAKE IT EASIER TO READ INTO EJS
					/* structure of results:
						0: info (name, pronouns, country, year) 
						1: gender
						2: sexuality
						3: race_ethnicity
						4: religion
						5: interest
						6: language
					*/
					// goal: organize by id, nested array

					var genderVals = {};
					for (var i = 0; i < results[1].length; i++) {
						var tempGender = results[1][i];
						if (!(tempGender.user_id in genderVals)) 
							genderVals[tempGender.user_id] = [];
						genderVals[tempGender.user_id].push(tempGender.gender);
					}

					var sexualityVals = {};
					for (var i = 0; i < results[2].length; i++) {
						var tempSexuality = results[2][i];
						if (!(tempSexuality.user_id in sexualityVals)) 
							sexualityVals[tempSexuality.user_id] = [];
						sexualityVals[tempSexuality.user_id].push(tempSexuality.sexuality);
					}

					var race_ethnicityVals = {};
					for (var i = 0; i < results[3].length; i++) {
						var tempRace_ethnicity = results[3][i];
						if (!(tempRace_ethnicity.user_id in race_ethnicityVals)) 
							race_ethnicityVals[tempRace_ethnicity.user_id] = [];
						race_ethnicityVals[tempRace_ethnicity.user_id].push(tempRace_ethnicity.race_ethnicity);
					}

					var religionVals = {};
					for (var i = 0; i < results[4].length; i++) {
						var tempReligion = results[4][i];
						if (!(tempReligion.user_id in religionVals)) 
							religionVals[tempReligion.user_id] = [];
						religionVals[tempReligion.user_id].push(tempReligion.religion);
					}

					var interestVals = {};
					for (var i = 0; i < results[5].length; i++) {
						var tempInterest = results[5][i];
						if (!(tempInterest.user_id in interestVals)) 
							interestVals[tempInterest.user_id] = [];
						interestVals[tempInterest.user_id].push(tempInterest.interest);
					}

					var languageVals = {};
					for (var i = 0; i < results[6].length; i++) {
						var tempLanguage = results[6][i];
						if (!(tempLanguage.user_id in languageVals)) 
							languageVals[tempLanguage.user_id] = [];
						languageVals[tempLanguage.user_id].push(tempLanguage.language);
					}

					// all information container
					var infoVals = {};
					for (var i = 0; i < results[0].length; i++) {
						var tempInfo = results[0][i];
						infoVals[tempInfo.id] = [];
						infoVals[tempInfo.id].push(tempInfo.id);
						infoVals[tempInfo.id].push(tempInfo.name);
						infoVals[tempInfo.id].push(tempInfo.pronouns);
						infoVals[tempInfo.id].push(tempInfo.country);
						infoVals[tempInfo.id].push(tempInfo.year);
						if (tempInfo.id in genderVals) 
							infoVals[tempInfo.id].push(genderVals[tempInfo.id]);
						else
							infoVals[tempInfo.id].push([]);
						if (tempInfo.id in sexualityVals) 
							infoVals[tempInfo.id].push(sexualityVals[tempInfo.id]);
						else
							infoVals[tempInfo.id].push([]);
						if (tempInfo.id in race_ethnicityVals)
							infoVals[tempInfo.id].push(race_ethnicityVals[tempInfo.id]);
						else
							infoVals[tempInfo.id].push([]);
						if (tempInfo.id in religionVals)
							infoVals[tempInfo.id].push(religionVals[tempInfo.id]);
						else
							infoVals[tempInfo.id].push([]);
						if (tempInfo.id in interestVals)
							infoVals[tempInfo.id].push(interestVals[tempInfo.id]);
						else
							infoVals[tempInfo.id].push([]);
						if (tempInfo.id in languageVals)
							infoVals[tempInfo.id].push(languageVals[tempInfo.id]);
						else
							infoVals[tempInfo.id].push([]);
					}

					console.log(infoVals);

					socket.emit('searchResults', {"data": infoVals});

				});
			} else {
				socket.emit('searchResults', {"data": []});
			}
		});
	});

	socket.on('connectSend', function(vals) {
		console.log(vals);

		var userId = socket.request.session.user_id;
		var sql = `INSERT INTO connections (user_id, connection_id, pending)
			VALUES (?, ?, 1);`;
		var insertIds = [userId, vals["id"]];

		connection.query(sql, insertIds, function(error, results, fields) {
			if (error) throw error;
			console.log(results);
			return;
		})
	});

	socket.on('acceptInvitation', function(vals) {
		var conn_id = vals["id"];
		console.log(conn_id);
		// update pending for inwards connection and insert outwards connection
		var sql = `UPDATE connections
			SET pending = 0
			WHERE connections.connection_id = ? AND connections.user_id = ?;
			INSERT INTO connections (connections.user_id, connections.connection_id, connections.pending)
			VALUES (?, ?, 0)`;

		var insertIds = [socket.request.session.user_id, conn_id, socket.request.session.user_id, conn_id];
		connection.query(sql, insertIds, function(error, results, fields) {
			if (error) throw error;
			console.log(results);
		});
	});

	socket.on('ignoreInvitation', function(vals) {
		var conn_id = vals["id"];
		// remove inwards connection entry in db
		var sql = `DELETE FROM connections
			WHERE (connections.user_id = ?) and (connections.connection_id = ?);`;

		var insertIds = [conn_id, socket.request.session.user_id];
		connection.query(sql, insertIds, function(error, results, fields) {
			if (error) throw error;
			console.log(results);
		});
	});

	socket.on('cancelPending', function(vals) {
		var conn_id = vals["id"];
		// delete outwards connection entry in db
		var sql = `DELETE FROM connections
			WHERE (user_id = ?) and (connection_id = ?);`;

		var insertIds = [socket.request.session.user_id, conn_id];
		connection.query(sql, insertIds, function(error, results, fields) {
			if (error) throw error;
			console.log(results);
		});
	});

});