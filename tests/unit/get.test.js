jest.mock('../../models', () => ({
    OneSide: {},
    ManySide: {
        create: jest.fn(),
        find: jest.fn()
    }
}));

const { ManySide } = require('../../models');
const router = require('../../routes');
const phones = require('../mock-data/mock-many-phones.json');

const getHandler = router.stack
    .find((layer) => layer.route?.path === '/manyside')
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

describe("GET /manyside", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('registers the GET /manyside endpoint', () => {
        const endpointExists = router.stack.some((layer) => layer.route?.path === "/manyside" && layer.route.methods.get);

        expect(endpointExists).toBe(true);
    });

    it('gets every phone and returns their data with status 200', async () => {
        const populate = jest.fn().mockResolvedValue(phones);
        ManySide.find.mockReturnValue({ populate });
        const res = createResponse();

        await getHandler({}, res);

        expect(ManySide.find).toHaveBeenCalledWith();
        expect(populate).toHaveBeenCalledWith('foreignId', '-_id');
        expect(res.json).toHaveBeenCalledWith(phones);
        expect(res.status).not.toHaveBeenCalled();
    });
});
