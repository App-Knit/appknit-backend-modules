/**
 * @desc The module containing the stripe related functionality
 * to handle the stripe payments
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */
import Stripe from 'stripe';
import { ResponseUtility } from '../utility';

const { STRIPE_SECRET_KEY } = process.env;
const stripe = new Stripe(STRIPE_SECRET_KEY);
/**
 * create a unique stripe user. Will check from database
 * regarding the existence and will be called if key has not
 * been generated already for an existing user.
 * This will create the new user with credit card details.
 * Usually, this will be created for the student account
 * @param {String} email
 * @param {String} id
 * @param {String} card, to be provided for student profile
 * @param {String} bank, to be provided for teacher profile
 * either user email or id is required
 * either card or bank token of the user is required.
 */
const CreateUser = ({
	email,
	id,
	card,
}) => new Promise(async (resolve, reject) => {
	if ((email || id) && card) {
		stripe.customers.create({
			email: email || id,
			description: `Stripe details for ${email || id} customer`,
			source: card,
		}).then((success) => {
			const object = { altered: success, raw: success };
			resolve(object);
		}).catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
 * remove the requested card from the list
 *@see https://stripe.com/docs/api#delete_card
 * @param {*} param0
 */
const RemoveCard = ({ customerId, cardId }) => new Promise((resolve, reject) => {
	// console.log(customerId, cardId);
	if (customerId && cardId) {
		stripe.customers.deleteCard(customerId, cardId)
			.then((success) => {
				resolve(success);
			}).catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});
/**
 * delete an external stripe account
 * This is invoked when a suer requests ot remove a linked banked
 * account with the external account.
 * @param {*} param0
 */
const RemoveExternalAccount = ({ accountId, bankId }) => new Promise((resolve, reject) => {
	if (accountId) {
		stripe.accounts.deleteExternalAccount(accountId, bankId)
			.then(success => resolve(success))
			.catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
 * accept the new bank account details and replace it with the new ones
 * @param {*} param0
 */
const UpdateExternalAccount = ({ accountId, externalAccount }) => new Promise((resolve, reject) => {
	if (accountId && externalAccount) {
		stripe.accounts.update(accountId, {
			external_account: externalAccount,
		})
			.then(success => resolve(success))
			.catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
 * Create a new bank user
 */
const CreateBankUser = ({
	email,
	token,	// the bank account id
	personalDetails: {
		address: {
			city,
			country,
			line1,
			postal,
			state,
		},
		dob: {
			day,
			month,
			year,
		},
		firstName,
		lastName,
		type,
		ip,
	},
	verificationDocumentData,
}) => new Promise(async (resolve, reject) => {
	if (email && token && city && line1 && postal && state
		&& day && month && year && firstName && lastName && type && ip) {
		/**
		 * create a user with bank account
		 * process with sripe connect API
		 * 1. create a new account with stripe connect API
		 * 2. Add a bank account via token,
		 */
		const account = await stripe.account.create({ type: 'custom', country: 'AU', email });
		if (account) {
			const { id } = account;
			const updatedAccount = await stripe.accounts.update(id, {
				external_account: token,
				tos_acceptance: {
					date: Math.floor(Date.now() / 1000),
					ip,
				},
				legal_entity: {
					address: {
						city,
						country,
						line1,
						postal_code: postal,
						state,
					},
					first_name: firstName,
					last_name: lastName,
					type,
					dob: {
						day,
						month,
						year,
					},
				},
			});
			// console.log(updatedAccount);
			if (updatedAccount) {
				// upload the verrificaiton document here.
				const upload = await stripe.fileUploads.create(
					{
						purpose: 'identity_document',
						file: {
							data: verificationDocumentData,
							name: '',
							type: 'application/octect-stream',
						},
					},
					{ stripe_account: id },
				);

				/**
				 * @todo parse the returned token and attach it with the
				 * stripe account
				 */
				const attach = await stripe.accounts.update(id, {
					legal_entity: {
						verification: {
							document: upload.id,
						},
					},
				});
				console.log(attach);
				// added an partner account with bank account.
				const response = { altered: { id: updatedAccount.id, default_source: updatedAccount.external_accounts.data[0].id }, raw: updatedAccount };
				resolve(response);
			} else {
				reject(ResponseUtility.GENERIC_ERR({ message: 'Erro adding external account to the created partner account ' }));
			}
		}
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
 * create a new payment for the provided source. Handle respective errror
 * @param {Number} amount
 * @param {String} currency
 * @param {String} source the id of the card
 * @param {String} description
 */
const CreatePayment = ({
	amount,
	currency = 'AUD',
	source,
	customer,
	description,
}) => new Promise((resolve, reject) => {
	if (amount && currency && source) {
		stripe.charges.create({
			amount,
			currency,
			source,
			customer,
			description,
		})
			.then(success => resolve(success))
			.catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
 * handle the payout to the teachers account
 * @param amount
 * @param description
 * @param destination The ID of a bank account or a card to send the payout to.
 * If no destination is supplied, the default external account for the specified
 * currency will be used.
 * @param sourceType The source balance to draw this payout from. Balances for
 * different payment sources are kept separately. You can find the amounts with
 * the balances API. Valid options are: alipay_account, bank_account, and card.
 * @see https://stripe.com/docs/api/node#create_payout for more
 * @return Promise
 */
const HandlePayout = ({
	amount,
	description,
	destination,
	sourceType,
}) => new Promise((resolve, reject) => {
	/**
	 * @todo handle payouts implementation
	 */
	if (amount && description && destination) {
		stripe.transfers.create({
			amount,
			destination,
			currency: 'aud',
			transfer_group: 'TEST_TRANSFERS',
		})
			.then(success => resolve(ResponseUtility.SUCCESS({ data: success })))
			.catch(err => reject(ResponseUtility.GENERIC_ERR({ message: '', error: err })));
	}
});

/**
 * cerate a customer account to handle payouts
 * @see https://stripe.com/docs/api/node#create_account
 * @param {String} email
 */
const CreateCustomAccount = ({ email }) => new Promise((resolve, reject) => {
	stripe.accounts.create({
		type: 'custom',
		country: 'AU',
		email,
	}).then((account) => {
		resolve(account);
	}).catch(err => reject(err));
});

/**
 * add externa account to a stripe connect account.
 * use the stripe account update function to add external account
 */
const AddExternalAccount = ({ account, businessName, token }) => new Promise((resolve, reject) => {
	if (account && (businessName || token)) {
		stripe.accounts.update(account, {
			business_name: businessName,
			external_account: token,
		}).then((success) => {
			resolve(success);
		}).catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
 * process the refeund based on the incurred charge
 * @param {String} chargeId the id of the charge to process refund.
 * @param {Number} amount if defined, the amount of money will be refunded, By deducting some charges
 */
const ProcessRefund = ({ chargeId, amount }) => new Promise(async (resolve, reject) => {
	if (!chargeId && !amount) {
		return reject(ResponseUtility.MISSING_REQUIRES_PROPS);
	}
	// console.log('here');
	if (amount) {
		try {
			const chargeResponse = await stripe.refunds.create({
				charge: chargeId,
				amount,
			});
			return resolve(chargeResponse);
		} catch (err) {
			return reject(err);
		}
	}

	try {
		const response = await stripe.refunds.create({
			charge: chargeId,
		});
		resolve(response);
	} catch (err) {
		// console.log(err);
		reject(err);
	}
});

export default {
	stripe,
	CreateUser,
	CreatePayment,
	HandlePayout,
	CreateCustomAccount,
	AddExternalAccount,
	CreateBankUser,
	ProcessRefund,
	RemoveCard,
	RemoveExternalAccount,
	UpdateExternalAccount,
};
