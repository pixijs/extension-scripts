import fs from 'node:fs';

/** Utility to check if a path exists */
export const pathExists = async (path) =>
{
    try
    {
        await fs.promises.access(path);

        return true;
    }
    catch (e)
    {
        return false;
    }
};
