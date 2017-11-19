var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var router = express.Router();
var User  = require('../models/user');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var config = require('config');

var mailConfig = config.get('Gmail');


function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/users/login');
    }
}

//Register
router.get('/register', function(req, res) {
	res.render('register');
});

//Register
router.post('/register', function(req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	

	//Validation
	req.checkBody('name', 'Name is required.').notEmpty();
	req.checkBody('email', 'Email is required.').notEmpty();
	req.checkBody('email', 'Email is not valid.').isEmail();
	req.checkBody('username', 'Username is required.').notEmpty();
	req.checkBody('password', 'Password is required.').notEmpty();
	req.checkBody('password2', 'Passwords do not match.').equals(req.body.password);

	req.getValidationResult().then(function(result) {
		if (!result.isEmpty()) {
			res.render('register', {errors: result.array() });
		} else {
			var newUser = new User({
				name: name,
				email: email,
				username: username,
				password: password
			});

			User.createUser(newUser, function(err, user) {
				if (err) throw err;
			});

			req.flash('success_msg', 'You are registered and can now log in.');
			res.redirect('/users/login');
		}
	});

	
});

passport.use(new LocalStrategy(
	function(username, password, done) {
		User.getUserByUserName(username, function(err, user) {
			if(err) throw err;
			if(!user) {
				return done(null, false, {message: 'No user found.'});
			}
			User.comparePassword(password, user.password, function(err, isMatch){
				if (err) throw err;
				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, {message: 'Invalid Password.'});
				}
			})
		})
	}));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.getUserById(id, function(err, user) {
		done(err, user);
	});
});

//Login
router.post('/login', 
	passport.authenticate('local', {successRedirect: '/', failureRedirect: '/users/login', failureFlash: true}),
	function(req, res) {
		res.redirect('/');
});

router.get('/login', function(req, res) {
	res.render('login');
});

//Logout
router.get('/logout', function(req,res) {
	req.logout();
	req.flash('success_msg', 'You have been logged out.');
	res.redirect('/users/login')
});

//Profile
router.get('/profile/:userid', loggedIn, function(req, res) {
	User.getUserById(req.params.userid, function(err,user) {
			res.render('profile', user);	
	});
});

router.post('/profile/:userid', function(req,res) {
	var name = req.body.name;
	var email = req.body.email;
	var password = req.body.password;
	var password2 = req.body.password2;

	req.checkBody('name', 'Name is required.').notEmpty();
	req.checkBody('email', 'Email is required.').notEmpty();
	req.checkBody('email', 'Email is not valid.').isEmail();
	req.checkBody('password', 'Password is required.').notEmpty();
	req.checkBody('password2', 'Passwords do not match.').equals(req.body.password);

	req.getValidationResult().then(function(result) {
		if (!result.isEmpty()) {
			res.render('profile', { errors: result.array() });
		} else {

			User.updateUserById(req.params.userid, req.body, function(err,user) {
				req.flash('success_msg', 'Your profile has been updated.');
				res.redirect('/users/profile/'+req.params.userid);		
			});
		}
	});
});

//Forgot Password
router.get('/forgot', function(req, res) {
	res.render('forgot', {user: req.user});
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      
    	User.getUserByEmail(req.body.email, function(err,user) {
			if (!user) {
          		req.flash('error', 'No account with that email address exists.');
          		return res.redirect('/users/forgot');
        	}
	    user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 36000000; // 1 hour
        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: mailConfig.username,
          pass: mailConfig.password
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@demo.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/users/login');
  });
});


//Reset Password
router.get('/reset/:token', function(req, res) {
	
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/users/forgot');
    }
    res.render('reset', {
      user: req.user,
      token: req.params.token
    });
  });
});


router.post('/reset/:token', function(req, res) {
	var password = req.body.password;
	var password2 = req.body.password2;
	
	//Validation
	req.checkBody('password', 'Password is required.').notEmpty();
	req.checkBody('password2', 'Passwords do not match.').equals(req.body.password);

	req.getValidationResult().then(function(result) {
		if (!result.isEmpty()) {
			res.render('reset', { errors: result.array() });
		} else {
			async.waterfall([
		    function(done) {
		    	console.log(req.params.token);
		      User.findOne({ resetPasswordToken: req.params.token }, function(err, user) {
		        if (!user) {
		          req.flash('error', 'Password reset token is invalid or has expired.');
		          return res.redirect('reset');
		        }

		        user.password = req.body.password;
		        user.resetPasswordToken = undefined;
		        user.resetPasswordExpires = undefined;

		        User.resetPassword(user, function(err) {
		        	req.flash('success_msg', 'Your password has been updated.');
					res.redirect('/users/login');
		        });
		      });
		    },
		    function(user, done) {
		      var smtpTransport = nodemailer.createTransport({
		        service: 'gmail',
		        auth: {
		          user: mailConfig.username,
		          pass: mailConfig.password
		        }
		      });
		      var mailOptions = {
		        to: user.email,
		        from: 'passwordreset@demo.com',
		        subject: 'Your password has been changed',
		        text: 'Hello,\n\n' +
		          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
		      };
		      smtpTransport.sendMail(mailOptions, function(err) {
		        req.flash('success', 'Success! Your password has been changed.');
		        done(err);
		      });
		    }
		  ], function(err) {
		    res.redirect('/users/reset/'+req.params.token);
		  });
		}
	});
});



module.exports = router;