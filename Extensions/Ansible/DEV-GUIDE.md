# Ansible extension contributor guide

This document introduces the Ansible extension to contributors. For the customer-facing documentation published to the Visual Studio Marketplace, see [Src/readme.md](Src/readme.md).

## Overview

The extension adds the `Ansible@0` Azure Pipelines task. The task runs an Ansible playbook by building and executing an `ansible-playbook` command with the inventory and options selected by the user.

Customers use the task to include configuration management, application deployment, and infrastructure orchestration in build or release pipelines without writing the command-line integration themselves.

## Basic concepts

- **Control node**: The machine where Ansible is installed and the playbook is executed.
- **Managed node**: A machine or device targeted by the playbook.
- **Playbook**: A YAML file that defines the automation to perform.
- **Inventory**: The hosts and groups targeted by the playbook.
- **SSH service connection**: The Azure Pipelines service connection used to access a remote control node.

Ansible must be installed on the selected control node and available on `PATH`. The task does not install Ansible.

## Execution modes

The task exposes two execution modes through the **Ansible location** input.

### Agent machine

The pipeline agent is the Ansible control node. The task:

1. Verifies that the agent is not running native Windows.
2. Verifies that Ansible is available on `PATH`.
3. Resolves the selected inventory.
4. Runs `ansible-playbook` on the agent.
5. Removes any temporary inline inventory file.

This mode is useful when a self-hosted Linux agent already has Ansible and the required dependencies installed.

### Remote machine

A remote machine is the Ansible control node. The task:

1. Connects to the machine using an SSH service connection.
2. Optionally copies the playbook directory from the agent to the remote machine.
3. Optionally copies an inventory file from the agent to the remote machine.
4. Resolves host-list or inline inventory on the remote machine when selected.
5. Runs `ansible-playbook` remotely.
6. Removes files copied or created under `/tmp`.
7. Closes the SSH connection.

The SSH service connection supports password authentication or private-key authentication with an optional passphrase.

## Playbook and inventory sources

For agent execution, the playbook must be available on the agent.

For remote execution, the playbook can either:

- Be available on the agent and copied to the remote machine.
- Already exist on the remote machine.

The task supports these inventory choices:

| Inventory choice | Behavior |
| --- | --- |
| Default inventory | Runs without `-i`, so Ansible resolves its configured default inventory. |
| File | Passes the selected inventory file to `ansible-playbook -i`. For remote execution, the file can be copied from the agent or already exist remotely. |
| Host list | Passes the comma-terminated host list directly to `ansible-playbook -i`. |
| Inline | Writes the supplied content to a temporary inventory file and passes that file with `-i`. Dynamic inline inventory is also marked executable. |

When **Sudo** is enabled, the task adds `-b --become-user <user>`. If no user is supplied, it uses `root`. Additional parameters are appended to the command unchanged.

Do not place secrets in additional parameters because the complete command can appear in diagnostic logs.

## Implementation flow

The main execution path is:

1. `ansibleTaskParameters.ts` reads task inputs from `task.json`.
2. `main.ts` selects the implementation for the requested execution mode.
3. `ansibleCommandLineInterface.ts` resolves inventory, builds the command, executes it, and performs cleanup.
4. `ansibleRemoteMachineInterface.ts` adds SSH setup and remote file-copy behavior.
5. `ansibleUtils.ts` provides command, SSH, SFTP, temporary-file, and HTTP helpers.

The command-line implementation is shared between agent and remote execution. Remote execution extends the agent implementation and overrides connection, command execution, and cleanup behavior.

`ansibleTowerInterface.ts` contains a legacy Ansible Tower implementation. Ansible Tower is not currently exposed as an option by the task's **Ansible location** input.

## Repository layout

| Path | Purpose |
| --- | --- |
| `Src/vss-extension.json` | Marketplace extension manifest, assets, and task contribution. |
| `Src/readme.md` | Customer-facing Marketplace documentation. |
| `Src/Tasks/Ansible/task.json` | Task metadata, inputs, Node handlers, and localized messages. |
| `Src/Tasks/Ansible/main.ts` | Task entry point and implementation selection. |
| `Src/Tasks/Ansible/ansibleTaskParameters.ts` | Input parsing and defaults. |
| `Src/Tasks/Ansible/ansibleCommandLineInterface.ts` | Shared command construction and agent execution. |
| `Src/Tasks/Ansible/ansibleRemoteMachineInterface.ts` | SSH connection, remote copy, execution, and cleanup. |
| `Src/Tasks/Ansible/ansibleUtils.ts` | Shared process, SSH, file-transfer, and request helpers. |
| `Tests/Tasks/Ansible` | Mock task scenarios and the Ansible test suite. |

## Making changes

Keep the following surfaces synchronized:

- Update `task.json` when adding or changing a task input.
- Update `ansibleTaskParameters.ts` to read new or changed inputs.
- Update the relevant execution implementation.
- Add success and failure scenarios under `Tests/Tasks/Ansible`.
- Update `Src/readme.md` when customer-visible behavior changes.
- Update this guide when architecture or contributor workflows change.

Avoid changing input names or the task's major version without considering existing pipelines. Minor task versions are selected automatically within the same major version.

## Build and tests

The repository requires Node.js 20 or later and npm 10.8.2 or later.

From the repository root:

```text
npm install
npm run build
npm test
```

The Ansible suite exercises every Node handler declared in `task.json`. It covers agent and remote execution, inventory types, playbook and inventory copying, SSH authentication, sudo and additional parameters, cleanup, command output, and expected failure paths.

Use the repository-level commands rather than the `test` script in `Src/Tasks/Ansible/package.json`.
