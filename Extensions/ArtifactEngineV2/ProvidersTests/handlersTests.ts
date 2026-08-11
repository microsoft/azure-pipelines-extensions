import * as assert from 'assert';

// After removing the vendored typed-rest-client copy, these credential handlers
// are provided by the upstream `typed-rest-client` package. These tests pin the
// Authorization-header contract that artifact-engine consumers (e.g. the TeamCity
// download task using Basic auth) depend on, so a behavioral change in the
// upstream handlers would be caught.
import { BasicCredentialHandler, PersonalAccessTokenCredentialHandler } from 'typed-rest-client/Handlers';

describe('Unit Tests', () => {
    describe('typed-rest-client credential handler tests', () => {

        it('BasicCredentialHandler.prepareRequest sets a Basic Authorization header', () => {
            var handler = new BasicCredentialHandler('alice', 'pa:ss word');
            var options: any = { headers: {} };

            handler.prepareRequest(options);

            var expected = 'Basic ' + Buffer.from('alice:pa:ss word').toString('base64');
            assert.strictEqual(options.headers['Authorization'], expected);
        });

        it('PersonalAccessTokenCredentialHandler.prepareRequest sets a Basic Authorization header from the PAT', () => {
            var handler = new PersonalAccessTokenCredentialHandler('my-token-123');
            var options: any = { headers: {} };

            handler.prepareRequest(options);

            var expected = 'Basic ' + Buffer.from('PAT:my-token-123').toString('base64');
            assert.strictEqual(options.headers['Authorization'], expected);
        });
    });
});
