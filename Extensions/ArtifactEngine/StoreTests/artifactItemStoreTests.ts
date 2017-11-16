var mocha = require("mocha");
import * as assert from 'assert';

import * as engine from '../Engine';
import * as models from '../Models';
import * as providers from '../Providers';
import { ArtifactItemStore } from '../Store/artifactItemStore';

describe('artifactItemStore.addItem', () => {
    it('should add artifact item to the artifact store', () => {
        var artifactItemStore = new ArtifactItemStore();

        artifactItemStore.addItem(new models.ArtifactItem());

        assert.equal(artifactItemStore.size(), 1);
    });
});

describe('artifactItemStore.addItem', () => {
    it('should not re-add same artifact item to the artifact store', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem = new models.ArtifactItem();
        artifactItem.path = "path1";

        artifactItemStore.addItem(artifactItem);
        artifactItemStore.addItem(artifactItem);

        assert.equal(artifactItemStore.size(), 1);
    });
});

describe('artifactItemStore.addItems', () => {
    it('should add artifact items to the artifact store', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";
        var artifactItem2 = new models.ArtifactItem();
        artifactItem2.path = "path2";

        artifactItemStore.addItems([artifactItem1, artifactItem2]);

        assert.equal(artifactItemStore.size(), 2);
    });
});

describe('artifactItemStore.getNextItemToProcess', () => {
    it('should return artifact item to be processed', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem = new models.ArtifactItem();
        artifactItem.path = "path1";

        artifactItemStore.addItem(artifactItem);

        assert.equal(artifactItemStore.getNextItemToProcess().artifactItem.path, artifactItem.path);
    });
});

describe('artifactItemStore.getNextItemToProcess', () => {
    it('should not throw if no items have been added to store', () => {
        var artifactItemStore = new ArtifactItemStore();

        artifactItemStore.getNextItemToProcess();

        assert.equal(artifactItemStore.getNextItemToProcess(), undefined);
    });
});

describe('artifactItemStore.getNextItemToProcess', () => {
    it('should not return already processing item', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";
        var artifactItem2 = new models.ArtifactItem();
        artifactItem2.path = "path2";
        artifactItemStore.addItem(artifactItem1);
        artifactItemStore.addItem(artifactItem2);

        artifactItemStore.getNextItemToProcess();

        assert.equal(artifactItemStore.getNextItemToProcess().artifactItem.path, artifactItem2.path);
    });
});

describe('artifactItemStore.getNextItemToProcess', () => {
    it('should return undefined if there are no more items to process', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";
        artifactItemStore.addItem(artifactItem1);

        artifactItemStore.getNextItemToProcess();

        assert.equal(artifactItemStore.getNextItemToProcess(), undefined);
    });
});

describe('artifactItemStore.updateState', () => {
    it('should update state correctly', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";
        artifactItemStore.addItem(artifactItem1);

        artifactItemStore.updateState(artifactItem1, models.TicketState.Skipped, 1);

        assert.equal(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").state, models.TicketState.Skipped);
        assert.equal(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").retryCount, 1);
    });
});

describe('artifactItemStore.updateState', () => {
    it('should not throw if the artifactItem does not exisit in store', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";

        artifactItemStore.updateState(artifactItem1, models.TicketState.Skipped, 0);
    });
});

describe('artifactItemStore.updateState', () => {
    it('should not update finish time for inqueue state', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";
        artifactItemStore.addItem(artifactItem1);

        artifactItemStore.updateState(artifactItem1, models.TicketState.InQueue, 0);

        assert.equal(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").finishTime, undefined);
    });
});

describe('artifactItemStore.updateState', () => {
    it('should not update finish time for processing state', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";
        artifactItemStore.addItem(artifactItem1);

        artifactItemStore.updateState(artifactItem1, models.TicketState.Processing, 0);

        assert.equal(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").finishTime, undefined);
    });
});

describe('artifactItemStore.updateState', () => {
    it('should update finish time for skipped state', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";
        artifactItemStore.addItem(artifactItem1);

        artifactItemStore.updateState(artifactItem1, models.TicketState.Skipped, 3);

        assert.notEqual(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").finishTime, undefined);
        assert.notEqual(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").retryCount, 3);
    });
});

describe('artifactItemStore.updateState', () => {
    it('should update finish time for processed state', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";
        artifactItemStore.addItem(artifactItem1);

        artifactItemStore.updateState(artifactItem1, models.TicketState.Processed, 2);

        assert.notEqual(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").finishTime, undefined);
        assert.notEqual(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").retryCount, 2);
    });
});

describe('artifactItemStore.updateState', () => {
    it('should update finish time for failed state', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";
        artifactItemStore.addItem(artifactItem1);

        artifactItemStore.updateState(artifactItem1, models.TicketState.Failed, 2);

        assert.notEqual(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").finishTime, undefined);
        assert.notEqual(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").retryCount, 2);
    });
});

describe('artifactItemStore.flush', () => {
    it('should flush all artifact items from artifact store', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem = new models.ArtifactItem();
        artifactItem.path = "path1";
        artifactItemStore.addItem(artifactItem);
        artifactItemStore.addItem(artifactItem);

        artifactItemStore.flush();

        assert.equal(artifactItemStore.size(), 0);
    });
});

describe('artifactItemStore.itemsPendingProcessing', () => {
    it('should return true if item is in queue', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem = new models.ArtifactItem();
        artifactItem.path = "path1";
        artifactItemStore.addItem(artifactItem);
        artifactItemStore.updateState(artifactItem, models.TicketState.InQueue, 0);

        assert.equal(artifactItemStore.itemsPendingProcessing(), true);
    });
});

describe('artifactItemStore.itemsPendingProcessing', () => {
    it('should return true if item is processing', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem = new models.ArtifactItem();
        artifactItem.path = "path1";
        artifactItemStore.addItem(artifactItem);
        artifactItemStore.updateState(artifactItem, models.TicketState.Processing, 0);

        assert.equal(artifactItemStore.itemsPendingProcessing(), true);
    });
});

describe('artifactItemStore.itemsPendingProcessing', () => {
    it('should return false if item is skipped', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem = new models.ArtifactItem();
        artifactItem.path = "path1";
        artifactItemStore.addItem(artifactItem);
        artifactItemStore.updateState(artifactItem, models.TicketState.Skipped, 0);

        assert.equal(artifactItemStore.itemsPendingProcessing(), false);
    });
});

describe('artifactItemStore.itemsPendingProcessing', () => {
    it('should return false if item is failed', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem = new models.ArtifactItem();
        artifactItem.path = "path1";
        artifactItemStore.addItem(artifactItem);
        artifactItemStore.updateState(artifactItem, models.TicketState.Failed, 0);

        assert.equal(artifactItemStore.itemsPendingProcessing(), false);
    });
});

describe('artifactItemStore.itemsPendingProcessing', () => {
    it('should return false if item is processed', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem = new models.ArtifactItem();
        artifactItem.path = "path1";
        artifactItemStore.addItem(artifactItem);
        artifactItemStore.updateState(artifactItem, models.TicketState.Processed, 0);

        assert.equal(artifactItemStore.itemsPendingProcessing(), false);
    });
});

describe('artifactItemStore.itemsPendingProcessing', () => {
    it('should return false if no items in queue', () => {
        var artifactItemStore = new ArtifactItemStore();

        assert.equal(artifactItemStore.itemsPendingProcessing(), false);
    });
});