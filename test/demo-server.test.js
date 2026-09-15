const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const demoPath = path.join(root, 'examples/server.js');

// Run the real entry point in a child process, using an isolated local port.
function launchDemo(key = 'live_pub_demo_test', port = 0) {
    const bootstrap = `
        const http = require('node:http');
        const listen = http.Server.prototype.listen;
        http.Server.prototype.listen = function (port, ...args) {
            this.once('listening', () => process.send({ port: this.address().port }));
            return listen.call(this, ${port}, '127.0.0.1', ...args);
        };
        require(${JSON.stringify(demoPath)});
    `;
    const child = spawn(process.execPath, ['-e', bootstrap], {
        cwd: root,
        env: { ...process.env, LOB_PUBLIC_KEY: key },
        stdio: ['ignore', 'pipe', 'pipe', 'ipc']
    });
    const output = { stdout: '', stderr: '' };
    child.stdout.on('data', data => { output.stdout += data; });
    child.stderr.on('data', data => { output.stderr += data; });
    const closed = once(child, 'close');
    return { child, output, closed };
}

function request(port, url, method = 'GET', headers = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({ hostname: '127.0.0.1', port, path: url, method, headers }, res => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
            res.on('error', reject);
        });
        req.on('error', reject);
        req.end();
    });
}

describe('Demo server', function () {
    this.timeout(5000);
    let port;
    const children = [];

    function launch(key, requestedPort) {
        const result = launchDemo(key, requestedPort);
        children.push(result);
        return result;
    }

    before(() => {
        const demo = launch();
        return once(demo.child, 'message').then(([message]) => { port = message.port; });
    });

    after(() => Promise.all(children.map(running => {
        if (running.child.exitCode === null && running.child.signalCode === null) running.child.kill();
        return running.closed;
    })));

    it('renders the demo with the configured public key', () => request(port, '/').then(response => {
        assert.equal(response.status, 200);
        assert.match(response.headers['content-type'], /^text\/html/);
        assert.match(response.body.toString(), /data-lob-key="live_pub_demo_test"/);
        assert.match(response.body.toString(), /id="address1"/);
    }));

    it('serves source JavaScript with an executable content type', () => request(port, '/src/main.js').then(response => {
        assert.equal(response.status, 200);
        assert.match(response.headers['content-type'], /^(?:text|application)\/javascript/);
        assert.deepEqual(response.body, fs.readFileSync(path.join(root, 'src/main.js')));
    }));

    it('supports HEAD and conditional requests for source files', () => request(port, '/src/main.js').then(original => {
        assert.ok(original.headers.etag);
        return Promise.all([
            request(port, '/src/main.js', 'HEAD'),
            request(port, '/src/main.js', 'GET', { 'If-None-Match': original.headers.etag })
        ]).then(([head, cached]) => {
            assert.equal(head.status, 200);
            assert.equal(head.body.length, 0);
            assert.equal(Number(head.headers['content-length']), original.body.length);
            assert.equal(cached.status, 304);
            assert.equal(cached.body.length, 0);
        });
    }));

    it('returns 404 for missing routes and files outside the static root', () => Promise.all(
        ['/missing', '/src/missing.js', '/src/%2e%2e/package.json'].map(url =>
            request(port, url).then(response => assert.equal(response.status, 404, url))
        )
    ));

    it('keeps the placeholder when no public key is configured', () => {
        const placeholder = launch('');
        return once(placeholder.child, 'message')
            .then(([message]) => request(message.port, '/'))
            .then(response => {
                assert.equal(response.status, 200);
                assert.match(response.body.toString(), /data-lob-key="live_pub_xxx"/);
            });
    });

    it('fails visibly when its port is occupied', () => {
        const occupied = net.createServer();
        occupied.listen(0, '127.0.0.1');
        return once(occupied, 'listening').then(() => {
            const failed = launch('live_pub_demo_test', occupied.address().port);
            return failed.closed.then(([code, signal]) => {
                assert.equal(signal, null);
                assert.notEqual(code, 0);
                assert.match(failed.output.stderr, /EADDRINUSE/);
                assert.doesNotMatch(failed.output.stdout, /Listening on port/);
            });
        }).finally(() => new Promise(resolve => occupied.close(resolve)));
    });
});
