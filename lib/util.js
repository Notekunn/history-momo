const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const iv = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 'binary');
const encrypt = function (plain_text, encryptionMethod, secret, iv) {
	const encryptor = crypto.createCipheriv(encryptionMethod, secret, iv);
	return encryptor.update(plain_text, 'utf8', 'base64') + encryptor.final('base64');
};

const decrypt = function (encryptedMessage, encryptionMethod, secret, iv) {
	const decryptor = crypto.createDecipheriv(encryptionMethod, secret, iv);
	return decryptor.update(encryptedMessage, 'base64', 'utf8') + decryptor.final('utf8');
};
class Util {
	getMicroTime() {
		return new Date().getTime();
	}
	getRandomKey(length) {
		var result = '';
		var characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
	getImei() {
		const time = md5(this.getMicroTime());
		let text = `${time}`.substring(0, 8) + '-';
		text += `${time}`.substring(8, 12) + '-';
		text += `${time}`.substring(12, 16) + '-';
		text += `${time}`.substring(16, 20) + '-';
		text += `${time}`.substring(17, 29);
		return text;
	}

	getOnesignal() {
		const current = this.getMicroTime();
		const time = md5(current + Math.floor(current / 1000));
		let text = `${time}`.substring(0, 8) + '-';
		text += `${time}`.substring(8, 12) + '-';
		text += `${time}`.substring(12, 16) + '-';
		text += `${time}`.substring(16, 20) + '-';
		text += `${time}`.substring(17, 29);
		return text;
	}
	hashSHA(plainText) {
		return hash.digest(plainText).toString('hex');
	}
	encryptData(plainText, key) {
		key = key.padEnd(32, 'x');
		key = key.slice(0, 32);
		return encrypt(plainText, 'AES-256-CBC', key, iv);
	}

	decryptData(encryptedText, key) {
		key = key.padEnd(32, 'x');
		key = key.slice(0, 32);
		return decrypt(encryptedText, 'AES-256-CBC', key, iv);
	}
	getCheckSum(data, type) {
		let checkSumSyntax = data['phone'] + this.getMicroTime() + '000000';
		const time = `${this.getMicroTime()}`;
		checkSumSyntax += type + time.slice(0, 1) + '.' + time.slice(1) + 'E12';
		return this.encryptData(checkSumSyntax, this.decryptData(data['setupkey'], data['ohash']));
	}
	getPHash(data) {
		const pHashSyntax = data['imei'] + '|' + data['password'];
		return this.encryptData(pHashSyntax, this.decryptData(data['setupkey'], data['ohash']));
	}
	encodeRSA(data, key) {
		const buffer = Buffer.from(data);
		const rsaEncoded = crypto.publicEncrypt(
			{
				key: key,
				padding: crypto.constants.RSA_PKCS1_PADDING,
			},
			buffer
		);
		return rsaEncoded.toString('base64');
	}
}
module.exports = Util;
