const { promises } = require('child_process');

/** Utility to check if a path exists */
const pathExists = async (path) =>
{
    try
    {
        await promises.access(path);

        return true;
    }
    catch (e)
    {
        return false;
    }
};

exports.pathExists = pathExists;
