export function max(nodeRanks: number[]) {
    return nodeRanks.length > 0 ? nodeRanks.reduce((max, cur) => {return cur > max ? cur : max;}, nodeRanks[0]) : undefined;
}

export function min(nodeRanks: number[]) {
    return nodeRanks.length > 0 ? nodeRanks.reduce((min, cur) => {return cur < min ? cur : min;}, nodeRanks[0]) : undefined;
}