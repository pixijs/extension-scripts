import childProcess from 'node:child_process';

/** Utility to check if a path exists */
export const pathExists = async (path) =>
{
    try
    {
        await childProcess.promises.access(path);

        return true;
    }
    catch (e)
    {
        return false;
    }
};
