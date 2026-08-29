/** Zero-dependency multi-select TTY prompt. */
export async function checkboxPrompt(opts) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        return opts.choices.filter((choice) => choice.checked).map((choice) => choice.value);
    }
    const choices = opts.choices.map((choice) => ({ ...choice, checked: Boolean(choice.checked) }));
    let cursor = 0;
    const lines = choices.length + 2;
    const draw = (first = false) => {
        if (!first)
            process.stdout.write(`\x1b[${lines}A`);
        process.stdout.write('\x1b[0G\x1b[J');
        process.stdout.write(`${opts.message}\n`);
        process.stdout.write('  (↑↓ move · Space toggle · a all · Enter confirm)\n');
        for (let index = 0; index < choices.length; index++) {
            const choice = choices[index];
            process.stdout.write(` ${index === cursor ? '❯' : ' '} ${choice.checked ? '◉' : '◯'} ${choice.name}\n`);
        }
    };
    return new Promise((resolve, reject) => {
        const stdin = process.stdin;
        const wasRaw = stdin.isRaw;
        const cleanup = () => {
            stdin.off('data', onData);
            stdin.setRawMode?.(wasRaw ?? false);
            stdin.pause();
        };
        const onData = (key) => {
            if (key === '\u0003') {
                cleanup();
                process.stdout.write('\n');
                reject(new Error('cancelled'));
            }
            else if (key === '\r' || key === '\n') {
                cleanup();
                process.stdout.write('\n');
                resolve(choices.filter((choice) => choice.checked).map((choice) => choice.value));
            }
            else if (key === ' ') {
                choices[cursor].checked = !choices[cursor].checked;
                draw();
            }
            else if (key === 'a' || key === 'A') {
                const checked = !choices.every((choice) => choice.checked);
                for (const choice of choices)
                    choice.checked = checked;
                draw();
            }
            else if (key === '\u001b[A' || key === 'k') {
                cursor = (cursor - 1 + choices.length) % choices.length;
                draw();
            }
            else if (key === '\u001b[B' || key === 'j') {
                cursor = (cursor + 1) % choices.length;
                draw();
            }
        };
        stdin.setRawMode?.(true);
        stdin.resume();
        stdin.setEncoding('utf8');
        draw(true);
        stdin.on('data', onData);
    });
}
/** Zero-dependency single-select TTY prompt. */
export async function selectPrompt(opts) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        return opts.choices[opts.defaultIndex ?? 0].value;
    }
    let cursor = opts.defaultIndex ?? 0;
    const lines = opts.choices.length + 2;
    const draw = (first = false) => {
        if (!first)
            process.stdout.write(`\x1b[${lines}A`);
        process.stdout.write('\x1b[0G\x1b[J');
        process.stdout.write(`${opts.message}\n`);
        process.stdout.write('  (↑↓ move · Enter confirm)\n');
        for (let index = 0; index < opts.choices.length; index++) {
            const choice = opts.choices[index];
            process.stdout.write(` ${index === cursor ? '❯' : ' '} ${index === cursor ? '●' : '○'} ${choice.name}\n`);
        }
    };
    return new Promise((resolve, reject) => {
        const stdin = process.stdin;
        const wasRaw = stdin.isRaw;
        const cleanup = () => {
            stdin.off('data', onData);
            stdin.setRawMode?.(wasRaw ?? false);
            stdin.pause();
        };
        const onData = (key) => {
            if (key === '\u0003') {
                cleanup();
                process.stdout.write('\n');
                reject(new Error('cancelled'));
            }
            else if (key === '\r' || key === '\n') {
                cleanup();
                process.stdout.write('\n');
                resolve(opts.choices[cursor].value);
            }
            else if (key === '\u001b[A' || key === 'k') {
                cursor = (cursor - 1 + opts.choices.length) % opts.choices.length;
                draw();
            }
            else if (key === '\u001b[B' || key === 'j') {
                cursor = (cursor + 1) % opts.choices.length;
                draw();
            }
        };
        stdin.setRawMode?.(true);
        stdin.resume();
        stdin.setEncoding('utf8');
        draw(true);
        stdin.on('data', onData);
    });
}
//# sourceMappingURL=prompt.js.map