<?php

namespace App\Admins;

use App\Models\QuestionGroup;
use SilverStripe\Admin\ModelAdmin;

/**
 * Class \App\Admins\QuestionsAdmin
 *
 */
class QuestionsAdmin extends ModelAdmin
{
    private static $menu_title = 'Questions';

    private static $url_segment = 'questions-list';
    private static $menu_icon = 'app/client/icons/admins/questions_admin.svg';

    private static $managed_models = [
        QuestionGroup::class
    ];
}
