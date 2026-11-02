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

describe('DELETE /api/manyside/:id végpont unit tesztjei (node-mocks-http + EventEmitter)', () => {
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

    test('1. Létező elem sikeres törlése esetén 200-as státuszkódot és visszaigazoló szöveget ad vissza', async () => {
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

    test('2. A ManySide.findByIdAndDelete pontosan az URL-ből kinyert ID-val hívódik meg', async () => {
        ManySide.findByIdAndDelete.mockResolvedValue({
            _id: 42,
            nev: 'iPhone 16'
        });

        req.url = '/manyside/42';

        await runRoute(req, res);

        expect(ManySide.findByIdAndDelete).toHaveBeenCalledTimes(1);
        expect(ManySide.findByIdAndDelete).toHaveBeenCalledWith('42');
    });

    test('3. Nem létező ID törlésekor (null eredmény) 500-as státuszkódot és hibaüzenetet ad vissza', async () => {
        ManySide.findByIdAndDelete.mockResolvedValue(null);

        req.url = '/manyside/999';

        await runRoute(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toHaveProperty('message');
    });

    test('4. Adatbázis hiba esetén 500-as státuszkódot és a hibaüzenetet adja vissza JSON formátumban', async () => {
        ManySide.findByIdAndDelete.mockRejectedValue(new Error('Adatbázis hiba történt a törlés során'));

        await runRoute(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({
            message: 'Adatbázis hiba történt a törlés során'
        });
    });

    test('5. Érvénytelen ID formátum (CastError) esetén 500-as státuszkódot és a hiba okát adja vissza', async () => {
        const castError = new Error('Cast to Number failed for value "invalid-id" at path "_id"');
        castError.name = 'CastError';
        ManySide.findByIdAndDelete.mockRejectedValue(castError);

        req.url = '/manyside/invalid-id';

        await runRoute(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData().message).toContain('Cast to Number failed');
    });

    test('6. Sikeres törlés esetén megfelelően lezárja a HTTP választ (_isEndCalled: true)', async () => {
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
