<?php
/**
 *                  ___________       __            __
 *                  \__    ___/____ _/  |_ _____   |  |
 *                    |    |  /  _ \\   __\\__  \  |  |
 *                    |    | |  |_| ||  |   / __ \_|  |__
 *                    |____|  \____/ |__|  (____  /|____/
 *                                              \/
 *          ___          __                                   __
 *         |   |  ____ _/  |_   ____ _______   ____    ____ _/  |_
 *         |   | /    \\   __\_/ __ \\_  __ \ /    \ _/ __ \\   __\
 *         |   ||   |  \|  |  \  ___/ |  | \/|   |  \\  ___/ |  |
 *         |___||___|  /|__|   \_____>|__|   |___|  / \_____>|__|
 *                  \/                           \/
 *                  ________
 *                 /  _____/_______   ____   __ __ ______
 *                /   \  ___\_  __ \ /  _ \ |  |  \\____ \
 *                \    \_\  \|  | \/|  |_| ||  |  /|  |_| |
 *                 \______  /|__|    \____/ |____/ |   __/
 *                        \/                       |__|
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Creative Commons License.
 * It is available through the world-wide-web at this URL:
 * http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US
 * If you are unable to obtain it through the world-wide-web, please send an email
 * to servicedesk@totalinternetgroup.nl so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this module to newer
 * versions in the future. If you wish to customize this module for your
 * needs please contact servicedesk@totalinternetgroup.nl for more information.
 *
 * @copyright   Copyright (c) 2014 Total Internet Group B.V. (http://www.totalinternetgroup.nl)
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US
 */

namespace TIG\Buckaroo\Model\ConfigProvider;

use \TIG\Buckaroo\Model\ConfigProvider;

class Predefined extends AbstractConfigProvider
{

    /**
     * XPATHs to configuration values for tig_buckaroo_predefined
     */
    const XPATH_PREDEFINED_LOCATIONS        = 'tig_buckaroo_predefined/locations';
    const XPATH_PREDEFINED_LOCATIONS_LIVE   = 'tig_buckaroo_predefined/locations/live';
    const XPATH_PREDEFINED_LOCATIONS_TEST   = 'tig_buckaroo_predefined/locations/test';

    /**
     * @return array|void
     */
    public function getConfig()
    {
        $config = [
            'locations' => $this->getLocations(),
        ];
        return $config;
    }

    /**
     * Returns the config value for predefined/locations
     *
     * @return mixed
     */
    public function getLocations()
    {
        return $this->getConfigFromXpath(self::XPATH_PREDEFINED_LOCATIONS);
    }

    /**
     * Returns the config value for predefined/locations/live
     *
     * @return mixed
     */
    public function getLocationsLive()
    {
        return $this->getConfigFromXpath(self::XPATH_PREDEFINED_LOCATIONS_LIVE);
    }

    /**
     * Returns the config value for predefined/locations/test
     *
     * @return mixed
     */
    public function getLocationsTest()
    {
        return $this->getConfigFromXpath(self::XPATH_PREDEFINED_LOCATIONS_TEST);
    }

}
