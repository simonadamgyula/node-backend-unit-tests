jest.mock('../../models', () => ({
    OneSide: {},
    ManySide: {
        create: jest.fn()
    }
}));

const { ManySide } = require('../../models');
const router = require('../../routes');
const phone = require('../mock-data/mock-new-phone.json');

const createHandler = router.stack
    .find((layer) => layer.route?.path === '/new')
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

describe('POST /new', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('registers the POST /new endpoint', () => {
        const endpointExists = router.stack.some((layer) =>
            layer.route?.path === '/new' && layer.route.methods.post
        );

        expect(endpointExists).toBe(true);
    });

    it('creates a phone and returns its id with status 201', async () => {
        const req = { body: phone };
        const res = createResponse();
        ManySide.create.mockResolvedValue(phone);

        await createHandler(req, res);

        expect(ManySide.create).toHaveBeenCalledWith(phone);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ _id: phone._id });
    });

    it('returns 400 for a validation error', async () => {
        const req = { body: {} };
        const res = createResponse();
        ManySide.create.mockRejectedValue({ name: 'ValidationError' });

        await createHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Hiányos vagy érvénytelen adatok' });
    });

    it('returns 409 when a phone already exists', async () => {
        const req = { body: phone };
        const res = createResponse();
        ManySide.create.mockRejectedValue({ code: 11000 });

        await createHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ message: 'Már létezik ilyen telefon' });
    });

    it('returns 500 and logs unexpected errors', async () => {
        const error = new Error('Database unavailable');
        const req = { body: {} };
        const res = createResponse();
        ManySide.create.mockRejectedValue(error);

        await createHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Szerver hiba' });
    });

    it('logs unexpected errors before returning a 500 response', async () => {
        const error = new Error('Database unavailable');
        const req = { body: {} };
        const res = createResponse();
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        ManySide.create.mockRejectedValue(error);

        await createHandler(req, res);

        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Szerver hiba' });

        consoleErrorSpy.mockRestore();
    });
});