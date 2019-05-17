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
        'buckaroo/applepay/shipping-handler',
        'Magento_Checkout/js/model/shipping-rate-service',
        'mage/translate',
        'BuckarooSDK'
    ],
    function (
        $,
        ko,
        urlBuilder,
        resourceUrlManager,
        shippingHandler
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
                if (typeof window.checkoutConfig === 'undefined') {
                    return;
                }

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
                var shippingMethods = self.availableShippingMethodInformation();
                var shippingContactCallback = self.onSelectedShippingContact.bind(this);
                var shipmentMethodCallback = self.onSelectedShipmentMethod.bind(this);
                var requiredContactFields = void 0;

                var country = window.checkoutConfig.payment.buckaroo.applepay.cultureCode.toUpperCase();
                if (null !== this.quote.shippingAddress()) {
                    country = this.quote.shippingAddress().countryId;
                }

                if (this.isOnCheckout) {
                    shippingMethods = [];
                    shippingContactCallback = null;
                    shipmentMethodCallback = null;
                    requiredContactFields = [];
                }

                this.applepayOptions = new BuckarooSdk.ApplePay.ApplePayOptions(
                    window.checkoutConfig.payment.buckaroo.applepay.storeName,
                    country,
                    window.checkoutConfig.payment.buckaroo.applepay.currency,
                    window.checkoutConfig.payment.buckaroo.applepay.cultureCode,
                    window.checkoutConfig.payment.buckaroo.applepay.guid,
                    self.processLineItems(),
                    self.processTotalLineItems(),
                    "shipping",
                    shippingMethods,
                    self.captureFunds.bind(this),
                    shipmentMethodCallback,
                    shippingContactCallback,
                    requiredContactFields,
                    requiredContactFields
                );
            },

            /**
             * @returns {{amount: string, label, type: string}[]}
             */
            processLineItems: function () {
                var subTotal = '0.00';
                var shippingInclTax = '0.00';

                if (typeof this.quote.totals() !== 'undefined') {
                    subTotal = parseFloat(this.quote.totals().subtotal).toFixed(2);
                    shippingInclTax = parseFloat(this.quote.totals().shipping_incl_tax).toFixed(2);
                }

                return [
                    {label: $.mage.__('Subtotal'), amount: subTotal, type: 'final'},
                    {label: $.mage.__('Delivery'), amount: shippingInclTax, type: 'final'}
                ];
            },

            /**
             * @returns {{amount: string, label: *, type: string}}
             */
            processTotalLineItems: function () {
                var grandTotal = '0.00';
                var storeName = window.checkoutConfig.payment.buckaroo.applepay.storeName;

                if (typeof this.quote.totals() !== 'undefined') {
                    grandTotal = parseFloat(this.quote.totals().grand_total).toFixed(2);
                }

                return {label: storeName, amount: grandTotal, type: 'final'};
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
                this.updateQuoteRate(newShippingMethod);

                var authorizationResult = {
                    newTotal: this.processTotalLineItems(),
                    newLineItems: this.processLineItems()
                };

                return Promise.resolve(authorizationResult);
            },

            onSelectedShippingContact: function (event) {
                var newShippingAddress = shippingHandler.setShippingAddress(event);
                this.updateShippingMethods(newShippingAddress);

                var authorizationResult = {
                    errors: [],
                    newShippingMethods: this.availableShippingMethodInformation(),
                    newTotal: this.processTotalLineItems(),
                    newLineItems: this.processLineItems()
                };

                return Promise.resolve(authorizationResult);
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
                    var firstLoop = true;

                    $.each(result, function (index, rate) {
                        this.shippingGroups[rate['method_code']] = rate;

                        if (firstLoop) {
                            this.updateQuoteRate(rate);
                            firstLoop = false;
                        }
                    }.bind(this));
                }.bind(this));
            },

            updateQuoteRate: function (newRate) {
                shippingHandler.selectShippingMethod(newRate);

                var subtotal = this.quote.totals().subtotal;
                this.quote.totals().shipping_incl_tax = newRate['price_incl_tax'];
                this.quote.totals().grand_total = subtotal + newRate['price_incl_tax'];
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
            }
        };
    }
);
