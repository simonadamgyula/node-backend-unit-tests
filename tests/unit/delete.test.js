const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');
const routes = require('../../routes');
const { ManySide } = require('../../models');

jest.mock('../../models', () => ({
    OneSide: {},
    ManySide: {
        findByIdAndDelete: jest.fn()
    }
}));

const runRoute = (req, res) => new Promise((resolve, reject) => {
    res.on('end', resolve);
    routes(req, res, (err) => {
        if (err) reject(err);
        else resolve();
    });
});

describe('DELETE /api/manyside/:id endpoint unit tests (node-mocks-http + EventEmitter)', () => {
    let req;
    let res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = httpMocks.createRequest({
            method: 'DELETE',
            url: '/manyside/21'
        });
        res = httpMocks.createResponse({
            eventEmitter: EventEmitter
        });
    });

    test('Returns 200 status code and confirmation text upon successful deletion of an existing item', async () => {
        ManySide.findByIdAndDelete.mockResolvedValue({
            _id: 21,
            nev: 'Samsung S25',
            ar: 350000,
            foreignId: 1
        });

        await runRoute(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._getData()).toBe('A Samsung S25 nevű elem törölve lett.');
    });

    test('ManySide.findByIdAndDelete is called with exactly the ID extracted from the URL', async () => {
        ManySide.findByIdAndDelete.mockResolvedValue({
            _id: 42,
            nev: 'iPhone 16'
        });

        req.url = '/manyside/42';

        await runRoute(req, res);

        expect(ManySide.findByIdAndDelete).toHaveBeenCalledTimes(1);
        expect(ManySide.findByIdAndDelete).toHaveBeenCalledWith('42');
    });

    test('Returns 500 status code and error message when deleting a non-existent ID (null result)', async () => {
        ManySide.findByIdAndDelete.mockResolvedValue(null);

        req.url = '/manyside/999';

        await runRoute(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toHaveProperty('message');
    });

    test('Returns 500 status code and error message in JSON format upon database error', async () => {
        ManySide.findByIdAndDelete.mockRejectedValue(new Error('Adatbázis hiba történt a törlés során'));

        await runRoute(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({
            message: 'Adatbázis hiba történt a törlés során'
        });
    });

    test('Returns 500 status code and the cause of the error upon invalid ID format (CastError)', async () => {
        const castError = new Error('Cast to Number failed for value "invalid-id" at path "_id"');
        castError.name = 'CastError';
        ManySide.findByIdAndDelete.mockRejectedValue(castError);

        req.url = '/manyside/invalid-id';

        await runRoute(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData().message).toContain('Cast to Number failed');
    });

    test('Properly closes the HTTP response upon successful deletion (_isEndCalled: true)', async () => {
        ManySide.findByIdAndDelete.mockResolvedValue({
            _id: 10,
            nev: 'Xiaomi 15'
        });

        req.url = '/manyside/10';

        await runRoute(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._isEndCalled()).toBe(true);
        expect(res._getData()).toContain('Xiaomi 15');
    });
});