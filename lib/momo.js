const md5 = require('md5');
const axios = require('axios').default;
const Util = require('./util');
const util = new Util();
class Momo {
	static signal = {
		INIT: 0,
		GET_OTP_SUCCESS: 1,
		GET_OTP_FAILED: -1,
		CHECK_OTP_SUCCESS: 2,
		CHECK_OTP_FAIL: -2,
		LOGIN_SUCCESS: 3,
		LOGIN_FAIL: -3,
	};
	status = Momo.signal.INIT;
	debugging = true;
	auth_token = '';
	ENCRYPT_KEY = '';
	onChangeStatus = null;
	constructor(
		phone,
		password,
		rkey = '',
		imei = '',
		onesignal = '',
		otp = '',
		ohash = '',
		setupkey = ''
	) {
		this.phone = phone;
		this.password = password;
		this.rkey = rkey;
		this.imei = imei;
		this.onesignal = onesignal;
		this.otp = otp;
		this.ohash = ohash;
		this.setupkey = setupkey;
		if (!rkey || !imei || !onesignal) this.init();
		else this.setStatus(Momo.signal.LOGIN_SUCCESS);
		this.api = axios.create({});
	}

	init() {
		this.debug('Initial');
		this.rkey = util.getRandomKey(20);
		this.imei = util.getImei();
		this.onesignal = util.getOnesignal();
		this.status = Momo.signal.INIT;
	}

	setStatus(status) {
		if (status == this.status) return;
		console.log(`Status: ${this.status} -> ${status}`);
		this.status = status;
		if (typeof this.onChangeStatus === 'function') this.onChangeStatus(status);
	}

	getDefaultData() {
		const timestamp = util.getMicroTime();
		return {
			user: this.phone,
			msgType: '',
			cmdId: timestamp + '000000',
			lang: 'vi',
			time: timestamp,
			channel: 'APP',
			appVer: 30143,
			appCode: '3.0.14',
			deviceOS: 'IOS',
			buildNumber: 0,
			appId: 'vn.momo.platform',
			result: true,
			errorCode: 0,
			errorDesc: '',
		};
	}

	async getOTP() {
		try {
			const form = this.getDefaultData();
			const url = 'https://owa.momo.vn/public';
			const data_body = {
				...form,
				msgType: 'SEND_OTP_MSG',
				extra: {
					action: 'SEND',
					rkey: this.rkey,
					AAID: '',
					IDFA: '',
					TOKEN: '',
					ONESIGNAL_TOKEN: this.onesignal,
					SIMULATOR: 'false',
					isVoice: 'true',
					REQUIRE_HASH_STRING_OTP: false,
				},
				momoMsg: {
					_class: 'mservice.backend.entity.msg.RegDeviceMsg',
					number: this.phone,
					imei: this.imei,
					cname: 'Vietnam',
					ccode: '084',
					device: 'iPhone 11',
					firmware: '13.5.1',
					hardware: 'iPhone',
					manufacture: 'Apple',
					csp: 'Viettel',
					icc: '',
					mcc: '452',
					mnc: '04',
					device_os: 'IOS',
				},
			};
			const headers = {
				'User-Agent': 'MoMoPlatform-Release/30143 CFNetwork/1220.1 Darwin/20.3.0',
				Msgtype: 'SEND_OTP_MSG',
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Userhash: md5(this.phone),
			};
			const res = await this.api.post(url, JSON.stringify(data_body), { headers });
			const data = res?.data;
			this.debug(res);
			if (data?.result) {
				this.setStatus(Momo.signal.GET_OTP_SUCCESS);
			} else this.setStatus(Momo.signal.GET_OTP_FAILED);
		} catch (e) {
			this.reportError(e);
			this.setStatus(Momo.signal.GET_OTP_FAILED);
		}
	}

	async checkOTP(otp) {
		const url = 'https://owa.momo.vn/public';
		const ohash = util.hashSHA(this.phone + this.rkey + this.otp);
		const form = this.getDefaultData();
		const data_body = {
			...form,
			msgType: 'REG_DEVICE_MSG',
			extra: {
				ohash,
				AAID: '',
				IDFA: '',
				TOKEN: '',
				ONESIGNAL_TOKEN: this.onesignal,
				SIMULATOR: 'false',
			},
			momoMsg: {
				_class: 'mservice.backend.entity.msg.RegDeviceMsg',
				number: this.phone,
				imei: this.imei,
				cname: 'Vietnam',
				ccode: '084',
				device: 'iPhone 11',
				firmware: '13.5.1',
				hardware: 'iPhone',
				manufacture: 'Apple',
				csp: 'Viettel',
				icc: '',
				mcc: '452',
				mnc: '04',
				device_os: 'IOS',
			},
		};
		const headers = {
			'User-Agent': 'MoMoPlatform-Release/30143 CFNetwork/1220.1 Darwin/20.3.0',
			Msgtype: 'REG_DEVICE_MSG',
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Userhash: md5(this.phone),
		};

		const res = await this.api.post(url, JSON.stringify(data_body), { headers });
		const data = res?.data;

		this.debug(res);

		if (data?.result) {
			this.setStatus(Momo.signal.CHECK_OTP_SUCCESS);
			this.otp = otp;
		} else {
			this.setStatus(Momo.signal.CHECK_OTP_FAIL);
			this.reportError(data?.errorDesc);
		}
	}

	async login() {
		const form = this.getDefaultData();
		const url = 'https://owa.momo.vn/public';
		const data_body = {
			...form,
			pass: this.password,
			msgType: 'USER_LOGIN_MSG',
			extra: {
				checkSum: util.getCheckSum(this, 'USER_LOGIN_MSG'),
				pHash: util.getPHash(this),
				AAID: '',
				IDFA: '',
				TOKEN: '',
				ONESIGNAL_TOKEN: this.onesignal,
				SIMULATOR: false,
			},
			momoMsg: {
				_class: 'mservice.backend.entity.msg.LoginMsg',
				isSetup: true,
			},
		};

		const header = {
			'User-Agent': 'MoMoPlatform-Release/30143 CFNetwork/1220.1 Darwin/20.3.0',
			Msgtype: 'USER_LOGIN_MSG',
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Userhash: md5(this.phone),
		};

		const res = await this.api.post(url, JSON.stringify(data_body), {
			headers: header,
		});

		// this.debug(res.data);

		const data = res?.data;
		if (data?.result) {
			this.setStatus(Momo.signal.LOGIN_SUCCESS);
			this.ENCRYPT_KEY = data?.extra?.REQUEST_ENCRYPT_KEY;
			this.auth_token = data?.extra?.AUTH_TOKEN;
			this.debug(`Login to ${data?.momoMsg?.name}`);
			return true;
		} else {
			this.setStatus(Momo.signal.LOGIN_FAIL);
			this.reportError(data?.errorDesc);
			return false;
		}
	}

	async getHistory(hour = 1) {
		try {
			const requestKeyRaw = util.getRandomKey(32);
			const requestKey = util.encodeRSA(requestKeyRaw, this.ENCRYPT_KEY);
			const form = this.getDefaultData();
			const data_post = {
				...form,
				msgType: 'QUERY_TRAN_HIS_MSG',
				extra: {
					checkSum: util.getCheckSum(this, 'QUERY_TRAN_HIS_MSG'),
				},
				momoMsg: {
					_class: 'mservice.backend.entity.msg.QueryTranhisMsg',
					begin: util.getMicroTime() - hour * 24 * 60 * 60 * 1000,
					end: util.getMicroTime(),
				},
			};
			const header = {
				Msgtype: 'QUERY_TRAN_HIS_MSG',
				Accept: 'application/json',
				'Content-Type': 'application/json',
				requestkey: requestKey,
				userid: this.phone,
				Authorization: 'Bearer ' + this.auth_token,
			};
			const url = 'https://owa.momo.vn/api/sync/QUERY_TRAN_HIS_MSG';
			const res = await this.api({
				url,
				headers: header,
				data: util.encryptData(JSON.stringify(data_post), requestKeyRaw),
				method: 'POST',
			});
			if (res?.data) {
				const data = JSON.parse(util.decryptData(res.data, requestKeyRaw));
				return data?.momoMsg?.tranList || [];
			}
			return [];
		} catch (error) {
			return [];
		}
	}
	exportSession() {
		const { phone, password, rkey, imei, onesignal, otp, setupkey, ohash, status } = this;
		return JSON.stringify({ phone, password, rkey, imei, onesignal, otp, setupkey, ohash, status });
	}

	static importSession(json) {
		const { phone, password, rkey, imei, onesignal, otp, setupkey, ohash, status } =
			JSON.parse(json);
		const momo = new Momo(phone, password, rkey, imei, onesignal, otp, ohash, setupkey);
		momo.setStatus(status);
		return momo;
	}

	reportError(e) {
		console.log(e?.stack || e);
	}

	debug(message) {
		if (this.debugging) console.log(message);
	}
}
module.exports = Momo;
