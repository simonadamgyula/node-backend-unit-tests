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
    const res = {
        status: jest.fn(),
        json: jest.fn()
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res;
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

        await getManySideHandler({}, res);

        expect(ManySide.find).toHaveBeenCalledWith();
        expect(populate).toHaveBeenCalledWith('foreignId', '-_id');
        expect(res.json).toHaveBeenCalledWith(phones);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns an empty array when no phones exist', async () => {
        const populate = jest.fn().mockResolvedValue([]);
        ManySide.find.mockReturnValue({ populate });
        const res = createResponse();

        await getManySideHandler({}, res);

        expect(res.json).toHaveBeenCalledWith([]);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('does not pass client query parameters into the database query', async () => {
        const populate = jest.fn().mockResolvedValue(phones);
        ManySide.find.mockReturnValue({ populate });
        const req = { query: { $where: 'malicious query', foreignId: 'untrusted' } };
        const res = createResponse();

        await getManySideHandler(req, res);

        expect(ManySide.find).toHaveBeenCalledWith();
        expect(res.json).toHaveBeenCalledWith(phones);
    });

    it('returns 500 when finding phones fails', async () => {
        ManySide.find.mockImplementation(() => {
            throw new Error('Database unavailable');
        });
        const res = createResponse();

        await getManySideHandler({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Database unavailable' });
    });

    it('returns 500 when populating phones fails', async () => {
        const populate = jest.fn().mockRejectedValue(new Error('Population failed'));
        ManySide.find.mockReturnValue({ populate });
        const res = createResponse();

        await getManySideHandler({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Population failed' });
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
        const req = { params: { id: String(phone._id) } };
        const res = createResponse();

        await getManySideByIdHandler(req, res);

        expect(ManySide.findById).toHaveBeenCalledWith(String(phone._id));
        expect(populate).toHaveBeenCalledWith('foreignId', '-_id');
        expect(res.json).toHaveBeenCalledWith(phone);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 404 when the phone does not exist', async () => {
        const populate = jest.fn().mockResolvedValue(null);
        ManySide.findById.mockReturnValue({ populate });
        const req = { params: { id: 'missing-id' } };
        const res = createResponse();

        await getManySideByIdHandler(req, res);

        expect(ManySide.findById).toHaveBeenCalledWith('missing-id');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Nincs ilyen azonosítóval rendelkező elem.'
        });
    });

    it('returns 404 when the lookup has no result', async () => {
        const populate = jest.fn().mockResolvedValue(undefined);
        ManySide.findById.mockReturnValue({ populate });
        const req = { params: { id: 'missing-id' } };
        const res = createResponse();

        await getManySideByIdHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Nincs ilyen azonosítóval rendelkező elem.'
        });
    });

    it('returns 500 when finding a phone by id fails', async () => {
        ManySide.findById.mockImplementation(() => {
            throw new Error('Database unavailable');
        });
        const req = { params: { id: '7' } };
        const res = createResponse();

        await getManySideByIdHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Database unavailable' });
    });

    it('returns 500 when populating a phone fails', async () => {
        const populate = jest.fn().mockRejectedValue(new Error('Population failed'));
        ManySide.findById.mockReturnValue({ populate });
        const req = { params: { id: '7' } };
        const res = createResponse();

        await getManySideByIdHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Population failed' });
    });
});
