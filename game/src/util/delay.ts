

export function delay(millis: number) {
    if (typeof millis !== 'number') throw new Error(`Invalid type for paramter 'millis': ${millis}`);
    return new Promise(resolve => {
        setTimeout(resolve, millis);
    });
}
