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
namespace TIG\Buckaroo\Service\Sales\Quote;

use Magento\Checkout\Model\Cart;
use Magento\Quote\Api\CartRepositoryInterface;
use Magento\Quote\Model\Quote;
use Magento\Sales\Model\Order;

class Recreate
{
    /** @var CartRepositoryInterface */
    private $cartRepository;

    /** @var Cart */
    private $cart;

    /**
     * @param CartRepositoryInterface $cartRepository
     * @param Cart                    $cart
     */
    public function __construct(
        CartRepositoryInterface $cartRepository,
        Cart $cart
    ) {
        $this->cartRepository = $cartRepository;
        $this->cart = $cart;
    }

    /**
     * @param Order $order
     *
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     */
    public function recreate($order)
    {
        /** @var Quote $quote */
        $quote = $this->cartRepository->get($order->getQuoteId());

        $quote->setIsActive(true);
        $quote->setTriggerRecollect('1');
        $quote->setReservedOrderId(null);
        $quote->setBuckarooFee(null);
        $quote->setBaseBuckarooFee(null);
        $quote->setBuckarooFeeTaxAmount(null);
        $quote->setBuckarooFeeBaseTaxAmount(null);
        $quote->setBuckarooFeeInclTax(null);
        $quote->setBaseBuckarooFeeInclTax(null);

        $this->cart->setQuote($quote)->save();
    }
}
