const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');
const routes = require('../../routes');
const { ManySide } = require('../../models');

jest.mock('../../models', () => ({
    OneSide: {},
    ManySide: {
        findByIdAndUpdate: jest.fn()
    }
}));

const runRoute = (req, res) => new Promise((resolve, reject) => {
    res.on('end', resolve);
    routes(req, res, (err) => {
        if (err) reject(err);
        else resolve();
    });
});

describe('PATCH /api/manyside/:id endpoint unit tests (node-mocks-http + EventEmitter)', () => {
    let req;
    let res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = httpMocks.createRequest({
            method: 'PATCH',
            url: '/manyside/1'
        });
        res = httpMocks.createResponse({
            eventEmitter: EventEmitter
        });
    });

    test('Returns 200 status code and the modified object upon successful update', async () => {
        const mockUpdatedItem = {
            _id: 1,
            nev: 'updated',
            ar: 350000,
            szin: 'fekete',
            foreignId: 1
        };
        ManySide.findByIdAndUpdate.mockResolvedValue(mockUpdatedItem);

        req.body = { nev: 'updated' };

        await runRoute(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._getData()).toEqual(mockUpdatedItem);
    });

    test('ManySide.findByIdAndUpdate is called with exactly the ID extracted from the URL, the body, and options', async () => {
        const updatePayload = { ar: 299000, szin: 'fehér' };
        ManySide.findByIdAndUpdate.mockResolvedValue({
            _id: 5,
            nev: 'Samsung S25',
            ...updatePayload
        });

        req.url = '/manyside/5';
        req.body = updatePayload;

        await runRoute(req, res);

        expect(ManySide.findByIdAndUpdate).toHaveBeenCalledTimes(1);
        expect(ManySide.findByIdAndUpdate).toHaveBeenCalledWith(
            '5',
            updatePayload,
            { returnDocument: 'after', runValidators: true }
        );
    });

    test('Returns 404 status code and appropriate error message for non-existent ID', async () => {
        ManySide.findByIdAndUpdate.mockResolvedValue(null);

        req.url = '/manyside/999';
        req.body = { nev: 'NemLetezo' };

        await runRoute(req, res);

        expect(res.statusCode).toBe(404);
        expect(res._getJSONData()).toEqual({
            message: '999 azonosítóval nem létezik elem!'
        });
    });

    test('Returns 500 status code and error text upon database error', async () => {
        ManySide.findByIdAndUpdate.mockRejectedValue(new Error('Adatbázis kapcsolat megszakadt'));

        req.body = { nev: 'Teszt' };

        await runRoute(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({
            message: 'Adatbázis kapcsolat megszakadt'
        });
    });

    test('Returns 500 status code and validation error message upon Mongoose validation error', async () => {
        const validationError = new Error('A név nem lehet hosszabb 50 karakternél!');
        validationError.name = 'ValidationError';
        ManySide.findByIdAndUpdate.mockRejectedValue(validationError);

        req.body = { nev: 'A'.repeat(55) };

        await runRoute(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({
            message: 'A név nem lehet hosszabb 50 karakternél!'
        });
    });

    test('Returns 500 status code and closes the response upon invalid ID format (CastError)', async () => {
        const castError = new Error('Cast to Number failed for value "abc" (type string) at path "_id"');
        castError.name = 'CastError';
        ManySide.findByIdAndUpdate.mockRejectedValue(castError);

        req.url = '/manyside/abc';
        req.body = { ar: 150000 };

        await runRoute(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._isEndCalled()).toBe(true);
        expect(res._getJSONData().message).toContain('Cast to Number failed');
    });
});