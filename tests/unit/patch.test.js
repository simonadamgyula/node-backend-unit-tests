const express = require('express');
const request = require('supertest');
const routes = require('./routes');
const { ManySide } = require('./models');

jest.mock('./models', () => ({
    OneSide: {},
    ManySide: {
        findByIdAndUpdate: jest.fn()
    }
}));

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('PATCH /api/manyside/:id végpont unit tesztjei', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('1. Sikeres frissítés esetén 200-as státuszkódot és a módosított objektumot adja vissza', async () => {
        const mockUpdatedItem = {
            _id: 1,
            nev: 'updated',
            ar: 350000,
            szin: 'fekete',
            foreignId: 1
        };
        ManySide.findByIdAndUpdate.mockResolvedValue(mockUpdatedItem);

        const response = await request(app)
            .patch('/api/manyside/1')
            .send({ nev: 'updated' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUpdatedItem);
    });

    test('2. A ManySide.findByIdAndUpdate pontosan a kapott ID-val, body-val és opciókkal hívódik meg', async () => {
        const updatePayload = { ar: 299000, szin: 'fehér' };
        ManySide.findByIdAndUpdate.mockResolvedValue({
            _id: 5,
            nev: 'Samsung S25',
            ...updatePayload
        });

        await request(app)
            .patch('/api/manyside/5')
            .send(updatePayload);

        expect(ManySide.findByIdAndUpdate).toHaveBeenCalledTimes(1);
        expect(ManySide.findByIdAndUpdate).toHaveBeenCalledWith(
            '5',
            updatePayload,
            { returnDocument: 'after', runValidators: true }
        );
    });

    test('3. Nem létező ID esetén 404-es státuszkódot és megfelelő hibaüzenetet ad vissza', async () => {
        ManySide.findByIdAndUpdate.mockResolvedValue(null);

        const response = await request(app)
            .patch('/api/manyside/999')
            .send({ nev: 'NemLetezo' });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            message: '999 azonosítóval nem létezik elem!'
        });
    });

    test('4. Adatbázis hiba esetén 500-as státuszkódot és a hiba szövegét adja vissza', async () => {
        ManySide.findByIdAndUpdate.mockRejectedValue(new Error('Adatbázis kapcsolat megszakadt'));

        const response = await request(app)
            .patch('/api/manyside/1')
            .send({ nev: 'Teszt' });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            message: 'Adatbázis kapcsolat megszakadt'
        });
    });

    test('5. Mongoose validációs hiba esetén 500-as státuszkódot és a validációs hibaüzenetet adja vissza', async () => {
        const validationError = new Error('A név nem lehet hosszabb 50 karakternél!');
        validationError.name = 'ValidationError';
        ManySide.findByIdAndUpdate.mockRejectedValue(validationError);

        const response = await request(app)
            .patch('/api/manyside/1')
            .send({ nev: 'A'.repeat(55) });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            message: 'A név nem lehet hosszabb 50 karakternél!'
        });
    });

    test('6. Érvénytelen formátumú ID (CastError) esetén 500-as státuszkódot és hibaüzenetet ad vissza', async () => {
        const castError = new Error('Cast to Number failed for value "abc" (type string) at path "_id"');
        castError.name = 'CastError';
        ManySide.findByIdAndUpdate.mockRejectedValue(castError);

        const response = await request(app)
            .patch('/api/manyside/abc')
            .send({ ar: 150000 });

        expect(response.status).toBe(500);
        expect(response.body.message).toContain('Cast to Number failed');
    });
});