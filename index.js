require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const path = require('path');
const { Server } = require('socket.io');
const Momo = require('./lib/momo');
const { History } = require('./db');
const {
	PORT = 3001,
	phone,
	password,
	rkey,
	imei,
	onesignal,
	otp,
	setupkey,
	ohash,
	status,
} = process.env;
const momo = new Momo(phone, password, rkey, imei, onesignal, otp, ohash, setupkey, status);

const io = new Server(server);
app.set('history', []);

app.use(express.static(path.join(__dirname, './public')));

app.set('running', true);

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

app.get('/check', async (req, res) => {
	const { tranId } = req.query;
	try {
		const transfer = await History.findOne({
			where: {
				tranId,
			},
		});
		if (!transfer) throw new Error();
		res.status(200).json(transfer.get({ plain: true }));
	} catch (error) {
		res.json({});
	}
});

server.listen(PORT, () => {
	console.log(`Listenning in port ${PORT}`);
});
async function getAll() {
	try {
		const data = await History.findAll({
			order: [['finishTime', 'ASC']],
		});
		const history = data.map((e) => e.get({ plain: true }));
		app.set('history', history);
	} catch (error) {
		return [];
	}
}
io.on('connection', (socket) => {
	console.log('a user connected');
	socket.emit('SERVER_SEND_DATA', app.get('history'));
	socket.on('disconnect', () => {
		console.log('user disconnected');
	});
});

async function cron(day) {
	await getAll();
	const allHistory = app.get('history');
	io.sockets.emit('SERVER_SEND_DATA', allHistory);
	try {
		await momo.login();
		const history = await momo.getHistory(day);
		for (let i = 0; i < history.length; i++) {
			const { io, tranId, partnerId, partnerName, amount, comment, finishTime } = history[i];
			const inData = allHistory.filter((e) => e.tranId == tranId);
			if (inData.length > 0) return;
			const transfer = History.build({
				io,
				tranId,
				partnerId,
				partnerName,
				amount,
				comment,
				finishTime,
			});
			await transfer.save();
		}
	} catch (error) {
		console.log(error.stack);
	}
}
cron(100).then(getAll);
setInterval(() => {
	cron(1).then(getAll);
}, 5 * 60 * 1000); //Cron moi 5 phut
