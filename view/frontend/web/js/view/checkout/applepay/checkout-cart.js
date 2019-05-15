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
        'mage/url',
        'Magento_Checkout/js/model/resource-url-manager',
        'Magento_Checkout/js/model/quote',
        'Magento_Checkout/js/action/create-shipping-address',
        'Magento_Checkout/js/action/select-shipping-address',
        'Magento_Checkout/js/action/create-billing-address',
        'Magento_Checkout/js/action/select-billing-address',
        'Magento_Checkout/js/action/select-payment-method',
        'Magento_Checkout/js/model/shipping-save-processor/payload-extender',
        'Magento_Checkout/js/checkout-data',
        'TIG_Buckaroo/js/action/place-order',
        'buckaroo/applepay/pay'
    ],
    function (
        $,
        urlBuilder,
        resourceUrlManager,
        quote,
        createShippingAddress,
        selectShippingAddress,
        createBillingAddress,
        selectBillingAddress,
        selectPaymentMethodAction,
        payloadExtender,
        checkoutData,
        placeOrderAction,
        applepayPay
    ) {
        'use strict';

        return {
            quote : null,

            showPayButton: function () {
                applepayPay.setQuote(quote);
                applepayPay.showPayButton();

                applepayPay.transactionResult.subscribe(
                    function () {
                        this.placeOrder();
                    }.bind(this)
                );
            },

            setQuote: function (setQuote) {
                this.quote = setQuote;
            },

            placeOrder: function () {
                quote.guestEmail = applepayPay.transactionResult().shippingContact.emailAddress;
                this.setShippingAddress();
                this.saveShipmentInfo();
                this.setBillingAddress();
                this.selectPaymentMethod();
                this.savePaymentInfo();

                var placeOrder = placeOrderAction(this.getData(), true, null);

                $.when(placeOrder).done(this.afterPlaceOrder.bind(this));
            },

            afterPlaceOrder: function () {
                var response = window.checkoutConfig.payment.buckaroo.response;
                response = $.parseJSON(response);
                if (response.RequiredAction !== undefined && response.RequiredAction.RedirectURL !== undefined) {
                    window.location.replace(response.RequiredAction.RedirectURL);
                }
            },

            setShippingAddress: function () {
                var address = applepayPay.transactionResult().shippingContact;
                var addressData = this.getAddressData(address);
                addressData.email = address.emailAddress;

                var newShippingAddress = createShippingAddress(addressData);
                selectShippingAddress(newShippingAddress);
                checkoutData.setSelectedShippingAddress(newShippingAddress.getKey());
                checkoutData.setNewCustomerShippingAddress($.extend(true, {}, addressData));
            },

            setBillingAddress: function () {
                var address = applepayPay.transactionResult().billingContact;
                var addressData = this.getAddressData(address);
                addressData.email = applepayPay.transactionResult().shippingContact.emailAddress;

                var newBillingAddress = createBillingAddress(addressData);
                selectBillingAddress(newBillingAddress);
                checkoutData.setSelectedBillingAddress(newBillingAddress.getKey());
                checkoutData.setNewCustomerBillingAddress($.extend(true, {}, addressData));
            },

            getAddressData: function (address) {
                var addressData = {
                    firstname: address.givenName,
                    lastname: address.familyName,
                    comapny: '',
                    street: [address.addressLines.join(' ')],
                    city: address.locality,
                    postcode: address.postalCode,
                    region: address.administrativeArea,
                    region_id: 0,
                    country_id: address.countryCode,
                    telephone: '0201234567',
                    save_in_address_book: 0,
                };

                return addressData;
            },

            selectPaymentMethod: function () {
                selectPaymentMethodAction(this.getData());
                checkoutData.setSelectedPaymentMethod('tig_buckaroo_applepay');

                return true;
            },

            saveShipmentInfo: function () {
                var payload;

                if (!quote.billingAddress()) {
                    selectBillingAddress(quote.shippingAddress());
                }

                payload = {
                    addressInformation: {
                        'shipping_address': quote.shippingAddress(),
                        'billing_address': quote.billingAddress(),
                        'shipping_method_code': quote.shippingMethod()['method_code'],
                        'shipping_carrier_code': quote.shippingMethod()['carrier_code']
                    }
                };

                payloadExtender(payload);

                var url = resourceUrlManager.getUrlForSetShippingInformation(quote);

                $.ajax({
                    url: urlBuilder.build(url),
                    type: 'POST',
                    data: JSON.stringify(payload),
                    global: false,
                    contentType: 'application/json',
                    async: false
                });
            },

            savePaymentInfo: function () {
                var params = {};
                var payload = {};

                if (resourceUrlManager.getCheckoutMethod() == 'guest') {
                    params = {
                        cartId: quote.getQuoteId()
                    };
                    payload.email = quote.guestEmail;
                }

                var urls = {
                    'guest': '/guest-carts/:cartId/set-payment-information',
                    'customer': '/carts/mine/set-payment-information'
                };
                var url = resourceUrlManager.getUrl(urls, params);

                payload.paymentMethod = {
                    method: 'tig_buckaroo_applepay',
                    additional_data: {
                        buckaroo_skip_validation: true
                    }
                };
                payload.billingAddress = quote.billingAddress();
                payload.shippingAddress = quote.shippingAddress();

                $.ajax({
                    url: urlBuilder.build(url),
                    type: 'POST',
                    data: JSON.stringify(payload),
                    global: false,
                    contentType: 'application/json',
                    async: false
                }).done(function (result) {
                }.bind(this));
            },

            getData: function () {
                var transactionData = this.formatTransactionResponse(applepayPay.transactionResult());

                return {
                    "method": 'tig_buckaroo_applepay',
                    "po_number": null,
                    "additional_data": {
                        "applepayTransaction" : transactionData
                    }
                };
            },

            formatTransactionResponse: function (response) {
                if (null === response || 'undefined' === response) {
                    return null;
                }

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
