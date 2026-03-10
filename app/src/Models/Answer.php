<?php

namespace App\Models;

use SilverStripe\ORM\DataObject;

/**
 * Class \App\Models\Answer
 *
 * @property ?string $Content
 * @mixin \SilverStripe\Assets\AssetControlExtension
 * @mixin \SilverStripe\Assets\Shortcodes\FileLinkTracking
 * @mixin \SilverStripe\Versioned\RecursivePublishable
 * @mixin \SilverStripe\Versioned\VersionedStateExtension
 */
class Answer extends DataObject
{
    private static $table_name = 'Answer';

    private static $db = [
        "Content" => "Text", //The content of the answer
    ];

    private static $has_one = [
    ];

    private static $summary_fields = [

    ];
}
