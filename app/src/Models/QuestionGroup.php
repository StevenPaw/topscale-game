<?php

namespace App\Models;

use SilverStripe\ORM\DataObject;

/**
 * Class \App\Models\QuestionGroup
 *
 * @property ?string $Title
 * @property bool $Only18
 * @method \SilverStripe\ORM\DataList|\App\Models\Question[] Questions()
 * @mixin \SilverStripe\Assets\AssetControlExtension
 * @mixin \SilverStripe\Assets\Shortcodes\FileLinkTracking
 * @mixin \SilverStripe\Versioned\RecursivePublishable
 * @mixin \SilverStripe\Versioned\VersionedStateExtension
 */
class QuestionGroup extends DataObject
{
    private static $table_name = 'QuestionGroup';

    private static $db = [
        "Title" => "Varchar(255)", //The title of the question group
        "Only18" => "Boolean", //Whether the question group is only for users over 18
    ];

    private static $has_many = [
        "Questions" => Question::class
    ];

    private static $owns = [
        "Questions"
    ];

    private static $summary_fields = [

    ];
}
