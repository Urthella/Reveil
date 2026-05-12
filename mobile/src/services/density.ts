import { useEffect, useState } from 'react';
import { prefs, Density } from './preferences';

let current: Density = 'comfortable';
const listeners = new Set<(d: Density) => void>();

export function getDensity(): Density {
    return current;
}

export async function initDensity(): Promise<void> {
    current = await prefs.getDensity();
    listeners.forEach((cb) => cb(current));
}

export async function setDensity(density: Density): Promise<void> {
    current = density;
    await prefs.setDensity(density);
    listeners.forEach((cb) => cb(density));
}

export function useDensity(): Density {
    const [d, setD] = useState<Density>(current);
    useEffect(() => {
        const cb = (next: Density) => setD(next);
        listeners.add(cb);
        return () => { listeners.delete(cb); };
    }, []);
    return d;
}

/** Compact density compresses spacing by ~33% to fit more content per screen. */
export function densityScale(d: Density = current): number {
    return d === 'compact' ? 0.66 : 1;
}
