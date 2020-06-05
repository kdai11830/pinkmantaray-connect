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

var server = http.createServer(app);
var io = require('io').listen(server);

server.listen(port);


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

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess));
app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.use(express.static(__dirname));


// test connection to port
app.listen(port, function(err) {  
	if (typeof(err) == "undefined") {  
		console.log('Your application is running on : ' + port + ' port');  
	}  
}); 


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
	var sql = `SELECT name, email, instagram FROM user_info 
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
	res.render('connect/index');
});


/** CONNECT PAGE POST **/
app.post('/connect', function(req, res) {
	// put all of the query parameters within dict
	var paramDict = {};

	if (req.body.option_location) {
		paramDict["country"] = req.body.option_location;
	}

	if (req.body.option_age1 && req.body.option_age2) {
		paramDict["age1"] = req.body.option_age1;
		paramDict["age2"] = req.body.option_age2;
	}

	if (req.body.option_gender) {
		paramDict["gender"] = req.body.option_gender;
	}

	if (req.body.option_sexuality) {
		paramDict["sexuality"] = req.body.option_sexuality;
	}

	if (req.body.option_race) {
		paramDict["race_ethnicity"] = req.body.option_race;
	}

	if (req.body.option_religion) {
		paramDict["religion"] = req.body.option_religion;
	}

	if (req.body.entry_interests) {
		paramDict["interests"] = req.body.entry_interests;
	}

	// stringify dict into url and redirect to results page
	var queryString = qs.stringify();
	res.redirect('/results?' + queryString);
});


/** SEARCH RESULTS OF CONNECT PAGE **/
// TODO: EVERYTHING LOL
app.get('/results', restrict, function(req, res) {
	// TODO: check if parsed correctly
	var queryResults = req.query;
	var queryLimit = 20;

	

	// if there are query strings do initial query to get IDs and then use IDs to get information
	if (Object.keys(queryResults).length !== 0) {
		var sql = `SELECT info.id FROM pinkmantaray_connect.user_info info
		LEFT JOIN user_gender gender ON
		gender.user_id = info.id
		LEFT JOIN user_sexuality sexuality ON
		sexuality.user_id = info.id
		LEFT JOIN user_race_ethnicity race ON
		race.user_id = info.id
		LEFT JOIN user_religion religion ON
		religion.user_id = info.id
		LEFT JOIN user_interests interests ON
		interests.user_id = info.id WHERE`

		var insertVals = [];
		// go through querystring and check every element and add to sql
		if ("country" in queryResults) {
			sql += " (info.country = ?) OR";
			insertVals.push(queryResults["country"]);
		}
		if (("age1" in queryResults) && ("age2" in queryResults)) {
			var curYear = new Date().getFullYear();
			var year1 = curYear - queryResults["age2"]; // older
			var year2 = curYear - queryResults["age1"]; // younger
			sql += ' (info.year BETWEEN ? AND ?) OR';
			insertVals.push(year1);
			insertVals.push(year2);
		}
		if ("gender" in queryResults) {
			sql += " (gender.gender IN (";
			// gender should be an array
			for (var i = 0; i < queryResults["gender"].length; i++) {
				sql += '?,';
				insertVals.push(queryResults["gender"][i]);
			}
			sql -= ',';
			sql += ')) OR';
		}
		if ("sexuality" in queryResults) {
			sql += " (sexuality.sexuality IN (";
			// gender should be an array
			for (var i = 0; i < queryResults["sexuality"].length; i++) {
				sql += '?,';
				insertVals.push(queryResults["sexuality"][i]);
			}
			sql -= ',';
			sql += ')) OR';
		}
		if ("race_ethnicity" in queryResults) {
			sql += " (race.race_ethnicity IN (";
			// gender should be an array
			for (var i = 0; i < queryResults["race_ethnicity"].length; i++) {
				sql += '?,';
				insertVals.push(queryResults["race_ethnicity"][i]);
			}
			sql -= ',';
			sql += ')) OR';
		}
		if ("religion" in queryResults) {
			sql += " (religion.religion IN (";
			// gender should be an array
			for (var i = 0; i < queryResults["religion"].length; i++) {
				sql += '?,';
				insertVals.push(queryResults["religion"][i]);
			}
			sql -= ',';
			sql += ')) OR';
		}
		if ("interests" in queryResults) {
			sql += " (interests.interest IN (";
			// gender should be an array
			for (var i = 0; i < queryResults["interests"].length; i++) {
				sql += '?,';
				insertVals.push(queryResults["interests"][i]);
			}
			sql -= ',';
			sql += ')) OR';
		}

		// remove tailing OR
		sql = sql.substring(0, sql.length - 2);
		sql += 'GROUP BY info.id;';

		// begin outer query
		connection.query(sql, function(error, results, fields) {
			console.log(results);

			var sqlTemp = `SELECT id, `
			// pass on results to inner query
		}) 



	// else query queryLimit number of items and send to results page
	} else {
		sql += 'LIMIT 0, ' + queryLimit; 
		connection.query(sql, function(error, results, fields) {
			console.log(results);
			// send results to html template to display
			// if no results, should be blank anyways
			// ^ CHECK THIS
			res.render('connect/results', {'results': results});
			return;
		});
	}

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

	req.session.username = req.body.uname;
	var enteredPassword = req.body.pwd;
	var confirmPassword = req.body.confirm;

	// double check passwords match
	if (enteredPassword !== confirmPassword) {
		alert("Passwords much match!");
		req.session.destroy();
		res.redirect('back');
		return;
	}

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

	// check if terms and conditions read
	// BACKUP - should not need this if front end js works
	if (req.body.read_terms_conditions != "read") {
		console.log('TODO: IMPLEMENT THIS THINGY');
		res.redirect('back');
		return;

	} else {
		// insert information into database
		var sql = `INSERT INTO user_info 
			(
				username, password, name, pronouns, email, year, instagram, country, state
			)
			VALUES
			(
				?, ?, ?, ?, ?, ?, ?, ?, ?
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
						var insertVals = [req.session.username, hash, name, pronouns, email, year, instagram, country, state];
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
								var nestedSql = '; ';
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
	}
});


/** SOCKET.IO LISTEN AND EMIT FUNCTIONS **/
io.on('connection', function(socket) {
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
			interests.user_id = info.id WHERE `;

		var insertVals = [];
		if (vals["location"] !== '') {
			sql += '(info.country = ?) OR ';
			insertVals.push(vals["location"]);
		}
		if (vals["ageRange"] !== []) {
			sql += '(info.year BETWEEN ? AND ?) OR ';
			insertVals.push(vals["ageRange"][0]);
			insertVals.push(vals["ageRange"][1]);
		}
		if (vals["gender"] !== []) {
			sql += '(gender.gender IN (';
			for (var i = 0; i < vals["gender"].length; i++) {
				sql += '?,';
				insertVals.push(vals["gender"][i]);
			}
			sql -= ',';
			sql += ')) OR ';
		}
		if (vals["sexuality"] !== []) {
			sql += '(sexuality.sexuality IN (';
			for (var i = 0; i < vals["sexuality"].length; i++) {
				sql += '?,';
				insertVals.push(vals["sexuality"][i]);
			}
			sql -= ',';
			sql += ')) OR ';
		}
		if (vals["race"] !== []) {
			sql += '(race.race_ethnicity IN (';
			for (var i = 0; i < vals["race"].length; i++) {
				sql += '?,';
				insertVals.push(vals["race"][i]);
			}
			sql -= ',';
			sql += ')) OR ';
		}
		if (vals["religion"] !== []) {
			sql += '(religion.religion IN (';
			for (var i = 0; i < vals["religion"].length; i++) {
				sql += '?,';
				insertVals.push(vals["religion"][i]);
			}
			sql -= ',';
			sql += ')) OR ';
		}
		if (vals["interests"] !== []) {
			sql += '(interests.interest IN (';
			for (var i = 0; i < vals["interests"].length; i++) {
				sql += '?,';
				insertVals.push(vals["interests"][i]);
			}
			sql -= ',';
			sql += ')) OR ';
		}

		// remove tailing OR
		sql = sql.substring(0, sql.length - 2);
		sql += 'GROUP BY info.id;';

		// query database
		connection.query(sql, function(error, results, fields) {
			if (error) {
				console.log(error);
			}

			
		})
	})
})