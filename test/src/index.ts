import { extensions, ExtensionType } from 'pixi.js';

import type { ExtensionMetadata, System } from 'pixi.js';

/**
 * Renderer system extension example.
 * This doesn't do anything meaningful, but it shows how to create a system extension.
 */
class MySystem implements System
{
    /** Metadata to install the extension */
    static extension: ExtensionMetadata = {
        name: 'mySystem',
        type: [ExtensionType.WebGLSystem, ExtensionType.WebGPUSystem],
    };

    /** Currention version can be inlined like this: */
    static version = '__VERSION__';

    /** Required init */
    init()
    {
        // eslint-disable-next-line no-console
        console.log('[MySystem] init');
    }

    /** Required destroy */
    destroy()
    {
        // eslint-disable-next-line no-console
        console.log('[MySystem] destroy');
    }
}

// Register the extension
extensions.add(MySystem);

export { MySystem };
