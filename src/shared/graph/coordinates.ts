// FROM : https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/common/graph/coordinates.ts

import { GRAPH_STROKE_WIDTH } from "../../ha/data/graph";

const average = (items: any[]): number =>
    items.reduce((sum, entry) => sum + parseFloat(entry.state), 0) / items.length;

const lastValue = (items: any[]): number => parseFloat(items[items.length - 1].state) || 0;

const calcPoints = (
    history: any,
    hours: number,
    width: number,
    height: number,
    points: number,
    min: number,
    max: number
): number[][] => {
    const coords = [] as number[][];
    let yRatio = (max - min) / height;
    yRatio = yRatio !== 0 ? yRatio : height;
    let xRatio = width / (points * hours - 1);
    xRatio = isFinite(xRatio) ? xRatio : width;

    const first = history.filter(Boolean)[0];
    let last = [average(first), lastValue(first)];

    const getCoords = (item: any[], i: number, offset = 0, depth = 1) => {
        if (depth > 1 && item) {
            return item.forEach((subItem, index) => getCoords(subItem, i, index, depth - 1));
        }

        const x = xRatio * (i + offset / 6);

        if (item) {
            last = [average(item), lastValue(item)];
        }
        const y = height + GRAPH_STROKE_WIDTH / 2 - ((item ? last[0] : last[1]) - min) / yRatio;
        return coords.push([x, y]);
    };

    for (let i = 0; i < history.length; i += 1) {
        getCoords(history[i], i, 0);
    }

    if (coords.length === 1) {
        coords[1] = [width, coords[0][1]];
    }

    coords.push([width, coords[coords.length - 1][1]]);
    return coords;
};

export const coordinates = (
    history: any,
    hours: number,
    width: number,
    height: number,
    points: number,
): number[][] | undefined => {
    history.forEach((item) => {
        item.state = Number(item.state);
    });
    history = history.filter((item) => !Number.isNaN(item.state));

    const now = new Date().getTime();

    const reduce = (res, item) => {
        const age = now - new Date(item.last_changed).getTime();
        const interval = (age/ (1000 * 3600) * points) - hours * points
        const key = interval < 0 ? Math.floor(Math.abs(interval)) : 0;
        
        if (!res[key]) {
            res[key] = [];
        }
        res[key].push(item);
        return res;
    };

    history = history.reduce((res, item) => reduce(res, item), []);
    history.length = Math.ceil(hours * points)

    if (!history.length) {
        return undefined;
    }

    let min = Number.MAX_VALUE
    let max = Number.MIN_VALUE
    history.forEach((item) => {
        const val = average(item)
        min = val < min ? val : min
        max = val > max ? val : max
    })
    
    return calcPoints(history, hours, width, height, points, min, max);
};
