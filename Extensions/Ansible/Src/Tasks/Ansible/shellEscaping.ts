// Shell-escaping helpers used to harden the ansible-playbook command against
// OS command injection (CWE-78). This is a faithful, self-contained port of
// `azure-pipelines-tasks-utility-common/shellEscaping` (the same helpers used
// by the SshV0 / CopyFilesOverSSHV0 / CMakeV1 command-injection fixes in the
// azure-pipelines-tasks repo). It is vendored here because this extension is
// built with a single root tsconfig and does not install per-task npm
// dependencies at compile time.

function escapeForSingleQuotedShell(value: string): string {
    return value.replace(/'/g, "'\\''");
}

/**
 * Wraps a single value in POSIX single quotes so the shell treats it as one
 * literal argument. Safe for paths, host lists and user names.
 *
 * shellQuote("/path/to/file with spaces")  -> "'/path/to/file with spaces'"
 * shellQuote("it's here")                  -> "'it'\\''s here'"
 * shellQuote("")                           -> "''"
 */
export function shellQuote(value: string | null | undefined): string {
    if (!value) {
        return "''";
    }
    const escaped = escapeForSingleQuotedShell(value);
    return "'" + escaped + "'";
}

const SHELL_META_CHARS: { [key: string]: boolean } = {
    '\\': true, '`': true, ';': true, '|': true, '<': true, '>': true,
    '&': true, '(': true, ')': true, '#': true,
    "'": true, '"': true, ' ': true, '\t': true
};

const SPECIAL_SEQUENCES: { [key: string]: string } = {
    '$(': '\\$\\(',
    '\r\n': '',
    '\r': '',
    '\n': ''
};

/**
 * Neutralizes shell command-substitution and control metacharacters in a
 * single token while preserving ordinary flag syntax. Intended to be applied
 * per-token (see the shellSplit workflow below).
 *
 * neutralizeCommandSubstitution("-e foo=$(whoami)") -> "-e\\ foo=\\$\\(whoami\\)"
 * neutralizeCommandSubstitution("test;whoami")      -> "test\\;whoami"
 */
export function neutralizeCommandSubstitution(value: string | null | undefined): string | null | undefined {
    if (!value) {
        return value;
    }
    return value.replace(/\\|`|\$\(|;|\r\n|\r|\n|\||<|>|&|\(|\)|#|'|"| |\t/g, (match: string): string => {
        const special = SPECIAL_SEQUENCES[match];
        if (special !== undefined) {
            return special;
        }
        if (SHELL_META_CHARS[match]) {
            return '\\' + match;
        }
        return match;
    });
}

/**
 * Splits a free-form argument string into tokens, honoring single/double
 * quotes and backslash escapes, and strips the surrounding quoting. Used with
 * neutralizeCommandSubstitution to sanitize multi-argument inputs:
 *
 *   shellSplit(args).map(neutralizeCommandSubstitution).join(' ')
 */
export function shellSplit(value: string | null | undefined): string[] {
    if (!value) {
        return [];
    }
    const tokenRegex = /(?:'[^']*'|"(?:[^"\\]|\\.)*"|\\.|[^\s'"\\]+)+/g;
    const tokens: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(value)) !== null) {
        const raw = match[0]!;
        const token = raw
            .replace(/'([^']*)'/g, '$1')
            .replace(/"((?:[^"\\]|\\.)*)"/g, (_: string, content: string) => content.replace(/\\([$`"\\]|\n)/g, '$1'))
            .replace(/\\(.)/g, '$1');
        tokens.push(token);
    }
    return tokens;
}
