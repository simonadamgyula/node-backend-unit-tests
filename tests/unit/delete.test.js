const express = require('express');
const request = require('supertest');
const routes = require('./routes');
const { ManySide } = require('./models');

jest.mock('./models', () => ({
    OneSide: {},
    ManySide: {
        findByIdAndDelete: jest.fn()
    }
}));

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('DELETE /api/manyside/:id végpont unit tesztjei', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('1. Létező elem sikeres törlése esetén 200-as státuszkódot és visszaigazoló szöveget ad vissza', async () => {
        ManySide.findByIdAndDelete.mockResolvedValue({
            _id: 21,
            nev: 'Samsung S25',
            ar: 350000,
            foreignId: 1
        });

        const response = await request(app).delete('/api/manyside/21');

        expect(response.status).toBe(200);
        expect(response.text).toBe('A Samsung S25 nevű elem törölve lett.');
    });

    test('2. A ManySide.findByIdAndDelete pontosan az URL-ben kapott ID-val hívódik meg', async () => {
        ManySide.findByIdAndDelete.mockResolvedValue({
            _id: 42,
            nev: 'iPhone 16'
        });

        await request(app).delete('/api/manyside/42');

        expect(ManySide.findByIdAndDelete).toHaveBeenCalledTimes(1);
        expect(ManySide.findByIdAndDelete).toHaveBeenCalledWith('42');
    });

    test('3. Nem létező ID törlésekor (null eredmény) 500-as státuszkódot és hibaüzenetet ad vissza', async () => {
        ManySide.findByIdAndDelete.mockResolvedValue(null);

        const response = await request(app).delete('/api/manyside/999');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('message');
    });

    test('4. Adatbázis hiba esetén 500-as státuszkódot és a hibaüzenetet adja vissza JSON formátumban', async () => {
        ManySide.findByIdAndDelete.mockRejectedValue(new Error('Adatbázis hiba történt a törlés során'));

        const response = await request(app).delete('/api/manyside/21');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            message: 'Adatbázis hiba történt a törlés során'
        });
    });

    test('5. Érvénytelen ID formátum (CastError) esetén 500-as státuszkódot és a hiba okát adja vissza', async () => {
        const castError = new Error('Cast to Number failed for value "invalid-id" at path "_id"');
        castError.name = 'CastError';
        ManySide.findByIdAndDelete.mockRejectedValue(castError);

        const response = await request(app).delete('/api/manyside/invalid-id');

        expect(response.status).toBe(500);
        expect(response.body.message).toContain('Cast to Number failed');
    });

    test('6. Sikeres törlés esetén a válasz Content-Type fejléce text/html (res.send szöveges válasz miatt)', async () => {
        ManySide.findByIdAndDelete.mockResolvedValue({
            _id: 10,
            nev: 'Xiaomi 15'
        });

        const response = await request(app).delete('/api/manyside/10');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/text\/html/);
        expect(response.text).toContain('Xiaomi 15');
    });
});