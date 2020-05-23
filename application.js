// includes
var path = require('path')
var express = require('express');
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var util = require('util');

// declare application and connect to db
var app = new express();
const port = 3000;

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

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());


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
		res.redirect('/login');
	}
}


/** HOME PAGE **/
app.get('/', restrict, function(req, res) {
	/*var tableVals = [];

	// TODO: CLEAN THIS UP, HOPEFULLY COMBINE THE TWO QUERY CALLS
	// USE PROMISE IF POSSIBLE
	connection.query(`SELECT * FROM user_info 
		RIGHT JOIN connections ON connections.connection_id = user_info.id 
		WHERE connections.user_id = ? AND connections.pending = 0`, req.session.id, function(error, result, fields) {
			if (error) {
				console.log("THIS SHIT HAPPENED")
				console.log(error);
				res.render('index', {"error": true});
				return;
			} else {
				console.log(result);
				var jsonList = [result];
				// addJSON(result);

				// begin nested query
				connection.query(`SELECT * FROM user_info 
					RIGHT JOIN connections ON connections.connection_id = user_info.id 
					WHERE connections.user_id = ? AND connections.pending = 1`, req.session.id, function(error, result) {
						if (error) {
							console.log(error);
							res.render('index', {"error": true}); // TODO: FIGURE OUT IF THIS MEANS NO CONNECTIONS OR WHAT
							return;
						} else {
							console.log(result);
							addJSON(result)
						}	
				});
			}
	});	

	res.render('index', {"connections": tableVals[0], "pending": tableVals[1]});
	return;

	function addJSON(obj) {
		tableVals.push(obj);
	}*/

	// double sql query
	var sql = `SELECT * FROM user_info 
		RIGHT JOIN connections ON connections.connection_id = user_info.id 
		WHERE connections.user_id = ? AND connections.pending = 0; 
		SELECT * FROM user_info 
		RIGHT JOIN connections ON connections.connection_id = user_info.id 
		WHERE connections.user_id = ? AND connections.pending = 1`
	connection.query(sql, [req.session.user_id, req.session.user_id], function(err, results, fields) {
		if (err) {
			console.log(err);
			res.redirect('/login');
			return;
		}
		console.log(req.session.user_id);
		console.log(results);
		res.render('index', {"connections": results[0], "pending": results[1]});
		return;
	});

});


/** LOGIN PAGE **/
app.get('/login', function(req, res) {
	// clear current session
	req.session.destroy();
	res.render('login');
});


/** SIGN UP PAGE **/
app.get('/signup', function(req, res) {
	res.render('signup');
});

app.get('/signup-form', function(req, res) {
	res.render('signup-form');
})

/** SIGN UP FORM PAGE POST **/
app.post('/signup', function(req, res) {
	req.session.username = req.body.uname;
	var enteredPassword = req.body.pwd;
	var confirmPassword = req.body.confirm;

	// double check passwords match
	if (enteredPassword != confirmPassword) {
		alert("Passwords much match!");
		req.session.destroy();
		res.redirect('back');
		return;
	}

	// hash password
	bcrypt.genSalt(saltRounds, function(err, salt) {
		if (err) {
			throw err;
		} else {
			bcrypt.hash(enteredPassword, salt, function(err, hash) {
				if (err) {
					throw err;
				} else {
					req.session.password = hash;
					console.log(req.session.username);
					console.log(req.session.password);
					res.redirect('/signup-form');
					return;
				}
			});
		}
	});
	
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
})


/** NEW USER INFORMATION SUBMISSION AUTHENTICATION **/
app.post('/new-user-auth', function(req, res) {
	// gather data from form
	var name = req.body.entry_name;
	var email = req.body.entry_email;
	var year = req.body.entry_year;
	var instagram = req.body.entry_instagram;
	var country = req.body.entry_country;
	var state = req.body.entry_state;
	var gender = "";
	if (req.body.entry_gender) {
		var gender = req.body.entry_gender.join();
	}	
	var sexuality = "";
	if (req.body.entry_sexuality) {
		sexuality = req.body.entry_sexuality.join();
	}
	var race = "";
	if (req.body.entry_race) {
		race = req.body.entry_race.join();
	}
	var religion = "";
	if (req.body.entry_religion) {
		religion = req.body.entry_religion.join();
	}
	var interests = [];
	if (req.body.entry_interests) {
		interests = req.body.entry_interests.split(",");
	}

	var insertVals = [req.session.username, req.session.password, name, email, year, instagram, country, state, gender, sexuality, race, religion];
	console.log(insertVals);

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
				username, password, name, email, year, instagram, country, state, gender, sexuality, race_ethnicity, religion
			)
			VALUES
			(
				?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
			)`;
		

		// perform first sql insertion into user_info
		// THIS WORKS BUT TRY TO HET THE ASYNC TO WORK IF POSSIBLE
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
				if (interests.length > 0) {
					var interestsAdd = [];
					req.session.user_id = result.insertId;
					var sID = result.insertId.toString();
					var interestsSql = `INSERT INTO user_interests (user_id, interest) VALUES `;
					for (var i = 0; i < interests.length - 1; i++) {
						interestsSql += '(?, ?), ';
						interestsAdd.push(sID);
						interestsAdd.push(interests[i]);
					}
					interestsSql += '(?, ?)'
					interestsAdd.push(sID);
					interestsAdd.push(interests[interests.length - 1]);

					connection.query(interestsSql, interestsAdd, function(err, nestResult, fields) {
						if (err) {
							console.log(err);
						} else {
							// console.log(nestResult);
							res.redirect('/');
							return
						}
					})
				}

			}
			
		});
	}
});