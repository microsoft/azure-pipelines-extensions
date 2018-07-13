import * as assert from 'assert';

import * as models from '../Models';
import { ArtifactItemStore } from '../Store/artifactItemStore';

describe('Unit Tests', () => {
    describe('artifactItemStore tests', () => {
        it('addItem should add artifact item to the artifact store', () => {
            var artifactItemStore = new ArtifactItemStore();

            artifactItemStore.addItem(new models.ArtifactItem());

            assert.equal(artifactItemStore.size(), 1);
        });

        it('addItem should not re-add same artifact item to the artifact store', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem = new models.ArtifactItem();
            artifactItem.path = "path1";

            artifactItemStore.addItem(artifactItem);
            artifactItemStore.addItem(artifactItem);

            assert.equal(artifactItemStore.size(), 1);
        });

        it('addItems should add artifact items to the artifact store', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "path1";
            var artifactItem2 = new models.ArtifactItem();
            artifactItem2.path = "path2";

            artifactItemStore.addItems([artifactItem1, artifactItem2]);

            assert.equal(artifactItemStore.size(), 2);
        });

        it('getNextItemToProcess should return artifact item to be processed', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem = new models.ArtifactItem();
            artifactItem.path = "path1";

            artifactItemStore.addItem(artifactItem);

            assert.equal(artifactItemStore.getNextItemToProcess().path, artifactItem.path);
        });

        it('getNextItemToProcess should not throw if no items have been added to store', () => {
            var artifactItemStore = new ArtifactItemStore();

            artifactItemStore.getNextItemToProcess();

            assert.equal(artifactItemStore.getNextItemToProcess(), undefined);
        });

        it('getNextItemToProcess should not return already processing item', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "path1";
            var artifactItem2 = new models.ArtifactItem();
            artifactItem2.path = "path2";
            artifactItemStore.addItem(artifactItem1);
            artifactItemStore.addItem(artifactItem2);

            artifactItemStore.getNextItemToProcess();

            assert.equal(artifactItemStore.getNextItemToProcess().path, artifactItem2.path);
        });

        it('getNextItemToProcess should return undefined if there are no more items to process', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "path1";
            artifactItemStore.addItem(artifactItem1);

            artifactItemStore.getNextItemToProcess();

            assert.equal(artifactItemStore.getNextItemToProcess(), undefined);
        });

        it('updateState should update state correctly', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "path1";
            artifactItemStore.addItem(artifactItem1);

            artifactItemStore.updateState(artifactItem1, models.TicketState.Skipped);

            assert.equal(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").state, models.TicketState.Skipped);
        });

        it('updateState should not throw if the artifactItem does not exisit in store', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "path1";

            artifactItemStore.updateState(artifactItem1, models.TicketState.Skipped);
        });

        it('updateState should not update finish time for inqueue state', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "path1";
            artifactItemStore.addItem(artifactItem1);

            artifactItemStore.updateState(artifactItem1, models.TicketState.InQueue);

            assert.equal(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").finishTime, undefined);
        });

        it('updateState should not update finish time for processing state', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "path1";
            artifactItemStore.addItem(artifactItem1);

            artifactItemStore.updateState(artifactItem1, models.TicketState.Processing);

            assert.equal(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").finishTime, undefined);
        });

        it('updateState should update finish time for skipped state', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "path1";
            artifactItemStore.addItem(artifactItem1);

            artifactItemStore.updateState(artifactItem1, models.TicketState.Skipped);

            assert.notEqual(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").finishTime, undefined);
        });

        it('updateState should update finish time for processed state', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "path1";
            artifactItemStore.addItem(artifactItem1);

            artifactItemStore.updateState(artifactItem1, models.TicketState.Processed);

            assert.notEqual(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").finishTime, undefined);
        });

        it('updateState should update finish time for failed state', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "path1";
            artifactItemStore.addItem(artifactItem1);

            artifactItemStore.updateState(artifactItem1, models.TicketState.Failed);

            assert.notEqual(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").finishTime, undefined);
        });

        it('flush should flush all artifact items from artifact store', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem = new models.ArtifactItem();
            artifactItem.path = "path1";
            artifactItemStore.addItem(artifactItem);
            artifactItemStore.addItem(artifactItem);

            artifactItemStore.flush();

            assert.equal(artifactItemStore.size(), 0);
        });

        it('itemsPendingProcessing should return true if item is in queue', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem = new models.ArtifactItem();
            artifactItem.path = "path1";
            artifactItemStore.addItem(artifactItem);
            artifactItemStore.updateState(artifactItem, models.TicketState.InQueue);

            assert.equal(artifactItemStore.itemsPendingProcessing(), true);
        });

        it('itemsPendingProcessing should return true if item is processing', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem = new models.ArtifactItem();
            artifactItem.path = "path1";
            artifactItemStore.addItem(artifactItem);
            artifactItemStore.updateState(artifactItem, models.TicketState.Processing);

            assert.equal(artifactItemStore.itemsPendingProcessing(), true);
        });

        it('itemsPendingProcessing should return false if item is skipped', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem = new models.ArtifactItem();
            artifactItem.path = "path1";
            artifactItemStore.addItem(artifactItem);
            artifactItemStore.updateState(artifactItem, models.TicketState.Skipped);

            assert.equal(artifactItemStore.itemsPendingProcessing(), false);
        });

        it('itemsPendingProcessing should return false if item is failed', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem = new models.ArtifactItem();
            artifactItem.path = "path1";
            artifactItemStore.addItem(artifactItem);
            artifactItemStore.updateState(artifactItem, models.TicketState.Failed);

            assert.equal(artifactItemStore.itemsPendingProcessing(), false);
        });

        it('itemsPendingProcessing should return false if item is processed', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem = new models.ArtifactItem();
            artifactItem.path = "path1";
            artifactItemStore.addItem(artifactItem);
            artifactItemStore.updateState(artifactItem, models.TicketState.Processed);

            assert.equal(artifactItemStore.itemsPendingProcessing(), false);
        });

        it('itemsPendingProcessing should return false if no items in queue', () => {
            var artifactItemStore = new ArtifactItemStore();

            assert.equal(artifactItemStore.itemsPendingProcessing(), false);
        });

        it('increaseRetryCount should increase retry count of item', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "path1";
            artifactItemStore.addItem(artifactItem1);

            artifactItemStore.increaseRetryCount(artifactItem1);
            artifactItemStore.increaseRetryCount(artifactItem1);

            assert.equal(artifactItemStore.getTickets().find(x => x.artifactItem.path == "path1").retryCount, 2);
        });

        it('getRootLocation should return empty if root item is not present', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "path1";

            artifactItemStore.addItem(artifactItem1);

            assert.equal(artifactItemStore.getRootLocation(), '');
        });

        it('getRootLocation should return empty if root item does not have metadata', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "";

            artifactItemStore.addItem(artifactItem1);

            assert.equal(artifactItemStore.getRootLocation(), '');
        });

        it('getRootLocation should return location of root item', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            artifactItem1.path = "";
            artifactItem1.metadata = { downloadUrl: '//dummy/drop' };
            artifactItemStore.addItem(artifactItem1);

            assert.equal(artifactItemStore.getRootLocation(), '//dummy/drop');
        });

        it('updateDownloadSize should update download size of item', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            var downloadSize = 2000;
            artifactItemStore.addItem(artifactItem1);
            artifactItemStore.updateDownloadSize(artifactItem1, downloadSize);

            assert.equal(artifactItemStore.getTickets().find(x => x.artifactItem == artifactItem1).downloadSizeInBytes, downloadSize);
        });

        it('updateFileSize should update file size of item', () => {
            var artifactItemStore = new ArtifactItemStore();
            var artifactItem1 = new models.ArtifactItem();
            var fileSize = 2000;
            artifactItemStore.addItem(artifactItem1);
            artifactItemStore.updateFileSize(artifactItem1, fileSize);

            assert.equal(artifactItemStore.getTickets().find(x => x.artifactItem == artifactItem1).fileSizeInBytes, fileSize);
        });
    });
});