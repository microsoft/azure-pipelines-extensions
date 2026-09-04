import * as fs from 'fs';
import * as path from 'path';

export interface FileSystemCaseSensitivityProbe {
    existsSync(path: string): boolean;
    readdirSync(path: string): string[];
    statSync(path: string): { dev: number };
}

export interface PathOperations {
    resolve(...paths: string[]): string;
    dirname(path: string): string;
    join(...paths: string[]): string;
}

// Detect case behavior without creating a probe file. Probe only inside the nearest existing
// destination ancestor. Empty directories may ascend only within the same device.
export function isFilesystemCaseInsensitive(
    destinationPath: string,
    fileSystem: FileSystemCaseSensitivityProbe = fs,
    pathOperations: PathOperations = path): boolean {
    if (!destinationPath) {
        return false;
    }

    try {
        let existingPath = pathOperations.resolve(destinationPath);

        while (true) {
            if (fileSystem.existsSync(existingPath)) {
                const caseSensitivity = probeDirectoryCaseSensitivity(existingPath, fileSystem, pathOperations);
                if (caseSensitivity !== null) {
                    return caseSensitivity;
                }

                const parentPath = pathOperations.dirname(existingPath);
                if (parentPath === existingPath) {
                    return false;
                }

                if (fileSystem.statSync(existingPath).dev !== fileSystem.statSync(parentPath).dev) {
                    return false;
                }

                existingPath = parentPath;
                continue;
            }

            const parentPath = pathOperations.dirname(existingPath);
            if (parentPath === existingPath) {
                return false;
            }

            existingPath = parentPath;
        }
    }
    catch (error) {
        // A false negative only retains the original case-sensitive behavior.
        return false;
    }
}

function probeDirectoryCaseSensitivity(
    directoryPath: string,
    fileSystem: FileSystemCaseSensitivityProbe,
    pathOperations: PathOperations): boolean | null {
    const entries = fileSystem.readdirSync(directoryPath);
    for (const entry of entries) {
        const caseVariant = getCaseVariant(entry);
        if (!caseVariant) {
            continue;
        }

        if (entries.filter((candidate) => candidate.toLowerCase() === entry.toLowerCase()).length !== 1) {
            return false;
        }

        return fileSystem.existsSync(pathOperations.join(directoryPath, caseVariant));
    }

    return null;
}

function getCaseVariant(pathSegment: string): string | null {
    for (let index = 0; index < pathSegment.length; index++) {
        const character = pathSegment.charAt(index);
        if (character >= 'a' && character <= 'z') {
            return pathSegment.substring(0, index) + character.toUpperCase() + pathSegment.substring(index + 1);
        }

        if (character >= 'A' && character <= 'Z') {
            return pathSegment.substring(0, index) + character.toLowerCase() + pathSegment.substring(index + 1);
        }
    }

    return null;
}
