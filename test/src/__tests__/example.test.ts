describe('Something', () =>
{
    it('should do something', () =>
    {
        expect(true).toBe(true);
    });

    it('should run in a browser', () =>
    {
        expect(document.createElement('canvas').getContext('2d')).not.toBeNull();
    });
});
