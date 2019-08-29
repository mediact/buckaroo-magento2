<?php
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

namespace TIG\Buckaroo\Model\Method;

use Magento\Payment\Model\InfoInterface;
use Magento\Sales\Api\Data\OrderPaymentInterface;
use Magento\Sales\Model\Order\Address;
use TIG\Buckaroo\Model\ConfigProvider\Method\CapayableIn3 as CapayableIn3ConfigProvider;

class CapayableIn3 extends AbstractMethod
{
    /** Payment Code */
    const PAYMENT_METHOD_CODE = 'tig_buckaroo_capayablein3';

    /** @var string */
    public $buckarooPaymentMethodCode = 'capayablein3';

    // @codingStandardsIgnoreStart
    /** @var string */
    protected $_code = self::PAYMENT_METHOD_CODE;

    /** @var bool */
    protected $_isGateway               = true;

    /** @var bool */
    protected $_canOrder                = true;

    /** @var bool */
    protected $_canRefund               = true;

    /** @var bool */
    protected $_canVoid                 = true;

    /** @var bool */
    protected $_canUseInternal          = false;

    /** @var bool */
    protected $_canRefundInvoicePartial = true;
    // @codingStandardsIgnoreEnd

    /** @var bool */
    public $usesRedirect                = false;

    /**
     * {@inheritdoc}
     */
    public function getOrderTransactionBuilder($payment)
    {
        $transactionBuilder = $this->transactionBuilderFactory->get('order');

        $services = [];
        $services[] = $this->getCapayableService($payment);

        /**
         * Buckaroo Push is send before Response, for correct flow we skip the first push
         * @todo when buckaroo changes the push / response order this can be removed
         */
        $payment->setAdditionalInformation('skip_push', 1);

        $transactionBuilder->setOrder($payment->getOrder())
            ->setServices($services)
            ->setMethod('TransactionRequest');

        return $transactionBuilder;
    }

    /**
     * @param OrderPaymentInterface|InfoInterface $payment
     *
     * @return array
     * @throws \TIG\Buckaroo\Exception
     */
    public function getCapayableService($payment)
    {
        $now = new \DateTime();

        /** @var CapayableIn3ConfigProvider $capayableConfig */
        $capayableConfig = $this->configProviderMethodFactory->get($this->buckarooPaymentMethodCode);

        /**@var Address $billingAddress */
        $billingAddress = $payment->getOrder()->getBillingAddress();

        $services = [
            'Name'             => 'capayable',
            'Action'           => 'Pay',
            'Version'          => 1,
            'RequestParameter' => [
                [
                    '_'    => $billingAddress->getFirstname(),
                    'Name' => 'CustomerFirstName',
                ],
                [
                    '_'    => $billingAddress->getLastname(),
                    'Name' => 'CustomerLastName',
                ],
                [
                    '_'    => $billingAddress->getCountryId(),
                    'Name' => 'CustomerCountry',
                ],
                [
                    '_'    => $payment->getOrder()->getCustomerEmail(),
                    'Name' => 'CustomerEmail',
                ],
                [
                    '_'    => $now->format('Y-m-d'),
                    'Name' => 'DateDue'
                ],
                [
                    '_'    => $capayableConfig->getSendEmail(),
                    'Name' => 'SendMail'
                ]
            ],
        ];

        return $services;
    }

    /**
     * {@inheritdoc}
     */
    public function getCaptureTransactionBuilder($payment)
    {
        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function getAuthorizeTransactionBuilder($payment)
    {
        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function getRefundTransactionBuilder($payment)
    {
        $transactionBuilder = $this->transactionBuilderFactory->get('refund');

        $services = [
            'Name'    => $this->buckarooPaymentMethodCode,
            'Action'  => 'Refund',
            'Version' => 1,
        ];

        $requestParams = $this->addExtraFields($this->_code);
        $services = array_merge($services, $requestParams);

        $transactionBuilder->setOrder($payment->getOrder())
            ->setServices($services)
            ->setMethod('TransactionRequest')
            ->setOriginalTransactionKey(
                $payment->getAdditionalInformation(self::BUCKAROO_ORIGINAL_TRANSACTION_KEY_KEY)
            );

        return $transactionBuilder;
    }

    /**
     * {@inheritdoc}
     */
    public function getVoidTransactionBuilder($payment)
    {
        return true;
    }
}
