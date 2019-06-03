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
namespace TIG\Buckaroo\Test\Unit\Model;

use TIG\Buckaroo\Test\BaseTest;
use TIG\Buckaroo\Model\PaymentInformationManagement;

class PaymentInformationManagementTest extends BaseTest
{
    protected $instanceClass = PaymentInformationManagement::class;

    /**
     * @return array
     */
    public function normalizePaymentMethodCodeProvider()
    {
        return [
            'no method code' => [
                null,
                ''
            ],
            'emptry string' => [
                '',
                ''
            ],
            'lower case, tig_buckaroo_ at start' => [
                'tig_buckaroo_ideal',
                'ideal'
            ],
            'lower case, tig_buckaroo_ at end' => [
                'epstig_buckaroo_',
                'eps'
            ],
            'lower case, tig_buckaroo_ at middle' => [
                'bank_tig_buckaroo_transfer',
                'bank_transfer'
            ],
            'lower case only' => [
                'giropay_method',
                'giropay_method'
            ],
            'upper case, tig_buckaroo_ at start' => [
                'tig_buckaroo_iDEAL',
                'ideal'
            ],
            'upper case, tig_buckaroo_ at end' => [
                'Epstig_buckaroo_',
                'eps'
            ],
            'upper case, tig_buckaroo_ at middle' => [
                'BANK_tig_buckaroo_Transfer',
                'bank_transfer'
            ],
            'upper case only' => [
                'GiroPay_Method',
                'giropay_method'
            ],
            'tig_buckaroo_ in upper case' => [
                'Tig_Buckaroo_iDeal',
                'tig_buckaroo_ideal'
            ]
        ];
    }

    /**
     * @param $methodCode
     * @param $expected
     *
     * @dataProvider normalizePaymentMethodCodeProvider
     */
    public function testNormalizePaymentMethodCode($methodCode, $expected)
    {
        $instance = $this->getInstance();
        $result = $instance->normalizePaymentMethodCode($methodCode);

        $this->assertEquals($expected, $result);
    }
}
