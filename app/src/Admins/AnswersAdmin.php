<?php

namespace App\Admins;

use App\Models\Answer;
use App\Models\Question;
use SilverStripe\Admin\ModelAdmin;

/**
 * Class \App\Admins\AnswersAdmin
 *
 */
class AnswersAdmin extends ModelAdmin
{
    private static $menu_title = 'Answers';

    private static $url_segment = 'answers-list';
    private static $menu_icon = 'app/client/icons/admins/answers_admin.svg';

    private static $managed_models = [
        Answer::class
    ];
}
