var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var PropertySchema = mongoose.Schema({
	propertyname: {type: String},
	address: {type: String},
	city: {type: String},
	state: {type: String},
	zipcode: {type: String},
	propertytype: {type: String},
	propertynotes: {type: String},
	propertyRented: {type: String},
	rentalAmount: {type: Number},
	propertyRelationship: {type: String, default: 'Sole Ownership'},
	createdby: {type: String}
});

//Add Property to DB
var Property = module.exports = mongoose.model('Property', PropertySchema);
module.exports.createProperty = function(newProperty, callback) {
	newProperty.save(callback);
}

//Get All Properties for User
module.exports.getPropertiesByCreatedBy = function(userid, callback) {
	var query = {'createdby': userid};
	Property.find(query, callback);
}

//Get Property By Id
module.exports.getPropertyById = function (_id, callback) {
	var query = {'_id': _id};
	Property.findById(query, callback);
}

//Update Property
module.exports.updatePropertyById = function(propertyid, property, callback) {
	Property.findByIdAndUpdate(propertyid, {$set:property}, callback);
}