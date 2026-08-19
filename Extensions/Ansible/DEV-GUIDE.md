# Getting started with the Ansible extension

This guide explains the Ansible concepts and setup required to use the `Ansible@0` task in Azure Pipelines. For the complete task input reference, see [Src/readme.md](Src/readme.md).

## What the extension does

Ansible automates configuration, deployment, and orchestration across one or more machines. The extension adds an Azure Pipelines task that runs an Ansible playbook from:

- A Linux pipeline agent where Ansible is installed.
- A remote machine where Ansible is installed, accessed through an SSH service connection.

The extension runs Ansible but does not install or configure it.

## Ansible concepts

You only need a few concepts to get started:

- **Control node**: The machine where Ansible is installed and the playbook runs. In this extension, the control node is either the pipeline agent or a remote machine.
- **Managed node**: A machine or device that Ansible configures.
- **Playbook**: A YAML file containing the automation steps to run.
- **Inventory**: A list of managed nodes, optionally organized into groups.
- **Module**: A unit of work performed by Ansible, such as copying a file, installing a package, or starting a service.

Ansible connects from the control node to managed nodes. For Linux managed nodes, this connection commonly uses SSH.

## Before you begin

Prepare the following:

1. A playbook that describes the required automation.
2. One or more managed nodes.
3. Network access from the Ansible control node to the managed nodes.
4. Credentials that allow Ansible to connect to the managed nodes.
5. An inventory, unless you intend to use Ansible's configured default inventory.

Install Ansible on the control node by following the [Ansible installation guidance](http://docs.ansible.com/ansible/latest/intro_installation.html). Ensure that the `ansible-playbook` command is available on `PATH`.

Native Windows machines are not supported as Ansible control nodes.

## Choose where Ansible runs

### Agent machine

Choose **Agent machine** when Ansible is installed on the Linux pipeline agent.

Use this option when:

- You manage a Linux agent with Ansible already installed.
- The playbook and inventory are available in the pipeline workspace.
- The agent can connect directly to all managed nodes.

The playbook file path and inventory file path refer to files on the agent.

### Remote machine

Choose **Remote machine** when Ansible is installed on another machine.

Create an [SSH endpoint](https://www.visualstudio.com/en-us/docs/build/concepts/library/service-endpoints#sep-ssh) for the remote control node. The service connection can use a password or a private key. If the private key is encrypted, also provide its passphrase.

The playbook and inventory can already exist on the remote machine, or the task can copy them from the pipeline agent.

## Create a basic playbook

The following playbook verifies that Ansible can connect to every host in the `web` inventory group:

```yaml
---
- name: Verify managed nodes
  hosts: web
  gather_facts: false
  tasks:
    - name: Ping managed nodes
      ansible.builtin.ping:
```

Save it as `playbooks/ping.yml`.

## Define the inventory

The inventory identifies the managed nodes. The task provides four inventory choices.

### Default inventory

Select **Use default inventory file** to let Ansible use its configured default inventory. The conventional default file is `/etc/ansible/hosts`.

### Inventory file

Select **File** to provide an inventory file. Ansible supports INI and YAML inventory formats.

Example INI inventory:

```ini
[web]
web1.example.com
web2.example.com
```

Example YAML inventory:

```yaml
all:
  children:
    web:
      hosts:
        web1.example.com:
        web2.example.com:
```

### Host list

Select **Host list** for a simple comma-separated list of hosts:

```text
web1.example.com,web2.example.com
```

Use `hosts: all` in the playbook when using this option because a host list does not define custom inventory groups such as `web`.

### Inline inventory

Select **Inline** to enter inventory content directly in the task. Enable **Dynamic inventory** only when the content is an executable inventory script that returns inventory data.

## Configure the task

### Run on the agent

```yaml
- task: Ansible@0
  displayName: Run Ansible playbook
  inputs:
    ansibleInterface: agentMachine
    playbookPathOnAgentMachine: '$(System.DefaultWorkingDirectory)/playbooks/ping.yml'
    inventoriesAgentMachine: file
    inventoryFileOnAgentMachine: '$(System.DefaultWorkingDirectory)/inventory/hosts.ini'
```

### Run on a remote control node

This example copies the playbook directory and inventory file from the agent to the remote control node:

```yaml
- task: Ansible@0
  displayName: Run Ansible playbook remotely
  inputs:
    ansibleInterface: remoteMachine
    connectionOverSsh: 'My Ansible SSH connection'
    playbookSourceRemoteMachine: agentMachine
    playbookRootRemoteMachine: '$(System.DefaultWorkingDirectory)/playbooks'
    playbookPathLinkedArtifactOnRemoteMachine: 'ping.yml'
    inventoriesRemoteMachine: file
    inventoryFileSourceRemoteMachine: agentMachine
    inventoryFileLinkedArtifactOnRemoteMachine: '$(System.DefaultWorkingDirectory)/inventory/hosts.ini'
```

When the files already exist on the remote control node, select **Ansible machine** as their source and provide their remote paths.

## Privilege escalation and additional parameters

Enable **Sudo** when the playbook must run operations as another user. The task uses `root` when **Sudo user** is empty. The control node and managed nodes must already be configured for the required Ansible privilege escalation.

Use **Additional parameters** for supported `ansible-playbook` options such as limiting hosts or passing extra variables:

```text
--limit web1.example.com --extra-vars "environment=test"
```

Do not include secrets directly in this field. Prefer secret pipeline variables and established Ansible secret-management practices.

## Validate the setup

Before relying on the pipeline task, validate the same playbook and inventory from the selected control node:

```text
ansible-playbook -i inventory/hosts.ini playbooks/ping.yml --syntax-check
ansible-playbook -i inventory/hosts.ini playbooks/ping.yml
```

This separates Ansible, inventory, credential, and network problems from pipeline configuration problems.

## Common problems

### Ansible cannot be found

Confirm that Ansible is installed on the selected control node and that `ansible-playbook` is available on `PATH` for the account running the command.

### A managed node is unreachable

Verify:

- The inventory contains the correct host name or IP address for the managed node.
- The control node can reach the managed node on its SSH port, which is usually port 22.
- The SSH username configured in the inventory or additional parameters exists on the managed node.
- The password or private key used by Ansible authenticates that user.
- The control node trusts the managed node's SSH host key.

Test the connection from the control node before running the pipeline:

```text
ssh <username>@<managed-node>
ansible all -i inventory/hosts.ini -m ping
```

### The playbook targets no hosts

Ensure that the value of `hosts` in the playbook matches a group in the inventory. Use `hosts: all` with the task's **Host list** inventory option.

## Learn more

- [Ansible documentation](http://docs.ansible.com/ansible/latest/index.html)
- [Playbooks](http://docs.ansible.com/ansible/latest/playbooks.html)
- [Inventory](http://docs.ansible.com/ansible/latest/intro_inventory.html)
- [Dynamic inventory](http://docs.ansible.com/ansible/latest/intro_dynamic_inventory.html)
