const { Sequelize, DataTypes } = require('sequelize');
const config = {
	dialect: 'postgres',
	logging: false,
	host: 'ec2-35-174-56-18.compute-1.amazonaws.com',
	port: '5432',
	username: 'msqmaoavigbsjb',
	password: 'c1a5972cc27cc8046eb7a6cff6c35be89692ce5a2519bdfa81445e381630af25',
	database: 'd74rqsclshfs8e',
};
const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: './database.sqlite',
});
const History = sequelize.define('history', {
	id: {
		autoIncrement: true,
		type: DataTypes.INTEGER,
		primaryKey: true,
	},
	io: {
		type: DataTypes.INTEGER,
	},
	tranId: {
		type: DataTypes.INTEGER,
		unique: true,
	},
	partnerId: {
		type: DataTypes.INTEGER,
	},
	partnerName: {
		type: DataTypes.STRING,
	},
	amount: {
		type: DataTypes.INTEGER,
	},
	comment: {
		type: DataTypes.STRING,
	},
	finishTime: {
		type: DataTypes.DATE,
	},
});
History.sync();
sequelize
	.authenticate()
	.then(() => console.log('Connection has been established successfully.'))
	.catch((e) => console.error('Unable to connect to the database:', e));

module.exports = {
	History,
};
