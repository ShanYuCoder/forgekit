#!/usr/bin/env php
<?php

declare(strict_types=1);

$engineRoot = dirname(__DIR__);
require_once $engineRoot.'/src/Autoload.php';

use Codegenkit\Laravel\UnitGen\ArtisanRunner;
use Codegenkit\Laravel\UnitGen\CodegenManifest;
use Codegenkit\Laravel\UnitGen\ProjectResolver;
use Codegenkit\Laravel\UnitGen\SpecReader;
use Codegenkit\Laravel\UnitGen\UnitPlanner;
use Codegenkit\Laravel\UnitGen\UnitRegistry;
use Codegenkit\Laravel\UnitGen\WriteFiles;

function bootstrapVendor(): void
{
    $roots = [];
    $ck = getenv('CODEGENKIT_ROOT') ?: '';
    if ($ck !== '') {
        $roots[] = $ck;
        $roots[] = $ck.'/src';
        $roots[] = $ck.'/vendor';
    }
    try {
        $resolved = ProjectResolver::resolve();
        $roots[] = $resolved['laravelRoot'];
        $roots[] = $resolved['targetRoot'];
    } catch (Throwable) {
        // resolve later after args; vendor may still be findable
    }

    foreach ($roots as $root) {
        foreach ([$root.'/vendor/autoload.php', $root.'/../vendor/autoload.php'] as $autoload) {
            if (is_file($autoload)) {
                require_once $autoload;

                return;
            }
        }
    }
}

/**
 * @param  list<string>  $argv
 * @return array{dryRun: bool, force: bool, spec: ?string, phase: string, execute: bool}
 */
function parseArgs(array $argv): array
{
    $options = [
        'dryRun' => false,
        'force' => false,
        'spec' => null,
        'phase' => 'all',
        'execute' => true,
    ];

    for ($i = 0; $i < count($argv); $i++) {
        $arg = $argv[$i];
        if ($arg === '--dry' || $arg === '--dry-run') {
            $options['dryRun'] = true;
        } elseif ($arg === '--force') {
            $options['force'] = true;
        } elseif ($arg === '--plan-only') {
            $options['execute'] = false;
        } elseif ($arg === '--phase') {
            $options['phase'] = $argv[++$i] ?? 'all';
        } elseif ($arg === '--spec') {
            $options['spec'] = $argv[++$i] ?? null;
        } elseif (!str_starts_with($arg, '-') && $options['spec'] === null) {
            $options['spec'] = $arg;
        }
    }

    if ($options['spec'] === null) {
        throw new RuntimeException(
            'Usage: php unit-gen.php --spec <01-backend-spec.yaml> [--dry-run] [--force] [--phase stub|enriched|behavioral|all] [--plan-only]'
        );
    }

    return $options;
}

function resolveSpecPaths(string $root, ?string $specArg, ?string $idArg): array
{
    if ($specArg !== null) {
        return [$specArg];
    }
    if ($idArg === null) {
        throw new RuntimeException("Either --spec or --id must be provided");
    }
    $script = dirname(__DIR__, 2) . '/shared/resolve-cli.mjs';
    if (!is_file($script)) {
        throw new RuntimeException("resolve-cli.mjs not found at $script");
    }
    $cmd = sprintf("node %s %s %s api-codegen", escapeshellarg($script), escapeshellarg($root), escapeshellarg($idArg));
    $output = shell_exec($cmd);
    if ($output === null || $output === false) {
        throw new RuntimeException("Failed to execute resolve-cli.mjs for --id $idArg");
    }
    $data = json_decode($output, true);
    if (!$data || !($data['success'] ?? false)) {
        $err = $data['error'] ?? 'Unknown error';
        throw new RuntimeException("Failed to resolve ID $idArg: $err");
    }
    foreach ($data['notes'] ?? [] as $note) {
        echo "  note: $note\n";
    }
    $paths = $data['paths'] ?? [];
    if (count($paths) === 0) {
        throw new RuntimeException("--id $idArg: no codegen specs");
    }
    $kind = $data['kind'] ?? 'unknown';
    echo "api-unit-gen: --id $idArg -> " . count($paths) . " spec(s) ($kind)\n";
    return $paths;
}

try {
    bootstrapVendor();
    $options = parseArgs(array_slice($argv, 1));
    $project = ProjectResolver::resolve();
    $laravelRoot = $project['laravelRoot'];

    // Prefer product vendor after resolve
    foreach ([$laravelRoot.'/vendor/autoload.php', $project['targetRoot'].'/vendor/autoload.php'] as $autoload) {
        if (is_file($autoload)) {
            require_once $autoload;
            break;
        }
    }

    $loaded = UnitRegistry::load($project['targetRoot']);
    $registry = $loaded['registry'];

    $idArg = null;
    $specArg = $options['spec'];
    if ($options['spec'] === null) {
        for ($i = 1; $i < count($argv); $i++) {
            if ($argv[$i] === '--id' && isset($argv[$i + 1])) {
                $idArg = $argv[$i + 1];
                break;
            }
        }
    }

    $paths = resolveSpecPaths($project['targetRoot'], $specArg, $idArg);
    if (count($paths) > 1) {
        echo "api-unit-gen: " . count($paths) . " spec(s) to process\n";
    }

    $failed = 0;
    foreach ($paths as $specPath) {
        try {
            $specData = SpecReader::read($specPath);
            $manifestData = CodegenManifest::read($specData['featureDir']);

            $ctx = UnitPlanner::buildUnitContext(
                $specData['spec'],
                $specData['specFile'],
                $manifestData['manifest'],
                $laravelRoot,
                ['phase' => $options['phase']]
            );
            $plan = UnitPlanner::buildUnitPlan($ctx, $registry);

            echo "api-unit-gen: module={$ctx['module']} entity={$ctx['entity']} profile={$ctx['profile']} phase={$ctx['phase']}\n";
            echo "  target: {$laravelRoot}\n";
            echo "  spec: {$specData['specFile']}\n";
            echo '  registry: '.UnitRegistry::REGISTRY_REL."\n";
            if ($options['dryRun']) {
                echo "  mode: dry-run\n";
            }
            if ($options['force']) {
                echo "  mode: force\n";
            }

            if ($plan['skippedPatterns'] !== []) {
                echo "\nSkipped patterns:\n";
                foreach ($plan['skippedPatterns'] as $item) {
                    $artisan = !empty($item['artisan']) ? ' → php artisan '.$item['artisan'] : '';
                    echo "  {$item['patternId']}: {$item['reason']}{$artisan}\n";
                }
            }

            if ($plan['commands'] !== []) {
                echo "\nArtisan commands:\n";
                foreach ($plan['commands'] as $cmd) {
                    echo "  php artisan {$cmd['artisan']}\n";
                }
            }

            $commandResults = [];
            if ($options['execute'] && $plan['commands'] !== []) {
                $commands = $plan['commands'];
                if ($options['force']) {
                    $commands = array_map(
                        static fn ($c) => array_merge($c, ['artisan' => $c['artisan'].' --force']),
                        $commands
                    );
                }
                foreach ($commands as $cmd) {
                    $result = ArtisanRunner::run($cmd['artisan'], $laravelRoot, ['dryRun' => $options['dryRun']]);
                    $commandResults[] = array_merge($cmd, $result);
                    if ($result['code'] !== 0 && $options['execute'] && !$options['dryRun']) {
                        throw new RuntimeException(
                            "Command failed: {$cmd['artisan']}\n".($result['stderr'] ?: $result['stdout'])
                        );
                    }
                }
            }

            $rendered = WriteFiles::renderFileOutputs($plan['files'], $ctx);
            $writeResult = WriteFiles::writeOutputs($laravelRoot, $rendered, [
                'dryRun' => $options['dryRun'],
                'force' => $options['force'],
            ]);
            $written = $writeResult['written'];
            $skipped = $writeResult['skipped'];

            $unitManifest = [
                'generatedAt' => gmdate('c'),
                'specFile' => $specData['specFile'],
                'phase' => $ctx['phase'],
                'profile' => $ctx['profile'],
                'module' => $ctx['module'],
                'entity' => $ctx['entity'],
                'feature' => $ctx['feature'],
                'codegenManifest' => 'generated/codegen.manifest.json',
                'unitRegistry' => UnitRegistry::REGISTRY_REL,
                'commands' => array_map(
                    static fn ($c) => [
                        'pattern' => $c['patternId'],
                        'artisan' => $c['artisan'],
                        'shell' => 'php artisan '.$c['artisan'],
                    ],
                    $plan['commands']
                ),
                'files' => array_map(
                    static fn ($f) => [
                        'layer' => $f['layer'],
                        'path' => $f['relativePath'],
                        'pattern' => $f['patternId'],
                        'reqIds' => $f['reqIds'],
                    ],
                    $plan['files']
                ),
                'written' => array_map(static fn ($w) => $w['relativePath'], $written),
                'skipped' => array_map(
                    static fn ($s) => ['path' => $s['relativePath'], 'reason' => $s['reason']],
                    $skipped
                ),
                'skippedPatterns' => $plan['skippedPatterns'],
                'needsUnit' => $plan['needsUnit'],
                'mocks' => array_map(static fn ($m) => '#test-mock:'.$m, $ctx['unitTags']['mocks']),
                'execution' => array_map(
                    static fn ($r) => [
                        'id' => $r['id'],
                        'status' => ($r['code'] ?? 1) === 0 ? 'OK' : 'FAIL ('.($r['code'] ?? 1).')',
                        'artisan' => $r['artisan'],
                    ],
                    $commandResults
                ),
            ];

            $handoff = WriteFiles::renderUnitHandoffMarkdown(
                $ctx,
                $written,
                $skipped,
                $plan['needsUnit'],
                $plan['commands'],
                $plan['skippedPatterns']
            );
            $meta = WriteFiles::writeUnitMeta($specData['featureDir'], $unitManifest, $handoff, [
                'dryRun' => $options['dryRun'],
            ]);

            foreach ($written as $w) {
                $prefix = $options['dryRun'] ? '[dry]' : 'write';
                echo "  {$prefix}: {$w['relativePath']}\n";
            }
            foreach ($skipped as $s) {
                echo "  skip: {$s['relativePath']} ({$s['reason']})\n";
            }
            foreach ($plan['needsUnit'] as $item) {
                echo "  needs-unit: {$item['tag']}\n";
            }

            if (!$options['dryRun'] && !empty($meta['manifestPath'])) {
                echo "  manifest: {$meta['manifestPath']}\n";
                echo "  handoff: {$meta['handoffPath']}\n";
            }

            if (count($paths) > 1) echo "\n";
        } catch (Throwable $e) {
            $failed++;
            fwrite(STDERR, "api-unit-gen: FAIL $specPath: " . ($e->getMessage() ?: (string) $e) . "\n");
        }
    }
    if ($failed > 0) exit(1);

    echo "\napi-unit-gen complete — verify with php artisan test; needsUnit should be [] for implemented patterns\n";
    exit(0);
} catch (Throwable $error) {
    fwrite(STDERR, ($error->getMessage() ?: (string) $error)."\n");
    exit(1);
}
