export function color(strings: TemplateStringsArray, ...args: (ColorMarker | string | number)[]) {
    if (!args.length) {
        return strings.reduce((prev, cur) => prev + cur);
    }

    let res = '';
    strings.forEach((str, i) => {
        const arg = args[i];

        if (colorMarkers.includes(arg as ColorMarker)) {
            res += str + getMarkerByName(arg as ColorMarker);
            return;
        }
        res += str + (arg ?? '');
    })
    return res;
}

function getMarkerByName(marker: ColorMarker) {
    switch (marker) {
        case "black":
            return '\x1b[30m';
        case "red":
            return '\x1b[31m';
        case "green":
            return '\x1b[32m';
        case "orange":
            return '\x1b[33m';
        case "blue":
            return '\x1b[34m';
        case "pink":
            return '\x1b[35m';
        case "lightblue":
            return '\x1b[36m';
        case "reset":
            return '\x1b[0m'
        default:
            return "";
    }
}

const colorMarkers = [
    'black',
    'red',
    'green',
    'orange',
    'blue',
    'lightblue',
    'pink',
    'reset',
] as const;

type ColorMarker = (typeof colorMarkers)[number]
