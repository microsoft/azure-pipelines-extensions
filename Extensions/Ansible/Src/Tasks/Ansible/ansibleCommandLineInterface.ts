import tl = require("azure-pipelines-task-lib/task");
import { quote } from 'shell-quote';

import { ansibleInterface } from './ansibleInterface';
import * as ansibleUtils from './ansibleUtils';
import { ansibleTaskParameters } from './ansibleTaskParameters';
import { shellQuote } from 'azure-pipelines-tasks-utility-common/shellEscaping';
import { neutralizeAdditionalParameters } from './argsSanitization';

export class ansibleCommandLineInterface extends ansibleInterface {
    constructor(params: ansibleTaskParameters) {
        super();
        this._taskParameters = params;
        this._remoteCmdOptions = new ansibleUtils.RemoteCommandOptions();
        this._additionalParams = "";
        this._cleanupCmd = [];
        this._playbookPath = "";
        this._inventoryPath = "";
        this._sudoUser = "";
        // Read the feature flags that gate the OS command-injection hardening
        // (CWE-78) so it can be rolled out safely. Read in the constructor so the
        // flags are resolved before any code path builds a shell command —
        // derived interfaces (e.g. remote machine) copy artifacts and harden
        // _inventoryPath / _playbookPath before super._executeAnsiblePlaybook()
        // runs. Consumed via tl.getPipelineFeature, following the same
        // enforce/shadow pattern as the SshV0 / AzureCLI args-sanitizer rollout
        // in azure-pipelines-tasks. Dedicated flags (keyed to this fix's work
        // item, Bug 2457936) so the Ansible rollout is staged independently of
        // the shared AZP_75787_* sanitizer program.
        //   AZP_2457936_ENABLE_NEW_LOGIC  -> apply hardening (quote / neutralize)
        //   AZP_2457936_ENABLE_COLLECT    -> emit telemetry only (shadow mode)
        this._sanitizeActivate = tl.getPipelineFeature('AZP_2457936_ENABLE_NEW_LOGIC');
        this._sanitizeTelemetry = tl.getPipelineFeature('AZP_2457936_ENABLE_COLLECT');
        this._sanitizedFields = [];
    }

    public async execute() {
        try {
            await this.setupConnection();
            const failOnStdErr = this._taskParameters.failOnStdErr;
            this._remoteCmdOptions.failOnStdErr = failOnStdErr;

            await this._executeAnsiblePlaybook();
        } catch (error) {
            tl.setResult(tl.TaskResult.Failed, error);
        } finally {
            //clean up script file if needed
            if (this._cleanupCmd && this._cleanupCmd.length > 0) {
                try {
                    for (let i = 0; i < this._cleanupCmd.length; i++) {
                        await this.executeCommand(this._cleanupCmd[i]!);
                    }
                } catch (err) {
                    tl.warning(tl.loc('RemoteFileCleanUpFailed', err));
                }
            }
            this.terminateConnection();
        }
    }

    protected async _executeAnsiblePlaybook() {
        if (this._playbookPath == null || this._playbookPath.trim() == "") {
            this._playbookPath = this._taskParameters.playbookPath;
        }

        tl.debug('PlaybookPath = ' + '"' + this._playbookPath + '"');

        if (this._inventoryPath == null || this._inventoryPath.trim() == "") {
            const inventoryLocation = this._taskParameters.inventoryType;

            if (inventoryLocation == 'file') {
                const inventoryFilePath = this._taskParameters.inventoryFilePath;
                this._inventoryPath = this._applyHardening('inventoryFile', inventoryFilePath, shellQuote);
            } else if (inventoryLocation == 'hostList') {
                this._inventoryPath = await this.getInventoryPathForHostList();
            } else if (inventoryLocation == 'inlineContent') {
                this._inventoryPath = await this.createAndGetInventoryPathForInline();
            }
        }

        tl.debug('InventoryFile = ' + this._inventoryPath);
        this._sudoUser = await this.getSudoUser();
        this._additionalParams = await this.getAdditionalParam();

        const playbookExecCmd = this._buildPlaybookExecutionCommand();
        tl.debug('Running ' + playbookExecCmd);

        await this.executeCommand(playbookExecCmd);
    }

    protected async setupConnection() {
        if (ansibleUtils.getAgentPlatform() === 'win32') {
            throw tl.loc('AgentOnWindowsMachine');
        }

        if (!ansibleUtils.getShellWhich('ansible')) {
            throw tl.loc('AnisbleNotPresent');
        }
    }

    protected terminateConnection() { }

    protected async executeCommand(cmd: string): Promise<string> {
        return await ansibleUtils.runCommandOnSameMachine(cmd, this._remoteCmdOptions);
    }

    protected async getSudoUser(): Promise<string> {
        const sudoEnabled = this._taskParameters.sudoEnable;
        let sudoUser = this._taskParameters.sudoUser;

        return new Promise<string>((resolve) => {
            if (sudoEnabled == true) {
                if (!sudoUser || sudoUser.trim() == "") {
                    sudoUser = 'root';
                }

                tl.debug('Sudo User = ' + sudoUser);
                resolve(sudoUser);
            } else {
                resolve("");
            }
        });
    }

    protected async getAdditionalParam(): Promise<string> {
        const args = this._taskParameters.additionalParams;

        return new Promise<string>((resolve) => {
            if (args && args.trim()) {
                resolve(args.trim());
            } else {
                resolve("");
            }
        })
    }

    protected async getInventoryPathForHostList(): Promise<string> {
        let hostList = this._taskParameters.inventoryHostList.trim();

        return new Promise<string>((resolve, reject) => {
            //host list should end with comma (,)
            if (!hostList.endsWith(','))
                hostList = hostList.concat(',');
            tl.debug("Host List = " + '"' + hostList + '"');
            resolve(this._applyHardeningLegacy('inventoryHostList', hostList, '"' + hostList + '"', shellQuote));
        });
    }

    protected async createAndGetInventoryPathForInline(): Promise<string> {
        const content = this._taskParameters.inventoryInline.trim();
        const dynamicInventory = this._taskParameters.inventoryDynamic;
        const __this = this;

        return new Promise<string>(async (resolve, reject) => {
            try {
                const remoteInventory = ansibleUtils.getTemporaryInventoryFilePath();
                const remoteInventoryPath = '"' + remoteInventory + '"';
                tl.debug('RemoteInventoryPath = ' + remoteInventoryPath);

                // Inline inventory content is user-controlled and echoed into a
                // file through the shell. It is always hardened via shell-quote
                // (CodeQL SM03609 / Bug 2236220), independent of the feature flag.
                const inventoryCmd = 'echo ' + quote([content]) + ' > ' + remoteInventory;
                await __this.executeCommand(inventoryCmd);

                if (dynamicInventory == true) {
                    await __this.executeCommand('chmod +x ' + remoteInventory);
                }

                this._cleanupCmd.push('rm -f ' + remoteInventory);
                resolve(remoteInventory);
            } catch (error) {
                reject(error);
            }
        });
    }

    private _buildPlaybookExecutionCommand() {
        let cmd = 'ansible-playbook ';

        if (this._inventoryPath && this._inventoryPath.trim()) {
            // Inventory value is already hardened where it is produced.
            cmd = cmd.concat('-i ' + this._inventoryPath + ' ');
        }

        if (this._playbookPath && this._playbookPath.trim()) {
            const playbookPath = this._applyHardening('playbookPath', this._playbookPath, shellQuote);
            cmd = cmd.concat(playbookPath + " ");
        }

        if (this._sudoUser && this._sudoUser.trim()) {
            const sudoUser = this._applyHardening('sudoUser', this._sudoUser, shellQuote);
            cmd = cmd.concat('-b --become-user ' + sudoUser + ' ');
        }

        if (this._additionalParams && this._additionalParams.trim()) {
            const additionalParams = this._applyHardening('additionalParameters', this._additionalParams, neutralizeAdditionalParameters);
            cmd = cmd.concat(additionalParams);
        }
        this._emitSanitizationSignals();
        return cmd;
    }

    // Returns the hardened value when the fix is activated, otherwise the legacy
    // value. The hardening transform is provided as a lazy producer so that the
    // shellQuote / neutralize helpers are only ever invoked when at least one
    // flag is on — with both flags off the task behaves exactly as before and is
    // unaffected by those helpers.
    //
    // Most call sites use the raw value verbatim as the legacy (flag-off) value,
    // so this 3-argument variant defaults legacyValue to rawValue and delegates
    // to _applyHardeningLegacy. Use _applyHardeningLegacy directly where the
    // legacy value differs from the raw input (e.g. the host list is
    // legacy-quoted).
    protected _applyHardening(fieldName: string, rawValue: string, harden: (value: string) => string): string
    {
        return this._applyHardeningLegacy(fieldName, rawValue, rawValue, harden);
    }

    protected _applyHardeningLegacy(fieldName: string, rawValue: string, legacyValue: string, harden: (value: string) => string): string {
        if (!this._sanitizeActivate && !this._sanitizeTelemetry) {
            return legacyValue;
        }
        // Compute the hardened value so telemetry can report the true set of
        // commands the fix will change (legacyValue !== hardenedValue), rather
        // than a proxy such as "contains a metacharacter". shellQuote always
        // adds quotes, so it can change a command even for values with no
        // metacharacter (e.g. a path with a space). This runs only when a flag
        // is on, so the flag-off path is never affected by the helper.
        const hardenedValue = harden(rawValue);
        if (legacyValue !== hardenedValue && this._sanitizedFields.indexOf(fieldName) === -1) {
            this._sanitizedFields.push(fieldName);
        }
        return this._sanitizeActivate ? hardenedValue : legacyValue;
    }

    // Neutralizes OS command-injection vectors in the additional parameters.
    // Implemented in the standalone argsSanitization module so it can be
    // unit-tested in isolation (see argsSanitizationTests).

    private _emitSanitizationSignals() {
        if (!this._sanitizedFields || this._sanitizedFields.length === 0) {
            return;
        }
        if (this._sanitizeTelemetry) {
            let payload = {
                task: 'Ansible',
                activated: this._sanitizeActivate,
                mode: this._sanitizeActivate ? 'live' : 'shadow',
                sanitizedFields: this._sanitizedFields
            };
            console.log('##vso[telemetry.publish area=TaskHub;feature=Ansible]' + JSON.stringify(payload));
        }
    }

    protected _taskParameters: ansibleTaskParameters;
    protected _cleanupCmd: string[] = [];
    protected _remoteCmdOptions: ansibleUtils.RemoteCommandOptions;
    protected _playbookPath: string;
    protected _inventoryPath: string;
    private _sudoUser: string;
    private _additionalParams: string;
    private _sanitizeActivate: boolean;
    private _sanitizeTelemetry: boolean;
    private _sanitizedFields: string[];
}