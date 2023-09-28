const NodeCache = require('node-cache');
const apiCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });


describe('Cache Management', () => {
    it('should cache and retrieve data', () => {
        const city = 'exampleCity';
        const data = { temperature: 25, description: 'Sunny' };

        // Store data in cache
        apiCache.set(city, data, 300);

        // Retrieve data from cache
        const cachedData = apiCache.get(city);

        expect(cachedData).toEqual(data);
    });

    it('should handle cache expiration', () => {
        const city = 'exampleCity';
        const data = { temperature: 25, description: 'Sunny' };

        // Store data in cache with a short TTL
        apiCache.set(city, data, 1);

        return new Promise((resolve) => {
            setTimeout(() => {
                // Data should have expired
                const cachedData = apiCache.get(city);
                expect(cachedData).toBeUndefined();
                resolve();
            }, 1500);
        });
    });
});
