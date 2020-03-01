const mongoose = require('mongoose');
const Promise = require('bluebird');
const User = rquire('./model/User.js');

mongoose.Promise = Promise;

const MONGO_USER = 'ampulex';
const MONGO_PASSWORD = 'nailzxid565';
const DBNAME = 'skiinguru';

const mongoString = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@sboarddbcluster-tclwc.mongodb.net/${DBNAME}?retryWrites=true`;

const createErrorResponse = (statusCode, message) => ({
	statusCode: statusCode || 501,
	headers: { 'Content-Type': 'text/plain' },
	body: message || 'Incorrect id',
});

const dbExecute = (db, fn) => db.then(fn).finally(() => db.close());

function dbConnectAndExecute(dbUrl, fn) {
	return dbExecute(mongoose.connect(dbUrl, { useMongoClient: true }), fn);
}

module.exports.user = (event, context, callback) => {
	dbConnectAndExecute(mongoString, () => (
		User
			.find({ _id: event.pathParameters.id })
			.then(user => callback(null, { statusCode: 200, body: JSON.stringify(user) }))
			.catch(err => callback(null, createErrorResponse(err.statusCode, err.message)))
	));
};


module.exports.createUser = (event, context, callback) => {
	const data = JSON.parse(event.body);

	const user = new User({
		firstname: data.firstname,
		lastname: data.lastname,
		nickname: data.nickname || null,
		gender: data.gender || null,
		age: data.age || null,
		userpic: data.userpic || null
	});

	if (user.validateSync()) {
		callback(null, createErrorResponse(400, 'Incorrect user data'));
		return;
	}

	dbConnectAndExecute(mongoString, () => (
		user
			.save()
			.then(() => callback(null, {
				statusCode: 200,
				body: JSON.stringify({ id: user.id }),
			}))
			.catch(err => callback(null, createErrorResponse(err.statusCode, err.message)))
	));
};

module.exports.deleteUser = (event, context, callback) => {
	if (!validator.isAlphanumeric(event.pathParameters.id)) {
		callback(null, createErrorResponse(400, 'Incorrect id'));
		return;
	}

	dbConnectAndExecute(mongoString, () => (
		User
			.remove({ _id: event.pathParameters.id })
			.then(() => callback(null, { statusCode: 200, body: JSON.stringify('Ok') }))
			.catch(err => callback(null, createErrorResponse(err.statusCode, err.message)))
	));
};

module.exports.updateUser = (event, context, callback) => {
	const data = JSON.parse(event.body);
	const id = event.pathParameters.id;

	if (!validator.isAlphanumeric(id)) {
		callback(null, createErrorResponse(400, 'Incorrect id'));
		return;
	}

	const user = new User({
		_id: id,
		firstname: data.firstname,
		lastname: data.lastname,
		nickname: data.nickname || null,
		gender: data.gender || null,
		age: data.age || null,
		userpic: data.userpic || null
	});

	if (user.validateSync()) {
		callback(null, createErrorResponse(400, 'Incorrect parameter'));
		return;
	}

	dbConnectAndExecute(mongoString, () => (
		User.findByIdAndUpdate(id, user)
			.then(() => callback(null, { statusCode: 200, body: JSON.stringify('Ok') }))
			.catch(err => callback(err, createErrorResponse(err.statusCode, err.message)))
	));
};
