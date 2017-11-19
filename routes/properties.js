var express = require('express');
var router = express.Router();
var Property  = require('../models/property');
var async = require('async');
var exphbs = require('express-handlebars');
var handlebars = require('handlebars');
//Property List
router.get('/', ensureAuthenticated, function(req, res) {
	Property.getPropertiesByCreatedBy(req.user.id, function(err, property) {
		if (err) throw err;
		res.render('properties/property-index', {properties: property} );
	});
});


//Add Property
router.get('/add', ensureAuthenticated, function(req, res) {
	res.render('properties/property-add');
});

router.post('/add', ensureAuthenticated, function(req, res) {
	var propertyName = req.body.propertyName;
	var address = req.body.address;
	var city = req.body.city;
	var state = req.body.state;
	var zipcode = req.body.zipcode;
	var propertyType = req.body.propertyType;
	var propertyRented = req.body.propertyRented;
	var propertyRelationship = req.body.propertyRelationship;
	var rentalAmount = req.body.rentalAmount;
	var propertyNotes = req.body.propertyNotes;

	//Validation
	req.checkBody('propertyName', 'Property name is required.').notEmpty();
	req.checkBody('address', 'Address is required.').notEmpty();
	req.checkBody('city', 'City is required.').notEmpty();
	req.checkBody('state', 'State is required.').notEmpty();
	req.checkBody('zipcode', 'Zipcode is required.').notEmpty();
	

	req.getValidationResult().then(function(result) {
		if (!result.isEmpty()) {
			res.render('properties/add', {errors: result.array() });
		} else {
			var newProperty = new Property({
				propertyname: propertyName, 
				address: address,
				city: city,
				state: state,
				zipcode: zipcode,
				propertytype: propertyType,
				propertynotes: propertyNotes,
				propertyRented: propertyRented,
				rentalAmount: rentalAmount,
				propertyRelationship: propertyRelationship,
				createdby: req.user.id
			});

			Property.createProperty(newProperty, function(err, property) {
				if (err) throw err;
			});

			req.flash('success_msg', 'Your property has been added');
			res.redirect('/properties');
		}
	});

});

router.get('/edit/:id', ensureAuthenticated, function(req, res) {
	Property.getPropertyById(req.params.id, function(err,propertydetails) {
		res.render('properties/property-edit', {propertydetails});	
	});
});

router.post('/edit/:id', function(req, res) {
	var propertyName = req.body.propertyName;
	var address = req.body.address;
	var city = req.body.city;
	var state = req.body.state;
	var zipcode = req.body.zipcode;
	

	//Validation
	req.checkBody('propertyName', 'Property name is required.').notEmpty();
	req.checkBody('address', 'Address is required.').notEmpty();
	req.checkBody('city', 'City is required.').notEmpty();
	req.checkBody('state', 'State is required.').notEmpty();
	req.checkBody('zipcode', 'Zipcode is required.').notEmpty();
	
	req.getValidationResult().then(function(result) {
		if (!result.isEmpty()) {
			res.render('properties/property-edit', { errors: result.array() });
		} else {

			Property.updatePropertyById(req.params.id, req.body, function(err,property) {
				req.flash('success_msg', 'Your property has been updated.');
				res.redirect('/properties/details/'+req.params.id);		
			});
		}
	});
});

router.get('/details/:id', ensureAuthenticated, function( req, res) {
	Property.getPropertyById(req.params.id, function(err,propertydetails) {
		console.log(propertydetails);
		res.render('properties/property-details', propertydetails);
	});
});


function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		res.redirect('/users/login');
	}
}

module.exports = router;