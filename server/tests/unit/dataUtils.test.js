const fs = require('fs');

// Mock the fs module before requiring dataUtils
jest.mock('fs');

const { readData, writeData, generateId } = require('../../src/utils/dataUtils');

describe('dataUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── readData ────────────────────────────────────────────────────────────

    describe('readData', () => {
        it('should return parsed JSON array from file', () => {
            const mockData = [{ id: 1, name: 'Test' }];
            fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

            const result = readData('products.json');

            expect(result).toEqual(mockData);
            expect(fs.readFileSync).toHaveBeenCalledTimes(1);
        });

        it('should return parsed JSON object from file', () => {
            const mockData = { key: 'value' };
            fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

            const result = readData('config.json');

            expect(result).toEqual(mockData);
        });

        it('should return empty array when file read throws an error', () => {
            fs.readFileSync.mockImplementation(() => {
                throw new Error('File not found');
            });

            const result = readData('missing.json');

            expect(result).toEqual([]);
        });

        it('should return empty array when JSON is invalid', () => {
            fs.readFileSync.mockReturnValue('{ invalid json }');

            const result = readData('bad.json');

            expect(result).toEqual([]);
        });

        it('should build path from data directory', () => {
            fs.readFileSync.mockReturnValue('[]');
            readData('users.json');

            const callArg = fs.readFileSync.mock.calls[0][0];
            expect(callArg).toContain('users.json');
            expect(callArg).toContain('data');
        });
    });

    // ─── writeData ───────────────────────────────────────────────────────────

    describe('writeData', () => {
        it('should write JSON stringified data to file and return true', () => {
            fs.writeFileSync.mockImplementation(() => {});

            const data = [{ id: 1, name: 'Test' }];
            const result = writeData('products.json', data);

            expect(result).toBe(true);
            expect(fs.writeFileSync).toHaveBeenCalledTimes(1);

            const [, writtenContent] = fs.writeFileSync.mock.calls[0];
            expect(JSON.parse(writtenContent)).toEqual(data);
        });

        it('should write formatted JSON (pretty-printed)', () => {
            fs.writeFileSync.mockImplementation(() => {});

            writeData('test.json', [{ id: 1 }]);

            const [, content] = fs.writeFileSync.mock.calls[0];
            // Pretty-printed JSON contains newlines
            expect(content).toContain('\n');
        });

        it('should return false when write throws an error', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            const result = writeData('readonly.json', []);

            expect(result).toBe(false);
        });
    });

    // ─── generateId ──────────────────────────────────────────────────────────

    describe('generateId', () => {
        it('should return 1 for an empty array', () => {
            expect(generateId([])).toBe(1);
        });

        it('should return 1 when collection is null or undefined', () => {
            expect(generateId(null)).toBe(1);
            expect(generateId(undefined)).toBe(1);
        });

        it('should return max id + 1 for a collection', () => {
            const collection = [{ id: 1 }, { id: 5 }, { id: 3 }];
            expect(generateId(collection)).toBe(6);
        });

        it('should handle items with no id property', () => {
            const collection = [{ name: 'no-id' }];
            // max of [0] = 0, so result is 1
            expect(generateId(collection)).toBe(1);
        });

        it('should return sequential id when collection has one item', () => {
            expect(generateId([{ id: 10 }])).toBe(11);
        });
    });
});
