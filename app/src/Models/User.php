<?php

namespace App\Models;

use SilverStripe\Assets\Image;
use SilverStripe\ORM\DataObject;
use SilverStripe\Forms\GridField\GridField;
use SilverStripe\Forms\GridField\GridFieldConfig_RecordEditor;

/**
 * Class \App\Models\User
 *
 * @property ?string $Nickname
 * @property ?string $Username
 * @property ?string $Email
 * @property ?string $Password
 * @property ?string $PremiumUntil
 * @property ?string $DateOfBirth
 * @property ?string $APIKey
 * @property int $StatisticsRoundsPlayed
 * @property int $ProfileImageID
 * @method \SilverStripe\Assets\Image ProfileImage()
 * @mixin \SilverStripe\Assets\AssetControlExtension
 * @mixin \SilverStripe\Assets\Shortcodes\FileLinkTracking
 * @mixin \SilverStripe\Versioned\RecursivePublishable
 * @mixin \SilverStripe\Versioned\VersionedStateExtension
 */
class User extends DataObject
{
    private static $table_name = 'User';

    private static $db = [
        "Nickname" => "Varchar(255)", //The Nickname visible to other users
        "Username" => "Varchar(255)", //The Username used to login
        'Email' => 'Varchar(255)',
        "Password" => "Varchar(255)", //The Password used to login (hashed)
        "PremiumUntil" => "Date", //The date until the user has a premium account
        'DateOfBirth' => 'Date', //The date of birth of the user
        'APIKey' => 'Varchar(255)', //The API key for accessing the API
        'StatisticsRoundsPlayed' => 'Int', //The total number of rounds played by the user
    ];

    private static $has_one = [
        "ProfileImage" => Image::class,
    ];

    private static $owns = [
        "ProfileImage",
    ];

    private static $summary_fields = [
        'Title',
        'Email',
        'RenderPremiumUntil',
    ];

    public function RenderPremiumUntil()
    {
        return $this->dbObject('PremiumUntil')->Format('d M Y');
    }

    public function getTitle()
    {
        return $this->Nickname . ' (@' . $this->Username . ')';
    }

    /**
     * Get profile image URL or Gravatar fallback
     * @param int $size Size of the gravatar image
     * @return string|null
     */
    public function getProfileImageOrGravatar($size = 200)
    {
        // If user has uploaded a profile image, return it
        if ($this->ProfileImage()->exists()) {
            return $this->ProfileImage()->getURL();
        }

        // Otherwise return Gravatar based on email
        if ($this->Email) {
            $hash = md5(strtolower(trim($this->Email)));
            return "https://www.gravatar.com/avatar/{$hash}?s={$size}&d=identicon";
        }

        return null;
    }

    protected function onBeforeWrite()
    {
        // Generate API Key if not set
        if (!$this->APIKey || $this->APIKey == "") {
            $this->APIKey = bin2hex(random_bytes(32)); // 64 characters
        }
        return parent::onBeforeWrite();
    }

    public function getCMSFields()
    {
        $fields = parent::getCMSFields();
        return $fields;
    }

    public function getPremiumStatus()
    {
        if ($this->PremiumUntil && $this->PremiumUntil >= date('Y-m-d')) {
            return true;
        }
        return false;
    }

    public function getAge()
    {
        if ($this->DateOfBirth) {
            $dob = new \DateTime($this->DateOfBirth);
            $now = new \DateTime();
            $age = $now->diff($dob)->y;
            return $age;
        }
        return null;
    }
}
