<?php

namespace App\Controllers;

use SilverStripe\Control\Controller;
use SilverStripe\Control\HTTPRequest;

/**
 * Redirect Controller - Redirects root to Vue App
 *
 */
class RedirectController extends Controller
{
    private static $url_segment = '/';

    private static $allowed_actions = [
        'index'
    ];

    /**
     * Redirect root to /game
     */
    public function index(HTTPRequest $request)
    {
        return $this->redirect('/game', 302);
    }
}
