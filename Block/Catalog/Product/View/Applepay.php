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
namespace TIG\Buckaroo\Block\Catalog\Product\View;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use TIG\Buckaroo\Model\ConfigProvider\Method\Applepay as ApplepayConfig;

class Applepay extends Template
{
    private $applepayConfig;

    /**
     * @param Context        $context
     * @param ApplepayConfig $applepayConfig
     * @param array          $data
     */
    public function __construct(
        Context $context,
        ApplepayConfig $applepayConfig,
        array $data = []
    ) {
        parent::__construct($context, $data);

        $this->applepayConfig = $applepayConfig;
    }

    /**
     * @return false|string
     */
    public function getCheckoutConfig()
    {
        return json_encode($this->applepayConfig->getConfig());
    }
}
