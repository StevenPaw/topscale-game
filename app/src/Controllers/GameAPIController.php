<?php

namespace App\Controllers;

use App\Models\Question;
use App\Models\QuestionGroup;
use SilverStripe\Control\Controller;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Control\HTTPResponse;

/**
 * Game API Controller
 * Provides JSON API endpoints for the quiz game
 *
 */
class GameAPIController extends Controller
{
    private static $allowed_actions = [
        'index',
        'groups',
        'questions',
        'random'
    ];

    private static $url_handlers = [
        'groups' => 'groups',
        'questions/random' => 'random',
        'questions' => 'questions'
    ];

    /**
     * Handle CORS preflight requests
     */
    public function index(HTTPRequest $request)
    {
        // Handle OPTIONS preflight
        if ($request->httpMethod() === 'OPTIONS') {
            $response = HTTPResponse::create();
            $response->addHeader('Access-Control-Allow-Origin', '*');
            $response->addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            $response->addHeader('Access-Control-Allow-Headers', 'Content-Type');
            $response->setStatusCode(200);
            return $response;
        }

        return $this->jsonResponse([
            'success' => false,
            'error' => 'Invalid endpoint'
        ], 404);
    }

    /**
     * Set JSON response headers
     */
    protected function jsonResponse($data, $statusCode = 200)
    {
        $response = HTTPResponse::create();
        $response->addHeader('Content-Type', 'application/json');
        $response->addHeader('Access-Control-Allow-Origin', '*');
        $response->addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        $response->addHeader('Access-Control-Allow-Headers', 'Content-Type');
        $response->setStatusCode($statusCode);
        $response->setBody(json_encode($data));
        return $response;
    }

    /**
     * GET /api/game/groups
     * Returns all question groups
     */
    public function groups(HTTPRequest $request)
    {
        $groups = QuestionGroup::get();

        $data = [];
        foreach ($groups as $group) {
            $data[] = [
                'id' => $group->ID,
                'title' => $group->Title,
                'only18' => (bool) $group->Only18,
                'questionCount' => $group->Questions()->count()
            ];
        }

        return $this->jsonResponse([
            'success' => true,
            'groups' => $data
        ]);
    }

    /**
     * GET /api/game/questions?groupIds=1,2,3
     * Returns all questions for specified groups
     */
    public function questions(HTTPRequest $request)
    {
        $groupIds = $request->getVar('groupIds');

        if (!$groupIds) {
            return $this->jsonResponse([
                'success' => false,
                'error' => 'Parameter groupIds is required'
            ], 400);
        }

        $groupIdArray = array_map('intval', explode(',', $groupIds));

        $questions = Question::get()
            ->filter(['GroupID' => $groupIdArray])
            ->exclude(['Content' => '']); // Only questions with content

        $data = [];
        foreach ($questions as $question) {
            $data[] = [
                'id' => $question->ID,
                'text' => $question->Content,
                'scaleFrom' => $question->ScaleStart,
                'scaleTo' => $question->ScaleEnd,
                'groupId' => $question->GroupID
            ];
        }

        return $this->jsonResponse([
            'success' => true,
            'questions' => $data,
            'count' => count($data)
        ]);
    }

    /**
     * GET /api/game/questions/random?groupIds=1,2,3&exclude=1,2
     * Returns a random question from specified groups
     */
    public function random(HTTPRequest $request)
    {
        $groupIds = $request->getVar('groupIds');

        if (!$groupIds) {
            return $this->jsonResponse([
                'success' => false,
                'error' => 'Parameter groupIds is required'
            ], 400);
        }

        $groupIdArray = array_map('intval', explode(',', $groupIds));

        // Build query
        $query = Question::get()
            ->filter(['GroupID' => $groupIdArray])
            ->exclude(['Content' => '']); // Only questions with content

        // Exclude already used questions
        $excludeIds = $request->getVar('exclude');
        if ($excludeIds) {
            $excludeIdArray = array_map('intval', explode(',', $excludeIds));
            $query = $query->exclude(['ID' => $excludeIdArray]);
        }

        // Get random question
        $count = $query->count();

        if ($count === 0) {
            return $this->jsonResponse([
                'success' => false,
                'error' => 'No questions available. All questions may have been used.'
            ], 404);
        }

        // Random offset
        $randomOffset = rand(0, $count - 1);
        $question = $query->limit(1, $randomOffset)->first();

        if (!$question) {
            return $this->jsonResponse([
                'success' => false,
                'error' => 'Question not found'
            ], 404);
        }

        return $this->jsonResponse([
            'success' => true,
            'question' => [
                'id' => $question->ID,
                'text' => $question->Content,
                'scaleFrom' => $question->ScaleStart,
                'scaleTo' => $question->ScaleEnd,
                'groupId' => $question->GroupID
            ]
        ]);
    }
}
