/**
 *
 *          ..::..
 *     ..::::::::::::..
 *   ::'''''':''::'''''::
 *   ::..  ..:  :  ....::
 *   ::::  :::  :  :   ::
 *   ::::  :::  :  ''' ::
 *   ::::..:::..::.....::
 *     ''::::::::::::''
 *          ''::''
 *
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Creative Commons License.
 * It is available through the world-wide-web at this URL:
 * http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US
 * If you are unable to obtain it through the world-wide-web, please send an email
 * to support@tig.nl so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this module to newer
 * versions in the future. If you wish to customize this module for your
 * needs please contact support@tig.nl for more information.
 *
 * @copyright   Copyright (c) Total Internet Group B.V. https://tig.nl/copyright
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US
 */
define(
    [
        'jquery',
        'ko',
        'mage/url',
        'Magento_Checkout/js/model/resource-url-manager',
        'Magento_Checkout/js/action/create-shipping-address',
        'Magento_Checkout/js/action/select-shipping-address',
        'Magento_Checkout/js/action/select-shipping-method',
        'Magento_Checkout/js/checkout-data',
        'Magento_Checkout/js/model/shipping-rate-service',
        'mage/translate',
        'BuckarooSDK'
    ],
    function (
        $,
        ko,
        urlBuilder,
        resourceUrlManager,
        createShippingAddress,
        selectShippingAddress,
        selectShippingMethod,
        checkoutData,
    ) {
        'use strict';

        var transactionResult = ko.observable(null);

        return {
            transactionResult : transactionResult,
            applepayOptions : null,
            isOnCheckout : false,
            quote : null,
            shippingGroups: {},

            showPayButton: function () {
                BuckarooSdk.ApplePay.checkApplePaySupport(window.checkoutConfig.payment.buckaroo.applepay.guid).then(
                    function (applePaySupported) {
                        if (applePaySupported) {
                            this.generateApplepayOptions();

                            var payment = new BuckarooSdk.ApplePay.ApplePayPayment('#apple-pay-wrapper', this.applepayOptions);
                            payment.showPayButton('black');
                        }
                    }.bind(this)
                );
            },

            /**
             * @param newQuote
             */
            setQuote: function (newQuote) {
                this.quote = newQuote;
            },

            /**
             * @param isOnCheckout
             */
            setIsOnCheckout: function (isOnCheckout) {
                this.isOnCheckout = isOnCheckout;
            },

            generateApplepayOptions: function () {
                var self = this;
                var shippingMethods = null;
                var shippingContactCallback = null;
                var shipmentMethodCallback = null;

                var country = window.checkoutConfig.payment.buckaroo.applepay.cultureCode.toUpperCase();
                if (null !== this.quote.shippingAddress()) {
                    country = this.quote.shippingAddress().countryId;
                }

                if (this.isOnCheckout) {
                    shippingMethods = self.quoteShippingMethodInformation();
                } else {
                    shippingMethods = self.availableShippingMethodInformation();
                    shippingContactCallback = self.onSelectedShippingContact.bind(this);
                    shipmentMethodCallback = self.onSelectedShipmentMethod.bind(this);
                }

                this.applepayOptions = new BuckarooSdk.ApplePay.ApplePayOptions(
                    window.checkoutConfig.payment.buckaroo.applepay.storeName,
                    country,
                    window.checkoutConfig.quoteData.quote_currency_code,
                    window.checkoutConfig.payment.buckaroo.applepay.cultureCode,
                    window.checkoutConfig.payment.buckaroo.applepay.guid,
                    self.processLineItems(),
                    self.processTotalLineItems(),
                    "shipping",
                    shippingMethods,
                    self.captureFunds.bind(this),
                    shipmentMethodCallback,
                    shippingContactCallback
                );
            },

            /**
             * @returns {{amount: string, label, type: string}[]}
             */
            processLineItems: function () {
                var subTotal = parseFloat(this.quote.totals().subtotal).toFixed(2);
                var shippingInclTax = parseFloat(this.quote.totals().shipping_incl_tax).toFixed(2);

                return [
                    {label: $.mage.__('Subtotal'), amount: subTotal, type: 'final'},
                    {label: $.mage.__('Delivery'), amount: shippingInclTax, type: 'final'}
                ];
            },

            /**
             * @returns {{amount: string, label: *, type: string}}
             */
            processTotalLineItems: function () {
                var grandTotal = parseFloat(this.quote.totals().grand_total).toFixed(2);
                var storeName = window.checkoutConfig.payment.buckaroo.applepay.storeName;

                return {label: storeName, amount: grandTotal, type: 'final'};
            },

            /**
             * @returns {{identifier: (string), amount: string, label: string, detail}[]}
             */
            quoteShippingMethodInformation: function () {
                if (null === this.quote.shippingMethod()) {
                    return [];
                }

                var shippingInclTax = parseFloat(this.quote.totals().shipping_incl_tax).toFixed(2);
                var shippingTitle = this.quote.shippingMethod().carrier_title + ' (' + this.quote.shippingMethod().method_title + ')';

                return [{
                    label: shippingTitle,
                    amount: shippingInclTax,
                    identifier: this.quote.shippingMethod().method_code,
                    detail: $.mage.__('Shipping Method selected during checkout.')
                }];
            },

            availableShippingMethodInformation: function () {
                var shippingMethods = [];

                $.each(this.shippingGroups, function (index, rate) {
                    var shippingInclTax = parseFloat(rate['price_incl_tax']).toFixed(2);

                    shippingMethods.push({
                        label: rate['carrier_title'],
                        amount: shippingInclTax,
                        identifier: rate['method_code'],
                        detail: rate['method_title']
                    });
                });

                return shippingMethods;
            },

            onSelectedShipmentMethod: function (event) {
                var newShippingMethod = this.shippingGroups[event.identifier];

                selectShippingMethod(newShippingMethod);
                checkoutData.setSelectedShippingRate(newShippingMethod['carrier_code'] + '_' + newShippingMethod['method_code']);

                var subtotal = this.quote.totals().subtotal;
                this.quote.totals().shipping_incl_tax = newShippingMethod['price_incl_tax'];
                this.quote.totals().grand_total = subtotal + newShippingMethod['price_incl_tax'];

                var authorizationResult = {
                    newTotal: this.processTotalLineItems(),
                    newLineItems: this.processLineItems()
                };

                return Promise.resolve(authorizationResult);
            },

            onSelectedShippingContact: function (event) {
                var newShippingAddress = this.setNewQuoteAddress(event);
                this.updateShippingMethods(newShippingAddress);

                var authorizationResult = {
                    errors: [],
                    newShippingMethods: this.availableShippingMethodInformation(),
                    newTotal: this.processTotalLineItems(),
                    newLineItems: this.processLineItems()
                };

                return Promise.resolve(authorizationResult);
            },

            setNewQuoteAddress: function (address) {
                var addressData = {
                    firstname: address.givenName,
                    lastname: address.familyName,
                    comapny: '',
                    street: [''],
                    city: address.locality,
                    postcode: address.postalCode,
                    region: address.administrativeArea,
                    region_id: '',
                    country_id: address.countryCode,
                    telephone: '',
                    save_in_address_book: 0
                };

                var newShippingAddress = createShippingAddress(addressData);
                selectShippingAddress(newShippingAddress);
                checkoutData.setSelectedShippingAddress(newShippingAddress.getKey());
                checkoutData.setNewCustomerShippingAddress($.extend(true, {}, addressData));

                return newShippingAddress;
            },

            updateShippingMethods: function (address) {
                var serviceUrl = resourceUrlManager.getUrlForEstimationShippingMethodsForNewAddress(this.quote);
                var payload = JSON.stringify({
                    address: {
                        'street': address.street,
                        'city': address.city,
                        'region_id': address.regionId,
                        'region': address.region,
                        'country_id': address.countryId,
                        'postcode': address.postcode,
                        'firstname': address.firstname,
                        'lastname': address.lastname,
                        'company': address.company,
                        'telephone': address.telephone,
                        'custom_attributes': address.customAttributes,
                        'save_in_address_book': address.saveInAddressBook
                    }
                });

                $.ajax({
                    url: urlBuilder.build(serviceUrl),
                    type: 'POST',
                    data: payload,
                    global: false,
                    contentType: 'application/json',
                    async: false
                }).done(function (result) {
                    this.shippingGroups = {};

                    $.each(result, function (index, rate) {
                        this.shippingGroups[rate['method_code']] = rate;
                    }.bind(this));
                }.bind(this));
            },

            /**
             * @param payment
             * @returns {Promise<{errors: Array, status: *}>}
             */
            captureFunds: function (payment) {
                var authorizationResult = {
                    status: ApplePaySession.STATUS_SUCCESS,
                    errors: []
                };

                this.transactionResult(payment);

                $('#debug-wrapper').removeClass('d-none');
                $('#debug').html(JSON.stringify(payment));

                if (authorizationResult.status !== ApplePaySession.STATUS_SUCCESS) {
                    var errors = authorizationResult.errors.map(function (error) {
                        return error.message
                    });

                    this.showError($.mage.__('Your payment could not be processed: ') + errors.join(' '));

                    authorizationResult.errors.forEach(function (error) {
                        console.error(error.message + ' (' + error.contactField + ': ' + error.code + ').');
                    })
                }

                return Promise.resolve(authorizationResult)
            },

            /**
             * @param response
             * @returns {string}
             */
            formatPaymentResponse: function (response) {
                var paymentData = response.token.paymentData;

                var formattedData = {
                    "paymentData": {
                        "version": paymentData.version,
                        "data": paymentData.data,
                        "signature": paymentData.signature,
                        "header": {
                            "ephemeralPublicKey": paymentData.header.ephemeralPublicKey,
                            "publicKeyHash": paymentData.header.publicKeyHash,
                            "transactionId": paymentData.header.transactionId,
                        }
                    }
                };

                return JSON.stringify(formattedData);
            }
        };
    }
);
