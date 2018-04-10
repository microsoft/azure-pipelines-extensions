import * as tl from 'vsts-task-lib/task';

async function main(): Promise<void> {
    var promise = new Promise<void>(async (resolve, reject) => {
        resolve();
    });

    return promise;
}

main()
    .then((result) => {
        tl.setResult(tl.TaskResult.Succeeded, "");
    })
    .catch((error) => tl.setResult(tl.TaskResult.Failed, error));