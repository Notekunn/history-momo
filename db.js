const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(
	process.env.DATABASE_URL || {
		dialect: 'sqlite',
		storage: './database.sqlite',
		logging: false,
	}
);
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
