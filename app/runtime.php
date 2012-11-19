<?php
require dirname(__DIR__) . '/vendor/autoload.php';

use Ratchet\Server\IoServer;
use LS\Chat;

error_reporting(E_ALL);
$server=IoServer::factory(
    new \Ratchet\WebSocket\WsServer(
        new Chat()
    )
    , 8000
);

$server->run();