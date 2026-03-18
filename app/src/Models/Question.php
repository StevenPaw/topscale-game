<?php

namespace App\Models;

use App\Models\QuestionGroup;
use SilverStripe\ORM\DataObject;

/**
 * Class \App\Models\Question
 *
 * @property ?string $Content
 * @property ?string $ScaleStart
 * @property ?string $ScaleEnd
 * @property int $GroupID
 * @method \App\Models\QuestionGroup Group()
 * @mixin \SilverStripe\Assets\AssetControlExtension
 * @mixin \SilverStripe\Assets\Shortcodes\FileLinkTracking
 * @mixin \SilverStripe\Versioned\RecursivePublishable
 * @mixin \SilverStripe\Versioned\VersionedStateExtension
 */
class Question extends DataObject
{
    private static $table_name = 'Question';

    private static $db = [
        "Content" => "Text", //The content of the question
        "ScaleStart" => "Varchar(255)", //The start of the scale
        "ScaleEnd" => "Varchar(255)", //The end of the scale
    ];

    private static $has_one = [
        "Group" => QuestionGroup::class
    ];

    private static $summary_fields = [
        "ID" => "ID",
        "Content" => "Content",
        "ScaleStart" => "Scale Start",
        "ScaleEnd" => "Scale End"
    ];

    public function getCMSFields()
    {
        $fields = parent::getCMSFields();

        $fields->removeByName('GroupID');

        return $fields;
    }

    public function getTitle()
    {
        return $this->Content . ' (' . $this->ScaleStart . ' - ' . $this->ScaleEnd . ')';
    }
}
