#!/usr/bin/env php
<?php

declare(strict_types=1);

$engineRoot = dirname(__DIR__);
require_once $engineRoot.'/src/Autoload.php';

use Codegenkit\Laravel\UnitGen\UnitRegistry;

try {
    $root = getenv('CODEGENKIT_ROOT') ?: dirname($engineRoot);
    $loaded = UnitRegistry::load($root);
    $registry = $loaded['registry'];
    $errors = [];
    $warnings = [];

    echo 'api-unit-test.registry v'.$registry['version']."\n";
    echo '  path: '.UnitRegistry::REGISTRY_REL."\n";
    echo '  patterns: '.count($registry['patterns'] ?? [])."\n";
    echo '  commonBaselines: '.count($registry['commonBaselines']['app'] ?? [])."\n";

    foreach ($registry['patterns'] ?? [] as $id => $pattern) {
        if (empty($pattern['status'])) {
            $warnings[] = "patterns.{$id}: missing status";
        }
        if (($pattern['status'] ?? null) === 'implemented' && empty($pattern['command']) && empty($pattern['template'])) {
            $errors[] = "patterns.{$id}: implemented but no command or template";
        }
        if (!empty($pattern['fallbackTag']) && !str_starts_with((string) $pattern['fallbackTag'], '#needs-unit-test:')) {
            $warnings[] = "patterns.{$id}: fallbackTag should start with #needs-unit-test:";
        }
    }

    foreach ($registry['manualTopicMap'] ?? [] as $topic => $entry) {
        $patternId = is_string($entry) ? $entry : ($entry['patternId'] ?? null);
        if (!$patternId) {
            $errors[] = "manualTopicMap.{$topic}: missing patternId";
            continue;
        }
        if (empty($registry['patterns'][$patternId])) {
            $errors[] = "manualTopicMap.{$topic} → unknown pattern [{$patternId}]";
        }
    }

    foreach ($warnings as $warning) {
        fwrite(STDERR, "  warn: {$warning}\n");
    }
    if ($errors !== []) {
        foreach ($errors as $error) {
            fwrite(STDERR, "  error: {$error}\n");
        }
        exit(1);
    }

    echo "  validate: OK\n";
    exit(0);
} catch (Throwable $error) {
    fwrite(STDERR, ($error->getMessage() ?: (string) $error)."\n");
    exit(1);
}
