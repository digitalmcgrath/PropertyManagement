var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var UserSchema = mongoose.Schema({
	username: {type: String, index:true},
	password: {type: String},
	email: {type: String},
	name: {type: String},
	isAdmin: {type: Boolean, default: false},
	resetPasswordToken: {type: String},
	resetPasswordExpires: {type: Date}
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback) {
	bcrypt.genSalt(10, function(err, salt) {
		bcrypt.hash(newUser.password, salt, function(err, hash) {
			newUser.password = hash;
			newUser.save(callback);
		});
	});
}

module.exports.getUserByUserName = function(username, callback) {
	var query = {username: username};
	User.findOne(query, callback);
}

module.exports.updateUserById = function(userid, user, callback) {
	User.findByIdAndUpdate({_id:userid}, user, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
		if (err) throw err;
		callback(null, isMatch);
	})	
}

module.exports.getUserById = function(id, callback) {
	User.findById(id, callback);
}

module.exports.getUserByEmail = function(email, callback) {
	var query = {email: email};
	User.findOne(query, callback);
}

module.exports.resetPassword = function(user, callback) {
	bcrypt.genSalt(10, function(err, salt) {
		bcrypt.hash(user.password, salt, function(err, hash) {
			user.password = hash;
			User.findByIdAndUpdate({_id:user.id},user,callback);
		});
	});
}