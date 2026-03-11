<?php

namespace App\Controllers;

use SilverStripe\Control\Controller;
use SilverStripe\Control\HTTPRequest;

/**
 * Game Controller
 * Renders the Vue.js frontend for the quiz game
 *
 */
class GameController extends Controller
{
    private static $allowed_actions = [
        'index'
    ];

    /**
     * Render the Vue.js game frontend
     */
    public function index(HTTPRequest $request)
    {
        return $this->renderWith(['GameController', 'Page']);
    }

    /**
     * Get the page title
     */
    public function Title()
    {
        return 'Topscale Quiz Game';
    }
}
