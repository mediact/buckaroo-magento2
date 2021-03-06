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
 * to servicedesk@tig.nl so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this module to newer
 * versions in the future. If you wish to customize this module for your
 * needs please contact servicedesk@tig.nl for more information.
 *
 * @copyright   Copyright (c) Total Internet Group B.V. https://tig.nl/copyright
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US
 */
namespace TIG\Buckaroo\Test\Unit\Service\Formatter\Address;

use TIG\Buckaroo\Service\Formatter\Address\PhoneFormatter;
use TIG\Buckaroo\Test\BaseTest;

class PhoneFormatterTest extends BaseTest
{
    protected $instanceClass = PhoneFormatter::class;

    /**
     * @return array
     */
    public function formatProvider()
    {
        return [
            'invalid number' => [
                '020123456',
                'NL',
                [
                    'orginal' => '020123456',
                    'clean' => '020123456',
                    'mobile' => false,
                    'valid' => false
                ]
            ],
            'valid NL phone by +31' => [
                '+31201234567',
                'NL',
                [
                    'orginal' => '+31201234567',
                    'clean' => '0031201234567',
                    'mobile' => false,
                    'valid' => true
                ]
            ],
            'valid BE phone by 32' => [
                '32201234567',
                'BE',
                [
                    'orginal' => '32201234567',
                    'clean' => '0032201234567',
                    'mobile' => false,
                    'valid' => true
                ]
            ],
            'valid BE phone by 0032' => [
                '0032201234567',
                'BE',
                [
                    'orginal' => '0032201234567',
                    'clean' => '0032201234567',
                    'mobile' => false,
                    'valid' => true
                ]
            ],
            'valid NL mobile by 31' => [
                '31612345678',
                'NL',
                [
                    'orginal' => '31612345678',
                    'clean' => '0031612345678',
                    'mobile' => true,
                    'valid' => true
                ]
            ],
            'valid NL mobile by 0031' => [
                '0031612345678',
                'NL',
                [
                    'orginal' => '0031612345678',
                    'clean' => '0031612345678',
                    'mobile' => true,
                    'valid' => true
                ]
            ],
            'invalid BE mobile' => [
                '+32451234567',
                'BE',
                [
                    'orginal' => '+32451234567',
                    'clean' => '0032451234567',
                    'mobile' => false,
                    'valid' => true
                ]
            ],
            'valid BE mobile by +32' => [
                '+32461234567',
                'BE',
                [
                    'orginal' => '+32461234567',
                    'clean' => '0032461234567',
                    'mobile' => true,
                    'valid' => true
                ]
            ],
            'valid BE mobile by 32' => [
                '32471234567',
                'BE',
                [
                    'orginal' => '32471234567',
                    'clean' => '0032471234567',
                    'mobile' => true,
                    'valid' => true
                ]
            ],
            'valid BE mobile by 0032' => [
                '0032481234567',
                'BE',
                [
                    'orginal' => '0032481234567',
                    'clean' => '0032481234567',
                    'mobile' => true,
                    'valid' => true
                ]
            ],
        ];
    }

    /**
     * @param $number
     * @param $country
     * @param $expected
     *
     * @dataProvider formatProvider
     */
    public function testFormat($number, $country, $expected)
    {
        $instance = $this->getInstance();
        $result = $instance->format($number, $country);

        $this->assertEquals($expected, $result);
    }
}
