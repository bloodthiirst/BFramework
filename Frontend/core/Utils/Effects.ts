export class Effects
{

    public static async Resize(elem: HTMLElement, from: DOMRectInit, to: DOMRectInit, duration: number): Promise<void>
    {
        let promises = [];
        promises.push(Effects.Lerp(from.x!, to.x!, duration, undefined, (n) => elem.style.x = `${n}px`), undefined);
        promises.push(Effects.Lerp(from.y!, to.y!, duration, undefined, (n) => elem.style.y = `${n}px`), undefined);
        promises.push(Effects.Lerp(from.width!, to.width!, duration, undefined, (n) => elem.style.width = `${n}px`), undefined);
        promises.push(Effects.Lerp(from.height!, to.height!, duration, undefined, (n) => elem.style.height = `${n}px`), undefined);


        return new Promise<void>(async f =>
        {
            await Promise.all(promises);
            f();
        });
    }

    public static async Fade(element: HTMLElement, from: number, to: number, duration: number): Promise<void>
    {
        let onStart = (n: Number) =>
        {
            element.style.opacity = from.toString();
            element.style.pointerEvents = 'none';
        };

        let onTick = (n: Number) =>
        {
            element.style.opacity = n.toString();
        };

        let onEnd = (n: number) =>
        {
            if (to == 1)
            {
                element.style.removeProperty('opacity');
            }
            element.style.removeProperty('pointer-events');
        };

        return this.Lerp(from, to, duration, onStart, onTick, onEnd);
    }

    public static async Lerp(from: number, to: number, duration: number, onStart?: (n: number) => void, onTick?: (n: number) => void, onEnd?: (n: number) => void): Promise<void>
    {
        const frameRate: number = 1000 / 60;
        const sign = Math.sign(to - from);
        const min = Math.min(to, from);
        const max = Math.max(to, from);
        const amp = max - min;

        var curr = from;  // initial value
        var t = 0;

        onStart?.(curr);
        onTick?.(curr);

        var timer = setInterval(function ()
        {
            if (Math.abs(curr - to) <= 0.01)
            {
                onTick?.(to);
                onEnd?.(curr);
                clearInterval(timer);
                return;
            }


            t += (frameRate / duration);
            curr = from + (t * amp * sign);
            curr = Math.min(curr, max);
            curr = Math.max(curr, min);

            onTick?.(curr);

        }, frameRate);

        return new Promise(f => setTimeout(f, duration));
    }

    static Delay(ms: number): Promise<void>
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}