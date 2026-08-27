// Neutralizes OS command-injection vectors in the Ansible task's additional
// parameters (the free-form "args" input) while preserving legitimate quoting,
// variable references and globs. Extracted from ansibleCommandLineInterface so
// it can be unit-tested in isolation.
//
// The transform is quote-aware:
//   - characters inside single quotes are left untouched (the shell treats them
//     literally), so a JSON --extra-vars value round-trips unchanged;
//   - command substitution ($(...) and backticks) is neutralized inside double
//     quotes too, because it is still active there;
//   - shell control operators (; | & < > ( ) #) are escaped only when they
//     appear outside quotes;
//   - $VAR / ${VAR} references and existing backslash escapes are preserved.
// Safe inputs are returned unchanged, so enabling the fix does not alter their
// behaviour; only genuine injection sequences are escaped.
export function neutralizeAdditionalParameters(value: string): string {
    if (!value) {
        return value;
    }

    const controlOperators = ';|&<>()#';
    let result = '';
    let quoteChar: string | null = null;

    for (let i = 0; i < value.length; i++) {
        const ch = value[i]!;

        // Strip carriage returns / newlines everywhere; they act as command
        // separators and have no legitimate use in a single args line.
        if (ch === '\r' || ch === '\n') {
            continue;
        }

        if (quoteChar === "'") {
            // Single quotes: everything is literal until the closing quote.
            result += ch;
            if (ch === "'") {
                quoteChar = null;
            }
            continue;
        }

        if (quoteChar === '"') {
            if (ch === '\\') {
                result += ch;
                if (i + 1 < value.length) {
                    result += value[++i];
                }
                continue;
            }
            if (ch === '`') {
                result += '\\`';
                continue;
            }
            if (ch === '$' && value[i + 1] === '(') {
                result += '\\$\\(';
                i++;
                continue;
            }
            result += ch;
            if (ch === '"') {
                quoteChar = null;
            }
            continue;
        }

        // Unquoted context.
        if (ch === '\\') {
            result += ch;
            if (i + 1 < value.length) {
                result += value[++i];
            }
            continue;
        }
        if (ch === "'" || ch === '"') {
            quoteChar = ch;
            result += ch;
            continue;
        }
        if (ch === '`') {
            result += '\\`';
            continue;
        }
        if (ch === '$' && value[i + 1] === '(') {
            result += '\\$\\(';
            i++;
            continue;
        }
        if (controlOperators.indexOf(ch) !== -1) {
            result += '\\' + ch;
            continue;
        }
        result += ch;
    }

    return result;
}
