<?php

namespace App\Admins;

use App\Models\User;
use SilverStripe\Admin\ModelAdmin;

/**
 * Class \App\Admins\UserAdmin
 *
 */
class UserAdmin extends ModelAdmin
{
    private static $menu_title = 'Users';

    private static $url_segment = 'users-list';
    private static $menu_icon = 'app/client/icons/admins/user_admin.svg';

    private static $managed_models = [
        User::class
    ];
}
