const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');

jest.mock('../../models', () => ({
    OneSide: {},
    ManySide: {
        find: jest.fn(),
        findById: jest.fn()
    }
}));

const { ManySide } = require('../../models');
const router = require('../../routes');
const phones = require('../mock-data/mock-many-phones.json');

const getManySideHandler = router.stack
    .find((layer) => layer.route?.path === '/manyside')
    .route.stack[0].handle;
const getManySideByIdHandler = router.stack
    .find((layer) => layer.route?.path === '/manyside/:id')
    .route.stack[0].handle;

function createResponse() {
    return httpMocks.createResponse({
        eventEmitter: EventEmitter
    });
}

describe('GET /manyside', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('registers the GET /manyside endpoint', () => {
        const endpointExists = router.stack.some((layer) =>
            layer.route?.path === '/manyside' && layer.route.methods.get
        );

        expect(endpointExists).toBe(true);
    });

    it('gets every phone and returns their populated data', async () => {
        const populate = jest.fn().mockResolvedValue(phones);
        ManySide.find.mockReturnValue({ populate });
        const res = createResponse();
        const req = httpMocks.createRequest({ method: 'GET', url: '/manyside' });

        await getManySideHandler(req, res);

        expect(ManySide.find).toHaveBeenCalledWith();
        expect(populate).toHaveBeenCalledWith('foreignId', '-_id');
        expect(res._getJSONData()).toEqual(phones);
        expect(res.statusCode).toBe(200);
    });

    it('returns an empty array when no phones exist', async () => {
        const populate = jest.fn().mockResolvedValue([]);
        ManySide.find.mockReturnValue({ populate });
        const res = createResponse();
        const req = httpMocks.createRequest({ method: 'GET', url: '/manyside' });

        await getManySideHandler(req, res);

        expect(res._getJSONData()).toEqual([]);
        expect(res.statusCode).toBe(200);
    });

    it('does not pass client query parameters into the database query', async () => {
        const populate = jest.fn().mockResolvedValue(phones);
        ManySide.find.mockReturnValue({ populate });
        const req = httpMocks.createRequest({
            method: 'GET',
            url: '/manyside',
            query: { $where: 'malicious query', foreignId: 'untrusted' }
        });
        const res = createResponse();

        await getManySideHandler(req, res);

        expect(ManySide.find).toHaveBeenCalledWith();
        expect(res._getJSONData()).toEqual(phones);
    });

    it('returns 500 when finding phones fails', async () => {
        ManySide.find.mockImplementation(() => {
            throw new Error('Database unavailable');
        });
        const res = createResponse();
        const req = httpMocks.createRequest({ method: 'GET', url: '/manyside' });

        await getManySideHandler(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({ message: 'Database unavailable' });
    });

    it('returns 500 when populating phones fails', async () => {
        const populate = jest.fn().mockRejectedValue(new Error('Population failed'));
        ManySide.find.mockReturnValue({ populate });
        const res = createResponse();
        const req = httpMocks.createRequest({ method: 'GET', url: '/manyside' });

        await getManySideHandler(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({ message: 'Population failed' });
    });
});

describe('GET /manyside/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('registers the GET /manyside/:id endpoint', () => {
        const endpointExists = router.stack.some((layer) =>
            layer.route?.path === '/manyside/:id' && layer.route.methods.get
        );

        expect(endpointExists).toBe(true);
    });

    it('gets a phone by id and returns its populated data', async () => {
        const phone = phones[0];
        const populate = jest.fn().mockResolvedValue(phone);
        ManySide.findById.mockReturnValue({ populate });
        const req = httpMocks.createRequest({
            method: 'GET',
            url: `/manyside/${phone._id}`,
            params: { id: String(phone._id) }
        });
        const res = createResponse();

        await getManySideByIdHandler(req, res);

        expect(ManySide.findById).toHaveBeenCalledWith(String(phone._id));
        expect(populate).toHaveBeenCalledWith('foreignId', '-_id');
        expect(res._getJSONData()).toEqual(phone);
        expect(res.statusCode).toBe(200);
    });

    it('returns 404 when the phone does not exist', async () => {
        const populate = jest.fn().mockResolvedValue(null);
        ManySide.findById.mockReturnValue({ populate });
        const req = httpMocks.createRequest({
            method: 'GET',
            url: '/manyside/missing-id',
            params: { id: 'missing-id' }
        });
        const res = createResponse();

        await getManySideByIdHandler(req, res);

        expect(ManySide.findById).toHaveBeenCalledWith('missing-id');
        expect(res.statusCode).toBe(404);
        expect(res._getJSONData()).toEqual({
            message: 'Nincs ilyen azonosítóval rendelkező elem.'
        });
    });

    it('returns 404 when the lookup has no result', async () => {
        const populate = jest.fn().mockResolvedValue(undefined);
        ManySide.findById.mockReturnValue({ populate });
        const req = httpMocks.createRequest({
            method: 'GET',
            url: '/manyside/missing-id',
            params: { id: 'missing-id' }
        });
        const res = createResponse();

        await getManySideByIdHandler(req, res);

        expect(res.statusCode).toBe(404);
        expect(res._getJSONData()).toEqual({
            message: 'Nincs ilyen azonosítóval rendelkező elem.'
        });
    });

    it('returns 500 when finding a phone by id fails', async () => {
        ManySide.findById.mockImplementation(() => {
            throw new Error('Database unavailable');
        });
        const req = httpMocks.createRequest({
            method: 'GET',
            url: '/manyside/7',
            params: { id: '7' }
        });
        const res = createResponse();

        await getManySideByIdHandler(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({ message: 'Database unavailable' });
    });

    it('returns 500 when populating a phone fails', async () => {
        const populate = jest.fn().mockRejectedValue(new Error('Population failed'));
        ManySide.findById.mockReturnValue({ populate });
        const req = httpMocks.createRequest({
            method: 'GET',
            url: '/manyside/7',
            params: { id: '7' }
        });
        const res = createResponse();

        await getManySideByIdHandler(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({ message: 'Population failed' });
    });
});
